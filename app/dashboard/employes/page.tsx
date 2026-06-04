'use client';

import { useEffect, useState } from 'react';

type Employe = {
  id_employe: number;
  nom: string;
  prenom: string;
  poste: string;
  departement: string;
  telephone: string;
  email: string;
  matricule: string;
  sexe: string;
  nomutilisateur: string;
  nomentreprise: string;
  nommagasin: string;
  isactif: string;
};

export default function Page() {
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
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
  });

  useEffect(() => {
    chargerEmployes();
  }, []);

  async function chargerEmployes() {
    try {
      setLoading(true);

      const res = await fetch('https://messiematala-pos-backend-production.up.railway.app', {
        cache: 'no-store',
      });

      const data = await res.json();

      setEmployes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      alert('Erreur chargement employés');
    } finally {
      setLoading(false);
    }
  }

  async function ajouterEmploye() {
    try {
      const res = await fetch('https://messiematala-pos-backend-production.up.railway.app/employes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
      }

      await chargerEmployes();

      setForm({
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
      });

      alert('Employé ajouté');
    } catch (error) {
      console.error(error);
      alert('Erreur ajout employé');
    }
  }

  async function supprimerEmploye(id: number) {
    if (!confirm('Supprimer cet employé ?')) return;

    try {
      await fetch(`https://messiematala-pos-backend-production.up.railway.app/employes/${id}`, {
        method: 'DELETE',
      });

      chargerEmployes();
    } catch (error) {
      console.error(error);
      alert('Erreur suppression');
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      {/* HEADER */}
      <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-4xl font-extrabold text-slate-900">
          Gestion des employés
        </h1>

        <p className="mt-3 text-lg font-medium text-slate-600">
          Module connecté au backend NestJS + PostgreSQL
        </p>
      </div>

      {/* FORMULAIRE */}
      <div className="mt-6 rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-6 text-2xl font-bold text-slate-900">
          Nouvel employé
        </h2>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          <input
            value={form.nom}
            onChange={(e) =>
              setForm({ ...form, nom: e.target.value })
            }
            placeholder="Nom"
            className="
              rounded-2xl
              border-2
              border-slate-400
              bg-white
              px-5
              py-4
              text-[17px]
              font-semibold
              text-slate-900
              placeholder:text-slate-500
              outline-none
              transition
              focus:border-blue-600
              focus:ring-4
              focus:ring-blue-100
            "
          />

          <input
            value={form.prenom}
            onChange={(e) =>
              setForm({ ...form, prenom: e.target.value })
            }
            placeholder="Prénom"
            className="
              rounded-2xl
              border-2
              border-slate-400
              bg-white
              px-5
              py-4
              text-[17px]
              font-semibold
              text-slate-900
              placeholder:text-slate-500
              outline-none
              transition
              focus:border-blue-600
              focus:ring-4
              focus:ring-blue-100
            "
          />

          <input
            value={form.telephone}
            onChange={(e) =>
              setForm({ ...form, telephone: e.target.value })
            }
            placeholder="Téléphone"
            className="
              rounded-2xl
              border-2
              border-slate-400
              bg-white
              px-5
              py-4
              text-[17px]
              font-semibold
              text-slate-900
              placeholder:text-slate-500
              outline-none
              transition
              focus:border-blue-600
              focus:ring-4
              focus:ring-blue-100
            "
          />

          <input
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
            placeholder="Email"
            className="
              rounded-2xl
              border-2
              border-slate-400
              bg-white
              px-5
              py-4
              text-[17px]
              font-semibold
              text-slate-900
              placeholder:text-slate-500
              outline-none
              transition
              focus:border-blue-600
              focus:ring-4
              focus:ring-blue-100
            "
          />

          <input
            value={form.poste}
            onChange={(e) =>
              setForm({ ...form, poste: e.target.value })
            }
            placeholder="Poste"
            className="
              rounded-2xl
              border-2
              border-slate-400
              bg-white
              px-5
              py-4
              text-[17px]
              font-semibold
              text-slate-900
              placeholder:text-slate-500
              outline-none
              transition
              focus:border-blue-600
              focus:ring-4
              focus:ring-blue-100
            "
          />

          <input
            value={form.departement}
            onChange={(e) =>
              setForm({ ...form, departement: e.target.value })
            }
            placeholder="Département"
            className="
              rounded-2xl
              border-2
              border-slate-400
              bg-white
              px-5
              py-4
              text-[17px]
              font-semibold
              text-slate-900
              placeholder:text-slate-500
              outline-none
              transition
              focus:border-blue-600
              focus:ring-4
              focus:ring-blue-100
            "
          />

          <select
            value={form.sexe}
            onChange={(e) =>
              setForm({ ...form, sexe: e.target.value })
            }
            className="
              rounded-2xl
              border-2
              border-slate-400
              bg-white
              px-5
              py-4
              text-[17px]
              font-semibold
              text-slate-900
              outline-none
              transition
              focus:border-blue-600
              focus:ring-4
              focus:ring-blue-100
            "
          >
            <option value="M">Masculin</option>
            <option value="F">Féminin</option>
          </select>

          <input
            value={form.matricule}
            onChange={(e) =>
              setForm({ ...form, matricule: e.target.value })
            }
            placeholder="Matricule"
            className="
              rounded-2xl
              border-2
              border-slate-400
              bg-white
              px-5
              py-4
              text-[17px]
              font-semibold
              text-slate-900
              placeholder:text-slate-500
              outline-none
              transition
              focus:border-blue-600
              focus:ring-4
              focus:ring-blue-100
            "
          />

          <input
            value={form.pin}
            onChange={(e) =>
              setForm({ ...form, pin: e.target.value })
            }
            placeholder="PIN"
            className="
              rounded-2xl
              border-2
              border-slate-400
              bg-white
              px-5
              py-4
              text-[17px]
              font-semibold
              text-slate-900
              placeholder:text-slate-500
              outline-none
              transition
              focus:border-blue-600
              focus:ring-4
              focus:ring-blue-100
            "
          />
        </div>

        <button
          onClick={ajouterEmploye}
          className="
            mt-8
            rounded-2xl
            bg-blue-600
            px-8
            py-4
            text-lg
            font-bold
            text-white
            shadow-lg
            transition
            hover:bg-blue-700
          "
        >
          Ajouter employé
        </button>
      </div>

      {/* TABLEAU */}
      <div className="mt-6 rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">
            Liste des employés
          </h2>

          <button
            onClick={chargerEmployes}
            className="
              rounded-2xl
              bg-slate-900
              px-5
              py-3
              text-base
              font-bold
              text-white
              transition
              hover:bg-slate-700
            "
          >
            Actualiser
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-lg font-semibold text-slate-500">
            Chargement...
          </div>
        ) : (
          <div className="overflow-auto rounded-2xl border border-slate-200">
            <table className="min-w-full">
              <thead>
                <tr className="bg-slate-900 text-left text-sm text-white">
                  <th className="px-5 py-4">ID</th>
                  <th className="px-5 py-4">Nom</th>
                  <th className="px-5 py-4">Prénom</th>
                  <th className="px-5 py-4">Poste</th>
                  <th className="px-5 py-4">Département</th>
                  <th className="px-5 py-4">Téléphone</th>
                  <th className="px-5 py-4">Email</th>
                  <th className="px-5 py-4">Matricule</th>
                  <th className="px-5 py-4">Entreprise</th>
                  <th className="px-5 py-4">Magasin</th>
                  <th className="px-5 py-4">Statut</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>

             <tbody>
  {employes.map((emp) => (
    <tr
      key={emp.id_employe}
      className="
        border-b
        border-slate-200
        bg-white
        transition
        hover:bg-slate-50
      "
    >
      <td className="px-5 py-4 font-bold text-slate-900">
        {emp.id_employe}
      </td>

      <td className="px-5 py-4 font-semibold text-slate-900">
        {emp.nom || '-'}
      </td>

      <td className="px-5 py-4 font-semibold text-slate-900">
        {emp.prenom || '-'}
      </td>

      <td className="px-5 py-4 font-semibold text-slate-900">
        {emp.poste || '-'}
      </td>

      <td className="px-5 py-4 font-semibold text-slate-900">
        {emp.departement || '-'}
      </td>

      <td className="px-5 py-4 font-semibold text-slate-900">
        {emp.telephone || '-'}
      </td>

      <td className="px-5 py-4 font-semibold text-slate-900">
        {emp.email || '-'}
      </td>

      <td className="px-5 py-4 font-semibold text-slate-900">
        {emp.matricule || '-'}
      </td>

      <td className="px-5 py-4 font-semibold text-slate-900">
        {emp.nomentreprise || '-'}
      </td>

      <td className="px-5 py-4 font-semibold text-slate-900">
        {emp.nommagasin || '-'}
      </td>

      <td className="px-5 py-4">
        <span
          className={
            emp.isactif === '1'
              ? `
                rounded-full
                bg-green-100
                px-4
                py-2
                text-sm
                font-bold
                text-green-700
              `
              : `
                rounded-full
                bg-red-100
                px-4
                py-2
                text-sm
                font-bold
                text-red-700
              `
          }
        >
          {emp.isactif === '1'
            ? 'Actif'
            : 'Inactif'}
        </span>
      </td>

      <td className="px-5 py-4">
        <button
          onClick={() =>
            supprimerEmploye(emp.id_employe)
          }
          className="
            rounded-xl
            bg-red-600
            px-4
            py-2
            text-sm
            font-bold
            text-white
            shadow-md
            transition
            hover:bg-red-700
          "
        >
          Supprimer
        </button>
      </td>
    </tr>
  ))}
</tbody>
            </table>

            {employes.length === 0 && (
              <div className="py-16 text-center text-lg font-semibold text-slate-500">
                Aucun employé trouvé
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}