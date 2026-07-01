'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  CalendarDays,
  Eye,
  Flag,
  Link2,
  Megaphone,
  MessageCircle,
  MousePointerClick,
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

  metaBusinessName?: string;
  metaAccountName?: string;
  metaCampaignName?: string;
  metaPageName?: string;
  metaInstagramName?: string;

  metaCtr?: number;
  metaCpc?: number;
  metaCpm?: number;
  metaRoas?: number;
  metaFrequency?: number;
  metaConversions?: number;
  metaCostPerMessage?: number;
  metaCostPerResult?: number;
  metaAverageOrder?: number;
  metaLastSync?: string;
};

type MetaStatus = {
  connected: boolean;
  account?: {
    facebook_user_name?: string;
    facebook_user_id?: string;
    createdat?: string;
  } | null;
  business?: { id: string; name: string } | null;
  adAccount?: { id: string; name: string; currency?: string } | null;
  page?: { id: string; name: string } | null;
  instagram?: { id: string; username?: string; name?: string } | null;
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
  const [selectedCampagne, setSelectedCampagne] = useState<Campagne | null>(null);

  const [search, setSearch] = useState('');
  const [statut, setStatut] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState(0);
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
    const totalMessages = campagnes.reduce((s, c) => s + Number(c.messages || 0), 0);
    const totalDepense = campagnes.reduce((s, c) => s + Number(c.budgetQuotidien || 0), 0);
    const roas = totalDepense > 0 ? totalMontant / totalDepense : 0;

    return { totalBudget, totalVentes, totalMontant, totalVues, totalMessages, totalDepense, roas };
  }, [campagnes]);

  async function getJson(url: string) {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async function saveJson(url: string, data: any) {
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
      const items = Array.isArray(data) ? data : data.items || [];
      setCampagnes(items);

      if (selectedCampagne) {
        const fresh = items.find((x: Campagne) => x.id === selectedCampagne.id);
        if (fresh) setSelectedCampagne(fresh);
      }
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

      const account = adAccounts.find(a => a.id === selectedAdAccount);
      const campagne = metaCampaigns.find(c => c.id === selectedMetaCampaign);

      const res = await fetch(`${API_URL}/marketing/${form.id}/meta-link`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metaAccountId: selectedAdAccount,
          metaAccountName: account?.name || '',
          metaCampaignId: selectedMetaCampaign,
          metaCampaignName: campagne?.name || '',

          metaBusinessId: metaStatus?.business?.id || '',
          metaBusinessName: metaStatus?.business?.name || '',

          metaPageId: metaStatus?.page?.id || '',
          metaPageName: metaStatus?.page?.name || '',

          metaInstagramId: metaStatus?.instagram?.id || '',
          metaInstagramName:
            metaStatus?.instagram?.username ||
            metaStatus?.instagram?.name ||
            '',
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

  async function enregistrer() {
    try {
      if (!form.nomCampagne.trim()) {
        setMessage('Le nom de la campagne est obligatoire.');
        return;
      }

      setLoading(true);

      const saved = await saveJson(
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
          idEntreprise: 1,
          idMagasin: 1,
          idPoste: 1,
        },
      );

      const idSauvegarde = Number(saved?.id || form.id || 0);

      setForm(f => ({ ...f, id: idSauvegarde }));
      setMessage(form.id ? 'Campagne modifiée avec succès.' : 'Campagne créée avec succès.');
      await chargerCampagnes();
    } catch (e: any) {
      setMessage(`Erreur enregistrement : ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function synchroniserMeta(id: number) {
    try {
      setSyncing(true);
      setProgress(15);
      setMessage('Connexion à Meta...');

      setTimeout(() => setProgress(45), 300);
      setTimeout(() => setProgress(70), 700);

      const res = await fetch(`${API_URL}/marketing/${id}/sync-meta`, { method: 'POST' });
      if (!res.ok) throw new Error(await res.text());

      setProgress(100);
      setMessage('✓ Synchronisation Meta terminée.');
      await chargerCampagnes();
    } catch (e: any) {
      setMessage(`Erreur synchronisation Meta : ${e.message}`);
    } finally {
      setTimeout(() => {
        setSyncing(false);
        setProgress(0);
      }, 900);
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

  function nouveauFormulaire() {
    setForm(emptyForm);
    setSelectedCampagne(null);
    setSelectedMetaCampaign('');
    setMessage('Nouvelle campagne prête.');
  }

  function selectionner(c: Campagne) {
    setSelectedCampagne(c);
    setForm({
      ...emptyForm,
      id: Number(c.id || 0),
      nomCampagne: String(c.nomCampagne || ''),
      typeCampagne: String(c.typeCampagne || 'Facebook Ads'),
      dateDebut: String(c.dateDebut || new Date().toISOString()).slice(0, 10),
      dateFin: String(c.dateFin || new Date().toISOString()).slice(0, 10),
      budget: String(c.budget ?? 0),
      statut: String(c.statut || 'Brouillon'),
      commentaires: String(c.commentaires || ''),
      vues: String(c.vues ?? 0),
      messages: String(c.messages ?? 0),
      spectateurs: String(c.spectateurs ?? 0),
      budgetQuotidien: String(c.budgetQuotidien ?? 0),
      nombreVentes: String(c.nombreVentes ?? 0),
      montantVendus: String(c.montantVendus ?? 0),
      devise: String(c.devise || 'USD'),
      facebookCampaignId: String(c.facebookCampaignId || ''),
    });

    setSelectedAdAccount('');
    setSelectedMetaCampaign(String(c.facebookCampaignId || ''));
    setMessage(`Campagne #${c.id} sélectionnée.`);
  }

  useEffect(() => {
    chargerCampagnes();
    chargerMetaStatus();

    const params = new URLSearchParams(window.location.search);
    if (params.get('facebook') === 'connected') {
      setMessage('Compte Facebook connecté avec succès.');
    }
  }, []);

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
            Gestion ERP des campagnes, Meta Ads, performances et conversions.
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

      {syncing && (
        <div className="mb-5 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="mb-2 flex justify-between text-sm font-bold text-slate-700">
            <span>Synchronisation Meta...</span>
            <span>{progress}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-700 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <section className="mb-6 grid gap-4 md:grid-cols-4">
  <KpiCard title="Budget prévu" value={`${stats.totalBudget.toFixed(2)} $`} percent={100} icon={<BarChart3 />} />
  <KpiCard title="Budget dépensé" value={`${stats.totalDepense.toFixed(2)} $`} percent={stats.totalBudget > 0 ? (stats.totalDepense / stats.totalBudget) * 100 : 0} icon={<MousePointerClick />} />
  <KpiCard title="Messages" value={String(stats.totalMessages)} percent={Math.min(stats.totalMessages * 5, 100)} icon={<MessageCircle />} />
  <KpiCard title="ROAS global" value={stats.roas.toFixed(2)} percent={Math.min(stats.roas * 20, 100)} icon={<TrendingUp />} />
</section>

<section className="mb-6 rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
  <h2 className="mb-5 text-xl font-black text-slate-900">Analyse rapide</h2>

  <div className="grid gap-5 lg:grid-cols-2">
    <MiniTrend title="Évolution des dépenses" values={[0, stats.totalDepense * 0.25, stats.totalDepense * 0.55, stats.totalDepense]} />

    <div className="space-y-4">
      <ProgressRow label="Messages" value={stats.totalMessages} max={100} />
      <ProgressRow label="Ventes" value={stats.totalVentes} max={50} />
      <ProgressRow label="Reach" value={stats.totalVues} max={1000} />
      <ProgressRow label="ROAS" value={stats.roas} max={10} />
    </div>
  </div>
</section>

      <section className="mb-6 rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900">Connexion Meta</h2>
            <p className="text-sm text-slate-500">
              Compte Facebook, Business Manager, compte publicitaire, page et Instagram.
            </p>
          </div>

          <button
            type="button"
            onClick={metaStatus?.connected ? deconnecterFacebook : connecterFacebook}
            disabled={loading}
            className={`rounded-2xl px-5 py-3 text-sm font-black text-white disabled:opacity-50 ${
              metaStatus?.connected ? 'bg-red-800 hover:bg-red-900' : 'bg-blue-900 hover:bg-blue-950'
            }`}
          >
            {metaStatus?.connected ? 'Déconnecter Meta' : 'Connecter Meta'}
          </button>
        </div>

        {metaStatus?.connected ? (
          <div className="grid gap-4 md:grid-cols-5">
            <InfoBox label="Statut" value="🟢 Facebook connecté" />
            <InfoBox label="Compte" value={metaStatus.account?.facebook_user_name || 'Compte Meta'} />
            <InfoBox label="Business" value={metaStatus.business?.name || 'Non détecté'} />
            <InfoBox label="Compte publicitaire" value={metaStatus.adAccount?.name || 'Non détecté'} />
            <InfoBox
              label="Instagram"
              value={
                metaStatus.instagram?.username
                  ? `@${metaStatus.instagram.username}`
                  : metaStatus.instagram?.name || 'Non détecté'
              }
            />
          </div>
        ) : (
          <div className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-600">
            Facebook n’est pas encore connecté. Connecte Meta pour choisir automatiquement le compte publicitaire et la campagne.
          </div>
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-6 text-xl font-black text-slate-900">Informations de la campagne</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nom campagne">
              <input className={input} value={form.nomCampagne} onChange={e => setForm({ ...form, nomCampagne: e.target.value })} />
            </Field>

            <Field label="Canal / type">
              <select className={input} value={form.typeCampagne} onChange={e => setForm({ ...form, typeCampagne: e.target.value })}>
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
              <input type="date" className={input} value={form.dateDebut} onChange={e => setForm({ ...form, dateDebut: e.target.value })} />
            </Field>

            <Field label="Date fin">
              <input type="date" className={input} value={form.dateFin} onChange={e => setForm({ ...form, dateFin: e.target.value })} />
            </Field>

            <Field label="Budget total">
              <input className={input} value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} />
            </Field>

            <Field label="Devise">
              <select className={input} value={form.devise} onChange={e => setForm({ ...form, devise: e.target.value })}>
                <option>USD</option>
                <option>CDF</option>
                <option>FC</option>
              </select>
            </Field>

            <Field label="Statut">
              <select className={input} value={form.statut} onChange={e => setForm({ ...form, statut: e.target.value })}>
                <option>Brouillon</option>
                <option>Active</option>
                <option>Terminée</option>
                <option>Annulée</option>
              </select>
            </Field>

            <Field label="Objectif">
              <textarea
                className={`${input} min-h-24 resize-none`}
                value={form.commentaires}
                onChange={e => setForm({ ...form, commentaires: e.target.value })}
              />
            </Field>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button onClick={enregistrer} disabled={loading} className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-black text-white disabled:opacity-50">
              <Save size={18} />
              Enregistrer
            </button>

            <button onClick={() => form.id && synchroniserMeta(form.id)} disabled={loading || syncing || !form.id || !metaStatus?.connected || !form.facebookCampaignId} className="flex items-center justify-center gap-2 rounded-2xl bg-blue-700 px-5 py-3 text-sm font-black text-white disabled:opacity-50">
              <RefreshCw size={18} />
              Synchroniser Meta
            </button>
          </div>
        </div>

        <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900">Liaison Meta automatique</h2>
            {form.facebookCampaignId && (
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-100">
                🔵 Synchronisée
              </span>
            )}
          </div>

          <div className="grid gap-4">
            <Field label="Compte publicitaire">
              <select className={input} value={selectedAdAccount} onChange={e => chargerMetaCampaigns(e.target.value)} disabled={!metaStatus?.connected || loadingMeta}>
                <option value="">{loadingMeta ? 'Chargement...' : 'Sélectionner un compte'}</option>
                {adAccounts.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name}{a.currency ? ` — ${a.currency}` : ''}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Campagne Meta">
              <select className={input} value={selectedMetaCampaign} onChange={e => setSelectedMetaCampaign(e.target.value)} disabled={!selectedAdAccount || loadingMeta}>
                <option value="">{!selectedAdAccount ? 'Choisissez d’abord un compte' : 'Sélectionner une campagne'}</option>
                {metaCampaigns.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.effective_status || c.status || ''}
                  </option>
                ))}
              </select>
            </Field>

            <button onClick={lierCampagneMeta} disabled={loading || !form.id || !selectedAdAccount || !selectedMetaCampaign} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-black text-white disabled:opacity-50">
              <Link2 size={18} />
              Lier la campagne Meta
            </button>
          </div>

          {!form.id && (
            <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-700">
              Enregistrez d’abord la campagne ERP avant de la lier à Meta.
            </p>
          )}
        </div>
      </section>

      {selectedCampagne && (
        <section className="mt-6 rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-5 text-xl font-black text-slate-900">Performance Meta</h2>

          <div className="grid gap-4 md:grid-cols-4">
           <Metric
  label="CTR"
  value={`${Number(selectedCampagne.metaCtr || 0).toFixed(2)} %`}
  score={Number(selectedCampagne.metaCtr || 0)}
/>

<Metric
  label="CPC"
  value={`${Number(selectedCampagne.metaCpc || 0).toFixed(2)} ${selectedCampagne.devise}`}
  score={Number(selectedCampagne.metaCpc || 0) > 0 ? 3 : 0}
/>

<Metric
  label="CPM"
  value={`${Number(selectedCampagne.metaCpm || 0).toFixed(2)} ${selectedCampagne.devise}`}
  score={Number(selectedCampagne.metaCpm || 0) > 0 ? 3 : 0}
/>

<Metric
  label="ROAS"
  value={Number(selectedCampagne.metaRoas || 0).toFixed(2)}
  score={Number(selectedCampagne.metaRoas || 0)}
/>
            <Metric label="Fréquence" value={Number(selectedCampagne.metaFrequency || 0).toFixed(2)} />
            <Metric label="Conversions" value={Number(selectedCampagne.metaConversions || 0).toFixed(0)} />
            <Metric label="Coût / message" value={`${Number(selectedCampagne.metaCostPerMessage || 0).toFixed(2)} ${selectedCampagne.devise}`} />
            <Metric label="Coût / résultat" value={`${Number(selectedCampagne.metaCostPerResult || 0).toFixed(2)} ${selectedCampagne.devise}`} />
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-5">
            <InfoBox label="Business" value={selectedCampagne.metaBusinessName || '-'} />
            <InfoBox label="Compte pub" value={selectedCampagne.metaAccountName || '-'} />
            <InfoBox label="Campagne Meta" value={selectedCampagne.metaCampaignName || '-'} />
            <InfoBox label="Page" value={selectedCampagne.metaPageName || '-'} />
            <InfoBox label="Instagram" value={selectedCampagne.metaInstagramName || '-'} />
          </div>
        </section>
      )}

      <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-xl font-black text-slate-900">Historique campagnes</h2>

          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <input className="rounded-xl border border-slate-200 py-2 pl-10 pr-3 text-sm outline-none focus:border-emerald-600" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            <select className={input} value={statut} onChange={e => setStatut(e.target.value)}>
              <option value="">Tous statuts</option>
              <option>Active</option>
              <option>Brouillon</option>
              <option>Terminée</option>
              <option>Annulée</option>
            </select>

            <button onClick={chargerCampagnes} className="flex items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm font-bold text-white">
              <RefreshCw size={16} />
              Actualiser
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1250px] text-left text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-xs uppercase text-slate-500">
                <th className="p-3">Campagne</th>
                <th className="p-3">Période</th>
                <th className="p-3">Budget</th>
                <th className="p-3">Dépenses</th>
                <th className="p-3">Vues</th>
                <th className="p-3">Messages</th>
                <th className="p-3">CTR</th>
                <th className="p-3">CPC</th>
                <th className="p-3">ROAS</th>
                <th className="p-3">Meta</th>
                <th className="p-3">Statut</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {campagnes.map(c => (
                <tr key={c.id} className="border-b hover:bg-slate-50">
                  <td className="p-3 font-bold text-slate-900">{c.nomCampagne}</td>
                  <td className="p-3">
                    <CalendarDays size={14} className="mr-1 inline" />
                    {String(c.dateDebut).slice(0, 10)} → {String(c.dateFin).slice(0, 10)}
                  </td>
                  <td className="p-3">{Number(c.budget || 0).toFixed(2)} {c.devise}</td>
                  <td className="p-3">{Number(c.budgetQuotidien || 0).toFixed(2)} {c.devise}</td>
                  <td className="p-3">{c.vues}</td>
                  <td className="p-3">{c.messages}</td>
                  <td className="p-3">{Number(c.metaCtr || 0).toFixed(2)}%</td>
                  <td className="p-3">{Number(c.metaCpc || 0).toFixed(2)}</td>
                  <td className="p-3">{Number(c.metaRoas || 0).toFixed(2)}</td>
                  <td className="p-3">
                    {c.facebookCampaignId ? (
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                        🔵 Synchronisée
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                        Non liée
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <StatusBadge statut={c.statut} />
                  </td>
                  <td className="flex gap-2 p-3">
                    <button title="Sélectionner" onClick={() => selectionner(c)} className="rounded-lg bg-blue-700 p-2 text-white">
                      <Save size={16} />
                    </button>
                    <button title="Annuler" onClick={() => annuler(c.id)} className="rounded-lg bg-amber-600 p-2 text-white">
                      <XCircle size={16} />
                    </button>
                    <button title="Supprimer" onClick={() => supprimer(c.id)} className="rounded-lg bg-red-800 p-2 text-white">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}

              {!campagnes.length && (
                <tr>
                  <td colSpan={12} className="p-6 text-center text-slate-500">
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

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
      <p className="text-xs font-black uppercase text-slate-400">{label}</p>
      <p className="mt-1 truncate text-sm font-bold text-slate-800">{value || '-'}</p>
    </div>
  );
}

function Metric({ label, value, score = 0 }: { label: string; value: string; score?: number }) {
  const level =
    score >= 4
      ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
      : score >= 2
        ? 'bg-amber-50 text-amber-700 ring-amber-100'
        : 'bg-red-50 text-red-700 ring-red-100';

  const note = score >= 4 ? '🟢 Excellent' : score >= 2 ? '🟡 Moyen' : '🔴 Faible';

  return (
    <div className={`rounded-2xl p-4 ring-1 ${level}`}>
      <p className="text-xs font-black uppercase">{label}</p>
      <p className="mt-1 text-xl font-black text-slate-900">{value}</p>
      <p className="mt-2 text-xs font-bold">{note}</p>
    </div>
  );
}

function KpiCard({
  title,
  value,
  percent,
  icon,
}: {
  title: string;
  value: string;
  percent: number;
  icon: React.ReactNode;
}) {
  const p = Math.max(0, Math.min(percent, 100));

  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="mb-4 flex items-center justify-between text-emerald-700">
        {icon}
        <span className="text-xs font-black text-slate-400">{p.toFixed(0)}%</span>
      </div>

      <div className="mb-4 h-3 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-emerald-700" style={{ width: `${p}%` }} />
      </div>

      <p className="text-sm font-semibold text-slate-500">{title}</p>
      <p className="mt-1 text-2xl font-black text-slate-900">{value}</p>
    </div>
  );
}

function ProgressRow({ label, value, max }: { label: string; value: number; max: number }) {
  const percent = Math.max(0, Math.min((Number(value || 0) / max) * 100, 100));

  return (
    <div>
      <div className="mb-1 flex justify-between text-sm font-bold text-slate-600">
        <span>{label}</span>
        <span>{Number(value || 0).toFixed(label === 'ROAS' ? 2 : 0)}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-blue-700" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function MiniTrend({ title, values }: { title: string; values: number[] }) {
  const max = Math.max(...values, 1);

  return (
    <div className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
      <p className="mb-5 text-sm font-black uppercase text-slate-500">{title}</p>

      <div className="flex h-40 items-end gap-4">
        {values.map((v, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-2">
            <div
              className="w-full rounded-t-2xl bg-emerald-700"
              style={{ height: `${Math.max((v / max) * 120, 8)}px` }}
            />
            <span className="text-xs font-bold text-slate-400">{i + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ statut }: { statut: string }) {
  const s = String(statut || '').toLowerCase();

  if (s.includes('active')) {
    return <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">🟢 Active</span>;
  }

  if (s.includes('brouillon')) {
    return <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">🟡 Brouillon</span>;
  }

  if (s.includes('annul')) {
    return <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">🔴 Annulée</span>;
  }

  if (s.includes('termin')) {
    return <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">⚪ Terminée</span>;
  }

  return <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{statut || 'Statut'}</span>;
}