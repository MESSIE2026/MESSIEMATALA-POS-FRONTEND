'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

const API = 'https://messiematala-pos-backend-production.up.railway.app';

type Vente = {
  id_vente: number;
  datevente: string;
  codefacture?: string | null;
  nomclient?: string | null;
  nomcaissier?: string | null;
  montanttotal: string | number;
  devise: string;
  modepaiement?: string | null;
  statut: string;
};

export default function VentesPage() {
  const router = useRouter();

  const [ventes, setVentes] = useState<Vente[]>([]);
  const [recherche, setRecherche] = useState('');
  const [loading, setLoading] = useState(false);

  async function lireApi(res: Response) {
    const texte = await res.text();

    try {
      return texte ? JSON.parse(texte) : null;
    } catch {
      return texte;
    }
  }

  async function chargerVentes() {
    setLoading(true);

    try {
      const res = await fetch(`${API}/ventes`, {
        cache: 'no-store',
      });

      const data = await lireApi(res);

      if (!res.ok) {
        alert(
          `Erreur API ${res.status} : ${
            typeof data === 'string' ? data : JSON.stringify(data)
          }`,
        );
        return;
      }

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

  function ouvrirManager() {
    router.push('/dashboard/ventes-manager');
  }

  function ouvrirRapports() {
    alert('Phase 5 : rapports ventes à créer progressivement.');
  }

  function formatMontant(v: any) {
    const n = Number(v ?? 0);

    return n.toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function statutClass(statut?: string | null) {
    const s = String(statut || '').toUpperCase();

    if (s.includes('ANNU')) return 'bg-red-100 text-red-700 border-red-200';
    if (s.includes('REMBOUR')) return 'bg-orange-100 text-orange-700 border-orange-200';
    if (s.includes('VALID')) return 'bg-emerald-100 text-emerald-700 border-emerald-200';

    return 'bg-slate-100 text-slate-700 border-slate-200';
  }

  useEffect(() => {
    chargerVentes();
  }, []);

  const ventesFiltrees = useMemo(() => {
    const q = recherche.trim().toLowerCase();

    if (!q) return ventes;

    return ventes.filter((v) => {
      const texte = [
        v.id_vente,
        v.codefacture,
        v.nomclient,
        v.nomcaissier,
        v.montanttotal,
        v.devise,
        v.modepaiement,
        v.statut,
      ]
        .join(' ')
        .toLowerCase();

      return texte.includes(q);
    });
  }, [ventes, recherche]);

  const totalVentes = ventesFiltrees.length;

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900">
      <section className="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-slate-200">
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-950 p-7 text-white">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-emerald-200">
            MESSIE MATALA POS / Ventes
          </p>

          <div className="mt-3 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <h1 className="text-3xl font-black">Gestion des ventes</h1>
              <p className="mt-2 text-sm text-emerald-50/80">
                Phase 1 : liste, recherche, détail, nouvelle vente et actualisation.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={chargerVentes}
                disabled={loading}
                className="rounded-xl bg-white px-5 py-3 text-sm font-black text-emerald-950 hover:bg-emerald-50 disabled:opacity-60"
              >
                {loading ? 'Chargement...' : 'Actualiser'}
              </button>

              <button
                type="button"
                onClick={nouvelleVente}
                className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-black text-white hover:bg-emerald-400"
              >
                Nouvelle vente
              </button>

              <button
                type="button"
                onClick={ouvrirManager}
                className="rounded-xl bg-slate-800 px-5 py-3 text-sm font-black text-white hover:bg-slate-700"
              >
                Manager
              </button>

              <button
                type="button"
                onClick={ouvrirRapports}
                className="rounded-xl bg-amber-400 px-5 py-3 text-sm font-black text-slate-950 hover:bg-amber-300"
              >
                Rapports
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-5 md:grid-cols-3">
          <Card title="Ventes affichées" value={totalVentes} />
          <Card title="Total chargé" value={ventes.length} />
          <Card title="Phase actuelle" value="Phase 1" />
        </div>
      </section>

      <section className="mt-5 rounded-[24px] bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <label className="mb-2 block text-sm font-black text-slate-700">
          Recherche
        </label>

        <input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-emerald-700"
          placeholder="Rechercher ID, facture, client, caissier, statut, devise..."
        />
      </section>

      <section className="mt-5 overflow-hidden rounded-[24px] bg-white shadow-sm ring-1 ring-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse text-sm">
            <thead className="bg-slate-900 text-left text-white">
              <tr>
                <th className="p-3">ID</th>
                <th className="p-3">Facture</th>
                <th className="p-3">Date</th>
                <th className="p-3">Client</th>
                <th className="p-3">Caissier</th>
                <th className="p-3">Paiement</th>
                <th className="p-3">Montant</th>
                <th className="p-3">Devise</th>
                <th className="p-3">Statut</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {ventesFiltrees.map((v) => (
                <tr key={v.id_vente} className="border-b hover:bg-emerald-50/40">
                  <td className="p-3 font-black">#{v.id_vente}</td>

                  <td className="p-3 font-bold text-slate-800">
                    {v.codefacture || '-'}
                  </td>

                  <td className="p-3">
                    {v.datevente
                      ? new Date(v.datevente).toLocaleString('fr-FR')
                      : '-'}
                  </td>

                  <td className="p-3">{v.nomclient || 'CLIENT CASH'}</td>
                  <td className="p-3">{v.nomcaissier || '-'}</td>
                  <td className="p-3">{v.modepaiement || '-'}</td>

                  <td className="p-3 text-right font-black">
                    {formatMontant(v.montanttotal)}
                  </td>

                  <td className="p-3 font-bold">{v.devise || '-'}</td>

                  <td className="p-3">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${statutClass(
                        v.statut,
                      )}`}
                    >
                      {v.statut || '-'}
                    </span>
                  </td>

                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => voirVente(v)}
                      className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-black text-white hover:bg-slate-700"
                    >
                      Voir détail
                    </button>
                  </td>
                </tr>
              ))}

              {ventesFiltrees.length === 0 && (
                <tr>
                  <td colSpan={10} className="p-10 text-center font-bold text-slate-500">
                    Aucune vente trouvée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function Card({ title, value }: { title: string; value: any }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">
        {title}
      </p>
      <h2 className="mt-2 text-2xl font-black text-emerald-950">
        {value}
      </h2>
    </div>
  );
}