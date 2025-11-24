// app/api/subscription/create-order/route.js
import { NextResponse } from "next/server";
import { razorpay } from "@/lib/razorpayClient";
import { getUserFromRequest } from "@/lib/authHelper";
import { prisma } from "@/lib/prisma";

export async function POST(req) {
  try {
    const user = await getUserFromRequest();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);
    if (!body?.amountInPaise || !body?.tokens) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

    const options = {
      amount: body.amountInPaise,
      currency: "INR",
      receipt: `topup_${user.id}_${Date.now()}`,
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);
    // Save as pending Transaction reference (optional)
    await prisma.tokenTransaction.create({
      data: { userId: user.id, amount: BigInt(body.tokens), type: "TOPUP", reference: order.id, meta: { amountInPaise: body.amountInPaise } },
    });

    return NextResponse.json({ order });
  } catch (err) {
    console.error("create-order:", err);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
