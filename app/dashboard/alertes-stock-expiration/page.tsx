'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarClock,
  Download,
  PackageX,
  RefreshCw,
  Search,
  Warehouse,
} from 'lucide-react';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://messiematala-pos-backend-production.up.railway.app';

type Lookup = {
  magasins: { idMagasin: number; nomMagasin: string }[];
  depots: { idDepot: number; nomDepot: string }[];
};

export default function Page() {
  const [tab, setTab] = useState<'stock' | 'expiration'>('stock');
  const [lookups, setLookups] = useState<Lookup>({ magasins: [], depots: [] });
  const [stock, setStock] = useState<any[]>([]);
  const [expiration, setExpiration] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const [idMagasin, setIdMagasin] = useState('0');
  const [idDepot, setIdDepot] = useState('0');
  const [maxJours, setMaxJours] = useState('365');
  const [search, setSearch] = useState('');
  const [inclureExpires, setInclureExpires] = useState(false);

  const [idEntreprise, setIdEntreprise] = useState('1');

useEffect(() => {
  setIdEntreprise(localStorage.getItem('ZAIRE_ID_ENTREPRISE') || '1');
}, []);

  const query = useMemo(() => {
    const p = new URLSearchParams();

    p.set('idEntreprise', idEntreprise);
    p.set('idMagasin', idMagasin);
    p.set('idDepot', idDepot);
    p.set('maxJours', maxJours);
    p.set('search', search.trim());
    p.set('inclureExpires', String(inclureExpires));

    return p.toString();
  }, [idEntreprise, idMagasin, idDepot, maxJours, search, inclureExpires]);

  async function getJson(url: string) {
  const r = await fetch(url);

  if (!r.ok) {
    throw new Error(await r.text());
  }

  return r.json();
}

async function charger() {
  setLoading(true);

  try {
    const [s, e, st] = await Promise.all([
      getJson(`${API_URL}/alertes-stock-expiration/stock?${query}`),
      getJson(`${API_URL}/alertes-stock-expiration/expiration?${query}`),
      getJson(`${API_URL}/alertes-stock-expiration/stats?${query}`),
    ]);

    setStock(Array.isArray(s) ? s : []);
    setExpiration(Array.isArray(e) ? e : []);
    setStats(st || {});
  } catch (error) {
    console.error('Erreur chargement alertes stock expiration:', error);
    alert('Erreur chargement alertes stock expiration.');
  } finally {
    setLoading(false);
  }
}

async function chargerLookups() {
  try {
    const l = await getJson(
      `${API_URL}/alertes-stock-expiration/lookups?idEntreprise=${idEntreprise}&idMagasin=${idMagasin}`,
    );

    setLookups({
      magasins: Array.isArray(l?.magasins) ? l.magasins : [],
      depots: Array.isArray(l?.depots) ? l.depots : [],
    });
  } catch (e) {
    console.error(e);
  }
}

useEffect(() => {
  charger();
}, [idEntreprise, idMagasin, idDepot, maxJours, inclureExpires, search]);

  useEffect(() => {
  chargerLookups();
}, [idEntreprise, idMagasin]);

  function ouvrirPdf() {
    const url =
      tab === 'stock'
        ? `${API_URL}/alertes-stock-expiration/pdf-stock?${query}`
        : `${API_URL}/alertes-stock-expiration/pdf-expiration?${query}`;

    window.open(url, '_blank');
  }

  const rows = tab === 'stock' ? stock : expiration;

  return (
    <main className="min-h-screen bg-slate-100 p-3 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-4">
        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-black text-slate-900">
                <AlertTriangle className="text-amber-600" />
                Alertes Stock & Expiration
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Stock sous seuil, ruptures, lots expirés et produits proches
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
                PDF onglet
              </button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Card
            title="Sous seuil"
            value={stats.stockSousSeuil || 0}
            icon={<Warehouse size={22} />}
          />
          <Card
            title="Ruptures"
            value={stats.ruptures || 0}
            icon={<PackageX size={22} />}
          />
          <Card
            title="Expirations"
            value={stats.expirations || 0}
            icon={<CalendarClock size={22} />}
          />
          <Card
            title="30 jours"
            value={stats.expiration30 || 0}
            icon={<AlertTriangle size={22} />}
          />
          <Card
            title="Expirés"
            value={stats.expires || 0}
            icon={<AlertTriangle size={22} />}
          />
        </section>

        <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="grid gap-3 md:grid-cols-5">
            <select
  value={idMagasin}
  onChange={(e) => {
    setIdMagasin(e.target.value);
    setIdDepot('0');
  }}
  className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
>
              <option value="0">Tous magasins</option>
              {lookups.magasins.map((m) => (
                <option key={m.idMagasin} value={m.idMagasin}>
                  {m.nomMagasin}
                </option>
              ))}
            </select>

            <select
              value={idDepot}
              onChange={(e) => setIdDepot(e.target.value)}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="0">Tous dépôts</option>
              {lookups.depots.map((d) => (
                <option key={d.idDepot} value={d.idDepot}>
                  {d.nomDepot}
                </option>
              ))}
            </select>

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

            <label className="flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={inclureExpires}
                onChange={(e) => setInclureExpires(e.target.checked)}
              />
              Inclure expirés
            </label>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search
                  size={16}
                  className="absolute left-3 top-3 text-slate-400"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Recherche..."
                  className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-sm"
                />
              </div>

              <button
                onClick={charger}
                disabled={loading}
                className="rounded-xl bg-green-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                OK
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setTab('stock')}
              className={`flex-1 px-4 py-3 text-sm font-black ${
                tab === 'stock' ? 'text-green-700' : 'text-slate-500'
              }`}
            >
              Stock sous seuil
            </button>

            <button
              onClick={() => setTab('expiration')}
              className={`flex-1 px-4 py-3 text-sm font-black ${
                tab === 'expiration' ? 'text-green-700' : 'text-slate-500'
              }`}
            >
              Expirations 90/60/30
            </button>
          </div>

          <div className="overflow-x-auto">
            {tab === 'stock' ? (
              <TableStock rows={rows} />
            ) : (
              <TableExpiration rows={rows} />
            )}

            {!loading && rows.length === 0 && (
              <div className="p-8 text-center text-sm text-slate-500">
                Aucune alerte trouvée.
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

function TableStock({ rows }: { rows: any[] }) {
  return (
    <table className="min-w-full text-sm">
      <thead className="bg-slate-50 text-left text-slate-600">
        <tr>
          <Th>Dépôt</Th>
          <Th>Référence</Th>
          <Th>Produit</Th>
          <Th>Stock</Th>
          <Th>Seuil</Th>
          <Th>Alerte</Th>
        </tr>
      </thead>

      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-t">
            <Td>{r.depot || '-'}</Td>
            <Td>{r.reference || '-'}</Td>
            <Td>{r.produit || '-'}</Td>
            <Td>{Number(r.stockActuel || 0).toLocaleString('fr-FR')}</Td>
            <Td>{Number(r.seuilMin || 0).toLocaleString('fr-FR')}</Td>
            <Td>
              <Badge danger={r.niveauAlerte === 'RUPTURE'}>
                {r.niveauAlerte || '-'}
              </Badge>
            </Td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TableExpiration({ rows }: { rows: any[] }) {
  return (
    <table className="min-w-full text-sm">
      <thead className="bg-slate-50 text-left text-slate-600">
        <tr>
          <Th>Dépôt</Th>
          <Th>Référence</Th>
          <Th>Produit</Th>
          <Th>Lot</Th>
          <Th>Expiration</Th>
          <Th>Jours</Th>
          <Th>Qté</Th>
          <Th>Alerte</Th>
        </tr>
      </thead>

      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-t">
            <Td>{r.depot || '-'}</Td>
            <Td>{r.reference || '-'}</Td>
            <Td>{r.produit || '-'}</Td>
            <Td>{r.lotNumero || '-'}</Td>
            <Td>
              {r.dateExpiration
                ? new Date(r.dateExpiration).toLocaleDateString('fr-FR')
                : '-'}
            </Td>
            <Td>{r.joursRestants ?? '-'}</Td>
            <Td>{Number(r.quantite || 0).toLocaleString('fr-FR')}</Td>
            <Td>
              <Badge
                danger={
                  r.niveauAlerte === 'EXPIRÉ' ||
                  r.niveauAlerte === '30 JOURS'
                }
              >
                {r.niveauAlerte || '-'}
              </Badge>
            </Td>
          </tr>
        ))}
      </tbody>
    </table>
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
  danger,
}: {
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-black ${
        danger ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
      }`}
    >
      {children}
    </span>
  );
}