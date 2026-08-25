"use client";

import { useMemo, useState } from "react";

export function ShareButtons({
  articleTitle,
  articleUrl,
}: {
  articleTitle: string;
  articleUrl?: string;
}) {
  const [copied, setCopied] = useState(false);

  const currentUrl = useMemo(() => {
    if (articleUrl) return articleUrl;
    if (typeof window !== "undefined") return window.location.href;
    return "";
  }, [articleUrl]);

  const shareLinks = [
    {
      label: "WhatsApp",
      href: `https://wa.me/?text=${encodeURIComponent(`${articleTitle} ${currentUrl}`)}`,
      className: "bg-green-600",
    },
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`,
      className: "bg-[#111b35]",
    },
    {
      label: "X",
      href: `https://x.com/intent/tweet?text=${encodeURIComponent(articleTitle)}&url=${encodeURIComponent(currentUrl)}`,
      className: "bg-black",
    },
  ];

  const handleCopy = async () => {
    if (!currentUrl) return;

    try {
      await navigator.clipboard.writeText(currentUrl);
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
          rel="noreferrer noopener"
          className="inline-flex min-h-[44px] items-center justify-center rounded-full px-4 py-2 text-sm font-bold text-white transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#111b35] focus:ring-offset-2 sm:min-h-0"
          style={{ backgroundColor: button.className.includes("bg-green") ? "#16a34a" : button.className.includes("bg-[#111b35]") ? "#111b35" : "#000000" }}
        >
          {button.label}
        </a>
      ))}

      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
      >
        {copied ? "Lien copié" : "Copier le lien"}
      </button>
    </div>
  );
}
