"use client";

import { useEffect, useState } from "react";

import { checkNotificationStatus, subscribeToPush, type PushSupport } from "@/lib/push-notifications";

export default function PushNotificationPrompt() {
  const [support, setSupport] = useState<PushSupport | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    void checkNotificationStatus().then(setSupport);
  }, []);

  async function handleSubscribe() {
    setIsLoading(true);
    setMessage("");
    try {
      const subscribed = await subscribeToPush();
      const status = await checkNotificationStatus();
      setSupport(status);
      if (!status.subscribed || !status.tokenAvailable || !subscribed.subscribed) {
        throw new Error("L'abonnement n'a pas pu être confirmé.");
      }
      setMessage("Notifications activées avec succès.");
    } catch (error) {
      const nextStatus = await checkNotificationStatus();
      setSupport(nextStatus);
      setMessage(error instanceof Error ? error.message : "Les notifications n'ont pas pu être activées.");
    } finally {
      setIsLoading(false);
    }
  }

  if (!support) return null;

  return (
    <section className="border-b border-slate-200 bg-slate-50" aria-label="Notifications push">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-black text-[#111b35]">🔔 Recevez les alertes Barro TV</p>
          <p className="text-sm text-slate-600">Recevez les dernières actualités de Barro TV International directement sur votre téléphone.</p>
          {support.subscribed && support.tokenAvailable ? <p className="mt-1 text-sm font-semibold text-emerald-700">Notifications activées avec succès.</p> : null}
          {!support.subscribed && message ? <p className="mt-1 text-sm font-semibold text-[#d62828]">{message}</p> : null}
          {!support.supported && support.reason ? <p className="mt-1 text-sm text-slate-600">{support.reason}</p> : null}
          {support.permission === "denied" && support.reason ? <p className="mt-1 text-sm text-slate-600">{support.reason}</p> : null}
        </div>
        {support.supported && support.permission !== "denied" && !support.subscribed ? (
          <button type="button" onClick={handleSubscribe} disabled={isLoading} className="shrink-0 rounded-lg bg-[#d62828] px-4 py-3 text-sm font-bold text-white disabled:opacity-60">
            {isLoading ? "Activation..." : "Activer les notifications"}
          </button>
        ) : null}
      </div>
    </section>
  );
}