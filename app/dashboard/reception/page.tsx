'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Package,
  Truck,
  FileText,
  CheckCircle2,
  RefreshCcw,
  Search,
  Plus,
  Download,
  Trash2,
  Eye,
  UploadCloud,
  Check,
  AlertCircle,
} from 'lucide-react';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://messiematala-pos-backend-production.up.railway.app';

type Devise = 'CDF' | 'USD';

interface Fournisseur {
  idFournisseur: number;
  nom: string;
}

interface Depot {
  idDepot: number;
  nomDepot: string;
}

interface Produit {
  idProduit: number;
  nomProduit: string;
  refProduit?: string;
}

interface BonCommande {
  idBc: number;
  numeroBc: string;
  fournisseur: string;
  magasin: string;
  statut: string;
}

interface Reception {
  idReception: number;
  numeroReception: string;
  dateReception: string;
  fournisseur: string;
  depot: string;
  numeroBc: string;
  statut: string;
  nbLignes: number;
  total: number;
}

interface LigneReception {
  idLigne: number;
  idProduit: number;
  produit: string;
  reference: string;
  qte: number;
  prixAchat: number;
  devise: Devise;
  lot: string;
  dateExpiration?: string | null;
  total: number;
}

interface DetailReception {
  entete: Reception & {
    idReception: number;
    idFournisseur: number;
    idDepot: number;
    idBc?: number | null;
    creePar?: string;
    validePar?: string;
  };
  lignes: LigneReception[];
}

