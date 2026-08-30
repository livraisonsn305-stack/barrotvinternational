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
  "/logo.png";

export function normalizeSearchValue(value: string | undefined) {
  return (value ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function getArticleImage(image?: string) {
  if (!image || typeof image !== "string") return FALLBACK_ARTICLE_IMAGE;

  const normalized = image.trim();
  if (!normalized) return FALLBACK_ARTICLE_IMAGE;

  if (normalized.startsWith("/")) return normalized;

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

export function normalizeCategoryKey(value?: string) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .trim();
}

export function matchesCategoryKey(value: string | undefined, expected: string | string[]) {
  const normalizedCategory = normalizeCategoryKey(value);
  const expectedValues = (Array.isArray(expected) ? expected : [expected]).map((item) => normalizeCategoryKey(item));

  return expectedValues.some((item) => {
    if (!item || !normalizedCategory) {
      return false;
    }

    return normalizedCategory === item || normalizedCategory.includes(item) || item.includes(normalizedCategory);
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
    status === "all"
      ? query(base)
      : query(base, where("status", "==", status), where("published", "==", true));

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
  if (!db) {
    const error = new Error("Firebase Firestore is not configured.");
    console.error("ARTICLES_READ_ERROR", error);
    throw error;
  }

  try {
    const base = collection(db, ARTICLES_COLLECTION);
    const snapshot = await getDocs(
      status === "all"
        ? query(base)
        : query(base, where("status", "==", status), where("published", "==", true))
    );

    return snapshot.docs.map((docSnapshot) => {
      const data = docSnapshot.data();
      return {
        id: docSnapshot.id,
        ...(data as DocumentData),
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      } as Article;
    });
  } catch (error) {
    console.error("ARTICLES_READ_ERROR", error);
    throw error;
  }
}

export async function fetchPublishedArticle(identifier: string) {
  if (!db) {
    const error = new Error("Firebase Firestore is not configured.");
    console.error("ARTICLE_READ_ERROR", error);
    throw error;
  }

  const normalizedIdentifier = identifier.trim();
  if (!normalizedIdentifier) return null;

  try {
    try {
      const directSnapshot = await getDoc(doc(db, ARTICLES_COLLECTION, normalizedIdentifier));
      if (directSnapshot.exists()) {
        const data = directSnapshot.data();
        if (data.status === "published" && data.published === true) {
          return {
            id: directSnapshot.id,
            ...(data as DocumentData),
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          } as Article;
        }

        return null;
      }
    } catch (directReadError) {
      console.warn("ARTICLE_DIRECT_READ_FALLBACK", directReadError);
    }

    const slugSnapshot = await getDocs(
      query(
        collection(db, ARTICLES_COLLECTION),
        where("slug", "==", normalizedIdentifier),
        where("status", "==", "published"),
        where("published", "==", true)
      )
    );

    const slugDocument = slugSnapshot.docs[0];
    if (!slugDocument) return null;

    const data = slugDocument.data();
    return {
      id: slugDocument.id,
      ...(data as DocumentData),
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    } as Article;
  } catch (error) {
    console.error("ARTICLE_READ_ERROR", error);
    throw error;
  }
}
