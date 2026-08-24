"use client";

import { useState } from "react";

export function ShareButtons({
  articleTitle,
  articleUrl,
}: {
  articleTitle: string;
  articleUrl: string;
}) {
  const [copied, setCopied] = useState(false);

  const shareLinks = [
    {
      label: "WhatsApp",
      href: `https://wa.me/?text=${encodeURIComponent(`${articleTitle} ${articleUrl}`)}`,
      className: "bg-green-600",
    },
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`,
      className: "bg-[#111b35]",
    },
    {
      label: "X",
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(articleTitle)}&url=${encodeURIComponent(articleUrl)}`,
      className: "bg-black",
    },
  ];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(articleUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="mt-6 flex flex-wrap items-center gap-3">
      <span className="mr-2 font-bold">Partager :</span>

      {shareLinks.map((button) => (
        <a
          key={button.label}
          href={button.href}
          target="_blank"
          rel="noreferrer"
          className={`rounded-full px-4 py-2 text-sm font-bold text-white ${button.className}`}
        >
          {button.label}
        </a>
      ))}

      <button
        type="button"
        onClick={handleCopy}
        className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800"
      >
        {copied ? "Lien copié" : "Copier le lien"}
      </button>
    </div>
  );
}