export default function Page() {
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);

  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [erreur, setErreur] = useState('');

  const [receptions, setReceptions] = useState<Reception[]>([]);
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [depots, setDepots] = useState<Depot[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [bonsCommande, setBonsCommande] = useState<BonCommande[]>([]);

  const [detail, setDetail] = useState<DetailReception | null>(null);

  const [formReception, setFormReception] = useState({
    idFournisseur: '',
    idDepot: '',
    idBc: '',
    dateReception: new Date().toISOString().slice(0, 10),
    numeroReception: `REC-${Date.now()}`,
  });

  const [ligne, setLigne] = useState({
    idProduit: '',
    qteRecueBase: 1,
    prixAchat: 0,
    devise: 'CDF' as Devise,
    lotNumero: '',
    avecExpiration: false,
    dateExpiration: new Date().toISOString().slice(0, 10),
  });

  const [moisPdf, setMoisPdf] = useState(
    new Date().toISOString().slice(0, 7),
  );

  const idEntreprise =
    typeof window !== 'undefined'
      ? Number(localStorage.getItem('ZAIRE_ID_ENTREPRISE') || 1)
      : 1;

  const idMagasin =
    typeof window !== 'undefined'
      ? Number(localStorage.getItem('ZAIRE_ID_MAGASIN') || 1)
      : 1;

  const utilisateur =
    typeof window !== 'undefined'
      ? localStorage.getItem('ZAIRE_NOM_UTILISATEUR') || 'Utilisateur POS'
      : 'Utilisateur POS';

  function notifierSucces(txt: string) {
    setMessage(txt);
    setErreur('');
    setTimeout(() => setMessage(''), 4500);
  }

  function notifierErreur(txt: string) {
    setErreur(txt);
    setMessage('');
    setTimeout(() => setErreur(''), 6000);
  }

  async function apiFetch(url: string, options?: RequestInit) {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-zaire-entreprise': String(idEntreprise),
        'x-zaire-magasin': String(idMagasin),
        ...(options?.headers || {}),
      },
    });

    const text = await res.text();
    const data = text ? JSON.parse(text) : null;

    if (!res.ok) {
      throw new Error(data?.message || 'Erreur serveur');
    }

    return data;
  }

  async function chargerLookups() {
    const data = await apiFetch(
      `${API_URL}/reception/lookups?idEntreprise=${idEntreprise}`,
    );

    setFournisseurs(data.fournisseurs || []);
    setDepots(data.depots || []);
    setProduits(data.produits || []);
    setBonsCommande(data.bonsCommande || []);

    setFormReception((old) => ({
      ...old,
      idFournisseur:
        old.idFournisseur || String(data.fournisseurs?.[0]?.idFournisseur || ''),
      idDepot: old.idDepot || String(data.depots?.[0]?.idDepot || ''),
    }));
  }

  async function charger() {
    try {
      setLoading(true);

      const data = await apiFetch(
        `${API_URL}/reception?idEntreprise=${idEntreprise}&idMagasin=${idMagasin}&search=${encodeURIComponent(
          search,
        )}`,
      );

      setReceptions(Array.isArray(data) ? data : []);
    } catch (e: any) {
      notifierErreur(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function chargerBrouillon() {
    try {
      const data = await apiFetch(
        `${API_URL}/reception/brouillon?idEntreprise=${idEntreprise}&idMagasin=${idMagasin}`,
      );

      if (data?.idReception) {
        await ouvrirDetails(data.idReception);
      }
    } catch {
      // silencieux
    }
  }

  async function ouvrirDetails(idReception: number) {
    try {
      setLoadingAction(true);

      const data = await apiFetch(
        `${API_URL}/reception/${idReception}/details`,
      );

      setDetail(data);
    } catch (e: any) {
      notifierErreur(e.message);
    } finally {
      setLoadingAction(false);
    }
  }

  async function creerReception() {
    try {
      if (!formReception.idFournisseur || !formReception.idDepot) {
        notifierErreur('Fournisseur et dépôt obligatoires.');
        return;
      }

      setLoadingAction(true);

      const created = await apiFetch(`${API_URL}/reception`, {
        method: 'POST',
        body: JSON.stringify({
          numeroReception: formReception.numeroReception,
          idBc: formReception.idBc ? Number(formReception.idBc) : null,
          idFournisseur: Number(formReception.idFournisseur),
          idDepot: Number(formReception.idDepot),
          dateReception: formReception.dateReception,
          creePar: utilisateur,
          idEntreprise,
          idMagasin,
        }),
      });

      notifierSucces('Réception créée avec succès.');
      await charger();
      await ouvrirDetails(created.idReception);
    } catch (e: any) {
      notifierErreur(e.message);
    } finally {
      setLoadingAction(false);
    }
  }

  async function ajouterLigne() {
    try {
      if (!detail?.entete?.idReception) {
        notifierErreur('Crée ou sélectionne d’abord une réception.');
        return;
      }

      if (!ligne.idProduit) {
        notifierErreur('Produit obligatoire.');
        return;
      }

      if (Number(ligne.qteRecueBase) <= 0) {
        notifierErreur('La quantité doit être supérieure à zéro.');
        return;
      }

      setLoadingAction(true);

      await apiFetch(
        `${API_URL}/reception/${detail.entete.idReception}/lignes`,
        {
          method: 'POST',
          body: JSON.stringify({
            idProduit: Number(ligne.idProduit),
            qteRecueBase: Number(ligne.qteRecueBase),
            prixAchat: Number(ligne.prixAchat || 0),
            devise: ligne.devise,
            lotNumero: ligne.lotNumero || null,
            dateExpiration: ligne.avecExpiration
              ? ligne.dateExpiration
              : null,
          }),
        },
      );

      notifierSucces('Ligne ajoutée.');
      setLigne((old) => ({
        ...old,
        idProduit: '',
        qteRecueBase: 1,
        prixAchat: 0,
        lotNumero: '',
        avecExpiration: false,
      }));

      await ouvrirDetails(detail.entete.idReception);
      await charger();
    } catch (e: any) {
      notifierErreur(e.message);
    } finally {
      setLoadingAction(false);
    }
  }

  async function supprimerLigne(idLigne: number) {
    try {
      const ok = window.confirm('Supprimer cette ligne de réception ?');
      if (!ok) return;

      setLoadingAction(true);

      await apiFetch(`${API_URL}/reception/lignes/${idLigne}`, {
        method: 'DELETE',
      });

      notifierSucces('Ligne supprimée.');

      if (detail?.entete?.idReception) {
        await ouvrirDetails(detail.entete.idReception);
      }

      await charger();
    } catch (e: any) {
      notifierErreur(e.message);
    } finally {
      setLoadingAction(false);
    }
  }

  async function importerBC() {
    try {
      if (!detail?.entete?.idReception) {
        notifierErreur('Sélectionne une réception.');
        return;
      }

      setLoadingAction(true);

      const data = await apiFetch(
        `${API_URL}/reception/${detail.entete.idReception}/importer-bc`,
        { method: 'POST' },
      );

      notifierSucces(`${data.lignesImportees || 0} ligne(s) importée(s).`);
      await ouvrirDetails(detail.entete.idReception);
      await charger();
    } catch (e: any) {
      notifierErreur(e.message);
    } finally {
      setLoadingAction(false);
    }
  }

  async function validerReception() {
    try {
      if (!detail?.entete?.idReception) {
        notifierErreur('Sélectionne une réception.');
        return;
      }

      const ok = window.confirm(
        'Valider cette réception ?\n\nLe stock sera augmenté, les lots seront créés et la facture fournisseur sera générée.',
      );

      if (!ok) return;

      setLoadingAction(true);

      await apiFetch(
        `${API_URL}/reception/${detail.entete.idReception}/valider`,
        {
          method: 'POST',
          body: JSON.stringify({ utilisateur }),
        },
      );

      notifierSucces('Réception validée. Stock mis à jour.');
      await ouvrirDetails(detail.entete.idReception);
      await charger();
    } catch (e: any) {
      notifierErreur(e.message);
    } finally {
      setLoadingAction(false);
    }
  }

  function ouvrirPdf(idReception: number) {
    window.open(`${API_URL}/reception/${idReception}/pdf`, '_blank');
  }

  function ouvrirPdfMensuel() {
    window.open(
      `${API_URL}/reception/pdf-mensuel?mois=${moisPdf}&idEntreprise=${idEntreprise}`,
      '_blank',
    );
  }

  useEffect(() => {
    chargerLookups();
    charger();
    chargerBrouillon();
  }, []);

  const stats = useMemo(() => {
    return {
      total: receptions.length,
      validees: receptions.filter((x) =>
        x.statut?.toUpperCase().includes('VALID'),
      ).length,
      brouillons: receptions.filter(
        (x) => !x.statut?.toUpperCase().includes('VALID'),
      ).length,
      montant: receptions.reduce((a, b) => a + Number(b.total || 0), 0),
    };
  }, [receptions]);

  const receptionValidee = detail?.entete?.statut
    ?.toUpperCase()
    .includes('VALID');

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {(message || erreur) && (
          <div
            className={`rounded-2xl p-4 text-sm font-semibold ${
              message
                ? 'bg-green-50 text-green-800 ring-1 ring-green-200'
                : 'bg-red-50 text-red-800 ring-1 ring-red-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {message ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              {message || erreur}
            </div>
          </div>
        )}

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-3xl font-bold text-slate-900">
                <Truck className="h-8 w-8 text-green-700" />
                Réceptions Fournisseurs
              </h1>

              <p className="mt-2 text-slate-500">
                Réception BC, lots, expiration, stock, facture fournisseur,
                audit et PDF.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() =>
                  setFormReception((old) => ({
                    ...old,
                    numeroReception: `REC-${Date.now()}`,
                    dateReception: new Date().toISOString().slice(0, 10),
                  }))
                }
                className="flex items-center gap-2 rounded-xl bg-green-700 px-4 py-3 text-white"
              >
                <Plus size={18} />
                Nouveau
              </button>

              <button
                onClick={charger}
                className="flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-white"
              >
                <RefreshCcw size={18} />
                Actualiser
              </button>

              <button
                onClick={ouvrirPdfMensuel}
                className="flex items-center gap-2 rounded-xl bg-red-700 px-4 py-3 text-white"
              >
                <Download size={18} />
                PDF Mensuel
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <StatCard icon={<Package />} label="Réceptions" value={stats.total} />
          <StatCard icon={<CheckCircle2 />} label="Validées" value={stats.validees} />
          <StatCard icon={<FileText />} label="Brouillons" value={stats.brouillons} />
          <StatCard
            icon={<Truck />}
            label="Valeur reçue"
            value={stats.montant.toLocaleString()}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-3">

          <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 xl:col-span-1">
            <h2 className="text-lg font-bold text-slate-900">
              Créer une réception
            </h2>

            <div className="mt-4 space-y-3">
              <Input
                label="N° Réception"
                value={formReception.numeroReception}
                onChange={(v) =>
                  setFormReception({ ...formReception, numeroReception: v })
                }
              />

              <Input
                label="Date réception"
                type="date"
                value={formReception.dateReception}
                onChange={(v) =>
                  setFormReception({ ...formReception, dateReception: v })
                }
              />

              <Select
                label="Fournisseur"
                value={formReception.idFournisseur}
                onChange={(v) =>
                  setFormReception({ ...formReception, idFournisseur: v })
                }
              >
                {fournisseurs.map((f) => (
                  <option key={f.idFournisseur} value={f.idFournisseur}>
                    {f.nom}
                  </option>
                ))}
              </Select>

              <Select
                label="Dépôt"
                value={formReception.idDepot}
                onChange={(v) =>
                  setFormReception({ ...formReception, idDepot: v })
                }
              >
                {depots.map((d) => (
                  <option key={d.idDepot} value={d.idDepot}>
                    {d.nomDepot}
                  </option>
                ))}
              </Select>

              <Select
                label="Bon de Commande"
                value={formReception.idBc}
                onChange={(v) =>
                  setFormReception({ ...formReception, idBc: v })
                }
              >
                <option value="">— Réception sans BC —</option>
                {bonsCommande.map((bc) => (
                  <option key={bc.idBc} value={bc.idBc}>
                    {bc.numeroBc} | {bc.fournisseur} | {bc.statut}
                  </option>
                ))}
              </Select>

              <button
                onClick={creerReception}
                disabled={loadingAction}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-green-700 px-4 py-3 font-semibold text-white disabled:opacity-60"
              >
                <Plus size={18} />
                Créer réception
              </button>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 xl:col-span-2">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                Ajouter une ligne
              </h2>

              {detail?.entete && (
                <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                  Active : {detail.entete.numeroReception}
                </span>
              )}
            </div>

            {!detail?.entete && (
              <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-800 ring-1 ring-amber-200">
                Crée ou sélectionne une réception avant d’ajouter les produits.
              </p>
            )}

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <Select
                label="Produit"
                value={ligne.idProduit}
                onChange={(v) => setLigne({ ...ligne, idProduit: v })}
              >
                <option value="">— Sélectionner —</option>
                {produits.map((p) => (
                  <option key={p.idProduit} value={p.idProduit}>
                    {p.nomProduit} {p.refProduit ? `(${p.refProduit})` : ''}
                  </option>
                ))}
              </Select>

              <Input
                label="Quantité reçue"
                type="number"
                value={String(ligne.qteRecueBase)}
                onChange={(v) =>
                  setLigne({ ...ligne, qteRecueBase: Number(v) })
                }
              />

              <Input
                label="Prix achat"
                type="number"
                value={String(ligne.prixAchat)}
                onChange={(v) =>
                  setLigne({ ...ligne, prixAchat: Number(v) })
                }
              />

              <Select
                label="Devise"
                value={ligne.devise}
                onChange={(v) => setLigne({ ...ligne, devise: v as Devise })}
              >
                <option value="CDF">CDF</option>
                <option value="USD">USD</option>
              </Select>

              <Input
                label="Lot / Série"
                value={ligne.lotNumero}
                onChange={(v) => setLigne({ ...ligne, lotNumero: v })}
              />

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Expiration
                </label>

                <div className="flex gap-2">
                  <label className="flex items-center gap-2 rounded-xl border px-3 py-3">
                    <input
                      type="checkbox"
                      checked={ligne.avecExpiration}
                      onChange={(e) =>
                        setLigne({
                          ...ligne,
                          avecExpiration: e.target.checked,
                        })
                      }
                    />
                    Oui
                  </label>

                  <input
                    type="date"
                    disabled={!ligne.avecExpiration}
                    value={ligne.dateExpiration}
                    onChange={(e) =>
                      setLigne({
                        ...ligne,
                        dateExpiration: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-3 outline-none disabled:bg-slate-100"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={ajouterLigne}
                disabled={loadingAction || !detail?.entete || receptionValidee}
                className="flex items-center gap-2 rounded-xl bg-green-700 px-4 py-3 font-semibold text-white disabled:opacity-50"
              >
                <Plus size={18} />
                Ajouter ligne
              </button>

              <button
                onClick={importerBC}
                disabled={loadingAction || !detail?.entete || receptionValidee}
                className="flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white disabled:opacity-50"
              >
                <UploadCloud size={18} />
                Importer lignes BC
              </button>

              <button
                onClick={validerReception}
                disabled={loadingAction || !detail?.entete || receptionValidee}
                className="flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white disabled:opacity-50"
              >
                <Check size={18} />
                Valider réception
              </button>

              {detail?.entete && (
                <button
                  onClick={() => ouvrirPdf(detail.entete.idReception)}
                  className="flex items-center gap-2 rounded-xl bg-red-700 px-4 py-3 font-semibold text-white"
                >
                  <Download size={18} />
                  PDF réception
                </button>
              )}
            </div>
          </section>
        </div>

        {detail?.entete && (
          <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Détails réception : {detail.entete.numeroReception}
                </h2>

                <p className="text-sm text-slate-500">
                  Fournisseur : {detail.entete.fournisseur} · Dépôt :{' '}
                  {detail.entete.depot} · Statut : {detail.entete.statut}
                </p>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left">Produit</th>
                    <th className="px-4 py-3 text-left">Référence</th>
                    <th className="px-4 py-3 text-right">Qté</th>
                    <th className="px-4 py-3 text-right">PU</th>
                    <th className="px-4 py-3 text-left">Devise</th>
                    <th className="px-4 py-3 text-left">Lot</th>
                    <th className="px-4 py-3 text-left">Expiration</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {detail.lignes.map((l) => (
                    <tr key={l.idLigne} className="border-t">
                      <td className="px-4 py-3 font-semibold">{l.produit}</td>
                      <td className="px-4 py-3">{l.reference || '-'}</td>
                      <td className="px-4 py-3 text-right">{l.qte}</td>
                      <td className="px-4 py-3 text-right">
                        {Number(l.prixAchat || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">{l.devise}</td>
                      <td className="px-4 py-3">{l.lot || '-'}</td>
                      <td className="px-4 py-3">
                        {l.dateExpiration
                          ? new Date(l.dateExpiration).toLocaleDateString()
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {Number(l.total || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => supprimerLigne(l.idLigne)}
                          disabled={receptionValidee}
                          className="rounded-lg bg-red-700 px-3 py-2 text-white disabled:opacity-40"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {detail.lignes.length === 0 && (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-4 py-6 text-center text-slate-500"
                      >
                        Aucune ligne dans cette réception.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              Historique des réceptions
            </h2>

            <div className="flex gap-2">
              <input
                type="month"
                value={moisPdf}
                onChange={(e) => setMoisPdf(e.target.value)}
                className="rounded-xl border border-slate-300 px-3 py-2"
              />

              <button
                onClick={ouvrirPdfMensuel}
                className="rounded-xl bg-red-700 px-4 py-2 font-semibold text-white"
              >
                PDF mois
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-3 text-slate-400"
              />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Numéro réception, fournisseur, dépôt, BC..."
                className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-3 outline-none"
              />
            </div>

            <button
              onClick={charger}
              className="rounded-xl bg-slate-800 px-5 py-3 text-white"
            >
              Rechercher
            </button>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left">N°</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Fournisseur</th>
                  <th className="px-4 py-3 text-left">Dépôt</th>
                  <th className="px-4 py-3 text-left">BC</th>
                  <th className="px-4 py-3 text-center">Lignes</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-center">Statut</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>

              <tbody>
                {receptions.map((r) => (
                  <tr key={r.idReception} className="border-t">
                    <td className="px-4 py-3 font-semibold">
                      {r.numeroReception}
                    </td>

                    <td className="px-4 py-3">
                      {new Date(r.dateReception).toLocaleDateString()}
                    </td>

                    <td className="px-4 py-3">{r.fournisseur}</td>
                    <td className="px-4 py-3">{r.depot}</td>
                    <td className="px-4 py-3">{r.numeroBc || '-'}</td>
                    <td className="px-4 py-3 text-center">{r.nbLignes}</td>

                    <td className="px-4 py-3 text-right">
                      {Number(r.total || 0).toLocaleString()}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          r.statut?.toUpperCase().includes('VALID')
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {r.statut}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => ouvrirDetails(r.idReception)}
                          className="rounded-lg bg-blue-700 px-3 py-2 text-white"
                        >
                          <Eye size={16} />
                        </button>

                        <button
                          onClick={() => ouvrirPdf(r.idReception)}
                          className="rounded-lg bg-green-700 px-3 py-2 text-white"
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {!loading && receptions.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-8 text-center text-slate-500"
                    >
                      Aucune réception trouvée.
                    </td>
                  </tr>
                )}

                {loading && (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-8 text-center text-slate-500"
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

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between">
        <div className="text-green-700">{icon}</div>
        <span className="text-2xl font-bold text-slate-900">{value}</span>
      </div>

      <p className="mt-3 text-sm text-slate-500">{label}</p>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-slate-700">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-300 px-3 py-3 outline-none focus:border-green-700"
      />
    </label>
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
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-slate-700">
        {label}
      </span>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-300 px-3 py-3 outline-none focus:border-green-700"
      >
        {children}
      </select>
    </label>
  );
}