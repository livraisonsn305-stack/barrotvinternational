import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type DocumentData,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export type ArticleStatus = "draft" | "published";

export type Article = {
  id: string;
  title: string;
  slug: string;
  category: string;
  description: string;
  content: string;
  image?: string;
  author?: string;
  authorEmail?: string;
  status: ArticleStatus;
  published: boolean;
  views?: number;
  createdAt?: any;
  updatedAt?: any;
};

export const FALLBACK_ARTICLE_IMAGE =
  "https://images.unsplash.com/photo-1523731407965-2430cd12f5e4?auto=format&fit=crop&w=1600&q=85";

export function normalizeSearchValue(value: string | undefined) {
  return (value ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function getArticleImage(image?: string) {
  if (!image || typeof image !== "string") return FALLBACK_ARTICLE_IMAGE;

  const normalized = image.trim();
  if (!normalized) return FALLBACK_ARTICLE_IMAGE;

  try {
    const parsed = new URL(normalized);
    const hostname = parsed.hostname.toLowerCase();
    const pathname = parsed.pathname.toLowerCase();

    const isDirectImageResource =
      pathname.includes(".jpg") ||
      pathname.includes(".jpeg") ||
      pathname.includes(".png") ||
      pathname.includes(".webp") ||
      pathname.includes(".gif") ||
      pathname.includes(".avif") ||
      pathname.includes(".svg") ||
      hostname.includes("firebasestorage") ||
      hostname.includes("googleusercontent") ||
      hostname.includes("images.unsplash.com");

    if (hostname.includes("unsplash.com") && pathname.includes("/photos/")) {
      const lastSegment = pathname.split("/").filter(Boolean).at(-1) ?? "";
      const photoId = (lastSegment.match(/[a-z0-9_-]{8,}$/i)?.[0] ?? "").trim();
      if (photoId) {
        return `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=1600&q=80`;
      }
      return FALLBACK_ARTICLE_IMAGE;
    }

    if ((parsed.protocol === "http:" || parsed.protocol === "https:") && (isDirectImageResource || !pathname.includes("/photos/"))) {
      return normalized;
    }
  } catch {
    // Fall through safely when the saved URL is not a valid absolute URL.
  }

  return FALLBACK_ARTICLE_IMAGE;
}

export function filterArticlesByQuery(articles: Article[], query: string) {
  const normalizedQuery = normalizeSearchValue(query.trim());

  if (!normalizedQuery) {
    return articles;
  }

  return articles.filter((article) => {
    const haystack = [
      article.title,
      article.category,
      article.description,
      article.content,
      article.slug,
      article.author,
    ]
      .filter(Boolean)
      .join(" ");

    return normalizeSearchValue(haystack).includes(normalizedQuery);
  });
}

export const ARTICLES_COLLECTION = "articles";

export function getArticlesCollection() {
  return db ? collection(db, ARTICLES_COLLECTION) : null;
}

export async function saveArticle(article: Partial<Article>, id?: string) {
  if (!db) return null;

  const payload = {
    ...article,
    updatedAt: serverTimestamp(),
    ...(article.status === "published" ? { published: true } : { published: false }),
  };

  if (id) {
    const ref = doc(db, ARTICLES_COLLECTION, id);
    const snapshot = await getDoc(ref);

    if (snapshot.exists()) {
      await updateDoc(ref, payload);
      return id;
    }
  }

  const ref = await addDoc(collection(db, ARTICLES_COLLECTION), {
    ...payload,
    createdAt: serverTimestamp(),
    published: article.status === "published",
  });

  return ref.id;
}

export async function upsertArticle(article: Partial<Article>, id?: string) {
  return saveArticle(article, id);
}

export async function deleteArticle(id: string) {
  if (!db) return;
  await deleteDoc(doc(db, ARTICLES_COLLECTION, id));
}

export function listenToArticles(
  status: ArticleStatus | "all" = "published",
  callback: (items: Article[]) => void
) {
  if (!db) {
    callback([]);
    return () => {};
  }

  const base = collection(db, ARTICLES_COLLECTION);
  const q =
    status === "all" ? query(base) : query(base, where("status", "==", status));

  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((docSnapshot) => ({
      id: docSnapshot.id,
      ...(docSnapshot.data() as DocumentData),
      createdAt: docSnapshot.data().createdAt,
      updatedAt: docSnapshot.data().updatedAt,
    })) as Article[];
    callback(items);
  });
}

export async function fetchArticles(status: ArticleStatus | "all" = "published") {
  if (!db) return [] as Article[];

  const base = collection(db, ARTICLES_COLLECTION);
  const q =
    status === "all" ? query(base) : query(base, where("status", "==", status));

  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnapshot) => ({
    id: docSnapshot.id,
    ...(docSnapshot.data() as DocumentData),
    createdAt: docSnapshot.data().createdAt,
    updatedAt: docSnapshot.data().updatedAt,
  })) as Article[];
}
