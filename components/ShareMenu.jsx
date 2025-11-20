// components/ShareMenu.jsx
"use client";
import { useState } from "react";
import { Share2, Link as LinkIcon } from "lucide-react";

export default function ShareMenu({ url, title }) {
  const [open, setOpen] = useState(false);

  const webShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (e) {
        // user canceled
      }
    }
    setOpen((v) => !v);
  };

  const platforms = [
    { label: "WhatsApp", href: `https://wa.me/?text=${encodeURIComponent(`${title} — ${url}`)}` },
    { label: "Telegram", href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}` },
    { label: "Twitter / X", href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}` },
    { label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}` },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
  ];

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      alert("Link copied!");
    } catch {}
  };

  return (
    <div className="relative">
      <button
        onClick={webShare}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#3e3b4a] text-gray-300 hover:text-white hover:border-[#8B5CF6]"
        title="Share"
      >
        <Share2 className="w-4 h-4" />
        Share
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl border border-[#3e3b4a] bg-[#1f1b30] shadow-lg z-20 p-2">
          <button
            className="w-full inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-200 hover:bg-[#2a253f] rounded-lg"
            onClick={copyLink}
          >
            <LinkIcon className="w-4 h-4" />
            Copy link
          </button>
          <div className="my-1 h-px bg-[#2a273b]" />
          {platforms.map((p) => (
            <a
              key={p.label}
              href={p.href}
              target="_blank"
              rel="noreferrer"
              className="block px-3 py-2 text-sm text-gray-200 hover:bg-[#2a253f] rounded-lg"
            >
              {p.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}