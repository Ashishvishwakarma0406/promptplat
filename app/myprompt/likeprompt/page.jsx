// app/myprompt/likeprompt/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PromptCard from "@/components/PromptCard";
import { Loader2 } from "lucide-react";

export default function LikedPromptsPage() {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch("/api/prompts/liked", {
          cache: "no-store",
          credentials: "include",
        });

        if (res.status === 401) {
          router.push("/user/login");
          return;
        }

        if (!res.ok) {
          let msg = "Failed to fetch liked prompts";
          try {
            const data = await res.json();
            msg = data.error || msg;
          } catch { }
          if (!cancelled) setError(msg);
          return;
        }

        const data = await res.json();
        if (!cancelled) setPrompts(data.prompts || []);
      } catch (err) {
        if (!cancelled) setError("An unexpected error occurred.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

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
          <p className="text-red-400 mb-4">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121021] text-white py-8 px-4 sm:px-8 lg:px-20">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-extrabold text-white mb-2">Liked Prompts</h1>
          <p className="text-gray-400">
            {prompts.length === 0
              ? "You haven't liked any prompts yet."
              : `You liked ${prompts.length} prompt${prompts.length === 1 ? "" : "s"}.`}
          </p>
        </header>

        {prompts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400">Explore public prompts and like the ones you enjoy.</p>
          </div>
        ) : (
          <section
            aria-label="Liked prompts"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {prompts.map((p) => (
              <PromptCard
                key={p._id}
                title={p.title}
                category={p.category}
                visibility={p.visibility}
                promptSnippet={p.promptContent?.substring(0, 100) || ""}
                fullPrompt={p.promptContent || ""}
                imageUrl={p.media?.[0] || p.imageUrl}
                authorName={p.owner?.name || p.owner?.username || "Unknown"}
                authorImageUrl={p.owner?.imageUrl}
                likes={p.likes || 0}
                onDetails={() => {
                  // Optional: open your details modal here if you use it globally
                }}
              />
            ))}
          </section>
        )}
      </div>
    </div>
  );
}