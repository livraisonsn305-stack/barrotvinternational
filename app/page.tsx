"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { useAuth } from "@/lib/auth-context";

const articles = [
  {
    href: "/article/politique-senegal",
    category: "POLITIQUE",
    tag: "politique",
    title: "Les dernières décisions politiques au Sénégal",
    time: "Il y a 20 minutes",
    image:
      "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=900&q=80",
  },
  {
    href: "/article/football-senegal",
    category: "SPORT",
    tag: "sport",
    title: "Les dernières nouvelles du football sénégalais",
    time: "Il y a 35 minutes",
    image:
      "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=900&q=80",
  },
  {
    href: "/article/actualites-senegal",
    category: "ACTUALITÉ SÉNÉGAL",
    tag: "actualites-senegal",
    title: "Les informations importantes de la société sénégalaise",
    time: "Il y a 1 heure",
    image:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80",
  },
];

const categories = [
  { label: "Politique", href: "/politique" },
  { label: "Société", href: "/societe" },
  { label: "Économie", href: "/economie" },
  { label: "Faits-divers", href: "/faits-divers" },
  { label: "Justice", href: "/justice" },
  { label: "Sport", href: "/sport" },
  { label: "Afrique", href: "/afrique" },
  { label: "International", href: "/international" },
  { label: "Personnes", href: "/personnes" },
  { label: "Culture", href: "/culture" },
  { label: "Technologie", href: "/technologie" },
];

const tabs = [
  "POPULAIRE",
  "ACTUALITÉS SÉNÉGAL",
  "POLITIQUE",
  "SPORT",
  "AFRIQUE",
  "INTERNATIONAL",
];

