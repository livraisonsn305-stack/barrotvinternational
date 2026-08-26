"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

import { SearchDialog } from "@/components/SearchDialog";
import { fetchArticles, getArticleImage, type Article } from "@/lib/articles";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";

const normalizeCategory = (value?: string) => (value ?? "").toUpperCase().replace(/\s+/g, " ").trim();

function formatArticleTime(value: unknown) {
  if (!value || typeof value !== "object" || !("seconds" in value)) {
    return "À l'instant";
  }

  const seconds = Number((value as { seconds?: number }).seconds ?? 0);
  if (!seconds) return "À l'instant";

  const diffMinutes = Math.max(1, Math.round((Date.now() - seconds * 1000) / 60000));

  if (diffMinutes < 60) {
    return `Il y a ${diffMinutes} minute${diffMinutes > 1 ? "s" : ""}`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `Il y a ${diffHours} heure${diffHours > 1 ? "s" : ""}`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `Il y a ${diffDays} jour${diffDays > 1 ? "s" : ""}`;
}

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [subscribeStatus, setSubscribeStatus] = useState<{ type: "idle" | "loading" | "success" | "error"; message: string }>({
    type: "idle",
    message: "",
  });
  const [searchOpen, setSearchOpen] = useState(false);
  const router = useRouter();
  const { user, isAdmin, logout } = useAuth();
  const isAdminVisible = Boolean(user && isAdmin);
  const [publishedArticles, setPublishedArticles] = useState<Article[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function loadArticles() {
      setLoadingArticles(true);
      try {
        const nextArticles = await fetchArticles("published");
        if (!ignore) {
          setPublishedArticles(nextArticles);
        }
      } finally {
        if (!ignore) {
          setLoadingArticles(false);
        }
      }
    }

    void loadArticles();
    return () => {
      ignore = true;
    };
  }, []);

  const handleSubscribe = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!normalizedEmail || !emailRegex.test(normalizedEmail)) {
      setSubscribeStatus({
        type: "error",
        message: "Veuillez saisir une adresse e-mail valide.",
      });
      return;
    }

    if (!db) {
      setSubscribeStatus({
        type: "error",
        message: "La configuration Firebase est indisponible pour le moment.",
      });
      return;
    }

    try {
      setSubscribeStatus({ type: "loading", message: "Enregistrement en cours..." });

      const subscriberRef = doc(db, "subscribers", normalizedEmail);
      const snapshot = await getDoc(subscriberRef);

      if (snapshot.exists()) {
        setSubscribeStatus({
          type: "error",
          message: "Cette adresse est déjà inscrite à notre newsletter.",
        });
        return;
      }

      await setDoc(subscriberRef, {
        email: normalizedEmail,
        createdAt: serverTimestamp(),
        source: "homepage-newsletter",
      });

      setEmail("");
      setSubscribeStatus({
        type: "success",
        message: "Merci ! Vous êtes maintenant abonné à Barro TV International.",
      });
    } catch (error) {
      console.error("Newsletter subscription error:", error);
      setSubscribeStatus({
        type: "error",
        message: "La création de l'inscription a été refusée par Firebase. Vérifiez votre adresse e-mail et réessayez.",
      });
    }
  };

  const sortedPublishedArticles = useMemo(
    () => [...publishedArticles].sort((a, b) => Number(b.createdAt?.seconds ?? 0) - Number(a.createdAt?.seconds ?? 0)),
    [publishedArticles]
  );

  const featuredArticle = sortedPublishedArticles[0];
  const featuredArticleHref = featuredArticle ? `/article/${featuredArticle.slug || featuredArticle.id}` : "/article";

  const visibleArticles = useMemo(() => {
    if (activeTab === "POPULAIRE") return sortedPublishedArticles;
    if (activeTab === "ACTUALITÉS SÉNÉGAL")
      return sortedPublishedArticles.filter((article) => normalizeCategory(article.category) === "ACTUALITÉ SÉNÉGAL");
    if (activeTab === "POLITIQUE")
      return sortedPublishedArticles.filter((article) => normalizeCategory(article.category) === "POLITIQUE");
    if (activeTab === "SPORT")
      return sortedPublishedArticles.filter((article) => normalizeCategory(article.category) === "SPORT");
    if (activeTab === "AFRIQUE")
      return sortedPublishedArticles.filter((article) => normalizeCategory(article.category) === "AFRIQUE");
    return sortedPublishedArticles.slice(0, 1);
  }, [activeTab, sortedPublishedArticles]);

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
          <div className="flex items-center gap-3">
            <Link href="/" className="block md:hidden">
              <img
                src="/logo.png"
                alt="Barro TV International"
                className="h-10 w-auto object-contain"
              />
            </Link>

            <Link href="/" className="hidden md:block">
              <div className="text-2xl font-black tracking-tight">
                BARRO <span className="text-[#d62828]">TV</span>
              </div>
              <div className="text-[10px] font-bold tracking-[0.35em] text-slate-600">
                INTERNATIONAL
              </div>
            </Link>
          </div>

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
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-[#d62828] hover:text-[#d62828]"
              aria-label="Rechercher"
            >
              🔎 <span className="hidden sm:inline">Rechercher</span>
            </button>

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

            <button
              type="button"
              aria-label="Ouvrir le menu"
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen((open) => !open)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-white text-xl text-slate-800 shadow-sm md:hidden"
            >
              ☰
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="border-t bg-white md:hidden">
            <nav className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 text-base font-semibold">
              <Link href="/" onClick={() => setIsMenuOpen(false)} className="rounded-lg px-3 py-2 text-[#d62828]">
                Accueil
              </Link>
              <Link href="/politique" onClick={() => setIsMenuOpen(false)} className="rounded-lg px-3 py-2 hover:bg-slate-50">
                Politique
              </Link>
              <Link href="/societe" onClick={() => setIsMenuOpen(false)} className="rounded-lg px-3 py-2 hover:bg-slate-50">
                Société
              </Link>
              <Link href="/economie" onClick={() => setIsMenuOpen(false)} className="rounded-lg px-3 py-2 hover:bg-slate-50">
                Économie
              </Link>
              <Link href="/faits-divers" onClick={() => setIsMenuOpen(false)} className="rounded-lg px-3 py-2 hover:bg-slate-50">
                Faits-divers
              </Link>

              {user ? (
                <>
                  {isAdminVisible ? (
                    <Link href="/administrateur" onClick={() => setIsMenuOpen(false)} className="rounded-lg bg-[#111b35] px-3 py-3 font-bold text-white text-center">
                      Mon compte
                    </Link>
                  ) : (
                    <Link href="/connexion" onClick={() => setIsMenuOpen(false)} className="rounded-lg bg-[#111b35] px-3 py-3 font-bold text-white text-center">
                      Mon compte
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={async () => {
                      await logout();
                      setIsMenuOpen(false);
                      router.push("/connexion");
                    }}
                    className="rounded-lg border border-slate-300 px-3 py-3 font-bold text-slate-800"
                  >
                    Déconnexion
                  </button>
                </>
              ) : (
                <Link href="/connexion" onClick={() => setIsMenuOpen(false)} className="rounded-lg bg-[#d62828] px-3 py-3 font-bold text-white text-center">
                  Se connecter
                </Link>
              )}
            </nav>
          </div>
        )}
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
        <Link href={featuredArticleHref} className="block">
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
          {loadingArticles ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-slate-600">
              Chargement des articles…
            </div>
          ) : featuredArticle ? (
            <Link
              href={`/article/${featuredArticle.slug || featuredArticle.id}`}
              className="block overflow-hidden rounded-2xl bg-slate-900"
            >
              <article className="relative min-h-[430px] overflow-hidden rounded-2xl bg-slate-900">
                <img
                  src={getArticleImage(featuredArticle.image)}
                  alt={featuredArticle.title}
                  className="absolute inset-0 h-full w-full object-cover"
                  onError={(event) => {
                    event.currentTarget.src = getArticleImage();
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                <div className="relative flex min-h-[430px] flex-col justify-end p-6 text-white sm:p-9">
                  <span className="mb-4 w-fit rounded-md bg-[#d62828] px-3 py-2 text-xs font-bold uppercase">
                    À la une
                  </span>
                  <p className="mb-2 text-sm font-bold uppercase tracking-wider text-red-300">
                    {featuredArticle.category}
                  </p>
                  <h1 className="max-w-3xl text-3xl font-black leading-tight sm:text-5xl">
                    {featuredArticle.title}
                  </h1>
                  <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-200 sm:text-base">
                    {featuredArticle.description}
                  </p>
                  <div className="mt-5 text-sm text-slate-300">
                    {formatArticleTime(featuredArticle.createdAt)} • Barro TV International
                  </div>
                </div>
              </article>
            </Link>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-slate-600">
              Aucun article publié pour le moment.
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
            {!loadingArticles && publishedArticles.slice(1, 3).map((article) => (
              <Link key={article.id} href={`/article/${article.slug || article.id}`} className="block">
                <article className="overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                  <img
                    src={getArticleImage(article.image)}
                    alt={article.title}
                    className="h-40 w-full object-cover"
                    onError={(event) => {
                      event.currentTarget.src = getArticleImage();
                    }}
                  />
                  <div className="p-5">
                    <div className="text-xs font-black uppercase tracking-wider text-[#d62828]">
                      {article.category}
                    </div>
                    <h2 className="mt-2 text-xl font-bold leading-tight">
                      {article.title}
                    </h2>
                    <p className="mt-3 text-sm text-slate-500">{formatArticleTime(article.createdAt)}</p>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        className="fixed bottom-4 right-4 z-30 inline-flex items-center gap-2 rounded-full bg-[#d62828] px-4 py-3 text-sm font-bold text-white shadow-lg sm:hidden"
        aria-label="Rechercher"
      >
        🔎 Rechercher
      </button>

      <SearchDialog articles={publishedArticles} isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

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
          {visibleArticles.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-slate-200 bg-slate-50 p-6 text-slate-600">
              Aucun article disponible pour cette catégorie.
            </div>
          ) : (
            visibleArticles.map((article) => (
              <article
                key={article.id}
                className="overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <Link href={`/article/${article.slug || article.id}`} className="block">
                  <img
                    src={getArticleImage(article.image)}
                    alt={article.title}
                    className="h-52 w-full object-cover"
                    onError={(event) => {
                      event.currentTarget.src = getArticleImage();
                    }}
                  />
                  <div className="p-5">
                    <div className="text-xs font-black uppercase tracking-wider text-[#d62828]">
                      {article.category}
                    </div>
                    <h3 className="mt-2 text-xl font-bold leading-tight">
                      {article.title}
                    </h3>
                    <p className="mt-3 text-sm text-slate-500">{formatArticleTime(article.createdAt)}</p>
                    <span className="mt-5 inline-block font-bold text-[#111b35]">
                      Lire l'article →
                    </span>
                  </div>
                </Link>
              </article>
            ))
          )}
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
          <form onSubmit={handleSubscribe} className="mx-auto mt-6 flex max-w-lg flex-col gap-3 sm:flex-row">
            <input
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (subscribeStatus.type !== "idle") {
                  setSubscribeStatus({ type: "idle", message: "" });
                }
              }}
              placeholder="Votre adresse email"
              className="flex-1 rounded-lg px-4 py-3 text-black outline-none"
              aria-label="Adresse e-mail"
              disabled={subscribeStatus.type === "loading"}
            />
            <button
              type="submit"
              disabled={subscribeStatus.type === "loading"}
              className="rounded-lg bg-[#d62828] px-6 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {subscribeStatus.type === "loading" ? "En cours..." : "S'abonner"}
            </button>
          </form>

          {subscribeStatus.type !== "idle" && (
            <p
              className={`mt-4 text-sm ${
                subscribeStatus.type === "success" ? "text-green-400" : "text-red-300"
              }`}
            >
              {subscribeStatus.message}
            </p>
          )}
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