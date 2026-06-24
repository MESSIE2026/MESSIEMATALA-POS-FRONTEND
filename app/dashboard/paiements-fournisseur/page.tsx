'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  RefreshCw,
  Eye,
  FileText,
  CreditCard,
  Search,
  BarChart3,
  Receipt,
  Truck,
  ClipboardList,
  Wallet,
  Plus,
} from 'lucide-react';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://messiematala-pos-backend-production.up.railway.app';

type ModuleType =
  | 'Vue générale fournisseurs'
  | 'Bons de commande'
  | 'Réceptions'
  | 'Factures fournisseurs'
  | 'Paiements fournisseurs';

type PeriodeType =
  | 'Journalier'
  | 'Hebdomadaire'
  | 'Mensuel'
  | 'Annuel'
  | 'Personnalisé';

type FactureAPayer = {
  idFacture: number;
  numeroFacture: string;
  fournisseur: string;
  devise: string;
  totalTtc: number;
  montantPaye: number;
  reste: number;
};

const modules: ModuleType[] = [
  'Vue générale fournisseurs',
  'Bons de commande',
  'Réceptions',
  'Factures fournisseurs',
  'Paiements fournisseurs',
];

const periodes: PeriodeType[] = [
  'Journalier',
  'Hebdomadaire',
  'Mensuel',
  'Annuel',
  'Personnalisé',
];

const buttonBase =
  'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50';

const buttons = {
  actualiser: `${buttonBase} bg-slate-700`,
  details: `${buttonBase} bg-indigo-700`,
  pdfDettes: `${buttonBase} bg-red-800`,
  pdfPaiements: `${buttonBase} bg-violet-700`,
  payer: `${buttonBase} bg-green-700`,
  nouveau: `${buttonBase} bg-slate-600`,
};

function money(value: any) {
  return Number(value || 0).toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value: any) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('fr-FR');
}

