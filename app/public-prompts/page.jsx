// app/public-prompts/page.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import PromptCard from "@/components/PromptCard";
import PromptDetailModal from "@/components/PromptDetailModel";
import { Loader2, Search } from "lucide-react";

export default function PublicPromptsPage() {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("recent");
  const [cursor, setCursor] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const [perPage, setPerPage] = useState(20);
  const [sampledFirstPage, setSampledFirstPage] = useState(false);

  const [categories, setCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("view");
  const [selectedPrompt, setSelectedPrompt] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setCatLoading(true);
        const r = await fetch("/api/categories", { cache: "no-store" });
        const data = await r.json();
        setCategories(data?.categories || []);
      } catch {
        setCategories([]);
      } finally {
        setCatLoading(false);
      }
    })();
  }, []);

  const params = useMemo(() => {
    const p = new URLSearchParams();
    if (q.trim()) p.set("q", q.trim());
    if (category) p.set("category", category);
    p.set("sort", sort);
    p.set("limit", String(perPage));
    p.set("cursor", String(cursor));
    return p.toString();
  }, [q, category, sort, cursor, perPage]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        if (!sampledFirstPage && !q && !category && cursor === 0) {
          const sampleUrl = `/api/prompts/publicprompt?sample=1&limit=20`;
          const res = await fetch(sampleUrl, { cache: "no-store" });
          const data = await res.json();

          if (!cancelled) {
            setPrompts(data.prompts || []);
            setHasMore(!!data.hasMore);
            setSampledFirstPage(true);
          }
          return;
        }

        const res = await fetch(`/api/prompts/publicprompt?${params}`, {
          cache: "no-store",
        });
        const data = await res.json();

        if (!cancelled) {
          if (cursor === 0) {
            setPrompts(data.prompts || []);
          } else {
            setPrompts((prev) => [...prev, ...(data.prompts || [])]);
          }
          setHasMore(!!data.hasMore);
        }
      } catch {
        if (!cancelled) {
          if (cursor === 0) setPrompts([]);
          setHasMore(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [params, cursor, sampledFirstPage, q, category]);

  const newSearch = (e) => {
    e.preventDefault();
    setSampledFirstPage(true);
    setCursor(0);
  };

  const onPerPageChange = (e) => {
    const v = parseInt(e.target.value, 10);
    setPerPage(v);
    setSampledFirstPage(true);
    setCursor(0);
  };

  const loadNext = () => {
    setCursor((c) => c + perPage);
  };

  const openDetails = (prompt) => {
    setSelectedPrompt(prompt);
    setModalMode("view");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedPrompt(null);
  };

  const onSaved = (updated) => {
    setPrompts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setSelectedPrompt(updated);
  };

  return (
    <div className="min-h-screen bg-[#121021] text-white py-8 px-4 sm:px-8 lg:px-20">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6">
          <h1 className="text-4xl font-extrabold">Public Prompts</h1>
          <p className="text-gray-400 mt-1">
            Browse, search, sort, like, and share prompts from the community.
          </p>
        </header>

        <form
          onSubmit={newSearch}
          className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6"
        >
          <div className="flex gap-3 flex-1 items-end flex-wrap">
            <div className="flex-1 relative min-w-[240px]">
              <input
                type="text"
                className="w-full rounded-lg bg-[#1a1828] border border-[#2a273b] px-10 py-2 text-gray-200 outline-none focus:ring-2 focus:ring-[#8B5CF6]"
                placeholder="Search by title…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            <select
              id="perPage"
              className="rounded-lg bg-[#1a1828] border border-[#2a273b] px-3 py-2 text-gray-300 focus:ring-2 focus:ring-[#8B5CF6]"
              value={perPage}
              onChange={onPerPageChange}
            >
              <option value={20}>Items per page: 20</option>
              <option value={30}>Items per page: 30</option>
              <option value={50}>Items per page: 50</option>
            </select>

            <select
              id="category"
              className="rounded-lg bg-[#1a1828] border border-[#2a273b] px-3 py-2 text-gray-300 focus:ring-2 focus:ring-[#8B5CF6]"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setSampledFirstPage(true);
                setCursor(0);
              }}
              disabled={catLoading}
            >
              <option value="">
                {catLoading ? "Loading categories…" : "All categories"}
              </option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              id="sort"
              className="rounded-lg bg-[#1a1828] border border-[#2a273b] px-3 py-2 text-gray-300 focus:ring-2 focus:ring-[#8B5CF6]"
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setSampledFirstPage(true);
                setCursor(0);
              }}
            >
              <option value="recent">Most Recent</option>
              <option value="likes">Most Liked</option>
            </select>
          </div>

          <button
            type="submit"
            className="rounded-lg px-4 py-2 bg-blue-600 hover:bg-blue-700"
          >
            Apply
          </button>
        </form>

        {loading && cursor === 0 ? (
          <div className="flex items-center gap-3 text-blue-700">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-blue-300 border-t-transparent" />
            <span className="text-sm">Loading…</span>
          </div>
        ) : prompts.length === 0 ? (
          <p className="text-sm text-slate-300 bg-slate-900/30 border border-slate-700/40 rounded-lg px-3 py-2">
            No public prompts found.
          </p>
        ) : (
          <>
            <section
              aria-label="Prompts"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {prompts.map((p) => (
                <PromptCard
                  key={p.id}
                  id={p.id}
                  title={p.title}
                  category={p.category}
                  visibility={p.visibility}
                  promptSnippet={p.promptContent?.substring(0, 100) || ""}
                  fullPrompt={p.promptContent}
                  imageUrl={p.media?.[0] || p.imageUrl}
                  authorName={p.owner?.name || p.owner?.username || "Unknown"}
                  authorImageUrl={p.owner?.imageUrl}
                  likes={p.likesCount ?? 0}
                  showLikeCount={false}
                  onDetails={() => openDetails(p)}
                />
              ))}
            </section>

            <div className="mt-8 flex justify-center">
              {hasMore ? (
                <button
                  onClick={loadNext}
                  className="px-4 py-2 rounded-lg bg-[#1F1B2E] hover:bg-[#2A2438] border border-[#2a273b]"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Next"
                  )}
                </button>
              ) : (
                <span className="text-sm text-gray-500">No more results.</span>
              )}
            </div>
          </>
        )}
      </div>

      <PromptDetailModal
        open={modalOpen}
        initialMode={modalMode}
        prompt={selectedPrompt}
        onClose={closeModal}
        onSaved={onSaved}
      />
    </div>
  );
}
