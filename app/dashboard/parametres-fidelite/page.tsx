'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  BadgeCheck,
  Building2,
  Calculator,
  CheckCircle2,
  Clock3,
  Coins,
  Database,
  Loader2,
  RefreshCw,
  Save,
  Settings2,
  ShieldCheck,
  Store,
  UserCheck,
} from 'lucide-react';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://messiematala-pos-backend-production.up.railway.app';

type ReglesFidelite = {
  identreprise: number | '';
  idmagasin: number | '';
  fenetrejours: number | '';
  minnbventespromo: number | '';
  mintotalpromo: number | '';
  minnbventesretro: number | '';
  mintotalretro: number | '';
  devisebase: 'USD' | 'CDF' | 'EUR';
  modecondition: 'OR' | 'AND';
  taux_cashback: number | '';
points_par_dollar: number | '';
plafond_cashback: number | '';
cashback_max_par_vente: number | '';
  actif: boolean;
};

type NiveauFidelite = {
  id?: number;
  identreprise: number;
  idmagasin: number;
  nom_niveau: string;
  ordre: number;
  min_achats: number;
  min_tickets: number;
  cashback_percent: number;
  points_par_dollar: number;
  plafond_cashback: number;
  cashback_max_par_vente: number;
  bonus_anniversaire: number;
  promotion_speciale: number;
  priorite_service: boolean;
  couleur: string;
  icone: string;
  actif: boolean;
  anciennete_min_jours: number;
depense_moyenne_min: number;
visites_min: number;
validite_niveau_jours: number;

bonus_premier_achat: number;
bonus_noel: number;
bonus_nouvel_an: number;
bonus_mariage: number;
bonus_etudiant: number;
bonus_client_mois: number;

plafond_cashback_mensuel: number;
plafond_cashback_annuel: number;
solde_min_retrait: number;

promotion_permanente: number;
multiplicateur_points: number;

acces_ventes_privees: boolean;
acces_promotions_vip: boolean;

livraison_gratuite: boolean;
priorite_caisse: boolean;
priorite_sav: boolean;
emballage_cadeau: boolean;
retouches_gratuites: boolean;
invitations_evenements: boolean;

expiration_points_active: boolean;
expiration_points_jours: number;

expiration_cashback_active: boolean;
expiration_cashback_jours: number;

notification_sms: boolean;
notification_email: boolean;
notification_whatsapp: boolean;

updatedby?: string;
};

type AuditLine = {
  date: string;
  type: 'INFO' | 'SUCCESS' | 'ERROR';
  message: string;
};

type ClientSearch = {
  id_clients: number;
  nom: string;
  prenom: string;
  telephone: string;
  telephoneclean?: string;
  categorieclient: string;
};

const toNumberInput = (value: string) => {
  return value === '' ? '' : Number(value);
};

const defaultRegles: ReglesFidelite = {
  identreprise: 1,
  idmagasin: 0,
  fenetrejours: 90,
  minnbventespromo: 10,
  mintotalpromo: 200,
  minnbventesretro: 3,
  mintotalretro: 50,
  devisebase: 'USD',
  modecondition: 'OR',
  taux_cashback: 2,
points_par_dollar: 1,
plafond_cashback: 0,
cashback_max_par_vente: 0,
  actif: true,
};

