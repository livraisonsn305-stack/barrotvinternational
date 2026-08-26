export default function MentionsLegalesPage() {
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
          <a href="/" className="block">
            <div className="text-2xl font-black">
              BARRO <span className="text-[#d62828]">TV</span>
            </div>
            <div className="text-[10px] font-bold tracking-[0.35em] text-slate-600">
              INTERNATIONAL
            </div>
          </a>
        </div>
      </header>

      <article className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-3xl font-black text-[#111b35]">Mentions légales</h1>
        <div className="mt-6 space-y-5 text-slate-700">
          <p>
            Barro TV International est un média d’information indépendant édité au Sénégal.
          </p>
          <p>
            Les contenus publiés sur ce site sont fournis à titre d’information générale. La
            rédaction s’efforce de vérifier les informations avant publication, mais ne peut garantir
            l’exhaustivité ou l’absence de toute erreur.
          </p>
          <p>
            Le site est hébergé dans le cadre de l’exploitation de la plateforme de publication
            Barro TV International. L’accès et l’utilisation du site sont soumis aux lois et
            réglementations applicables en République du Sénégal.
          </p>
          <p>
            Toute réutilisation des contenus, textes, images ou données doit faire l’objet d’une
            autorisation préalable de la rédaction.
          </p>
        </div>
      </article>
    </main>
  );
}
