"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";

/**
 * AIActionButton
 * ---------------
 * Shared component for "Rewrite", "Rephrase", or "Generate" actions.
 *
 * Props:
 *  - label: string → button text (e.g., "Humanize", "Rephrase Prompt")
 *  - onAction: async function() → should perform AI call and return { output, usage }
 *  - disabled: boolean → disables when no input text
 *  - onResult: function(result) → called after successful response
 */
export default function AIActionButton({ label = "Run", onAction, onResult, disabled = false }) {
  const [loading, setLoading] = useState(false);
  const [usage, setUsage] = useState(null); // token usage details

  const handleClick = async () => {
    if (loading || disabled) return;
    setLoading(true);
    setUsage(null);
    try {
      const res = await onAction();
      if (res?.usage) setUsage(res.usage);
      onResult?.(res);
    } catch (e) {
      console.error("AIActionButton error:", e);
      alert(e?.message || "Something went wrong with AI operation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleClick}
        disabled={disabled || loading}
        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-white transition
          ${
            disabled || loading
              ? "bg-gray-600 cursor-not-allowed opacity-60"
              : "bg-[#8B5CF6] hover:bg-[#7D49E0]"
          }`}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            {label}
          </>
        )}
      </button>

      {/* Token usage info */}
      {usage && (
        <div className="text-xs text-gray-400 bg-[#1a1828] border border-[#2a273b] rounded-md px-3 py-1 mt-1">
          <div className="flex flex-wrap gap-3 justify-center">
            <span>Input: {usage.inputTokens ?? 0}</span>
            <span>Output: {usage.outputTokens ?? 0}</span>
            <span>Total: {usage.totalTokens ?? 0}</span>
          </div>
        </div>
      )}
    </div>
  );
}
