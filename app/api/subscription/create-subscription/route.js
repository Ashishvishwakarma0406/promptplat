// app/api/subscription/create-subscription/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { razorpay } from "@/lib/razorpayClient";
import { getUserFromRequest } from "@/lib/authHelper";

export async function POST(req) {
  try {
    const user = await getUserFromRequest();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);
    if (!body?.planKey) return NextResponse.json({ error: "planKey required" }, { status: 400 });

    const plan = await prisma.subscriptionPlan.findUnique({ where: { key: body.planKey } });
    if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

    // Create subscription on Razorpay using saved razorpayPlanId
    const subscription = await razorpay.subscriptions.create({
      plan_id: plan.razorpayPlanId,
      customer_notify: 1,
      total_count: 12, // or set to null for indefinite monthly
    });

    // Save local subscription entry
    const dbSub = await prisma.subscription.create({
      data: {
        userId: user.id,
        planId: plan.id,
        razorpaySubscriptionId: subscription.id,
        status: subscription.status,
        currentPeriodStart: subscription.current_start ? new Date(subscription.current_start * 1000) : null,
        currentPeriodEnd: subscription.current_end ? new Date(subscription.current_end * 1000) : null,
      },
    });

    return NextResponse.json({ subscription: dbSub, razorpaySubscription: subscription });
  } catch (err) {
    console.error("create-subscription:", err);
    return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 });
  }
}
