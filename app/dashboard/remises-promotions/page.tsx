'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  FileText,
  Gift,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  X,
} from 'lucide-react';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://messiematala-pos-backend-production.up.railway.app';

type Promotion = {
  idPromotion: number;
  nomPromotion: string;
  typeRemise: string;
  valeurRemise: number;
  deviseRemise?: string;
  dateDebut: string;
  dateFin: string;
  statut: string;
  campagneMarketing?: string;
  creePar?: string;
  dateCreation?: string;
  produits?: string;
};

export default function Page() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [produits, setProduits] = useState<any[]>([]);
  const [campagnes, setCampagnes] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [nomPromotion, setNomPromotion] = useState('');
  const [typeRemise, setTypeRemise] = useState('Remise en Pourcentage');
  const [valeurRemise, setValeurRemise] = useState('0');
  const [deviseRemise, setDeviseRemise] = useState('USD');
  const [dateDebut, setDateDebut] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [dateFin, setDateFin] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [idCampagneMarketing, setIdCampagneMarketing] = useState('');
  const [creePar, setCreePar] = useState('SYSTEM');
  const [produitChoisi, setProduitChoisi] = useState('');
  const [produitsChoisis, setProduitsChoisis] = useState<string[]>([]);

  const montantFixe = typeRemise.toUpperCase().includes('MONTANT');

  async function lire(res: Response) {
    const txt = await res.text();
    try {
      return JSON.parse(txt);
    } catch {
      return txt;
    }
  }

  async function charger() {
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch(
        `${API_URL}/remises-promotions?search=${encodeURIComponent(search)}`,
        { cache: 'no-store' },
      );
      const data = await lire(res);
      if (!res.ok) throw new Error(typeof data === 'string' ? data : JSON.stringify(data));
      setPromotions(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setMessage(e.message || 'Erreur chargement.');
    } finally {
      setLoading(false);
    }
  }

  async function chargerLookups() {
    try {
      const res = await fetch(`${API_URL}/remises-promotions/lookups`, {
        cache: 'no-store',
      });
      const data = await lire(res);
      setProduits(data.produits || []);
      setCampagnes(data.campagnes || []);
    } catch {}
  }

  useEffect(() => {
    chargerLookups();
    charger();
  }, []);

  function ajouterProduit() {
    if (!produitChoisi) return;
    if (!produitsChoisis.includes(produitChoisi)) {
      setProduitsChoisis((prev) => [...prev, produitChoisi]);
    }
    setProduitChoisi('');
  }

  function viderFormulaire() {
    setNomPromotion('');
    setTypeRemise('Remise en Pourcentage');
    setValeurRemise('0');
    setDeviseRemise('USD');
    setDateDebut(new Date().toISOString().slice(0, 10));
    setDateFin(new Date().toISOString().slice(0, 10));
    setIdCampagneMarketing('');
    setProduitsChoisis([]);
    setProduitChoisi('');
  }

  async function enregistrer() {
    setMessage('');

    if (!nomPromotion.trim()) return setMessage('Nom promotion obligatoire.');
    if (Number(valeurRemise) <= 0) return setMessage('Valeur remise invalide.');
    if (dateFin < dateDebut) return setMessage('Date fin invalide.');
    if (!produitsChoisis.length) return setMessage('Ajoute au moins un produit.');

    const body = {
      nomPromotion,
      typeRemise,
      valeurRemise: Number(valeurRemise),
      deviseRemise: montantFixe ? deviseRemise : null,
      dateDebut,
      dateFin,
      creePar,
      idCampagneMarketing: idCampagneMarketing
        ? Number(idCampagneMarketing)
        : null,
      produits: produitsChoisis,
      idEntreprise: 1,
      idMagasin: 1,
    };

    const res = await fetch(`${API_URL}/remises-promotions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await lire(res);

    if (!res.ok) {
      setMessage(typeof data === 'string' ? data : JSON.stringify(data));
      return;
    }

    setMessage(data.message || 'Promotion enregistrée.');
    viderFormulaire();
    await charger();
  }

  async function supprimer(id: number) {
    if (!confirm('Supprimer cette promotion ?')) return;

    const res = await fetch(`${API_URL}/remises-promotions/${id}`, {
      method: 'DELETE',
    });

    const data = await lire(res);

    if (!res.ok) {
      setMessage(typeof data === 'string' ? data : JSON.stringify(data));
      return;
    }

    setMessage(data.message || 'Promotion supprimée.');
    await charger();
  }

  function pdfMois() {
    const mois = new Date().toISOString().slice(0, 7);
    window.open(
      `${API_URL}/remises-promotions/pdf-mois?mois=${mois}&idEntreprise=1`,
      '_blank',
    );
  }

  const stats = useMemo(() => {
    return {
      total: promotions.length,
      actives: promotions.filter((p) =>
        String(p.statut || '').toUpperCase().includes('ACTIVE'),
      ).length,
      annulees: promotions.filter((p) =>
        String(p.statut || '').toUpperCase().includes('ANNU'),
      ).length,
    };
  }, [promotions]);

  return (
    <main className="min-h-screen bg-slate-100 p-3 md:p-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-green-700">
                Remises & Promotions
              </p>
              <h1 className="text-2xl font-black text-slate-900">
                Gestion des promotions commerciales
              </h1>
              <p className="text-sm text-slate-500">
                Compatible Mobile, Web, Windows, Mac et Terminal POS.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={charger}
                className="rounded-xl bg-slate-800 px-4 py-3 text-sm font-bold text-white"
              >
                <RefreshCw className="mr-2 inline" size={16} />
                Actualiser
              </button>

              <button
                onClick={pdfMois}
                className="rounded-xl bg-purple-700 px-4 py-3 text-sm font-bold text-white"
              >
                <FileText className="mr-2 inline" size={16} />
                PDF mois
              </button>
            </div>
          </div>
        </section>

        {message && (
          <div className="rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-800 ring-1 ring-amber-200">
            {message}
          </div>
        )}

        <section className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
            <p className="text-xs text-slate-500">Promotions</p>
            <b>{stats.total}</b>
          </div>
          <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
            <p className="text-xs text-slate-500">Actives</p>
            <b>{stats.actives}</b>
          </div>
          <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
            <p className="text-xs text-slate-500">Annulées</p>
            <b>{stats.annulees}</b>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-3xl bg-white p-5 ring-1 ring-slate-200">
            <h2 className="mb-4 text-lg font-black text-slate-900">
              <Gift className="mr-2 inline text-green-700" />
              Nouvelle promotion
            </h2>

            <div className="grid gap-3 md:grid-cols-2">
              <input
                value={nomPromotion}
                onChange={(e) => setNomPromotion(e.target.value)}
                placeholder="Nom promotion"
                className="rounded-xl border p-3 md:col-span-2"
              />

              <select
                value={typeRemise}
                onChange={(e) => setTypeRemise(e.target.value)}
                className="rounded-xl border p-3"
              >
                <option>Remise en Pourcentage</option>
                <option>Montant Fixe</option>
              </select>

              <div className="flex gap-2">
                <input
                  type="number"
                  value={valeurRemise}
                  onChange={(e) => setValeurRemise(e.target.value)}
                  className="w-full rounded-xl border p-3"
                  placeholder="Valeur"
                />

                {montantFixe && (
                  <select
                    value={deviseRemise}
                    onChange={(e) => setDeviseRemise(e.target.value)}
                    className="rounded-xl border p-3"
                  >
                    <option>USD</option>
                    <option>CDF</option>
                    <option>EUR</option>
                  </select>
                )}
              </div>

              <input
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                className="rounded-xl border p-3"
              />

              <input
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
                className="rounded-xl border p-3"
              />

              <select
                value={idCampagneMarketing}
                onChange={(e) => setIdCampagneMarketing(e.target.value)}
                className="rounded-xl border p-3 md:col-span-2"
              >
                <option value="">Aucune campagne</option>
                {campagnes.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.nomcampagne}
                  </option>
                ))}
              </select>

              <input
                value={creePar}
                onChange={(e) => setCreePar(e.target.value)}
                placeholder="Créé par"
                className="rounded-xl border p-3 md:col-span-2"
              />
            </div>

            <div className="mt-4 rounded-2xl bg-slate-50 p-4">
              <p className="mb-2 text-sm font-bold text-slate-700">
                Produits concernés
              </p>

              <div className="flex gap-2">
                <select
                  value={produitChoisi}
                  onChange={(e) => setProduitChoisi(e.target.value)}
                  className="w-full rounded-xl border p-3"
                >
                  <option value="">Choisir un produit</option>
                  {produits.map((p: any, i) => (
                    <option key={i} value={p.nom}>
                      {p.nom}
                    </option>
                  ))}
                </select>

                <button
                  onClick={ajouterProduit}
                  className="rounded-xl bg-green-700 px-4 font-bold text-white"
                >
                  <Plus size={18} />
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {produitsChoisis.map((p) => (
                  <button
                    key={p}
                    onClick={() =>
                      setProduitsChoisis((prev) => prev.filter((x) => x !== p))
                    }
                    className="rounded-full bg-white px-3 py-2 text-xs font-bold text-slate-700 ring-1 ring-slate-200"
                  >
                    {p} <X className="ml-1 inline" size={12} />
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={enregistrer}
                className="rounded-xl bg-blue-700 px-5 py-3 font-bold text-white"
              >
                <Save className="mr-2 inline" size={16} />
                Enregistrer
              </button>

              <button
                onClick={viderFormulaire}
                className="rounded-xl bg-slate-600 px-5 py-3 font-bold text-white"
              >
                Annuler
              </button>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-5 ring-1 ring-slate-200">
            <div className="mb-4 flex gap-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Recherche promotion, type, campagne..."
                className="w-full rounded-xl border p-3"
              />

              <button
                onClick={charger}
                className="rounded-xl bg-green-700 px-4 font-bold text-white"
              >
                <Search size={18} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="bg-slate-900 text-left text-white">
                    <th className="p-3">Promotion</th>
                    <th>Type</th>
                    <th>Valeur</th>
                    <th>Début</th>
                    <th>Fin</th>
                    <th>Statut</th>
                    <th>Campagne</th>
                    <th>Produits</th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  {promotions.map((p) => (
                    <tr key={p.idPromotion} className="border-b hover:bg-green-50">
                      <td className="p-3 font-bold">{p.nomPromotion}</td>
                      <td>{p.typeRemise}</td>
                      <td>
                        {Number(p.valeurRemise || 0).toLocaleString('fr-FR')}{' '}
                        {p.deviseRemise || '%'}
                      </td>
                      <td>
                        {p.dateDebut
                          ? new Date(p.dateDebut).toLocaleDateString('fr-FR')
                          : '-'}
                      </td>
                      <td>
                        {p.dateFin
                          ? new Date(p.dateFin).toLocaleDateString('fr-FR')
                          : '-'}
                      </td>
                      <td>{p.statut}</td>
                      <td>{p.campagneMarketing || '-'}</td>
                      <td className="max-w-[250px] truncate">
                        {p.produits || '-'}
                      </td>
                      <td>
                        <button
                          onClick={() => supprimer(p.idPromotion)}
                          className="rounded-lg bg-red-800 px-3 py-2 text-white"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {!loading && promotions.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-5 text-center text-slate-500">
                        Aucune promotion trouvée.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}