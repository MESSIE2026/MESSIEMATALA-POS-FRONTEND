'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://messiematala-pos-backend-production.up.railway.app';

type DetailVente = {
  idDetails: number;
  idVente: number;
  idProduit: number;
  quantite: number;
  prixUnitaire: number;

  refProduit?: string;
  nomProduit?: string;
  remise?: number;
  tva?: number;
  montant?: number;
  devise?: string;
  nomCaissier?: string;

  nomClient?: string;
  numeroFacture?: string;

  idEntreprise?: number;
  idMagasin?: number;
  idPoste?: number;

  idDepot?: number;
  nomDepot?: string;

  quantiteRetournee?: number;
};

export default function DetailsVentePage() {
  const router = useRouter();

  const [idVente, setIdVente] = useState('');
  const [details, setDetails] = useState<DetailVente[]>([]);
  const [recherche, setRecherche] = useState('');
  const [selected, setSelected] = useState<DetailVente | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('idVente') || params.get('id') || '';
    setIdVente(id);
    charger(id);
  }, []);

  async function lireApi(res: Response) {
    const texte = await res.text();
    try {
      return texte ? JSON.parse(texte) : null;
    } catch {
      return texte;
    }
  }

  async function charger(id?: string) {
    setLoading(true);

    try {
      const url = id
        ? `${API}/details-vente?idVente=${encodeURIComponent(id)}`
        : `${API}/details-vente`;

      const res = await fetch(url, { cache: 'no-store' });
      const data = await lireApi(res);

      if (!res.ok) {
        alert(`Erreur API ${res.status} : ${JSON.stringify(data)}`);
        return;
      }

      setDetails(Array.isArray(data) ? data : []);
      setSelected(null);
    } catch (e) {
      console.error(e);
      alert('Impossible de charger les détails de vente.');
    } finally {
      setLoading(false);
    }
  }

  function nombre(v: any) {
    const n = Number(String(v ?? '0').replace(/\$/g, '').replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  }

  function formatMontant(v: any, devise = 'USD') {
    const d = String(devise || 'USD').toUpperCase();
    return nombre(v).toLocaleString('fr-FR', {
      minimumFractionDigits: d === 'CDF' ? 0 : 2,
      maximumFractionDigits: d === 'CDF' ? 0 : 2,
    });
  }

  const detailsFiltres = useMemo(() => {
    const q = recherche.trim().toLowerCase();

    if (!q) return details;

    return details.filter((d) =>
      [
        d.idDetails,
        d.idVente,
        d.idProduit,
        d.refProduit,
        d.nomProduit,
        d.devise,
        d.nomCaissier,
      ]
        .join(' ')
        .toLowerCase()
        .includes(q),
    );
  }, [details, recherche]);

  const stats = useMemo(() => {
    const total = detailsFiltres.reduce((s, d) => s + nombre(d.montant), 0);
    const qte = detailsFiltres.reduce((s, d) => s + nombre(d.quantite), 0);
    const retour = detailsFiltres.reduce(
      (s, d) => s + nombre(d.quantiteRetournee),
      0,
    );

    return { total, qte, retour, lignes: detailsFiltres.length };
  }, [detailsFiltres]);

  async function supprimerDetail(d: DetailVente) {
    const ok = window.confirm(
      `Supprimer le détail "${d.nomProduit || d.refProduit || d.idDetails}" ?`,
    );

    if (!ok) return;

    try {
      const res = await fetch(`${API}/details-vente/${d.idDetails}`, {
        method: 'DELETE',
      });

      const data = await lireApi(res);

      if (!res.ok) {
        alert(`Erreur suppression : ${JSON.stringify(data)}`);
        return;
      }

      alert(data?.message || 'Détail supprimé.');
      charger(idVente);
    } catch (e) {
      console.error(e);
      alert('Erreur suppression détail.');
    }
  }

 function ouvrirAnnulation(d: DetailVente) {
  const params = new URLSearchParams({
    idVente: String(d.idVente),
    idDetails: String(d.idDetails),
    idProduit: String(d.idProduit),
    nomProduit: d.nomProduit || '',
    refProduit: d.refProduit || '',
    quantite: String(d.quantite || 0),
    prixUnitaire: String(d.prixUnitaire || 0),
    devise: d.devise || 'USD',
    nomCaissier: d.nomCaissier || '',
    idEntreprise: String(d.idEntreprise || 1),
    idMagasin: String(d.idMagasin || 1),
    idPoste: String(d.idPoste || 1),
    idDepot: String(d.idDepot || ''),
    nomDepot: d.nomDepot || '',
    nomClient: d.nomClient || '',
    numeroFacture: d.numeroFacture || String(d.idVente),
  });

  router.push(`/dashboard/annulations?${params.toString()}`);
}
  function ouvrirVente(d: DetailVente) {
    router.push(`/dashboard/ventes/detail?id=${d.idVente}`);
  }

  return (
    <main className="min-h-screen bg-slate-100 p-3 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-700">
                Vente / Détails
              </p>
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                Détails de vente
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Liste des produits vendus, retours, montants et actions.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={idVente}
                onChange={(e) => setIdVente(e.target.value)}
                placeholder="ID Vente"
                className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-600"
              />

              <button
                onClick={() => charger(idVente)}
                className="rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800"
              >
                Charger
              </button>

              <button
                onClick={() => router.push('/dashboard/ventes')}
                className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800"
              >
                Ventes
              </button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Lignes</p>
            <p className="mt-2 text-2xl font-black text-slate-900">
              {stats.lignes}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Quantité vendue</p>
            <p className="mt-2 text-2xl font-black text-slate-900">
              {stats.qte}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Quantité retournée</p>
            <p className="mt-2 text-2xl font-black text-red-600">
              {stats.retour}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Total affiché</p>
            <p className="mt-2 text-2xl font-black text-emerald-700">
              {formatMontant(stats.total)}
            </p>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <input
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher produit, référence, caissier..."
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-600 lg:max-w-md"
            />

            <button
              onClick={() => charger(idVente)}
              className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Actualiser
            </button>
          </div>

          {loading ? (
            <div className="rounded-2xl bg-slate-50 p-8 text-center text-slate-500">
              Chargement...
            </div>
          ) : detailsFiltres.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-8 text-center text-slate-500">
              Aucun détail trouvé.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left text-xs uppercase text-slate-500">
                    <th className="px-3 py-2">ID</th>
                    <th className="px-3 py-2">Produit</th>
                    <th className="px-3 py-2">Référence</th>
                    <th className="px-3 py-2 text-right">Qté</th>
                    <th className="px-3 py-2 text-right">PU</th>
                    <th className="px-3 py-2 text-right">Remise</th>
                    <th className="px-3 py-2 text-right">TVA</th>
                    <th className="px-3 py-2 text-right">Montant</th>
                    <th className="px-3 py-2 text-right">Retournée</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {detailsFiltres.map((d) => (
                    <tr
                      key={d.idDetails}
                      onClick={() => setSelected(d)}
                      className="cursor-pointer bg-slate-50 text-sm hover:bg-emerald-50"
                    >
                      <td className="rounded-l-2xl px-3 py-3 font-bold">
                        #{d.idDetails}
                      </td>
                      <td className="px-3 py-3 font-semibold text-slate-900">
                        {d.nomProduit || '-'}
                        <div className="text-xs font-normal text-slate-500">
                          Vente #{d.idVente} · Produit #{d.idProduit}
                        </div>
                      </td>
                      <td className="px-3 py-3">{d.refProduit || '-'}</td>
                      <td className="px-3 py-3 text-right">{d.quantite}</td>
                      <td className="px-3 py-3 text-right">
                        {formatMontant(d.prixUnitaire, d.devise)} {d.devise}
                      </td>
                      <td className="px-3 py-3 text-right">
                        {formatMontant(d.remise, d.devise)}
                      </td>
                      <td className="px-3 py-3 text-right">
                        {formatMontant(d.tva, d.devise)}
                      </td>
                      <td className="px-3 py-3 text-right font-bold text-emerald-700">
                        {formatMontant(d.montant, d.devise)} {d.devise}
                      </td>
                      <td className="px-3 py-3 text-right font-bold text-red-600">
                        {d.quantiteRetournee || 0}
                      </td>
                      <td className="rounded-r-2xl px-3 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              ouvrirVente(d);
                            }}
                            className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white"
                          >
                            Vente
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              ouvrirAnnulation(d);
                            }}
                            className="rounded-xl bg-purple-700 px-3 py-2 text-xs font-bold text-white"
                          >
                            Annuler / Retour
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              supprimerDetail(d);
                            }}
                            className="rounded-xl bg-red-600 px-3 py-2 text-xs font-bold text-white"
                          >
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {selected && (
          <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900">
                Informations du détail
              </h2>
              <button
                onClick={() => setSelected(null)}
                className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700"
              >
                Fermer
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="ID Détail" value={selected.idDetails} />
              <Info label="ID Vente" value={selected.idVente} />
              <Info label="ID Produit" value={selected.idProduit} />
              <Info label="Produit" value={selected.nomProduit || '-'} />
              <Info label="Référence" value={selected.refProduit || '-'} />
              <Info label="Quantité" value={selected.quantite} />
              <Info
                label="Prix unitaire"
                value={`${formatMontant(selected.prixUnitaire, selected.devise)} ${selected.devise || ''}`}
              />
              <Info
                label="Montant"
                value={`${formatMontant(selected.montant, selected.devise)} ${selected.devise || ''}`}
              />
              <Info label="Devise" value={selected.devise || '-'} />
              <Info label="Caissier" value={selected.nomCaissier || '-'} />
              <Info label="Entreprise" value={selected.idEntreprise || '-'} />
              <Info label="Magasin" value={selected.idMagasin || '-'} />
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}