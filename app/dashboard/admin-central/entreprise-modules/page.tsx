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

type GroupeCategorie = {
  categorie: string;
  total: number;
  autorisees: number;
  autorise: boolean;
  partiel: boolean;
  idpermissions: number[];
};

export default function EntrepriseModulesPage() {
  const [identreprise, setIdentreprise] = useState(1);
  const [items, setItems] = useState<Permission[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState('');
  const [message, setMessage] = useState('');

  const API =
    getClientApi() ||
    (typeof window !== 'undefined'
      ? localStorage.getItem('ZAIRE_API_URL')
      : '') ||
    'https://messiematala-pos-backend-production.up.railway.app';

  async function charger() {
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

  const groupes = useMemo<GroupeCategorie[]>(() => {
    const categories = Array.from(
      new Set(items.map((x) => x.categorie || 'MODULES')),
    ).sort();

    return categories.map((categorie) => {
      const permissionsCategorie = items.filter(
        (x) => (x.categorie || 'MODULES') === categorie,
      );

      const autorisees = permissionsCategorie.filter((x) => x.autorise).length;
      const total = permissionsCategorie.length;

      return {
        categorie,
        total,
        autorisees,
        autorise: total > 0 && autorisees === total,
        partiel: autorisees > 0 && autorisees < total,
        idpermissions: permissionsCategorie.map((x) => x.idpermission),
      };
    });
  }, [items]);

  const filteredGroupes = groupes.filter((g) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return g.categorie.toLowerCase().includes(q);
  });

  async function changerCategorie(groupe: GroupeCategorie, value: boolean) {
    const endpoint = value ? 'autoriser' : 'retirer';

    setActionLoading(groupe.categorie);
    setMessage('');

    try {
      const res = await fetch(`${API}/entreprise-modules/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identreprise,
          autorisepar: 12,
          idpermissions: groupe.idpermissions,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data?.message || 'Action impossible.');
        return;
      }

      setItems((prev) =>
        prev.map((p) =>
          groupe.idpermissions.includes(p.idpermission)
            ? { ...p, autorise: value }
            : p,
        ),
      );

      setMessage(
        value
          ? `Catégorie "${groupe.categorie}" activée.`
          : `Catégorie "${groupe.categorie}" désactivée.`,
      );
    } catch {
      setMessage('Erreur réseau.');
    } finally {
      setActionLoading('');
    }
  }

  const totalPermissions = items.length;
  const totalAutorisees = items.filter((x) => x.autorise).length;
  const totalCategories = groupes.length;
  const categoriesActives = groupes.filter((x) => x.autorise).length;

  return (
    <main className="min-h-screen bg-[#f4f1e8] p-6 text-slate-900">
      <section className="mx-auto max-w-7xl overflow-hidden rounded-2xl border border-emerald-900/15 bg-white shadow-xl">
        <div className="border-b border-emerald-900/10 bg-emerald-950 px-6 py-5 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-emerald-100">
            Admin Central · Programmeur
          </p>

          <h1 className="mt-2 text-2xl font-black">
            Modules autorisés par entreprise
          </h1>

          <p className="mt-1 text-sm text-emerald-50">
            Le Programmeur active les catégories de modules payées par le client.
            Le SuperAdmin donnera ensuite les permissions détaillées.
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

          <div className="md:col-span-3">
            <label className="text-xs font-black uppercase tracking-widest text-slate-500">
              Recherche catégorie
            </label>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Exemple : Vente, Stock, Caisse, RH, Sécurité..."
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-900"
            />
          </div>
        </div>

        <div className="grid gap-4 border-b border-slate-200 p-5 md:grid-cols-4">
          <div className="rounded-xl bg-emerald-950 p-4 text-white">
            <p className="text-xs uppercase tracking-widest text-emerald-100">
              Catégories
            </p>
            <p className="mt-1 text-3xl font-black">{totalCategories}</p>
          </div>

          <div className="rounded-xl bg-slate-900 p-4 text-white">
            <p className="text-xs uppercase tracking-widest text-slate-300">
              Catégories actives
            </p>
            <p className="mt-1 text-3xl font-black">{categoriesActives}</p>
          </div>

          <div className="rounded-xl bg-[#d8c7a1] p-4 text-emerald-950">
            <p className="text-xs uppercase tracking-widest">
              Total permissions
            </p>
            <p className="mt-1 text-3xl font-black">{totalPermissions}</p>
          </div>

          <div className="rounded-xl bg-white p-4 text-slate-900 ring-1 ring-slate-200">
            <p className="text-xs uppercase tracking-widest text-slate-500">
              Permissions autorisées
            </p>
            <p className="mt-1 text-3xl font-black">{totalAutorisees}</p>
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
                    <th className="px-4 py-3">Catégorie / Module</th>
                    <th className="px-4 py-3 text-center">Permissions</th>
                    <th className="px-4 py-3 text-center">Statut</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredGroupes.map((groupe) => (
                    <tr
                      key={groupe.categorie}
                      className="border-t border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-4 py-4">
                        <p className="text-base font-black text-slate-900">
                          {groupe.categorie}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {groupe.autorisees} sur {groupe.total} permissions
                          autorisées
                        </p>
                      </td>

                      <td className="px-4 py-4 text-center">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                          {groupe.total} permissions
                        </span>
                      </td>

                      <td className="px-4 py-4 text-center">
                        {groupe.autorise ? (
                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-900">
                            ACTIVÉ
                          </span>
                        ) : groupe.partiel ? (
                          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">
                            PARTIEL
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500">
                            DÉSACTIVÉ
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4 text-right">
                        <button
                          disabled={actionLoading === groupe.categorie}
                          onClick={() =>
                            changerCategorie(groupe, !groupe.autorise)
                          }
                          className={`rounded-lg px-5 py-2 text-xs font-black uppercase disabled:cursor-not-allowed disabled:opacity-60 ${
                            groupe.autorise
                              ? 'bg-red-50 text-red-700 hover:bg-red-100'
                              : 'bg-emerald-950 text-white hover:bg-emerald-900'
                          }`}
                        >
                          {actionLoading === groupe.categorie
                            ? 'Traitement...'
                            : groupe.autorise
                              ? 'Désactiver'
                              : 'Activer'}
                        </button>
                      </td>
                    </tr>
                  ))}

                  {filteredGroupes.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-10 text-center font-bold text-slate-500"
                      >
                        Aucune catégorie trouvée.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}