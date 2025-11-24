// app/myprompt/publicprompt/page.jsx
"use client";

import { useState, useEffect } from "react";
import PromptCard from "@/components/PromptCard";
import { Loader2 } from "lucide-react";

export default function PublicPromptsPage() {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        setLoading(true);
        setError("");

        // Get *my* prompts and filter to public
        const res = await fetch("/api/prompts/mine", {
          cache: "no-store",
          credentials: "include", // always send cookies
        });

        if (!res.ok) {
          let msg = "Failed to fetch prompts";
          try {
            const data = await res.json();
            msg = data.error || msg;
          } catch {
            // ignore JSON parse failure
          }
          setError(msg);
          return;
        }

        const data = await res.json();
        const mine = Array.isArray(data.prompts) ? data.prompts : [];
        const onlyPublic = mine.filter((p) => p.visibility === "public");
        setPrompts(onlyPublic);
      } catch (err) {
        console.error("Error fetching prompts:", err);
        setError("An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchPrompts();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121021] flex justify-center items-center">
        <Loader2 className="w-12 h-12 text-[#8B5CF6] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#121021] text-white flex justify-center items-center p-4">
        <div className="text-center">
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121021] text-white py-8 px-4 sm:px-8 lg:px-20">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-white mb-2">My Public Prompts</h1>
          <p className="text-gray-400">
            {prompts.length === 0
              ? "You don't have any public prompts yet."
              : `You have ${prompts.length} public prompt${prompts.length === 1 ? "" : "s"}.`}
          </p>
        </div>

        {prompts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400">No public prompts found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {prompts.map((prompt) => (
              <PromptCard
                key={prompt._id}
                title={prompt.title}
                category={prompt.category}
                visibility={prompt.visibility}
                promptSnippet={prompt.promptContent?.substring(0, 100) || ""}
                fullPrompt={prompt.promptContent || ""}
                imageUrl={prompt.media?.[0] || prompt.imageUrl}
                authorName={prompt.owner?.name || prompt.owner?.username || "Unknown"}
                authorImageUrl={prompt.owner?.imageUrl}
                likes={prompt.likes || 0}
                showLikeCount={true}   // show like count because these are *your* prompts
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}