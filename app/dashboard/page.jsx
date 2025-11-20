"use client";

import { useEffect, useState } from "react";
import { Loader2, Coins, Repeat, CreditCard, Zap } from "lucide-react";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [tokens, setTokens] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        const [tokenRes, txRes, subRes] = await Promise.all([
          fetch("/api/ai/tokens/balance", { credentials: "include" }),
          fetch("/api/ai/tokens/history", { credentials: "include" }),
          fetch("/api/subscription/active", { credentials: "include" }),
        ]);

        // Token balance
        if (!tokenRes.ok) throw new Error("Failed to fetch token balance");
        const tokenData = await tokenRes.json();
        setTokens(tokenData.tokens || 0);

        // Token transactions
        if (txRes.ok) {
          const history = await txRes.json();
          setTransactions(history.transactions || []);
        }

        // User subscription
        if (subRes.ok) {
          const sub = await subRes.json();
          setSubscription(sub.subscription || null);
        }

      } catch (err) {
        console.error("Dashboard Error:", err);
        setError(err.message || "Could not load dashboard");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121021] flex justify-center items-center">
        <Loader2 className="w-10 h-10 text-[#8B5CF6] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#121021] flex items-center justify-center text-red-400 text-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121021] text-white p-8">
      <h1 className="text-4xl font-bold mb-8">Dashboard</h1>

      {/* Token Balance */}
      <section className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#1a1828] border border-[#2a273b] rounded-xl p-6 flex flex-col items-center">
          <Coins className="w-10 h-10 text-yellow-400 mb-3" />
          <p className="text-gray-400 text-sm">Token Balance</p>
          <p className="text-3xl font-bold">{tokens.toLocaleString()}</p>
        </div>

        <div className="bg-[#1a1828] border border-[#2a273b] rounded-xl p-6 flex flex-col items-center">
          <Zap className="w-10 h-10 text-[#8B5CF6] mb-3" />
          <p className="text-gray-400 text-sm">Used For</p>
          <p className="text-lg text-gray-300">Humanizer & Rephraser</p>
        </div>

        <div className="bg-[#1a1828] border border-[#2a273b] rounded-xl p-6 flex flex-col items-center">
          <CreditCard className="w-10 h-10 text-green-400 mb-3" />
          <p className="text-gray-400 text-sm">Subscription Status</p>
          {subscription ? (
            <p className="text-green-400 mt-1">{subscription.plan} – ACTIVE</p>
          ) : (
            <p className="text-gray-400 mt-1">No active subscription</p>
          )}
        </div>
      </section>

      {/* Subscription Details */}
      {subscription && (
        <section className="bg-[#1a1828] border border-[#2a273b] rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-[#8B5CF6] flex items-center gap-2">
            <Repeat className="w-5 h-5" /> Active Subscription
          </h2>

          <div className="grid sm:grid-cols-2 gap-4 text-gray-300">
            <div>
              <p className="text-sm text-gray-400">Plan</p>
              <p className="font-medium">{subscription.plan}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Status</p>
              <p className="font-medium">{subscription.status}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Started</p>
              <p>{new Date(subscription.startedAt).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Next Billing</p>
              <p>{new Date(subscription.nextBillingAt).toLocaleDateString()}</p>
            </div>
          </div>
        </section>
      )}

      {/* Transactions */}
      <section className="bg-[#1a1828] border border-[#2a273b] rounded-xl p-6">
        <h2 className="text-2xl font-semibold mb-4 text-[#8B5CF6]">Recent Transactions</h2>

        {transactions.length === 0 ? (
          <p className="text-gray-400">No recent transactions.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-gray-400 border-b border-[#2a273b]">
                <tr>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2">Tokens</th>
                  <th className="px-4 py-2">Reason</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr
                    key={tx._id}
                    className="border-b border-[#2a273b] hover:bg-[#2a273b]/30"
                  >
                    <td className="px-4 py-2 text-gray-300">
                      {new Date(tx.createdAt).toLocaleString()}
                    </td>
                    <td
                      className={`px-4 py-2 ${
                        tx.type === "add"
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {tx.type}
                    </td>
                    <td className="px-4 py-2">{tx.tokens.toLocaleString()}</td>
                    <td className="px-4 py-2 text-gray-400">{tx.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
