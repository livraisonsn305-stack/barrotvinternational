"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/lib/auth-context";

export default function ConnexionPage() {
  const router = useRouter();
  const { signIn, signInWithGoogle, resetPassword, user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      router.replace("/");
    }
  }, [router, user]);

  if (loading) {
    return (
      <main className="min-h-screen bg-white text-slate-900">
        <div className="mx-auto flex min-h-screen max-w-md items-center justify-center px-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-semibold text-slate-700">
            Chargement...
          </div>
        </div>
      </main>
    );
  }

  if (user) {
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await signIn(email, password);
      router.push("/");
    } catch (submitError: unknown) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Une erreur est survenue pendant la connexion."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    setError("");

    try {
      await signInWithGoogle();
      router.push("/");
    } catch (submitError: unknown) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "La connexion Google a échoué."
      );
    }
  }

  async function handleForgotPassword() {
    if (!email) {
      setError("Saisissez votre email pour réinitialiser votre mot de passe.");
      return;
    }

    try {
      await resetPassword(email);
      setError("");
      alert("Un email de réinitialisation a été envoyé.");
    } catch (submitError: unknown) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Impossible d’envoyer le lien de réinitialisation."
      );
    }
  }

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

      <section className="mx-auto max-w-md px-4 py-12">
        <div className="rounded-3xl border bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-3xl font-black text-[#111b35]">Se connecter</h1>
          <p className="mt-2 text-slate-600">
            Accédez à votre espace Barro TV International.
          </p>

          {error ? (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-bold text-slate-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="votre@email.com"
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-[#d62828]"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-bold text-slate-700">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-[#d62828]"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-[#d62828] px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Connexion..." : "Se connecter"}
            </button>
          </form>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="mt-4 flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-5 py-3 font-bold text-[#111b35] transition hover:border-[#d62828] hover:text-[#d62828]"
          >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#d62828] text-xs font-black text-white">G</span>
            Continuer avec Google
          </button>

          <div className="mt-5 flex flex-col gap-2 text-sm text-slate-600 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-left font-semibold text-[#111b35] hover:text-[#d62828]"
            >
              Mot de passe oublié ?
            </button>
            <Link href="/inscription" className="font-semibold text-[#111b35] hover:text-[#d62828]">
              Créer un compte
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
