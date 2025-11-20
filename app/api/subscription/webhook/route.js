// app/api/subscription/webhook/route.js
import { NextResponse } from "next/server";
import crypto from "crypto";
import dbConnect from "@/lib/dbconnect";

const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;
if (!RAZORPAY_WEBHOOK_SECRET) {
  console.warn("RAZORPAY_WEBHOOK_SECRET not set — webhook verification will fail without it.");
}

/**
 * Razorpay webhook handler
 * - Verifies HMAC-SHA256 of raw body using RAZORPAY_WEBHOOK_SECRET
 * - Processes a subset of events (best-effort, non-fatal)
 *
 * NOTE: keep processing fast. Heavy work should be pushed to a job queue.
 */
export async function POST(req) {
  // Read raw body (string) to compute signature
  let rawBody;
  try {
    rawBody = await req.text();
  } catch (e) {
    console.error("webhook: failed to read raw body:", e);
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Get signature from header (case-insensitive)
  const signature =
    req.headers.get("x-razorpay-signature") || req.headers.get("X-Razorpay-Signature") || "";

  if (!signature) {
    console.warn("webhook: missing x-razorpay-signature header");
    return NextResponse.json({ error: "Missing signature header" }, { status: 400 });
  }

  if (!RAZORPAY_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Server misconfiguration: webhook secret not set" }, { status: 500 });
  }

  // Verify signature (accept hex or base64 encoding in header)
  try {
    const expectedHex = crypto.createHmac("sha256", RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest("hex");
    const expectedBase64 = Buffer.from(expectedHex, "hex").toString("base64");

    const matches = signature === expectedHex || signature === expectedBase64;
    if (!matches) {
      console.warn("webhook: signature mismatch", { expectedHex, expectedBase64, received: signature });
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
  } catch (sigErr) {
    console.error("webhook: signature verification error:", sigErr);
    return NextResponse.json({ error: "Signature verification failed" }, { status: 400 });
  }

  // Parse JSON payload (we verified signature against rawBody)
  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch (parseErr) {
    console.error("webhook: invalid JSON payload after signature verification:", parseErr);
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  // Best-effort DB connect (non-fatal)
  try {
    await dbConnect();
  } catch (dbErr) {
    console.warn("webhook: dbConnect failed (continuing):", dbErr?.message ?? dbErr);
  }

  // Import repositories/adapters on demand (wrapped, optional)
  let subscriptionRepo = null;
  let transactionRepo = null;
  let tokenRepo = null;

  try {
    const sub = await import("@/infrastructure/persistence/subscriptionRepo");
    subscriptionRepo = sub.subscriptionRepo || sub.default || sub;
  } catch (e) {
    console.warn("webhook: subscriptionRepo not available:", e?.message ?? e);
  }
  try {
    const tx = await import("@/infrastructure/persistence/transactionRepo");
    transactionRepo = tx.transactionRepo || tx.default || tx;
  } catch (e) {
    console.warn("webhook: transactionRepo not available:", e?.message ?? e);
  }
  try {
    const tk = await import("@/infrastructure/persistence/tokenRepo");
    tokenRepo = tk.tokenRepo || tk.default || tk;
  } catch (e) {
    console.warn("webhook: tokenRepo not available:", e?.message ?? e);
  }

  // Small helper to safely create transaction records
  const safeCreateTransaction = async (tObj) => {
    try {
      if (transactionRepo && typeof transactionRepo.create === "function") {
        await transactionRepo.create(tObj);
      }
    } catch (err) {
      console.warn("webhook: transactionRepo.create failed (non-fatal):", err?.message ?? err);
    }
  };

  // Process events (best-effort, non-fatal)
  try {
    const eventType = payload.event || payload.event_type || payload.event_name || payload.type || "";

    switch (eventType) {
      case "subscription.charged":
      case "subscription.charge.succeeded":
      case "subscription.renewed": {
        // payment and subscription info can appear in different places in payload
        const payment = payload.payload?.payment?.entity || payload.payload?.payment || payload.payment || null;
        const subscription = payload.payload?.subscription?.entity || payload.payload?.subscription || payload.subscription || null;

        const razorpaySubscriptionId = subscription?.id || (payment && payment.subscription_id) || null;
        const razorpayPaymentId = payment?.id || null;
        const amount = payment?.amount || payment?.amount_paid || null;

        if (razorpaySubscriptionId) {
          // Update subscription status
          try {
            if (subscriptionRepo) {
              if (typeof subscriptionRepo.updateByRazorpayId === "function") {
                await subscriptionRepo.updateByRazorpayId(razorpaySubscriptionId, {
                  status: "active",
                  lastPaymentAt: new Date(),
                  lastPaymentId: razorpayPaymentId || null,
                  rawEvent: payload,
                });
              } else if (typeof subscriptionRepo.updateStatus === "function") {
                await subscriptionRepo.updateStatus(razorpaySubscriptionId, "active");
              } else {
                // fallback: try find and update by id
                const local = subscriptionRepo.findByRazorpayId ? await subscriptionRepo.findByRazorpayId(razorpaySubscriptionId) : null;
                if (local && typeof subscriptionRepo.update === "function") {
                  await subscriptionRepo.update(local.id || local._id, {
                    ...local,
                    status: "active",
                    lastPaymentAt: new Date(),
                    lastPaymentId: razorpayPaymentId || null,
                    rawEvent: payload,
                  });
                }
              }
            }
          } catch (e) {
            console.warn("webhook: subscription update failed (non-fatal):", e?.message ?? e);
          }

          // Credit tokens to user for renewal
          try {
            const local = subscriptionRepo?.findByRazorpayId ? await subscriptionRepo.findByRazorpayId(razorpaySubscriptionId) : null;
            const tokensToCredit = local?.tokensPerPeriod || local?.tokens || 0;
            if (local && tokensToCredit && tokenRepo) {
              if (typeof tokenRepo.addTokens === "function") {
                await tokenRepo.addTokens(local.userId, tokensToCredit, {
                  reason: "subscription_charge",
                  metadata: { razorpayPaymentId: razorpayPaymentId, amount },
                });
              } else if (typeof tokenRepo.createOrUpdate === "function") {
                // fallback: increment tokens via createOrUpdate
                const balance = await tokenRepo.get(local.userId);
                const newTokens = (balance?.tokens || 0) + tokensToCredit;
                await tokenRepo.createOrUpdate({ userId: local.userId, tokens: newTokens, freeTrialUsed: balance?.freeTrialUsed || false });
              }
            }

            // transaction record
            await safeCreateTransaction({
              userId: local?.userId || null,
              type: "subscription",
              tokens: tokensToCredit || 0,
              reason: "subscription_charge",
              metadata: { razorpayPaymentId, amount, raw: payload },
              createdAt: new Date(),
            });
          } catch (e) {
            console.warn("webhook: credit tokens failed (non-fatal):", e?.message ?? e);
          }
        }
        break;
      }

      case "subscription.cancelled":
      case "subscription.halted":
      case "subscription.suspended": {
        const subscription = payload.payload?.subscription?.entity || payload.payload?.subscription || payload.subscription || null;
        const razorpaySubscriptionId = subscription?.id || null;
        if (razorpaySubscriptionId && subscriptionRepo) {
          try {
            if (typeof subscriptionRepo.updateByRazorpayId === "function") {
              await subscriptionRepo.updateByRazorpayId(razorpaySubscriptionId, {
                status: "cancelled",
                cancelledAt: new Date(),
                rawEvent: payload,
              });
            } else if (typeof subscriptionRepo.updateStatus === "function") {
              await subscriptionRepo.updateStatus(razorpaySubscriptionId, "cancelled");
            }
          } catch (e) {
            console.warn("webhook: failed to mark subscription cancelled (non-fatal):", e?.message ?? e);
          }
        }
        break;
      }

      case "payment.captured":
      case "order.paid":
      case "order.paid.updated":
      default: {
        // Generic handling for one-time top-up orders or payments
        const payment = payload.payload?.payment?.entity || payload.payload?.payment || payload.payment || null;
        const order = payload.payload?.order?.entity || payload.payload?.order || payload.order || null;
        const notes = (payment && payment.notes) || (order && order.notes) || {};
        const tokensInNotes = notes?.tokens || notes?.token_amount || notes?.tokenCount || null;
        const userIdInNotes = notes?.userId || notes?.user_id || null;

        if (tokensInNotes && userIdInNotes && tokenRepo) {
          try {
            if (typeof tokenRepo.addTokens === "function") {
              await tokenRepo.addTokens(userIdInNotes, Number(tokensInNotes), {
                reason: "one_time_topup",
                metadata: { razorpay_payment: payment, razorpay_order: order },
              });
            } else {
              // fallback createOrUpdate
              const bal = await tokenRepo.get(userIdInNotes);
              const newTokens = (bal?.tokens || 0) + Number(tokensInNotes);
              await tokenRepo.createOrUpdate({ userId: userIdInNotes, tokens: newTokens, freeTrialUsed: bal?.freeTrialUsed || false });
            }

            await safeCreateTransaction({
              userId: userIdInNotes,
              type: "credit",
              tokens: Number(tokensInNotes),
              reason: "one_time_topup",
              metadata: { razorpay_payment: payment, razorpay_order: order },
              createdAt: new Date(),
            });
          } catch (e) {
            console.warn("webhook: top-up handling failed (non-fatal):", e?.message ?? e);
          }
        } else {
          // nothing actionable for generic events — log for ops
          console.info("webhook: unhandled or non-actionable event", { type: eventType, notes, order: !!order, payment: !!payment });
        }
        break;
      }
    }

    // Acknowledge quickly
    return NextResponse.json({ ok: true, received: true }, { status: 200 });
  } catch (err) {
    console.error("webhook: unexpected error:", err);
    // Return 500 so Razorpay may retry if appropriate
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
