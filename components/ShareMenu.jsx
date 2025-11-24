"use client";
import { useState, useRef, useEffect } from "react";
import { Share2, Link as LinkIcon } from "lucide-react";

export default function ShareMenu({ url, title }) {
  const [open, setOpen] = useState(false);

  const toggleMenu = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (_) {}
    }
    setOpen((v) => !v);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      alert("Link copied!");
    } catch {}
  };

  const platforms = [
    {
      label: "WhatsApp",
      href: `https://wa.me/?text=${encodeURIComponent(`${title} — ${url}`)}`,
    },
    {
      label: "Telegram",
      href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    },
    {
      label: "Twitter / X",
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
    },
    {
      label: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    },
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
  ];

  return (
    <div className="relative flex justify-center">
      {/* SHARE BUTTON */}
      <button
        onClick={toggleMenu}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#3e3b4a] 
                 text-gray-300 hover:text-white hover:border-[#8B5CF6]"
      >
        <Share2 className="w-4 h-4" />
        Share
      </button>

      {/* MENU */}
      {open && (
        <div
          className="
            absolute 
            bottom-full mb-2 
            left-1/2 -translate-x-6 
            w-52 
            rounded-xl border border-[#3e3b4a] 
            bg-[#1f1b30] shadow-xl z-40 
            p-2 animate-fadeIn
          "
        >
          {/* Copy Link */}
          <button
            onClick={copyLink}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-200 
                       hover:bg-[#2a253f] rounded-lg"
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
