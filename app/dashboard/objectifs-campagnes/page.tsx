'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  Edit,
  RefreshCw,
  Save,
  Target,
  Trash2,
  X,
} from 'lucide-react';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://messiematala-pos-backend-production.up.railway.app';

type Objectif = {
  id: number;
  agentId: number;
  nomAgent: string;
  periodeType: string;
  dateDebut: string;
  dateFin: string;
  objectifNbVentes: number;
  objectifMontant: number;
  devise: string;
  realiseUsd?: number;
  realiseCdf?: number;
  realiseEur?: number;
  campagneId?: number | null;
  commentaire?: string;
  realiseNbVentes: number;
  realiseMontant: number;
  atteinteNbPct?: number | null;
  atteinteMontantPct?: number | null;
  atteinteGlobalePct?: number;
  statut?: string;
  prime?: number;
  classement?: number;
};

export default function Page() {
  const [objectifs, setObjectifs] = useState<Objectif[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [campagnes, setCampagnes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [idActif, setIdActif] = useState<number | null>(null);
  const [agentId, setAgentId] = useState('');
  const [nomAgent, setNomAgent] = useState('');
  const [periodeType, setPeriodeType] = useState('Semaine');
  const [dateDebut, setDateDebut] = useState(new Date().toISOString().slice(0, 10));
  const [dateFin, setDateFin] = useState(new Date().toISOString().slice(0, 10));
  const [objectifNbVentes, setObjectifNbVentes] = useState('0');
  const [objectifMontant, setObjectifMontant] = useState('0');
  const [devise, setDevise] = useState('USD');
  const [campagneId, setCampagneId] = useState('');
  const [commentaire, setCommentaire] = useState('');

  async function lire(res: Response) {
    const txt = await res.text();
    try {
      return txt ? JSON.parse(txt) : null;
    } catch {
      return txt;
    }
  }

  async function charger() {
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch(
        `${API_URL}/objectifs-campagnes?idEntreprise=1&idMagasin=1`,
        { cache: 'no-store' },
      );

      const data = await lire(res);
      if (!res.ok) throw new Error(typeof data === 'string' ? data : JSON.stringify(data));
      setObjectifs(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setMessage(e.message || 'Erreur chargement objectifs.');
    } finally {
      setLoading(false);
    }
  }

  async function chargerLookups() {
    const res = await fetch(
      `${API_URL}/objectifs-campagnes/lookups?idEntreprise=1&idMagasin=1`,
      { cache: 'no-store' },
    );

    const data = await lire(res);
    setAgents(data?.agents || []);
    setCampagnes(data?.campagnes || []);
  }

  useEffect(() => {
    chargerLookups();
    charger();
  }, []);

  function ajusterPeriode(p: string) {
    setPeriodeType(p);

    const now = new Date();
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (p === 'Jour') {
      const v = d.toISOString().slice(0, 10);
      setDateDebut(v);
      setDateFin(v);
    }

    if (p === 'Semaine') {
      const day = d.getDay() || 7;
      const lundi = new Date(d);
      lundi.setDate(d.getDate() - day + 1);

      const dimanche = new Date(lundi);
      dimanche.setDate(lundi.getDate() + 6);

      setDateDebut(lundi.toISOString().slice(0, 10));
      setDateFin(dimanche.toISOString().slice(0, 10));
    }

    if (p === 'Mois') {
      const first = new Date(d.getFullYear(), d.getMonth(), 1);
      const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);

      setDateDebut(first.toISOString().slice(0, 10));
      setDateFin(last.toISOString().slice(0, 10));
    }
  }

  function vider() {
    setIdActif(null);
    setAgentId('');
    setNomAgent('');
    setPeriodeType('Semaine');
    ajusterPeriode('Semaine');
    setObjectifNbVentes('0');
    setObjectifMontant('0');
    setDevise('USD');
    setCampagneId('');
    setCommentaire('');
  }

  function choisirAgent(v: string) {
    setAgentId(v);
    const a = agents.find((x) => String(x.agentId) === String(v));
    setNomAgent(a?.nomAgent || '');
  }

  function selectionner(o: Objectif) {
    setIdActif(o.id);
    setAgentId(String(o.agentId || ''));
    setNomAgent(o.nomAgent || '');
    setPeriodeType(o.periodeType || 'Semaine');
    setDateDebut(String(o.dateDebut || '').slice(0, 10));
    setDateFin(String(o.dateFin || '').slice(0, 10));
    setObjectifNbVentes(String(o.objectifNbVentes || 0));
    setObjectifMontant(String(o.objectifMontant || 0));
    setDevise(o.devise || 'USD');
    setCampagneId(o.campagneId ? String(o.campagneId) : '');
    setCommentaire(o.commentaire || '');
  }

  async function enregistrer() {
    setMessage('');

    if (!Number(agentId)) return setMessage('Sélectionne un agent.');
    if (!dateDebut || !dateFin) return setMessage('Période obligatoire.');
    if (dateFin < dateDebut) return setMessage('Date fin invalide.');

    const body = {
      agentId: Number(agentId),
      nomAgent,
      periodeType,
      dateDebut,
      dateFin,
      objectifNbVentes: Number(objectifNbVentes || 0),
      objectifMontant: Number(objectifMontant || 0),
      devise,
      campagneId: campagneId ? Number(campagneId) : null,
      commentaire,
      idEntreprise: 1,
      idMagasin: 1,
    };

    const url = idActif
      ? `${API_URL}/objectifs-campagnes/${idActif}`
      : `${API_URL}/objectifs-campagnes`;

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

    setMessage(idActif ? 'Objectif modifié.' : 'Objectif ajouté.');
    vider();
    await charger();
  }

  async function supprimer(id: number) {
    if (!confirm('Supprimer cet objectif ?')) return;

    const res = await fetch(`${API_URL}/objectifs-campagnes/${id}`, {
      method: 'DELETE',
    });

    const data = await lire(res);

    if (!res.ok) {
      setMessage(typeof data === 'string' ? data : JSON.stringify(data));
      return;
    }

    setMessage('Objectif supprimé.');
    await charger();
  }

  const stats = useMemo(() => {
    const totalObj = objectifs.reduce((s, x) => s + Number(x.objectifMontant || 0), 0);
    const totalReal = objectifs.reduce((s, x) => s + Number(x.realiseMontant || 0), 0);

    return {
      total: objectifs.length,
      ventesObjectif: objectifs.reduce((s, x) => s + Number(x.objectifNbVentes || 0), 0),
      ventesRealisees: objectifs.reduce((s, x) => s + Number(x.realiseNbVentes || 0), 0),
      montantObjectif: totalObj,
      montantRealise: totalReal,
      pct: totalObj <= 0 ? 0 : (totalReal * 100) / totalObj,
    };
  }, [objectifs]);

  function pctNumber(v: any) {
    const n = Number(v || 0);
    return Number.isFinite(n) ? Math.max(0, Math.min(n, 100)) : 0;
  }

  function couleurPct(v: any) {
    const n = Number(v || 0);

    if (n >= 100) {
      return {
        badge: 'bg-green-100 text-green-800 ring-green-200',
        bar: 'bg-green-700',
        label: '🟢 Excellent',
      };
    }

    if (n >= 70) {
      return {
        badge: 'bg-amber-100 text-amber-800 ring-amber-200',
        bar: 'bg-amber-500',
        label: '🟡 En progression',
      };
    }

    return {
      badge: 'bg-red-100 text-red-800 ring-red-200',
      bar: 'bg-red-600',
      label: '🔴 Faible',
    };
  }

  function Progression({
    label,
    value,
  }: {
    label: string;
    value: any;
  }) {
    const n = Number(value || 0);
    const safe = pctNumber(n);
    const color = couleurPct(n);

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-black">
          <span className="text-slate-500">{label}</span>
          <span className={`rounded-full px-3 py-1 ring-1 ${color.badge}`}>
            {Number.isFinite(n) ? `${n.toFixed(1)}%` : '—'}
          </span>
        </div>

        <div className="h-3 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
          <div
            className={`h-full rounded-full ${color.bar}`}
            style={{ width: `${safe}%` }}
          />
        </div>
      </div>
    );
  }

  function rangLabel(rang?: number) {
    if (rang === 1) return '🥇 #1';
    if (rang === 2) return '🥈 #2';
    if (rang === 3) return '🥉 #3';
    return rang ? `#${rang}` : '#—';
  }

  return (
    <main className="min-h-screen bg-slate-100 p-3 md:p-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-black uppercase text-green-700">
                Objectifs & Campagnes
              </p>

              <h1 className="text-2xl font-black text-slate-900">
                Suivi des objectifs commerciaux par agent
              </h1>

              <p className="text-sm text-slate-500">
                Objectifs ventes, montant, période, campagne et taux d’atteinte.
              </p>
            </div>

            <button
              onClick={charger}
              className="rounded-xl bg-slate-800 px-4 py-3 text-sm font-bold text-white hover:bg-slate-900"
            >
              <RefreshCw className="mr-2 inline" size={16} />
              Actualiser
            </button>
          </div>
        </section>

        {message && (
          <div className="rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-800 ring-1 ring-amber-200">
            {message}
          </div>
        )}

        <section className="grid gap-3 md:grid-cols-5">
          <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
            <p className="text-xs text-slate-500">Objectifs</p>
            <b>{stats.total}</b>
          </div>

          <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
            <p className="text-xs text-slate-500">Obj. ventes</p>
            <b>{stats.ventesObjectif}</b>
          </div>

          <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
            <p className="text-xs text-slate-500">Réalisé ventes</p>
            <b>{stats.ventesRealisees}</b>
          </div>

          <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
            <p className="text-xs text-slate-500">Réalisé montant</p>
            <b>{stats.montantRealise.toLocaleString('fr-FR')}</b>
          </div>

          <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
            <p className="text-xs text-slate-500">Atteinte globale</p>
            <b>{stats.pct.toFixed(1)}%</b>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[420px_1fr]">
          <div className="rounded-3xl bg-white p-5 ring-1 ring-slate-200">
            <h2 className="mb-4 text-lg font-black text-slate-900">
              <Target className="mr-2 inline text-green-700" />
              {idActif ? 'Modifier objectif' : 'Nouvel objectif'}
            </h2>

            <div className="grid gap-3">
              <select
                value={agentId}
                onChange={(e) => choisirAgent(e.target.value)}
                className="rounded-xl border p-3"
              >
                <option value="">Choisir agent</option>
                {agents.map((a) => (
                  <option key={a.agentId} value={a.agentId}>
                    {a.nomAgent}
                  </option>
                ))}
              </select>

              <select
                value={periodeType}
                onChange={(e) => ajusterPeriode(e.target.value)}
                className="rounded-xl border p-3"
              >
                <option>Jour</option>
                <option>Semaine</option>
                <option>Mois</option>
              </select>

              <div className="grid grid-cols-2 gap-2">
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
              </div>

              <input
                type="number"
                value={objectifNbVentes}
                onChange={(e) => setObjectifNbVentes(e.target.value)}
                placeholder="Objectif nombre de ventes"
                className="rounded-xl border p-3"
              />

              <div className="grid grid-cols-[1fr_100px] gap-2">
                <input
                  type="number"
                  value={objectifMontant}
                  onChange={(e) => setObjectifMontant(e.target.value)}
                  placeholder="Objectif montant"
                  className="rounded-xl border p-3"
                />

                <select
                  value={devise}
                  onChange={(e) => setDevise(e.target.value)}
                  className="rounded-xl border p-3"
                >
                  <option>USD</option>
                  <option>CDF</option>
                  <option>EUR</option>
                </select>
              </div>

              <select
                value={campagneId}
                onChange={(e) => setCampagneId(e.target.value)}
                className="rounded-xl border p-3"
              >
                <option value="">Aucune campagne</option>
                {campagnes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nomcampagne}
                  </option>
                ))}
              </select>

              <textarea
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                placeholder="Commentaire ou note"
                className="min-h-[90px] rounded-xl border p-3"
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={enregistrer}
                className="rounded-xl bg-green-700 px-5 py-3 font-bold text-white hover:bg-green-800"
              >
                {idActif ? (
                  <Edit className="mr-2 inline" size={16} />
                ) : (
                  <Save className="mr-2 inline" size={16} />
                )}
                {idActif ? 'Modifier' : 'Ajouter'}
              </button>

              <button
                onClick={vider}
                className="rounded-xl bg-slate-600 px-5 py-3 font-bold text-white hover:bg-slate-700"
              >
                <X className="mr-2 inline" size={16} />
                Annuler
              </button>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-5 ring-1 ring-slate-200">
            <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <h2 className="font-black text-slate-900">
                <CalendarDays className="mr-2 inline text-green-700" />
                Liste des objectifs
              </h2>

              {loading && (
                <span className="text-sm font-bold text-slate-500">
                  Chargement...
                </span>
              )}
            </div>

            {!loading && objectifs.length === 0 && (
              <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm font-bold text-slate-500 ring-1 ring-slate-200">
                Aucun objectif trouvé.
              </div>
            )}

            <div className="grid gap-4 xl:grid-cols-2">
              {objectifs.map((o) => {
                const venteColor = couleurPct(o.atteinteNbPct);
                const montantColor = couleurPct(o.atteinteMontantPct);

                return (
                  <article
                    key={o.id}
                    className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200"
                  >
                    <div className="bg-slate-900 p-4 text-white">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-black uppercase text-green-300">
                            Agent commercial
                          </p>

                          <h3 className="text-lg font-black">
                            👤 {o.nomAgent || 'Agent inconnu'}
                          </h3>

                          <p className="mt-1 text-sm text-slate-300">
                            {o.periodeType} •{' '}
                            {new Date(o.dateDebut).toLocaleDateString('fr-FR')} →{' '}
                            {new Date(o.dateFin).toLocaleDateString('fr-FR')}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-white/10 px-3 py-2 text-sm font-black ring-1 ring-white/20">
                          {rangLabel(o.classement)}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-5 p-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                          <p className="text-xs font-bold text-slate-500">
                            🎯 Obj. ventes
                          </p>
                          <p className="mt-1 text-xl font-black text-slate-900">
                            {Number(o.objectifNbVentes || 0).toLocaleString('fr-FR')}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                          <p className="text-xs font-bold text-slate-500">
                            ✅ Réalisé
                          </p>
                          <p className="mt-1 text-xl font-black text-slate-900">
                            {Number(o.realiseNbVentes || 0).toLocaleString('fr-FR')}
                          </p>
                        </div>
                      </div>

                      <Progression label="📈 Progression ventes" value={o.atteinteNbPct} />

                      <div className="rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
                        <p className="text-xs font-black uppercase text-emerald-700">
                          💰 Objectif montant
                        </p>

                        <p className="mt-1 text-2xl font-black text-emerald-900">
                          {Number(o.objectifMontant || 0).toLocaleString('fr-FR')}{' '}
                          {o.devise}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                        <p className="mb-3 text-xs font-black uppercase text-slate-500">
                          💵 Réalisé par devise
                        </p>

                        <div className="grid gap-2 text-sm font-bold">
                          <div className="flex justify-between rounded-xl bg-white p-3 ring-1 ring-slate-200">
                            <span>USD</span>
                            <span>{Number(o.realiseUsd || 0).toLocaleString('fr-FR')} USD</span>
                          </div>

                          <div className="flex justify-between rounded-xl bg-white p-3 ring-1 ring-slate-200">
                            <span>CDF</span>
                            <span>{Number(o.realiseCdf || 0).toLocaleString('fr-FR')} CDF</span>
                          </div>

                          <div className="flex justify-between rounded-xl bg-white p-3 ring-1 ring-slate-200">
                            <span>EUR</span>
                            <span>{Number(o.realiseEur || 0).toLocaleString('fr-FR')} EUR</span>
                          </div>
                        </div>

                        <div className="mt-3 rounded-xl bg-white p-3 ring-1 ring-slate-200">
                          <div className="flex justify-between text-sm font-black">
                            <span>Total converti</span>
                            <span className="text-emerald-800">
                              {Number(o.realiseMontant || 0).toLocaleString('fr-FR')}{' '}
                              {o.devise}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Progression label="📊 Atteinte montant" value={o.atteinteMontantPct} />

                      <div className="grid gap-3 md:grid-cols-3">
                        <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                          <p className="text-xs font-bold text-slate-500">Statut</p>
                          <p className={`mt-2 rounded-full px-3 py-1 text-center text-xs font-black ring-1 ${montantColor.badge}`}>
                            {o.statut || 'En cours'}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                          <p className="text-xs font-bold text-slate-500">Prime</p>
                          <p className="mt-2 text-sm font-black text-slate-900">
                            {Number(o.prime || 0).toLocaleString('fr-FR')} {o.devise}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                          <p className="text-xs font-bold text-slate-500">Niveau</p>
                          <p className={`mt-2 rounded-full px-3 py-1 text-center text-xs font-black ring-1 ${venteColor.badge}`}>
                            {venteColor.label}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                        <p className="text-xs font-bold text-slate-500">📝 Commentaire</p>
                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          {o.commentaire || '-'}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2 border-t pt-4">
                        <button
                          onClick={() => selectionner(o)}
                          className="flex-1 rounded-xl bg-blue-700 px-4 py-3 text-sm font-bold text-white hover:bg-blue-800"
                        >
                          <Edit className="mr-2 inline" size={16} />
                          Modifier
                        </button>

                        <button
                          onClick={() => supprimer(o.id)}
                          className="flex-1 rounded-xl bg-red-800 px-4 py-3 text-sm font-bold text-white hover:bg-red-900"
                        >
                          <Trash2 className="mr-2 inline" size={16} />
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}