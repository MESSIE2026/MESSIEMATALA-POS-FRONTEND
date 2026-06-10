'use client';

import { useEffect, useMemo, useState } from 'react';

const API =
  process.env.NEXT_PUBLIC_CENTRAL_API ||
  'https://messiematala-pos-backend-production.up.railway.app';

type ServeurClient = {
  idserveur: number;
  nomclient: string;
  serverurl: string;
  plan: string;
  actif: boolean;
  statut: string;
  derniereverification: string | null;
  createdat?: string | null;
};

type Stats = {
  total: number;
  actifs: number;
  inactifs: number;
  statut_actif: number;
  statut_desactive: number;
  non_verifies: number;
};

export default function ServeursClientsPage() {
  const [serveurs, setServeurs] = useState<ServeurClient[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [search, setSearch] = useState('');
  const [filtreActif, setFiltreActif] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [message, setMessage] = useState('');

  async function charger() {
    setLoading(true);
    setMessage('');

    try {
      const params = new URLSearchParams();

      if (search.trim()) params.set('search', search.trim());
      if (filtreActif) params.set('actif', filtreActif);

      const [resServeurs, resStats] = await Promise.all([
        fetch(`${API}/serveurs-clients?${params.toString()}`, {
          cache: 'no-store',
        }),
        fetch(`${API}/serveurs-clients/status`, {
          cache: 'no-store',
        }),
      ]);

      const dataServeurs = await resServeurs.json();
      const dataStats = await resStats.json();

      if (!resServeurs.ok) {
        throw new Error(dataServeurs?.message || 'Erreur chargement serveurs.');
      }

      if (!resStats.ok) {
        throw new Error(dataStats?.message || 'Erreur chargement statistiques.');
      }

      setServeurs(Array.isArray(dataServeurs) ? dataServeurs : []);
      setStats(dataStats);
    } catch (error: any) {
      setMessage(error?.message || 'Impossible de charger les serveurs.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function actionServeur(
    id: number,
    action: 'activer' | 'desactiver' | 'verifier',
  ) {
    setActionLoading(id);
    setMessage('');

    try {
      const method = action === 'verifier' ? 'POST' : 'PATCH';

      const res = await fetch(`${API}/serveurs-clients/${id}/${action}`, {
        method,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || 'Action impossible.');
      }

      setMessage(data?.message || 'Action exécutée avec succès.');
      await charger();
    } catch (error: any) {
      setMessage(error?.message || 'Erreur action serveur.');
    } finally {
      setActionLoading(null);
    }
  }

  const totalAffiche = useMemo(() => serveurs.length, [serveurs]);

  function formatDate(date?: string | null) {
    if (!date) return '-';
    return new Date(date).toLocaleString();
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Serveurs Clients
              </h1>

              <p className="mt-2 text-slate-500">
                Supervision des serveurs de toutes les entreprises clientes de
                MESSIE MATALA POS.
              </p>
            </div>

            <button
              onClick={charger}
              disabled={loading}
              className="rounded-xl bg-slate-900 px-5 py-3 font-bold text-white disabled:opacity-60"
            >
              {loading ? 'Chargement...' : 'Actualiser'}
            </button>
          </div>

          {message && (
            <div className="mt-5 rounded-xl bg-blue-50 p-4 font-medium text-blue-700">
              {message}
            </div>
          )}
        </section>

        {stats && (
          <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
            <Card title="Total" value={stats.total} />
            <Card title="Affichés" value={totalAffiche} />
            <Card title="Actifs" value={stats.actifs} />
            <Card title="Inactifs" value={stats.inactifs} />
            <Card title="Désactivés" value={stats.statut_desactive} />
            <Card title="Non vérifiés" value={stats.non_verifies} />
          </section>
        )}

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Recherche
              </label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') charger();
                }}
                placeholder="Rechercher client, serveur, plan ou statut..."
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Filtre
              </label>
              <select
                value={filtreActif}
                onChange={(e) => setFiltreActif(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              >
                <option value="">Tous</option>
                <option value="true">Actifs</option>
                <option value="false">Inactifs</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={charger}
              disabled={loading}
              className="rounded-xl bg-blue-600 px-5 py-3 font-bold text-white disabled:opacity-60"
            >
              Rechercher
            </button>

            <button
              onClick={() => {
                setSearch('');
                setFiltreActif('');
                setTimeout(charger, 0);
              }}
              disabled={loading}
              className="rounded-xl bg-slate-200 px-5 py-3 font-bold text-slate-700 disabled:opacity-60"
            >
              Réinitialiser
            </button>
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="border-b p-5">
            <h2 className="text-xl font-bold text-slate-900">
              Liste des serveurs
            </h2>
          </div>

          <div className="overflow-auto">
            <table className="min-w-[1150px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <Th>ID</Th>
                  <Th>Client</Th>
                  <Th>Serveur</Th>
                  <Th>Plan</Th>
                  <Th>Statut</Th>
                  <Th>Actif</Th>
                  <Th>Dernière vérification</Th>
                  <Th>Créé le</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500">
                      Chargement des serveurs...
                    </td>
                  </tr>
                )}

                {!loading &&
                  serveurs.map((s) => (
                    <tr
                      key={s.idserveur}
                      className="border-t transition hover:bg-slate-50"
                    >
                      <Td>
                        <span className="font-bold">{s.idserveur}</span>
                      </Td>

                      <Td>
                        <div className="font-semibold text-slate-900">
                          {s.nomclient || '-'}
                        </div>
                      </Td>

                      <Td>
                        <span className="break-all font-mono text-xs text-blue-700">
                          {s.serverurl || '-'}
                        </span>
                      </Td>

                      <Td>{s.plan || '-'}</Td>

                      <Td>
                        <StatutBadge statut={s.statut} />
                      </Td>

                      <Td>
                        <ActifBadge actif={s.actif} />
                      </Td>

                      <Td>{formatDate(s.derniereverification)}</Td>

                      <Td>{formatDate(s.createdat)}</Td>

                      <Td>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => actionServeur(s.idserveur, 'verifier')}
                            disabled={actionLoading === s.idserveur}
                            className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
                          >
                            Vérifier
                          </button>

                          {s.actif ? (
                            <button
                              onClick={() =>
                                actionServeur(s.idserveur, 'desactiver')
                              }
                              disabled={actionLoading === s.idserveur}
                              className="rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
                            >
                              Désactiver
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                actionServeur(s.idserveur, 'activer')
                              }
                              disabled={actionLoading === s.idserveur}
                              className="rounded-lg bg-green-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
                            >
                              Activer
                            </button>
                          )}
                        </div>
                      </Td>
                    </tr>
                  ))}

                {!loading && serveurs.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500">
                      Aucun serveur client trouvé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function Card({ title, value }: { title: string; value: any }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <h2 className="mt-2 text-3xl font-bold text-slate-900">
        {value ?? 0}
      </h2>
    </div>
  );
}

function StatutBadge({ statut }: { statut?: string }) {
  const value = String(statut || 'NON_VERIFIE').toUpperCase();

  const cls =
    value === 'ACTIF'
      ? 'bg-green-100 text-green-700'
      : value === 'DESACTIVE'
        ? 'bg-red-100 text-red-700'
        : value === 'HORS_LIGNE'
          ? 'bg-orange-100 text-orange-700'
          : 'bg-slate-100 text-slate-700';

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${cls}`}>
      {value}
    </span>
  );
}

function ActifBadge({ actif }: { actif: boolean }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${
        actif ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
      }`}
    >
      {actif ? 'ACTIF' : 'INACTIF'}
    </span>
  );
}

function Th({ children }: any) {
  return (
    <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">
      {children}
    </th>
  );
}

function Td({ children }: any) {
  return <td className="px-4 py-3 align-top">{children}</td>;
}