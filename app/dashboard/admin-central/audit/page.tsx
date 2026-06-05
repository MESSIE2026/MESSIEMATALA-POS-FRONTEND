'use client';

import { useEffect, useState } from 'react';

const API =
  process.env.NEXT_PUBLIC_CENTRAL_API ||
  'https://messiematala-pos-backend-production.up.railway.app';

export default function AuditPage() {
  const [audits, setAudits] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [messageInfo, setMessageInfo] = useState('');

  async function charger() {
    try {
      const [resList, resStats] = await Promise.all([
        fetch(`${API}/audit`, { cache: 'no-store' }),
        fetch(`${API}/audit/stats`, { cache: 'no-store' }),
      ]);

      const dataList = await resList.json();
      const dataStats = await resStats.json();

      setAudits(Array.isArray(dataList) ? dataList : []);
      setStats(dataStats || null);
    } catch (error: any) {
      setMessageInfo(error?.message || 'Impossible de charger audit.');
    }
  }

  useEffect(() => {
    charger();
  }, []);

  return (
    <main className="min-h-screen bg-[#f4f1e8] p-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-black text-emerald-950">
            Audit système
          </h1>
          <p className="mt-2 text-slate-500">
            Historique des actions importantes du système central.
          </p>

          {messageInfo && (
            <div className="mt-5 rounded-xl bg-red-50 p-4 font-bold text-red-700">
              {messageInfo}
            </div>
          )}
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Card title="Actions enregistrées" value={stats?.total} />
        </section>

        <section className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="border-b p-5">
            <h2 className="font-black">Journal audit</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="p-3">Action</th>
                  <th className="p-3">Module</th>
                  <th className="p-3">Utilisateur</th>
                  <th className="p-3">Message</th>
                  <th className="p-3">IP</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>

              <tbody>
                {audits.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      Aucun audit enregistré.
                    </td>
                  </tr>
                )}

                {audits.map((a, i) => (
                  <tr key={a.idaudit || i} className="border-t">
                    <td className="p-3 font-bold">{a.action || '-'}</td>
                    <td className="p-3">{a.module || '-'}</td>
                    <td className="p-3">{a.utilisateur || '-'}</td>
                    <td className="p-3">{a.message || '-'}</td>
                    <td className="p-3">{a.ipadresse || '-'}</td>
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
        </section>
      </div>
    </main>
  );
}

function Card({ title, value }: any) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <p className="text-sm font-bold text-slate-500">{title}</p>
      <h2 className="mt-2 text-3xl font-black">{value ?? 0}</h2>
    </div>
  );
}