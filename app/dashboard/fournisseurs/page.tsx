'use client';

import { useEffect, useMemo, useState } from 'react';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://messiematala-pos-backend-production.up.railway.app';

type Fournisseur = {
  idFournisseur: number;
  nom: string;
  contact: string;
  telephone: string;
  email: string;
  adresse: string;
  actif: boolean;
  dateCreation?: string;
};

type FormState = {
  nom: string;
  contact: string;
  telephone: string;
  email: string;
  adresse: string;
  actif: boolean;
};

const emptyForm: FormState = {
  nom: '',
  contact: '',
  telephone: '',
  email: '',
  adresse: '',
  actif: true,
};

export default function Page() {
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [onlyActifs, setOnlyActifs] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const total = fournisseurs.length;
  const actifs = fournisseurs.filter((f) => f.actif).length;

  const selected = useMemo(
    () => fournisseurs.find((f) => f.idFournisseur === selectedId),
    [fournisseurs, selectedId],
  );

  useEffect(() => {
    chargerFournisseurs();
  }, [onlyActifs]);

  async function chargerFournisseurs() {
    setLoading(true);
    setMessage('');

    try {
      const params = new URLSearchParams();
      params.set('onlyActifs', String(onlyActifs));
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`${API_URL}/fournisseurs?${params.toString()}`, {
        cache: 'no-store',
      });

      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      setFournisseurs(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setMessage(`Erreur chargement fournisseurs : ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  function nouveau() {
    setForm(emptyForm);
    setSelectedId(null);
    setMessage('');
  }

  function selectionner(f: Fournisseur) {
    setSelectedId(f.idFournisseur);
    setForm({
      nom: f.nom ?? '',
      contact: f.contact ?? '',
      telephone: f.telephone ?? '',
      email: f.email ?? '',
      adresse: f.adresse ?? '',
      actif: Boolean(f.actif),
    });
  }

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function valider() {
    if (!form.nom.trim()) {
      setMessage('Nom fournisseur requis.');
      return false;
    }

    return true;
  }

  async function enregistrer() {
    if (!valider()) return;

    setLoading(true);
    setMessage('');

    try {
      const isUpdate = selectedId !== null;
      const url = isUpdate
        ? `${API_URL}/fournisseurs/${selectedId}`
        : `${API_URL}/fournisseurs`;

      const res = await fetch(url, {
        method: isUpdate ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error(await res.text());

      setMessage(
        isUpdate
          ? 'Fournisseur modifié avec succès.'
          : 'Fournisseur ajouté avec succès.',
      );

      await chargerFournisseurs();
      if (!isUpdate) nouveau();
    } catch (e: any) {
      setMessage(`Erreur enregistrement : ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function desactiver() {
    if (!selectedId) {
      setMessage('Sélectionnez un fournisseur.');
      return;
    }

    const ok = window.confirm('Voulez-vous désactiver ce fournisseur ?');
    if (!ok) return;

    setLoading(true);
    setMessage('');

    try {
      const res = await fetch(`${API_URL}/fournisseurs/${selectedId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error(await res.text());

      setMessage('Fournisseur désactivé avec succès.');
      await chargerFournisseurs();
      nouveau();
    } catch (e: any) {
      setMessage(`Erreur désactivation : ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mb-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Gestion des fournisseurs
            </h1>
            <p className="mt-2 text-slate-500">
              Création, modification, désactivation et suivi des fournisseurs.
            </p>
          </div>

          <div className="flex gap-3">
            <div className="rounded-2xl bg-slate-50 px-6 py-3 ring-1 ring-slate-200">
              <p className="text-xs font-bold uppercase text-slate-500">Total</p>
              <p className="text-2xl font-bold text-slate-900">{total}</p>
            </div>

            <div className="rounded-2xl bg-green-50 px-6 py-3 ring-1 ring-green-200">
              <p className="text-xs font-bold uppercase text-green-700">Actifs</p>
              <p className="text-2xl font-bold text-green-800">{actifs}</p>
            </div>
          </div>
        </div>
      </div>

      {message && (
        <div className="mb-4 rounded-2xl bg-white p-4 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200">
          {message}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[390px_1fr]">
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-5 text-lg font-bold text-slate-900">
            Informations fournisseur
          </h2>

          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Nom fournisseur *
              </span>
              <input
                value={form.nom}
                onChange={(e) => updateField('nom', e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-green-600"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Contact
              </span>
              <input
                value={form.contact}
                onChange={(e) => updateField('contact', e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-green-600"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Téléphone
              </span>
              <input
                value={form.telephone}
                onChange={(e) => updateField('telephone', e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-green-600"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Email
              </span>
              <input
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-green-600"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Adresse
              </span>
              <textarea
                value={form.adresse}
                onChange={(e) => updateField('adresse', e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-green-600"
              />
            </label>

            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={form.actif}
                onChange={(e) => updateField('actif', e.target.checked)}
              />
              Fournisseur actif
            </label>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
  <button
    onClick={() => {
      setSelectedId(null);
      enregistrer();
    }}
    disabled={loading}
    className="rounded-xl bg-green-700 px-4 py-3 font-bold text-white disabled:opacity-50"
  >
    Ajouter
  </button>

  <button
    onClick={enregistrer}
    disabled={!selectedId || loading}
    className="rounded-xl bg-blue-600 px-4 py-3 font-bold text-white disabled:opacity-50"
  >
    Modifier
  </button>

            <button
              onClick={nouveau}
              className="rounded-xl bg-amber-500 px-4 py-3 font-bold text-white"
            >
              Nouveau
            </button>

            <button
              onClick={desactiver}
              disabled={!selectedId || loading}
              className="col-span-2 rounded-xl bg-red-600 px-4 py-3 font-bold text-white disabled:opacity-50"
            >
              Désactiver
            </button>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 gap-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') chargerFournisseurs();
                }}
                placeholder="Recherche fournisseur..."
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-green-600"
              />

              <button
                onClick={chargerFournisseurs}
                className="rounded-xl bg-slate-900 px-4 py-2 font-bold text-white"
              >
                Rechercher
              </button>
            </div>

            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={onlyActifs}
                onChange={(e) => setOnlyActifs(e.target.checked)}
              />
              Afficher seulement actifs
            </label>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-900 text-white">
                <tr>
                  <th className="px-4 py-3 text-left">Fournisseur</th>
                  <th className="px-4 py-3 text-left">Contact</th>
                  <th className="px-4 py-3 text-left">Téléphone</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Adresse</th>
                  <th className="px-4 py-3 text-left">Actif</th>
                </tr>
              </thead>

              <tbody>
                {fournisseurs.map((f) => (
                  <tr
                    key={f.idFournisseur}
                    onClick={() => selectionner(f)}
                    className={`cursor-pointer border-t border-slate-200 hover:bg-green-50 ${
                      selectedId === f.idFournisseur ? 'bg-green-100' : ''
                    }`}
                  >
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {f.nom}
                    </td>
                    <td className="px-4 py-3">{f.contact}</td>
                    <td className="px-4 py-3">{f.telephone}</td>
                    <td className="px-4 py-3">{f.email}</td>
                    <td className="px-4 py-3">{f.adresse}</td>
                    <td className="px-4 py-3">
                      {f.actif ? (
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                          Actif
                        </span>
                      ) : (
                        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                          Inactif
                        </span>
                      )}
                    </td>
                  </tr>
                ))}

                {!loading && fournisseurs.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-slate-500"
                    >
                      Aucun fournisseur trouvé.
                    </td>
                  </tr>
                )}

                {loading && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-slate-500"
                    >
                      Chargement...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}