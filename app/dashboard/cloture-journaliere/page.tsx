'use client';

import { useEffect, useMemo, useState } from 'react';
import { getAuthHeaders } from '@/app/services/compte.service';
import {
  getParametresDocuments,
  documentImageUrl,
  ParametresDocuments,
} from '@/app/services/documents.service';

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://messiematala-pos-backend-production.up.railway.app';

type ResumeBloc = {
  entreesFC: number;
  sortiesFC: number;
  photoFC: number;
  venteFC: number;
  balanceFC: number;
  entreesUSD: number;
  sortiesUSD: number;
  photoUSD: number;
  venteUSD: number;
  balanceUSD: number;
};

type Modalites = {
  totalEspeceFC?: number;
  totalEspeceUSD?: number;
  stockBankNetFC?: number;
  stockBankNetUSD?: number;
  versementSimNetFC?: number;
  versementSimNetUSD?: number;
  envoiPatronneFC?: number;
  envoiPatronneUSD?: number;
  locationMoisFC?: number;
  locationMoisUSD?: number;
};

type Resume = {
  date: string;
  jour: ResumeBloc;
  semaine: ResumeBloc;
  mois: ResumeBloc;
  observation?: string;
  modalites?: Modalites;
};

type Cloture = {
  id: number;
  datecloture: string;
  idcaissier: number;
  nomcaissier?: string;
  entreesfc?: number;
  sortiesfc?: number;
  balancefc?: number;
  entreesusd?: number;
  sortiesusd?: number;
  balanceusd?: number;
  observation?: string;
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function money(v: any) {
  return Number(v ?? 0).toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function dateLongFr(dateISO: string) {
  try {
    return new Date(dateISO).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: '2-digit',
    });
  } catch {
    return dateISO;
  }
}

