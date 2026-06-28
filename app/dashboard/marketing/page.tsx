'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  CalendarDays,
  Flag,
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
  const [message, setMessage] = useState('');

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

  useEffect(() => {
    chargerCampagnes();
  }, []);

  async function enregistrer() {
    try {
      if (!form.nomCampagne.trim()) {
        setMessage('Le nom de la campagne est obligatoire.');
        return;
      }

      setLoading(true);

      await postJson(
        form.id
          ? `${API_URL}/marketing/${form.id}`
          : `${API_URL}/marketing`,
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
        },
      );

      setMessage('Campagne enregistrée avec succès.');
      setForm(emptyForm);
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
      const res = await fetch(`${API_URL}/marketing/${id}/annuler`, {
        method: 'PATCH',
      });
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
      const res = await fetch(`${API_URL}/marketing/${id}/sync-meta`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error(await res.text());
      setMessage('Synchronisation Meta terminée.');
      await chargerCampagnes();
    } catch (e: any) {
      setMessage(`Erreur synchronisation Meta : ${e.message}`);
    } finally {
      setLoading(false);
    }
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
  }

  const input =
    'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100';
  const label = 'text-xs font-bold uppercase tracking-wide text-slate-500';

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
          onClick={() => setForm(emptyForm)}
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

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-5 text-xl font-black text-slate-900">Campagne</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nom campagne">
              <input className={input} value={form.nomCampagne} onChange={e => setForm({ ...form, nomCampagne: e.target.value })} />
            </Field>

            <Field label="Type campagne">
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

            <Field label="Budget">
              <input className={input} value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} />
            </Field>

            <Field label="Statut">
              <select className={input} value={form.statut} onChange={e => setForm({ ...form, statut: e.target.value })}>
                <option>Brouillon</option>
                <option>Active</option>
                <option>Terminée</option>
                <option>Annulée</option>
              </select>
            </Field>

            <div className="md:col-span-2">
              <p className={label}>Commentaires</p>
              <textarea
                className={`${input} min-h-24`}
                value={form.commentaires}
                onChange={e => setForm({ ...form, commentaires: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-5 text-xl font-black text-slate-900">Résultats & Meta</h2>

          <div className="grid gap-4 md:grid-cols-2">
            {[
              ['Messages', 'messages'],
              ['Vues', 'vues'],
              ['Spectateurs', 'spectateurs'],
              ['Budget quotidien', 'budgetQuotidien'],
              ['Nombre ventes', 'nombreVentes'],
              ['Montant vendu', 'montantVendus'],
            ].map(([t, k]) => (
              <Field key={k} label={t}>
                <input className={input} value={(form as any)[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} />
              </Field>
            ))}

            <Field label="Devise">
              <select className={input} value={form.devise} onChange={e => setForm({ ...form, devise: e.target.value })}>
                <option>USD</option>
                <option>CDF</option>
                <option>FC</option>
              </select>
            </Field>

            <Field label="Facebook Campaign ID">
              <input className={input} value={form.facebookCampaignId} onChange={e => setForm({ ...form, facebookCampaignId: e.target.value })} />
            </Field>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={enregistrer}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
            >
              <Save size={18} />
              Enregistrer
            </button>

            <button
              onClick={() => form.id && synchroniserMeta(form.id)}
              disabled={loading || !form.id}
              className="flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-50"
            >
             <Settings size={18} />
              Sync Meta
            </button>

            <button
              className="flex items-center gap-2 rounded-xl bg-slate-700 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800"
            >
              <Settings size={18} />
              Paramètres privés
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
              onClick={chargerCampagnes}
              className="flex items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm font-bold text-white"
            >
              <RefreshCw size={16} />
              Actualiser
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
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
                  <td className="p-3">{Number(c.budget || 0).toFixed(2)} {c.devise}</td>
                  <td className="p-3">{c.vues}</td>
                  <td className="p-3">{c.messages}</td>
                  <td className="p-3">{c.nombreVentes}</td>
                  <td className="p-3 font-bold text-emerald-700">{Number(c.montantVendus || 0).toFixed(2)} {c.devise}</td>
                  <td className="p-3">
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                      {c.statut}
                    </span>
                  </td>
                  <td className="flex gap-2 p-3">
                    <button onClick={() => selectionner(c)} className="rounded-lg bg-blue-700 p-2 text-white">
                      <Save size={16} />
                    </button>
                    <button onClick={() => annuler(c.id)} className="rounded-lg bg-amber-600 p-2 text-white">
                      <XCircle size={16} />
                    </button>
                    <button onClick={() => supprimer(c.id)} className="rounded-lg bg-red-800 p-2 text-white">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}

              {!campagnes.length && (
                <tr>
                  <td colSpan={10} className="p-6 text-center text-slate-500">
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
      <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      {children}
    </label>
  );
}

function Card({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="mb-3 flex items-center justify-between text-emerald-700">
        {icon}
      </div>
      <p className="text-sm font-semibold text-slate-500">{title}</p>
      <p className="mt-1 text-2xl font-black text-slate-900">{value}</p>
    </div>
  );
}