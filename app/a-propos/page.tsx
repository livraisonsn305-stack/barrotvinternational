import Link from "next/link";

export default function AProposPage() {
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
        <h1 className="text-4xl font-black text-[#111b35]">À propos</h1>
        <div className="mt-6 space-y-6 text-lg leading-8 text-slate-700">
          <p>
            BARRO TV INTERNATIONAL est une plateforme d’information professionnelle,
            conçue pour informer les audiences sénégalaises et internationales sur les
            grands sujets de l’actualité.
          </p>
          <p>
            Nous couvrons la politique, la société, l’économie, le sport, l’Afrique et
            l’international avec un souci de rigueur, de clarté et de proximité avec nos
            lecteurs.
          </p>
          <p>
            Notre mission est de rendre l’information accessible, fiable et utile, en
            mettant à disposition des contenus professionnels, lisibles et adaptés à tous
            les écrans.
          </p>
        </div>
      </section>
    </main>
  );
}
