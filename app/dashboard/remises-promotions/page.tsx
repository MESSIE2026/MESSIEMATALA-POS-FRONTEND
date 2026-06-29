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

  priorite?: number;
  cumulable?: boolean | string;
  quantiteMin?: number;
  montantPanierMin?: number;
  categorieClient?: string;
  canalMarketing?: string;

  nombreUtilisations?: number;
  chiffreAffairesGenere?: number;
  remiseTotale?: number;
};

export default function Page() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [produits, setProduits] = useState<any[]>([]);
  const [campagnes, setCampagnes] = useState<any[]>([]);
  const [categoriesClient, setCategoriesClient] = useState<string[]>([]);
const [canauxMarketing, setCanauxMarketing] = useState<string[]>([]);
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
  const [priorite, setPriorite] = useState('1');
const [cumulable, setCumulable] = useState(false);
const [quantiteMin, setQuantiteMin] = useState('');
const [montantPanierMin, setMontantPanierMin] = useState('');
const [statut, setStatut] = useState('Active');
const [categorieClient, setCategorieClient] = useState('Tous');
const [canalMarketing, setCanalMarketing] = useState('Boutique');
const [heureDebut, setHeureDebut] = useState('');
const [heureFin, setHeureFin] = useState('');
const [validationManager, setValidationManager] = useState(false);
const [managerValidation, setManagerValidation] = useState('');

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
    setCategoriesClient(data.categoriesClient || [
      'Tous',
      'VIP',
      'Nouveau client',
      'Client dormant',
      'Client fidèle',
    ]);
    setCanauxMarketing(data.canauxMarketing || [
      'Boutique',
      'WhatsApp',
      'Facebook',
      'SMS',
      'Affichage boutique',
    ]);
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
  setCreePar('SYSTEM');
  setProduitsChoisis([]);
  setProduitChoisi('');

  setPriorite('1');
  setCumulable(false);
  setQuantiteMin('');
  setMontantPanierMin('');
  setStatut('Active');
  setCategorieClient('Tous');
  setCanalMarketing('Boutique');
  setHeureDebut('');
  setHeureFin('');
  setValidationManager(false);
  setManagerValidation('');
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

  priorite: Number(priorite || 1),
  cumulable,
  quantiteMin: quantiteMin ? Number(quantiteMin) : null,
  montantPanierMin: montantPanierMin ? Number(montantPanierMin) : null,
  statut,
  categorieClient,
  canalMarketing,
  heureDebut: heureDebut || null,
  heureFin: heureFin || null,
  validationManager,
  managerValidation: validationManager ? managerValidation : null,

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
    planifiees: promotions.filter((p) =>
      String(p.statut || '').toUpperCase().includes('PLAN'),
    ).length,
    terminees: promotions.filter((p) =>
      String(p.statut || '').toUpperCase().includes('TERM'),
    ).length,
    annulees: promotions.filter((p) =>
      String(p.statut || '').toUpperCase().includes('ANNU'),
    ).length,
    cumulables: promotions.filter(
      (p) => p.cumulable === true || String(p.cumulable) === '1',
    ).length,
    utilisations: promotions.reduce(
      (s, p) => s + Number(p.nombreUtilisations || 0),
      0,
    ),
    chiffreAffaires: promotions.reduce(
      (s, p) => s + Number(p.chiffreAffairesGenere || 0),
      0,
    ),
    remiseTotale: promotions.reduce(
      (s, p) => s + Number(p.remiseTotale || 0),
      0,
    ),
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

        <section className="grid gap-3 md:grid-cols-4">
  <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
    <p className="text-xs text-slate-500">Promotions</p>
    <b>{stats.total}</b>
  </div>

  <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
    <p className="text-xs text-slate-500">Actives</p>
    <b>{stats.actives}</b>
  </div>

  <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
    <p className="text-xs text-slate-500">Planifiées</p>
    <b>{stats.planifiees}</b>
  </div>

  <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
    <p className="text-xs text-slate-500">Terminées</p>
    <b>{stats.terminees}</b>
  </div>

  <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
    <p className="text-xs text-slate-500">Annulées</p>
    <b>{stats.annulees}</b>
  </div>

  <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
    <p className="text-xs text-slate-500">Cumulables</p>
    <b>{stats.cumulables}</b>
  </div>

  <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
    <p className="text-xs text-slate-500">Utilisations</p>
    <b>{stats.utilisations}</b>
  </div>

  <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
    <p className="text-xs text-slate-500">Remises données</p>
    <b>{stats.remiseTotale.toLocaleString('fr-FR')}</b>
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
        
            <select
  value={statut}
  onChange={(e) => setStatut(e.target.value)}
  className="rounded-xl border p-3"
