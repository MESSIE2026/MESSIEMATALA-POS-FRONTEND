'use client';

import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_CENTRAL_API || 'http://localhost:3002';

type BackupItem = {
  id: number;
  identreprise?: number;
  idserveur?: number;
  entreprise?: string;
  nomclient?: string;
  serverurl?: string;
  nomfichier?: string;
  taillemo?: number;
  typebackup?: string;
  statut?: string;
  message?: string;
  createdat?: string;
  ciblebackup?: string;
};

type BackupStats = {
  total: number;
  aujourd_hui: number;
  echecs: number;
  derniere: string | null;
};

export default function SauvegardesPage() {
  const [items, setItems] = useState<BackupItem[]>([]);
  const [stats, setStats] = useState<BackupStats | null>(null);
  const [loadingPage, setLoadingPage] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [message, setMessage] = useState('');

  async function charger() {
    setLoadingPage(true);
    setMessage('');

    try {
      const [resItems, resStats] = await Promise.all([
        fetch(`${API}/backups`, { cache: 'no-store' }),
        fetch(`${API}/backups/stats`, { cache: 'no-store' }),
      ]);

      const jsonItems = await resItems.json().catch(() => []);
      const jsonStats = await resStats.json().catch(() => null);

      if (!resItems.ok) {
        setMessage(jsonItems?.message || 'Erreur chargement des sauvegardes.');
        return;
      }

      if (!resStats.ok) {
        setMessage(jsonStats?.message || 'Erreur chargement des statistiques.');
        return;
      }

      setItems(Array.isArray(jsonItems) ? jsonItems : []);
      setStats(jsonStats);
    } catch (error: any) {
      setMessage(error?.message || 'Impossible de joindre le serveur central.');
    } finally {
      setLoadingPage(false);
    }
  }

  useEffect(() => {
    charger();
  }, []);

  async function creerSauvegarde() {
    const ok = window.confirm('Créer une nouvelle sauvegarde maintenant ?');
    if (!ok) return;

    setLoadingAction(true);
    setMessage('');

    try {
      const res = await fetch(`${API}/backups/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identreprise: 1 }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(json.message || 'Erreur pendant la sauvegarde.');
        return;
      }

      alert('Sauvegarde créée avec succès.');
      await charger();
    } catch (error: any) {
      alert(error?.message || 'Impossible de créer la sauvegarde.');
    } finally {
      setLoadingAction(false);
    }
  }

  async function restaurer(x: BackupItem) {
    const ok = window.confirm(
      `ATTENTION : cette opération peut remplacer les données actuelles.\n\nRestaurer la sauvegarde ${x.nomfichier || x.id} ?`
    );

    if (!ok) return;

    setLoadingAction(true);

    try {
      const res = await fetch(`${API}/backups/restore/${x.id}`, {
        method: 'POST',
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(json.message || 'Erreur pendant la restauration.');
        return;
      }

      alert(json.message || 'Base restaurée.');
      await charger();
    } catch (error: any) {
      alert(error?.message || 'Impossible de restaurer.');
    } finally {
      setLoadingAction(false);
    }
  }

  async function supprimer(x: BackupItem) {
    const ok = window.confirm(`Supprimer la sauvegarde ${x.nomfichier || x.id} ?`);
    if (!ok) return;

    setLoadingAction(true);

    try {
      const res = await fetch(`${API}/backups/${x.id}`, {
        method: 'DELETE',
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(json.message || 'Erreur pendant la suppression.');
        return;
      }

      await charger();
    } catch (error: any) {
      alert(error?.message || 'Impossible de supprimer.');
    } finally {
      setLoadingAction(false);
    }
  }

  function telecharger(x: BackupItem) {
    window.open(`${API}/backups/download/${x.id}`, '_blank');
  }

  return (
    <main className="min-h-screen bg-[#f4f1e8] p-6 text-slate-900">
      <div className="mx-auto max-w-[1700px] space-y-6">
        <section className="rounded-[30px] border border-emerald-100 bg-white p-7 shadow-sm">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-700">
                MESSIE MATALA POS
              </p>

              <h1 className="mt-2 text-3xl font-black text-emerald-950">
                Sauvegardes
              </h1>

              <p className="mt-2 max-w-3xl text-sm text-slate-500">
                Créer, télécharger, restaurer et contrôler les sauvegardes PostgreSQL
                du serveur central et des serveurs clients.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={charger}
                disabled={loadingPage || loadingAction}
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                {loadingPage ? 'Chargement...' : 'Actualiser'}
              </button>

              <button
                onClick={creerSauvegarde}
                disabled={loadingAction}
                className="rounded-xl bg-emerald-950 px-5 py-3 text-sm font-black text-white hover:bg-emerald-900 disabled:opacity-60"
              >
                {loadingAction ? 'Traitement...' : 'Créer une sauvegarde'}
              </button>
            </div>
          </div>
        </section>

        {message && (
          <section className="rounded-2xl bg-red-50 p-4 font-bold text-red-700">
            {message}
          </section>
        )}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Total" value={stats?.total ?? 0} tone="slate" />
          <StatCard title="Aujourd’hui" value={stats?.aujourd_hui ?? 0} tone="emerald" />
          <StatCard title="Échecs" value={stats?.echecs ?? 0} tone="red" />
          <StatCard
            title="Dernière"
            value={stats?.derniere ? formatDate(stats.derniere) : '-'}
            tone="blue"
          />
        </section>

        <section className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-3 border-b bg-slate-50 px-5 py-4 md:flex-row md:items-center">
            <div>
              <h2 className="font-black text-slate-900">
                Liste des sauvegardes
              </h2>
              <p className="text-sm text-slate-500">
                Historique des sauvegardes créées depuis l’Admin Central.
              </p>
            </div>

            <span className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-black uppercase text-emerald-700">
              {items.length} sauvegarde(s)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead>
                <tr className="border-b text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 font-black">ID</th>
                  <th className="px-4 py-3 font-black">Entreprise</th>
                  <th className="px-4 py-3 font-black">Cible</th>
<th className="px-4 py-3 font-black">Serveur</th>
                  <th className="px-4 py-3 font-black">Type</th>
                  <th className="px-4 py-3 font-black">Taille</th>
                  <th className="px-4 py-3 font-black">Date</th>
                  <th className="px-4 py-3 font-black">Statut</th>
                  <th className="px-4 py-3 font-black">Fichier</th>
                  <th className="px-4 py-3 font-black">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loadingPage && (
                  <tr>
                    <td colSpan={10} className="px-4 py-10 text-center font-bold text-slate-500">
                      Chargement des sauvegardes...
                    </td>
                  </tr>
                )}

                {!loadingPage && items.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-10 text-center font-bold text-slate-500">
                      Aucune sauvegarde trouvée.
                    </td>
                  </tr>
                )}

                {!loadingPage &&
                  items.map((x) => (
                    <tr key={x.id} className="border-b last:border-b-0 hover:bg-slate-50">
                      <td className="px-4 py-3 font-bold">{x.id}</td>
                      <td className="max-w-[220px] truncate px-4 py-3">
                        {x.entreprise || x.nomclient || '-'}
                      </td>
                      <td className="px-4 py-3">
  <Badge tone={x.ciblebackup === 'CLIENT' ? 'emerald' : 'slate'}>
    {x.ciblebackup || 'CENTRAL'}
  </Badge>
</td>

<td className="max-w-[280px] truncate px-4 py-3">
  {x.serverurl || 'Serveur central'}
</td>
                      <td className="px-4 py-3">
                        <Badge tone="blue">{x.typebackup || 'MANUEL'}</Badge>
                      </td>
                      <td className="px-4 py-3 font-bold">
                        {formatBackupSize(x.taillemo)}
                      </td>
                      <td className="px-4 py-3">
                        {formatDate(x.createdat)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={getStatutTone(x.statut)}>
                          {x.statut || '-'}
                        </Badge>
                      </td>
                      <td className="max-w-[260px] truncate px-4 py-3">
                        {x.nomfichier || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => telecharger(x)}
                            disabled={x.statut !== 'REUSSI'}
                            className="rounded-lg bg-blue-700 px-3 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Télécharger
                          </button>

                          <button
                            onClick={() => restaurer(x)}
                            disabled={x.statut !== 'REUSSI' || loadingAction}
                            className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Restaurer
                          </button>

                          <button
                            onClick={() => supprimer(x)}
                            disabled={loadingAction}
                            className="rounded-lg bg-red-600 px-3 py-2 text-xs font-black text-white disabled:opacity-40"
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
        </section>
      </div>
    </main>
  );
}

function StatCard({ title, value, tone }: any) {
  const styles: any = {
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-800',
    blue: 'border-blue-100 bg-blue-50 text-blue-800',
    red: 'border-red-100 bg-red-50 text-red-800',
    slate: 'border-slate-200 bg-white text-slate-900',
  };

  return (
    <div className={`rounded-[24px] border p-5 shadow-sm ${styles[tone] || styles.slate}`}>
      <p className="text-xs font-black uppercase tracking-wide opacity-70">
        {title}
      </p>
      <h2 className="mt-3 text-2xl font-black">
        {String(value ?? 0)}
      </h2>
    </div>
  );
}

function Badge({ children, tone }: any) {
  const styles: any = {
    emerald: 'bg-emerald-50 text-emerald-700',
    blue: 'bg-blue-50 text-blue-700',
    red: 'bg-red-50 text-red-700',
    amber: 'bg-amber-50 text-amber-700',
    slate: 'bg-slate-100 text-slate-700',
  };

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black uppercase ${styles[tone] || styles.slate}`}>
      {children}
    </span>
  );
}

function getStatutTone(statut?: string) {
  if (statut === 'REUSSI') return 'emerald';
  if (statut === 'ECHEC') return 'red';
  if (statut === 'EN_COURS') return 'amber';
  return 'slate';
}

function formatDate(date?: string | null) {
  if (!date) return '-';

  try {
    return new Date(date).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
  }

  function formatBackupSize(value: any) {
  const mo = Number(value);

  if (!Number.isFinite(mo) || mo <= 0) return '0 Ko';

  if (mo < 1) {
    return `${(mo * 1024).toFixed(2)} Ko`;
  }

  if (mo >= 1024) {
    return `${(mo / 1024).toFixed(2)} Go`;
  }

  return `${mo.toFixed(2)} Mo`;
}