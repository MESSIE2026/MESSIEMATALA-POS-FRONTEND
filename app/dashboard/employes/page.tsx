'use client';

import { useEffect, useMemo, useState } from 'react';

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://messiematala-pos-backend-production.up.railway.app';

type Filtre = 'actifs' | 'inactifs' | 'tous';

type Employe = {
  id_employe: number;
  nom?: string | null;
  prenom?: string | null;
  poste?: string | null;
  departement?: string | null;
  telephone?: string | null;
  email?: string | null;
  matricule?: string | null;
  sexe?: string | null;
  nomutilisateur?: string | null;
  motdepasse?: string | null;
  ismanager?: string | boolean | null;
  isactif?: string | boolean | null;
  datedesactivation?: string | null;
  photopath?: string | null;
  codecarteemploye?: string | null;
  identreprise?: number | null;
  nomentreprise?: string | null;
  idmagasin?: number | null;
  nommagasin?: string | null;
};

type FormEmploye = {
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  poste: string;
  departement: string;
  sexe: string;
  matricule: string;
  pin: string;
  idEntreprise: number;
  idMagasin: number;
  isManager: boolean;
};

const emptyForm: FormEmploye = {
  nom: '',
  prenom: '',
  telephone: '',
  email: '',
  poste: '',
  departement: '',
  sexe: 'M',
  matricule: '',
  pin: '',
  idEntreprise: 1,
  idMagasin: 1,
  isManager: false,
};

function bitIsTrue(value: any) {
  return value === true || value === '1' || value === 1 || value === 'true';
}

