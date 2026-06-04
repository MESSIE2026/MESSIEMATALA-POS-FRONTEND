'use client';

import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_CENTRAL_API || 'https://messiematala-pos-backend-production.up.railway.app';

export default function Page() {
  const [serveurs, setServeurs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  async function charger() {
    const [resServeurs, resStats] = await Promise.all([
      fetch(`${API}/serveurs-clients`),
      fetch(`${API}/serveurs-clients/status`),
    ]);

    setServeurs(await resServeurs.json());
    setStats(await resStats.json());
  }

  useEffect(() => {
    charger();
  }, []);

  return (
    <main className="min-h-screen bg-slate-100 p-8">

      <div className="space-y-6">

        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold">
            Serveurs Clients
          </h1>

          <p className="mt-2 text-slate-500">
            Supervision des serveurs de toutes les entreprises.
          </p>
        </div>

        {stats && (
          <div className="grid gap-4 md:grid-cols-6">

            <Card title="Total" value={stats.total} />
            <Card title="Actifs" value={stats.actifs} />
            <Card title="Inactifs" value={stats.inactifs} />

            <Card
              title="Statut Actif"
              value={stats.statut_actif}
            />

            <Card
              title="Désactivés"
              value={stats.statut_desactive}
            />

            <Card
              title="Non Vérifiés"
              value={stats.non_verifies}
            />
          </div>
        )}

        <div className="rounded-3xl bg-white overflow-hidden shadow-sm">

          <div className="border-b p-5">
            <h2 className="font-semibold">
              Liste des serveurs
            </h2>
          </div>

          <div className="overflow-auto">

            <table className="w-full text-sm">

              <thead className="bg-slate-50">
                <tr>
                  <Th>Client</Th>
                  <Th>Serveur</Th>
                  <Th>Plan</Th>
                  <Th>Statut</Th>
                  <Th>Actif</Th>
                  <Th>Dernière vérification</Th>
                </tr>
              </thead>

              <tbody>

                {serveurs.map((s) => (
                  <tr
                    key={s.idserveur}
                    className="border-t hover:bg-slate-50"
                  >
                    <Td>{s.nomclient}</Td>

                    <Td>{s.serverurl}</Td>

                    <Td>{s.plan}</Td>

                    <Td>{s.statut}</Td>

                    <Td>
                      <span
                        className={`rounded-full px-3 py-1 text-xs
                        ${
                          s.actif
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {s.actif ? 'ACTIF' : 'OFFLINE'}
                      </span>
                    </Td>

                    <Td>
                      {s.derniereverification
                        ? new Date(
                            s.derniereverification,
                          ).toLocaleString()
                        : '-'}
                    </Td>
                  </tr>
                ))}
              </tbody>

            </table>

          </div>
        </div>
      </div>
    </main>
  );
}

function Card({
  title,
  value,
}: {
  title: string;
  value: any;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <p className="text-slate-500">{title}</p>
      <h2 className="mt-2 text-3xl font-bold">{value}</h2>
    </div>
  );
}

function Th({ children }: any) {
  return (
    <th className="px-4 py-3 text-left font-semibold">
      {children}
    </th>
  );
}

function Td({ children }: any) {
  return (
    <td className="px-4 py-3">
      {children}
    </td>
  );
}