// app/legal/privacy/page.tsx
export default function Page() {
  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-3xl font-black text-slate-900">Politique de confidentialité</h1>
        <p className="mt-4 text-slate-600">
          MESSIE MATALA POS ERP collecte uniquement les informations nécessaires
          à la gestion commerciale, marketing, stock, caisse, rapports et connexions
          aux services externes comme Meta.
        </p>
        <p className="mt-3 text-slate-600">
          Les données ne sont pas vendues. Elles sont utilisées pour le fonctionnement
          de l’ERP, la sécurité, l’audit, les statistiques et les intégrations autorisées.
        </p>
        <p className="mt-3 text-slate-600">
          Contact : messiematala77@gmail.com
        </p>
      </div>
    </main>
  );
}