>
  <option>Active</option>
  <option>Planifiée</option>
  <option>Terminée</option>
  <option>Annulée</option>
</select>

<input
  type="number"
  value={priorite}
  onChange={(e) => setPriorite(e.target.value)}
  placeholder="Priorité"
  className="rounded-xl border p-3"
/>

<label className="flex items-center gap-2 rounded-xl border p-3 text-sm font-bold">
  <input
    type="checkbox"
    checked={cumulable}
    onChange={(e) => setCumulable(e.target.checked)}
  />
  Cumulable
</label>

<input
  type="number"
  value={quantiteMin}
  onChange={(e) => setQuantiteMin(e.target.value)}
  placeholder="Quantité minimale"
  className="rounded-xl border p-3"
/>

<input
  type="number"
  value={montantPanierMin}
  onChange={(e) => setMontantPanierMin(e.target.value)}
  placeholder="Montant panier minimum"
  className="rounded-xl border p-3"
/>

<select
  value={categorieClient}
  onChange={(e) => setCategorieClient(e.target.value)}
  className="rounded-xl border p-3"
>
  {categoriesClient.map((c) => (
    <option key={c}>{c}</option>
  ))}
</select>

<select
  value={canalMarketing}
  onChange={(e) => setCanalMarketing(e.target.value)}
  className="rounded-xl border p-3"
>
  {canauxMarketing.map((c) => (
    <option key={c}>{c}</option>
  ))}
</select>

<input
  type="time"
  value={heureDebut}
  onChange={(e) => setHeureDebut(e.target.value)}
  className="rounded-xl border p-3"
/>

<input
  type="time"
  value={heureFin}
  onChange={(e) => setHeureFin(e.target.value)}
  className="rounded-xl border p-3"
/>

<label className="flex items-center gap-2 rounded-xl border p-3 text-sm font-bold md:col-span-2">
  <input
    type="checkbox"
    checked={validationManager}
    onChange={(e) => setValidationManager(e.target.checked)}
  />
  Validation manager requise
</label>

{validationManager && (
  <input
    value={managerValidation}
    onChange={(e) => setManagerValidation(e.target.value)}
    placeholder="Nom du manager validateur"
    className="rounded-xl border p-3 md:col-span-2"
  />
)}
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
            <table className="w-full min-w-[1250px] text-sm">
  <thead>
    <tr className="bg-slate-900 text-left text-white">
      <th className="p-3">Promotion</th>
      <th>Type</th>
      <th>Valeur</th>
      <th>Période</th>
      <th>Statut</th>
      <th>Priorité</th>
      <th>Cumul</th>
      <th>Client</th>
      <th>Canal</th>
      <th>Conditions</th>
      <th>Campagne</th>
      <th>Produits</th>
      <th>Performance</th>
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
          {p.dateDebut ? new Date(p.dateDebut).toLocaleDateString('fr-FR') : '-'}
          {' → '}
          {p.dateFin ? new Date(p.dateFin).toLocaleDateString('fr-FR') : '-'}
        </td>

        <td>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
            {p.statut || '-'}
          </span>
        </td>

        <td>{p.priorite || 1}</td>

        <td>
          {p.cumulable === true || String(p.cumulable) === '1' ? 'Oui' : 'Non'}
        </td>

        <td>{p.categorieClient || 'Tous'}</td>

        <td>{p.canalMarketing || 'Boutique'}</td>

        <td>
          Qté min : {p.quantiteMin || 0}
          <br />
          Panier min : {Number(p.montantPanierMin || 0).toLocaleString('fr-FR')}
        </td>

        <td>{p.campagneMarketing || '-'}</td>

        <td className="max-w-[220px] truncate">{p.produits || '-'}</td>

        <td>
          Util. : {p.nombreUtilisations || 0}
          <br />
          Remise : {Number(p.remiseTotale || 0).toLocaleString('fr-FR')}
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
        <td colSpan={14} className="p-5 text-center text-slate-500">
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