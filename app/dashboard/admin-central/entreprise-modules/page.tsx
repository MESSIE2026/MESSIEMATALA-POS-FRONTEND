'use client';

import { useEffect, useMemo, useState } from 'react';
import { getClientApi } from '@/lib/api-config';

type Permission = {
  idpermission: number;
  code: string;
  nom: string;
  categorie: string;
  description?: string;
  autorise?: boolean;
};

export default function EntrepriseModulesPage() {
  const API = getClientApi();

  const [identreprise, setIdentreprise] = useState(1);
  const [items, setItems] = useState<Permission[]>([]);
  const [search, setSearch] = useState('');
  const [categorie, setCategorie] = useState('TOUTES');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function charger() {
    if (!API) return;
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch(`${API}/entreprise-modules/${identreprise}`);
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setMessage('Erreur chargement modules entreprise.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    charger();
  }, [identreprise]);

  const categories = useMemo(() => {
    return ['TOUTES', ...Array.from(new Set(items.map((x) => x.categorie || 'MODULES')))];
  }, [items]);

  const filtered = items.filter((x) => {
    const okCat = categorie === 'TOUTES' || x.categorie === categorie;
    const q = search.toLowerCase();
    const okSearch =
      !q ||
      x.nom?.toLowerCase().includes(q) ||
      x.code?.toLowerCase().includes(q) ||
      x.categorie?.toLowerCase().includes(q);

    return okCat && okSearch;
  });

  async function changerAutorisation(item: Permission, value: boolean) {
    if (!API) return;

    const endpoint = value ? 'autoriser' : 'retirer';

    try {
      const res = await fetch(`${API}/entreprise-modules/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identreprise,
          autorisepar: 12,
          idpermissions: [item.idpermission],
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data?.message || 'Action impossible.');
        return;
      }

      setItems((prev) =>
        prev.map((p) =>
          p.idpermission === item.idpermission ? { ...p, autorise: value } : p,
        ),
      );

      setMessage(value ? 'Module autorisé.' : 'Module retiré.');
    } catch {
      setMessage('Erreur réseau.');
    }
  }

  const totalAutorises = items.filter((x) => x.autorise).length;

  return (
    <main className="min-h-screen bg-[#f4f1e8] p-6 text-slate-900">
      <section className="mx-auto max-w-7xl rounded-2xl border border-emerald-900/15 bg-white shadow-xl">
        <div className="border-b border-emerald-900/10 bg-emerald-950 px-6 py-5 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-emerald-100">
            Admin Central · Programmeur
          </p>
          <h1 className="mt-2 text-2xl font-black">
            Autorisation des modules par entreprise
          </h1>
          <p className="mt-1 text-sm text-emerald-50">
            Le Programmeur active seulement les modules payés par le client.
          </p>
        </div>

        <div className="grid gap-4 border-b border-slate-200 bg-slate-50 p-5 md:grid-cols-4">
          <div>
            <label className="text-xs font-black uppercase tracking-widest text-slate-500">
              Entreprise ID
            </label>
            <input
              type="number"
              value={identreprise}
              onChange={(e) => setIdentreprise(Number(e.target.value || 1))}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold outline-none focus:border-emerald-900"
            />
          </div>

          <div>
            <label className="text-xs font-black uppercase tracking-widest text-slate-500">
              Catégorie
            </label>
            <select
              value={categorie}
              onChange={(e) => setCategorie(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold outline-none focus:border-emerald-900"
            >
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-500">
              Recherche
            </label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher module, code, catégorie..."
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-900"
            />
          </div>
        </div>

        <div className="grid gap-4 border-b border-slate-200 p-5 md:grid-cols-3">
          <div className="rounded-xl bg-emerald-950 p-4 text-white">
            <p className="text-xs uppercase tracking-widest text-emerald-100">Total permissions</p>
            <p className="mt-1 text-3xl font-black">{items.length}</p>
          </div>
          <div className="rounded-xl bg-slate-900 p-4 text-white">
            <p className="text-xs uppercase tracking-widest text-slate-300">Autorisées</p>
            <p className="mt-1 text-3xl font-black">{totalAutorises}</p>
          </div>
          <div className="rounded-xl bg-[#d8c7a1] p-4 text-emerald-950">
            <p className="text-xs uppercase tracking-widest">Affichées</p>
            <p className="mt-1 text-3xl font-black">{filtered.length}</p>
          </div>
        </div>

        {message && (
          <div className="mx-5 mt-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-950">
            {message}
          </div>
        )}

        <div className="p-5">
          {loading ? (
            <div className="py-10 text-center font-bold text-slate-500">
              Chargement...
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-slate-100 text-left text-xs uppercase tracking-widest text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Module</th>
                    <th className="px-4 py-3">Catégorie</th>
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3 text-center">Statut</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((item) => (
                    <tr key={item.idpermission} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-bold">{item.nom}</td>
                      <td className="px-4 py-3">{item.categorie}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{item.code}</td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black ${
                            item.autorise
                              ? 'bg-emerald-100 text-emerald-900'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {item.autorise ? 'AUTORISÉ' : 'NON AUTORISÉ'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => changerAutorisation(item, !item.autorise)}
                          className={`rounded-lg px-4 py-2 text-xs font-black uppercase ${
                            item.autorise
                              ? 'bg-red-50 text-red-700 hover:bg-red-100'
                              : 'bg-emerald-950 text-white hover:bg-emerald-900'
                          }`}
                        >
                          {item.autorise ? 'Retirer' : 'Autoriser'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}