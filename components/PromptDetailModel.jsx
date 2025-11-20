// components/PromptDetailModal.jsx
"use client";
import { useEffect, useState } from "react";
import { X, Save, Pencil, Copy as CopyIcon } from "lucide-react";

/**
 * PromptDetailModal
 *
 * Props:
 *  - open (bool)
 *  - initialMode ("view" | "edit")
 *  - prompt (object) full prompt doc
 *  - onClose ()
 *  - onSaved(updatedDoc)
 *
 * Notes:
 *  - Adds an "Open with" dropdown which creates a best-effort link for each platform.
 *  - We prefer stable web URLs (chat.openai.com, perplexity.ai/search, google search, x.ai/grok)
 *    because web URLs commonly act as universal links that open native apps when available.
 *  - If vendors publish official app URL schemes in the future, you can add them to the map.
 */
export default function PromptDetailModal({
  open,
  initialMode = "view", // "view" | "edit"
  prompt, // full prompt doc
  onClose,
  onSaved, // (updatedDoc) => void
}) {
  const [editMode, setEditMode] = useState(initialMode === "edit");
  const [form, setForm] = useState({
    title: "",
    category: "",
    visibility: "private",
    prompt: "",
  });
  const [saving, setSaving] = useState(false);
  const [newFiles, setNewFiles] = useState([]); // replacement media files (optional)

  // categories
  const [categories, setCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(true);

  // open-with state
  const [openWith, setOpenWith] = useState("chatgpt");
  const [isMobile, setIsMobile] = useState(false);

  // hydrate on prompt change / open
  useEffect(() => {
    if (!prompt) return;
    setForm({
      title: prompt.title || "",
      category: prompt.category || "",
      visibility: prompt.visibility || "private",
      prompt: prompt.promptContent || "",
    });
    setNewFiles([]);
    setEditMode(initialMode === "edit");
  }, [prompt, initialMode]);

  // detect mobile
  useEffect(() => {
    const ua = typeof navigator !== "undefined" ? navigator.userAgent || "" : "";
    setIsMobile(/Mobi|Android|iPhone|iPad|iPod/i.test(ua));
  }, []);

  // load categories when modal opens
  useEffect(() => {
    if (!open) return;
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
  }, [open]);

  const handleFormChange = (e) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(form.prompt || prompt?.promptContent || "");
      // optionally show toast
    } catch {
      // ignore
    }
  };

  // ---- SAVE: upload -> send urls + publicIds -> PATCH ----
  const handleSave = async () => {
    if (!prompt?._id) return;
    setSaving(true);
    try {
      let media = undefined; // array of URLs
      let mediaPublicIds = undefined; // array of Cloudinary public_ids (same order as URLs)

      if (newFiles.length) {
        const fd = new FormData();
        newFiles.forEach((f) => fd.append("files", f));
        const up = await fetch("/api/upload", { method: "POST", body: fd, credentials: "include" });
        const data = await up.json();
        if (!up.ok) {
          throw new Error(data?.error || "Upload failed");
        }
        media = data.urls; // e.g. ["https://res.cloudinary.com/..."]
        mediaPublicIds = data.publicIds; // e.g. ["folder/file", ...]
      }

      const payload = {
        title: form.title,
        category: form.category,
        visibility: form.visibility,
        prompt: form.prompt, // maps to promptContent on backend
        ...(media ? { media } : {}),
        ...(mediaPublicIds ? { mediaPublicIds } : {}),
      };

      const res = await fetch(`/api/prompts/${prompt._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Failed to update");
      }

      const updated = await res.json();
      onSaved?.(updated);
      setEditMode(false);
      setNewFiles([]);
    } catch (e) {
      alert(e?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  // Build "open with" URL for selected platform and prompt text
  // We intentionally prefer web URLs that often act as universal links.
  // Add / change mappings when official schemes become available.
  function buildOpenUrl(platformKey, text) {
    const q = encodeURIComponent(text || "");
    switch (platformKey) {
      case "chatgpt":
        // ChatGPT web supports `https://chat.openai.com/?q=...` which may open app via universal links.
        return `https://chat.openai.com/?q=${q}`;
      case "perplexity":
        // Perplexity supports search via query param
        return `https://www.perplexity.ai/search/?q=${q}`;
      case "google":
        // Use Google search as a gateway to Gemini; Gemini at present doesn't support a stable public query URL
        return `https://www.google.com/search?q=${q}`;
      case "grok":
        // xAI/Grok: open XAI web or site search. If a dedicated web search exists, use it else fallback to site search.
        // Best-effort: x.ai currently points to x.ai or grok pages; open their search endpoint if available.
        // Fallback to a Google site search for 'grok x.ai'
        return `https://www.google.com/search?q=${q}+site:x.ai`;
      default:
        return `https://www.google.com/search?q=${q}`;
    }
  }

  // open 'Open with' target in new tab/window
  const handleOpenWith = () => {
    if (!prompt) return;
    const text = form.prompt || prompt.promptContent || "";
    if (!text) {
      alert("No prompt content to open with.");
      return;
    }
    const url = buildOpenUrl(openWith, text);
    // Use window.open so we open a new tab or trigger the app via universal link.
    try {
      window.open(url, "_blank", "noopener noreferrer");
    } catch {
      // Last-resort fallback: set location
      window.location.href = url;
    }
  };

  if (!open || !prompt) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center" aria-modal="true" role="dialog">
      {/* overlay */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* panel */}
      <div className="relative z-50 w-full sm:max-w-3xl lg:max-w-4xl max-h[90vh] sm:max-h-[90vh] overflow-y-auto bg-[#1a1828] border border-[#2a273b] rounded-t-2xl sm:rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-[#2a273b] bg-[#1a1828]">
          <h2 className="text-xl font-bold text-white">Prompt Details</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg border border-[#3e3b4a] text-gray-300 hover:text-white hover:border-[#8B5CF6] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-6">
          {/* Media preview */}
          {Array.isArray(prompt.media) && prompt.media.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {prompt.media.map((url) => (
                <div key={url} className="overflow-hidden rounded-xl border border-[#2a273b]">
                  {/\.(mp4|webm|mov|m4v|ogv)$/i.test(url) ? (
                    <video src={url} controls className="w-full h-56 object-cover" />
                  ) : (
                    <img src={url} alt="" className="w-full h-56 object-cover" />
                  )}
                </div>
              ))}
            </div>
          ) : prompt.imageUrl ? (
            <img src={prompt.imageUrl} alt="" className="w-full h-56 object-cover rounded-xl border border-[#2a273b]" />
          ) : null}

          {/* ===== VIEW MODE ===== */}
          {!editMode && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Title">{prompt.title || "-"}</Field>
                <Field label="Category">{prompt.category || "-"}</Field>
                <Field label="Visibility" valueClass={prompt.visibility === "public" ? "text-blue-300" : "text-gray-300"}>
                  {prompt.visibility || "-"}
                </Field>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm text-gray-300">Prompt Content</label>

                  <div className="flex items-center gap-3">
                    {/* Copy button */}
                    <button
                      onClick={copyPrompt}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-[#3e3b4a] text-gray-300 hover:text-white hover:border-[#8B5CF6] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
                      title="Copy prompt"
                    >
                      <CopyIcon className="w-4 h-4" />
                      Copy
                    </button>

                    {/* Open with dropdown */}
                    <div className="flex items-center gap-2">
                      <label htmlFor="openWith" className="sr-only">Open with</label>
                      <select
                        id="openWith"
                        value={openWith}
                        onChange={(e) => setOpenWith(e.target.value)}
                        className="rounded-lg bg-[#24223A] border border-[#3e3b4a] px-2 py-1 text-sm text-gray-200 outline-none focus:ring-2 focus:ring-[#8B5CF6]"
                        title={isMobile ? "Open in mobile app (if supported) or web" : "Open in web app"}
                      >
                        <option value="chatgpt">ChatGPT</option>
                        <option value="perplexity">Perplexity</option>
                        <option value="google">Google (Gemini / Search)</option>
                        <option value="grok">Grok (xAI)</option>
                      </select>
                      <button
                        onClick={handleOpenWith}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#8B5CF6] text-white hover:bg-[#7D49E0] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
                        title="Open prompt in selected app / site"
                      >
                        Open
                      </button>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-[#24223A] border border-[#3e3b4a] p-4 text-gray-200 whitespace-pre-wrap">
                  {prompt.promptContent || "-"}
                </div>
              </div>
            </div>
          )}

          {/* ===== EDIT MODE ===== */}
          {editMode && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="title" className="block text-sm text-gray-300 mb-1">Title</label>
                <input
                  id="title"
                  value={form.title}
                  onChange={handleFormChange}
                  className="w-full rounded-lg bg-[#24223A] border border-[#3e3b4a] px-3 py-2 text-white outline-none focus:ring-2 focus:ring-[#8B5CF6]"
                  placeholder="Title"
                />
              </div>

              <div>
                <label htmlFor="category" className="block text-sm text-gray-300 mb-1">Category</label>
                <select
                  id="category"
                  value={form.category}
                  onChange={handleFormChange}
                  className="w-full rounded-lg bg-[#24223A] border border-[#3e3b4a] px-3 py-2 text-gray-300 outline-none focus:ring-2 focus:ring-[#8B5CF6]"
                  disabled={catLoading || categories.length === 0}
                >
                  <option value="">{catLoading ? "Loading..." : "Select a category"}</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="visibility" className="block text-sm text-gray-300 mb-1">Visibility</label>
                <select
                  id="visibility"
                  value={form.visibility}
                  onChange={handleFormChange}
                  className="w-full rounded-lg bg-[#24223A] border border-[#3e3b4a] px-3 py-2 text-gray-300 outline-none focus:ring-2 focus:ring-[#8B5CF6]"
                >
                  <option value="private">Private</option>
                  <option value="public">Public</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="prompt" className="block text-sm text-gray-300 mb-1">Prompt Content</label>
                <textarea
                  id="prompt"
                  rows={6}
                  value={form.prompt}
                  onChange={handleFormChange}
                  className="w-full rounded-lg bg-[#24223A] border border-[#3e3b4a] px-3 py-2 text-gray-200 outline-none focus:ring-2 focus:ring-[#8B5CF6] resize-y"
                  placeholder="Write the full prompt here"
                />
              </div>

              {/* Replace media (optional) */}
              <div className="sm:col-span-2">
                <label className="block text-sm text-gray-300 mb-1">Replace Media (optional)</label>
                <label
                  htmlFor="detail-upload"
                  className="flex flex-col items-center justify-center border-2 border-dashed border-[#3e3b4a] rounded-lg p-6 text-center cursor-pointer hover:border-[#8B5CF6] transition-colors duration-200"
                >
                  <svg className="w-10 h-10 text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <p className="text-gray-400 mb-1">
                    Drag & drop files or <span className="text-[#8B5CF6] font-semibold">Browse</span>
                  </p>
                  <p className="text-xs text-gray-500">JPG, PNG, GIF, MP4 (Max 10MB each)</p>
                  <input
                    id="detail-upload"
                    type="file"
                    className="hidden"
                    multiple
                    accept="image/*,video/*"
                    onChange={(e) => setNewFiles(Array.from(e.target.files))}
                  />
                </label>
                {!!newFiles.length && (
                  <p className="mt-2 text-xs text-gray-400">{newFiles.length} file(s) selected</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="sticky bottom-0 px-5 py-4 border-t border-[#2a273b] bg-[#1a1828] flex items-center justify-end gap-3">
          {!editMode ? (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-[#3e3b4a] text-gray-300 hover:text-white hover:border-[#8B5CF6] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
              >
                Close
              </button>
              <button
                onClick={() => setEditMode(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#8B5CF6] hover:bg-[#7D49E0]"
              >
                <Pencil className="w-4 h-4" />
                Update
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setForm({
                    title: prompt.title || "",
                    category: prompt.category || "",
                    visibility: prompt.visibility || "private",
                    prompt: prompt.promptContent || "",
                  });
                  setNewFiles([]);
                  setEditMode(false);
                }}
                className="px-4 py-2 rounded-lg border border-[#3e3b4a] text-gray-300 hover:text-white hover:border-[#8B5CF6] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#8B5CF6] hover:bg-[#7D49E0] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, valueClass = "text-gray-200" }) {
  return (
    <div className="rounded-lg bg-[#24223A] border border-[#3e3b4a] p-3">
      <div className="text-xs uppercase tracking-wide text-gray-400 mb-1">{label}</div>
      <div className={`text-sm ${valueClass}`}>{children}</div>
    </div>
  );
}
