'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  CalendarDays,
  Flag,
  Link2,
  Megaphone,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings,
  Trash2,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://messiematala-pos-backend-production.up.railway.app';

type Campagne = {
  id: number;
  nomCampagne: string;
  typeCampagne: string;
  dateDebut: string;
  dateFin: string;
  budget: number;
  statut: string;
  commentaires?: string;
  vues: number;
  messages: number;
  spectateurs: number;
  budgetQuotidien: number;
  nombreVentes: number;
  montantVendus: number;
  devise: string;
  facebookCampaignId?: string;
};

type MetaStatus = {
  connected: boolean;
  account?: {
    facebook_user_name?: string;
    facebook_user_id?: string;
    createdat?: string;
  } | null;
};

type MetaAdAccount = {
  id: string;
  name: string;
  currency?: string;
  account_status?: number;
};

type MetaCampaign = {
  id: string;
  name: string;
  status?: string;
  effective_status?: string;
};

const emptyForm = {
  id: 0,
  nomCampagne: '',
  typeCampagne: 'Facebook Ads',
  dateDebut: new Date().toISOString().slice(0, 10),
  dateFin: new Date().toISOString().slice(0, 10),
  budget: '0',
  statut: 'Brouillon',
  commentaires: '',
  vues: '0',
  messages: '0',
  spectateurs: '0',
  budgetQuotidien: '0',
  nombreVentes: '0',
  montantVendus: '0',
  devise: 'USD',
  facebookCampaignId: '',
};

