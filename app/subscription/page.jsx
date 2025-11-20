// app/subscription/page.jsx
"use client";

import { useEffect, useState } from "react";
import PlanCard from "@/components/subscription/PlanCard";
import RazorpayButton from "@/components/subscription/RazorpayButton";
import TokenHistoryTable from "@/components/subscription/TokenHistoryTable";
import { Loader2 } from "lucide-react";
import Link from "next/link";

const FALLBACK_PLANS = [
  {
    id: "basic_199",
    key: "basic199",
    title: "Basic Plan",
    price: 199,
    tokens: 600_000,
    subtitle: "Perfect for light users",
    benefit: "600k tokens every month",
    razorpayPlanId: "plan_basic_placeholder",
  },
  {
    id: "pro_299",
    key: "pro299",
    title: "Pro Plan",
    price: 299,
    tokens: 1_000_000,
    subtitle: "Best for professionals",
    benefit: "1 million tokens every month",
    razorpayPlanId: "plan_pro_placeholder",
  },
];

export default function SubscriptionPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        // Parallel requests: we'll handle each response carefully
        const [plansPromise, balancePromise, historyPromise] = await Promise.allSettled([
          fetch("/api/subscription/plans", { cache: "no-store", credentials: "include" }),
          fetch("/api/ai/tokens/balance", { cache: "no-store", credentials: "include" }),
          fetch("/api/ai/tokens/history", { cache: "no-store", credentials: "include" }),
        ]);

        /* ---------- PLANS ---------- */
        if (plansPromise.status === "fulfilled" && plansPromise.value) {
          const res = plansPromise.value;

          // If response is JSON and ok -> parse JSON
          const contentType = (res.headers.get("content-type") || "").toLowerCase();
          if (contentType.includes("application/json")) {
            try {
              const json = await res.json();
              const serverPlans = Array.isArray(json) ? json : json.plans || [];
              if (!cancelled) setPlans(serverPlans.length ? serverPlans : FALLBACK_PLANS);
            } catch (parseErr) {
              // JSON parse failed - fallback
              console.warn("Failed to parse plans JSON, using fallback.", parseErr);
              if (!cancelled) setPlans(FALLBACK_PLANS);
              if (!res.ok) {
                // try to read text safely via clone (body may be consumed) for logging
                try {
                  const txt = await res.clone().text();
                  console.info("Plans endpoint returned non-ok JSON body:", txt.slice(0, 300));
                } catch {}
              }
            }
          } else {
            // Non-JSON response (likely HTML 404). Log for debugging, use fallback.
            try {
              const text = await res.clone().text();
              console.info("Plans endpoint returned non-JSON response (truncated):", text.slice(0, 300));
            } catch (e) {
              console.info("Plans endpoint returned non-JSON response.");
            }
            if (!cancelled) setPlans(FALLBACK_PLANS);
            // If response status not OK, inform user concisely (do not show whole HTML)
            if (!res.ok) {
              setError("Couldn't load remote plans — showing default plans. (Server returned an unexpected response.)");
            }
          }
        } else {
          // Network error or promise rejected
          console.warn("Plans fetch failed (network or blocked). Using fallback plans.", plansPromise);
          if (!cancelled) setPlans(FALLBACK_PLANS);
          if (plansPromise.status === "rejected") {
            setError("Failed to load subscription plans from server; showing default plans.");
          }
        }

        /* ---------- BALANCE (best-effort) ---------- */
        if (balancePromise.status === "fulfilled" && balancePromise.value) {
          try {
            const res = balancePromise.value;
            const ct = (res.headers.get("content-type") || "").toLowerCase();
            if (ct.includes("application/json") && res.ok) {
              const b = await res.json();
              if (!cancelled) setBalance(b);
            } else {
              // ignore non-json or non-ok balance responses
              console.info("Balance endpoint non-JSON or not OK, ignoring.");
            }
          } catch (e) {
            console.info("Failed to parse balance response, ignoring.", e);
          }
        } else {
          console.info("Balance fetch not available or failed.", balancePromise);
        }

        /* ---------- HISTORY (best-effort) ---------- */
        if (historyPromise.status === "fulfilled" && historyPromise.value) {
          try {
            const res = historyPromise.value;
            const ct = (res.headers.get("content-type") || "").toLowerCase();
            if (ct.includes("application/json") && res.ok) {
              const h = await res.json();
              const txs = Array.isArray(h) ? h : h.transactions || [];
              if (!cancelled) setHistory(txs);
            } else {
              console.info("History endpoint returned non-json or not OK; ignoring history.");
            }
          } catch (e) {
            console.info("Failed to parse history response, ignoring.", e);
          }
        } else {
          console.info("History fetch not available or failed.", historyPromise);
        }
      } catch (e) {
        console.error("Subscription load error:", e);
        if (!cancelled) {
          setError("Failed to load subscription data. Showing default plans.");
          setPlans(FALLBACK_PLANS);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121021] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#8B5CF6] animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#121021] text-white py-10 px-6 sm:px-12 lg:px-20">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold">Subscription & Tokens</h1>
            <p className="text-gray-400 mt-1">Manage your plan, balance, and purchase more tokens.</p>
          </div>
          <Link href="/dashboard" className="text-sm text-gray-300 hover:underline">
            Back to Dashboard
          </Link>
        </header>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-900/40 text-red-200">{error}</div>
        )}

        {/* Balance */}
        <section className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-1 md:col-span-2 bg-[#1a1828] p-6 rounded-2xl border border-[#2a273b]">
            <h2 className="text-lg font-semibold mb-2">Your Token Balance</h2>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-4xl font-bold">{balance ? Number(balance.tokens || 0) : 0}</div>
                <div className="text-sm text-gray-400">Available tokens</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">Active Plan</div>
                <div className="font-medium">{balance?.activePlan?.name || "No active plan"}</div>
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-400">
              Free trial: {balance?.trialRemaining ? `${balance.trialRemaining} tokens` : "—"}
            </p>
          </div>

          <div className="bg-[#1a1828] p-6 rounded-2xl border border-[#2a273b]">
            <h3 className="text-sm text-gray-300">Quick actions</h3>
            <div className="mt-4 flex flex-col gap-3">
              <Link href="/ai/humanizer" className="block w-full text-center px-3 py-2 rounded-lg bg-[#8B5CF6] text-white">
                Open AI Humanizer
              </Link>
              <Link href="/ai/rephraser" className="block w-full text-center px-3 py-2 rounded-lg bg-[#2A273B] border border-[#3e3b4a] text-gray-200">
                Open Prompt Rephraser
              </Link>
            </div>
          </div>
        </section>

        {/* Plans */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Choose a subscription plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {plans.length === 0 ? (
              <div className="text-gray-400">No plans available.</div>
            ) : (
              plans.map((p) => (
                <div key={p.id || p.key} className="bg-transparent">
                  {/* PlanCard renders only descriptive UI (no CTA) */}
                  <PlanCard
                    plan={p}
                    showCTA={false}
                    active={balance?.activePlan?.id === (p.id || p.key || p.razorpayPlanId)}
                  />
                  {/* Single Razorpay button per plan (avoids duplicate subscribe buttons) */}
                  <div className="mt-4">
                    <RazorpayButton
                      type="subscription"
                      planKey={p.key || p.id || p.razorpayPlanId}
                      label={`Subscribe - ₹${p.price}`}
                      onSuccess={(resp) => {
                        // Refresh page or re-fetch data
                        window.location.reload();
                      }}
                      onError={(err) => {
                        console.error("Subscription error:", err);
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* One-time top-ups */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">One-time token top-ups</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-[#2a273b] rounded-xl bg-[#1a1828]">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-bold">₹49</div>
                  <div className="text-sm text-gray-400">150,000 tokens</div>
                </div>
                <div style={{ width: 220 }}>
                  <RazorpayButton
                    type="order"
                    orderData={{ amount: 49 * 100, tokens: 150000, currency: "INR", description: "150k tokens" }}
                    label="Buy 150k tokens"
                    onSuccess={() => window.location.reload()}
                    onError={(e) => console.error("Topup error:", e)}
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border border-[#2a273b] rounded-xl bg-[#1a1828]">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-bold">₹99</div>
                  <div className="text-sm text-gray-400">350,000 tokens</div>
                </div>
                <div style={{ width: 220 }}>
                  <RazorpayButton
                    type="order"
                    orderData={{ amount: 99 * 100, tokens: 350000, currency: "INR", description: "350k tokens" }}
                    label="Buy 350k tokens"
                    onSuccess={() => window.location.reload()}
                    onError={(e) => console.error("Topup error:", e)}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* History */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Token & Payment History</h2>
          <div className="bg-[#1a1828] p-4 rounded-2xl border border-[#2a273b]">
            <TokenHistoryTable transactions={history} />
          </div>
        </section>
      </div>
    </main>
  );
}
