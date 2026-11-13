/* Firebase Messaging worker. The configuration is fetched at runtime so public env values stay in one place. */
importScripts("https://www.gstatic.com/firebasejs/12.18.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.18.0/firebase-messaging-compat.js");

let messagingReady;

function getNotificationTargetUrl(payload) {
  const data = payload && payload.data ? payload.data : {};
  const candidates = [data.url, data.link, payload && payload.notification && payload.notification.click_action];
  const firstValid = candidates.find((value) => typeof value === "string" && value.trim().length > 0);

  if (!firstValid) {
    return "/";
  }

  try {
    return new URL(firstValid, self.location.origin).href;
  } catch {
    return self.location.origin + "/";
  }
}

function showBackgroundNotification(payload) {
  const notification = payload && payload.notification ? payload.notification : {};
  const title = notification.title || "Barro TV International";
  const body = notification.body || "Une nouvelle actualité est disponible.";
  const image = notification.image || (payload && payload.data && payload.data.image) || "";
  const url = getNotificationTargetUrl(payload);

  return self.registration.showNotification(title, {
    body,
    tag: url,
    icon: "/logo.png",
    badge: "/logo.png",
    image: image || undefined,
    data: { url },
  });
}

function initializeMessaging() {
  if (!messagingReady) {
    messagingReady = fetch("/api/notifications/config")
      .then((response) => {
        if (!response.ok) throw new Error("Firebase Messaging configuration unavailable");
        return response.json();
      })
      .then((config) => {
        firebase.initializeApp(config);
        const messaging = firebase.messaging();
        messaging.onBackgroundMessage((payload) => showBackgroundNotification(payload));
        return messaging;
      });
  }
  return messagingReady;
}

const messagingInitialization = initializeMessaging();
messagingInitialization.catch(() => undefined);

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  const payload = event.data && event.data.json ? event.data.json() : null;
  if (!payload) {
    return;
  }

  event.waitUntil(showBackgroundNotification(payload));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const requestedUrl = event.notification && event.notification.data && event.notification.data.url ? event.notification.data.url : "/";
  const url = (() => {
    try {
      return new URL(requestedUrl, self.location.origin).href;
    } catch {
      return self.location.origin + "/";
    }
  })();

  event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
    for (const client of clientList) {
      if ("focus" in client) {
        client.navigate(url);
        return client.focus();
      }
    }
    return clients.openWindow(url);
  }));
});