import Link from "next/link";

export default function PolitiquePage() {
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
          <nav className="hidden items-center gap-7 font-semibold md:flex">
            <Link href="/">Accueil</Link>
            <Link href="/politique" className="text-[#d62828]">Politique</Link>
            <Link href="/societe">Société</Link>
            <Link href="/sport">Sport</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="text-4xl font-black text-[#111b35]">Politique</h1>
        <div className="mt-6 grid gap-5">
          <Link href="/article/politique-senegal" className="rounded-2xl border p-5 shadow-sm">
            <div className="text-xs font-black uppercase tracking-wider text-[#d62828]">Politique</div>
            <h2 className="mt-2 text-2xl font-bold">Les dernières décisions politiques au Sénégal</h2>
          </Link>
        </div>
      </section>
    </main>
  );
}
