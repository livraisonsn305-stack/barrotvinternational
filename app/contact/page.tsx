"use client";

import Link from "next/link";
import { useState } from "react";

import { saveContactMessage } from "@/lib/contact";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError("Veuillez remplir tous les champs requis.");
      return;
    }

    setSending(true);

    try {
      await saveContactMessage({
        name: form.name,
        email: form.email,
        phone: form.phone,
        message: form.message,
      });

      setForm({ name: "", email: "", phone: "", message: "" });
      setSubmitted(true);
    } catch (submitError) {
      console.error("CONTACT_MESSAGE_SAVE_ERROR", submitError);
      setError("Impossible d'envoyer votre message pour le moment. Veuillez réessayer.");
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="bg-[#111b35] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 text-sm">
          <span>Dakar, Sénégal</span>
          <span className="hidden sm:block">BARRO TV INTERNATIONAL</span>
        </div>
      </div>

      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link href="/" className="block">
            <div className="text-2xl font-black">
              BARRO <span className="text-[#d62828]">TV</span>
            </div>
            <div className="text-[10px] font-bold tracking-[0.35em] text-slate-600">
              INTERNATIONAL
            </div>
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-12 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <h1 className="text-3xl font-black text-[#111b35] sm:text-4xl">
            Contact
          </h1>
          <div className="mt-6 rounded-2xl bg-slate-100 p-6">
            <h2 className="text-xl font-black text-[#111b35]">BARRO TV INTERNATIONAL</h2>
            <p className="mt-3 text-slate-600">Dakar, Sénégal</p>
            <p className="mt-2 font-semibold">Téléphone : 78 388 91 58</p>
            <a
              href="https://wa.me/221783889158?text=Bonjour%20Barro%20TV%20International%2C%20je%20souhaite%20vous%20contacter%20concernant%20votre%20site.%20Merci%20de%20me%20r%C3%A9pondre."
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#1ea952] sm:w-auto"
            >
              Contacter sur WhatsApp
            </a>
          </div>
        </div>

        <form className="rounded-3xl border bg-white p-6 shadow-sm" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="nom" className="mb-2 block text-sm font-bold text-slate-700">
                Nom
              </label>
              <input
                id="nom"
                type="text"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-[#d62828]"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-bold text-slate-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-[#d62828]"
                required
              />
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="telephone" className="mb-2 block text-sm font-bold text-slate-700">
              Téléphone
            </label>
            <input
              id="telephone"
              type="tel"
              value={form.phone}
              onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-[#d62828]"
            />
          </div>

          <div className="mt-4">
            <label htmlFor="message" className="mb-2 block text-sm font-bold text-slate-700">
              Message
            </label>
            <textarea
              id="message"
              rows={5}
              value={form.message}
              onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-[#d62828]"
              required
            />
          </div>

          <button
            type="submit"
            disabled={sending}
            className="mt-5 rounded-lg bg-[#d62828] px-6 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {sending ? "Envoi..." : "Envoyer"}
          </button>

          {error ? (
            <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </p>
          ) : null}

          {submitted && (
            <p className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
              Votre message a bien été envoyé. Nous vous répondrons bientôt.
            </p>
          )}
        </form>
      </section>
    </main>
  );
}
