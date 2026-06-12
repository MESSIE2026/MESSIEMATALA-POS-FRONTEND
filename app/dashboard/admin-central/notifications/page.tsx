'use client';

import { useEffect, useState } from 'react';

const API =
  process.env.NEXT_PUBLIC_CENTRAL_API ||
  'https://messiematala-pos-backend-production.up.railway.app';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [messageInfo, setMessageInfo] = useState('');

  const [form, setForm] = useState({
    titre: '',
    message: '',
    type: 'INFO',
    niveau: 'INFO',
  });

  async function charger() {
    try {
      const [resList, resStats] = await Promise.all([
        fetch(`${API}/notifications`, { cache: 'no-store' }),
        fetch(`${API}/notifications/stats`, { cache: 'no-store' }),
      ]);

      const dataList = await resList.json();
      const dataStats = await resStats.json();

      setNotifications(Array.isArray(dataList) ? dataList : []);
      setStats(dataStats || null);
    } catch (error: any) {
      setMessageInfo(error?.message || 'Impossible de charger les notifications.');
    }
  }

  async function creer() {
    setMessageInfo('');

    if (!form.titre.trim()) {
      setMessageInfo('Titre obligatoire.');
      return;
    }

    const res = await fetch(`${API}/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessageInfo(data?.message || 'Création impossible.');
      return;
    }

    setForm({ titre: '', message: '', type: 'INFO', niveau: 'INFO' });
    setMessageInfo('Notification créée.');
    await charger();
  }

  async function marquerLu(id: number) {
    await fetch(`${API}/notifications/${id}/lu`, {
      method: 'PATCH',
    });

    await charger();
  }

  async function toutLu() {
    await fetch(`${API}/notifications/tout-lu`, {
      method: 'PATCH',
    });

    await charger();
  }

  useEffect(() => {
    charger();
  }, []);

  return (
    <main className="min-h-screen bg-[#f4f1e8] p-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-black text-emerald-950">
            Notifications
          </h1>
          <p className="mt-2 text-slate-500">
            Notifications globales du système central.
          </p>

          {messageInfo && (
            <div className="mt-5 rounded-xl bg-blue-50 p-4 font-bold text-blue-700">
              {messageInfo}
            </div>
          )}
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Card title="Total" value={stats?.total} />
          <Card title="Non lues" value={stats?.non_lues} />
          <Card title="Lues" value={stats?.lues} />
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black">Nouvelle notification</h2>

          <div className="mt-5 grid gap-4 md:grid-cols-5">
            <input
              value={form.titre}
              onChange={(e) => setForm({ ...form, titre: e.target.value })}
              placeholder="Titre"
              className="rounded-xl border px-4 py-3"
            />

            <input
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Message"
              className="rounded-xl border px-4 py-3 md:col-span-2"
            />

            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="rounded-xl border px-4 py-3"
            >
              <option value="INFO">INFO</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="WARNING">WARNING</option>
              <option value="ERROR">ERROR</option>
              <option value="LICENCE">LICENCE</option>
              <option value="SERVEUR">SERVEUR</option>
              <option value="COMPTE">COMPTE</option>
              <option value="BACKUP">BACKUP</option>
            </select>

            <select
              value={form.niveau}
              onChange={(e) => setForm({ ...form, niveau: e.target.value })}
              className="rounded-xl border px-4 py-3"
            >
              <option value="INFO">INFO</option>
              <option value="WARNING">WARNING</option>
              <option value="ERROR">ERROR</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={creer}
              className="rounded-xl bg-emerald-800 px-6 py-3 font-black text-white"
            >
              Créer notification
            </button>

            <button
              onClick={toutLu}
              className="rounded-xl bg-slate-800 px-6 py-3 font-black text-white"
            >
              Tout marquer lu
            </button>
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="border-b p-5">
            <h2 className="font-black">Liste des notifications</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="p-3">Titre</th>
                  <th className="p-3">Message</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Niveau</th>
                  <th className="p-3">Lu</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>

              <tbody>
                {notifications.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      Aucune notification.
                    </td>
                  </tr>
                )}

                {notifications.map((n, i) => (
                  <tr key={n.idnotification || i} className="border-t">
                    <td className="p-3 font-bold">{n.titre || '-'}</td>
                    <td className="p-3">{n.message || '-'}</td>
                    <td className="p-3">{n.type || '-'}</td>
                    <td className="p-3">
                      <span
                        className={
                          n.niveau === 'ERROR' || n.niveau === 'CRITICAL'
                            ? 'rounded bg-red-100 px-2 py-1 font-bold text-red-700'
                            : n.niveau === 'WARNING'
                            ? 'rounded bg-yellow-100 px-2 py-1 font-bold text-yellow-700'
                            : 'rounded bg-blue-100 px-2 py-1 font-bold text-blue-700'
                        }
                      >
                        {n.niveau || 'INFO'}
                      </span>
                    </td>
                    <td className="p-3">{n.lu ? 'Oui' : 'Non'}</td>
                    <td className="p-3">
                      {n.createdat
                        ? new Date(n.createdat).toLocaleString('fr-FR')
                        : '-'}
                    </td>
                    <td className="p-3">
                      {!n.lu && (
                        <button
                          onClick={() => marquerLu(n.idnotification)}
                          className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white"
                        >
                          Marquer lu
                        </button>
                      )}
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