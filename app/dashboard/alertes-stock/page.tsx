'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  CalendarClock,
  Download,
  PackageX,
  RefreshCw,
  Search,
  ShieldAlert,
  Warehouse,
} from 'lucide-react';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://messiematala-pos-backend-production.up.railway.app';

type NotificationStock = {
  type: string;
  niveau: 'CRITIQUE' | 'ATTENTION' | 'INFO' | string;
  idProduit: number;
  produit: string;
  reference: string;
  depot: string;
  quantite: number;
  dateExpiration?: string | null;
  joursRestants?: number | null;
  message: string;
};

type Stats = {
  ruptures: number;
  sousSeuil: number;
  expires: number;
  prochesExpiration: number;
  totalAlertes: number;
};

export default function Page() {
  const [notifications, setNotifications] = useState<NotificationStock[]>([]);
  const [stats, setStats] = useState<Stats>({
    ruptures: 0,
    sousSeuil: 0,
    expires: 0,
    prochesExpiration: 0,
    totalAlertes: 0,
  });

  const [search, setSearch] = useState('');
  const [maxJours, setMaxJours] = useState('365');
  const [niveau, setNiveau] = useState('TOUS');
  const [loading, setLoading] = useState(false);

  const [idEntreprise, setIdEntreprise] = useState('1');
const [idMagasin, setIdMagasin] = useState('0');

useEffect(() => {
  setIdEntreprise(localStorage.getItem('ZAIRE_ID_ENTREPRISE') || '1');
  setIdMagasin(localStorage.getItem('ZAIRE_ID_MAGASIN') || '0');
}, []);

  const query = useMemo(() => {
    const p = new URLSearchParams();
    p.set('idEntreprise', idEntreprise);
    p.set('idMagasin', idMagasin);
    p.set('idDepot', '0');
    p.set('maxJours', maxJours);
    p.set('search', search.trim());
    p.set('niveau', niveau);
    return p.toString();
  }, [idEntreprise, idMagasin, maxJours, search, niveau]);

  async function charger() {
    setLoading(true);

    try {
     const [s, n] = await Promise.all([
  getJson(`${API_URL}/alertes-stock/stats?${query}`),
  getJson(`${API_URL}/alertes-stock/notifications?${query}`),
]);

      setStats({
        ruptures: Number(s?.ruptures || 0),
        sousSeuil: Number(s?.sousSeuil || 0),
        expires: Number(s?.expires || 0),
        prochesExpiration: Number(s?.prochesExpiration || 0),
        totalAlertes: Number(s?.totalAlertes || 0),
      });

      setNotifications(Array.isArray(n) ? n : []);
    } catch (e) {
      console.error(e);
      alert('Erreur chargement centre de notifications stock.');
    } finally {
      setLoading(false);
    }
  }

 useEffect(() => {
  charger();
}, [idEntreprise, idMagasin, maxJours, niveau]);

  function ouvrirPdf() {
    window.open(`${API_URL}/alertes-stock/pdf?${query}`, '_blank');
  }

  async function getJson(url: string) {
  const r = await fetch(url);

  if (!r.ok) {
    throw new Error(await r.text());
  }

  return r.json();
}

  const lignesFiltrees =
    niveau === 'TOUS'
      ? notifications
      : notifications.filter((x) => x.niveau === niveau);

  return (
    <main className="min-h-screen bg-slate-100 p-3 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-4">
        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-black text-slate-900">
                <Bell className="text-green-700" />
                Centre de notifications stock
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Ruptures, produits sous seuil, lots expirés et produits proches
                expiration.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={charger}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                <RefreshCw size={16} />
                {loading ? 'Chargement...' : 'Rafraîchir'}
              </button>

              <button
                onClick={ouvrirPdf}
                className="inline-flex items-center gap-2 rounded-xl bg-red-700 px-4 py-2 text-sm font-bold text-white"
              >
                <Download size={16} />
                PDF notifications
              </button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Card
            title="Total alertes"
            value={stats.totalAlertes}
            icon={<Bell size={22} />}
          />
          <Card
            title="Ruptures"
            value={stats.ruptures}
            icon={<PackageX size={22} />}
          />
          <Card
            title="Sous seuil"
            value={stats.sousSeuil}
            icon={<Warehouse size={22} />}
          />
          <Card
            title="Expirés"
            value={stats.expires}
            icon={<ShieldAlert size={22} />}
          />
          <Card
            title="Proches expiration"
            value={stats.prochesExpiration}
            icon={<CalendarClock size={22} />}
          />
        </section>

        <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="grid gap-3 md:grid-cols-4">
            <select
              value={maxJours}
              onChange={(e) => setMaxJours(e.target.value)}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="30">30 jours</option>
              <option value="60">60 jours</option>
              <option value="90">90 jours</option>
              <option value="365">365 jours</option>
            </select>

            <select
              value={niveau}
              onChange={(e) => setNiveau(e.target.value)}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="TOUS">Tous niveaux</option>
              <option value="CRITIQUE">Critique</option>
              <option value="ATTENTION">Attention</option>
              <option value="INFO">Info</option>
            </select>

            <div className="relative md:col-span-2">
              <Search
                size={16}
                className="absolute left-3 top-3 text-slate-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Recherche produit, référence, dépôt, message..."
                className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-sm"
              />
            </div>
          </div>

          <div className="mt-3 flex justify-end">
            <button
              onClick={charger}
              disabled={loading}
              className="rounded-xl bg-green-700 px-5 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              Rechercher
            </button>
          </div>
        </section>

        <section className="rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="text-sm font-black text-slate-700">
              Notifications actives
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <Th>Niveau</Th>
                  <Th>Type</Th>
                  <Th>Produit</Th>
                  <Th>Référence</Th>
                  <Th>Dépôt</Th>
                  <Th>Qté</Th>
                  <Th>Expiration</Th>
                  <Th>Jours</Th>
                  <Th>Message</Th>
                </tr>
              </thead>

              <tbody>
                {lignesFiltrees.map((n, i) => (
                  <tr key={`${n.type}-${n.idProduit}-${i}`} className="border-t">
                    <Td>
                      <Badge niveau={n.niveau}>{n.niveau}</Badge>
                    </Td>
                    <Td>{n.type || '-'}</Td>
                    <Td>{n.produit || '-'}</Td>
                    <Td>{n.reference || '-'}</Td>
                    <Td>{n.depot || '-'}</Td>
                    <Td>{Number(n.quantite || 0).toLocaleString('fr-FR')}</Td>
                    <Td>
                      {n.dateExpiration
                        ? new Date(n.dateExpiration).toLocaleDateString(
                            'fr-FR',
                          )
                        : '-'}
                    </Td>
                    <Td>{n.joursRestants ?? '-'}</Td>
                    <Td>{n.message || '-'}</Td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!loading && lignesFiltrees.length === 0 && (
              <div className="p-8 text-center text-sm text-slate-500">
                Aucune notification trouvée.
              </div>
            )}

            {loading && (
              <div className="p-8 text-center text-sm font-bold text-slate-500">
                Chargement...
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function Card({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-slate-500">{title}</p>
        <div className="text-green-700">{icon}</div>
      </div>
      <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="whitespace-nowrap px-4 py-3 font-black">{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="whitespace-nowrap px-4 py-3">{children}</td>;
}

function Badge({
  children,
  niveau,
}: {
  children: React.ReactNode;
  niveau: string;
}) {
  const cls =
    niveau === 'CRITIQUE'
      ? 'bg-red-100 text-red-700'
      : niveau === 'ATTENTION'
        ? 'bg-amber-100 text-amber-700'
        : 'bg-blue-100 text-blue-700';

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-black ${cls}`}>
      {children}
    </span>
  );
}