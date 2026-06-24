'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Download,
  Eye,
  FileText,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  Truck,
} from 'lucide-react';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://messiematala-pos-backend-production.up.railway.app';

type Devise = 'CDF' | 'USD' | 'EUR';

interface Facture {
  idFacture: number;
  numeroFacture: string;
  dateFacture: string;
  dateEcheance?: string | null;
  fournisseur: string;
  devise: Devise;
  total: number;
  montantPaye: number;
  reste: number;
  statutPaiement: string;
  statut: string;
  creePar?: string;
}

interface LigneFacture {
  idDetail: number;
  designation: string;
  quantite: number;
  unite: string;
  prixUnitaire: number;
  total: number;
  devise: Devise;
}

interface Paiement {
  idPaiement: number;
  datePaiement: string;
  montant: number;
  devise: Devise;
  modePaiement: string;
  reference?: string;
  observation?: string;
  creePar?: string;
}

interface DetailFacture {
  entete: Facture & {
    idFacture: number;
    numeroReception?: string;
    telephone?: string;
    email?: string;
    adresse?: string;
  };
  lignes: LigneFacture[];
  paiements: Paiement[];
}

export default function Page() {
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);

  const [message, setMessage] = useState('');
  const [erreur, setErreur] = useState('');

  const [factures, setFactures] = useState<Facture[]>([]);
  const [detail, setDetail] = useState<DetailFacture | null>(null);

  const [search, setSearch] = useState('');
  const [statut, setStatut] = useState('');
  const [devise, setDevise] = useState('');

  const [paiement, setPaiement] = useState({
    montant: '',
    devise: 'CDF' as Devise,
    modePaiement: 'Cash',
    reference: '',
    observation: '',
    datePaiement: new Date().toISOString().slice(0, 10),
  });

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

  async function charger() {
    try {
      setLoading(true);

      const data = await apiFetch(
        `${API_URL}/facture-fournisseur?idEntreprise=${idEntreprise}&idMagasin=${idMagasin}&search=${encodeURIComponent(
          search,
        )}&statut=${encodeURIComponent(statut)}&devise=${encodeURIComponent(
          devise,
        )}`,
      );

      setFactures(Array.isArray(data) ? data : []);
    } catch (e: any) {
      notifierErreur(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function ouvrirDetails(idFacture: number, bloquerBouton = true) {
  try {
    if (bloquerBouton) setLoadingAction(true);

    const data = await apiFetch(
      `${API_URL}/facture-fournisseur/${idFacture}/details`,
    );

    setDetail(data);

    setPaiement((old) => ({
      ...old,
      montant: String(Number(data?.entete?.reste || 0)),
      devise: data?.entete?.devise || 'CDF',
    }));
  } catch (e: any) {
    notifierErreur(e.message);
  } finally {
    if (bloquerBouton) setLoadingAction(false);
  }
}

  async function enregistrerPaiement() {
  try {
    if (!detail?.entete?.idFacture) {
      notifierErreur('Sélectionne une facture.');
      return;
    }

    const idFacture = detail.entete.idFacture;
    const montant = Number(paiement.montant || 0);

    if (montant <= 0) {
      notifierErreur('Montant paiement invalide.');
      return;
    }

    setLoadingAction(true);

    await apiFetch(`${API_URL}/facture-fournisseur/${idFacture}/paiements`, {
      method: 'POST',
      body: JSON.stringify({
        montant,
        devise: paiement.devise,
        modePaiement: paiement.modePaiement,
        reference: paiement.reference || null,
        observation: paiement.observation || null,
        datePaiement: paiement.datePaiement,
        creePar: utilisateur,
      }),
    });

    notifierSucces('Paiement fournisseur enregistré.');

    setPaiement((old) => ({
      ...old,
      montant: '',
      reference: '',
      observation: '',
    }));

    setLoadingAction(false);

    ouvrirDetails(idFacture, false);
    charger();
  } catch (e: any) {
    notifierErreur(e.message);
    setLoadingAction(false);
  }
}

  async function supprimerPaiement(idPaiement: number) {
    try {
      const ok = window.confirm('Supprimer ce paiement fournisseur ?');
      if (!ok) return;

      setLoadingAction(true);

      await apiFetch(`${API_URL}/facture-fournisseur/paiements/${idPaiement}`, {
        method: 'DELETE',
      });

      notifierSucces('Paiement supprimé.');

      if (detail?.entete?.idFacture) {
        await ouvrirDetails(detail.entete.idFacture);
      }

      await charger();
    } catch (e: any) {
      notifierErreur(e.message);
    } finally {
      setLoadingAction(false);
    }
  }

  async function ouvrirPdfFacture(idFacture: number) {
  const response = await fetch(
    `${API_URL}/facture-fournisseur/${idFacture}/pdf`,
  );

  const blob = await response.blob();

  const url = window.URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `Facture-Fournisseur-${idFacture}.pdf`;

  document.body.appendChild(a);
  a.click();
  a.remove();

  window.URL.revokeObjectURL(url);
}

  async function ouvrirPdfDettes() {
  const response = await fetch(
    `${API_URL}/facture-fournisseur/pdf/dettes?idEntreprise=${idEntreprise}&idMagasin=${idMagasin}&search=${encodeURIComponent(search)}`
  );

  if (!response.ok) {
    throw new Error('Erreur génération PDF dettes');
  }

  const blob = await response.blob();

  const url = window.URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `Dettes-Fournisseurs-${new Date()
    .toISOString()
    .slice(0, 10)}.pdf`;

  document.body.appendChild(a);
  a.click();
  a.remove();

  window.URL.revokeObjectURL(url);
}

  useEffect(() => {
    charger();
  }, []);

  const stats = useMemo(() => {
    return {
      total: factures.length,
      nonPayees: factures.filter((x) => x.statutPaiement === 'NON PAYÉE')
        .length,
      partielles: factures.filter((x) => x.statutPaiement === 'PARTIELLE')
        .length,
      payees: factures.filter((x) => x.statutPaiement === 'PAYÉE').length,
      dettes: factures.reduce((a, b) => a + Number(b.reste || 0), 0),
    };
  }, [factures]);

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

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-2xl font-bold text-slate-900 md:text-3xl">
                <Truck className="h-8 w-8 text-green-700" />
                Factures Fournisseurs
              </h1>
              <p className="mt-2 text-sm text-slate-500 md:text-base">
                Dettes fournisseurs, paiements, historique, PDF facture et PDF
                dettes.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={charger}
                className="flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white"
              >
                <RefreshCcw size={18} />
                Actualiser
              </button>

              <button
                onClick={ouvrirPdfDettes}
                className="flex items-center gap-2 rounded-xl bg-red-700 px-4 py-3 font-semibold text-white"
              >
                <Download size={18} />
                PDF Dettes
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard icon={<FileText />} label="Factures" value={stats.total} />
          <StatCard
            icon={<AlertCircle />}
            label="Non payées"
            value={stats.nonPayees}
          />
          <StatCard
            icon={<CreditCard />}
            label="Partielles"
            value={stats.partielles}
          />
          <StatCard
            icon={<CheckCircle2 />}
            label="Payées"
            value={stats.payees}
          />
          <StatCard
            icon={<Truck />}
            label="Dette totale"
            value={stats.dettes.toLocaleString('fr-FR')}
          />
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="relative md:col-span-2">
              <Search
                size={18}
                className="absolute left-3 top-3.5 text-slate-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="N° facture, fournisseur..."
                className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-3 outline-none focus:border-green-700"
              />
            </div>

            <select
              value={statut}
              onChange={(e) => setStatut(e.target.value)}
              className="rounded-xl border border-slate-300 px-3 py-3 outline-none focus:border-green-700"
            >
              <option value="">Tous les statuts</option>
              <option value="NON PAYÉE">NON PAYÉE</option>
              <option value="PARTIELLE">PARTIELLE</option>
              <option value="PAYÉE">PAYÉE</option>
            </select>

            <select
              value={devise}
              onChange={(e) => setDevise(e.target.value)}
              className="rounded-xl border border-slate-300 px-3 py-3 outline-none focus:border-green-700"
            >
              <option value="">Toutes devises</option>
              <option value="CDF">CDF</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={charger}
              className="rounded-xl bg-slate-800 px-5 py-3 font-semibold text-white"
            >
              Rechercher
            </button>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-3">
          <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 xl:col-span-2">
            <h2 className="text-lg font-bold text-slate-900">
              Liste des factures
            </h2>

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left">N° Facture</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Fournisseur</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-right">Payé</th>
                    <th className="px-4 py-3 text-right">Reste</th>
                    <th className="px-4 py-3 text-center">Statut</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {factures.map((f) => (
                    <tr key={f.idFacture} className="border-t">
                      <td className="px-4 py-3 font-semibold">
                        {f.numeroFacture}
                      </td>
                      <td className="px-4 py-3">
                        {new Date(f.dateFacture).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3">{f.fournisseur}</td>
                      <td className="px-4 py-3 text-right">
                        {Number(f.total || 0).toLocaleString('fr-FR')}{' '}
                        {f.devise}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {Number(f.montantPaye || 0).toLocaleString('fr-FR')}{' '}
                        {f.devise}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-red-700">
                        {Number(f.reste || 0).toLocaleString('fr-FR')}{' '}
                        {f.devise}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            f.statutPaiement === 'PAYÉE'
                              ? 'bg-green-100 text-green-700'
                              : f.statutPaiement === 'PARTIELLE'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {f.statutPaiement}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => ouvrirDetails(f.idFacture)}
                            className="rounded-lg bg-blue-700 px-3 py-2 text-white"
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            onClick={() => ouvrirPdfFacture(f.idFacture)}
                            className="rounded-lg bg-green-700 px-3 py-2 text-white"
                          >
                            <Download size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {!loading && factures.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-8 text-center text-slate-500"
                      >
                        Aucune facture fournisseur trouvée.
                      </td>
                    </tr>
                  )}

                  {loading && (
                    <tr>
                      <td
                        colSpan={8}
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

          <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-lg font-bold text-slate-900">
              Paiement fournisseur
            </h2>

            {!detail?.entete && (
              <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-800 ring-1 ring-amber-200">
                Sélectionne une facture pour enregistrer un paiement.
              </p>
            )}

            {detail?.entete && (
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl bg-slate-50 p-4 text-sm">
                  <p className="font-bold text-slate-900">
                    {detail.entete.numeroFacture}
                  </p>
                  <p className="text-slate-600">
                    {detail.entete.fournisseur}
                  </p>
                  <p className="mt-2 font-semibold text-red-700">
                    Reste :{' '}
                    {Number(detail.entete.reste || 0).toLocaleString('fr-FR')}{' '}
                    {detail.entete.devise}
                  </p>
                </div>

                <Input
                  label="Montant payé"
                  type="number"
                  value={paiement.montant}
                  onChange={(v) => setPaiement({ ...paiement, montant: v })}
                />

                <Select
                  label="Devise"
                  value={paiement.devise}
                  onChange={(v) =>
                    setPaiement({ ...paiement, devise: v as Devise })
                  }
                >
                  <option value="CDF">CDF</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </Select>

                <Select
                  label="Mode paiement"
                  value={paiement.modePaiement}
                  onChange={(v) =>
                    setPaiement({ ...paiement, modePaiement: v })
                  }
                >
                  <option value="Cash">Cash</option>
                  <option value="Mobile Money">Mobile Money</option>
                  <option value="Banque">Banque</option>
                  <option value="Carte">Carte</option>
                  <option value="Chèque">Chèque</option>
                  <option value="Autre">Autre</option>
                </Select>

                <Input
                  label="Référence"
                  value={paiement.reference}
                  onChange={(v) => setPaiement({ ...paiement, reference: v })}
                />

                <Input
                  label="Date paiement"
                  type="date"
                  value={paiement.datePaiement}
                  onChange={(v) =>
                    setPaiement({ ...paiement, datePaiement: v })
                  }
                />

                <Input
                  label="Observation"
                  value={paiement.observation}
                  onChange={(v) =>
                    setPaiement({ ...paiement, observation: v })
                  }
                />

                <button
                  onClick={enregistrerPaiement}
                  disabled={loadingAction || !Number(paiement.montant || 0)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-700 px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus size={18} />
                  {loadingAction ? 'Enregistrement...' : 'Enregistrer paiement'}
                </button>

                <button
                  onClick={() => ouvrirPdfFacture(detail.entete.idFacture)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-700 px-4 py-3 font-semibold text-white"
                >
                  <Download size={18} />
                  PDF Facture
                </button>
              </div>
            )}
          </section>
        </div>

        {detail?.entete && (
          <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-lg font-bold text-slate-900">
              Détails facture : {detail.entete.numeroFacture}
            </h2>

            <div className="mt-4 grid gap-6 xl:grid-cols-2">
              <div className="overflow-x-auto">
                <h3 className="mb-3 font-bold text-slate-800">
                  Lignes facture
                </h3>

                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left">Désignation</th>
                      <th className="px-4 py-3 text-right">Qté</th>
                      <th className="px-4 py-3 text-right">PU</th>
                      <th className="px-4 py-3 text-right">Total</th>
                    </tr>
                  </thead>

                  <tbody>
                    {detail.lignes.map((l) => (
                      <tr key={l.idDetail} className="border-t">
                        <td className="px-4 py-3 font-semibold">
                          {l.designation}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {l.quantite} {l.unite}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {Number(l.prixUnitaire || 0).toLocaleString('fr-FR')}
                        </td>
                        <td className="px-4 py-3 text-right font-bold">
                          {Number(l.total || 0).toLocaleString('fr-FR')}{' '}
                          {l.devise}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="overflow-x-auto">
                <h3 className="mb-3 font-bold text-slate-800">
                  Historique paiements
                </h3>

                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-right">Montant</th>
                      <th className="px-4 py-3 text-left">Mode</th>
                      <th className="px-4 py-3 text-center">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {detail.paiements.map((p) => (
                      <tr key={p.idPaiement} className="border-t">
                        <td className="px-4 py-3">
                          {new Date(p.datePaiement).toLocaleDateString(
                            'fr-FR',
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-bold">
                          {Number(p.montant || 0).toLocaleString('fr-FR')}{' '}
                          {p.devise}
                        </td>
                        <td className="px-4 py-3">{p.modePaiement}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => supprimerPaiement(p.idPaiement)}
                            className="rounded-lg bg-red-700 px-3 py-2 text-white"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {detail.paiements.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-6 text-center text-slate-500"
                        >
                          Aucun paiement enregistré.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
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