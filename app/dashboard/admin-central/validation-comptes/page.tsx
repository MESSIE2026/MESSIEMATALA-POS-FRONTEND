'use client';

import { useEffect, useState } from 'react';

const API = 'https://messiematala-pos-backend-production.up.railway.app';

type PendingUser = {
  idutilisateur: number;
  nom: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  nomutilisateur: string;
  role?: string;
  statut: string;
  actif: boolean;
  identreprise?: number;
  idmagasin?: number;
  createdat?: string;
};

export default function ValidationComptesPage() {
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<number | null>(null);
  const [message, setMessage] = useState('');

  async function lireReponse(res: Response) {
    const texte = await res.text();
    try {
      return texte ? JSON.parse(texte) : null;
    } catch {
      return texte;
    }
  }

  async function chargerComptes() {
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch(`${API}/auth/pending-users`, {
        method: 'GET',
        cache: 'no-store',
        mode: 'cors',
      });

      const data = await lireReponse(res);

      if (!res.ok) {
        setMessage(data?.message || 'Impossible de charger les comptes.');
        return;
      }

      setUsers(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error(error);
      setMessage(error?.message || 'Erreur réseau avec le serveur central.');
    } finally {
      setLoading(false);
    }
  }

  async function approuverCompte(idutilisateur: number) {
    setActionId(idutilisateur);
    setMessage('');

    try {
      const res = await fetch(`${API}/auth/approve-user`, {
        method: 'POST',
        cache: 'no-store',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idutilisateur }),
      });

      const data = await lireReponse(res);

      if (!res.ok) {
        setMessage(data?.message || 'Approbation impossible.');
        return;
      }

      setMessage(data?.message || 'Compte approuvé avec succès.');
      await chargerComptes();
    } catch (error: any) {
      console.error(error);
      setMessage(error?.message || 'Erreur réseau avec le serveur central.');
    } finally {
      setActionId(null);
    }
  }

  async function rejeterCompte(idutilisateur: number) {
    setActionId(idutilisateur);
    setMessage('');

    try {
      const res = await fetch(`${API}/auth/reject-user`, {
        method: 'POST',
        cache: 'no-store',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idutilisateur }),
      });

      const data = await lireReponse(res);

      if (!res.ok) {
        setMessage(data?.message || 'Rejet impossible.');
        return;
      }

      setMessage(data?.message || 'Compte rejeté avec succès.');
      await chargerComptes();
    } catch (error: any) {
      console.error(error);
      setMessage(error?.message || 'Erreur réseau avec le serveur central.');
    } finally {
      setActionId(null);
    }
  }

  useEffect(() => {
    chargerComptes();
  }, []);

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-7xl rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-emerald-950">
              Validation des comptes
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Comptes en attente d’approbation par l’administrateur central.
            </p>
          </div>

          <button
            onClick={chargerComptes}
            disabled={loading || actionId !== null}
            className="rounded-xl bg-emerald-950 px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            {loading ? 'Chargement...' : 'Actualiser'}
          </button>
        </div>

        {message && (
          <div className="mb-6 rounded-2xl bg-emerald-950 px-5 py-4 text-sm font-semibold text-white">
            {message}
          </div>
        )}

        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase tracking-wider text-slate-600">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Nom</th>
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Téléphone</th>
                <th className="px-4 py-3">Rôle</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {users.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                    Aucun compte en attente.
                  </td>
                </tr>
              )}

              {users.map((user) => (
                <tr key={user.idutilisateur} className="border-t border-slate-200">
                  <td className="px-4 py-3 font-bold">{user.idutilisateur}</td>
                  <td className="px-4 py-3">{user.nom} {user.prenom || ''}</td>
                  <td className="px-4 py-3 font-semibold">{user.nomutilisateur}</td>
                  <td className="px-4 py-3">{user.email || '-'}</td>
                  <td className="px-4 py-3">{user.telephone || '-'}</td>
                  <td className="px-4 py-3">{user.role || '-'}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold text-yellow-700">
                      {user.statut}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => approuverCompte(user.idutilisateur)}
                        disabled={actionId !== null}
                        className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
                      >
                        {actionId === user.idutilisateur ? 'Approbation...' : 'Approuver'}
                      </button>

                      <button
                        onClick={() => rejeterCompte(user.idutilisateur)}
                        disabled={actionId !== null}
                        className="rounded-lg bg-red-700 px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
                      >
                        {actionId === user.idutilisateur ? 'Traitement...' : 'Rejeter'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}