'use client';

import { useEffect, useMemo, useState } from 'react';

import { getClientApi } from '@/lib/api-config';

function getApi() {
  return getClientApi() || 'https://messiematala-pos-backend-production.up.railway.app';
}

type Utilisateur = {
  id: number;
  identreprise?: number;
  nomentreprise?: string;
  idmagasin?: number;
  nommagasin?: string;
  idemploye?: number;
  nomutilisateur: string;
  nom?: string;
  prenom?: string;
  role?: string;
  actif?: boolean | string | number;
  statut?: string;
  email?: string;
  telephone?: string;
  datecreation?: string;
  avatarpath?: string;
};

type Role = {
  idrole: number;
  nomrole: string;
};

type Entreprise = {
  identreprise: number;
  nom: string;
};

type Magasin = {
  idmagasin: number;
  identreprise: number;
  nom: string;
};

type Connexion = {
  idconnexion: number;
  nomutilisateur?: string;
  email?: string;
  statut?: string;
  message?: string;
  ipadresse?: string;
  systeme?: string;
  navigateur?: string;
  ville?: string;
  pays?: string;
  dateconnexion?: string;
};

function actifBool(v: any) {
  return v === true || v === 1 || v === '1' || v === 't' || v === 'true';
}

export default function Page() {
  const [users, setUsers] = useState<Utilisateur[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [magasins, setMagasins] = useState<Magasin[]>([]);
  const [connexions, setConnexions] = useState<Connexion[]>([]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [filtre, setFiltre] = useState<'ACTIFS' | 'INACTIFS' | 'TOUS'>('ACTIFS');

  const [selected, setSelected] = useState<Utilisateur | null>(null);
  const [showConnexions, setShowConnexions] = useState(false);

  const [form, setForm] = useState({
    identreprise: '',
    idmagasin: '',
    idemploye: '',
    nomutilisateur: '',
    motdepasse: '',
    nom: '',
    prenom: '',
    role: '',
    email: '',
    telephone: '',
    avatarpath: '',
    actif: true,
  });

  async function charger() {
    setLoading(true);
    setMessage('');

    try {
      const [uRes, rRes, eRes, mRes] = await Promise.all([
        fetch(`${getApi()}/utilisateurs`),
        fetch(`${getApi()}/utilisateurs/roles`),
        fetch(`${getApi()}/utilisateurs/entreprises`),
        fetch(`${getApi()}/utilisateurs/magasins`),
      ]);

      if (!uRes.ok) {
  const err = await uRes.text();
  throw new Error(err || 'Erreur chargement utilisateurs.');
}
      if (!rRes.ok) throw new Error('Erreur chargement rôles.');

      const uData = await uRes.json();
      const rData = await rRes.json();
      const eData = await eRes.json();
      const mData = await mRes.json();

      setUsers(Array.isArray(uData) ? uData : []);
      setRoles(Array.isArray(rData) ? rData : []);
      setEntreprises(Array.isArray(eData) ? eData : []);
      setMagasins(Array.isArray(mData) ? mData : []);

      if (Array.isArray(rData) && rData.length > 0 && !form.role) {
        setForm((f) => ({ ...f, role: rData[0].nomrole }));
      }
    } catch (e: any) {
      setMessage(e.message || 'Erreur serveur.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    charger();
  }, []);

  const magasinsFiltres = useMemo(() => {
    if (!form.identreprise) return magasins;
    return magasins.filter((m) => m.identreprise === Number(form.identreprise));
  }, [magasins, form.identreprise]);

  const usersFiltres = useMemo(() => {
    const q = search.trim().toLowerCase();

    return users.filter((u) => {
      const actif = actifBool(u.actif);

      if (filtre === 'ACTIFS' && !actif) return false;
      if (filtre === 'INACTIFS' && actif) return false;

      if (!q) return true;

      return [
        u.nomutilisateur,
        u.nom,
        u.prenom,
        u.email,
        u.telephone,
        u.role,
        u.nomentreprise,
        u.nommagasin,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [users, search, filtre]);

  function resetForm() {
    setSelected(null);
    setForm({
      identreprise: '',
      idmagasin: '',
      idemploye: '',
      nomutilisateur: '',
      motdepasse: '',
      nom: '',
      prenom: '',
      role: roles[0]?.nomrole || '',
      email: '',
      telephone: '',
      avatarpath: '',
      actif: true,
    });
  }

  function selectionner(u: Utilisateur) {
    setSelected(u);
    setMessage('');

    setForm({
      identreprise: u.identreprise ? String(u.identreprise) : '',
      idmagasin: u.idmagasin ? String(u.idmagasin) : '',
      idemploye: u.idemploye ? String(u.idemploye) : '',
      nomutilisateur: u.nomutilisateur || '',
      motdepasse: '',
      nom: u.nom || '',
      prenom: u.prenom || '',
      role: u.role || roles[0]?.nomrole || '',
      email: u.email || '',
      telephone: u.telephone || '',
      avatarpath: u.avatarpath || '',
      actif: actifBool(u.actif),
    });
  }

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');

    const payload = {
      identreprise: form.identreprise ? Number(form.identreprise) : null,
      idmagasin: form.idmagasin ? Number(form.idmagasin) : null,
      idemploye: form.idemploye ? Number(form.idemploye) : null,
      nomutilisateur: form.nomutilisateur,
      motdepasse: form.motdepasse,
      nom: form.nom,
      prenom: form.prenom,
      role: form.role,
      email: form.email,
      telephone: form.telephone,
      avatarpath: form.avatarpath,
      actif: form.actif,
    };

    const url = selected
      ? `${getApi()}/utilisateurs/${selected.id}`
      : `${getApi()}/utilisateurs`;

    const method = selected ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      setMessage(err?.message || 'Erreur enregistrement utilisateur.');
      return;
    }

    setMessage(selected ? 'Utilisateur modifié avec succès.' : 'Utilisateur créé avec succès.');
    resetForm();
    charger();
  }

  async function changerRole(u: Utilisateur, role: string) {
    await fetch(`${getApi()}/utilisateurs/${u.id}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });

    charger();
  }

  async function changerEtat(u: Utilisateur) {
    const actif = actifBool(u.actif);
    const action = actif ? 'desactiver' : 'reactiver';

    const ok = confirm(
      actif
        ? `Désactiver l'utilisateur ${u.nomutilisateur} ?`
        : `Réactiver l'utilisateur ${u.nomutilisateur} ?`,
    );

    if (!ok) return;

    await fetch(`${getApi()}/utilisateurs/${u.id}/${action}`, {
      method: 'PATCH',
    });

    charger();
  }

  async function voirConnexions(u: Utilisateur) {
    setSelected(u);
    setShowConnexions(true);

    const res = await fetch(`${getApi()}/utilisateurs/${u.id}/connexions`);
    const data = await res.json();

    setConnexions(Array.isArray(data) ? data : []);
  }

  return (
    <main className="min-h-screen bg-[#f5f3ea] p-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-emerald-700">
            MESSIE MATALA POS
          </p>
          <h1 className="mt-2 text-3xl font-black text-emerald-950">
            Gestion des utilisateurs
          </h1>
          <p className="mt-2 text-slate-500">
            Comptes, rôles, entreprises, magasins, activation, désactivation et connexions.
          </p>
        </section>

        {message && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-bold text-emerald-700">
            {message}
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-[390px_1fr]">
          <form
            onSubmit={enregistrer}
            className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-emerald-900">
                {selected ? 'Modifier utilisateur' : 'Nouvel utilisateur'}
              </h2>

              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Nouveau
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <Select
                label="Entreprise"
                value={form.identreprise}
                onChange={(v) => setForm({ ...form, identreprise: v, idmagasin: '' })}
              >
                <option value="">Choisir entreprise</option>
                {entreprises.map((e) => (
                  <option key={e.identreprise} value={e.identreprise}>
                    {e.nom}
                  </option>
                ))}
              </Select>

              <Select
                label="Magasin"
                value={form.idmagasin}
                onChange={(v) => setForm({ ...form, idmagasin: v })}
              >
                <option value="">Choisir magasin</option>
                {magasinsFiltres.map((m) => (
                  <option key={m.idmagasin} value={m.idmagasin}>
                    {m.nom}
                  </option>
                ))}
              </Select>

              <Champ
                label="ID Employé lié"
                value={form.idemploye}
                onChange={(v) => setForm({ ...form, idemploye: v })}
              />

              <Champ
                label="Nom utilisateur"
                value={form.nomutilisateur}
                onChange={(v) => setForm({ ...form, nomutilisateur: v })}
              />

              <Champ
                label={selected ? 'Nouveau mot de passe optionnel' : 'Mot de passe'}
                type="password"
                value={form.motdepasse}
                onChange={(v) => setForm({ ...form, motdepasse: v })}
              />

              <div className="grid grid-cols-2 gap-3">
                <Champ
                  label="Nom"
                  value={form.nom}
                  onChange={(v) => setForm({ ...form, nom: v })}
                />

                <Champ
                  label="Prénom"
                  value={form.prenom}
                  onChange={(v) => setForm({ ...form, prenom: v })}
                />
              </div>

              <Select
                label="Rôle"
                value={form.role}
                onChange={(v) => setForm({ ...form, role: v })}
              >
                <option value="">Choisir rôle</option>
                {roles.map((r) => (
                  <option key={r.idrole} value={r.nomrole}>
                    {r.nomrole}
                  </option>
                ))}
              </Select>

              <Champ
                label="Email"
                value={form.email}
                onChange={(v) => setForm({ ...form, email: v })}
              />

              <Champ
                label="Téléphone"
                value={form.telephone}
                onChange={(v) => setForm({ ...form, telephone: v })}
              />

              <Champ
                label="Avatar Path"
                value={form.avatarpath}
                onChange={(v) => setForm({ ...form, avatarpath: v })}
              />

              <label className="flex items-center gap-3 rounded-2xl bg-[#f5f3ea] px-4 py-3 text-sm font-bold">
                <input
                  type="checkbox"
                  checked={form.actif}
                  onChange={(e) => setForm({ ...form, actif: e.target.checked })}
                />
                Compte actif
              </label>

              <button
                type="submit"
                className="w-full rounded-2xl bg-emerald-700 px-5 py-3 font-bold text-white hover:bg-emerald-800"
              >
                {selected ? 'Enregistrer modifications' : 'Créer utilisateur'}
              </button>
            </div>
          </form>

          <div className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 border-b border-emerald-50 pb-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-black text-emerald-900">
                  Liste des utilisateurs
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {usersFiltres.length} utilisateur(s) affiché(s)
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {(['ACTIFS', 'INACTIFS', 'TOUS'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFiltre(f)}
                    className={
                      filtre === f
                        ? 'rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white'
                        : 'rounded-xl border border-emerald-100 px-4 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50'
                    }
                  >
                    {f}
                  </button>
                ))}

                <button
                  onClick={charger}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Actualiser
                </button>
              </div>
            </div>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher utilisateur, rôle, email, magasin..."
              className="my-4 w-full rounded-2xl border border-emerald-100 bg-[#faf9f3] px-4 py-3 text-sm outline-none focus:border-emerald-500"
            />

            <div className="overflow-auto rounded-2xl border border-slate-100">
              <table className="w-full min-w-[1250px] text-left text-sm">
                <thead className="bg-slate-950 text-white">
                  <tr>
                    <th className="p-3">ID</th>
                    <th className="p-3">Utilisateur</th>
                    <th className="p-3">Nom complet</th>
                    <th className="p-3">Entreprise</th>
                    <th className="p-3">Magasin</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Téléphone</th>
                    <th className="p-3">Rôle</th>
                    <th className="p-3">Statut</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {usersFiltres.map((u) => {
                    const actif = actifBool(u.actif);

                    return (
                      <tr
                        key={u.id}
                        onClick={() => selectionner(u)}
                        className="cursor-pointer border-b border-slate-100 hover:bg-emerald-50"
                      >
                        <td className="p-3 font-bold">{u.id}</td>
                        <td className="p-3 font-black text-emerald-900">
                          {u.nomutilisateur}
                        </td>
                        <td className="p-3">{u.prenom} {u.nom}</td>
                        <td className="p-3">{u.nomentreprise || '-'}</td>
                        <td className="p-3">{u.nommagasin || '-'}</td>
                        <td className="p-3">{u.email || '-'}</td>
                        <td className="p-3">{u.telephone || '-'}</td>
                        <td className="p-3">
                          <select
                            value={u.role || ''}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => changerRole(u, e.target.value)}
                            className="rounded-xl border border-emerald-100 bg-white px-3 py-2 font-bold text-emerald-700"
                          >
                            {roles.map((r) => (
                              <option key={r.idrole} value={r.nomrole}>
                                {r.nomrole}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3">
                          <span className={actif ? 'font-black text-emerald-700' : 'font-black text-red-600'}>
                            {actif ? 'ACTIF' : 'INACTIF'}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                changerEtat(u);
                              }}
                              className={
                                actif
                                  ? 'rounded-xl bg-red-600 px-3 py-2 text-xs font-bold text-white'
                                  : 'rounded-xl bg-emerald-700 px-3 py-2 text-xs font-bold text-white'
                              }
                            >
                              {actif ? 'Désactiver' : 'Réactiver'}
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                voirConnexions(u);
                              }}
                              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                            >
                              Connexions
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {!loading && usersFiltres.length === 0 && (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-500">
                        Aucun utilisateur trouvé.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {loading && (
              <p className="mt-4 text-sm font-bold text-emerald-700">
                Chargement...
              </p>
            )}
          </div>
        </section>
      </div>

      {showConnexions && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4">
          <div className="max-h-[85vh] w-full max-w-5xl overflow-auto rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-emerald-900">
                  Connexions utilisateur
                </h3>
                <p className="text-sm text-slate-500">
                  {selected?.nomutilisateur}
                </p>
              </div>

              <button
                onClick={() => setShowConnexions(false)}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white"
              >
                Fermer
              </button>
            </div>

            <div className="overflow-auto rounded-2xl border border-slate-100">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="bg-slate-950 text-white">
                  <tr>
                    <th className="p-3 text-left">Date</th>
                    <th className="p-3 text-left">Statut</th>
                    <th className="p-3 text-left">Message</th>
                    <th className="p-3 text-left">IP</th>
                    <th className="p-3 text-left">Système</th>
                    <th className="p-3 text-left">Navigateur</th>
                    <th className="p-3 text-left">Ville</th>
                    <th className="p-3 text-left">Pays</th>
                  </tr>
                </thead>

                <tbody>
                  {connexions.map((c) => (
                    <tr key={c.idconnexion} className="border-b border-slate-100">
                      <td className="p-3">{c.dateconnexion || '-'}</td>
                      <td className="p-3 font-bold">{c.statut || '-'}</td>
                      <td className="p-3">{c.message || '-'}</td>
                      <td className="p-3">{c.ipadresse || '-'}</td>
                      <td className="p-3">{c.systeme || '-'}</td>
                      <td className="p-3">{c.navigateur || '-'}</td>
                      <td className="p-3">{c.ville || '-'}</td>
                      <td className="p-3">{c.pays || '-'}</td>
                    </tr>
                  ))}

                  {connexions.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500">
                        Aucune connexion trouvée.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Champ({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  type?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-emerald-100 bg-[#faf9f3] px-4 py-3 text-sm outline-none focus:border-emerald-500"
      />
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-emerald-100 bg-[#faf9f3] px-4 py-3 text-sm outline-none focus:border-emerald-500"
      >
        {children}
      </select>
    </div>
  );
}