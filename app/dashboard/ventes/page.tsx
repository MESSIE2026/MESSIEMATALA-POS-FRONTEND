'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  RefreshCw,
  ShoppingCart,
  Settings,
  FileBarChart,
  Eye,
} from 'lucide-react';

const API = 'https://messiematala-pos-backend-production.up.railway.app';

type Vente = {
  id_vente: number;
  datevente: string;
  codefacture?: string | null;
  nomclient?: string | null;
  nomcaissier?: string | null;
  montanttotal?: string | number;
  montant_total?: string | number;
  total?: string | number;
  totalvente?: string | number;
  total_vente?: string | number;
  devise?: string | null;
  modepaiement?: string | null;
  statut: string;

  totalUSD?: string | number;
  total_usd?: string | number;
  montantusd?: string | number;
  montant_usd?: string | number;
  totalusd?: string | number;

  totalCDF?: string | number;
  total_cdf?: string | number;
  montantcdf?: string | number;
  montant_cdf?: string | number;
  totalcdf?: string | number;
  montantfc?: string | number;
  montant_fc?: string | number;
  totalfc?: string | number;
  total_fc?: string | number;

  totalEUR?: string | number;
  total_eur?: string | number;
  montanteur?: string | number;
  montant_eur?: string | number;
  totaleur?: string | number;

  details?: any[];
detailsvente?: any[];
paiements?: any[];
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
    const res = await fetch(`${API}/ventes`, { cache: 'no-store' });
    const data = await lireApi(res);

    if (!res.ok) {
      alert(
        `Erreur API ${res.status} : ${
          typeof data === 'string' ? data : JSON.stringify(data)
        }`,
      );
      return;
    }

    const liste = Array.isArray(data) ? data : [];

    const ventesCompletes = await Promise.all(
      liste.map(async (v: any) => {
        try {
          const resDetail = await fetch(`${API}/ventes/${v.id_vente}`, {
            cache: 'no-store',
          });

          if (!resDetail.ok) return v;

          const detail = await lireApi(resDetail);

          return {
            ...v,
            ...detail,
            details: detail?.details ?? detail?.detailsvente ?? v.details ?? [],
            detailsvente: detail?.detailsvente ?? detail?.details ?? v.detailsvente ?? [],
            paiements: detail?.paiements ?? v.paiements ?? [],
          };
        } catch {
          return v;
        }
      }),
    );

    setVentes(ventesCompletes);
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
    router.push('/dashboard/ventes/rapports');
  }

  function nombre(v: any) {
  let texte = String(v ?? '0')
    .replace(/\$/g, '')
    .replace(/USD/gi, '')
    .replace(/CDF/gi, '')
    .replace(/FC/gi, '')
    .replace(/FRANCS?/gi, '')
    .replace(/CONGOLAIS/gi, '')
    .replace(/\u202f/g, '')
    .replace(/\u00a0/g, '')
    .replace(/\s/g, '')
    .trim();

  if (!texte) return 0;

  if (texte.includes(',') && texte.includes('.')) {
    texte = texte.replace(/\./g, '').replace(',', '.');
  } else if (texte.includes(',') && !texte.includes('.')) {
    texte = texte.replace(',', '.');
  }

  const n = Number(texte);
  return Number.isFinite(n) ? n : 0;
}

function normaliserDevise(devise?: string | null) {
  const d = String(devise ?? '').trim().toUpperCase();

  if (
    d === 'FC' ||
    d === 'CDF' ||
    d === 'FRC' ||
    d === 'FRANC' ||
    d === 'FRANCS' ||
    d === 'FRANC CONGOLAIS' ||
    d === 'FRANCS CONGOLAIS'
  ) {
    return 'CDF';
  }

  if (d === '$' || d === 'USD' || d === 'DOLLAR' || d === 'DOLLARS') return 'USD';
  if (d === 'EUR' || d === 'EURO' || d === 'EUROS') return 'EUR';

  return d || 'USD';
}

