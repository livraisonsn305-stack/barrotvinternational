export default function PolitiqueDeConfidentialitePage() {
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
        <h1 className="text-3xl font-black text-[#111b35]">Politique de confidentialité</h1>
        <div className="mt-6 space-y-5 text-slate-700">
          <p>
            Barro TV International s’engage à protéger les données personnelles des visiteurs et
            utilisateurs de son site.
          </p>
          <p>
            Les informations collectées sont utilisées uniquement pour améliorer l’expérience de
            lecture, gérer les abonnements et assurer le bon fonctionnement des services proposés.
          </p>
          <p>
            Les données ne sont ni vendues ni louées à des tiers, sauf obligations légales ou
            nécessité technique de service.
          </p>
          <p>
            L’utilisateur peut demander la suppression ou la mise à jour de ses informations en
            contactant la rédaction via les moyens de contact disponibles sur le site.
          </p>
        </div>
      </article>
    </main>
  );
}
