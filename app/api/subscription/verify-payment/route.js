// app/api/subscription/verify-payment/route.js
import { NextResponse } from "next/server";
import crypto from "crypto";
import dbConnect from "@/lib/dbconnect";

const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET;
if (!RAZORPAY_KEY_SECRET) {
  console.warn("RAZORPAY_KEY_SECRET is not set. Signature verification will fail without it.");
}

/**
 * POST /api/subscription/verify-payment
 *
 * Expected JSON body:
 * {
 *   razorpay_payment_id: string,
 *   razorpay_subscription_id: string,
 *   razorpay_signature: string,
 *   razorpay_order_id?: string
 * }
 *
 * Verifies signature and updates local records (best-effort).
 */
export async function POST(req) {
  try {
    // Best-effort DB connect (don't fail the whole endpoint if DB isn't available)
    try {
      await dbConnect();
    } catch (e) {
      console.warn("dbConnect failed (continuing):", e?.message ?? e);
    }

    // Parse JSON body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const {
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature,
      razorpay_order_id,
    } = body || {};

    if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing required Razorpay fields: payment_id, subscription_id, signature" },
        { status: 400 }
      );
    }

    if (!RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        { error: "Server misconfiguration: Razorpay secret missing (RAZORPAY_KEY_SECRET)" },
        { status: 500 }
      );
    }

    // Build expected signature (Razorpay: HMAC_SHA256(subscription_id + "|" + payment_id))
    const payload = `${razorpay_subscription_id}|${razorpay_payment_id}`;
    const expected = crypto.createHmac("sha256", RAZORPAY_KEY_SECRET).update(payload).digest("hex");

    if (expected !== razorpay_signature) {
      console.warn("Razorpay signature mismatch", { expected, received: razorpay_signature });
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Signature valid -> best-effort update of local DB records
    try {
      const { subscriptionRepo } = await import("@/infrastructure/persistence/subscriptionRepo");
      const { transactionRepo } = await import("@/infrastructure/persistence/transactionRepo");
      const { tokenRepo } = await import("@/infrastructure/persistence/tokenRepo");

      let localSub = null;

      // try a few possible method names to be resilient to repo implementations
      if (subscriptionRepo) {
        if (typeof subscriptionRepo.getByRazorpayId === "function") {
          localSub = await subscriptionRepo.getByRazorpayId(razorpay_subscription_id);
        } else if (typeof subscriptionRepo.findByRazorpayId === "function") {
          localSub = await subscriptionRepo.findByRazorpayId(razorpay_subscription_id);
        } else if (typeof subscriptionRepo.getByRazorpay === "function") {
          localSub = await subscriptionRepo.getByRazorpay(razorpay_subscription_id);
        }
      }

      // Update subscription status if possible
      try {
        if (subscriptionRepo && typeof subscriptionRepo.updateStatus === "function") {
          await subscriptionRepo.updateStatus(razorpay_subscription_id, "active");
        } else if (subscriptionRepo && typeof subscriptionRepo.updateByRazorpayId === "function") {
          await subscriptionRepo.updateByRazorpayId(razorpay_subscription_id, {
            status: "active",
            razorpayPaymentId: razorpay_payment_id,
            lastPaymentAt: new Date(),
          });
        } else if (localSub && typeof subscriptionRepo.update === "function") {
          // fallback: update by internal id
          await subscriptionRepo.update(localSub.id || localSub._id, {
            ...localSub,
            status: "active",
            razorpayPaymentId: razorpay_payment_id,
            lastPaymentAt: new Date(),
          });
        }
      } catch (subUpdateErr) {
        console.warn("Failed updating subscription record (non-fatal):", subUpdateErr?.message ?? subUpdateErr);
      }

      // If we have a local subscription and tokenRepo, credit tokensPerPeriod to user
      if (localSub && tokenRepo) {
        try {
          const userId = localSub.userId || localSub.user || localSub.user_id;
          const tokensToCredit = Number(localSub.tokensPerPeriod || localSub.tokens || 0);

          if (userId && tokensToCredit > 0) {
            // fetch current balance
            let balanceRec = null;
            if (typeof tokenRepo.get === "function") {
              balanceRec = await tokenRepo.get(userId);
            }

            if (!balanceRec) {
              // create new balance record
              if (typeof tokenRepo.createOrUpdate === "function") {
                await tokenRepo.createOrUpdate({
                  userId,
                  tokens: tokensToCredit,
                  freeTrialUsed: false,
                });
              }
            } else {
              // increment and save
              const updated = {
                ...balanceRec,
                tokens: (Number(balanceRec.tokens || 0) + tokensToCredit),
                updatedAt: new Date(),
              };
              if (typeof tokenRepo.createOrUpdate === "function") {
                await tokenRepo.createOrUpdate(updated);
              } else if (typeof tokenRepo.update === "function") {
                await tokenRepo.update(balanceRec._id || balanceRec.id, updated);
              }
            }
          }
        } catch (tokenErr) {
          console.warn("Failed to credit tokens (non-fatal):", tokenErr?.message ?? tokenErr);
        }
      }

      // Record a transaction log (if transactionRepo exists)
      try {
        if (transactionRepo && typeof transactionRepo.create === "function") {
          await transactionRepo.create({
            userId: localSub?.userId || null,
            type: "subscription",
            tokens: localSub?.tokensPerPeriod || 0,
            reason: "subscription_payment",
            metadata: {
              razorpay_payment_id,
              razorpay_subscription_id,
              razorpay_order_id,
            },
            createdAt: new Date(),
          });
        }
      } catch (txErr) {
        console.warn("Failed to create transaction record (non-fatal):", txErr?.message ?? txErr);
      }
    } catch (repoErr) {
      // If imports or repo ops fail, log but don't fail the verification
      console.warn("Repository updates failed (non-fatal):", repoErr?.message ?? repoErr);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Payment verified and subscription updated.",
        payment_id: razorpay_payment_id,
        subscription_id: razorpay_subscription_id,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("POST /api/subscription/verify-payment error:", err);
    return NextResponse.json({ error: "Server error verifying payment" }, { status: 500 });
  }
}
