// app/api/subscription/webhook/route.js
import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const RAZORPAY_SECRET = process.env.RAZORPAY_KEY_SECRET;

export async function POST(req) {
  try {
    const bodyText = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!signature || !RAZORPAY_SECRET) {
      console.error("Missing signature or secret");
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const expected = crypto.createHmac("sha256", RAZORPAY_SECRET).update(bodyText).digest("hex");
    if (expected !== signature) {
      console.error("Invalid webhook signature");
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const event = JSON.parse(bodyText);
    const ev = event.event;

    // handle invoice.paid -> credit tokens
    if (ev === "invoice.paid" || ev === "payment.captured") {
      // invoice or payment event contains subscription_id or order_id
      const payload = event.payload;
      // Support both subscription and order flows
      const subscriptionId = payload?.payment?.entity?.subscription_id || payload?.invoice?.entity?.subscription_id;
      const invoiceId = payload?.invoice?.entity?.id || null;
      const amount = payload?.payment?.entity?.amount || payload?.invoice?.entity?.amount || null;
      const status = payload?.payment?.entity?.status || payload?.invoice?.entity?.status || null;

      if (subscriptionId && status === "captured") {
        // find local subscription
        const sub = await prisma.subscription.findUnique({ where: { razorpaySubscriptionId: subscriptionId }, include: { plan: true } });
        if (sub) {
          // credit tokens for plan
          const tokens = BigInt(sub.plan.tokensPerPeriod);
          await prisma.$transaction(async (tx) => {
            await tx.tokenAccount.upsert({
              where: { userId: sub.userId },
              update: { tokens: { increment: tokens } },
              create: { userId: sub.userId, tokens: tokens, trialUsed: true },
            });

            await tx.tokenTransaction.create({
              data: { userId: sub.userId, amount: tokens, type: "SUB_RENEW", reference: invoiceId ?? subscriptionId, meta: { invoiceId, amount } },
            });

            await tx.subscription.update({ where: { id: sub.id }, data: { status: "active" } });
          });
        }
      }

      // handle top-up orders: if payment for order exists, match tokenTransaction by reference (order id)
      if (payload?.payment?.entity?.order_id && payload?.payment?.entity?.status === "captured") {
        const orderId = payload.payment.entity.order_id;
        // find tokenTransaction with that reference
        const txRef = await prisma.tokenTransaction.findFirst({ where: { reference: orderId } });
        if (txRef) {
          const userId = txRef.userId;
          const amountTokens = BigInt(txRef.amount);
          await prisma.$transaction(async (tx) => {
            await tx.tokenAccount.upsert({
              where: { userId },
              update: { tokens: { increment: amountTokens } },
              create: { userId, tokens: amountTokens, trialUsed: true },
            });
            await tx.tokenTransaction.update({ where: { id: txRef.id }, data: { reference: orderId } });
          });
        }
      }
    }

    // other events: subscription.cancelled, invoice.failed etc -> update status
    if (ev === "subscription.cancelled") {
      const subscriptionId = event.payload.subscription.entity.id;
      await prisma.subscription.updateMany({ where: { razorpaySubscriptionId: subscriptionId }, data: { status: "cancelled" } });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("webhook processing error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
