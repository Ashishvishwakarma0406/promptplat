"use client";
import { useState } from "react";
import DualView from "@/components/ai/DualView";
import TokenUsage from "@/components/ai/TokenUsage";
import { Loader2 } from "lucide-react";

export default function RephraserPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleRephrase() {
    setLoading(true);
    const res = await fetch("/app/ai/api/rephraser", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: input }),
    });
    const data = await res.json();
    setOutput(data.output);
    setUsage(data.usage);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#121021] text-white p-8">
      <h1 className="text-4xl font-bold mb-6">Prompt Rephraser</h1>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter raw or messy prompt..."
        className="w-full bg-[#1a1828] border border-[#2a273b] p-4 rounded-lg"
        rows={8}
      />
      <button
        onClick={handleRephrase}
        className="mt-4 px-6 py-2 bg-[#8B5CF6] rounded hover:bg-[#7D49E0]"
      >
        {loading ? <Loader2 className="animate-spin w-5 h-5 inline" /> : "Rephrase Prompt"}
      </button>
      {output && <DualView original={input} cleaned={output} />}
      {usage && <TokenUsage usage={usage} />}
    </div>
  );
}
