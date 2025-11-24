// app/myprompt/page.jsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PromptCard from "@/components/PromptCard";
import PromptDetailModal from "@/components/PromptDetailModel";
import { Loader2 } from "lucide-react";

export default function MyPromptsPage() {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeView, setActiveView] = useState("all"); // all | public | private | liked
  const [userId, setUserId] = useState(null);

  // modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("view");
  const [selected, setSelected] = useState(null);

  const router = useRouter();

  // Fetch current user id
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const r = await fetch("/api/user/me", {
          credentials: "include",
          cache: "no-store",
        });

        if (!r.ok) return;

        const data = await r.json();
        setUserId(data?.user?.id || null);
      } catch (err) {
        console.error("Fetch user error:", err);
      }
    };

    fetchUser();
  }, []);

  // Fetch prompts when tab/user changes
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");

        let api = "/api/prompts/mine";
        if (activeView === "private") api = "/api/prompts/privateprompt";
        if (activeView === "liked") api = "/api/prompts/liked";

        const r = await fetch(api, {
          credentials: "include",
          cache: "no-store",
        });

        if (r.status === 401) {
          router.push("/user/login");
          return;
        }

        if (!r.ok) {
          const msg = (await r.json().catch(() => ({}))).error || "Failed to fetch prompts";
          setError(msg);
          return;
        }

        let data = await r.json();
        let list = data.prompts || [];

        // PUBLIC TAB: filter only my public prompts
        if (activeView === "public" && userId) {
          list = list.filter((p) => p.ownerId === userId && p.visibility === "public");
        }

        // LIKED TAB: only show others’ public prompts
        if (activeView === "liked" && userId) {
          list = list.filter((p) => p.ownerId !== userId);
        }

        setPrompts(list);
      } catch (err) {
        console.error("Error fetching prompts:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [activeView, userId, router]);

  // HARD DELETE prompt
  const handleDelete = async (id) => {
    if (!id) return;
    if (!confirm("This will permanently delete this prompt. Continue?")) return;

    const prev = prompts;
    setPrompts((curr) => curr.filter((p) => p.id !== id));

    try {
      const r = await fetch(`/api/prompts/${id}?hard=1`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!r.ok) throw new Error(await r.text());
    } catch (e) {
      alert(e.message || "Failed to delete");
      setPrompts(prev);
    }
  };

  // MODAL HELPERS
  const openDetailsFor = (p) => {
    setSelected(p);
    setModalMode("view");
    setModalOpen(true);
  };

  const openEditFor = (p) => {
    setSelected(p);
    setModalMode("edit");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelected(null);
  };

  const applySaved = (updated) => {
    setPrompts((curr) => curr.map((p) => (p.id === updated.id ? updated : p)));
    setSelected(updated);
  };

  // UI fallback
  if (loading) {
    return (
      <div className="min-h-screen bg-[#121021] flex justify-center items-center">
        <Loader2 className="w-12 h-12 text-[#8B5CF6] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#121021] text-white flex flex-col gap-4 justify-center items-center">
        <p className="text-red-400">{error}</p>
        <button
          onClick={() => router.push("/user/login")}
          className="px-4 py-2 bg-[#8B5CF6] hover:bg-[#7D49E0] rounded-lg"
        >
          Go to Login
        </button>
      </div>
    );
  }

  const filterButtons = [
    { key: "all", label: "My Prompts" },
    { key: "public", label: "Public Prompts" },
    { key: "private", label: "Private Prompts" },
    { key: "liked", label: "Liked Prompts" },
  ];

  return (
    <div className="min-h-screen bg-[#121021] text-white py-10 px-4 sm:px-8 lg:px-20">
      <div className="max-w-7xl mx-auto">

        {/* Tabs */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold mb-5">
            {activeView === "public"
              ? "My Public Prompts"
              : activeView === "private"
              ? "My Private Prompts"
              : activeView === "liked"
              ? "Liked Prompts"
              : "My Prompts"}
          </h1>

          <div className="flex gap-4 mb-3 flex-wrap">
            {filterButtons.map((btn) => (
              <button
                key={btn.key}
                onClick={() => setActiveView(btn.key)}
                className={`px-6 py-2 rounded-lg transition ${
                  activeView === btn.key
                    ? "bg-[#8B5CF6] text-white"
                    : "bg-[#1F1B2E] text-gray-300 hover:bg-[#2A2438]"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <p className="text-gray-400">
            {prompts.length
              ? `${prompts.length} prompt${prompts.length === 1 ? "" : "s"}`
              : "No prompts found"}
          </p>
        </div>

        {/* Empty state */}
        {prompts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 mb-6">
              {activeView === "liked"
                ? "You haven't liked any prompts yet."
                : "Start creating prompts!"}
            </p>

            {activeView !== "liked" && (
              <a
                href="/create-prompt/submitprompt"
                className="px-6 py-3 bg-[#8B5CF6] hover:bg-[#7D49E0] rounded-lg"
              >
                Create Your First Prompt
              </a>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {prompts.map((p) => {
              const isOwn = userId && p.ownerId === userId;

              return (
                <PromptCard
                  key={p.id}
                  id={p.id}
                  title={p.title}
                  category={p.category}
                  visibility={p.visibility}
                  promptSnippet={p.promptContent?.slice(0, 100) || ""}
                  imageUrl={p.media?.[0] || null}
                  authorName={p.owner?.name || p.owner?.username}
                  likes={p.likesCount}
                  showLikeCount={isOwn} // Only show on own prompts
                  onDetails={() => openDetailsFor(p)}
                  onUpdate={isOwn ? () => openEditFor(p) : undefined}
                  onDelete={isOwn ? () => handleDelete(p.id) : undefined}
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