export default function Page() {
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [form, setForm] = useState<FormEmploye>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [filtre, setFiltre] = useState<Filtre>('actifs');
  const [recherche, setRecherche] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [infosVisible, setInfosVisible] = useState(true);
  const [message, setMessage] = useState('');

  async function chargerEmployes() {
    setLoading(true);
    setMessage('');

    try {
      const params = new URLSearchParams();
      params.set('filtre', filtre);
      params.set('recherche', recherche);

      const res = await fetch(`${API}/employes?${params.toString()}`, {
        cache: 'no-store',
      });

      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      setEmployes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setMessage('Erreur chargement employés.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    chargerEmployes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtre]);

  const stats = useMemo(() => {
    const actifs = employes.filter((e) => bitIsTrue(e.isactif)).length;
    const inactifs = employes.filter((e) => !bitIsTrue(e.isactif)).length;

    return {
      total: employes.length,
      actifs,
      inactifs,
      managers: employes.filter((e) => bitIsTrue(e.ismanager)).length,
    };
  }, [employes]);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function remplirForm(emp: Employe) {
    setEditingId(emp.id_employe);
    setInfosVisible(true);

    setForm({
      nom: emp.nom || '',
      prenom: emp.prenom || '',
      telephone: emp.telephone || '',
      email: emp.email || '',
      poste: emp.poste || '',
      departement: emp.departement || '',
      sexe: emp.sexe || 'M',
      matricule: emp.matricule || '',
      pin: emp.motdepasse || '',
      idEntreprise: Number(emp.identreprise || 1),
      idMagasin: Number(emp.idmagasin || 1),
      isManager: bitIsTrue(emp.ismanager),
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function enregistrerEmploye() {
    if (!form.nom.trim()) return setMessage('Nom obligatoire.');
    if (!form.prenom.trim()) return setMessage('Prénom obligatoire.');
    if (!form.poste.trim()) return setMessage('Poste obligatoire.');
    if (!form.matricule.trim()) return setMessage('Matricule obligatoire.');

    setSaving(true);
    setMessage('');

    try {
      const url = editingId
        ? `${API}/employes/${editingId}`
        : `${API}/employes`;

      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error(await res.text());

      setMessage(editingId ? 'Employé modifié.' : 'Employé ajouté.');
      resetForm();
      await chargerEmployes();
    } catch (error) {
      console.error(error);
      setMessage("Erreur pendant l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  async function desactiverEmploye(id: number) {
    if (!confirm('Désactiver cet employé ?')) return;

    try {
      const res = await fetch(`${API}/employes/${id}/desactiver`, {
        method: 'PATCH',
      });

      if (!res.ok) throw new Error(await res.text());

      setMessage('Employé désactivé.');
      await chargerEmployes();
    } catch (error) {
      console.error(error);
      setMessage('Erreur désactivation employé.');
    }
  }

  async function reactiverEmploye(id: number) {
    if (!confirm('Réactiver cet employé ?')) return;

    try {
      const res = await fetch(`${API}/employes/${id}/reactiver`, {
        method: 'PATCH',
      });

      if (!res.ok) throw new Error(await res.text());

      setMessage('Employé réactivé.');
      await chargerEmployes();
    } catch (error) {
      console.error(error);
      setMessage('Erreur réactivation employé.');
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-3 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-4">
        <section className="rounded-3xl bg-slate-950 p-5 text-white shadow-sm">
          <h1 className="text-2xl font-black sm:text-3xl">
            Gestion des employés
          </h1>
          <p className="mt-1 text-sm text-slate-300">
            Ajouter, modifier, désactiver, réactiver, filtrer et gérer les
            employés comme dans l’ancien Windows Forms.
          </p>
        </section>

        {message && (
          <section className="rounded-2xl bg-white p-4 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-200">
            {message}
          </section>
        )}

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Card title="Total" value={stats.total} />
          <Card title="Actifs" value={stats.actifs} />
          <Card title="Inactifs" value={stats.inactifs} />
          <Card title="Managers" value={stats.managers} />
        </section>

        <section className="rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
          <button
            onClick={() => setInfosVisible(!infosVisible)}
            className="w-full rounded-t-3xl bg-blue-600 px-5 py-3 text-center font-bold text-white"
          >
            Informations Employés {infosVisible ? '▲' : '▼'}
          </button>

          {infosVisible && (
            <div className="grid gap-4 p-4 lg:grid-cols-4">
              <Field
                label="Nom *"
                value={form.nom}
                onChange={(v) => setForm({ ...form, nom: v })}
              />

              <Field
                label="Prénom *"
                value={form.prenom}
                onChange={(v) => setForm({ ...form, prenom: v })}
              />

              <Field
                label="Téléphone"
                value={form.telephone}
                onChange={(v) => setForm({ ...form, telephone: v })}
              />

              <Field
                label="Email"
                value={form.email}
                onChange={(v) => setForm({ ...form, email: v })}
              />

              <Field
                label="Poste *"
                value={form.poste}
                onChange={(v) => setForm({ ...form, poste: v })}
              />

              <Field
                label="Département"
                value={form.departement}
                onChange={(v) => setForm({ ...form, departement: v })}
              />

              <div>
                <label className="text-xs font-bold uppercase text-slate-500">
                  Sexe
                </label>
                <select
                  value={form.sexe}
                  onChange={(e) => setForm({ ...form, sexe: e.target.value })}
                  className="mt-1 w-full rounded-2xl border border-slate-300 px-4 py-3 font-semibold outline-none focus:border-blue-600"
                >
                  <option value="M">Masculin</option>
                  <option value="F">Féminin</option>
                </select>
              </div>

              <Field
                label="Matricule *"
                value={form.matricule}
                onChange={(v) => setForm({ ...form, matricule: v })}
              />

              <Field
                label="PIN / Mot de passe"
                value={form.pin}
                onChange={(v) => setForm({ ...form, pin: v })}
              />

              <Field
                label="ID Entreprise"
                type="number"
                value={String(form.idEntreprise)}
                onChange={(v) =>
                  setForm({ ...form, idEntreprise: Number(v || 0) })
                }
              />

              <Field
                label="ID Magasin"
                type="number"
                value={String(form.idMagasin)}
                onChange={(v) =>
                  setForm({ ...form, idMagasin: Number(v || 0) })
                }
              />

              <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={form.isManager}
                  onChange={(e) =>
                    setForm({ ...form, isManager: e.target.checked })
                  }
                  className="h-5 w-5"
                />
                Manager
              </label>

              <div className="flex flex-wrap gap-3 lg:col-span-4">
                <button
                  onClick={enregistrerEmploye}
                  disabled={saving}
                  className="rounded-2xl bg-blue-600 px-6 py-3 font-bold text-white disabled:opacity-50"
                >
                  {saving
                    ? 'Enregistrement...'
                    : editingId
                      ? 'Modifier employé'
                      : 'Ajouter employé'}
                </button>

                {editingId && (
                  <button
                    onClick={resetForm}
                    className="rounded-2xl bg-slate-200 px-6 py-3 font-bold text-slate-700"
                  >
                    Annuler modification
                  </button>
                )}
              </div>
            </div>
          )}
        </section>

        <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="grid gap-3 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <label className="text-xs font-bold uppercase text-slate-500">
                Recherche
              </label>
              <input
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Nom, prénom, poste, matricule..."
                className="mt-1 w-full rounded-2xl border border-slate-300 px-4 py-3 font-semibold outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-slate-500">
                Filtre
              </label>
              <select
                value={filtre}
                onChange={(e) => setFiltre(e.target.value as Filtre)}
                className="mt-1 w-full rounded-2xl border border-slate-300 px-4 py-3 font-semibold outline-none focus:border-blue-600"
              >
                <option value="actifs">Actifs</option>
                <option value="inactifs">Inactifs</option>
                <option value="tous">Tous</option>
              </select>
            </div>

            <button
              onClick={chargerEmployes}
              disabled={loading}
              className="mt-5 rounded-2xl bg-slate-950 px-5 py-3 font-bold text-white disabled:opacity-50"
            >
              {loading ? 'Chargement...' : 'Actualiser'}
            </button>

            <button
              onClick={resetForm}
              className="mt-5 rounded-2xl bg-slate-200 px-5 py-3 font-bold text-slate-700"
            >
              Nouveau
            </button>
          </div>
        </section>

        <section className="hidden overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 lg:block">
          <table className="w-full text-sm">
            <thead className="bg-slate-950 text-left text-xs uppercase text-white">
              <tr>
                <th className="p-3">ID</th>
                <th className="p-3">Employé</th>
                <th className="p-3">Poste</th>
                <th className="p-3">Contact</th>
                <th className="p-3">Matricule</th>
                <th className="p-3">Entreprise</th>
                <th className="p-3">Statut</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {employes.map((emp) => (
                <tr key={emp.id_employe} className="border-t border-slate-100">
                  <td className="p-3 font-bold">{emp.id_employe}</td>

                  <td className="p-3">
                    <p className="font-bold text-slate-900">
                      {emp.nom || '-'} {emp.prenom || ''}
                    </p>
                    <p className="text-xs text-slate-500">
                      {emp.nomutilisateur || '-'}
                    </p>
                  </td>

                  <td className="p-3">
                    <p className="font-bold">{emp.poste || '-'}</p>
                    <p className="text-xs text-slate-500">
                      {emp.departement || '-'}
                    </p>
                  </td>

                  <td className="p-3">
                    <p>{emp.telephone || '-'}</p>
                    <p className="text-xs text-slate-500">{emp.email || '-'}</p>
                  </td>

                  <td className="p-3">
                    <p className="font-bold">{emp.matricule || '-'}</p>
                    <p className="text-xs text-slate-500">
                      {emp.codecarteemploye || '-'}
                    </p>
                  </td>

                  <td className="p-3">
                    <p>{emp.nomentreprise || '-'}</p>
                    <p className="text-xs text-slate-500">
                      {emp.nommagasin || '-'}
                    </p>
                  </td>

                  <td className="p-3">
                    <Badge active={bitIsTrue(emp.isactif)} />
                  </td>

                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => remplirForm(emp)}
                        className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white"
                      >
                        Modifier
                      </button>

                      {bitIsTrue(emp.isactif) ? (
                        <button
                          onClick={() => desactiverEmploye(emp.id_employe)}
                          className="rounded-xl bg-red-600 px-3 py-2 text-xs font-bold text-white"
                        >
                          Désactiver
                        </button>
                      ) : (
                        <button
                          onClick={() => reactiverEmploye(emp.id_employe)}
                          className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white"
                        >
                          Réactiver
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="space-y-3 lg:hidden">
          {employes.map((emp) => (
            <div
              key={emp.id_employe}
              className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-black text-slate-900">
                    {emp.nom || '-'} {emp.prenom || ''}
                  </p>
                  <p className="text-sm text-slate-500">{emp.poste || '-'}</p>
                </div>

                <Badge active={bitIsTrue(emp.isactif)} />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <Info label="Téléphone" value={emp.telephone || '-'} />
                <Info label="Matricule" value={emp.matricule || '-'} />
                <Info label="Entreprise" value={emp.nomentreprise || '-'} />
                <Info label="Magasin" value={emp.nommagasin || '-'} />
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => remplirForm(emp)}
                  className="flex-1 rounded-xl bg-blue-600 px-3 py-2 text-sm font-bold text-white"
                >
                  Modifier
                </button>

                {bitIsTrue(emp.isactif) ? (
                  <button
                    onClick={() => desactiverEmploye(emp.id_employe)}
                    className="flex-1 rounded-xl bg-red-600 px-3 py-2 text-sm font-bold text-white"
                  >
                    Désactiver
                  </button>
                ) : (
                  <button
                    onClick={() => reactiverEmploye(emp.id_employe)}
                    className="flex-1 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-bold text-white"
                  >
                    Réactiver
                  </button>
                )}
              </div>
            </div>
          ))}
        </section>

        {!loading && employes.length === 0 && (
          <div className="rounded-3xl bg-white p-8 text-center font-bold text-slate-500 shadow-sm ring-1 ring-slate-200">
            Aucun employé trouvé.
          </div>
        )}
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="text-xs font-bold uppercase text-slate-500">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-2xl border border-slate-300 px-4 py-3 font-semibold outline-none focus:border-blue-600"
      />
    </div>
  );
}

function Card({ title, value }: { title: string; value: any }) {
  return (
    <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <p className="text-xs font-bold uppercase text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-bold text-slate-900">{value}</p>
    </div>
  );
}

function Badge({ active }: { active: boolean }) {
  return (
    <span
      className={
        active
          ? 'rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700'
          : 'rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700'
      }
    >
      {active ? 'ACTIF' : 'INACTIF'}
    </span>
  );
}