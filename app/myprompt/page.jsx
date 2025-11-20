// app/myprompt/page.jsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PromptCard from "@/components/promptcard";
import PromptDetailModal from "@/components/PromptDetailModel";
import { Loader2 } from "lucide-react";

export default function MyPromptsPage() {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeView, setActiveView] = useState("all"); // 'all' | 'public' | 'private' | 'liked'
  const [userId, setUserId] = useState(null);

  // shared modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("view"); // "view" | "edit"
  const [selected, setSelected] = useState(null);

  const router = useRouter();

  // Fetch current user (to filter liked and to decide when to show likeCount)
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/user/me", {
          cache: "no-store",
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setUserId(data.user?._id || data.user?.id || null);
        }
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };
    fetchUser();
  }, []);

  // Fetch prompts by active tab
  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        setLoading(true);
        setError("");

        let apiEndpoint = "/api/prompts/mine";
        if (activeView === "private") apiEndpoint = "/api/prompts/privateprompt";
        if (activeView === "public") apiEndpoint = "/api/prompts/mine";
        if (activeView === "liked") apiEndpoint = "/api/prompts/liked";

        const res = await fetch(apiEndpoint, {
          cache: "no-store",
          credentials: "include",
        });

        if (res.status === 401) {
          router.push("/user/login");
          return;
        }
        if (!res.ok) {
          let msg = "Failed to fetch prompts";
          try {
            const data = await res.json();
            msg = data.error || msg;
          } catch {}
          setError(msg);
          return;
        }

        const data = await res.json();
        let fetched = data.prompts || [];

        // For the "Public" tab (mine endpoint), keep only my public prompts
        if (activeView === "public") {
          fetched = fetched.filter((p) => p.visibility === "public");
        }

        // Exclude user's own prompts in "Liked" view (only show others' prompts I liked)
        if (activeView === "liked" && userId) {
          fetched = fetched.filter(
            (p) => p.owner?._id !== userId && p.owner?.id !== userId
          );
        }

        setPrompts(fetched);
      } catch (err) {
        console.error("Error fetching prompts:", err);
        setError(`An unexpected error occurred: ${err.message || "Unknown error"}`);
      } finally {
        setLoading(false);
      }
    };

    fetchPrompts();
  }, [router, activeView, userId]);

  // Hard delete
  const handleDelete = async (id) => {
    if (!id) return;
    if (!confirm("This will permanently delete the prompt and its media. Continue?")) return;

    const prev = prompts;
    setPrompts((curr) => curr.filter((p) => p._id !== id));

    try {
      const res = await fetch(`/api/prompts/${id}?hard=1`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
    } catch (e) {
      alert(e?.message || "Failed to delete prompt");
      setPrompts(prev);
    }
  };

  // Modal handlers
  const openDetailsFor = (prompt) => {
    setSelected(prompt);
    setModalMode("view");
    setModalOpen(true);
  };

  const openEditFor = (prompt) => {
    setSelected(prompt);
    setModalMode("edit");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelected(null);
  };

  const applySaved = (updated) => {
    setPrompts((curr) => curr.map((p) => (p._id === updated._id ? updated : p)));
    setSelected(updated);
  };

  // Loading & Error UI
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
          <button
            onClick={() => router.push("/user/login")}
            className="px-4 py-2 bg-[#8B5CF6] hover:bg-[#7D49E0] rounded-lg transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Header helpers
  const getTitle = () => {
    switch (activeView) {
      case "public":
        return "My Public Prompts";
      case "private":
        return "My Private Prompts";
      case "liked":
        return "Liked Prompts";
      default:
        return "My Prompts";
    }
  };

  const getDescription = () => {
    switch (activeView) {
      case "public":
        return prompts.length
          ? `You have ${prompts.length} public prompt${prompts.length === 1 ? "" : "s"}.`
          : "You don't have any public prompts yet.";
      case "private":
        return prompts.length
          ? `You have ${prompts.length} private prompt${prompts.length === 1 ? "" : "s"}.`
          : "You don't have any private prompts yet.";
      case "liked":
        return prompts.length
          ? `You liked ${prompts.length} prompt${prompts.length === 1 ? "" : "s"} by other users.`
          : "You haven't liked any prompts from other users yet.";
      default:
        return prompts.length
          ? `You have ${prompts.length} prompt${prompts.length === 1 ? "" : "s"}.`
          : "You haven't created any prompts yet.";
    }
  };

  // Render
  return (
    <div className="min-h-screen bg-[#121021] text-white py-8 px-4 sm:px-8 lg:px-20">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-white mb-4">{getTitle()}</h1>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-4 mb-4">
            {[
              { key: "all", label: "My Prompts" },
              { key: "public", label: "Public Prompts" },
              { key: "private", label: "Private Prompts" },
              { key: "liked", label: "Liked Prompts" },
            ].map((btn) => (
              <button
                key={btn.key}
                onClick={() => setActiveView(btn.key)}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  activeView === btn.key
                    ? "bg-[#8B5CF6] text-white hover:bg-[#7D49E0]"
                    : "bg-[#1F1B2E] text-gray-300 hover:bg-[#2A2438] hover:text-white"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <p className="text-gray-400">{getDescription()}</p>
        </div>

        {/* Prompts Grid */}
        {prompts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 mb-6">
              {activeView === "liked"
                ? "Explore public prompts and like the ones you enjoy!"
                : "Start creating prompts to see them here!"}
            </p>
            {activeView !== "liked" && (
              <a
                href="/create-prompt/submitprompt"
                className="inline-block px-6 py-3 bg-[#8B5CF6] hover:bg-[#7D49E0] text-white font-medium rounded-lg transition-colors"
              >
                Create Your First Prompt
              </a>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {prompts.map((prompt) => {
              const isOwn =
                userId &&
                (prompt.owner?._id === userId || prompt.owner?.id === userId);

              return (
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
                  // Show like count ONLY on user's own prompts
                  showLikeCount={!!isOwn}
                  // Disable editing/deleting on liked view (not user’s prompts)
                  onDelete={
                    activeView === "liked" ? undefined : () => handleDelete(prompt._id)
                  }
                  onDetails={() => openDetailsFor(prompt)}
                  onUpdate={
                    activeView === "liked" ? undefined : () => openEditFor(prompt)
                  }
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Shared Modal */}
      <PromptDetailModal
        open={modalOpen}
        initialMode={modalMode}
        prompt={selected}
        onClose={closeModal}
        onSaved={applySaved}
      />
    </div>
  );
}