export default function Page() {
  const [date, setDate] = useState(todayISO());
  const [resume, setResume] = useState<Resume | null>(null);
  const [clotures, setClotures] = useState<Cloture[]>([]);
  const [observation, setObservation] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [idCaissier, setIdCaissier] = useState(0);
  const [nomCaissier, setNomCaissier] = useState('CAISSIER WEB');

  const [managerOuvert, setManagerOuvert] = useState(false);
  const [signatureModal, setSignatureModal] = useState(false);
  const [managerLogin, setManagerLogin] = useState('');
  const [managerPin, setManagerPin] = useState('');
  const [signatureManager, setSignatureManager] = useState<any>(null);


      const [paramsDocs, setParamsDocs] = useState<ParametresDocuments | null>(null);

  useEffect(() => {
  chargerEmploye();
  charger();
  chargerParametresDocuments();
}, []);

async function chargerParametresDocuments() {
  const idEntreprise =
    localStorage.getItem('ZAIRE_ID_ENTREPRISE') || '1';

  const data = await getParametresDocuments(idEntreprise);

  console.log('PARAMETRES DOCUMENTS CLOTURE =', data);

  setParamsDocs(data);
}

  useEffect(() => {
    charger();
  }, [date]);

  function chargerEmploye() {
    try {
      const raw =
        localStorage.getItem('employe') ||
        localStorage.getItem('user') ||
        '{}';

      const emp = JSON.parse(raw);

      const id = Number(
        emp.idemploye ??
          emp.id_employe ??
          emp.idEmploye ??
          emp.idutilisateur ??
          emp.idUtilisateur ??
          emp.id ??
          0,
      );

      setIdCaissier(id);

      const nom = `${emp.prenom ?? ''} ${emp.nom ?? ''}`.trim();
      setNomCaissier(nom || emp.nomutilisateur || emp.email || 'CAISSIER WEB');
    } catch {
      setIdCaissier(0);
      setNomCaissier('CAISSIER WEB');
    }
  }

  async function lire(res: Response) {
    const txt = await res.text();
    try {
      return txt ? JSON.parse(txt) : null;
    } catch {
      return txt;
    }
  }

  async function charger() {
    setLoading(true);
    setMessage('');

    try {
      const [r1, r2] = await Promise.all([
        fetch(`${API}/cloture-journaliere/resume?date=${date}`, {
          cache: 'no-store',
        }),
        fetch(`${API}/cloture-journaliere`, {
          cache: 'no-store',
        }),
      ]);

      const d1 = await lire(r1);
      const d2 = await lire(r2);

      if (!r1.ok) throw new Error(JSON.stringify(d1));
      if (!r2.ok) throw new Error(JSON.stringify(d2));

      setResume(d1);
      setClotures(Array.isArray(d2) ? d2 : []);

      const brouillonKey = `CLOTURE_OBSERVATION_${date}`;
      const brouillon = localStorage.getItem(brouillonKey);

      setObservation(brouillon !== null ? brouillon : d1?.observation || '');
    } catch (e: any) {
      setMessage(e?.message || 'Erreur chargement clôture.');
    } finally {
      setLoading(false);
    }
  }

  async function valider() {
    if (!idCaissier) {
      setMessage('Caissier obligatoire. Reconnecte-toi.');
      return;
    }

    if (!confirm('Valider la clôture journalière ?')) return;

    setLoading(true);
    setMessage('');

    try {
      const res = await fetch(`${API}/cloture-journaliere/valider`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          dateCloture: date,
          idCaissier,
          nomCaissier,
          observation,
          idEntreprise: Number(localStorage.getItem('ZAIRE_ID_ENTREPRISE') || 1),
          idMagasin: Number(localStorage.getItem('ZAIRE_ID_MAGASIN') || 1),
          idPoste: Number(localStorage.getItem('ZAIRE_ID_POSTE') || 1),
        }),
      });

      const data = await lire(res);

      if (!res.ok) {
        throw new Error(data?.message || JSON.stringify(data));
      }

      localStorage.removeItem(`CLOTURE_OBSERVATION_${date}`);
      setObservation('');
      setMessage(data?.message || 'Clôture validée.');
      await charger();
    } catch (e: any) {
      setMessage(e?.message || 'Erreur validation clôture.');
    } finally {
      setLoading(false);
    }
  }

  function ouvrirManagerAvecSignature() {
    setManagerLogin('');
    setManagerPin('');
    setSignatureModal(true);
  }

  async function validerOuvertureManager() {
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch(`${API}/signature-manager/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          managerLogin,
          managerPin,
          typeAction: 'OUVERTURE_MANAGER_CLOTURES',
          permissionCode: 'CLOTURE_MANAGER',
          reference: `CLOTURE-${date}`,
          details: "Demande d'accès au manager des clôtures journalières.",
          idEmployeDemandeur: idCaissier || undefined,
        }),
      });

      const data = await lire(res);

      if (!res.ok || !data?.approved) {
        throw new Error(data?.message || 'Accès refusé. Signature manager requise.');
      }

      setSignatureManager(data);
      setSignatureModal(false);
      setManagerOuvert(true);
      await charger();

      setMessage(`Accès manager autorisé par ${data.managerNom || 'Manager'}.`);
    } catch (e: any) {
      setSignatureManager(null);
      setMessage(e?.message || 'Accès refusé. Signature manager requise.');
    } finally {
      setLoading(false);
    }
  }

  async function supprimer(id: number) {
    if (!managerOuvert || !signatureManager?.approved) {
      setMessage('Accès refusé. Signature manager requise.');
      return;
    }

    if (!confirm('Voulez-vous vraiment supprimer cette clôture ?')) return;

    setLoading(true);

    try {
      const res = await fetch(`${API}/cloture-journaliere/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      const data = await lire(res);

      if (!res.ok) {
        throw new Error(data?.message || JSON.stringify(data));
      }

      setMessage(data?.message || 'Clôture supprimée avec succès.');
      await charger();
    } catch (e: any) {
      setMessage(e?.message || 'Erreur suppression.');
    } finally {
      setLoading(false);
    }
  }

  function ouvrirPdf() {
  const idEntreprise =
    localStorage.getItem('ZAIRE_ID_ENTREPRISE') || '1';

  const url =
    `${API}/cloture-journaliere/pdf-print?date=${encodeURIComponent(date)}` +
    `&idEntreprise=${encodeURIComponent(idEntreprise)}`;

  const win = window.open(url, '_blank');

  setTimeout(() => {
    try {
      win?.print();
    } catch {}
  }, 1500);
}

  async function telechargerPdf() {
    try {
      const res = await fetch(
        `${API}/cloture-journaliere/pdf?date=${encodeURIComponent(date)}`,
      );

      if (!res.ok) throw new Error('Erreur téléchargement PDF');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `Cloture_${date}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch {
      alert('Impossible de télécharger le PDF.');
    }
  }

  const jour = resume?.jour;
  const semaine = resume?.semaine;
  const mois = resume?.mois;
  const modalites = resume?.modalites;

  const totalJourFC = useMemo(() => jour?.balanceFC ?? 0, [jour]);
  const totalJourUSD = useMemo(() => jour?.balanceUSD ?? 0, [jour]);

  return (
    <main className="min-h-screen bg-slate-100 p-3 text-slate-900 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-700">
                Caisse / Finance
              </p>

              <h1 className="mt-1 text-3xl font-black text-slate-950">
                Clôture journalière de caisse
              </h1>

              <p className="mt-1 text-sm font-semibold text-slate-500">
                Synthèse générale : jour, semaine, mois.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-2xl border border-slate-300 px-4 py-3 font-bold"
              />

              <button
                onClick={charger}
                disabled={loading}
                className="rounded-2xl bg-slate-950 px-5 py-3 font-black text-white disabled:opacity-50"
              >
                Actualiser
              </button>

              <button
                onClick={ouvrirPdf}
                className="rounded-2xl bg-slate-700 px-5 py-3 font-black text-white"
              >
                Impression Directe
              </button>

              <button
                onClick={ouvrirManagerAvecSignature}
                className="rounded-2xl bg-emerald-700 px-5 py-3 font-black text-white"
              >
                Manager 🔒
              </button>
            </div>
          </div>
        </section>

        {message && (
          <div className="rounded-2xl bg-white p-4 text-sm font-black text-slate-700 shadow-sm ring-1 ring-slate-200">
            {message}
          </div>
        )}

        <section className="grid gap-4 lg:grid-cols-3">
          <InfoCard title="Date clôture" value={dateLongFr(date)} />
          <InfoCard title="Caissier" value={nomCaissier} />
          <InfoCard title="ID caissier" value={String(idCaissier || '-')} />
        </section>

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
  <h2 className="text-xl font-black text-slate-950">
    Aperçu document
  </h2>

  <div className="relative mt-4 overflow-hidden rounded-2xl border border-slate-300 bg-white p-5">
    {paramsDocs?.afficher_filigrane && paramsDocs?.filigrane_url && (
      <img
        src={documentImageUrl(paramsDocs.filigrane_url)}
        className="pointer-events-none absolute left-1/2 top-1/2 h-64 -translate-x-1/2 -translate-y-1/2 object-contain opacity-10"
        alt="Filigrane"
      />
    )}

    <div className="relative z-10">
      <div className="text-center">
        {paramsDocs?.afficher_logo && paramsDocs?.logo_url && (
          <img
            src={documentImageUrl(paramsDocs.logo_url)}
            alt="Logo"
            className="mx-auto mb-2 h-20 object-contain"
          />
        )}

        <h3
          className="text-2xl font-black"
          style={{ color: paramsDocs?.couleur_principale || '#111827' }}
        >
          {paramsDocs?.nom_entreprise || 'ENTREPRISE'}
        </h3>

        {(paramsDocs?.entete_ligne1 || paramsDocs?.slogan) && (
          <p className="text-sm font-semibold">
            {paramsDocs?.entete_ligne1 || paramsDocs?.slogan}
          </p>
        )}

        {paramsDocs?.adresse && (
          <p className="text-sm font-semibold">{paramsDocs.adresse}</p>
        )}

        <p className="text-xs font-semibold">
          RCCM: {paramsDocs?.rccm || '-'} | ID NAT: {paramsDocs?.id_nat || '-'}
        </p>

        {(paramsDocs?.telephone || paramsDocs?.email) && (
          <p className="text-xs font-semibold">
            {paramsDocs?.telephone || ''}
            {paramsDocs?.email ? ` | ${paramsDocs.email}` : ''}
          </p>
        )}
      </div>

      <div className="my-4 border-y border-slate-800 py-3 text-center">
        <h3 className="font-black">
          MOUVEMENTS DE CAISSE - CLÔTURE JOURNALIÈRE
        </h3>
      </div>

      <div className="mb-4 flex justify-between text-sm font-bold">
        <p>Date : {dateLongFr(date)}</p>
        <p>Caissier : {nomCaissier}</p>
      </div>

      <PdfTable
        title="RÉCAPITULATIF DU JOUR"
        fc={{
          entrees: jour?.entreesFC,
          sorties: jour?.sortiesFC,
          balance: jour?.balanceFC,
        }}
        usd={{
          entrees: jour?.entreesUSD,
          sorties: jour?.sortiesUSD,
          balance: jour?.balanceUSD,
        }}
      />

      <div className="mt-3 border border-slate-800">
        <h4 className="border-b border-slate-800 p-2 font-black">
          OBSERVATIONS DU JOUR
        </h4>
        <div className="min-h-24 whitespace-pre-wrap p-3 text-sm font-semibold">
          {observation || resume?.observation || '-'}
        </div>
      </div>

      <PdfTable
        title="RÉCAPITULATIF HEBDOMADAIRE"
        fc={{
          entrees: semaine?.entreesFC,
          sorties: semaine?.sortiesFC,
          balance: semaine?.balanceFC,
        }}
        usd={{
          entrees: semaine?.entreesUSD,
          sorties: semaine?.sortiesUSD,
          balance: semaine?.balanceUSD,
        }}
      />

      <PdfTable
        title="RÉCAPITULATIF MENSUEL"
        fc={{
          entrees: mois?.entreesFC,
          sorties: mois?.sortiesFC,
          balance: mois?.balanceFC,
        }}
        usd={{
          entrees: mois?.entreesUSD,
          sorties: mois?.sortiesUSD,
          balance: mois?.balanceUSD,
        }}
      />

      <div className="mt-3 border border-slate-800 p-3 text-sm">
        <h4 className="mb-2 font-black">DÉTAIL DES RECETTES MENSUELLES</h4>

        <p>
          Argent Photos : FC {money(mois?.photoFC)} | USD {money(mois?.photoUSD)}
        </p>
        <p>
          Vente : FC {money(mois?.venteFC)} | USD {money(mois?.venteUSD)}
        </p>

        <div className="mt-3 space-y-1 font-semibold">
          <p>
            TOTAL GÉNÉRAL ESPÈCE : FC {money(modalites?.totalEspeceFC)} | USD{' '}
            {money(modalites?.totalEspeceUSD)}
          </p>
          <p>
            VERSEMENT BANK : FC {money(modalites?.stockBankNetFC)} | USD{' '}
            {money(modalites?.stockBankNetUSD)}
          </p>
          <p>
            VERSEMENT SIM : FC {money(modalites?.versementSimNetFC)} | USD{' '}
            {money(modalites?.versementSimNetUSD)}
          </p>
          <p>
            ENVOI PATRONNE : FC {money(modalites?.envoiPatronneFC)} | USD{' '}
            {money(modalites?.envoiPatronneUSD)}
          </p>
          <p>
            LOCATION MENSUELLE : FC {money(modalites?.locationMoisFC)} | USD{' '}
            {money(modalites?.locationMoisUSD)}
          </p>
        </div>
      </div>

      <div className="mt-5 border-t border-slate-800 pt-6">
        <div className="flex items-end justify-between gap-6 font-bold">
          <div>
            <p>Signature du Caissier :</p>
            <p className="mt-8">{nomCaissier}</p>
          </div>

          <div className="text-center">
            {paramsDocs?.cachet_url && (
              <img
                src={documentImageUrl(paramsDocs.cachet_url)}
                alt="Cachet"
                className="mx-auto h-24 object-contain"
              />
            )}

            {paramsDocs?.signature_direction_url && (
              <img
                src={documentImageUrl(paramsDocs.signature_direction_url)}
                alt="Signature Direction"
                className="mx-auto h-16 object-contain"
              />
            )}

            <p>Direction</p>
          </div>
        </div>

        <p className="mt-5 text-xs font-semibold text-slate-500">
          Document généré le{' '}
          {resume?.date ? dateLongFr(resume.date) : dateLongFr(date)}
        </p>

        <div className="mt-4 text-center text-xs font-semibold text-slate-500">
          {paramsDocs?.telephone || ''}
          {paramsDocs?.email ? ` | ${paramsDocs.email}` : ''}
          {paramsDocs?.site_web ? ` | ${paramsDocs.site_web}` : ''}
        </div>
      </div>
    </div>
  </div>
</section>
        

        <section className="grid gap-5 xl:grid-cols-2">
          <RecapCard
            title="Récapitulatif jour FC"
            devise="FC"
            entrees={jour?.entreesFC}
            sorties={jour?.sortiesFC}
            photo={jour?.photoFC}
            vente={jour?.venteFC}
            balance={jour?.balanceFC}
          />

          <RecapCard
            title="Récapitulatif jour USD"
            devise="USD"
            entrees={jour?.entreesUSD}
            sorties={jour?.sortiesUSD}
            photo={jour?.photoUSD}
            vente={jour?.venteUSD}
            balance={jour?.balanceUSD}
          />
        </section>

        <section className="grid gap-5 xl:grid-cols-2">
          <MiniCard
            title="E/S semaine FC"
            devise="FC"
            entrees={semaine?.entreesFC}
            sorties={semaine?.sortiesFC}
            balance={semaine?.balanceFC}
          />

          <MiniCard
            title="E/S semaine USD"
            devise="USD"
            entrees={semaine?.entreesUSD}
            sorties={semaine?.sortiesUSD}
            balance={semaine?.balanceUSD}
          />

          <MiniCard
            title="E/S mois FC"
            devise="FC"
            entrees={mois?.entreesFC}
            sorties={mois?.sortiesFC}
            balance={mois?.balanceFC}
          />

          <MiniCard
            title="E/S mois USD"
            devise="USD"
            entrees={mois?.entreesUSD}
            sorties={mois?.sortiesUSD}
            balance={mois?.balanceUSD}
          />
        </section>

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-black text-slate-950">
            Modalités ancienne version Windows Forms
          </h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Small label="Total Espèce FC" value={`${money(modalites?.totalEspeceFC)} FC`} />
            <Small label="Total Espèce USD" value={`${money(modalites?.totalEspeceUSD)} USD`} />
            <Small label="Stock BANK net FC" value={`${money(modalites?.stockBankNetFC)} FC`} />
            <Small label="Stock BANK net USD" value={`${money(modalites?.stockBankNetUSD)} USD`} />
            <Small label="Versement SIM net FC" value={`${money(modalites?.versementSimNetFC)} FC`} />
            <Small label="Versement SIM net USD" value={`${money(modalites?.versementSimNetUSD)} USD`} />
            <Small label="Envoi Patronne FC" value={`${money(modalites?.envoiPatronneFC)} FC`} />
            <Small label="Envoi Patronne USD" value={`${money(modalites?.envoiPatronneUSD)} USD`} />
            <Small label="Location mois FC" value={`${money(modalites?.locationMoisFC)} FC`} />
            <Small label="Location mois USD" value={`${money(modalites?.locationMoisUSD)} USD`} />
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-xl font-black text-slate-950">Observation</h2>
            <textarea
              value={observation}
              onChange={(e) => {
                const value = e.target.value;
                setObservation(value);
                localStorage.setItem(`CLOTURE_OBSERVATION_${date}`, value);
              }}
              rows={7}
              placeholder="Exemple : ARGENT PHOTOS : 77.500FC&#10;VENTE :&#10; - BOUCLE D'OREILLE : 5$"
              className="mt-4 w-full rounded-2xl border border-slate-300 p-4 font-semibold outline-none focus:border-blue-600"
            />
          </div>

          <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-xl font-black text-slate-950">Actions</h2>

            <div className="mt-4 space-y-3">
              <button
                onClick={valider}
                disabled={loading}
                className="w-full rounded-2xl bg-emerald-600 px-5 py-4 font-black text-white disabled:opacity-50"
              >
                Valider clôture
              </button>

              <button
                onClick={() => {
                  setObservation('');
                  localStorage.removeItem(`CLOTURE_OBSERVATION_${date}`);
                }}
                className="w-full rounded-2xl bg-slate-100 px-5 py-4 font-black text-slate-800"
              >
                Annuler / Vider
              </button>

              <button
                onClick={telechargerPdf}
                className="w-full rounded-2xl bg-blue-700 px-5 py-4 font-black text-white"
              >
                Exporter PDF
              </button>
            </div>

            <div className="mt-5 rounded-2xl bg-slate-50 p-4 font-bold text-slate-700">
              <p>Total jour FC : {money(totalJourFC)} FC</p>
              <p>Total jour USD : {money(totalJourUSD)} USD</p>
            </div>
          </div>
        </section>
      </div>

      {signatureModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-xl">
            <h2 className="text-2xl font-black text-slate-950">
              Signature manager requise
            </h2>

            <p className="mt-2 text-sm font-semibold text-slate-500">
              Demande d&apos;accès au manager des clôtures journalières.
            </p>

            <input
              value={managerLogin}
              onChange={(e) => setManagerLogin(e.target.value)}
              placeholder="Email ou nom utilisateur manager"
              className="mt-5 w-full rounded-2xl border border-slate-300 px-4 py-3 font-bold"
            />

            <input
              type="password"
              value={managerPin}
              onChange={(e) => setManagerPin(e.target.value)}
              placeholder="PIN signature"
              className="mt-3 w-full rounded-2xl border border-slate-300 px-4 py-3 font-bold"
            />

            <div className="mt-5 flex gap-2">
              <button
                onClick={validerOuvertureManager}
                disabled={loading}
                className="flex-1 rounded-2xl bg-emerald-700 px-5 py-3 font-black text-white disabled:opacity-50"
              >
                Valider
              </button>

              <button
                onClick={() => setSignatureModal(false)}
                className="rounded-2xl bg-slate-200 px-5 py-3 font-black text-slate-800"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {managerOuvert && (
        <section className="fixed inset-0 z-50 bg-slate-950/60 p-4">
          <div className="mx-auto max-h-[92vh] max-w-7xl overflow-auto rounded-[2rem] bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-slate-950">
                  Manager - Clôtures journalières
                </h2>

                <p className="text-sm font-semibold text-slate-500">
                  Autorisé par {signatureManager?.managerNom || 'Manager'}.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={charger}
                  className="rounded-2xl bg-slate-950 px-5 py-3 font-black text-white"
                >
                  Actualiser
                </button>

                <button
                  onClick={() => setManagerOuvert(false)}
                  className="rounded-2xl bg-slate-200 px-5 py-3 font-black text-slate-800"
                >
                  Fermer
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl ring-1 ring-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-950 text-xs uppercase text-white">
                  <tr>
                    <th className="p-3">ID</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Caissier</th>
                    <th className="p-3">Entrées FC</th>
                    <th className="p-3">Sorties FC</th>
                    <th className="p-3">Balance FC</th>
                    <th className="p-3">Entrées USD</th>
                    <th className="p-3">Sorties USD</th>
                    <th className="p-3">Balance USD</th>
                    <th className="p-3">Observation</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {clotures.map((c) => (
                    <tr key={c.id} className="border-t border-slate-100">
                      <td className="p-3 font-black">{c.id}</td>
                      <td className="p-3">{String(c.datecloture).slice(0, 10)}</td>
                      <td className="p-3">{c.nomcaissier || c.idcaissier || '-'}</td>
                      <td className="p-3">{money(c.entreesfc)}</td>
                      <td className="p-3">{money(c.sortiesfc)}</td>
                      <td className="p-3 font-black">{money(c.balancefc)}</td>
                      <td className="p-3">{money(c.entreesusd)}</td>
                      <td className="p-3">{money(c.sortiesusd)}</td>
                      <td className="p-3 font-black">{money(c.balanceusd)}</td>
                      <td className="p-3">{c.observation || '-'}</td>
                      <td className="p-3">
                        <button
                          onClick={() => supprimer(c.id)}
                          className="rounded-xl bg-red-600 px-4 py-2 text-xs font-black text-white"
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}

                  {!clotures.length && (
                    <tr>
                      <td colSpan={11} className="p-8 text-center font-black text-slate-500">
                        Aucune clôture trouvée.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

function InfoCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <p className="text-xs font-black uppercase text-slate-500">{title}</p>
      <p className="mt-2 text-xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function PdfTable({
  title,
  fc,
  usd,
}: {
  title: string;
  fc: { entrees?: number; sorties?: number; balance?: number };
  usd: { entrees?: number; sorties?: number; balance?: number };
}) {
  return (
    <div className="mt-3 border border-slate-800">
      <h4 className="border-b border-slate-800 p-2 font-black">{title}</h4>
      <table className="w-full text-sm">
        <tbody>
          <tr className="border-b border-slate-800 bg-slate-100">
            <th className="border-r border-slate-800 p-2 text-left">DEV.</th>
            <th className="border-r border-slate-800 p-2 text-right">ENTRÉES</th>
            <th className="border-r border-slate-800 p-2 text-right">SORTIES</th>
            <th className="p-2 text-right">BALANCE</th>
          </tr>
          <tr className="border-b border-slate-800">
            <td className="border-r border-slate-800 p-2 font-bold">FC</td>
            <td className="border-r border-slate-800 p-2 text-right">{money(fc.entrees)}</td>
            <td className="border-r border-slate-800 p-2 text-right">{money(fc.sorties)}</td>
            <td className="p-2 text-right">{money(fc.balance)}</td>
          </tr>
          <tr>
            <td className="border-r border-slate-800 p-2 font-bold">USD</td>
            <td className="border-r border-slate-800 p-2 text-right">{money(usd.entrees)}</td>
            <td className="border-r border-slate-800 p-2 text-right">{money(usd.sorties)}</td>
            <td className="p-2 text-right">{money(usd.balance)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function RecapCard(props: any) {
  return (
    <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-xl font-black text-blue-700">{props.title}</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Small label="Entrées" value={`${money(props.entrees)} ${props.devise}`} />
        <Small label="Sorties" value={`${money(props.sorties)} ${props.devise}`} />
        <Small label="Photo" value={`${money(props.photo)} ${props.devise}`} />
        <Small label="Vente" value={`${money(props.vente)} ${props.devise}`} />
        <Small label="Balance" value={`${money(props.balance)} ${props.devise}`} />
      </div>
    </div>
  );
}

function MiniCard(props: any) {
  return (
    <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-lg font-black text-slate-950">{props.title}</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Small label="Entrées" value={`${money(props.entrees)} ${props.devise}`} />
        <Small label="Sorties" value={`${money(props.sorties)} ${props.devise}`} />
        <Small label="Balance" value={`${money(props.balance)} ${props.devise}`} />
      </div>
    </div>
  );
}

function Small({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
      <p className="text-xs font-black uppercase text-slate-500">{label}</p>
      <p className="mt-1 font-black text-slate-900">{value}</p>
    </div>
  );
}