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
  adresse: string;
  dateNaissance: string;
  dateEmbauche: string;
  codeCarte: string;
  photoPreview: string;
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
  adresse: '',
  dateNaissance: '',
  dateEmbauche: new Date().toISOString().slice(0, 10),
  codeCarte: '',
  photoPreview: '',
  idEntreprise: 1,
  idMagasin: 1,
  isManager: false,
};

function bitIsTrue(value: any) {
  return value === true || value === '1' || value === 1 || value === 'true';
}

function initials(nom: string, prenom: string) {
  return `${nom?.[0] || ''}${prenom?.[0] || ''}`.toUpperCase() || 'EM';
}

export default function Page() {
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [selected, setSelected] = useState<Employe | null>(null);
  const [form, setForm] = useState<FormEmploye>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [filtre, setFiltre] = useState<Filtre>('actifs');
  const [recherche, setRecherche] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

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
      const list = Array.isArray(data) ? data : [];

      setEmployes(list);

      if (!selected && list.length > 0) {
        setSelected(list[0]);
      }
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
    return {
      total: employes.length,
      actifs: employes.filter((e) => bitIsTrue(e.isactif)).length,
      inactifs: employes.filter((e) => !bitIsTrue(e.isactif)).length,
      managers: employes.filter((e) => bitIsTrue(e.ismanager)).length,
    };
  }, [employes]);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setMessage('');
  }

  function genererCarte() {
    const code = `EMP-${String(Date.now()).slice(-6)}`;
    setForm((f) => ({ ...f, codeCarte: code }));
  }

  function remplirForm(emp: Employe) {
    setSelected(emp);
    setEditingId(emp.id_employe);

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
      adresse: '',
      dateNaissance: '',
      dateEmbauche: '',
      codeCarte: emp.codecarteemploye || '',
      photoPreview: emp.photopath || '',
      idEntreprise: Number(emp.identreprise || 1),
      idMagasin: Number(emp.idmagasin || 1),
      isManager: bitIsTrue(emp.ismanager),
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function choisirPhoto(file?: File) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setForm((f) => ({ ...f, photoPreview: String(reader.result || '') }));
    };
    reader.readAsDataURL(file);
  }

  async function enregistrerEmploye() {
  const nom = form.nom.trim();
  const prenom = form.prenom.trim();
  const poste = form.poste.trim();
  const matricule = form.matricule.trim();

  if (!nom) return setMessage('Nom obligatoire.');
  if (!prenom) return setMessage('Prénom obligatoire.');
  if (!poste) return setMessage('Poste obligatoire.');
  if (!matricule) return setMessage('Matricule obligatoire.');

  const payload = {
    nom,
    prenom,
    telephone: form.telephone.trim(),
    email: form.email.trim(),
    poste,
    departement: form.departement.trim(),
    sexe: form.sexe.trim(),
    matricule,
    pin: form.pin.trim() || '123456',
    idEntreprise: Number(form.idEntreprise || 1),
    idMagasin: Number(form.idMagasin || 1),
    isManager: form.isManager,
  };

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
      body: JSON.stringify(payload),
    });

    const text = await res.text();

    if (!res.ok) {
      console.error('ERREUR API EMPLOYE =', text);
      throw new Error(text);
    }

    const saved: Employe = text ? JSON.parse(text) : null;

    if (saved) {
      setSelected(saved);
      setEditingId(saved.id_employe);

      setEmployes((prev) => {
        const exists = prev.some((e) => e.id_employe === saved.id_employe);

        if (exists) {
          return prev.map((e) =>
            e.id_employe === saved.id_employe ? saved : e,
          );
        }

        return [saved, ...prev];
      });

      setForm((old) => ({
        ...old,
        nom: saved.nom || old.nom,
        prenom: saved.prenom || old.prenom,
        telephone: saved.telephone || old.telephone,
        email: saved.email || old.email,
        poste: saved.poste || old.poste,
        departement: saved.departement || old.departement,
        sexe: saved.sexe || old.sexe,
        matricule: saved.matricule || old.matricule,
        pin: saved.motdepasse || old.pin,
        codeCarte: saved.codecarteemploye || old.codeCarte,
        idEntreprise: Number(saved.identreprise || old.idEntreprise || 1),
        idMagasin: Number(saved.idmagasin || old.idMagasin || 1),
        isManager: bitIsTrue(saved.ismanager),
      }));
    }

    setMessage(editingId ? 'Employé modifié.' : 'Employé ajouté.');
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

  const profileName = `${form.nom || selected?.nom || 'Nouvel'} ${
  form.prenom || selected?.prenom || 'employé'
}`;

  return (
    <main className="min-h-screen bg-slate-100 p-3 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <section className="overflow-hidden rounded-[2rem] bg-slate-950 shadow-sm">
          <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 p-6 text-white">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-200">
                  Ressources humaines
                </p>
                <h1 className="mt-2 text-3xl font-black">
                  Gestion professionnelle des employés
                </h1>
                <p className="mt-2 max-w-3xl text-sm text-slate-300">
                  Profil, identité, accès, carte employé, statut et actions
                  rapides dans une interface moderne compatible mobile et POS.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={resetForm}
                  className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950"
                >
                  + Nouvel employé
                </button>
                <button
                  onClick={chargerEmployes}
                  className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white"
                >
                  {loading ? 'Chargement...' : 'Actualiser'}
                </button>
              </div>
            </div>
          </div>
        </section>

        {message && (
          <div className="rounded-2xl bg-white p-4 text-sm font-black text-slate-700 shadow-sm ring-1 ring-slate-200">
            {message}
          </div>
        )}

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard title="Total employés" value={stats.total} />
          <StatCard title="Actifs" value={stats.actifs} />
          <StatCard title="Inactifs" value={stats.inactifs} />
          <StatCard title="Managers" value={stats.managers} />
        </section>

        <section className="grid gap-5 xl:grid-cols-[360px_1fr]">
          <aside className="space-y-5">
            <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="flex flex-col items-center text-center">
                <div className="relative">
                  {form.photoPreview ? (
                    <img
                      src={form.photoPreview}
                      alt="Photo employé"
                      className="h-32 w-32 rounded-[2rem] object-cover ring-4 ring-blue-100"
                    />
                  ) : (
                    <div className="grid h-32 w-32 place-items-center rounded-[2rem] bg-gradient-to-br from-blue-600 to-slate-950 text-4xl font-black text-white ring-4 ring-blue-100">
                      {initials(form.nom || selected?.nom || '', form.prenom || selected?.prenom || '')}
                    </div>
                  )}

                  <span className="absolute -bottom-2 -right-2">
                    <Badge active={bitIsTrue(selected?.isactif ?? true)} />
                  </span>
                </div>

                <h2 className="mt-5 text-2xl font-black text-slate-950">
                  {profileName}
                </h2>
                <p className="text-sm font-bold text-slate-500">
                  {form.poste || selected?.poste || 'Poste non défini'}
                </p>

                <label className="mt-4 cursor-pointer rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">
                  Changer photo
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => choisirPhoto(e.target.files?.[0])}
                  />
                </label>
              </div>

              <div className="mt-5 rounded-[1.5rem] bg-gradient-to-br from-slate-950 to-blue-900 p-5 text-white">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-200">
                  Carte employé
                </p>
                <p className="mt-3 text-2xl font-black">
                  {form.codeCarte || selected?.codecarteemploye || 'EMP-000000'}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-blue-200">Matricule</p>
                    <p className="font-black">{form.matricule || '-'}</p>
                  </div>
                  <div>
                    <p className="text-blue-200">Magasin</p>
                    <p className="font-black">
                      {selected?.nommagasin || `ID ${form.idMagasin}`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2">
                <ActionButton onClick={genererCarte}>Générer carte</ActionButton>
                <ActionButton onClick={() => alert('PVC à connecter après')}>
                  PVC
                </ActionButton>
                <ActionButton onClick={() => alert('Plastification à connecter après')}>
                  Plastification
                </ActionButton>
                <ActionButton onClick={() => alert('Détails employé à connecter après')}>
                  Détails
                </ActionButton>
              </div>
            </div>
          </aside>

          <section className="space-y-5">
            <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-950">
                    Fiche employé
                  </h2>
                  <p className="text-sm text-slate-500">
                    Identité, affectation, contact et accès.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={enregistrerEmploye}
                    disabled={saving}
                    className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white disabled:opacity-50"
                  >
                    {saving
                      ? 'Enregistrement...'
                      : editingId
                        ? 'Modifier employé'
                        : 'Ajouter employé'}
                  </button>

                  {editingId && selected && bitIsTrue(selected.isactif) && (
                    <button
                      onClick={() => desactiverEmploye(editingId)}
                      className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-black text-white"
                    >
                      Désactiver
                    </button>
                  )}

                  {editingId && selected && !bitIsTrue(selected.isactif) && (
                    <button
                      onClick={() => reactiverEmploye(editingId)}
                      className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white"
                    >
                      Réactiver
                    </button>
                  )}
                </div>
              </div>

              <div className="grid gap-5">
                <Panel title="Identité employé">
                  <div className="grid gap-4 lg:grid-cols-3">
                    <Field label="Nom *" value={form.nom} onChange={(v) => setForm({ ...form, nom: v })} />
                    <Field label="Prénom *" value={form.prenom} onChange={(v) => setForm({ ...form, prenom: v })} />
                    <Field label="Matricule *" value={form.matricule} onChange={(v) => setForm({ ...form, matricule: v })} />
                    <Field label="Poste *" value={form.poste} onChange={(v) => setForm({ ...form, poste: v })} />
                    <Field label="Département" value={form.departement} onChange={(v) => setForm({ ...form, departement: v })} />

                    <SelectField
                      label="Sexe"
                      value={form.sexe}
                      onChange={(v) => setForm({ ...form, sexe: v })}
                      options={[
                        { value: 'M', label: 'Homme' },
                        { value: 'F', label: 'Femme' },
                      ]}
                    />

                    <Field label="Date de naissance" type="date" value={form.dateNaissance} onChange={(v) => setForm({ ...form, dateNaissance: v })} />
                    <Field label="Date d'embauche" type="date" value={form.dateEmbauche} onChange={(v) => setForm({ ...form, dateEmbauche: v })} />
                    <Field label="Code carte" value={form.codeCarte} onChange={(v) => setForm({ ...form, codeCarte: v })} />
                  </div>
                </Panel>

                <Panel title="Contact et accès">
                  <div className="grid gap-4 lg:grid-cols-3">
                    <Field label="Téléphone" value={form.telephone} onChange={(v) => setForm({ ...form, telephone: v })} />
                    <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
                    <Field label="PIN / Mot de passe" value={form.pin} onChange={(v) => setForm({ ...form, pin: v })} />
                    <Field label="Adresse" value={form.adresse} onChange={(v) => setForm({ ...form, adresse: v })} />
                    <Field label="ID Entreprise" type="number" value={String(form.idEntreprise)} onChange={(v) => setForm({ ...form, idEntreprise: Number(v || 0) })} />
                    <Field label="ID Magasin" type="number" value={String(form.idMagasin)} onChange={(v) => setForm({ ...form, idMagasin: Number(v || 0) })} />

                    <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 font-black text-slate-700 ring-1 ring-slate-200">
                      <input
                        type="checkbox"
                        checked={form.isManager}
                        onChange={(e) => setForm({ ...form, isManager: e.target.checked })}
                        className="h-5 w-5"
                      />
                      Accès Manager
                    </label>
                  </div>
                </Panel>
              </div>
            </div>

            <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_180px_150px]">
                <input
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                  placeholder="Rechercher nom, prénom, poste, matricule..."
                  className="rounded-2xl border border-slate-300 px-4 py-3 font-semibold outline-none focus:border-blue-600"
                />

                <select
                  value={filtre}
                  onChange={(e) => setFiltre(e.target.value as Filtre)}
                  className="rounded-2xl border border-slate-300 px-4 py-3 font-semibold outline-none focus:border-blue-600"
                >
                  <option value="actifs">Actifs</option>
                  <option value="inactifs">Inactifs</option>
                  <option value="tous">Tous</option>
                </select>

                <button
                  onClick={chargerEmployes}
                  className="rounded-2xl bg-slate-950 px-5 py-3 font-black text-white"
                >
                  Rechercher
                </button>
              </div>

              <div className="hidden overflow-hidden rounded-2xl ring-1 ring-slate-200 lg:block">
                <table className="w-full text-sm">
                  <thead className="bg-slate-950 text-left text-xs uppercase text-white">
                    <tr>
                      <th className="p-3">Employé</th>
                      <th className="p-3">Poste</th>
                      <th className="p-3">Contact</th>
                      <th className="p-3">Carte</th>
                      <th className="p-3">Statut</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {employes.map((emp) => (
                      <tr
                        key={emp.id_employe}
                        onClick={() => remplirForm(emp)}
                        className="cursor-pointer border-t border-slate-100 hover:bg-blue-50"
                      >
                        <td className="p-3">
                          <p className="font-black text-slate-950">
                            {emp.nom || '-'} {emp.prenom || ''}
                          </p>
                          <p className="text-xs text-slate-500">
                            {emp.matricule || '-'} · {emp.nomutilisateur || '-'}
                          </p>
                        </td>
                        <td className="p-3">
                          <p className="font-bold">{emp.poste || '-'}</p>
                          <p className="text-xs text-slate-500">{emp.departement || '-'}</p>
                        </td>
                        <td className="p-3">
                          <p>{emp.telephone || '-'}</p>
                          <p className="text-xs text-slate-500">{emp.email || '-'}</p>
                        </td>
                        <td className="p-3 font-bold">
                          {emp.codecarteemploye || '-'}
                        </td>
                        <td className="p-3">
                          <Badge active={bitIsTrue(emp.isactif)} />
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              remplirForm(emp);
                            }}
                            className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-black text-white"
                          >
                            Ouvrir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 lg:hidden">
                {employes.map((emp) => (
                  <div
                    key={emp.id_employe}
                    onClick={() => remplirForm(emp)}
                    className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-black text-slate-950">
                          {emp.nom || '-'} {emp.prenom || ''}
                        </p>
                        <p className="text-sm text-slate-500">
                          {emp.poste || '-'} · {emp.matricule || '-'}
                        </p>
                      </div>
                      <Badge active={bitIsTrue(emp.isactif)} />
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <Info label="Téléphone" value={emp.telephone || '-'} />
                      <Info label="Carte" value={emp.codecarteemploye || '-'} />
                      <Info label="Entreprise" value={emp.nomentreprise || '-'} />
                      <Info label="Magasin" value={emp.nommagasin || '-'} />
                    </div>
                  </div>
                ))}
              </div>

              {!loading && employes.length === 0 && (
                <div className="rounded-3xl bg-slate-50 p-8 text-center font-black text-slate-500">
                  Aucun employé trouvé.
                </div>
              )}
            </div>
          </section>
        </section>
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
      <label className="text-xs font-black uppercase text-slate-500">
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

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="text-xs font-black uppercase text-slate-500">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-2xl border border-slate-300 px-4 py-3 font-semibold outline-none focus:border-blue-600"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[1.5rem] bg-white p-4 ring-1 ring-slate-200">
      <h3 className="mb-4 text-sm font-black uppercase tracking-wide text-slate-700">
        {title}
      </h3>
      {children}
    </section>
  );
}

function StatCard({ title, value }: { title: string; value: any }) {
  return (
    <div className="rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <p className="text-xs font-black uppercase text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-200">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-black text-slate-900">{value}</p>
    </div>
  );
}

function Badge({ active }: { active: boolean }) {
  return (
    <span
      className={
        active
          ? 'rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700'
          : 'rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-700'
      }
    >
      {active ? 'ACTIF' : 'INACTIF'}
    </span>
  );
}

function ActionButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-2xl bg-slate-100 px-3 py-3 text-xs font-black text-slate-800 ring-1 ring-slate-200 hover:bg-slate-200"
    >
      {children}
    </button>
  );
}