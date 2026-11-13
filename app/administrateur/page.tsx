"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { ADMIN_EMAIL } from "@/lib/admin-config";
import { useAuth } from "@/lib/auth-context";
import {
  deleteArticle,
  fetchArticles,
  filterArticlesByQuery,
  saveArticle,
  type Article,
} from "@/lib/articles";
import {
  deleteContactMessage,
  fetchContactMessages,
  markContactMessageAsRead,
  saveContactReply,
  type ContactMessage,
} from "@/lib/contact";

function cleanSlug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildWhatsAppUrl(phone: string, message: string) {
  const digits = phone.replace(/\D/g, "");
  const normalizedPhone = digits.startsWith("221")
    ? digits
    : digits.length === 9 && digits.startsWith("7")
      ? `221${digits}`
      : digits;

  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message.trim())}`;
}

function formatDate(timestamp: unknown) {
  if (!timestamp) {
    return "—";
  }

  if (typeof timestamp === "string") {
    const date = new Date(timestamp);
    return Number.isNaN(date.getTime()) ? timestamp : date.toLocaleString("fr-FR");
  }

  if (typeof timestamp === "object" && "toDate" in timestamp) {
    const maybeDate = timestamp as { toDate?: () => Date };
    if (typeof maybeDate.toDate === "function") {
      return maybeDate.toDate().toLocaleString("fr-FR");
    }
  }

  if (typeof timestamp === "number" || typeof timestamp === "object") {
    const date = new Date(timestamp as string | number | Date);
    return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("fr-FR");
  }

  return "—";
}

function getTimestampMillis(timestamp: unknown) {
  if (!timestamp) return null;
  if (typeof timestamp === "object" && timestamp !== null && "toDate" in timestamp) {
    const firestoreTimestamp = timestamp as { toDate?: () => Date };
    if (typeof firestoreTimestamp.toDate === "function") return firestoreTimestamp.toDate().getTime();
  }
  if (typeof timestamp === "object" && timestamp !== null && "seconds" in timestamp) {
    const seconds = Number((timestamp as { seconds?: number }).seconds);
    return Number.isFinite(seconds) ? seconds * 1000 : null;
  }
  const date = new Date(timestamp as string | number | Date);
  return Number.isNaN(date.getTime()) ? null : date.getTime();
}

function getEmptyArticleForm() {
  return {
    id: "",
    title: "",
    slug: "",
    category: "ACTUALITÉ SÉNÉGAL",
    description: "",
    content: "",
    image: "",
    videoUrl: "",
    keywords: "",
    status: "draft" as "draft" | "published",
  };
}

export default function AdministrateurPage() {
  const router = useRouter();
  const articleFormRef = useRef<HTMLFormElement | null>(null);
  const { user, logout, isAdmin } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [isArticlesExpanded, setIsArticlesExpanded] = useState(true);
  const [isRefreshingArticles, setIsRefreshingArticles] = useState(false);
  const [drafts, setDrafts] = useState<Article[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [articleSearch, setArticleSearch] = useState("");
  const [notificationForm, setNotificationForm] = useState({ title: "", message: "", url: "", image: "" });
  const [notificationStatus, setNotificationStatus] = useState("");
  const [isSendingNotification, setIsSendingNotification] = useState(false);
  const [imageUploadState, setImageUploadState] = useState({
    preview: "",
    fileName: "",
    progress: 0,
    uploading: false,
    error: "",
    success: "",
  });

  const isAllowedAdmin = Boolean(
    user && (isAdmin || user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase())
  );

  const [form, setForm] = useState(getEmptyArticleForm);

  useEffect(() => {
    if (!user) {
      router.push("/connexion");
      return;
    }

    if (!isAllowedAdmin) {
      router.push("/connexion");
      return;
    }

    async function loadArticles() {
      const allArticles = await fetchArticles("all");
      setArticles(allArticles);
      setDrafts(allArticles.filter((article) => article.status === "draft"));
    }

    async function loadContactMessages() {
      const messages = await fetchContactMessages();
      setContactMessages(messages);
      if (messages.length > 0 && !selectedMessageId) {
        setSelectedMessageId(messages[0].id);
      }
    }

    void loadArticles();
    void loadContactMessages();
  }, [isAllowedAdmin, router, selectedMessageId, user]);

  const publishedArticles = useMemo(
    () => articles.filter((article) => article.status === "published"),
    [articles]
  );

  const unreadMessagesCount = useMemo(
    () => contactMessages.filter((message) => message.status === "unread").length,
    [contactMessages]
  );

  const activeContactMessages = useMemo(
    () => contactMessages.filter((message) => !message.reply.trim()),
    [contactMessages]
  );

  const selectedMessage = useMemo(
    () => activeContactMessages.find((message) => message.id === selectedMessageId) ?? activeContactMessages[0] ?? null,
    [activeContactMessages, selectedMessageId]
  );

  const filteredArticles = useMemo(
    () => filterArticlesByQuery(articles, articleSearch),
    [articles, articleSearch]
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      setError("Accès refusé.");
      return;
    }

    try {
      const slug = form.slug ? cleanSlug(form.slug) : form.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
      const payload = {
        title: form.title,
        slug,
        category: form.category,
        description: form.description,
        content: form.content,
        image: form.image,
        videoUrl: form.videoUrl.trim(),
        keywords: form.keywords
          .split(",")
          .map((keyword) => keyword.trim())
          .filter(Boolean),
        author: user.displayName || "Barro TV",
        authorEmail: user.email || "",
        status: form.status,
      };

      await saveArticle(payload, form.id || undefined);
      const nextArticles = await fetchArticles("all");
      setArticles(nextArticles);
      setDrafts(nextArticles.filter((article) => article.status === "draft"));
      setForm(getEmptyArticleForm());
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
      videoUrl: article.videoUrl || "",
      keywords: (article.keywords ?? []).join(", "),
      status: article.status,
    });

    window.requestAnimationFrame(() => {
      articleFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function handleCancelEdit() {
    setForm(getEmptyArticleForm());
    setError("");
  }

  async function handleDelete(id: string, title?: string) {
    const confirmed = window.confirm(
      `Voulez-vous vraiment supprimer l'article "${title ?? "cet article"}" ?`
    );

    if (!confirmed) {
      return;
    }

    await deleteArticle(id);
    setArticles((current) => current.filter((article) => article.id !== id));
    setDrafts((current) => current.filter((article) => article.id !== id));
  }

  async function handleRefreshArticles() {
    setIsRefreshingArticles(true);
    setError("");

    try {
      const nextArticles = await fetchArticles("all");
      setArticles(nextArticles);
      setDrafts(nextArticles.filter((article) => article.status === "draft"));
    } catch (refreshError: unknown) {
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : "Impossible d'actualiser les articles."
      );
    } finally {
      setIsRefreshingArticles(false);
    }
  }

  async function handleMessageRead(messageId: string) {
    await markContactMessageAsRead(messageId);
    const nextMessages = await fetchContactMessages();
    setContactMessages(nextMessages);
  }

  async function handleReplySubmit(messageId: string) {
    const reply = (replyInputs[messageId] ?? "").trim();
    if (!reply) return;

    await saveContactReply(messageId, reply);
    setContactMessages((current) => current.filter((message) => message.id !== messageId));
    setSelectedMessageId(null);
    setReplyInputs((current) => ({ ...current, [messageId]: "" }));
  }

  async function handleDeleteMessage(messageId: string) {
    const confirmed = window.confirm("Voulez-vous vraiment supprimer ce message ?");
    if (!confirmed) return;

    await deleteContactMessage(messageId);
    const nextMessages = await fetchContactMessages();
    setContactMessages(nextMessages);

    if (selectedMessageId === messageId) {
      setSelectedMessageId(nextMessages[0]?.id ?? null);
    }
  }

  async function handleSendNotification(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotificationStatus("");
    setIsSendingNotification(true);

    try {
      if (!user) throw new Error("Vous devez être connecté en tant qu'administrateur.");
      const idToken = await user.getIdToken();
      const response = await fetch("/api/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify(notificationForm),
      });
      const result = await response.json() as { message?: string };
      if (!response.ok) throw new Error(result.message || "Impossible d'envoyer la notification.");
      setNotificationStatus(result.message || "Notification envoyée.");
      setNotificationForm({ title: "", message: "", url: "", image: "" });
    } catch (notificationError) {
      setNotificationStatus(notificationError instanceof Error ? notificationError.message : "Impossible d'envoyer la notification.");
    } finally {
      setIsSendingNotification(false);
    }
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const isSupportedType = ["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(file.type) || /\.(jpe?g|png|webp)$/i.test(file.name);
    if (!isSupportedType) {
      setImageUploadState({ preview: "", fileName: "", progress: 0, uploading: false, error: "Format non supporté. Utilisez JPG, JPEG, PNG ou WEBP.", success: "" });
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setImageUploadState({ preview: "", fileName: "", progress: 0, uploading: false, error: "Image trop volumineuse. La taille maximale est de 5 Mo.", success: "" });
      event.target.value = "";
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setImageUploadState({ preview: previewUrl, fileName: file.name, progress: 0, uploading: true, error: "", success: "" });

    try {
      const formData = new FormData();
      formData.append("file", file);

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/cloudinary/upload");
        xhr.upload.addEventListener("progress", (progressEvent) => {
          if (!progressEvent.lengthComputable) {
            return;
          }
          const nextProgress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          setImageUploadState((current) => ({ ...current, progress: nextProgress }));
        });
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText) as { url?: string; message?: string };
              if (!response.url) {
                throw new Error(response.message || "Aucune URL retournée par le serveur.");
              }
              const nextImageUrl = String(response.url);
              setForm((current) => ({ ...current, image: nextImageUrl }));
              setImageUploadState({ preview: nextImageUrl, fileName: file.name, progress: 100, uploading: false, error: "", success: "Image importée avec succès." });
              resolve();
              return;
            } catch (parseError) {
              reject(parseError instanceof Error ? parseError : new Error("Réponse upload invalide."));
              return;
            }
          }

          try {
            const response = JSON.parse(xhr.responseText) as { message?: string };
            reject(new Error(response.message || "Échec de l'upload."));
          } catch {
            reject(new Error("Échec de l'upload."));
          }
        };
        xhr.onerror = () => reject(new Error("Échec de l'upload réseau."));
        xhr.send(formData);
      });
    } catch (uploadError) {
      setImageUploadState({ preview: "", fileName: "", progress: 0, uploading: false, error: uploadError instanceof Error ? uploadError.message : "L'upload a échoué.", success: "" });
    } finally {
      event.target.value = "";
    }
  }

  if (!user || !isAllowedAdmin) {
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

        <section className="mb-6 rounded-3xl border bg-white p-6 shadow-sm">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#d62828]">🔔 Notifications</p>
            <h2 className="mt-2 text-xl font-black text-[#111b35]">Envoyer une notification</h2>
            <p className="mt-1 text-sm text-slate-600">Préparez une alerte pour les abonnés aux notifications push.</p>
          </div>
          <form onSubmit={handleSendNotification} className="mt-5 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Titre</label>
              <input value={notificationForm.title} onChange={(event) => setNotificationForm((current) => ({ ...current, title: event.target.value }))} required maxLength={120} className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-[#d62828]" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">URL de l'article</label>
              <input type="url" value={notificationForm.url} onChange={(event) => setNotificationForm((current) => ({ ...current, url: event.target.value }))} placeholder="https://www.barrotvinternational.com/article/..." required className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-[#d62828]" />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-bold text-slate-700">Message</label>
              <textarea value={notificationForm.message} onChange={(event) => setNotificationForm((current) => ({ ...current, message: event.target.value }))} required maxLength={300} rows={3} className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-[#d62828]" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Image de l'article</label>
              <input type="url" value={notificationForm.image} onChange={(event) => setNotificationForm((current) => ({ ...current, image: event.target.value }))} placeholder="https://... (optionnel)" className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-[#d62828]" />
            </div>
            <div className="flex flex-col justify-end gap-2 md:items-start">
              <button type="submit" disabled={isSendingNotification} className="rounded-lg bg-[#d62828] px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-60">
                {isSendingNotification ? "Envoi..." : "Envoyer la notification"}
              </button>
              {notificationStatus ? <p className="text-sm font-semibold text-slate-700" role="status">{notificationStatus}</p> : null}
            </div>
          </form>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <form ref={articleFormRef} onSubmit={handleSubmit} className="rounded-3xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-[#111b35]">
              {form.id ? "Modifier l'information" : "Publier une information"}
            </h2>
            {form.id ? (
              <p className="mt-1 text-sm font-semibold text-slate-500">Modification de l&apos;article sélectionné</p>
            ) : null}

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

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label className="block text-sm font-bold text-slate-700">Image de l'article</label>
                  <label className="cursor-pointer rounded-lg bg-[#111b35] px-3 py-2 text-xs font-bold text-white">
                    Importer une image
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                </div>

                {imageUploadState.preview ? (
                  <div className="space-y-2">
                    <img src={imageUploadState.preview} alt="Aperçu de l'image" className="h-32 w-full rounded-lg object-cover" />
                    <p className="text-xs text-slate-600">{imageUploadState.fileName}</p>
                  </div>
                ) : null}

                {imageUploadState.uploading ? (
                  <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                      <span>Téléchargement</span>
                      <span>{imageUploadState.progress}%</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
                      <div className="h-full rounded-full bg-[#d62828] transition-all" style={{ width: `${imageUploadState.progress}%` }} />
                    </div>
                  </div>
                ) : null}

                {imageUploadState.success ? (
                  <p className="mt-3 text-sm font-semibold text-emerald-700">✓ {imageUploadState.success}</p>
                ) : null}

                {imageUploadState.error ? (
                  <p className="mt-3 text-sm font-semibold text-red-700">{imageUploadState.error}</p>
                ) : null}
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">URL de la vidéo</label>
                <input
                  type="url"
                  value={form.videoUrl}
                  onChange={(event) => setForm((current) => ({ ...current, videoUrl: event.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-[#d62828]"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Mots-clés</label>
                <input
                  value={form.keywords}
                  onChange={(event) => setForm((current) => ({ ...current, keywords: event.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-[#d62828]"
                  placeholder="Sénégal, Dakar, actualité, sport..."
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
                {form.id ? "Enregistrer les modifications" : "Publier"}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="rounded-lg border border-slate-300 px-5 py-3 font-bold text-slate-700"
              >
                {form.id ? "Annuler la modification" : "Réinitialiser"}
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

            <div className="rounded-3xl border bg-slate-50 p-5 shadow-sm">
              <h3 className="text-lg font-black text-[#111b35]">Messages contact ({contactMessages.length})</h3>
              <div className="mt-3 text-3xl font-black text-[#d62828]">{unreadMessagesCount}</div>
              <p className="mt-2 text-sm font-medium text-slate-600">Messages non lus</p>
            </div>
          </div>
        </div>

        <div className="mt-10 rounded-3xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsArticlesExpanded((current) => !current)}
                className="flex h-7 w-7 items-center justify-center rounded border border-slate-300 text-sm font-black text-[#111b35]"
                aria-label={isArticlesExpanded ? "Masquer les articles" : "Afficher les articles"}
                title={isArticlesExpanded ? "Masquer les articles" : "Afficher les articles"}
              >
                {isArticlesExpanded ? "▼" : "›"}
              </button>
              <h2 className="text-xl font-black text-[#111b35]">Articles</h2>
            </div>
            <button
              type="button"
              onClick={handleRefreshArticles}
              disabled={isRefreshingArticles}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isRefreshingArticles ? "Actualisation..." : "↻ Actualiser"}
            </button>
          </div>
          {isArticlesExpanded ? (
            <div className="mt-5 space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  value={articleSearch}
                  onChange={(event) => setArticleSearch(event.target.value)}
                  placeholder="Rechercher un article..."
                  className="min-w-0 flex-1 rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-[#d62828]"
                  aria-label="Rechercher un article par titre, slug ou catégorie"
                />
                {articleSearch ? (
                  <button
                    type="button"
                    onClick={() => setArticleSearch("")}
                    className="rounded-lg border border-slate-300 px-4 py-3 font-bold text-slate-700"
                  >
                    Effacer la recherche
                  </button>
                ) : null}
              </div>

              {filteredArticles.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-600">
                  Aucun article trouvé.
                </p>
              ) : filteredArticles.map((article) => (
                <div key={article.id} className="flex flex-col gap-4 rounded-2xl border p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-xs font-black uppercase tracking-wider text-[#d62828]">{article.category}</div>
                    <h3 className="mt-1 text-lg font-black text-[#111b35]">{article.title}</h3>
                    <p className="text-sm text-slate-500">{article.status === "draft" ? "Brouillon" : "Publié"}</p>
                    {article.updatedAt ? (
                      <p className="mt-1 text-xs font-semibold text-slate-400">Dernière modification : {formatDate(article.updatedAt)}</p>
                    ) : null}
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
                      onClick={() => handleDelete(article.id, article.title)}
                      className="rounded-lg bg-[#111b35] px-4 py-2 font-bold text-white"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="mt-10 rounded-3xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-[#111b35]">Messages des visiteurs</h2>
          <div className="mt-5 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-3">
              {activeContactMessages.length === 0 ? (
                <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                  Aucun message reçu pour le moment.
                </p>
              ) : (
                activeContactMessages.map((message) => (
                  <button
                    key={message.id}
                    type="button"
                    onClick={() => setSelectedMessageId(message.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      selectedMessage?.id === message.id
                        ? "border-[#d62828] bg-red-50"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-base font-black text-[#111b35]">{message.name}</div>
                        <div className="text-sm text-slate-500">{message.email}</div>
                      </div>
                      {message.status === "unread" ? (
                        <span className="rounded-full bg-[#d62828] px-2 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-white">
                          Non lu
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-emerald-700">
                          Lu
                        </span>
                      )}
                    </div>
                    <p className="mt-3 line-clamp-3 text-sm text-slate-600">{message.message}</p>
                    <p className="mt-3 text-[11px] font-semibold text-slate-400">{formatDate(message.createdAt)}</p>
                  </button>
                ))
              )}
            </div>

            {selectedMessage ? (
              <div className="rounded-2xl border bg-slate-50 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black text-[#111b35]">{selectedMessage.name}</h3>
                    <p className="text-sm text-slate-600">{selectedMessage.email}</p>
                    <p className="text-sm text-slate-600">{selectedMessage.phone || "Téléphone non renseigné"}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleMessageRead(selectedMessage.id)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700"
                  >
                    Marquer comme lu
                  </button>
                </div>

                <div className="mt-5 rounded-xl border bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[#d62828]">Message</p>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{selectedMessage.message}</p>
                  <p className="mt-4 text-[11px] font-semibold text-slate-500">{formatDate(selectedMessage.createdAt)}</p>
                </div>

                <div className="mt-5">
                  <label className="mb-2 block text-sm font-bold text-slate-700">Votre réponse</label>
                  <textarea
                    value={replyInputs[selectedMessage.id] ?? ""}
                    onChange={(event) =>
                      setReplyInputs((current) => ({
                        ...current,
                        [selectedMessage.id]: event.target.value,
                      }))
                    }
                    rows={5}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-[#d62828]"
                    placeholder="Écrivez une réponse..."
                  />
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => handleReplySubmit(selectedMessage.id)}
                      className="rounded-lg bg-[#d62828] px-5 py-3 font-bold text-white"
                    >
                      Envoyer la réponse
                    </button>
                    <button
                      type="button"
                      disabled={!selectedMessage.phone.trim() || !(replyInputs[selectedMessage.id] ?? "").trim()}
                      onClick={() => {
                        window.open(
                          buildWhatsAppUrl(
                            selectedMessage.phone,
                            replyInputs[selectedMessage.id] ?? ""
                          ),
                          "_blank",
                          "noopener,noreferrer"
                        );
                      }}
                      className="rounded-lg bg-[#25D366] px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Répondre sur WhatsApp
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteMessage(selectedMessage.id)}
                      className="rounded-lg border border-slate-300 px-5 py-3 font-bold text-slate-700"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>

                {selectedMessage.reply ? (
                  <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Réponse enregistrée</p>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-emerald-800">{selectedMessage.reply}</p>
                    <p className="mt-2 text-[11px] font-semibold text-emerald-700">
                      {selectedMessage.repliedAt ? `Envoyée le ${formatDate(selectedMessage.repliedAt)}` : "Aucune date"}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
