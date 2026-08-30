import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type DocumentData,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export type ContactMessageStatus = "unread" | "read";

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: ContactMessageStatus;
  reply: string;
  repliedAt: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export const CONTACT_MESSAGES_COLLECTION = "contact_messages";

export async function saveContactMessage(payload: {
  name: string;
  email: string;
  phone: string;
  message: string;
}) {
  if (!db) {
    return null;
  }

  const ref = await addDoc(collection(db, CONTACT_MESSAGES_COLLECTION), {
    name: payload.name.trim(),
    email: payload.email.trim(),
    phone: payload.phone.trim(),
    message: payload.message.trim(),
    createdAt: serverTimestamp(),
    status: "unread",
    reply: "",
    repliedAt: null,
  });

  return ref.id;
}

export async function fetchContactMessages() {
  if (!db) {
    return [] as ContactMessage[];
  }

  const snapshot = await getDocs(
    query(collection(db, CONTACT_MESSAGES_COLLECTION), orderBy("createdAt", "desc"))
  );

  return snapshot.docs.map((docSnapshot) => {
    const data = docSnapshot.data() as DocumentData;

    return {
      id: docSnapshot.id,
      name: String(data.name ?? ""),
      email: String(data.email ?? ""),
      phone: String(data.phone ?? ""),
      message: String(data.message ?? ""),
      status: (data.status === "read" ? "read" : "unread") as ContactMessageStatus,
      reply: String(data.reply ?? ""),
      repliedAt: data.repliedAt ?? null,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    } satisfies ContactMessage;
  });
}

export async function markContactMessageAsRead(id: string) {
  if (!db) {
    return;
  }

  await updateDoc(doc(db, CONTACT_MESSAGES_COLLECTION, id), {
    status: "read",
    updatedAt: serverTimestamp(),
  });
}

export async function saveContactReply(id: string, reply: string) {
  if (!db) {
    return;
  }

  await updateDoc(doc(db, CONTACT_MESSAGES_COLLECTION, id), {
    reply: reply.trim(),
    status: "read",
    repliedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteContactMessage(id: string) {
  if (!db) {
    return;
  }

  await deleteDoc(doc(db, CONTACT_MESSAGES_COLLECTION, id));
}
