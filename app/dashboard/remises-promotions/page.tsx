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
  const [idActif, setIdActif] = useState<number | null>(null);
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
  setIdActif(null);
}

  async function enregistrer() {
  setMessage('');

  if (!nomPromotion.trim()) return setMessage('Nom promotion obligatoire.');
  if (Number(valeurRemise) <= 0) return setMessage('Valeur remise invalide.');
  if (dateFin < dateDebut) return setMessage('Date fin invalide.');
  if (!produitsChoisis.length) return setMessage('Ajoute au moins un produit.');

  const body = {
    nomPromotion: nomPromotion.trim(),
    typeRemise,
    valeurRemise: Number(valeurRemise),
    deviseRemise: montantFixe ? deviseRemise : null,
    dateDebut,
    dateFin,
    creePar: creePar || 'SYSTEM',
    idCampagneMarketing: idCampagneMarketing ? Number(idCampagneMarketing) : null,
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

  const url = idActif
    ? `${API_URL}/remises-promotions/${idActif}`
    : `${API_URL}/remises-promotions`;

  const res = await fetch(url, {
    method: idActif ? 'PATCH' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await lire(res);

  if (!res.ok) {
    setMessage(typeof data === 'string' ? data : JSON.stringify(data));
    return;
  }

  setMessage(data.message || (idActif ? 'Promotion modifiée.' : 'Promotion enregistrée.'));
  viderFormulaire();
  await charger();
}

  async function annulerPromotion(id: number) {
  if (!confirm('Annuler cette promotion ?')) return;

  const res = await fetch(`${API_URL}/remises-promotions/${id}/annuler`, {
    method: 'PATCH',
  });

  const data = await lire(res);

  if (!res.ok) {
    setMessage(typeof data === 'string' ? data : JSON.stringify(data));
    return;
  }

  setMessage(data.message || 'Promotion annulée.');
  await charger();
}

  function selectionnerPromotion(p: Promotion) {
  setIdActif(p.idPromotion);
  setNomPromotion(p.nomPromotion || '');
  setTypeRemise(p.typeRemise || 'Remise en Pourcentage');
  setValeurRemise(String(p.valeurRemise || 0));
  setDeviseRemise(p.deviseRemise || 'USD');
  setDateDebut(String(p.dateDebut || '').slice(0, 10));
  setDateFin(String(p.dateFin || '').slice(0, 10));
  setStatut(p.statut || 'Active');
  setPriorite(String(p.priorite || 1));
  setCumulable(p.cumulable === true || String(p.cumulable) === '1');
  setQuantiteMin(p.quantiteMin ? String(p.quantiteMin) : '');
  setMontantPanierMin(p.montantPanierMin ? String(p.montantPanierMin) : '');
  setCategorieClient(p.categorieClient || 'Tous');
  setCanalMarketing(p.canalMarketing || 'Boutique');
  setCreePar(p.creePar || 'SYSTEM');
  setProduitsChoisis(
    p.produits
      ? p.produits.split(',').map((x) => x.trim()).filter(Boolean)
      : [],
  );
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

function joursRestants(dateFin: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const fin = new Date(dateFin);
  fin.setHours(0, 0, 0, 0);

  return Math.ceil((fin.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function alertePromotion(p: Promotion) {
  const jours = joursRestants(p.dateFin);

  if (String(p.statut || '').toLowerCase().includes('annul')) {
    return 'Promotion annulée.';
  }

  if (jours < 0) return 'Promotion terminée.';

  if (jours === 0) {
    return `La promotion ${p.nomPromotion} prend fin aujourd’hui.`;
  }

  if (jours <= 3) {
    return `La promotion ${p.nomPromotion} des produits ${p.produits || '-'} prend fin le ${new Date(
      p.dateFin,
    ).toLocaleDateString('fr-FR')}. Il reste ${jours} jour(s).`;
  }

  return '';
}

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
            {idActif ? 'Modifier promotion' : 'Nouvelle promotion'}
          </h2>

          {/* Garde ici ton formulaire actuel sans changement */}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={enregistrer}
              className="rounded-xl bg-blue-700 px-5 py-3 font-bold text-white"
            >
              <Save className="mr-2 inline" size={16} />
              {idActif ? 'Modifier' : 'Enregistrer'}
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
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {promotions.map((p) => (
                  <tr key={p.idPromotion} className="border-b hover:bg-green-50">
                    <td className="p-3 font-bold">
                      <div>{p.nomPromotion}</div>

                      {alertePromotion(p) && (
                        <div className="mt-2 rounded-xl bg-amber-50 p-3 text-xs font-bold text-amber-800 ring-1 ring-amber-200">
                          ⚠️ {alertePromotion(p)}
                        </div>
                      )}
                    </td>

                    <td>{p.typeRemise}</td>

                    <td>
                      {Number(p.valeurRemise || 0).toLocaleString('fr-FR')}{' '}
                      {p.deviseRemise || '%'}
                    </td>

                    <td>
                      {p.dateDebut
                        ? new Date(p.dateDebut).toLocaleDateString('fr-FR')
                        : '-'}
                      {' → '}
                      {p.dateFin
                        ? new Date(p.dateFin).toLocaleDateString('fr-FR')
                        : '-'}
                    </td>

                    <td>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                        {p.statut || '-'}
                      </span>
                    </td>

                    <td>{p.priorite || 1}</td>

                    <td>
                      {p.cumulable === true || String(p.cumulable) === '1'
                        ? 'Oui'
                        : 'Non'}
                    </td>

                    <td>{p.categorieClient || 'Tous'}</td>
                    <td>{p.canalMarketing || 'Boutique'}</td>

                    <td>
                      Qté min : {p.quantiteMin || 0}
                      <br />
                      Panier min :{' '}
                      {Number(p.montantPanierMin || 0).toLocaleString('fr-FR')}
                    </td>

                    <td>{p.campagneMarketing || '-'}</td>
                    <td className="max-w-[220px] truncate">{p.produits || '-'}</td>

                    <td>
                      Util. : {p.nombreUtilisations || 0}
                      <br />
                      Remise : {Number(p.remiseTotale || 0).toLocaleString('fr-FR')}
                    </td>

                    <td>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => selectionnerPromotion(p)}
                          className="rounded-lg bg-blue-700 px-3 py-2 text-white"
                        >
                          Modifier
                        </button>

                        <button
                          onClick={() => annulerPromotion(p.idPromotion)}
                          className="rounded-lg bg-amber-600 px-3 py-2 text-white"
                        >
                          Annuler
                        </button>

                        <button
                          onClick={() => supprimer(p.idPromotion)}
                          className="rounded-lg bg-red-800 px-3 py-2 text-white"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
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