export default function Home() {
  const [activeTab, setActiveTab] = useState("POPULAIRE");
  const { user, isAdmin } = useAuth();
  const isAdminVisible = Boolean(user && isAdmin);

  const visibleArticles = useMemo(() => {
    if (activeTab === "POPULAIRE") return articles;
    if (activeTab === "ACTUALITÉS SÉNÉGAL")
      return articles.filter((article) => article.tag === "actualites-senegal");
    if (activeTab === "POLITIQUE")
      return articles.filter((article) => article.tag === "politique");
    if (activeTab === "SPORT")
      return articles.filter((article) => article.tag === "sport");
    if (activeTab === "AFRIQUE") return articles.slice(0, 1);
    return articles.slice(0, 1);
  }, [activeTab]);

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="bg-[#111b35] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 text-sm">
          <span>Dakar, Sénégal</span>
          <span className="hidden sm:block">BARRO TV INTERNATIONAL</span>
        </div>
      </div>

      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link href="/" className="block">
            <div className="text-2xl font-black tracking-tight">
              BARRO <span className="text-[#d62828]">TV</span>
            </div>
            <div className="text-[10px] font-bold tracking-[0.35em] text-slate-600">
              INTERNATIONAL
            </div>
          </Link>

          <nav className="hidden items-center gap-7 font-semibold md:flex">
            <Link href="/" className="text-[#d62828]">
              Accueil
            </Link>
            <Link href="/politique">Politique</Link>
            <Link href="/societe">Société</Link>
            <Link href="/economie">Économie</Link>
            <Link href="/sport">Sport</Link>
            <Link href="/afrique">Afrique</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/recherche"
              className="rounded-full border px-3 py-2"
              aria-label="Rechercher"
            >
              🔎
            </Link>

            {isAdminVisible ? (
              <Link
                href="/administrateur"
                className="hidden rounded-lg bg-[#111b35] px-4 py-2 font-bold text-white sm:block"
              >
                Administrateur
              </Link>
            ) : (
              <Link
                href="/connexion"
                className="hidden rounded-lg bg-[#d62828] px-4 py-2 font-bold text-white sm:block"
              >
                Se connecter
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl overflow-x-auto px-4">
          <div className="flex min-w-max gap-7 py-3 text-sm font-semibold">
            {categories.map((category) => (
              <Link
                key={category.label}
                href={category.href}
                className="transition hover:text-[#d62828]"
              >
                {category.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-4 pt-6">
        <Link href="/article/actualites-senegal" className="block">
          <div className="flex items-center gap-3 rounded-xl bg-[#111b35] px-5 py-4 text-white shadow">
            <span className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
            <div>
              <div className="font-bold uppercase tracking-wide">Fil d’actualités</div>
              <div className="text-sm text-slate-300">
                Les informations qui tombent ailleurs, réunies ici en temps réel.
              </div>
            </div>
            <span className="ml-auto hidden text-sm text-slate-300 sm:block">
              Flux continu
            </span>
          </div>
        </Link>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
          <Link
            href="/article/actualites-senegal"
            className="block overflow-hidden rounded-2xl bg-slate-900"
          >
            <article className="relative min-h-[430px] overflow-hidden rounded-2xl bg-slate-900">
              <img
                src="https://images.unsplash.com/photo-1523731407965-2430cd12f5e4?auto=format&fit=crop&w=1600&q=85"
                alt="Actualités internationales"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
              <div className="relative flex min-h-[430px] flex-col justify-end p-6 text-white sm:p-9">
                <span className="mb-4 w-fit rounded-md bg-[#d62828] px-3 py-2 text-xs font-bold uppercase">
                  À la une
                </span>
                <p className="mb-2 text-sm font-bold uppercase tracking-wider text-red-300">
                  Actualité Sénégal
                </p>
                <h1 className="max-w-3xl text-3xl font-black leading-tight sm:text-5xl">
                  Sénégal : les grandes actualités à suivre aujourd'hui
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-200 sm:text-base">
                  Retrouvez les informations essentielles, les réactions et les
                  dernières nouvelles de la rédaction de Barro TV International.
                </p>
                <div className="mt-5 text-sm text-slate-300">
                  Publié aujourd'hui • Barro TV International
                </div>
              </div>
            </article>
          </Link>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
            {articles.slice(0, 2).map((article) => (
              <Link key={article.title} href={article.href} className="block">
                <article className="overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="h-40 w-full object-cover"
                  />
                  <div className="p-5">
                    <div className="text-xs font-black uppercase tracking-wider text-[#d62828]">
                      {article.category}
                    </div>
                    <h2 className="mt-2 text-xl font-bold leading-tight">
                      {article.title}
                    </h2>
                    <p className="mt-3 text-sm text-slate-500">{article.time}</p>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl border-y px-4 py-4">
        <div className="flex gap-7 overflow-x-auto whitespace-nowrap text-sm font-bold">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={
                activeTab === tab
                  ? "cursor-pointer text-[#d62828]"
                  : "cursor-pointer text-slate-700"
              }
            >
              {tab}
            </button>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-7">
          <p className="text-sm font-black uppercase tracking-widest text-[#d62828]">
            Dernières nouvelles
          </p>
          <h2 className="mt-1 text-3xl font-black text-[#111b35] sm:text-4xl">
            L'actualité en continu
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {visibleArticles.map((article) => (
            <article
              key={article.title}
              className="overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <Link href={article.href} className="block">
                <img
                  src={article.image}
                  alt={article.title}
                  className="h-52 w-full object-cover"
                />
                <div className="p-5">
                  <div className="text-xs font-black uppercase tracking-wider text-[#d62828]">
                    {article.category}
                  </div>
                  <h3 className="mt-2 text-xl font-bold leading-tight">
                    {article.title}
                  </h3>
                  <p className="mt-3 text-sm text-slate-500">{article.time}</p>
                  <span className="mt-5 inline-block font-bold text-[#111b35]">
                    Lire l'article →
                  </span>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-10">
        <div className="rounded-2xl bg-[#111b35] px-6 py-10 text-center text-white sm:px-12">
          <h2 className="text-2xl font-black sm:text-3xl">
            Ne manquez aucune actualité
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-300">
            Recevez les principales informations de Barro TV International.
          </p>
          <div className="mx-auto mt-6 flex max-w-lg flex-col gap-3 sm:flex-row">
            <input
              type="email"
              placeholder="Votre adresse email"
              className="flex-1 rounded-lg px-4 py-3 text-black outline-none"
            />
            <button className="rounded-lg bg-[#d62828] px-6 py-3 font-bold">
              S'abonner
            </button>
          </div>
        </div>
      </section>

      <footer className="bg-[#0b1224] text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-3">
          <div>
            <div className="text-2xl font-black">
              BARRO <span className="text-[#d62828]">TV</span>
            </div>
            <div className="mt-1 text-xs tracking-[0.3em] text-slate-400">
              INTERNATIONAL
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-400">
              Votre média d'information au Sénégal et à l'international.
            </p>
          </div>

          <div>
            <h3 className="font-bold">Navigation</h3>
            <div className="mt-4 space-y-2 text-sm text-slate-400">
              <Link href="/" className="block hover:text-white">Accueil</Link>
              <Link href="/politique" className="block hover:text-white">Politique</Link>
              <Link href="/societe" className="block hover:text-white">Société</Link>
              <Link href="/economie" className="block hover:text-white">Économie</Link>
              <Link href="/sport" className="block hover:text-white">Sport</Link>
              <Link href="/afrique" className="block hover:text-white">Afrique</Link>
              <Link href="/international" className="block hover:text-white">International</Link>
            </div>
          </div>

          <div>
            <h3 className="font-bold">Contact</h3>
            <div className="mt-4 space-y-2 text-sm text-slate-400">
              <Link href="/contact" className="block hover:text-white">Contact</Link>
              <Link href="/a-propos" className="block hover:text-white">À propos</Link>
              <Link href="/mentions-legales" className="block hover:text-white">Mentions légales</Link>
              <Link href="/politique-confidentialite" className="block hover:text-white">Politique de confidentialité</Link>
              <p>Dakar, Usine Bene Tally</p>
              <p>📞 78 388 91 58</p>
              <p>🌐 barotvinternational.com</p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 py-5 text-center text-sm text-slate-500">
          © 2026 Barro TV International — Tous droits réservés.
        </div>
      </footer>
    </main>
  );
}