function montantParDevise(v: any, devise: 'USD' | 'CDF' | 'EUR') {
  const d = normaliserDevise(devise);

  const deviseVente = normaliserDevise(
    v.devise ??
      v.Devise ??
      v.DEVISE ??
      v.devisevente ??
      v.devise_vente ??
      v.deviseprincipale,
  );

  const montantGlobal = nombre(
    v.montanttotal ??
      v.montant_total ??
      v.total ??
      v.totalvente ??
      v.total_vente ??
      v.montant,
  );

  if (deviseVente === d && montantGlobal > 0) return montantGlobal;

  const champsDirects =
    d === 'USD'
      ? [v.totalUSD, v.total_usd, v.montantusd, v.montant_usd, v.totalusd]
      : d === 'CDF'
        ? [
            v.totalCDF,
            v.total_cdf,
            v.montantcdf,
            v.montant_cdf,
            v.totalcdf,
            v.montantfc,
            v.montant_fc,
            v.totalfc,
            v.total_fc,
            v.ventefc,
            v.vente_fc,
          ]
        : [v.totalEUR, v.total_eur, v.montanteur, v.montant_eur, v.totaleur];

  for (const champ of champsDirects) {
    const n = nombre(champ);
    if (n > 0) return n;
  }

  const lignes = Array.isArray(v.details)
    ? v.details
    : Array.isArray(v.detailsvente)
      ? v.detailsvente
      : [];

  const totalDetails = lignes
    .filter((x: any) => normaliserDevise(x.devise) === d)
    .reduce((s: number, x: any) => {
      const qte = nombre(x.quantite) || 1;
      const pu = nombre(x.prixunitaire ?? x.prix);
      const remise = nombre(x.remise);
      const tva = nombre(x.tva);
      const montant = nombre(x.montant ?? x.total);

      return s + (montant > 0 ? montant : Math.max(0, qte * pu - remise + tva));
    }, 0);

  if (totalDetails > 0) return totalDetails;

  const paiements = Array.isArray(v.paiements) ? v.paiements : [];

  const totalPaiements = paiements
    .filter((p: any) => normaliserDevise(p.devise) === d)
    .reduce((s: number, p: any) => s + nombre(p.montant), 0);

  return totalPaiements;
}

  function formatMontant(v: any, devise: string) {
    const n = nombre(v);
    const d = normaliserDevise(devise);
    const decimals = d === 'CDF' ? 0 : 2;

    return n.toLocaleString('fr-FR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
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
        montantParDevise(v, 'USD'),
        montantParDevise(v, 'CDF'),
        montantParDevise(v, 'EUR'),
      ]
        .join(' ')
        .toLowerCase();

      return texte.includes(q);
    });
  }, [ventes, recherche]);

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
                Liste des ventes avec totaux séparés par devise.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
  type="button"
  onClick={chargerVentes}
  disabled={loading}
  className="flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-emerald-950 hover:bg-emerald-50 disabled:opacity-60"
>
  <RefreshCw size={18} />
  {loading ? 'Chargement...' : 'Actualiser'}
</button>

<button
  type="button"
  onClick={nouvelleVente}
  className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-black text-white hover:bg-emerald-700"
>
  <ShoppingCart size={18} />
  Nouvelle vente
</button>

<button
  type="button"
  onClick={ouvrirManager}
  className="flex items-center gap-2 rounded-xl bg-slate-700 px-5 py-3 text-sm font-black text-white hover:bg-slate-800"
>
  <Settings size={18} />
  Manager
</button>

<button
  type="button"
  onClick={ouvrirRapports}
  className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-black text-white hover:bg-amber-600"
>
  <FileBarChart size={18} />
  Rapports
</button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-5 md:grid-cols-4">
          <Card title="Ventes affichées" value={ventesFiltrees.length} />
          <Card title="Total chargé" value={ventes.length} />
          <Card title="Devises" value="USD / CDF / EUR" />
          <Card title="Impression" value="A4 / Ticket" />
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
          <table className="w-full min-w-[1200px] border-collapse text-sm">
            <thead className="bg-slate-900 text-left text-white">
              <tr>
                <th className="p-3">ID</th>
                <th className="p-3">Facture</th>
                <th className="p-3">Date</th>
                <th className="p-3">Client</th>
                <th className="p-3">Caissier</th>
                <th className="p-3">Paiement</th>
                <th className="p-3 text-right">USD</th>
                <th className="p-3 text-right">CDF</th>
                <th className="p-3 text-right">EUR</th>
                <th className="p-3">Statut</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {ventesFiltrees.map((v) => {
                const usd = montantParDevise(v, 'USD');
                const cdf = montantParDevise(v, 'CDF');
                const eur = montantParDevise(v, 'EUR');

                return (
                  <tr key={v.id_vente} className="border-b hover:bg-emerald-50/40">
                    <td className="p-3 font-black">#{v.id_vente}</td>
                    <td className="p-3 font-bold">{v.codefacture || '-'}</td>

                    <td className="p-3">
                      {v.datevente ? new Date(v.datevente).toLocaleString('fr-FR') : '-'}
                    </td>

                    <td className="p-3">{v.nomclient || 'CLIENT CASH'}</td>
                    <td className="p-3">{v.nomcaissier || '-'}</td>
                    <td className="p-3">{v.modepaiement || '-'}</td>

                    <td className="p-3 text-right font-black text-emerald-800">
                      {usd > 0 ? `${formatMontant(usd, 'USD')} USD` : '-'}
                    </td>

                    <td className="p-3 text-right font-black text-blue-800">
                      {cdf > 0 ? `${formatMontant(cdf, 'CDF')} CDF` : '-'}
                    </td>

                    <td className="p-3 text-right font-black text-amber-700">
                      {eur > 0 ? `${formatMontant(eur, 'EUR')} EUR` : '-'}
                    </td>

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
  className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-black text-white hover:bg-slate-700"
>
  <Eye size={14} />
  Voir détail
</button>
                    </td>
                  </tr>
                );
              })}

              {ventesFiltrees.length === 0 && (
                <tr>
                  <td colSpan={11} className="p-10 text-center font-bold text-slate-500">
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
      <h2 className="mt-2 text-2xl font-black text-emerald-950">{value}</h2>
    </div>
  );
}