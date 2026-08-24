"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { ADMIN_EMAIL } from "@/lib/admin-config";
import { useAuth } from "@/lib/auth-context";

export default function AdminPage() {
  const router = useRouter();
  const { user, isAdmin, logout } = useAuth();

  useEffect(() => {
    if (!user) {
      router.replace("/connexion");
      return;
    }

    if (!isAdmin || user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      router.replace("/connexion");
    }
  }, [isAdmin, router, user]);

  if (!user || !isAdmin || user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return null;
  }

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="bg-[#111b35] text-white">
        <div className="mx-auto flex max-w-7xl justify-between px-4 py-2 text-sm">
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
          <button
            type="button"
            onClick={() => logout().then(() => router.push("/connexion"))}
            className="rounded-lg bg-[#111b35] px-4 py-2 font-bold text-white"
          >
            Déconnexion
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#d62828]">
              Administration
            </p>
            <h1 className="mt-2 text-3xl font-black text-[#111b35] md:text-4xl">
              Administration — BARRO TV INTERNATIONAL
            </h1>
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {[
            "Tableau de bord",
            "Nouvelle information",
            "Articles",
            "Catégories",
          ].map((item) => (
            <div key={item} className="rounded-2xl border bg-slate-50 p-5 shadow-sm">
              <div className="text-sm font-bold uppercase tracking-wider text-[#d62828]">
                {item}
              </div>
              <div className="mt-3 text-2xl font-black text-[#111b35]">0</div>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-[#111b35]">Informations publiées</h2>
          <p className="mt-4 text-slate-600">Connecté en tant que : {user.email}</p>
        </div>
      </section>
    </main>
  );
}
