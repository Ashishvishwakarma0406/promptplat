"use client";

import { useState } from "react";
import LivePreview from "@/components/ai/LivePreview";
import TokenUsage from "@/components/ai/TokenUsage";
import { Loader2, AlertCircle } from "lucide-react";

export default function HumanizerPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleHumanize = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError("");
    setSuccess("");
    setUsage(null);
    setOutput("");

    try {
      const res = await fetch("/api/ai/humanizer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // send cookies (for token usage)
        body: JSON.stringify({ text: input }),
      });

      const data = await res.json();
      if (!res.ok) {
        // handle token exhaustion or authorization gracefully
        if (res.status === 402) {
          throw new Error("You’ve used all your available tokens. Please upgrade or renew your subscription.");
        } else if (res.status === 401) {
          throw new Error("Please log in to use the AI Humanizer feature.");
        } else {
          throw new Error(data.error || "Failed to humanize text.");
        }
      }

      if (data.output) {
        setOutput(data.output);
        setUsage(data.usage || null);
        setSuccess("Your text has been humanized successfully!");
      } else {
        throw new Error("No output received from AI.");
      }
    } catch (err) {
      console.error("Humanizer error:", err);
      setError(err.message || "Something went wrong while processing your request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121021] text-white py-8 px-6 sm:px-10">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <h1 className="text-4xl font-extrabold mb-3">AI Humanizer</h1>
        <p className="text-gray-400 mb-6">
          Instantly rewrite AI-generated or robotic text into natural, human-like language.
        </p>

        {/* Input area */}
        <textarea
          className="w-full bg-[#1a1828] border border-[#2a273b] rounded-lg p-4 text-gray-200 outline-none focus:ring-2 focus:ring-[#8B5CF6] placeholder-gray-500"
          placeholder="Paste or type your text here..."
          rows={8}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />

        {/* Action button */}
        <div className="flex justify-end mt-5">
          <button
            onClick={handleHumanize}
            disabled={loading || !input.trim()}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold transition 
              ${loading || !input.trim()
                ? "bg-gray-600 cursor-not-allowed opacity-70"
                : "bg-[#8B5CF6] hover:bg-[#7D49E0]"}`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Humanize Text"
            )}
          </button>
        </div>

        {/* Error or success message */}
        {error && (
          <div className="mt-4 flex items-center gap-2 text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-md p-3">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mt-4 text-green-400 text-sm bg-green-900/20 border border-green-800 rounded-md p-3">
            {success}
          </div>
        )}

        {/* Output + Usage */}
        {output && (
          <div className="mt-10">
            <LivePreview text={output} />
            {usage && <TokenUsage usage={usage} />}
          </div>
        )}
      </div>
    </div>
  );
}
