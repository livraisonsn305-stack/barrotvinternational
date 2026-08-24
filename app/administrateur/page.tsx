"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { ADMIN_EMAIL } from "@/lib/admin-config";
import { useAuth } from "@/lib/auth-context";
import { deleteArticle, fetchArticles, saveArticle, type Article } from "@/lib/articles";

export default function AdministrateurPage() {
  const router = useRouter();
  const { user, logout, isAdmin } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [drafts, setDrafts] = useState<Article[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    id: "",
    title: "",
    slug: "",
    category: "ACTUALITÉ SÉNÉGAL",
    description: "",
    content: "",
    image: "",
    status: "draft" as "draft" | "published",
  });

  useEffect(() => {
    if (!user) {
      router.push("/connexion");
      return;
    }

    if (!isAdmin && user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      router.push("/connexion");
      return;
    }

    setIsReady(true);
  }, [isAdmin, router, user]);

  useEffect(() => {
    if (!isReady) return;

    async function loadArticles() {
      const allArticles = await fetchArticles("all");
      setArticles(allArticles);
      setDrafts(allArticles.filter((article) => article.status === "draft"));
    }

    loadArticles();
  }, [isReady]);

  const publishedArticles = useMemo(
    () => articles.filter((article) => article.status === "published"),
    [articles]
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      setError("Accès refusé.");
      return;
    }

    try {
      const slug = form.slug || form.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
      const payload = {
        title: form.title,
        slug,
        category: form.category,
        description: form.description,
        content: form.content,
        image: form.image,
        author: user.displayName || "Barro TV",
        authorEmail: user.email || "",
        status: form.status,
      };

      await saveArticle(payload, form.id || undefined);
      const nextArticles = await fetchArticles("all");
      setArticles(nextArticles);
      setDrafts(nextArticles.filter((article) => article.status === "draft"));
      setForm({
        id: "",
        title: "",
        slug: "",
        category: "ACTUALITÉ SÉNÉGAL",
        description: "",
        content: "",
        image: "",
        status: "draft",
      });
    } catch (submitError: unknown) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Une erreur est survenue lors de la publication."
      );
    }
  }

  async function handleEdit(article: Article) {
    setForm({
      id: article.id,
      title: article.title,
      slug: article.slug,
      category: article.category,
      description: article.description,
      content: article.content,
      image: article.image || "",
      status: article.status,
    });
  }

  async function handleDelete(id: string) {
    await deleteArticle(id);
    setArticles((current) => current.filter((article) => article.id !== id));
  }

  if (!isReady) {
    return <div className="min-h-screen bg-white p-10 text-center text-slate-700">Chargement…</div>;
  }

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
            <div className="text-2xl font-black">
              BARRO <span className="text-[#d62828]">TV</span>
            </div>
            <div className="text-[10px] font-bold tracking-[0.35em] text-slate-600">
              INTERNATIONAL
            </div>
          </Link>
          <button
            type="button"
            onClick={() => logout().then(() => router.push("/connexion"))}
            className="rounded-lg bg-[#d62828] px-4 py-2 font-bold text-white"
          >
            Déconnexion
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#d62828]">
              Administrateur
            </p>
            <h1 className="mt-2 text-3xl font-black text-[#111b35]">Dashboard BARRO TV</h1>
          </div>
          <div className="rounded-full border bg-slate-50 px-4 py-2 text-sm font-semibold text-[#111b35]">
            {user?.email}
          </div>
        </div>

        {error ? (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <form onSubmit={handleSubmit} className="rounded-3xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-[#111b35]">Publier une information</h2>

            <div className="mt-5 grid gap-4">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Titre</label>
                <input
                  value={form.title}
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-[#d62828]"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Slug</label>
                <input
                  value={form.slug}
                  onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-[#d62828]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Catégorie</label>
                <select
                  value={form.category}
                  onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-[#d62828]"
                >
                  <option>ACTUALITÉ SÉNÉGAL</option>
                  <option>POLITIQUE</option>
                  <option>SOCIÉTÉ</option>
                  <option>ÉCONOMIE</option>
                  <option>FAITS-DIVERS</option>
                  <option>JUSTICE</option>
                  <option>SPORT</option>
                  <option>AFRIQUE</option>
                  <option>INTERNATIONAL</option>
                  <option>PERSONNES</option>
                  <option>CULTURE</option>
                  <option>TECHNOLOGIE</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Description</label>
                <textarea
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  className="min-h-24 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-[#d62828]"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Contenu</label>
                <textarea
                  value={form.content}
                  onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))}
                  className="min-h-36 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-[#d62828]"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Image URL</label>
                <input
                  value={form.image}
                  onChange={(event) => setForm((current) => ({ ...current, image: event.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-[#d62828]"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Statut</label>
                <select
                  value={form.status}
                  onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as "draft" | "published" }))}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-[#d62828]"
                >
                  <option value="draft">Brouillon</option>
                  <option value="published">Publié</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button type="submit" className="rounded-lg bg-[#d62828] px-5 py-3 font-bold text-white">
                Enregistrer
              </button>
              <button
                type="button"
                onClick={() =>
                  setForm({
                    id: "",
                    title: "",
                    slug: "",
                    category: "ACTUALITÉ SÉNÉGAL",
                    description: "",
                    content: "",
                    image: "",
                    status: "draft",
                  })
                }
                className="rounded-lg border border-slate-300 px-5 py-3 font-bold text-slate-700"
              >
                Réinitialiser
              </button>
            </div>
          </form>

          <div className="space-y-6">
            <div className="rounded-3xl border bg-slate-50 p-5 shadow-sm">
              <h3 className="text-lg font-black text-[#111b35]">Publications</h3>
              <div className="mt-3 text-3xl font-black text-[#d62828]">{publishedArticles.length}</div>
            </div>

            <div className="rounded-3xl border bg-slate-50 p-5 shadow-sm">
              <h3 className="text-lg font-black text-[#111b35]">Brouillons</h3>
              <div className="mt-3 text-3xl font-black text-[#111b35]">{drafts.length}</div>
            </div>
          </div>
        </div>

        <div className="mt-10 rounded-3xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-[#111b35]">Articles</h2>
          <div className="mt-5 space-y-4">
            {articles.map((article) => (
              <div key={article.id} className="flex flex-col gap-4 rounded-2xl border p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-[#d62828]">{article.category}</div>
                  <h3 className="mt-1 text-lg font-black text-[#111b35]">{article.title}</h3>
                  <p className="text-sm text-slate-500">{article.status === "draft" ? "Brouillon" : "Publié"}</p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleEdit(article)}
                    className="rounded-lg border border-slate-300 px-4 py-2 font-bold text-slate-700"
                  >
                    Modifier
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(article.id)}
                    className="rounded-lg bg-[#111b35] px-4 py-2 font-bold text-white"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
