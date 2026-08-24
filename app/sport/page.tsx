import Link from "next/link";

export default function SportPage() {
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

      <section className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="text-4xl font-black text-[#111b35]">Sport</h1>
        <div className="mt-6 rounded-2xl border p-5 shadow-sm">
          <Link href="/article/football-senegal" className="text-2xl font-bold text-[#111b35]">
            Les dernières nouvelles du football sénégalais
          </Link>
        </div>
      </section>
    </main>
  );
}
