'use client';

import { useEffect, useMemo, useState } from 'react';

const API =
  process.env.NEXT_PUBLIC_CENTRAL_API ||
  'https://messiematala-pos-backend-production.up.railway.app';

export default function AuditPage() {
  const [audits, setAudits] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [messageInfo, setMessageInfo] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function charger() {
    try {
      setLoading(true);
      setMessageInfo('');

      const url = search.trim()
        ? `${API}/audit?search=${encodeURIComponent(search.trim())}`
        : `${API}/audit`;

      const [resList, resStats] = await Promise.all([
        fetch(url, { cache: 'no-store' }),
        fetch(`${API}/audit/stats`, { cache: 'no-store' }),
      ]);

      const dataList = await resList.json();
      const dataStats = await resStats.json();

      setAudits(Array.isArray(dataList) ? dataList : []);
      setStats(dataStats || null);
    } catch (error: any) {
      setMessageInfo(error?.message || 'Impossible de charger audit.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    charger();
  }, []);

  const derniers = useMemo(() => audits.slice(0, 5), [audits]);

  return (
    <main className="min-h-screen bg-[#f4f1e8] p-6 text-slate-900">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <section className="overflow-hidden rounded-[28px] border border-emerald-950/10 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-950 p-7 text-white">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.35em] text-emerald-200">
                  Admin Central / Sécurité
                </p>
                <h1 className="mt-3 text-3xl font-black tracking-tight">
                  Audit système central
                </h1>
                <p className="mt-2 max-w-3xl text-sm text-emerald-50/80">
                  Surveillance des connexions, validations, modifications,
                  suppressions, synchronisations et activités critiques.
                </p>
              </div>

              <button
                onClick={charger}
                className="rounded-xl bg-white px-5 py-3 text-sm font-black text-emerald-950 shadow-sm hover:bg-emerald-50"
              >
                {loading ? 'Chargement...' : 'Actualiser'}
              </button>
            </div>
          </div>

          <div className="grid gap-4 p-5 md:grid-cols-4 xl:grid-cols-7">
            <Card title="Total" value={stats?.total} />
            <Card title="Succès" value={stats?.succes} />
            <Card title="Échecs" value={stats?.echecs} />
            <Card title="Connexions" value={stats?.connexions} />
            <Card title="Modifications" value={stats?.modifications} />
            <Card title="Suppressions" value={stats?.suppressions} />
            <Card title="Non synchronisés" value={stats?.nonsynchronises} />
          </div>
        </section>

        {messageInfo && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 font-bold text-red-700">
            {messageInfo}
          </div>
        )}

        <section className="grid gap-6 xl:grid-cols-[1fr_420px]">
          <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-200 bg-white p-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-950">
                  Journal d’activité
                </h2>
                <p className="text-sm text-slate-500">
                  Cliquez sur une ligne pour voir les détails complets.
                </p>
              </div>

              <div className="flex gap-2">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') charger();
                  }}
                  placeholder="Rechercher action, module, utilisateur..."
                  className="w-full min-w-[320px] rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-emerald-700"
                />
                <button
                  onClick={charger}
                  className="rounded-xl bg-emerald-950 px-5 py-3 text-sm font-black text-white hover:bg-emerald-900"
                >
                  Filtrer
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1500px] text-left text-sm">
                <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="p-3">Statut</th>
                    <th className="p-3">Action</th>
                    <th className="p-3">Module</th>
                    <th className="p-3">Utilisateur</th>
                    <th className="p-3">Entreprise</th>
                    <th className="p-3">Magasin</th>
                    <th className="p-3">Synchronisation</th>
                    <th className="p-3">IP</th>
                    <th className="p-3">Date</th>
                  </tr>
                </thead>

                <tbody>
                  {audits.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-10 text-center text-slate-500">
                        Aucun audit enregistré.
                      </td>
                    </tr>
                  )}

                  {audits.map((a, i) => (
                    <tr
                      key={a.idaudit || i}
                      onClick={() => setSelected(a)}
                      className="cursor-pointer border-t hover:bg-emerald-50/60"
                    >
                      <td className="p-3">
                        <Badge
                          label={a.resultat || 'SUCCES'}
                          type={a.resultat === 'ECHEC' ? 'danger' : 'success'}
                        />
                      </td>
                      <td className="p-3 font-black text-slate-950">
                        {a.action || '-'}
                        <div className="text-xs font-semibold text-slate-400">
                          #{a.idaudit}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold">{a.module || '-'}</div>
                        <div className="text-xs text-slate-400">
                          {a.sousmodule || '-'}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold">{a.utilisateur || '-'}</div>
                        <div className="text-xs text-slate-400">
                          {a.roleutilisateur || '-'}
                        </div>
                      </td>
                      <td className="p-3">{a.nomentreprise || '-'}</td>
                      <td className="p-3">{a.nommagasin || '-'}</td>
                      <td className="p-3">
                        <Badge
                          label={a.synced ? 'SYNCED' : a.syncstatus || 'PENDING'}
                          type={a.synced ? 'success' : 'warning'}
                        />
                      </td>
                      <td className="p-3 font-mono text-xs">
                        {a.ipadresse || '-'}
                      </td>
                      <td className="p-3">
                        {a.createdat
                          ? new Date(a.createdat).toLocaleString('fr-FR')
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="space-y-6">
            <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-black text-slate-950">Détails audit</h2>

              {!selected ? (
                <p className="mt-4 text-sm text-slate-500">
                  Sélectionnez une ligne du journal pour afficher les détails.
                </p>
              ) : (
                <div className="mt-5 space-y-3 text-sm">
                  <Detail label="ID" value={selected.idaudit} />
                  <Detail label="UUID Sync" value={selected.uuidsync} />
                  <Detail label="Action" value={selected.action} />
                  <Detail label="Niveau" value={selected.niveau} />
                  <Detail label="Module" value={selected.module} />
                  <Detail label="Table" value={selected.tableconcernee} />
                  <Detail label="Enregistrement" value={selected.idenregistrement} />
                  <Detail label="Utilisateur" value={selected.utilisateur} />
                  <Detail label="Rôle" value={selected.roleutilisateur} />
                  <Detail label="Entreprise" value={selected.nomentreprise} />
                  <Detail label="Magasin" value={selected.nommagasin} />
                  <Detail label="Dépôt" value={selected.nomdepot} />
                  <Detail label="IP" value={selected.ipadresse} />
                  <Detail label="Système" value={selected.systeme} />
                  <Detail label="Navigateur" value={selected.navigateur} />
                  <Detail label="Device ID" value={selected.deviceid} />
                  <Detail label="Message" value={selected.message} />
                </div>
              )}
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-black text-slate-950">Dernières activités</h2>

              <div className="mt-4 space-y-3">
                {derniers.map((a) => (
                  <div
                    key={a.idaudit}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-black text-slate-900">{a.action}</p>
                      <Badge
                        label={a.resultat || 'SUCCES'}
                        type={a.resultat === 'ECHEC' ? 'danger' : 'success'}
                      />
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {a.utilisateur || 'SYSTEME'} · {a.module || '-'}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}

function Card({ title, value }: any) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">
        {title}
      </p>
      <h2 className="mt-2 text-2xl font-black text-emerald-950">
        {value ?? 0}
      </h2>
    </div>
  );
}

function Badge({ label, type }: any) {
  const cls =
    type === 'danger'
      ? 'bg-red-100 text-red-700 border-red-200'
      : type === 'warning'
        ? 'bg-amber-100 text-amber-800 border-amber-200'
        : 'bg-emerald-100 text-emerald-800 border-emerald-200';

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${cls}`}>
      {label}
    </span>
  );
}

function Detail({ label, value }: any) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-black uppercase text-slate-400">{label}</p>
      <p className="mt-1 break-words font-bold text-slate-800">
        {value ?? '-'}
      </p>
    </div>
  );
}