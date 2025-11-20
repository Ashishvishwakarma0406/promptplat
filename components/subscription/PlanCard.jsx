// components/subscription/PlanCard.jsx
"use client";
import { Check, Crown } from "lucide-react";

/**
 * PlanCard Component
 *
 * Props:
 *  - plan: { id, key, title, price, tokens, subtitle, benefit, razorpayPlanId }
 *  - active: boolean (marks current active plan)
 *  - loading: boolean (disables button)
 *  - onSubscribe: function(planKey)  // optional callback for immediate subscribe action
 *  - showCTA: boolean (default true) // whether to render the built-in Subscribe button
 */
export default function PlanCard({
  plan,
  active = false,
  loading = false,
  onSubscribe,
  showCTA = true,
}) {
  const handleClick = () => {
    if (loading || active) return;
    if (typeof onSubscribe === "function") {
      onSubscribe(plan.key || plan.id || plan.razorpayPlanId);
    }
  };

  return (
    <div
      className={`p-5 rounded-xl border transition-all duration-300 ${
        active
          ? "border-[#8B5CF6] bg-[#1f1b2d]"
          : "border-[#2a273b] bg-[#1a1828] hover:border-[#8B5CF6]/50"
      }`}
      role="region"
      aria-label={`${plan.title} plan`}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            {plan.title}
            {active && <Crown className="w-4 h-4 text-yellow-400" aria-hidden />}
          </h2>
          <p className="text-gray-400 text-sm">{plan.subtitle}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-extrabold text-white">₹{plan.price}</div>
          <p className="text-xs text-gray-400">/month</p>
        </div>
      </div>

      <ul className="space-y-2 mt-4 text-sm text-gray-300">
        <li className="flex items-center gap-2">
          <Check className="w-4 h-4 text-green-400" aria-hidden />
          <span>{Number(plan.tokens || 0).toLocaleString()} tokens per month</span>
        </li>
        <li className="flex items-center gap-2">
          <Check className="w-4 h-4 text-green-400" aria-hidden />
          <span>{plan.benefit}</span>
        </li>
      </ul>

      {/* Internal CTA is optional: showCTA toggles it */}
      {showCTA && (
        <button
          onClick={handleClick}
          disabled={loading || active}
          aria-disabled={loading || active}
          className={`w-full mt-5 py-2 rounded-lg font-semibold text-white transition ${
            active
              ? "bg-green-600 cursor-default"
              : loading
              ? "bg-gray-600 opacity-60 cursor-not-allowed"
              : "bg-[#8B5CF6] hover:bg-[#7D49E0]"
          }`}
        >
          {active ? "Active Plan" : loading ? "Processing..." : "Subscribe"}
        </button>
      )}
    </div>
  );
}
