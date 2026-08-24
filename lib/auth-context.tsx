"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

import { ADMIN_EMAIL } from "@/lib/admin-config";
import { auth, db, firebaseEnabled, googleProvider } from "@/lib/firebase";

const AuthContext = createContext<{
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
} | null>(null);

async function ensureUserProfile(user: User) {
  if (!db) return;

  const ref = doc(db, "users", user.uid);
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) {
    await setDoc(ref, {
      uid: user.uid,
      email: user.email || "",
      displayName: user.displayName || "",
      firstName: "",
      lastName: "",
      photoURL: user.photoURL || "",
      role: user.email === ADMIN_EMAIL ? "admin" : "user",
      createdAt: serverTimestamp(),
    });
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth || !firebaseEnabled) {
      setUser(null);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (nextUser) {
        await ensureUserProfile(nextUser);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, firstName: string, lastName: string) => {
      if (!auth || !firebaseEnabled) {
        throw new Error("La configuration Firebase n'est pas disponible.");
      }

      const credentials = await createUserWithEmailAndPassword(auth, email, password);
      const nextUser = credentials.user;

      if (db) {
        await setDoc(doc(db, "users", nextUser.uid), {
          uid: nextUser.uid,
          email: nextUser.email || "",
          displayName: `${firstName} ${lastName}`.trim(),
          firstName,
          lastName,
          photoURL: nextUser.photoURL || "",
          role: nextUser.email === ADMIN_EMAIL ? "admin" : "user",
          createdAt: serverTimestamp(),
        }, { merge: true });
      }
    },
    []
  );

  const signIn = useCallback(async (email: string, password: string) => {
    if (!auth || !firebaseEnabled) {
      throw new Error("La configuration Firebase n'est pas disponible.");
    }

    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!auth || !googleProvider || !firebaseEnabled) {
      throw new Error("La configuration Google Firebase n'est pas disponible.");
    }

    const result = await signInWithPopup(auth, googleProvider);
    await ensureUserProfile(result.user);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    if (!auth || !firebaseEnabled) {
      throw new Error("La configuration Firebase n'est pas disponible.");
    }

    await sendPasswordResetEmail(auth, email);
  }, []);

  const logout = useCallback(async () => {
    if (!auth || !firebaseEnabled) {
      return;
    }

    await signOut(auth);
  }, []);

  const isAdmin = Boolean(user && user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase());

  const value = useMemo(
    () => ({ user, loading, signUp, signIn, signInWithGoogle, resetPassword, logout, isAdmin }),
    [user, loading, signUp, signIn, signInWithGoogle, resetPassword, logout, isAdmin]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
