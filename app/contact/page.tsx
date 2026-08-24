"use client";

import Link from "next/link";
import { useState } from "react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

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
          </div>
        </div>

        <form
          className="rounded-3xl border bg-white p-6 shadow-sm"
          onSubmit={(event) => {
            event.preventDefault();
            setSubmitted(true);
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="nom" className="mb-2 block text-sm font-bold text-slate-700">
                Nom
              </label>
              <input
                id="nom"
                type="text"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-[#d62828]"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-bold text-slate-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-[#d62828]"
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
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-[#d62828]"
            />
          </div>

          <button
            type="submit"
            className="mt-5 rounded-lg bg-[#d62828] px-6 py-3 font-bold text-white"
          >
            Envoyer
          </button>

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