export default function Page() {
  const [form, setForm] = useState<ReglesFidelite>(defaultRegles);
  const [searchClient, setSearchClient] = useState('');
const [clients, setClients] = useState<ClientSearch[]>([]);
const [clientSelectionne, setClientSelectionne] = useState<ClientSearch | null>(null);
const [loadingClients, setLoadingClients] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [message, setMessage] = useState('');
  const [audit, setAudit] = useState<AuditLine[]>([]);
  const [niveaux, setNiveaux] = useState<NiveauFidelite[]>([]);
const [loadingNiveaux, setLoadingNiveaux] = useState(false);
const [savingNiveau, setSavingNiveau] = useState(false);

  const addAudit = (type: AuditLine['type'], message: string) => {
    setAudit((old) => [
      {
        date: new Date().toLocaleString('fr-FR'),
        type,
        message,
      },
      ...old.slice(0, 9),
    ]);
  };

  const update = (key: keyof ReglesFidelite, value: any) => {
    setForm((old) => ({
      ...old,
      [key]: value,
    }));
  };

  const conditionText = useMemo(() => {
    return form.modecondition === 'AND'
      ? 'Le client doit respecter le nombre de ventes ET le montant total.'
      : 'Le client doit respecter le nombre de ventes OU le montant total.';
  }, [form.modecondition]);

  async function getJson(url: string) {
    const res = await fetch(url, {
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(await res.text());
    }

    return res.json();
  }

  async function postJson(url: string, body: any) {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(await res.text());
    }

    return res.json();
  }

  async function chargerRegles() {
    try {
      setLoading(true);
      setMessage('');

      const data = await getJson(
        `${API_URL}/parametres-fidelite?idEntreprise=${form.identreprise}&idMagasin=${form.idmagasin}`,
      );

      setForm({
        identreprise: Number(data.identreprise || 1),
        idmagasin: Number(data.idmagasin || 0),
        fenetrejours: Number(data.fenetrejours || 90),
        minnbventespromo: Number(data.minnbventespromo || 10),
        mintotalpromo: Number(data.mintotalpromo || 200),
        minnbventesretro: Number(data.minnbventesretro || 3),
        mintotalretro: Number(data.mintotalretro || 50),
        devisebase: data.devisebase || 'USD',
        modecondition: data.modecondition || 'OR',
        taux_cashback: Number(data.taux_cashback || 2),
points_par_dollar: Number(data.points_par_dollar || 1),
plafond_cashback: Number(data.plafond_cashback || 0),
cashback_max_par_vente: Number(data.cashback_max_par_vente || 0),
        actif: data.actif ?? true,
      });

      addAudit('INFO', 'Règles fidélité chargées depuis le backend.');
    } catch (e: any) {
      setMessage('Erreur chargement règles fidélité.');
      addAudit('ERROR', e?.message || 'Erreur chargement règles fidélité.');
    } finally {
      setLoading(false);
    }
  }

  async function enregistrer() {
    try {
      setSaving(true);
      setMessage('');

      const payload = {
        idEntreprise: Number(form.identreprise || 1),
        idMagasin: Number(form.idmagasin || 0),
        fenetreJours: Number(form.fenetrejours || 90),
        minNbVentesPromo: Number(form.minnbventespromo || 0),
        minTotalPromo: Number(form.mintotalpromo || 0),
        minNbVentesRetro: Number(form.minnbventesretro || 0),
        minTotalRetro: Number(form.mintotalretro || 0),
        deviseBase: form.devisebase,
        modeCondition: form.modecondition,
        tauxCashback: Number(form.taux_cashback || 0),
pointsParDollar: Number(form.points_par_dollar || 0),
plafondCashback: Number(form.plafond_cashback || 0),
cashbackMaxParVente: Number(form.cashback_max_par_vente || 0),
        actif: Boolean(form.actif),
      };

      const data = await postJson(`${API_URL}/parametres-fidelite`, payload);

      setMessage(data?.message || 'Règles enregistrées.');
      addAudit('SUCCESS', 'Paramètres fidélité enregistrés.');
      await chargerRegles();
    } catch (e: any) {
      setMessage('Erreur enregistrement règles fidélité.');
      addAudit('ERROR', e?.message || 'Erreur enregistrement.');
    } finally {
      setSaving(false);
    }
  }

  async function chercherClients(value: string) {
  setSearchClient(value);
  setClientSelectionne(null);

  if (value.trim().length < 1) {
    setClients([]);
    return;
  }

  try {
    setLoadingClients(true);

    const data = await getJson(
      `${API_URL}/parametres-fidelite/clients?search=${encodeURIComponent(
        value,
      )}&idEntreprise=${Number(form.identreprise || 1)}&idMagasin=${Number(
        form.idmagasin || 0,
      )}`,
    );

    setClients(Array.isArray(data) ? data : []);
  } catch (e: any) {
    setClients([]);
    addAudit('ERROR', e?.message || 'Erreur recherche client.');
  } finally {
    setLoadingClients(false);
  }
}

async function chargerNiveaux() {
  try {
    setLoadingNiveaux(true);

    const data = await getJson(
      `${API_URL}/parametres-fidelite-niveaux?idEntreprise=${Number(
        form.identreprise || 1,
      )}&idMagasin=${Number(form.idmagasin || 0)}`,
    );

    setNiveaux(Array.isArray(data) ? data : []);
    addAudit('INFO', 'Niveaux fidélité chargés.');
  } catch (e: any) {
    addAudit('ERROR', e?.message || 'Erreur chargement niveaux fidélité.');
  } finally {
    setLoadingNiveaux(false);
  }
}

async function initialiserNiveaux() {
  try {
    setLoadingNiveaux(true);

    const data = await postJson(`${API_URL}/parametres-fidelite-niveaux/initialiser`, {
      idEntreprise: Number(form.identreprise || 1),
      idMagasin: Number(form.idmagasin || 0),
    });

    setNiveaux(Array.isArray(data) ? data : []);
    addAudit('SUCCESS', 'Niveaux fidélité initialisés.');
  } catch (e: any) {
    addAudit('ERROR', e?.message || 'Erreur initialisation niveaux.');
  } finally {
    setLoadingNiveaux(false);
  }
}

function updateNiveau(index: number, key: keyof NiveauFidelite, value: any) {
  setNiveaux((old) =>
    old.map((n, i) =>
      i === index
        ? {
            ...n,
            [key]: value,
          }
        : n,
    ),
  );
}

async function enregistrerNiveau(n: NiveauFidelite) {
  try {
    setSavingNiveau(true);

    await postJson(`${API_URL}/parametres-fidelite-niveaux`, {
      idEntreprise: Number(form.identreprise || 1),
      idMagasin: Number(form.idmagasin || 0),
      nomNiveau: n.nom_niveau,
      ordre: Number(n.ordre || 0),
      minAchats: Number(n.min_achats || 0),
      minTickets: Number(n.min_tickets || 0),
      cashbackPercent: Number(n.cashback_percent || 0),
      pointsParDollar: Number(n.points_par_dollar || 0),
      plafondCashback: Number(n.plafond_cashback || 0),
      cashbackMaxParVente: Number(n.cashback_max_par_vente || 0),
      bonusAnniversaire: Number(n.bonus_anniversaire || 0),
      promotionSpeciale: Number(n.promotion_speciale || 0),
      prioriteService: Boolean(n.priorite_service),
      couleur: n.couleur || '',
      icone: n.icone || '',
      actif: Boolean(n.actif),
      ancienneteMinJours: Number(n.anciennete_min_jours || 0),
depenseMoyenneMin: Number(n.depense_moyenne_min || 0),
visitesMin: Number(n.visites_min || 0),
validiteNiveauJours: Number(n.validite_niveau_jours || 365),

bonusPremierAchat: Number(n.bonus_premier_achat || 0),
bonusNoel: Number(n.bonus_noel || 0),
bonusNouvelAn: Number(n.bonus_nouvel_an || 0),
bonusMariage: Number(n.bonus_mariage || 0),
bonusEtudiant: Number(n.bonus_etudiant || 0),
bonusClientMois: Number(n.bonus_client_mois || 0),

plafondCashbackMensuel: Number(n.plafond_cashback_mensuel || 0),
plafondCashbackAnnuel: Number(n.plafond_cashback_annuel || 0),
soldeMinRetrait: Number(n.solde_min_retrait || 0),

promotionPermanente: Number(n.promotion_permanente || 0),
multiplicateurPoints: Number(n.multiplicateur_points || 1),

accesVentesPrivees: Boolean(n.acces_ventes_privees),
accesPromotionsVip: Boolean(n.acces_promotions_vip),

livraisonGratuite: Boolean(n.livraison_gratuite),
prioriteCaisse: Boolean(n.priorite_caisse),
prioriteSav: Boolean(n.priorite_sav),
emballageCadeau: Boolean(n.emballage_cadeau),
retouchesGratuites: Boolean(n.retouches_gratuites),
invitationsEvenements: Boolean(n.invitations_evenements),

expirationPointsActive: Boolean(n.expiration_points_active),
expirationPointsJours: Number(n.expiration_points_jours || 365),

expirationCashbackActive: Boolean(n.expiration_cashback_active),
expirationCashbackJours: Number(n.expiration_cashback_jours || 180),

notificationSms: Boolean(n.notification_sms),
notificationEmail: Boolean(n.notification_email),
notificationWhatsapp: Boolean(n.notification_whatsapp),

updatedBy: 'SYSTEM',
    });

    addAudit('SUCCESS', `Niveau ${n.nom_niveau} enregistré.`);
    await chargerNiveaux();
  } catch (e: any) {
    addAudit('ERROR', e?.message || 'Erreur enregistrement niveau.');
  } finally {
    setSavingNiveau(false);
  }
}

  async function recalculerClient() {
  if (!clientSelectionne?.id_clients) {
    setMessage('Veuillez sélectionner un client.');
    return;
  }

  try {
    setRecalculating(true);
    setMessage('');

    const data = await postJson(`${API_URL}/parametres-fidelite/recalculer-client`, {
      idClient: Number(clientSelectionne.id_clients),
      idEntreprise: Number(form.identreprise || 1),
      idMagasin: Number(form.idmagasin || 0),
    });

    setMessage(data?.message || 'Client recalculé.');

    addAudit(
      'SUCCESS',
      `${clientSelectionne.nom || ''} ${clientSelectionne.prenom || ''} #${
        clientSelectionne.id_clients
      } : ${data?.ancienneCategorie || '-'} → ${data?.nouvelleCategorie || '-'}`,
    );

    await chercherClients(searchClient);
  } catch (e: any) {
    setMessage('Erreur recalcul client.');
    addAudit('ERROR', e?.message || 'Erreur recalcul client.');
  } finally {
    setRecalculating(false);
  }
}

  useEffect(() => {
  chargerRegles();
  chargerNiveaux();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

  const inputClass =
    'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-green-700 focus:ring-4 focus:ring-green-100';

  const labelClass = 'mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500';

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl bg-gradient-to-br from-green-800 to-slate-900 p-6 text-white shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold">
                <ShieldCheck size={16} />
                Module fidélité client
              </div>

              <h1 className="text-2xl font-black md:text-4xl">
                Paramètres Fidélité
              </h1>

              <p className="mt-2 max-w-3xl text-sm text-green-50 md:text-base">
                Configure les règles pour basculer automatiquement les clients
                OCCASIONNEL ↔ FIDELE. Les catégories VIP et ENTREPRISE restent
                manuelles.
              </p>
            </div>

            <button
              onClick={chargerRegles}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-green-800 shadow-sm transition hover:bg-green-50 disabled:opacity-60"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
              Actualiser
            </button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <Card icon={<Building2 />} title="Entreprise" value={`#${form.identreprise}`} />
          <Card icon={<Store />} title="Magasin" value={form.idmagasin === 0 ? 'Tous' : `#${form.idmagasin}`} />
          <Card icon={<Coins />} title="Devise base" value={form.devisebase} />
          <Card icon={<Activity />} title="Statut" value={form.actif ? 'Actif' : 'Désactivé'} />
        </section>

        {message && (
          <div className="rounded-2xl bg-white p-4 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-200">
            {message}
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 lg:col-span-2">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-2xl bg-green-100 p-3 text-green-800">
                <Settings2 size={22} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  Règles automatiques
                </h2>
                <p className="text-sm text-slate-500">{conditionText}</p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <Field label="ID Entreprise">
                <input
                  className={inputClass}
                  type="number"
                  value={form.identreprise}
                  onChange={(e) => update('identreprise', toNumberInput(e.target.value))}
                />
              </Field>

              <Field label="ID Magasin / 0 = Tous">
                <input
                  className={inputClass}
                  type="number"
                  value={form.idmagasin}
                 onChange={(e) => update('idmagasin', toNumberInput(e.target.value))}
                />
              </Field>

              <Field label="Fenêtre d’analyse en jours">
                <input
                  className={inputClass}
                  type="number"
                  value={form.fenetrejours}
                 onChange={(e) => update('fenetrejours', toNumberInput(e.target.value))}
                />
              </Field>

              <Field label="Devise base">
                <select
                  className={inputClass}
                  value={form.devisebase}
                  onChange={(e) => update('devisebase', e.target.value)}
                >
                  <option value="USD">USD</option>
                  <option value="CDF">CDF</option>
                  <option value="EUR">EUR</option>
                </select>
              </Field>

              <Field label="Devenir FIDELE : min ventes">
                <input
                  className={inputClass}
                  type="number"
                  value={form.minnbventespromo}
                  onChange={(e) => update('minnbventespromo', toNumberInput(e.target.value))}
                />
              </Field>

              <Field label="Taux cashback (%)">
  <input
    className={inputClass}
    type="number"
    step="0.01"
    value={form.taux_cashback}
    onChange={(e) => update('taux_cashback', toNumberInput(e.target.value))}
  />
</Field>

<Field label="Points par dollar">
  <input
    className={inputClass}
    type="number"
    step="0.01"
    value={form.points_par_dollar}
    onChange={(e) => update('points_par_dollar', toNumberInput(e.target.value))}
  />
</Field>

<Field label="Plafond cashback client">
  <input
    className={inputClass}
    type="number"
    step="0.01"
    value={form.plafond_cashback}
    onChange={(e) => update('plafond_cashback', toNumberInput(e.target.value))}
  />
</Field>

<Field label="Cashback max par vente">
  <input
    className={inputClass}
    type="number"
    step="0.01"
    value={form.cashback_max_par_vente}
    onChange={(e) => update('cashback_max_par_vente', toNumberInput(e.target.value))}
  />
</Field>

              <Field label="Devenir FIDELE : min total achats">
                <input
                  className={inputClass}
                  type="number"
                  value={form.mintotalpromo}
                  onChange={(e) => update('mintotalpromo', toNumberInput(e.target.value))}
                />
              </Field>

              <Field label="Rester FIDELE : min ventes">
                <input
                  className={inputClass}
                  type="number"
                  value={form.minnbventesretro}
                  onChange={(e) => update('minnbventesretro', toNumberInput(e.target.value))}
                />
              </Field>

              <Field label="Rester FIDELE : min total achats">
                <input
                  className={inputClass}
                  type="number"
                  value={form.mintotalretro}
                  onChange={(e) => update('mintotalretro', toNumberInput(e.target.value))}
                />
              </Field>

              <Field label="Condition">
                <select
                  className={inputClass}
                  value={form.modecondition}
                  onChange={(e) => update('modecondition', e.target.value)}
                >
                  <option value="OR">Souple : ventes OU total</option>
                  <option value="AND">Strict : ventes ET total</option>
                </select>
              </Field>

              <Field label="Activation">
                <select
                  className={inputClass}
                  value={form.actif ? 'true' : 'false'}
                  onChange={(e) => update('actif', e.target.value === 'true')}
                >
                  <option value="true">Actif</option>
                  <option value="false">Désactivé</option>
                </select>
              </Field>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 lg:col-span-3">
  <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
    <div>
      <h2 className="text-xl font-black text-slate-900">
        Configuration des niveaux
      </h2>
      <p className="text-sm text-slate-500">
        Bronze, Argent, Or et Platine selon achats, tickets, cashback et points.
      </p>
    </div>

    <button
      onClick={initialiserNiveaux}
      disabled={loadingNiveaux}
      className="rounded-2xl bg-slate-800 px-5 py-3 text-sm font-black text-white"
    >
      Initialiser les niveaux
    </button>
  </div>

 <div className="space-y-5">
  {niveaux.map((n, index) => (
    <details
      key={`${n.nom_niveau}-${index}`}
      className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200"
      open={index === 0}
    >
      <summary className="cursor-pointer text-lg font-black text-slate-900">
        {n.icone || '⭐'} {n.nom_niveau} — Cashback {n.cashback_percent}% — {n.points_par_dollar} pt/USD
      </summary>

      <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <Field label="Nom du niveau">
          <input className={inputClass} value={n.nom_niveau}
            onChange={(e) => updateNiveau(index, 'nom_niveau', e.target.value)} />
        </Field>

        <Field label="Ordre">
          <input className={inputClass} type="number" value={n.ordre}
            onChange={(e) => updateNiveau(index, 'ordre', Number(e.target.value))} />
        </Field>

        <Field label="Icône">
          <input className={inputClass} value={n.icone || ''}
            onChange={(e) => updateNiveau(index, 'icone', e.target.value)} />
        </Field>

        <Field label="Couleur">
          <input className={inputClass} value={n.couleur || ''}
            onChange={(e) => updateNiveau(index, 'couleur', e.target.value)} />
        </Field>

        <Field label="Actif">
          <select className={inputClass} value={n.actif ? 'true' : 'false'}
            onChange={(e) => updateNiveau(index, 'actif', e.target.value === 'true')}>
            <option value="true">Actif</option>
            <option value="false">Inactif</option>
          </select>
        </Field>

        <Field label="Achats minimum">
          <input className={inputClass} type="number" value={n.min_achats}
            onChange={(e) => updateNiveau(index, 'min_achats', Number(e.target.value))} />
        </Field>

        <Field label="Tickets minimum">
          <input className={inputClass} type="number" value={n.min_tickets}
            onChange={(e) => updateNiveau(index, 'min_tickets', Number(e.target.value))} />
        </Field>

        <Field label="Ancienneté minimum jours">
          <input className={inputClass} type="number" value={n.anciennete_min_jours}
            onChange={(e) => updateNiveau(index, 'anciennete_min_jours', Number(e.target.value))} />
        </Field>

        <Field label="Dépense moyenne minimum">
          <input className={inputClass} type="number" value={n.depense_moyenne_min}
            onChange={(e) => updateNiveau(index, 'depense_moyenne_min', Number(e.target.value))} />
        </Field>

        <Field label="Visites minimum">
          <input className={inputClass} type="number" value={n.visites_min}
            onChange={(e) => updateNiveau(index, 'visites_min', Number(e.target.value))} />
        </Field>

        <Field label="Validité niveau jours">
          <input className={inputClass} type="number" value={n.validite_niveau_jours}
            onChange={(e) => updateNiveau(index, 'validite_niveau_jours', Number(e.target.value))} />
        </Field>

        <Field label="Cashback %">
          <input className={inputClass} type="number" step="0.01" value={n.cashback_percent}
            onChange={(e) => updateNiveau(index, 'cashback_percent', Number(e.target.value))} />
        </Field>

        <Field label="Points par dollar">
          <input className={inputClass} type="number" step="0.01" value={n.points_par_dollar}
            onChange={(e) => updateNiveau(index, 'points_par_dollar', Number(e.target.value))} />
        </Field>

        <Field label="Multiplicateur points">
          <input className={inputClass} type="number" step="0.01" value={n.multiplicateur_points}
            onChange={(e) => updateNiveau(index, 'multiplicateur_points', Number(e.target.value))} />
        </Field>

        <Field label="Bonus premier achat">
          <input className={inputClass} type="number" value={n.bonus_premier_achat}
            onChange={(e) => updateNiveau(index, 'bonus_premier_achat', Number(e.target.value))} />
        </Field>

        <Field label="Bonus anniversaire">
          <input className={inputClass} type="number" value={n.bonus_anniversaire}
            onChange={(e) => updateNiveau(index, 'bonus_anniversaire', Number(e.target.value))} />
        </Field>

        <Field label="Bonus Noël">
          <input className={inputClass} type="number" value={n.bonus_noel}
            onChange={(e) => updateNiveau(index, 'bonus_noel', Number(e.target.value))} />
        </Field>

        <Field label="Bonus Nouvel An">
          <input className={inputClass} type="number" value={n.bonus_nouvel_an}
            onChange={(e) => updateNiveau(index, 'bonus_nouvel_an', Number(e.target.value))} />
        </Field>

        <Field label="Bonus mariage">
          <input className={inputClass} type="number" value={n.bonus_mariage}
            onChange={(e) => updateNiveau(index, 'bonus_mariage', Number(e.target.value))} />
        </Field>

        <Field label="Bonus étudiant">
          <input className={inputClass} type="number" value={n.bonus_etudiant}
            onChange={(e) => updateNiveau(index, 'bonus_etudiant', Number(e.target.value))} />
        </Field>

        <Field label="Bonus client du mois">
          <input className={inputClass} type="number" value={n.bonus_client_mois}
            onChange={(e) => updateNiveau(index, 'bonus_client_mois', Number(e.target.value))} />
        </Field>

        <Field label="Plafond cashback client">
          <input className={inputClass} type="number" value={n.plafond_cashback}
            onChange={(e) => updateNiveau(index, 'plafond_cashback', Number(e.target.value))} />
        </Field>

        <Field label="Plafond mensuel">
          <input className={inputClass} type="number" value={n.plafond_cashback_mensuel}
            onChange={(e) => updateNiveau(index, 'plafond_cashback_mensuel', Number(e.target.value))} />
        </Field>

        <Field label="Plafond annuel">
          <input className={inputClass} type="number" value={n.plafond_cashback_annuel}
            onChange={(e) => updateNiveau(index, 'plafond_cashback_annuel', Number(e.target.value))} />
        </Field>

        <Field label="Max cashback / vente">
          <input className={inputClass} type="number" value={n.cashback_max_par_vente}
            onChange={(e) => updateNiveau(index, 'cashback_max_par_vente', Number(e.target.value))} />
        </Field>

        <Field label="Solde minimum retrait">
          <input className={inputClass} type="number" value={n.solde_min_retrait}
            onChange={(e) => updateNiveau(index, 'solde_min_retrait', Number(e.target.value))} />
        </Field>

        <Field label="Promotion permanente %">
          <input className={inputClass} type="number" value={n.promotion_permanente}
            onChange={(e) => updateNiveau(index, 'promotion_permanente', Number(e.target.value))} />
        </Field>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {[
          ['acces_ventes_privees', 'Accès ventes privées'],
          ['acces_promotions_vip', 'Accès promotions VIP'],
          ['livraison_gratuite', 'Livraison gratuite'],
          ['priorite_caisse', 'Priorité caisse'],
          ['priorite_sav', 'Priorité SAV'],
          ['emballage_cadeau', 'Emballage cadeau'],
          ['retouches_gratuites', 'Retouches gratuites'],
          ['invitations_evenements', 'Invitations événements'],
          ['expiration_points_active', 'Expiration points active'],
          ['expiration_cashback_active', 'Expiration cashback active'],
          ['notification_sms', 'Notification SMS'],
          ['notification_email', 'Notification Email'],
          ['notification_whatsapp', 'Notification WhatsApp'],
        ].map(([key, label]) => (
          <label key={key} className="flex items-center gap-3 rounded-2xl bg-white p-3 text-sm font-bold text-slate-700 ring-1 ring-slate-200">
            <input
              type="checkbox"
              checked={Boolean(n[key as keyof NiveauFidelite])}
              onChange={(e) => updateNiveau(index, key as keyof NiveauFidelite, e.target.checked)}
            />
            {label}
          </label>
        ))}
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <Field label="Expiration points jours">
          <input className={inputClass} type="number" value={n.expiration_points_jours}
            onChange={(e) => updateNiveau(index, 'expiration_points_jours', Number(e.target.value))} />
        </Field>

        <Field label="Expiration cashback jours">
          <input className={inputClass} type="number" value={n.expiration_cashback_jours}
            onChange={(e) => updateNiveau(index, 'expiration_cashback_jours', Number(e.target.value))} />
        </Field>
      </div>

      <button
        onClick={() => enregistrerNiveau(n)}
        disabled={savingNiveau}
        className="mt-6 w-full rounded-2xl bg-green-700 px-5 py-3 text-sm font-black text-white"
      >
        Enregistrer {n.nom_niveau}
      </button>
    </details>
  ))}
</div>
</div>

            <div className="mt-6 flex flex-col gap-3 md:flex-row">
              <button
                onClick={enregistrer}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-700 px-6 py-3 text-sm font-black text-white shadow-sm transition hover:bg-green-800 disabled:opacity-60"
              >
                {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                Enregistrer les règles
              </button>

              <button
                onClick={chargerRegles}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-700 px-6 py-3 text-sm font-black text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60"
              >
                <Database size={18} />
                Recharger
              </button>
            </div>
          </div>

         <div className="space-y-6">
  <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
  <div className="mb-5 flex items-center gap-3">
    <div className="rounded-2xl bg-blue-100 p-3 text-blue-800">
      <UserCheck size={22} />
    </div>
    <div>
      <h2 className="text-lg font-black text-slate-900">
        Recalcul client
      </h2>
      <p className="text-sm text-slate-500">
        Recherche par nom, téléphone ou ID.
      </p>
    </div>
  </div>

  <label className={labelClass}>Rechercher un client</label>
  <input
    className={inputClass}
    type="text"
    placeholder="Nom, prénom, téléphone ou ID"
    value={searchClient}
    onChange={(e) => chercherClients(e.target.value)}
  />

  <div className="mt-4 space-y-3">
    {loadingClients && (
      <p className="rounded-2xl bg-slate-50 p-3 text-sm font-semibold text-slate-500">
        Recherche en cours...
      </p>
    )}

    {!loadingClients &&
      clients.map((c) => (
        <button
          key={c.id_clients}
          type="button"
          onClick={() => setClientSelectionne(c)}
          className={`w-full rounded-2xl p-4 text-left text-sm ring-1 transition ${
            clientSelectionne?.id_clients === c.id_clients
              ? 'bg-green-50 ring-green-300'
              : 'bg-slate-50 ring-slate-100 hover:bg-slate-100'
          }`}
        >
          <p className="font-black text-slate-900">
            👤 {c.id_clients} | {c.nom} {c.prenom}
          </p>
          <p className="mt-1 text-slate-600">
            📞 {c.telephone || c.telephoneclean || '-'}
          </p>
          <p className="mt-1 font-bold text-green-700">
            ⭐ {c.categorieclient || 'OCCASIONNEL'}
          </p>
        </button>
      ))}
  </div>

  {clientSelectionne && (
    <div className="mt-4 rounded-2xl bg-green-50 p-4 text-sm ring-1 ring-green-200">
      <p className="font-black text-green-900">Client sélectionné</p>
      <p className="mt-1 text-green-800">
        ID : {clientSelectionne.id_clients}
      </p>
      <p className="text-green-800">
        Nom : {clientSelectionne.nom} {clientSelectionne.prenom}
      </p>
      <p className="text-green-800">
        Téléphone : {clientSelectionne.telephone || clientSelectionne.telephoneclean || '-'}
      </p>
      <p className="font-bold text-green-900">
        Catégorie actuelle : {clientSelectionne.categorieclient || 'OCCASIONNEL'}
      </p>
    </div>
  )}

  <button
    onClick={recalculerClient}
    disabled={recalculating || !clientSelectionne}
    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-700 px-6 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-800 disabled:opacity-60"
  >
    {recalculating ? (
      <Loader2 className="animate-spin" size={18} />
    ) : (
      <Calculator size={18} />
    )}
    Recalculer ce client
  </button>
</div>

            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
                  <Clock3 size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    Audit interface
                  </h2>
                  <p className="text-sm text-slate-500">
                    Actions récentes sur ce poste.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {audit.length === 0 ? (
                  <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                    Aucun audit local pour le moment.
                  </p>
                ) : (
                  audit.map((a, i) => (
                    <div
                      key={i}
                      className="rounded-2xl bg-slate-50 p-4 text-sm ring-1 ring-slate-100"
                    >
                      <div className="flex items-center gap-2 font-black text-slate-800">
                        {a.type === 'SUCCESS' ? (
                          <CheckCircle2 className="text-green-700" size={16} />
                        ) : a.type === 'ERROR' ? (
                          <AlertCircle className="text-red-700" size={16} />
                        ) : (
                          <BadgeCheck className="text-blue-700" size={16} />
                        )}
                        {a.type}
                      </div>
                      <p className="mt-1 text-slate-600">{a.message}</p>
                      <p className="mt-1 text-xs text-slate-400">{a.date}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </label>
      {children}
    </div>
  );
}

function Card({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="mb-4 inline-flex rounded-2xl bg-green-50 p-3 text-green-800">
        {icon}
      </div>
      <p className="text-sm font-bold text-slate-500">{title}</p>
      <p className="mt-1 text-2xl font-black text-slate-900">{value}</p>
    </div>
  );
}