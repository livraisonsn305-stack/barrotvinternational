"use client";

import { getMessaging, getToken, isSupported } from "firebase/messaging";

import { auth, firebaseEnabled, app } from "@/lib/firebase";

export type PushSupport = {
  supported: boolean;
  permission?: NotificationPermission;
  subscribed?: boolean;
  serviceWorkerReady?: boolean;
  tokenAvailable?: boolean;
  reason?: string;
};

type NavigatorWithUserAgentData = Navigator & {
  userAgentData?: {
    brands?: Array<{ brand: string }>;
    platform?: string;
  };
};

async function registerToken(token: string) {
  const response = await fetch("/api/notifications/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token,
      userAgent: navigator.userAgent,
      browser: (navigator as NavigatorWithUserAgentData).userAgentData?.brands?.[0]?.brand || navigator.appName,
      platform: (navigator as NavigatorWithUserAgentData).userAgentData?.platform || navigator.platform,
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.message || "L'abonnement n'a pas pu être enregistré.");
  }

  const payload = await response.json().catch(() => ({}));
  return Boolean(payload?.active ?? true);
}

export async function checkNotificationStatus(): Promise<PushSupport> {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return { supported: false, reason: "Les notifications push ne sont pas disponibles ici." };
  }

  if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    return {
      supported: false,
      reason: "Votre navigateur ne prend pas en charge les notifications push. Essayez Chrome ou un navigateur compatible.",
    };
  }

  if (!firebaseEnabled || !app || !process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY) {
    return { supported: false, reason: "Les notifications push ne sont pas encore configurées sur ce site." };
  }

  try {
    if (!(await isSupported())) {
      return {
        supported: false,
        reason: "Votre navigateur ne prend pas en charge les notifications push. Essayez Chrome ou un navigateur compatible.",
      };
    }
  } catch {
    return {
      supported: false,
      reason: "Votre navigateur ne prend pas en charge les notifications push. Essayez Chrome ou un navigateur compatible.",
    };
  }

  const permission = Notification.permission;
  if (permission === "denied") {
    return {
      supported: true,
      permission,
      subscribed: false,
      serviceWorkerReady: false,
      tokenAvailable: false,
      reason: "Les notifications sont bloquées dans les réglages de votre navigateur. Vous pouvez les réactiver depuis les paramètres du navigateur.",
    };
  }

  if (permission === "default") {
    return { supported: true, permission, subscribed: false, serviceWorkerReady: false, tokenAvailable: false };
  }

  try {
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", { scope: "/" });
    const ready = await navigator.serviceWorker.ready;
    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (!token) {
      return {
        supported: true,
        permission,
        subscribed: false,
        serviceWorkerReady: Boolean(ready.active),
        tokenAvailable: false,
      };
    }

    const persisted = await registerToken(token);
    return {
      supported: true,
      permission,
      subscribed: persisted,
      serviceWorkerReady: Boolean(ready.active),
      tokenAvailable: true,
    };
  } catch (error) {
    return {
      supported: true,
      permission,
      subscribed: false,
      serviceWorkerReady: false,
      tokenAvailable: false,
      reason: error instanceof Error ? error.message : "L'abonnement aux notifications doit être réactivé.",
    };
  }
}

export async function detectPushSupport(): Promise<PushSupport> {
  return checkNotificationStatus();
}

export async function subscribeToPush() {
  const support = await checkNotificationStatus();
  if (!support.supported || !auth || !app) {
    throw new Error(support.reason || "Les notifications push ne sont pas disponibles.");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Les notifications sont désactivées. Vous pouvez les autoriser dans les réglages de votre navigateur.");
  }

  const status = await checkNotificationStatus();
  if (!status.tokenAvailable || !status.subscribed || !status.serviceWorkerReady) {
    throw new Error("Impossible de créer l'abonnement aux notifications. Réessayez plus tard.");
  }

  return status;
}