function getWeekStart(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function toInputDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default function Page() {
  const [moduleActif, setModuleActif] =
    useState<ModuleType>('Vue générale fournisseurs');
  const [periode, setPeriode] = useState<PeriodeType>('Mensuel');

  const [du, setDu] = useState('');
  const [au, setAu] = useState('');

  const [cards, setCards] = useState<any>({});
  const [rows, setRows] = useState<any[]>([]);
  const [detailsRows, setDetailsRows] = useState<any[]>([]);
  const [factures, setFactures] = useState<FactureAPayer[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadingPaiement, setLoadingPaiement] = useState(false);

  const [showDetails, setShowDetails] = useState(false);

  const [paiement, setPaiement] = useState({
    idFacture: '',
    montant: '',
    devise: 'CDF',
    modePaiement: 'CASH',
    reference: '',
    datePaiement: today(),
  });

  useEffect(() => {
    appliquerPeriode('Mensuel');
  }, []);

  useEffect(() => {
    if (du && au) {
      chargerLecture();
      chargerFactures();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [du, au, moduleActif]);

  function appliquerPeriode(p: PeriodeType) {
    setPeriode(p);

    const now = new Date();

    if (p === 'Journalier') {
      const d = today();
      setDu(d);
      setAu(d);
      return;
    }

    if (p === 'Hebdomadaire') {
      const start = getWeekStart(now);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      setDu(toInputDate(start));
      setAu(toInputDate(end));
      return;
    }

    if (p === 'Mensuel') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setDu(toInputDate(start));
      setAu(toInputDate(end));
      return;
    }

    if (p === 'Annuel') {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31);
      setDu(toInputDate(start));
      setAu(toInputDate(end));
      return;
    }
  }

  async function chargerLecture() {
    setLoading(true);

    try {
      const idEntreprise = localStorage.getItem('ZAIRE_ID_ENTREPRISE') || '1';
      const idMagasin = localStorage.getItem('ZAIRE_ID_MAGASIN') || '0';

      const url =
        `${API_URL}/paiements-fournisseur/lecture` +
        `?module=${encodeURIComponent(moduleActif)}` +
        `&du=${du}&au=${au}` +
        `&idEntreprise=${idEntreprise}&idMagasin=${idMagasin}`;

      const data = await fetch(url).then((r) => r.json());

      setCards(data.cards || {});
      setRows(Array.isArray(data.rows) ? data.rows : []);
    } finally {
      setLoading(false);
    }
  }

  async function chargerDetails() {
    const idEntreprise = localStorage.getItem('ZAIRE_ID_ENTREPRISE') || '1';
    const idMagasin = localStorage.getItem('ZAIRE_ID_MAGASIN') || '0';

    const url =
      `${API_URL}/paiements-fournisseur/details` +
      `?module=${encodeURIComponent(moduleActif)}` +
      `&du=${du}&au=${au}` +
      `&idEntreprise=${idEntreprise}&idMagasin=${idMagasin}`;

    const data = await fetch(url).then((r) => r.json());

    setDetailsRows(Array.isArray(data.rows) ? data.rows : []);
    setShowDetails(true);
  }

  async function chargerFactures() {
    const idEntreprise = localStorage.getItem('ZAIRE_ID_ENTREPRISE') || '1';
    const data = await fetch(
      `${API_URL}/paiements-fournisseur/factures?idEntreprise=${idEntreprise}`,
    ).then((r) => r.json());

    setFactures(Array.isArray(data) ? data : []);
  }

  async function enregistrerPaiement() {
    if (loadingPaiement) return;

    const idFacture = Number(paiement.idFacture || 0);
    const montant = Number(paiement.montant || 0);

    if (!idFacture) {
      alert('Choisis une facture.');
      return;
    }

    if (montant <= 0) {
      alert('Montant invalide.');
      return;
    }

    setLoadingPaiement(true);

    try {
      const payload = {
        idFacture,
        montant,
        devise: paiement.devise,
        modePaiement: paiement.modePaiement,
        reference: paiement.reference || null,
        datePaiement: paiement.datePaiement,
        idEntreprise: Number(localStorage.getItem('ZAIRE_ID_ENTREPRISE') || 1),
        idMagasin: Number(localStorage.getItem('ZAIRE_ID_MAGASIN') || 0) || null,
        idPoste: Number(localStorage.getItem('ZAIRE_ID_POSTE') || 0) || null,
        creePar:
          localStorage.getItem('ZAIRE_NOM_UTILISATEUR') ||
          localStorage.getItem('ZAIRE_USER_NAME') ||
          'SYSTEME',
      };

      const res = await fetch(`${API_URL}/paiements-fournisseur`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || 'Erreur paiement fournisseur.');
        return;
      }

      setPaiement({
        idFacture: '',
        montant: '',
        devise: 'CDF',
        modePaiement: 'CASH',
        reference: '',
        datePaiement: today(),
      });

      await chargerLecture();
      await chargerFactures();

      alert(data.message || 'Paiement enregistré.');
    } finally {
      setLoadingPaiement(false);
    }
  }

  async function telechargerPdf(type: 'dettes' | 'paiements') {
    const idEntreprise = localStorage.getItem('ZAIRE_ID_ENTREPRISE') || '1';

    const endpoint =
      type === 'dettes'
        ? 'pdf-dettes'
        : 'pdf-paiements';

    const res = await fetch(
      `${API_URL}/paiements-fournisseur/${endpoint}?du=${du}&au=${au}&idEntreprise=${idEntreprise}`,
    );

    if (!res.ok) {
      alert('Erreur génération PDF.');
      return;
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download =
      type === 'dettes'
        ? `DETTES_FOURNISSEURS_${du}_${au}.pdf`
        : `PAIEMENTS_FOURNISSEURS_${du}_${au}.pdf`;

    document.body.appendChild(a);
    a.click();
    a.remove();

    window.URL.revokeObjectURL(url);
  }

  const colonnes = useMemo(() => {
    if (!rows.length) return [];
    return Object.keys(rows[0]);
  }, [rows]);

  const colonnesDetails = useMemo(() => {
    if (!detailsRows.length) return [];
    return Object.keys(detailsRows[0]);
  }, [detailsRows]);

  const factureChoisie = factures.find(
    (f) => String(f.idFacture) === paiement.idFacture,
  );

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="mb-6 rounded-3xl bg-slate-900 p-6 text-white shadow-sm">
        <h1 className="text-2xl font-bold md:text-3xl">
          Comptabilité Fournisseurs
        </h1>
        <p className="mt-2 text-sm text-slate-300">
          Bon de commande → Réception → Facture fournisseur → Paiement → Dette.
        </p>
      </div>

      <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card
          icon={<ClipboardList size={20} />}
          title="Bons de commande"
          lines={[
            `${cards?.bc?.nombre || 0} BC`,
            `USD : ${money(cards?.bc?.usd)} | CDF : ${money(cards?.bc?.cdf)}`,
            `EUR : ${money(cards?.bc?.eur)}`,
          ]}
        />

        <Card
          icon={<Truck size={20} />}
          title="Réceptions"
          lines={[
            `${cards?.receptions?.nombre || 0} réception(s)`,
            `USD : ${money(cards?.receptions?.usd)} | CDF : ${money(
              cards?.receptions?.cdf,
            )}`,
            `EUR : ${money(cards?.receptions?.eur)}`,
          ]}
        />

        <Card
          icon={<Receipt size={20} />}
          title="Factures"
          lines={[
            `${cards?.factures?.nombre || 0} facture(s)`,
            `USD : ${money(cards?.factures?.usd)} | CDF : ${money(
              cards?.factures?.cdf,
            )}`,
            `EUR : ${money(cards?.factures?.eur)}`,
          ]}
        />

        <Card
          icon={<Wallet size={20} />}
          title="Paiements / Dettes"
          lines={[
            `Payé USD : ${money(cards?.paiements?.payeUsd)}`,
            `Payé CDF : ${money(cards?.paiements?.payeCdf)}`,
            `Reste USD : ${money(cards?.paiements?.resteUsd)} | CDF : ${money(
              cards?.paiements?.resteCdf,
            )}`,
          ]}
        />
      </section>

      <section className="mb-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="grid gap-4 md:grid-cols-5">
          <label className="text-sm font-medium text-slate-700 md:col-span-2">
            Module
            <select
              className="mt-1 w-full rounded-xl border p-2"
              value={moduleActif}
              onChange={(e) => setModuleActif(e.target.value as ModuleType)}
            >
              {modules.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-slate-700">
            Période
            <select
              className="mt-1 w-full rounded-xl border p-2"
              value={periode}
              onChange={(e) => appliquerPeriode(e.target.value as PeriodeType)}
            >
              {periodes.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-slate-700">
            Du
            <input
              type="date"
              className="mt-1 w-full rounded-xl border p-2 disabled:bg-slate-100"
              value={du}
              disabled={periode !== 'Personnalisé'}
              onChange={(e) => setDu(e.target.value)}
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            Au
            <input
              type="date"
              className="mt-1 w-full rounded-xl border p-2 disabled:bg-slate-100"
              value={au}
              disabled={periode !== 'Personnalisé'}
              onChange={(e) => setAu(e.target.value)}
            />
          </label>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button className={buttons.actualiser} onClick={chargerLecture}>
            <RefreshCw size={16} />
            {loading ? 'Chargement...' : 'Actualiser'}
          </button>

          <button className={buttons.details} onClick={chargerDetails}>
            <Eye size={16} />
            Voir détails
          </button>

          <button
            className={buttons.pdfDettes}
            onClick={() => telechargerPdf('dettes')}
          >
            <FileText size={16} />
            PDF Dettes
          </button>

          <button
            className={buttons.pdfPaiements}
            onClick={() => telechargerPdf('paiements')}
          >
            <BarChart3 size={16} />
            PDF Paiements
          </button>
        </div>
      </section>

      <section className="mb-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="mb-4 flex items-center gap-2">
          <CreditCard size={20} />
          <h2 className="text-lg font-bold text-slate-900">
            Enregistrer un paiement fournisseur
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-6">
          <label className="text-sm font-medium text-slate-700 md:col-span-2">
            Facture
            <select
              className="mt-1 w-full rounded-xl border p-2"
              value={paiement.idFacture}
              onChange={(e) => {
                const f = factures.find(
                  (x) => String(x.idFacture) === e.target.value,
                );

                setPaiement((old) => ({
                  ...old,
                  idFacture: e.target.value,
                  devise: f?.devise || old.devise,
                  montant: f?.reste ? String(f.reste) : old.montant,
                }));
              }}
            >
              <option value="">Choisir une facture...</option>
              {factures.map((f) => (
                <option key={f.idFacture} value={String(f.idFacture)}>
                  {f.numeroFacture} - {f.fournisseur} - Reste{' '}
                  {money(f.reste)} {f.devise}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-slate-700">
            Montant
            <input
              type="number"
              className="mt-1 w-full rounded-xl border p-2"
              value={paiement.montant}
              onChange={(e) =>
                setPaiement({ ...paiement, montant: e.target.value })
              }
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            Devise
            <select
              className="mt-1 w-full rounded-xl border p-2"
              value={paiement.devise}
              onChange={(e) =>
                setPaiement({ ...paiement, devise: e.target.value })
              }
            >
              <option>CDF</option>
              <option>USD</option>
              <option>EUR</option>
            </select>
          </label>

          <label className="text-sm font-medium text-slate-700">
            Mode
            <select
              className="mt-1 w-full rounded-xl border p-2"
              value={paiement.modePaiement}
              onChange={(e) =>
                setPaiement({ ...paiement, modePaiement: e.target.value })
              }
            >
              <option>CASH</option>
              <option>BANK</option>
              <option>MOBILE MONEY</option>
              <option>CARTE</option>
              <option>AUTRE</option>
            </select>
          </label>

          <label className="text-sm font-medium text-slate-700">
            Date paiement
            <input
              type="date"
              className="mt-1 w-full rounded-xl border p-2"
              value={paiement.datePaiement}
              onChange={(e) =>
                setPaiement({ ...paiement, datePaiement: e.target.value })
              }
            />
          </label>

          <label className="text-sm font-medium text-slate-700 md:col-span-2">
            Référence
            <input
              className="mt-1 w-full rounded-xl border p-2"
              value={paiement.reference}
              onChange={(e) =>
                setPaiement({ ...paiement, reference: e.target.value })
              }
              placeholder="N° transaction, reçu, note..."
            />
          </label>
        </div>

        {factureChoisie && (
          <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm font-medium text-amber-800 ring-1 ring-amber-200">
            Facture sélectionnée : {factureChoisie.numeroFacture} — Reste à
            payer : {money(factureChoisie.reste)} {factureChoisie.devise}
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            className={buttons.payer}
            onClick={enregistrerPaiement}
            disabled={loadingPaiement}
          >
            <Plus size={16} />
            {loadingPaiement ? 'Enregistrement...' : 'Enregistrer paiement'}
          </button>

          <button
            className={buttons.nouveau}
            onClick={() =>
              setPaiement({
                idFacture: '',
                montant: '',
                devise: 'CDF',
                modePaiement: 'CASH',
                reference: '',
                datePaiement: today(),
              })
            }
          >
            <Search size={16} />
            Nouveau
          </button>
        </div>
      </section>

      <TableSection
        title={moduleActif}
        rows={rows}
        columns={colonnes}
        loading={loading}
      />

      {showDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-7xl overflow-hidden rounded-3xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b p-5">
              <h2 className="text-lg font-bold text-slate-900">
                Détails - {moduleActif}
              </h2>
              <button
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                onClick={() => setShowDetails(false)}
              >
                Fermer
              </button>
            </div>

            <div className="max-h-[75vh] overflow-auto p-5">
              <DataTable rows={detailsRows} columns={colonnesDetails} />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Card({
  icon,
  title,
  lines,
}: {
  icon: React.ReactNode;
  title: string;
  lines: string[];
}) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="mb-3 flex items-center gap-2 text-slate-700">
        {icon}
        <p className="text-sm font-bold uppercase">{title}</p>
      </div>

      <div className="space-y-1 text-sm font-semibold text-slate-900">
        {lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </div>
  );
}

function TableSection({
  title,
  rows,
  columns,
  loading,
}: {
  title: string;
  rows: any[];
  columns: string[];
  loading: boolean;
}) {
  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="mb-4 flex items-center gap-2">
        <BarChart3 size={20} />
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      </div>

      {loading ? (
        <p className="rounded-xl bg-slate-50 p-6 text-center text-slate-500">
          Chargement...
        </p>
      ) : (
        <DataTable rows={rows} columns={columns} />
      )}
    </section>
  );
}

function DataTable({ rows, columns }: { rows: any[]; columns: string[] }) {
  if (!rows.length) {
    return (
      <p className="rounded-xl bg-slate-50 p-6 text-center text-slate-500">
        Aucune donnée trouvée.
      </p>
    );
  }

  return (
    <div className="overflow-auto">
      <table className="w-full min-w-[1000px] text-sm">
        <thead className="bg-slate-900 text-white">
          <tr>
            {columns.map((col) => (
              <th key={col} className="p-3 text-left font-semibold">
                {label(col)}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b hover:bg-slate-50">
              {columns.map((col) => (
                <td
                  key={col}
                  className={`p-3 ${
                    typeof row[col] === 'number' ? 'text-right' : 'text-left'
                  }`}
                >
                  {renderValue(row[col], col)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function label(value: string) {
  return value
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase());
}

function renderValue(value: any, col: string) {
  if (value === null || value === undefined) return '';

  const lower = col.toLowerCase();

  if (
    lower.includes('date') ||
    lower.includes('echeance') ||
    lower.includes('création') ||
    lower.includes('creation')
  ) {
    return formatDate(value);
  }

  if (typeof value === 'number') {
    return money(value);
  }

  return String(value);
}