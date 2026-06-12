'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';


type Vente = {
  id_vente: number;
  datevente: string;
  nomcaissier: string | null;
  montanttotal: string | number;
  devise: string;
  statut: string;
};

export default function VentesPage() {
  const router = useRouter();

  const [ventes, setVentes] = useState<Vente[]>([]);
  const [recherche, setRecherche] = useState('');
  const [loading, setLoading] = useState(false);
  

  async function chargerVentes() {
    setLoading(true);

    try {
      const res = await fetch('https://messiematala-pos-backend-production.up.railway.app/ventes', {
        cache: 'no-store',
      });

      const data = await res.json();
      setVentes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      alert('Erreur : impossible de charger les ventes.');
    } finally {
      setLoading(false);
    }
  }

  function nouvelleVente() {
    router.push('/dashboard/ventes/nouvelle');
  }

 function voirVente(vente: Vente) {
  router.push(`/dashboard/ventes/detail?id=${vente.id_vente}`);
}

  useEffect(() => {
    chargerVentes();
  }, []);

  const ventesFiltrees = ventes.filter((v) =>
    `${v.id_vente} ${v.nomcaissier ?? ''} ${v.devise ?? ''} ${v.statut ?? ''}`
      .toLowerCase()
      .includes(recherche.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900">
      <section className="rounded-2xl bg-white p-6 shadow">
        <h1 className="text-2xl font-bold">Gestion des ventes</h1>
        <p className="text-slate-600">Contrôle, recherche et résultats des ventes</p>
      </section>

      <section className="mt-5 rounded-2xl bg-white p-5 shadow">
        <div className="flex gap-3">
          <input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className="flex-1 rounded-lg border px-4 py-2 text-slate-900"
            placeholder="Rechercher facture, caissier, devise, statut..."
          />

          <button
            type="button"
            onClick={chargerVentes}
            disabled={loading}
            className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? 'Chargement...' : 'Actualiser'}
          </button>

          <button
            type="button"
            onClick={nouvelleVente}
            className="rounded-lg bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700"
          >
            Nouvelle vente
          </button>
        </div>
      </section>

      <section className="mt-5 overflow-x-auto rounded-2xl bg-white shadow">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead className="bg-slate-900 text-white">
            <tr>
              <th className="p-3 text-left">ID</th>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Caissier</th>
              <th className="p-3 text-left">Montant</th>
              <th className="p-3 text-left">Devise</th>
              <th className="p-3 text-left">Statut</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>

          <tbody className="text-slate-900">
            {ventesFiltrees.map((v) => (
              <tr key={v.id_vente} className="border-b hover:bg-slate-50">
                <td className="p-3 font-semibold">#{v.id_vente}</td>

                <td className="p-3">
                  {v.datevente
                    ? new Date(v.datevente).toLocaleString('fr-FR')
                    : '-'}
                </td>

                <td className="p-3">{v.nomcaissier ?? '-'}</td>

                <td className="p-3 font-bold">
                  {Number(v.montanttotal || 0).toLocaleString('fr-FR')}
                </td>

                <td className="p-3">{v.devise ?? '-'}</td>
                <td className="p-3">{v.statut ?? '-'}</td>

                <td className="p-3">
                  <button
                    type="button"
                    onClick={() => voirVente(v)}
                    className="rounded bg-slate-900 px-3 py-1 text-white hover:bg-slate-700"
                  >
                    Voir
                  </button>
                </td>
              </tr>
            ))}

            {ventesFiltrees.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500">
                  Aucune vente trouvée.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}