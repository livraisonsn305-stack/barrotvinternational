import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
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
  createdAt?: any;
  updatedAt?: any;
};

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
    await updateDoc(ref, payload);
    return id;
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
      ? query(base, orderBy("createdAt", "desc"))
      : query(
          base,
          where("status", "==", status),
          orderBy("createdAt", "desc")
        );

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
    status === "all"
      ? query(base, orderBy("createdAt", "desc"))
      : query(
          base,
          where("status", "==", status),
          orderBy("createdAt", "desc")
        );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnapshot) => ({
    id: docSnapshot.id,
    ...(docSnapshot.data() as DocumentData),
    createdAt: docSnapshot.data().createdAt,
    updatedAt: docSnapshot.data().updatedAt,
  })) as Article[];
}
