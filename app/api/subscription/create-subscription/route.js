// app/api/subscription/create-subscription/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbconnect";
import { createSubscription as razorCreateSubscription } from "@/infrastructure/payments/razorpay";
import { subscriptionRepo } from "@/infrastructure/persistence/subscriptionRepo";
import { getUserFromRequest } from "@/lib/auth"; // use the helper above

export async function POST(req) {
  try {
    // ensure DB
    await dbConnect();

    // NextRequest is passed in; use helper which will await req.cookies.get('token') correctly
    const userPayload = await getUserFromRequest(req);
    if (!userPayload || !userPayload.sub && !userPayload.userId && !userPayload.id) {
      return NextResponse.json({ error: "Unauthorized: user not authenticated" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const planKey = body?.planKey;
    if (!planKey) return NextResponse.json({ error: "Missing planKey" }, { status: 400 });

    // Map plan key to razorpay plan id — keep this mapping in sync with /plans route
    const planMap = {
      basic199: { razorpayPlanId: process.env.RAZORPAY_PLAN_199, price: 199, tokens: 600_000, title: "Basic Plan" },
      pro299: { razorpayPlanId: process.env.RAZORPAY_PLAN_299, price: 299, tokens: 1_000_000, title: "Pro Plan" },
      // fallback keys
      basic: { razorpayPlanId: process.env.RAZORPAY_PLAN_199, price: 199, tokens: 600_000, title: "Basic Plan" },
      pro: { razorpayPlanId: process.env.RAZORPAY_PLAN_299, price: 299, tokens: 1_000_000, title: "Pro Plan" },
    };

    const plan = planMap[planKey];
    if (!plan) {
      return NextResponse.json({ error: "Invalid plan selected" }, { status: 400 });
    }
    if (!plan.razorpayPlanId) {
      return NextResponse.json({ 
        error: "Subscription service not configured. Please contact support." 
      }, { status: 503 });
    }

    // create subscription on Razorpay (server-to-server)
    const rpSub = await razorCreateSubscription({
      plan_id: plan.razorpayPlanId,
      customer_notify: 1,
      total_count: 12,
    });

    // persist a subscription record locally
    const userId = userPayload.sub || userPayload.userId || userPayload.id;
    const local = await subscriptionRepo.create({
      userId,
      planId: planKey,
      planName: plan.title,
      tokensPerPeriod: plan.tokens,
      price: plan.price,
      currency: "INR",
      status: rpSub.status || "created",
      razorpaySubscriptionId: rpSub.id,
      startedAt: new Date(),
      nextBillingAt: rpSub.current_start ? new Date(rpSub.current_start * 1000) : null,
      metadata: { raw: rpSub },
    });

    return NextResponse.json({
      subscriptionId: rpSub.id,
      subscription: rpSub,
      razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY || process.env.RAZORPAY_KEY_ID,
      planName: plan.title,
      localSubscription: local,
    });
  } catch (err) {
    console.error("POST /api/subscription/create-subscription error:", err?.message || err);
    return NextResponse.json({ error: err?.message || "Failed to create subscription" }, { status: 500 });
  }
}
