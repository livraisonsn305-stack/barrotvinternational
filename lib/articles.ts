import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  documentId,
  getDoc,
  getDocs,
  limit,
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
  videoUrl?: string;
  keywords?: string[];
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
      ...(article.keywords ?? []),
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
    .replace(/&/g, "ET")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .trim();
}

export function matchesCategoryKey(value: string | undefined, expected: string | string[]) {
  const normalizedCategory = normalizeCategoryKey(value);
  if (!normalizedCategory) {
    return false;
  }

  const expectedValues = (Array.isArray(expected) ? expected : [expected])
    .map((item) => normalizeCategoryKey(item))
    .filter(Boolean);

  if (expectedValues.length === 0) {
    return false;
  }

  return expectedValues.some((item) => {
    if (normalizedCategory === item) {
      return true;
    }

    const aliases = new Set([item, `${item}S`, `${item}E`, `${item}ES`]);
    if (aliases.has(normalizedCategory)) {
      return true;
    }

    return normalizedCategory.includes(item) || item.includes(normalizedCategory);
  });
}

export const ARTICLES_COLLECTION = "articles";

export function getArticlesCollection() {
  return db ? collection(db, ARTICLES_COLLECTION) : null;
}

async function fetchPublicArticleData<T>(path: string): Promise<T>;
async function fetchPublicArticleData<T>(path: string, notFoundAsNull: true): Promise<T | null>;
async function fetchPublicArticleData<T>(path: string, notFoundAsNull = false): Promise<T | null> {
  const response = await fetch(path, {
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  if (notFoundAsNull && response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Public articles request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

function toArticle(id: string, data: DocumentData): Article | null {
  if (data.status !== "published" || data.published !== true) {
    return null;
  }

  return {
    id,
    title: typeof data.title === "string" ? data.title : "",
    slug: typeof data.slug === "string" ? data.slug : "",
    category: typeof data.category === "string" ? data.category : "",
    description: typeof data.description === "string" ? data.description : "",
    content: typeof data.content === "string" ? data.content : "",
    ...(typeof data.image === "string" ? { image: data.image } : {}),
    ...(typeof data.videoUrl === "string" ? { videoUrl: data.videoUrl } : {}),
    ...(Array.isArray(data.keywords)
      ? { keywords: data.keywords.filter((keyword: unknown): keyword is string => typeof keyword === "string") }
      : {}),
    ...(typeof data.author === "string" ? { author: data.author } : {}),
    ...(typeof data.views === "number" ? { views: data.views } : {}),
    status: "published",
    published: true,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

async function fetchPublishedArticlesFromFirestore() {
  if (!db) {
    throw new Error("Firebase Firestore is not configured in the browser.");
  }

  const snapshot = await getDocs(
    query(
      collection(db, ARTICLES_COLLECTION),
      where("status", "==", "published"),
      where("published", "==", true)
    )
  );

  return snapshot.docs
    .map((document) => toArticle(document.id, document.data()))
    .filter((article): article is Article => article !== null);
}

async function fetchPublishedArticleFromFirestore(identifier: string) {
  if (!db) {
    throw new Error("Firebase Firestore is not configured in the browser.");
  }

  const articles = collection(db, ARTICLES_COLLECTION);
  const directSnapshot = await getDocs(
    query(
      articles,
      where(documentId(), "==", identifier),
      where("status", "==", "published"),
      where("published", "==", true),
      limit(1)
    )
  );
  const directDocument = directSnapshot.docs[0];
  if (directDocument) {
    return toArticle(directDocument.id, directDocument.data());
  }

  const slugSnapshot = await getDocs(
    query(
      articles,
      where("slug", "==", identifier),
      where("status", "==", "published"),
      where("published", "==", true),
      limit(1)
    )
  );
  const document = slugSnapshot.docs[0];

  return document ? toArticle(document.id, document.data()) : null;
}

export async function saveArticle(article: Partial<Article>, id?: string) {
  if (!db) return null;

  const payload = {
    ...article,
    ...(article.videoUrl !== undefined ? { videoUrl: article.videoUrl } : {}),
    ...(article.keywords !== undefined ? { keywords: article.keywords } : {}),
    ...(article.status === "published" ? { published: true } : { published: false }),
  };

  if (id) {
    const ref = doc(db, ARTICLES_COLLECTION, id);
    const snapshot = await getDoc(ref);

    if (snapshot.exists()) {
      await updateDoc(ref, { ...payload, updatedAt: serverTimestamp() });
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
  if (status === "published") {
    try {
      const articles = await fetchPublicArticleData<unknown>("/api/articles");
      if (!Array.isArray(articles)) {
        throw new Error("Published articles endpoint returned an invalid response.");
      }

      return articles as Article[];
    } catch (apiError) {
      console.warn("PUBLIC_ARTICLES_API_UNAVAILABLE_USING_FIRESTORE", apiError);
      try {
        return await fetchPublishedArticlesFromFirestore();
      } catch (firestoreError) {
        console.error("ARTICLES_READ_ERROR", firestoreError);
        throw new AggregateError(
          [apiError, firestoreError],
          "Unable to load published articles from the API or Firestore."
        );
      }
    }
  }

  if (!db) {
    const error = new Error("Firebase Firestore is not configured.");
    console.error("ARTICLES_READ_ERROR", error);
    throw error;
  }

  try {
    const base = collection(db, ARTICLES_COLLECTION);
    const snapshot = await getDocs(status === "all"
      ? query(base)
      : query(base, where("status", "==", status), where("published", "==", true)));

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
  const normalizedIdentifier = identifier.trim();
  if (!normalizedIdentifier) return null;

  try {
    return await fetchPublicArticleData<Article>(
      `/api/articles/${encodeURIComponent(normalizedIdentifier)}`,
      true
    );
  } catch (apiError) {
    console.warn("PUBLIC_ARTICLE_API_UNAVAILABLE_USING_FIRESTORE", apiError);
    try {
      return await fetchPublishedArticleFromFirestore(normalizedIdentifier);
    } catch (firestoreError) {
      console.error("ARTICLE_READ_ERROR", firestoreError);
      throw new AggregateError(
        [apiError, firestoreError],
        "Unable to load the article from the API or Firestore."
      );
    }
  }
}
