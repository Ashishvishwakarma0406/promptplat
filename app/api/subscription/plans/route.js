// app/api/subscription/plans/route.js
import { NextResponse } from "next/server";

/**
 * GET /api/subscription/plans
 *
 * Returns available subscription plans. Uses environment variables when provided,
 * otherwise returns fallback hard-coded plans so the frontend always receives valid JSON.
 *
 * Important:
 *  - Do NOT return secret values. Only include public key (NEXT_PUBLIC_RAZORPAY_KEY) if set.
 */

const FALLBACK_PLANS = [
  {
    id: "basic_199",
    key: "basic199",
    title: "Basic Plan",
    subtitle: "Perfect for light users",
    price: 199,
    tokens: 600_000,
    benefit: "600k tokens every month",
    razorpayPlanId: null,
  },
  {
    id: "pro_299",
    key: "pro299",
    title: "Pro Plan",
    subtitle: "Best for professionals",
    price: 299,
    tokens: 1_000_000,
    benefit: "1 million tokens every month",
    razorpayPlanId: null,
  },
];

export async function GET() {
  try {
    // Build plans list from environment variables where possible.
    // Keep the mapping deterministic so frontend keys remain stable.
    const plans = [];

    const envBasic = process.env.RAZORPAY_PLAN_199 || process.env.RAZORPAY_PLAN_BASIC;
    const envPro = process.env.RAZORPAY_PLAN_299 || process.env.RAZORPAY_PLAN_PRO;

    if (envBasic) {
      plans.push({
        id: "basic_199",
        key: "basic199",
        title: "Basic Plan",
        subtitle: "Perfect for light users",
        price: 199,
        tokens: 600000,
        benefit: "600k tokens every month",
        razorpayPlanId: envBasic,
      });
    }

    if (envPro) {
      plans.push({
        id: "pro_299",
        key: "pro299",
        title: "Pro Plan",
        subtitle: "Best for professionals",
        price: 299,
        tokens: 1000000,
        benefit: "1 million tokens every month",
        razorpayPlanId: envPro,
      });
    }

    // If no env-provided plans, fall back to safe defaults so client still renders.
    const finalPlans = plans.length > 0 ? plans : FALLBACK_PLANS;

    // public key (safe to expose) — frontend can use this if needed
    const publicKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY || process.env.RAZORPAY_KEY_ID || null;

    return NextResponse.json(
      {
        plans: finalPlans,
        meta: {
          source: plans.length > 0 ? "env" : "fallback",
          publicKey,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    // Always return valid JSON on error (avoid returning HTML)
    console.error("plans GET error:", err);
    return NextResponse.json({ error: "Failed to load plans" }, { status: 500 });
  }
}
