"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";

export default function LikeButton({ promptId, initialCount = 0 }) {
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(false);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!promptId) return;
      try {
        const res = await fetch(`/api/prompts/${promptId}/like`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          setCount(typeof data.likes === "number" ? data.likes : initialCount);
          setLiked(!!data.liked);
          setReady(true);
        }
      } catch (e) {
        // swallow network errors; leave initial values
        console.error("LikeButton load error:", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [promptId, initialCount]);

  async function toggleLike() {
    if (loading || !promptId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/prompts/${promptId}/like`, {
        method: "POST",
        credentials: "include",
      });

      if (res.status === 401) {
        // lightweight UX
        alert("Please log in to like prompts.");
        return;
      }
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("Like toggle failed:", text);
        return;
      }

      const data = await res.json();
      setLiked(Boolean(data.liked));
      setCount(Math.max(0, Number(data.likes ?? 0)));
    } catch (e) {
      console.error("Toggle like error:", e);
    } finally {
      setLoading(false);
    }
  }

  // disabled placeholder while loading initial state
  if (!ready) {
    return (
      <button
        disabled
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#3e3b4a] text-gray-400 opacity-60"
        aria-hidden
      >
        <Heart className="w-4 h-4" />
        <span>{count}</span>
      </button>
    );
  }

  return (
    <button
      onClick={toggleLike}
      disabled={loading}
      aria-pressed={liked}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border transition ${
        liked ? "border-blue-500 text-blue-300" : "border-[#3e3b4a] text-gray-300"
      } hover:border-[#8B5CF6] hover:text-white`}
    >
      <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
      <span>{count}</span>
    </button>
  );
}
