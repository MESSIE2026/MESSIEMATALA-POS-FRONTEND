'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  RotateCcw,
  RefreshCw,
  Search,
  PackageSearch,
  Truck,
  Boxes,
  XCircle,
} from 'lucide-react';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://messiematala-pos-backend-production.up.railway.app';

type Fournisseur = {
  idFournisseur: number;
  nom: string;
};

type Produit = {
  idProduit: number;
  nomProduit: string;
  refProduit?: string;
};

type Catalogue = {
  id: number;
  idFournisseur: number;
  fournisseur: string;
  idProduit: number;
  nomProduit: string;
  prixAchat: number;
  devise: string;
  delaiJours: number;
  derniereQuantite?: number;
  dernierLot?: string;
  dateExpiration?: string;
  derniereReception?: string;
  dateDerniereReception?: string;
  sourceCatalogue?: string;
  dateMaj?: string;
};

const devises = ['CDF', 'USD', 'EUR', 'ZAR'];

export default function Page() {
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [catalogue, setCatalogue] = useState<Catalogue[]>([]);

  const [idFournisseur, setIdFournisseur] = useState('');
  const [idProduit, setIdProduit] = useState('');
  const [prixAchat, setPrixAchat] = useState('');
  const [devise, setDevise] = useState('CDF');
  const [delaiJours, setDelaiJours] = useState('0');

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [recherche, setRecherche] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    chargerInitial();
  }, []);

  useEffect(() => {
    if (idFournisseur) {
      chargerCatalogue(Number(idFournisseur));
    }
  }, [idFournisseur]);

  async function chargerInitial() {
    try {
      setLoading(true);

      const [resF, resP] = await Promise.all([
        fetch(`${API_URL}/catalogue-fournisseur/fournisseurs`),
        fetch(`${API_URL}/catalogue-fournisseur/produits`),
      ]);

      const dataF = await resF.json();
      const dataP = await resP.json();

      setFournisseurs(Array.isArray(dataF) ? dataF : []);
      setProduits(Array.isArray(dataP) ? dataP : []);

      if (Array.isArray(dataF) && dataF.length > 0) {
        setIdFournisseur(String(dataF[0].idFournisseur));
      }
    } catch (error) {
      afficherErreur(error, 'Erreur chargement initial');
    } finally {
      setLoading(false);
    }
  }

  async function chargerCatalogue(fournisseurId: number) {
    try {
      setLoading(true);

      const res = await fetch(
        `${API_URL}/catalogue-fournisseur?idFournisseur=${fournisseurId}`,
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || 'Erreur chargement catalogue');
      }

      setCatalogue(Array.isArray(data) ? data : []);
    } catch (error) {
      afficherErreur(error, 'Erreur chargement catalogue');
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setSelectedId(null);
    setIdProduit(produits[0]?.idProduit ? String(produits[0].idProduit) : '');
    setPrixAchat('');
    setDevise('CDF');
    setDelaiJours('0');
    setMessage('');
  }

  function remplirForm(ligne: Catalogue) {
    setSelectedId(ligne.id);
    setIdProduit(String(ligne.idProduit));
    setPrixAchat(String(ligne.prixAchat ?? ''));
    setDevise(ligne.devise || 'CDF');
    setDelaiJours(String(ligne.delaiJours ?? 0));
  }

  function validerForm() {
    if (!idFournisseur) {
      setMessage('Sélectionnez un fournisseur.');
      return false;
    }

    if (!idProduit) {
      setMessage('Sélectionnez un produit.');
      return false;
    }

    const prix = Number(prixAchat);

    if (!prix || prix <= 0) {
      setMessage("Prix d'achat invalide.");
      return false;
    }

    if (!devise) {
      setMessage('Sélectionnez une devise.');
      return false;
    }

    return true;
  }

  async function ajouterCatalogue() {
    if (!validerForm()) return;

    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/catalogue-fournisseur`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idFournisseur: Number(idFournisseur),
          idProduit: Number(idProduit),
          prixAchat: Number(prixAchat),
          devise,
          delaiJours: Number(delaiJours || 0),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || 'Erreur ajout catalogue');
      }

      setMessage(data?.message || 'Catalogue ajouté avec succès.');
      await chargerCatalogue(Number(idFournisseur));
      resetForm();
    } catch (error) {
      afficherErreur(error, 'Erreur ajout catalogue');
    } finally {
      setLoading(false);
    }
  }

  async function modifierCatalogue() {
    if (!selectedId) {
      setMessage('Sélectionnez une ligne à modifier.');
      return;
    }

    if (!validerForm()) return;

    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/catalogue-fournisseur/${selectedId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idProduit: Number(idProduit),
          prixAchat: Number(prixAchat),
          devise,
          delaiJours: Number(delaiJours || 0),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || 'Erreur modification catalogue');
      }

      setMessage(data?.message || 'Catalogue modifié avec succès.');
      await chargerCatalogue(Number(idFournisseur));
    } catch (error) {
      afficherErreur(error, 'Erreur modification catalogue');
    } finally {
      setLoading(false);
    }
  }

  async function supprimerCatalogue() {
    if (!selectedId) {
      setMessage('Sélectionnez une ligne à supprimer.');
      return;
    }

    const ok = window.confirm(
      'Confirmer la suppression de cette ligne du catalogue fournisseur ?',
    );

    if (!ok) return;

    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/catalogue-fournisseur/${selectedId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || 'Erreur suppression catalogue');
      }

      setMessage(data?.message || 'Ligne supprimée avec succès.');
      await chargerCatalogue(Number(idFournisseur));
      resetForm();
    } catch (error) {
      afficherErreur(error, 'Erreur suppression catalogue');
    } finally {
      setLoading(false);
    }
  }

  async function synchroniserAuto() {
    if (!idFournisseur) {
      setMessage('Sélectionnez un fournisseur.');
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        `${API_URL}/catalogue-fournisseur/synchroniser/${idFournisseur}`,
        { method: 'POST' },
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || 'Erreur synchronisation');
      }

      setMessage(
        `${data?.message || 'Synchronisation terminée.'} Lignes : ${
          data?.lignesAffectees ?? 0
        }`,
      );

      await chargerCatalogue(Number(idFournisseur));
    } catch (error) {
      afficherErreur(error, 'Erreur synchronisation');
    } finally {
      setLoading(false);
    }
  }

  function afficherErreur(error: unknown, fallback: string) {
    const msg = error instanceof Error ? error.message : fallback;
    setMessage(msg);
  }

  const fournisseurActuel = fournisseurs.find(
    (f) => String(f.idFournisseur) === String(idFournisseur),
  );

  const catalogueFiltre = useMemo(() => {
    const q = recherche.trim().toLowerCase();

    if (!q) return catalogue;

    return catalogue.filter((c) =>
      [
        c.fournisseur,
        c.nomProduit,
        c.devise,
        c.sourceCatalogue,
        c.dernierLot,
        c.derniereReception,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [catalogue, recherche]);

  function formatMontant(value?: number) {
    return Number(value || 0).toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function formatDate(value?: string) {
    if (!value) return '-';

    const d = new Date(value);

    if (Number.isNaN(d.getTime())) return '-';

    return d.toLocaleDateString('fr-FR');
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mb-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Catalogue fournisseur
            </h1>
            <p className="mt-2 text-slate-500">
              Prix d’achat, produits liés aux fournisseurs et délais de livraison.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                <Boxes size={16} />
                Lignes
              </div>
              <div className="mt-1 text-2xl font-bold text-slate-900">
                {catalogueFiltre.length}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                <Truck size={16} />
                Fournisseur
              </div>
              <div className="mt-1 max-w-64 truncate text-2xl font-bold text-slate-900">
                {fournisseurActuel?.nom || '-'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {message && (
        <div className="mb-5 rounded-2xl bg-white px-5 py-4 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200">
          {message}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-5 flex items-center gap-2 text-xl font-bold text-slate-900">
            <PackageSearch size={22} />
            Formulaire
          </h2>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-bold text-slate-700">
                Fournisseur
              </label>
              <select
                value={idFournisseur}
                onChange={(e) => {
                  setIdFournisseur(e.target.value);
                  resetForm();
                }}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-900 outline-none focus:border-green-700"
              >
                <option value="">Sélectionner...</option>
                {fournisseurs.map((f) => (
                  <option key={f.idFournisseur} value={f.idFournisseur}>
                    {f.nom}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-bold text-slate-700">
                Produit
              </label>
              <select
                value={idProduit}
                onChange={(e) => setIdProduit(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-900 outline-none focus:border-green-700"
              >
                <option value="">Sélectionner...</option>
                {produits.map((p) => (
                  <option key={p.idProduit} value={p.idProduit}>
                    {p.nomProduit}
                    {p.refProduit ? ` - ${p.refProduit}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-bold text-slate-700">
                Prix d'achat
              </label>
              <input
                value={prixAchat}
                onChange={(e) => setPrixAchat(e.target.value)}
                type="number"
                min="0"
                step="0.01"
                className="h-11 w-full rounded-xl border border-slate-300 px-3 text-right text-slate-900 outline-none focus:border-green-700"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-bold text-slate-700">
                Devise
              </label>
              <select
                value={devise}
                onChange={(e) => setDevise(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-900 outline-none focus:border-green-700"
              >
                {devises.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-bold text-slate-700">
                Délai livraison / jours
              </label>
              <input
                value={delaiJours}
                onChange={(e) => setDelaiJours(e.target.value)}
                type="number"
                min="0"
                max="365"
                className="h-11 w-full rounded-xl border border-slate-300 px-3 text-right text-slate-900 outline-none focus:border-green-700"
              />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              onClick={ajouterCatalogue}
              disabled={loading}
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-green-700 font-bold text-white hover:bg-green-800 disabled:opacity-60"
            >
              <Plus size={18} />
              Ajouter
            </button>

            <button
              onClick={modifierCatalogue}
              disabled={loading}
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-700 font-bold text-white hover:bg-blue-800 disabled:opacity-60"
            >
              <Pencil size={18} />
              Modifier
            </button>

            <button
              onClick={resetForm}
              disabled={loading}
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-600 font-bold text-white hover:bg-slate-700 disabled:opacity-60"
            >
              <RotateCcw size={18} />
              Nouveau
            </button>

            <button
              onClick={supprimerCatalogue}
              disabled={loading}
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-red-800 font-bold text-white hover:bg-red-900 disabled:opacity-60"
            >
              <Trash2 size={18} />
              Supprimer
            </button>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Recherche produit, fournisseur, devise..."
                className="h-11 w-full rounded-xl border border-slate-300 pl-10 pr-3 text-slate-900 outline-none focus:border-green-700"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={synchroniserAuto}
                disabled={loading}
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-sky-700 px-4 font-bold text-white hover:bg-sky-800 disabled:opacity-60"
              >
                <RefreshCw size={18} />
                Synchro auto
              </button>

              <button
                onClick={() => window.history.back()}
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-600 px-4 font-bold text-white hover:bg-slate-700"
              >
                <XCircle size={18} />
                Fermer
              </button>
            </div>
          </div>

          <div className="overflow-auto rounded-2xl border border-slate-200">
            <table className="min-w-[1250px] w-full text-sm">
              <thead className="bg-slate-900 text-white">
                <tr>
                  <th className="px-4 py-3 text-left">Fournisseur</th>
                  <th className="px-4 py-3 text-left">Produit</th>
                  <th className="px-4 py-3 text-right">Prix achat</th>
                  <th className="px-4 py-3 text-center">Devise</th>
                  <th className="px-4 py-3 text-center">Délai</th>
                  <th className="px-4 py-3 text-right">Dernière Qté</th>
                  <th className="px-4 py-3 text-left">Lot/Série</th>
                  <th className="px-4 py-3 text-center">Expiration</th>
                  <th className="px-4 py-3 text-left">Dernière réception</th>
                  <th className="px-4 py-3 text-center">Date réception</th>
                  <th className="px-4 py-3 text-center">Source</th>
                  <th className="px-4 py-3 text-center">Date MAJ</th>
                </tr>
              </thead>

              <tbody>
                {catalogueFiltre.map((ligne) => (
                  <tr
                    key={ligne.id}
                    onClick={() => remplirForm(ligne)}
                    className={`cursor-pointer border-t border-slate-200 hover:bg-green-50 ${
                      selectedId === ligne.id ? 'bg-green-100' : 'bg-white'
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {ligne.fournisseur}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {ligne.nomProduit}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">
                      {formatMontant(ligne.prixAchat)}
                    </td>
                    <td className="px-4 py-3 text-center">{ligne.devise}</td>
                    <td className="px-4 py-3 text-center">
                      {ligne.delaiJours ?? 0} j
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatMontant(ligne.derniereQuantite)}
                    </td>
                    <td className="px-4 py-3">{ligne.dernierLot || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      {formatDate(ligne.dateExpiration)}
                    </td>
                    <td className="px-4 py-3">
                      {ligne.derniereReception || '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {formatDate(ligne.dateDerniereReception)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                        {ligne.sourceCatalogue || 'MANUEL'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {formatDate(ligne.dateMaj)}
                    </td>
                  </tr>
                ))}

                {catalogueFiltre.length === 0 && (
                  <tr>
                    <td
                      colSpan={12}
                      className="px-4 py-10 text-center text-slate-500"
                    >
                      Aucune ligne trouvée.
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