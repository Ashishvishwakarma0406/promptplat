"use client";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

/**
 * TokenHistoryTable
 *
 * - Accepts optional `transactions` prop (array). If provided, component will render that.
 * - If no prop is provided, component attempts to fetch from a list of known endpoints.
 * - Robustly handles non-JSON responses (HTML 404 pages etc.) and HTTP errors.
 * - Shows a friendly "no usage yet" message when there are no transactions.
 *
 * Endpoints attempted (in order):
 *  - /api/ai/tokens/history
 *  - /api/tokens/transactions
 *  - /api/ai/tokens/transactions
 *
 * Make sure your backend exposes one of those endpoints returning JSON:
 *   { transactions: [ { _id, createdAt, type, tokens, reason } ] }
 */
export default function TokenHistoryTable({ transactions: initialTransactions = null }) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [loading, setLoading] = useState(initialTransactions ? false : true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialTransactions) return; // already provided by parent; no fetch

    let cancelled = false;

    async function tryFetchEndpoints() {
      setLoading(true);
      setError("");
      const endpoints = [
        "/api/ai/tokens/history",
        "/api/tokens/transactions",
        "/api/ai/tokens/transactions",
      ];

      for (const url of endpoints) {
        try {
          const res = await fetch(url, { credentials: "include", cache: "no-store" });
          // If 404 or not ok, try next endpoint
          if (!res.ok) {
            // try to read text for debugging
            const txt = await res.text().catch(() => "");
            console.info(`TokenHistory: endpoint ${url} returned ${res.status}. Response text:`, txt.slice(0, 300));
            continue;
          }

          // Check content-type header to avoid trying to parse HTML
          const ct = res.headers.get("content-type") || "";
          if (!ct.includes("application/json")) {
            // response is not JSON (maybe an HTML 404). Skip and try next.
            const txt = await res.text().catch(() => "");
            console.info(`TokenHistory: endpoint ${url} returned non-JSON content-type: ${ct}. Snippet:`, txt.slice(0, 300));
            continue;
          }

          // Parse JSON safely
          const data = await res.json().catch((e) => {
            console.warn("TokenHistory: failed to parse JSON from", url, e);
            return null;
          });

          if (!data) continue;

          // Accept data.transactions array or data (if endpoint returns array directly)
          const tx = Array.isArray(data.transactions) ? data.transactions : Array.isArray(data) ? data : null;

          if (tx && !cancelled) {
            setTransactions(tx);
            setLoading(false);
            return;
          } else {
            // Data didn't include transactions array; log and continue
            console.info("TokenHistory: endpoint returned JSON but no transactions array:", data);
            continue;
          }
        } catch (e) {
          console.warn("TokenHistory: fetch error for endpoint", url, e);
          // try next endpoint
          continue;
        }
      }

      // If we get here, no endpoint returned usable transactions.
      if (!cancelled) {
        setTransactions([]); // treat as no transactions (friendly message)
        setError(""); // don't show a harsh error by default; leave blank so UI shows "no usage yet"
        setLoading(false);
      }
    }

    tryFetchEndpoints();

    return () => {
      cancelled = true;
    };
  }, [initialTransactions]);

  if (loading)
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 text-[#8B5CF6] animate-spin" />
      </div>
    );

  // If fetching failed hard (setError), show error
  if (error)
    return (
      <div className="text-center text-red-400 py-6">
        {error || "Error loading transaction history"}
      </div>
    );

  // Friendly message when there are no transactions / no usage yet
  if (!transactions || transactions.length === 0)
    return (
      <div className="text-center text-gray-400 py-6">
        <p className="mb-2 font-medium">No usage yet.</p>
        <p className="text-sm">
          You haven’t used any tokens. Start exploring free trials or choose a subscription to use services.
        </p>
      </div>
    );

  return (
    <div className="overflow-x-auto border border-[#2a273b] rounded-xl bg-[#1a1828] mt-2">
      <table className="min-w-full text-sm text-gray-300">
        <thead className="bg-[#2a273b] text-gray-200 uppercase text-xs">
          <tr>
            <th className="px-4 py-3 text-left">Date</th>
            <th className="px-4 py-3 text-left">Type</th>
            <th className="px-4 py-3 text-left">Tokens</th>
            <th className="px-4 py-3 text-left">Reason</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => {
            // defensive property access
            const createdAt = tx?.createdAt ? new Date(tx.createdAt).toLocaleString() : tx?.date ? new Date(tx.date).toLocaleString() : "—";
            const type = (tx?.type || tx?.action || "unknown").toString();
            const tokens = Number(tx?.tokens || tx?.amount || 0);
            const reason = tx?.reason || tx?.note || tx?.notes?.reason || "";

            return (
              <tr
                key={tx._id || tx.id || Math.random()}
                className="border-t border-[#2a273b] hover:bg-[#23203b]/40"
              >
                <td className="px-4 py-3 text-gray-300">{createdAt}</td>
                <td className={`px-4 py-3 capitalize ${type === "credit" ? "text-green-400" : "text-red-400"}`}>
                  {type}
                </td>
                <td className="px-4 py-3 font-semibold">{tokens.toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-400">{(reason || "N/A").toString().replace(/[-_]/g, " ")}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
