// components/LikeButton.jsx
"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";

export default function LikeButton({ promptId, initialCount }) {
  const [count, setCount] = useState(initialCount ?? 0);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadedOnce, setLoadedOnce] = useState(false);

  // Load initial liked state + authoritative count (always send cookies)
  useEffect(() => {
    let canceled = false;

    (async () => {
      try {
        const res = await fetch(`/api/prompts/${promptId}/like`, {
          method: "GET",
          cache: "no-store",
          credentials: "include", // <-- always send cookies
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!canceled) {
          setCount(typeof data.likes === "number" ? data.likes : (initialCount ?? 0));
          setLiked(!!data.liked);
          setLoadedOnce(true);
        }
      } catch {
        // ignore
      }
    })();

    return () => {
      canceled = true;
    };
  }, [promptId, initialCount]);

  const toggle = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/prompts/${promptId}/like`, {
        method: "POST",
        credentials: "include", // <-- always send cookies
      });

      if (res.status === 401) {
        alert("Please log in to like prompts.");
        return;
      }
      if (!res.ok) {
        const t = await res.text();
        console.error("Toggle like failed:", t);
        return;
      }

      const data = await res.json();
      if (typeof data.likes === "number") setCount(data.likes);
      if (typeof data.liked === "boolean") setLiked(data.liked);
    } catch (e) {
      console.error("Toggle like error:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading || !loadedOnce}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
        liked ? "border-blue-500 text-white" : "border-[#3e3b4a] text-gray-300"
      } hover:text-white hover:border-[#8B5CF6] disabled:opacity-60`}
      title={liked ? "Unlike" : "Like"}
      aria-pressed={liked}
    >
      <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
      <span className="text-sm">{count}</span>
    </button>
  );
}