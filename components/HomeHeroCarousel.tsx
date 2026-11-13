"use client";

import Link from "next/link";
import { useState } from "react";

import { type Article } from "@/lib/articles";

const COVER_IMAGE = "/image.couvertures.png";

export function HomeHeroCarousel({
  article,
  articleHref,
}: {
  article?: Article;
  articleHref: string;
}) {
  const [activeSlide, setActiveSlide] = useState(0);

  const goToSlide = (direction: number) => {
    setActiveSlide((current) => (current + direction + 1) % 1);
  };

  const heroContent = (
    <div className="relative min-h-[260px] overflow-hidden rounded-2xl bg-[#070d1c] shadow-xl sm:min-h-[340px] lg:min-h-[390px]">
      <img
        src={COVER_IMAGE}
        alt="Barro TV International, l'information au Sénégal et dans le monde"
        className="absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-700"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#050914]/90 via-[#050914]/35 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#050914]/80 via-transparent to-transparent" />

      <div className="absolute left-5 top-5 z-10 sm:left-8 sm:top-8">
        <div className="flex items-center gap-3 rounded-xl border border-[#f6b928]/45 bg-[#050914]/70 px-3 py-2 backdrop-blur-md sm:px-4 sm:py-3">
          <img
            src="/logo.png"
            alt="Barro TV International"
            className="logo-news-animation h-9 w-14 object-contain sm:h-12 sm:w-20"
          />
          <div className="border-l border-white/20 pl-3 text-white sm:pl-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f6b928] sm:text-xs">
              Barro TV
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/80 sm:text-xs">
              International
            </p>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex min-h-[260px] max-w-2xl flex-col justify-end px-5 pb-6 pt-24 text-white sm:min-h-[340px] sm:px-8 sm:pb-9 sm:pt-28 lg:min-h-[390px] lg:px-10">
        <span className="mb-3 w-fit rounded-md border border-[#f6b928]/60 bg-[#d62828] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-white shadow-lg sm:text-xs">
          En direct de l'actualité
        </span>
        <h1 className="max-w-xl text-2xl font-black leading-tight sm:text-4xl lg:text-5xl">
          {article?.title || "Barro TV International"}
        </h1>
        <p className="mt-3 max-w-lg text-sm leading-6 text-slate-200 sm:text-base">
          {article?.description || "L'information juste, partout, tout le temps."}
        </p>
        {article && (
          <Link
            href={articleHref}
            className="mt-5 inline-flex w-fit items-center rounded-lg bg-[#f6b928] px-4 py-2.5 text-sm font-black text-[#07101f] transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#f6b928] focus:ring-offset-2 focus:ring-offset-[#07101f]"
          >
            Lire la une <span className="ml-2" aria-hidden="true">→</span>
          </Link>
        )}
      </div>

      <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2 sm:bottom-6 sm:right-7">
        <button
          type="button"
          onClick={() => goToSlide(-1)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-[#050914]/65 text-lg text-white backdrop-blur transition hover:border-[#f6b928] hover:text-[#f6b928]"
          aria-label="Image précédente"
          title="Image précédente"
        >
          <span aria-hidden="true">‹</span>
        </button>
        <div className="flex items-center gap-1.5" aria-label="Indicateur du carrousel">
          <button
            type="button"
            onClick={() => setActiveSlide(0)}
            className={`h-2.5 w-2.5 rounded-full border border-white/80 transition ${
              activeSlide === 0 ? "bg-[#f6b928]" : "bg-white/30"
            }`}
            aria-label="Afficher l'image de couverture"
            aria-current={activeSlide === 0 ? "true" : undefined}
          />
        </div>
        <button
          type="button"
          onClick={() => goToSlide(1)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-[#050914]/65 text-lg text-white backdrop-blur transition hover:border-[#f6b928] hover:text-[#f6b928]"
          aria-label="Image suivante"
          title="Image suivante"
        >
          <span aria-hidden="true">›</span>
        </button>
      </div>
    </div>
  );

  return heroContent;
}
