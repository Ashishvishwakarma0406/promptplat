"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  Globe,
  Lock,
  User,
  ExternalLink,
  MoreHorizontal,
  Pencil,
  Trash2,
  Heart,
} from "lucide-react";
import LikeButton from "@/components/LikeButton";
import ShareMenu from "@/components/ShareMenu";


const PromptCard = ({
  id,
  title,
  category,
  visibility = "private",
  promptSnippet,
  fullPrompt,
  imageUrl,
  authorName,
  authorImageUrl,
  likes = 0,
  showLikeCount = false,
  onUpdate,
  onDelete,
  onDetails,
}) => {
  const VisibilityIcon = visibility === "public" ? Globe : Lock;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullPrompt || promptSnippet || "");
    } catch {}
  };

  // dropdown menu
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  useEffect(() => {
    const onDocClick = (e) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // construct share url (best-effort; window may be undefined in SSR)
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/public-prompts?prompt=${encodeURIComponent(id)}`
      : "";

  return (
    <article className="flex flex-col bg-[#1a1828] rounded-2xl border border-[#2a273b] overflow-hidden transition-all duration-300 ease-in-out hover:shadow-2xl hover:shadow-[#8B5CF6]/10 hover:-translate-y-1">
      {/* Image */}
      <div className="relative">
        <img
          src={imageUrl || "https://placehold.co/600x400/24223A/3e3b4a?text=Prompt+Image"}
          alt={`${title || "Prompt"} preview`}
          className="w-full h-56 object-cover"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "https://placehold.co/600x400/24223A/3e3b4a?text=Image+Not+Found";
          }}
        />
        <span
          className={`absolute top-4 left-4 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
            visibility === "public" ? "bg-blue-600/90 text-white" : "bg-[#24223A]/90 text-gray-300"
          }`}
        >
          <VisibilityIcon className="w-3.5 h-3.5 mr-1.5" />
          {visibility === "public" ? "Public" : "Private"}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-grow p-5">
        {/* Category + optional like count */}
        <div className="flex justify-between items-center mb-2">
          <span className="inline-block bg-[#24223A] text-[#8B5CF6] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            {category || "General"}
          </span>

          {showLikeCount && typeof likes === "number" && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-300">
              <Heart className="w-3.5 h-3.5" />
              {Math.max(0, likes)}
            </span>
          )}
        </div>

        {/* Title */}
        <h3
          className="text-xl font-bold text-white mb-2 truncate hover:text-[#8B5CF6] transition-colors cursor-pointer"
          title={title}
        >
          {title || "Untitled Prompt"}
        </h3>

        {/* Snippet */}
        <p className="text-gray-400 text-sm mb-4 line-clamp-2 h-[40px] flex-grow">
          {promptSnippet || "No prompt content provided."}
        </p>

        {/* Author + actions (kebab) */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center">
            {authorImageUrl ? (
              <img
                src={authorImageUrl}
                alt={authorName}
                className="w-8 h-8 rounded-full mr-3 border-2 border-[#3e3b4a]"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "";
                }}
              />
            ) : (
              <span className="flex items-center justify-center w-8 h-8 rounded-full mr-3 bg-[#24223A] border-2 border-[#3e3b4a]">
                <User className="w-4 h-4 text-[#8B5CF6]" />
              </span>
            )}
            <span className="text-sm font-medium text-gray-300">
              {authorName || "Anonymous"}
            </span>
          </div>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="p-2 rounded-lg border border-[#3e3b4a] text-gray-300 hover:text-white hover:border-[#8B5CF6] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
              aria-haspopup="menu"
              aria-expanded={open}
              aria-label="More actions"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-40 rounded-xl border border-[#3e3b4a] bg-[#1f1b30] shadow-lg z-20">
                {onUpdate && (
                  <button
                    role="menuitem"
                    onClick={() => {
                      setOpen(false);
                      onUpdate();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-200 hover:bg-[#2a253f] rounded-lg"
                  >
                    <Pencil className="w-4 h-4 text-[#8B5CF6]" />
                    Update
                  </button>
                )}
                {onDelete && (
                  <button
                    role="menuitem"
                    onClick={() => {
                      setOpen(false);
                      onDelete();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-300 hover:bg-[#2a253f] rounded-lg"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer actions
            - public: ShareMenu | Details | LikeButton
            - private: Details only
        */}
        <div className="flex items-center space-x-3 pt-4 border-t border-[#2a273b] mt-auto">
          {visibility === "public" ? (
            <>
              <div className="flex-1">
                <ShareMenu title={title || "Prompt"} url={shareUrl} />
              </div>

              <button
                onClick={() => typeof onDetails === "function" && onDetails()}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-300 bg-transparent border border-[#3e3b4a] rounded-lg hover:border-[#8B5CF6] hover:text-[#8B5CF6] transition-colors focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
                title="Details"
              >
                <ExternalLink className="w-4 h-4" />
                Details
              </button>

              <div className="flex-1 flex justify-end">
                <LikeButton promptId={id} initialCount={likes ?? 0} />
              </div>
            </>
          ) : (
            <div className="w-full">
              <button
                onClick={() => typeof onDetails === "function" && onDetails()}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-300 bg-transparent border border-[#3e3b4a] rounded-lg hover:border-[#8B5CF6] hover:text-[#8B5CF6] transition-colors focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
                title="Details"
              >
                <ExternalLink className="w-4 h-4" />
                Details
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

export default PromptCard;