export default function Page() {
  const [campagnes, setCampagnes] = useState<Campagne[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [statut, setStatut] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [message, setMessage] = useState('');
  const [metaStatus, setMetaStatus] = useState<MetaStatus | null>(null);
  const [adAccounts, setAdAccounts] = useState<MetaAdAccount[]>([]);
  const [metaCampaigns, setMetaCampaigns] = useState<MetaCampaign[]>([]);
  const [selectedAdAccount, setSelectedAdAccount] = useState('');
  const [selectedMetaCampaign, setSelectedMetaCampaign] = useState('');

  const stats = useMemo(() => {
    const totalBudget = campagnes.reduce((s, c) => s + Number(c.budget || 0), 0);
    const totalVentes = campagnes.reduce((s, c) => s + Number(c.nombreVentes || 0), 0);
    const totalMontant = campagnes.reduce((s, c) => s + Number(c.montantVendus || 0), 0);
    const totalVues = campagnes.reduce((s, c) => s + Number(c.vues || 0), 0);

    return { totalBudget, totalVentes, totalMontant, totalVues };
  }, [campagnes]);

  async function getJson(url: string) {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async function postJson(url: string, data: any) {
    const res = await fetch(url, {
      method: form.id ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async function chargerCampagnes() {
    try {
      setLoading(true);
      const q = new URLSearchParams();
      if (search) q.set('search', search);
      if (statut) q.set('statut', statut);
      q.set('idEntreprise', '1');

      const data = await getJson(`${API_URL}/marketing?${q.toString()}`);
      setCampagnes(Array.isArray(data) ? data : data.items || []);
    } catch (e: any) {
      setMessage(`Erreur chargement : ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function chargerMetaStatus() {
    try {
      const data = await getJson(`${API_URL}/meta-auth/status`);
      setMetaStatus(data);
      if (data?.connected) await chargerAdAccounts();
    } catch {
      setMetaStatus({ connected: false });
      setAdAccounts([]);
      setMetaCampaigns([]);
    }
  }

  async function chargerAdAccounts() {
    try {
      setLoadingMeta(true);
      const data = await getJson(`${API_URL}/meta-auth/ad-accounts`);
      setAdAccounts(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setMessage(`Erreur comptes Meta : ${e.message}`);
      setAdAccounts([]);
    } finally {
      setLoadingMeta(false);
    }
  }

  async function chargerMetaCampaigns(adAccountId: string) {
    try {
      setLoadingMeta(true);
      setSelectedAdAccount(adAccountId);
      setSelectedMetaCampaign('');

      if (!adAccountId) {
        setMetaCampaigns([]);
        return;
      }

      const data = await getJson(
        `${API_URL}/meta-auth/campaigns?adAccountId=${encodeURIComponent(adAccountId)}`,
      );

      setMetaCampaigns(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setMessage(`Erreur campagnes Meta : ${e.message}`);
      setMetaCampaigns([]);
    } finally {
      setLoadingMeta(false);
    }
  }

  async function lierCampagneMeta() {
    try {
      if (!form.id) {
        setMessage('Enregistrez d’abord la campagne ERP.');
        return;
      }

      if (!selectedAdAccount || !selectedMetaCampaign) {
        setMessage('Sélectionnez un compte publicitaire et une campagne Meta.');
        return;
      }

      setLoading(true);
      const campagne = metaCampaigns.find(c => c.id === selectedMetaCampaign);

      const res = await fetch(`${API_URL}/marketing/${form.id}/meta-link`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metaAccountId: selectedAdAccount,
          metaCampaignId: selectedMetaCampaign,
          metaCampaignName: campagne?.name || '',
        }),
      });

      if (!res.ok) throw new Error(await res.text());

      setForm({ ...form, facebookCampaignId: selectedMetaCampaign });
      setMessage('Campagne Meta liée avec succès.');
      await chargerCampagnes();
    } catch (e: any) {
      setMessage(`Erreur liaison Meta : ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  function connecterFacebook() {
    window.location.href = `${API_URL}/meta-auth/login`;
  }

  async function deconnecterFacebook() {
    if (!confirm('Voulez-vous déconnecter Facebook ?')) return;

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/meta-auth/logout`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());

      setMessage('Facebook déconnecté.');
      setAdAccounts([]);
      setMetaCampaigns([]);
      setSelectedAdAccount('');
      setSelectedMetaCampaign('');
      await chargerMetaStatus();
    } catch (e: any) {
      setMessage(`Erreur déconnexion Facebook : ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    chargerCampagnes();
    chargerMetaStatus();

    const params = new URLSearchParams(window.location.search);
    if (params.get('facebook') === 'connected') {
      setMessage('Compte Facebook connecté avec succès.');
    }
  }, []);

  async function enregistrer() {
    try {
      if (!form.nomCampagne.trim()) {
        setMessage('Le nom de la campagne est obligatoire.');
        return;
      }

      setLoading(true);

      await postJson(
        form.id ? `${API_URL}/marketing/${form.id}` : `${API_URL}/marketing`,
        {
          nomCampagne: form.nomCampagne,
          typeCampagne: form.typeCampagne,
          dateDebut: form.dateDebut,
          dateFin: form.dateFin,
          budget: Number(form.budget || 0),
          statut: form.statut,
          commentaires: form.commentaires,
          vues: Number(form.vues || 0),
          messages: Number(form.messages || 0),
          spectateurs: Number(form.spectateurs || 0),
          budgetQuotidien: Number(form.budgetQuotidien || 0),
          nombreVentes: Number(form.nombreVentes || 0),
          montantVendus: Number(form.montantVendus || 0),
          devise: form.devise,
          facebookCampaignId: form.facebookCampaignId,
          idEntreprise: 1,
          idMagasin: 1,
          idPoste: 1,
        },
      );

      setMessage('Campagne enregistrée avec succès.');
      nouveauFormulaire();
      await chargerCampagnes();
    } catch (e: any) {
      setMessage(`Erreur enregistrement : ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function supprimer(id: number) {
    if (!confirm('Voulez-vous vraiment supprimer cette campagne ?')) return;

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/marketing/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      setMessage('Campagne supprimée.');
      await chargerCampagnes();
    } catch (e: any) {
      setMessage(`Erreur suppression : ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function annuler(id: number) {
    if (!confirm('Voulez-vous annuler cette campagne ?')) return;

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/marketing/${id}/annuler`, { method: 'PATCH' });
      if (!res.ok) throw new Error(await res.text());
      setMessage('Campagne annulée.');
      await chargerCampagnes();
    } catch (e: any) {
      setMessage(`Erreur annulation : ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function synchroniserMeta(id: number) {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/marketing/${id}/sync-meta`, { method: 'POST' });
      if (!res.ok) throw new Error(await res.text());
      setMessage('Synchronisation Meta terminée.');
      await chargerCampagnes();
    } catch (e: any) {
      setMessage(`Erreur synchronisation Meta : ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  function nouveauFormulaire() {
    setForm(emptyForm);
    setSelectedMetaCampaign('');
    setMessage('Nouvelle campagne prête.');
  }

  function selectionner(c: Campagne) {
    setForm({
      id: c.id,
      nomCampagne: c.nomCampagne || '',
      typeCampagne: c.typeCampagne || 'Facebook Ads',
      dateDebut: String(c.dateDebut || '').slice(0, 10),
      dateFin: String(c.dateFin || '').slice(0, 10),
      budget: String(c.budget || 0),
      statut: c.statut || 'Brouillon',
      commentaires: c.commentaires || '',
      vues: String(c.vues || 0),
      messages: String(c.messages || 0),
      spectateurs: String(c.spectateurs || 0),
      budgetQuotidien: String(c.budgetQuotidien || 0),
      nombreVentes: String(c.nombreVentes || 0),
      montantVendus: String(c.montantVendus || 0),
      devise: c.devise || 'USD',
      facebookCampaignId: c.facebookCampaignId || '',
    });
    setSelectedMetaCampaign(c.facebookCampaignId || '');
    setMessage(`Campagne #${c.id} sélectionnée.`);
  }

  const input =
    'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400';

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-black text-slate-900">
            <Megaphone className="text-emerald-700" />
            Marketing Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Gestion des campagnes, performances, objectifs et synchronisation Meta.
          </p>
        </div>

        <button
          type="button"
          onClick={nouveauFormulaire}
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-800"
        >
          <Plus size={18} />
          Nouvelle campagne
        </button>
      </div>

      {message && (
        <div className="mb-5 rounded-2xl bg-white p-4 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200">
          {message}
        </div>
      )}

      <section className="mb-6 grid gap-4 md:grid-cols-4">
        <Card title="Budget total" value={`${stats.totalBudget.toFixed(2)} $`} icon={<BarChart3 />} />
        <Card title="Ventes liées" value={String(stats.totalVentes)} icon={<TrendingUp />} />
        <Card title="Montant vendu" value={`${stats.totalMontant.toFixed(2)} $`} icon={<Flag />} />
        <Card title="Vues Meta" value={String(stats.totalVues)} icon={<Users />} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-slate-900">Informations de la campagne</h2>
              <p className="mt-1 text-sm text-slate-500">
                Créez, modifiez et suivez vos campagnes marketing.
              </p>
            </div>

            <span className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-black uppercase text-emerald-700 ring-1 ring-emerald-100">
              {form.id ? `Campagne #${form.id}` : 'Nouvelle'}
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nom campagne">
              <input
                className={input}
                placeholder="Ex : Promotion robes mariage"
                value={form.nomCampagne}
                onChange={e => setForm({ ...form, nomCampagne: e.target.value })}
              />
            </Field>

            <Field label="Canal / type">
              <select
                className={input}
                value={form.typeCampagne}
                onChange={e => setForm({ ...form, typeCampagne: e.target.value })}
              >
                <option>Facebook Ads</option>
                <option>Instagram Ads</option>
                <option>WhatsApp Business</option>
                <option>TikTok</option>
                <option>Affichage</option>
                <option>Radio / TV</option>
                <option>Influenceur</option>
              </select>
            </Field>

            <Field label="Date début">
              <input
                type="date"
                className={input}
                value={form.dateDebut}
                onChange={e => setForm({ ...form, dateDebut: e.target.value })}
              />
            </Field>

            <Field label="Date fin">
              <input
                type="date"
                className={input}
                value={form.dateFin}
                onChange={e => setForm({ ...form, dateFin: e.target.value })}
              />
            </Field>

            <Field label="Budget total">
              <input
                className={input}
                placeholder="0"
                value={form.budget}
                onChange={e => setForm({ ...form, budget: e.target.value })}
              />
            </Field>

            <Field label="Statut">
              <select
                className={input}
                value={form.statut}
                onChange={e => setForm({ ...form, statut: e.target.value })}
              >
                <option>Brouillon</option>
                <option>Active</option>
                <option>Terminée</option>
                <option>Annulée</option>
              </select>
            </Field>

            <div className="md:col-span-2">
              <Field label="Objectif / commentaires">
                <textarea
                  className={`${input} min-h-28 resize-none`}
                  placeholder="Ex : Augmenter les messages WhatsApp, attirer les clientes pour robes de mariage..."
                  value={form.commentaires}
                  onChange={e => setForm({ ...form, commentaires: e.target.value })}
                />
              </Field>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-6">
            <h2 className="text-xl font-black text-slate-900">Résultats & synchronisation Meta</h2>
            <p className="mt-1 text-sm text-slate-500">
              Suivi des vues, messages, ventes et performances publicitaires.
            </p>
          </div>

          <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            {metaStatus?.connected ? (
              <div>
                <p className="text-sm font-black text-emerald-700">Facebook connecté</p>
                <p className="mt-1 text-sm text-slate-600">
                  Compte : {metaStatus.account?.facebook_user_name || 'Compte Meta'}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-black text-slate-700">Facebook non connecté</p>
                <p className="mt-1 text-sm text-slate-500">
                  Connectez Meta pour choisir automatiquement le compte publicitaire et la campagne.
                </p>
              </div>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Messages">
              <input
                className={input}
                value={form.messages}
                onChange={e => setForm({ ...form, messages: e.target.value })}
              />
            </Field>

            <Field label="Vues">
              <input
                className={input}
                value={form.vues}
                onChange={e => setForm({ ...form, vues: e.target.value })}
              />
            </Field>

            <Field label="Spectateurs">
              <input
                className={input}
                value={form.spectateurs}
                onChange={e => setForm({ ...form, spectateurs: e.target.value })}
              />
            </Field>

            <Field label="Budget quotidien">
              <input
                className={input}
                value={form.budgetQuotidien}
                onChange={e => setForm({ ...form, budgetQuotidien: e.target.value })}
              />
            </Field>

            <Field label="Nombre ventes">
              <input
                className={input}
                value={form.nombreVentes}
                onChange={e => setForm({ ...form, nombreVentes: e.target.value })}
              />
            </Field>

            <Field label="Montant vendu">
              <input
                className={input}
                value={form.montantVendus}
                onChange={e => setForm({ ...form, montantVendus: e.target.value })}
              />
            </Field>

            <Field label="Devise">
              <select
                className={input}
                value={form.devise}
                onChange={e => setForm({ ...form, devise: e.target.value })}
              >
                <option>USD</option>
                <option>CDF</option>
                <option>FC</option>
              </select>
            </Field>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 md:col-span-2">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-black uppercase text-emerald-800">
                  Liaison Meta automatique
                </h3>
                {form.facebookCampaignId && (
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">
                    ID lié : {form.facebookCampaignId}
                  </span>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Compte publicitaire">
                  <select
                    className={input}
                    value={selectedAdAccount}
                    onChange={e => chargerMetaCampaigns(e.target.value)}
                    disabled={!metaStatus?.connected || loadingMeta}
                  >
                    <option value="">
                      {loadingMeta ? 'Chargement...' : 'Sélectionner un compte'}
                    </option>
                    {adAccounts.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name} — {a.id}{a.currency ? ` — ${a.currency}` : ''}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Campagne Meta">
                  <select
                    className={input}
                    value={selectedMetaCampaign}
                    onChange={e => setSelectedMetaCampaign(e.target.value)}
                    disabled={!selectedAdAccount || loadingMeta}
                  >
                    <option value="">
                      {!selectedAdAccount ? 'Choisissez d’abord un compte' : 'Sélectionner une campagne'}
                    </option>
                    {metaCampaigns.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} — {c.effective_status || c.status || ''}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <button
                type="button"
                onClick={lierCampagneMeta}
                disabled={loading || !form.id || !selectedAdAccount || !selectedMetaCampaign}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-black text-white hover:bg-emerald-800 disabled:opacity-50"
              >
                <Link2 size={18} />
                Lier la campagne Meta
              </button>

              {!form.id && (
                <p className="mt-2 text-xs font-semibold text-amber-700">
                  Enregistrez d’abord la campagne ERP avant de la lier à Meta.
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={enregistrer}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-emerald-800 disabled:opacity-50"
            >
              <Save size={18} />
              Enregistrer
            </button>

            <button
              type="button"
              onClick={() => form.id && synchroniserMeta(form.id)}
              disabled={loading || !form.id || !metaStatus?.connected || !form.facebookCampaignId}
              className="flex items-center justify-center gap-2 rounded-2xl bg-blue-700 px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-blue-800 disabled:opacity-50"
            >
              <RefreshCw size={18} />
              Sync Meta
            </button>

            <button
              type="button"
              onClick={chargerMetaStatus}
              disabled={loadingMeta}
              className="flex items-center justify-center gap-2 rounded-2xl bg-slate-700 px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-slate-800 disabled:opacity-50"
            >
              <Settings size={18} />
              Recharger Meta
            </button>

            <button
              type="button"
              onClick={metaStatus?.connected ? deconnecterFacebook : connecterFacebook}
              disabled={loading}
              className={`flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black text-white shadow-sm disabled:opacity-50 ${
                metaStatus?.connected
                  ? 'bg-red-800 hover:bg-red-900'
                  : 'bg-blue-900 hover:bg-blue-950'
              }`}
            >
              <Settings size={18} />
              {metaStatus?.connected ? 'Déconnecter Facebook' : 'Connecter Facebook'}
            </button>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-xl font-black text-slate-900">Historique campagnes</h2>

          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <input
                className="rounded-xl border border-slate-200 py-2 pl-10 pr-3 text-sm outline-none focus:border-emerald-600"
                placeholder="Rechercher..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <select className={input} value={statut} onChange={e => setStatut(e.target.value)}>
              <option value="">Tous statuts</option>
              <option>Active</option>
              <option>Brouillon</option>
              <option>Terminée</option>
              <option>Annulée</option>
            </select>

            <button
              type="button"
              onClick={chargerCampagnes}
              className="flex items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm font-bold text-white"
            >
              <RefreshCw size={16} />
              Actualiser
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1150px] text-left text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-xs uppercase text-slate-500">
                <th className="p-3">Campagne</th>
                <th className="p-3">Type</th>
                <th className="p-3">Période</th>
                <th className="p-3">Budget</th>
                <th className="p-3">Vues</th>
                <th className="p-3">Messages</th>
                <th className="p-3">Ventes</th>
                <th className="p-3">Montant</th>
                <th className="p-3">Meta</th>
                <th className="p-3">Statut</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {campagnes.map(c => (
                <tr key={c.id} className="border-b hover:bg-slate-50">
                  <td className="p-3 font-bold text-slate-900">{c.nomCampagne}</td>
                  <td className="p-3">{c.typeCampagne}</td>
                  <td className="p-3">
                    <CalendarDays size={14} className="mr-1 inline" />
                    {String(c.dateDebut).slice(0, 10)} → {String(c.dateFin).slice(0, 10)}
                  </td>
                  <td className="p-3">
                    {Number(c.budget || 0).toFixed(2)} {c.devise}
                  </td>
                  <td className="p-3">{c.vues}</td>
                  <td className="p-3">{c.messages}</td>
                  <td className="p-3">{c.nombreVentes}</td>
                  <td className="p-3 font-bold text-emerald-700">
                    {Number(c.montantVendus || 0).toFixed(2)} {c.devise}
                  </td>
                  <td className="p-3">
                    {c.facebookCampaignId ? (
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                        Liée
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                        Non liée
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                      {c.statut}
                    </span>
                  </td>
                  <td className="flex gap-2 p-3">
                    <button
                      type="button"
                      title="Sélectionner"
                      onClick={() => selectionner(c)}
                      className="rounded-lg bg-blue-700 p-2 text-white"
                    >
                      <Save size={16} />
                    </button>
                    <button
                      type="button"
                      title="Annuler"
                      onClick={() => annuler(c.id)}
                      className="rounded-lg bg-amber-600 p-2 text-white"
                    >
                      <XCircle size={16} />
                    </button>
                    <button
                      type="button"
                      title="Supprimer"
                      onClick={() => supprimer(c.id)}
                      className="rounded-lg bg-red-800 p-2 text-white"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}

              {!campagnes.length && (
                <tr>
                  <td colSpan={11} className="p-6 text-center text-slate-500">
                    Aucune campagne trouvée.
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      {children}
    </label>
  );
}

function Card({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="mb-3 flex items-center justify-between text-emerald-700">{icon}</div>
      <p className="text-sm font-semibold text-slate-500">{title}</p>
      <p className="mt-1 text-2xl font-black text-slate-900">{value}</p>
    </div>
  );
}
