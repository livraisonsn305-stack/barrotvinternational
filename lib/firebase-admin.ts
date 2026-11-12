import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function normalizePrivateKey(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const trimmedValue = value.trim();
  const unquotedValue =
    (trimmedValue.startsWith('"') && trimmedValue.endsWith('"')) ||
    (trimmedValue.startsWith("'") && trimmedValue.endsWith("'"))
      ? trimmedValue.slice(1, -1)
      : trimmedValue;

  return unquotedValue
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
}

export function getFirebaseAdminApp() {
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Firebase Admin credentials are not configured.");
  }

  if (!/^-----BEGIN PRIVATE KEY-----\n[\s\S]+\n-----END PRIVATE KEY-----$/.test(privateKey)) {
    throw new Error(
      "FIREBASE_PRIVATE_KEY must contain a complete PEM key; encode line breaks as \\n in .env.local."
    );
  }

  const defaultApp = getApps().find((app) => app.name === "[DEFAULT]");
  return defaultApp ?? initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

export function getAdminDb() {
  return getFirestore(getFirebaseAdminApp());
}

export function getAdminAuth() {
  return getAuth(getFirebaseAdminApp());
}