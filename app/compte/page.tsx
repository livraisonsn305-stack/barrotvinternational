"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";

import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";

type Profile = {
  displayName: string;
  firstName: string;
  lastName: string;
  photoURL: string;
};

const emptyProfile: Profile = { displayName: "", firstName: "", lastName: "", photoURL: "" };

export default function AccountPage() {
  const router = useRouter();
  const { user, loading, saveProfile, logout } = useAuth();
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!loading && !user) router.replace("/connexion");
  }, [loading, router, user]);

  useEffect(() => {
    if (!user) return;
    const currentUser = user;

    async function loadProfile() {
      const snapshot = db ? await getDoc(doc(db, "users", currentUser.uid)) : null;
      const data = snapshot?.data();
      setProfile({
        displayName: String(data?.displayName || currentUser.displayName || ""),
        firstName: String(data?.firstName || ""),
        lastName: String(data?.lastName || ""),
        photoURL: String(data?.photoURL || currentUser.photoURL || ""),
      });
    }

    void loadProfile();
  }, [user]);

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await saveProfile(profile);
      setEditing(false);
      setMessage("Votre profil a été enregistré.");
    } catch {
      setMessage("Impossible d'enregistrer votre profil pour le moment.");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await logout();
    router.replace("/connexion");
  }

  if (loading || !user) {
    return <main className="min-h-screen bg-white p-10 text-center text-slate-700">Chargement…</main>;
  }

  const provider = user.providerData.some((item) => item.providerId === "google.com") ? "Google" : "E-mail et mot de passe";
  const photo = profile.photoURL || user.photoURL;

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link href="/" className="block">
            <div className="text-2xl font-black">BARRO <span className="text-[#d62828]">TV</span></div>
            <div className="text-[10px] font-bold tracking-[0.35em] text-slate-600">INTERNATIONAL</div>
          </Link>
          <button type="button" onClick={handleLogout} className="rounded-lg bg-[#d62828] px-4 py-2 font-bold text-white">Se déconnecter</button>
        </div>
      </header>

      <section className="mx-auto max-w-2xl px-4 py-10">
        <div className="rounded-3xl border bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-3xl font-black text-[#111b35]">Mon compte</h1>
          <div className="mt-6 flex items-center gap-4">
            {photo ? <img src={photo} alt="Photo de profil" className="h-20 w-20 rounded-full object-cover" /> : <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#111b35] text-2xl font-black text-white">{(profile.displayName || user.email || "?").charAt(0).toUpperCase()}</div>}
            <div>
              <h2 className="text-xl font-bold text-[#111b35]">{profile.displayName || "Utilisateur"}</h2>
              <p className="text-slate-600">{user.email}</p>
            </div>
          </div>

          <dl className="mt-8 grid gap-4 border-t pt-6 sm:grid-cols-2">
            <div><dt className="text-sm font-bold text-slate-500">Nom</dt><dd className="mt-1">{profile.lastName || "Non renseigné"}</dd></div>
            <div><dt className="text-sm font-bold text-slate-500">Prénom</dt><dd className="mt-1">{profile.firstName || "Non renseigné"}</dd></div>
            <div><dt className="text-sm font-bold text-slate-500">Méthode de connexion</dt><dd className="mt-1">{provider}</dd></div>
            <div><dt className="text-sm font-bold text-slate-500">Adresse e-mail</dt><dd className="mt-1 break-all">{user.email}</dd></div>
          </dl>

          {message ? <p className="mt-5 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700">{message}</p> : null}

          {editing ? (
            <form onSubmit={handleSave} className="mt-8 space-y-4 border-t pt-6">
              <label className="block text-sm font-bold text-slate-700">Nom d'affichage<input value={profile.displayName} onChange={(event) => setProfile((current) => ({ ...current, displayName: event.target.value }))} className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3" /></label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-bold text-slate-700">Nom<input value={profile.lastName} onChange={(event) => setProfile((current) => ({ ...current, lastName: event.target.value }))} className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3" /></label>
                <label className="block text-sm font-bold text-slate-700">Prénom<input value={profile.firstName} onChange={(event) => setProfile((current) => ({ ...current, firstName: event.target.value }))} className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3" /></label>
              </div>
              <label className="block text-sm font-bold text-slate-700">Photo de profil (URL)<input type="url" value={profile.photoURL} onChange={(event) => setProfile((current) => ({ ...current, photoURL: event.target.value }))} className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3" /></label>
              <div className="flex gap-3"><button type="submit" disabled={saving} className="rounded-lg bg-[#d62828] px-5 py-3 font-bold text-white disabled:opacity-70">{saving ? "Enregistrement..." : "Enregistrer"}</button><button type="button" onClick={() => setEditing(false)} className="rounded-lg border border-slate-300 px-5 py-3 font-bold">Annuler</button></div>
            </form>
          ) : <button type="button" onClick={() => setEditing(true)} className="mt-8 rounded-lg bg-[#111b35] px-5 py-3 font-bold text-white">Modifier mon profil</button>}

          <button type="button" onClick={() => setMessage("Les paramètres de compte Firebase sont gérés par votre méthode de connexion.")} className="mt-4 block font-semibold text-[#111b35] hover:text-[#d62828]">Paramètres</button>
        </div>
      </section>
    </main>
  );
}