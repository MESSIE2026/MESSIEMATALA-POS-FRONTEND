'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthHeaders } from '@/app/services/compte.service';

type SessionCaisse = {
  idsession: number;
  idcaissier?: number;
  dateouverture?: string;
  datefermeture?: string | null;
  etat?: string;
  nom?: string;
  prenom?: string;

  totalespecescdf?: number;
  totalespecesusd?: number;
  totalespeceseur?: number;

  totalcartecdf?: number;
  totalcarteusd?: number;
  totalcarteeur?: number;

  totalmobilemoneycdf?: number;
  totalmobilemoneyusd?: number;
  totalmobilemoneyeur?: number;

  totalremboursementscdf?: number;
  totalremboursementsusd?: number;
  totalremboursementseur?: number;

  totalcomplementcdf?: number;
  totalcomplementusd?: number;
  totalcomplementeur?: number;

  totalcreditcdf?: number;
  totalcreditusd?: number;
  totalcrediteur?: number;

  totalremisecdf?: number;
  totalremiseusd?: number;
  totalremiseeur?: number;
};

const API_PAR_DEFAUT =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://messiematala-pos-backend-production.up.railway.app';

function apiUrl() {
  if (typeof window === 'undefined') return API_PAR_DEFAUT;
  return localStorage.getItem('ZAIRE_API_URL') || API_PAR_DEFAUT;
}

function lireReponse(texte: string) {
  try {
    return texte ? JSON.parse(texte) : null;
  } catch {
    return texte;
  }
}

export default function Page() {
  const router = useRouter();

  const [sessions, setSessions] = useState<SessionCaisse[]>([]);
  const [sessionActive, setSessionActive] = useState<SessionCaisse | null>(null);
  const [selection, setSelection] = useState<SessionCaisse | null>(null);
  const [loading, setLoading] = useState(false);

  const [idEmploye, setIdEmploye] = useState(0);
  const [nomCaissier, setNomCaissier] = useState('NON CONNECTÉ');
  const [idEntreprise, setIdEntreprise] = useState(0);
  const [idMagasin, setIdMagasin] = useState(0);
  const [idPoste, setIdPoste] = useState(0);

  useEffect(() => {
    const contexte = chargerEmployeConnecte();
    if (contexte) void chargerSessions(contexte.idEmploye);
  }, []);

  function chargerEmployeConnecte() {
    try {
      const raw =
        localStorage.getItem('employe') ||
        localStorage.getItem('user') ||
        localStorage.getItem('utilisateur');

      if (!raw) {
        router.push('/login');
        return null;
      }

      const emp = JSON.parse(raw);

      const id = Number(
        emp.id_employe ??
        emp.idEmploye ??
        emp.ID_Employe ??
        emp.idutilisateur ??
        emp.idUtilisateur ??
        emp.id ??
        0
      );

      if (!id || id <= 0) {
        router.push('/login');
        return null;
      }

      const entreprise = Number(localStorage.getItem('ZAIRE_ID_ENTREPRISE') || 0);
      const magasin = Number(localStorage.getItem('ZAIRE_ID_MAGASIN') || 0);
      const poste = Number(localStorage.getItem('ZAIRE_ID_POSTE') || emp.idposte || 0);

      if (!entreprise) {
        alert('Entreprise non définie. Veuillez vous reconnecter.');
        router.push('/login');
        return null;
      }

      setIdEmploye(id);
      setIdEntreprise(entreprise);
      setIdMagasin(magasin);
      setIdPoste(poste);
      localStorage.setItem('idEmploye', String(id));

      const nomComplet = `${emp.prenom ?? ''} ${emp.nom ?? ''}`.trim();

      setNomCaissier(nomComplet || 'CAISSIER WEB');
      localStorage.setItem('nomcaissier', nomComplet || 'CAISSIER WEB');

      return {
        idEmploye: id,
        idEntreprise: entreprise,
        idMagasin: magasin,
        idPoste: poste,
      };
    } catch (error) {
      console.error(error);
      router.push('/login');
      return null;
    }
  }

  async function chargerSessions(idCaissier = idEmploye) {
    setLoading(true);

    try {
      const res = await fetch(`${apiUrl()}/session-caisse`, {
        cache: 'no-store',
        headers: getAuthHeaders(),
      });
      const texte = await res.text();
      const data = lireReponse(texte);

      if (!res.ok) {
        alert(`Erreur API ${res.status} : ${typeof data === 'string' ? data : JSON.stringify(data)}`);
        return;
      }

      const rows = Array.isArray(data) ? data : [];
      setSessions(rows);

      const ouverte =
        rows.find(
          (s) =>
            Number(s.idcaissier) === Number(idCaissier) &&
            String(s.etat).toUpperCase() === 'OUVERTE',
        ) ?? null;

      setSessionActive(ouverte);
      setSelection(ouverte ?? rows[0] ?? null);

      if (ouverte?.idsession) {
        localStorage.setItem('idSessionCaisse', String(ouverte.idsession));
      }
    } catch (error) {
      console.error(error);
      alert('Impossible de charger les sessions caisse.');
    } finally {
      setLoading(false);
    }
  }

  async function ouvrirSession() {
    if (!idEmploye || idEmploye <= 0) {
      alert('Aucun employé connecté.');
      router.push('/login');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${apiUrl()}/session-caisse/ouvrir`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          idCaissier: idEmploye,
          idPoste: idPoste || undefined,
          idMagasin,
          idEntreprise,
        }),
      });

      const texte = await res.text();
      const data = lireReponse(texte);

      if (!res.ok) {
        alert(`Erreur API ${res.status} : ${typeof data === 'string' ? data : JSON.stringify(data)}`);
        return;
      }

      localStorage.setItem('idSessionCaisse', String(data.idsession));
      localStorage.setItem('idEmploye', String(idEmploye));

      await chargerSessions(idEmploye);
      alert('Session caisse ouverte.');
    } catch (error) {
      console.error(error);
      alert('Erreur API pendant l’ouverture.');
    } finally {
      setLoading(false);
    }
  }

  async function cloreSession() {
    if (!sessionActive?.idsession) {
      alert('Aucune session ouverte.');
      return;
    }

    if (!confirm('Voulez-vous vraiment clôturer cette session caisse ?')) return;

    setLoading(true);

    try {
      const res = await fetch(
        `${apiUrl()}/session-caisse/clore/${sessionActive.idsession}`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
        },
      );

      const texte = await res.text();
      const data = lireReponse(texte);

      if (!res.ok) {
        alert(`Erreur API ${res.status} : ${typeof data === 'string' ? data : JSON.stringify(data)}`);
        return;
      }

      localStorage.removeItem('idSessionCaisse');

      await chargerSessions(idEmploye);
      alert('Session caisse clôturée.');
    } catch (error) {
      console.error(error);
      alert('Erreur API pendant la clôture.');
    } finally {
      setLoading(false);
    }
  }

  async function actualiserResume(idSession: number) {
    setLoading(true);

    try {
      const res = await fetch(`${apiUrl()}/session-caisse/resume/${idSession}`, {
        cache: 'no-store',
        headers: getAuthHeaders(),
      });

      const texte = await res.text();
      const data = lireReponse(texte);

      if (!res.ok) {
        alert(`Erreur API ${res.status} : ${typeof data === 'string' ? data : JSON.stringify(data)}`);
        return;
      }

      setSelection(data);
      setSessions((actuelles) =>
        actuelles.map((session) =>
          session.idsession === idSession
            ? { ...session, ...data }
            : session,
        ),
      );
    } catch (error) {
      console.error(error);
      alert('Erreur pendant l’actualisation du résumé.');
    } finally {
      setLoading(false);
    }
  }

  async function rapportZ(idSession: number) {
    try {
      const res = await fetch(`${apiUrl()}/session-caisse/rapport-z/${idSession}`, {
        cache: 'no-store',
        headers: getAuthHeaders(),
      });

      const texte = await res.text();
      const data = lireReponse(texte);

      if (!res.ok) {
        alert(`Erreur API ${res.status} : ${typeof data === 'string' ? data : JSON.stringify(data)}`);
        return;
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const lien = document.createElement('a');
      lien.href = url;
      lien.download = `rapport-z-session-${idSession}.json`;
      lien.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert('Erreur rapport Z.');
    }
  }

  function money(v: any, devise = 'USD') {
    const n = Number(v ?? 0);
    return n.toLocaleString('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: devise === 'CDF' ? 0 : 2,
    });
  }

  function dateFr(v?: string | null) {
    if (!v) return '-';

    return new Date(v).toLocaleString('fr-FR', {
      timeZone: 'Africa/Kinshasa',
    });
  }

  const encaissementExact = useMemo(() => {
    if (!selection) return { CDF: 0, USD: 0, EUR: 0 };

    return {
      CDF:
        Number(selection.totalespecescdf ?? 0) +
        Number(selection.totalcartecdf ?? 0) +
        Number(selection.totalmobilemoneycdf ?? 0) +
        Number(selection.totalcomplementcdf ?? 0) -
        Number(selection.totalremboursementscdf ?? 0),

      USD:
        Number(selection.totalespecesusd ?? 0) +
        Number(selection.totalcarteusd ?? 0) +
        Number(selection.totalmobilemoneyusd ?? 0) +
        Number(selection.totalcomplementusd ?? 0) -
        Number(selection.totalremboursementsusd ?? 0),

      EUR:
        Number(selection.totalespeceseur ?? 0) +
        Number(selection.totalcarteeur ?? 0) +
        Number(selection.totalmobilemoneyeur ?? 0) +
        Number(selection.totalcomplementeur ?? 0) -
        Number(selection.totalremboursementseur ?? 0),
    };
  }, [selection]);

  return (
    <main className="min-h-screen bg-slate-100 p-5 text-slate-900">
      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-blue-700">SESSION CAISSE</h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Ouverture, clôture, encaissements, crédits, remises et rapport Z
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={ouvrirSession}
              disabled={loading || !!sessionActive}
              className="rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white disabled:bg-slate-300"
            >
              Ouvrir session
            </button>

            <button
              onClick={cloreSession}
              disabled={loading || !sessionActive}
              className="rounded-xl bg-red-600 px-5 py-3 font-bold text-white disabled:bg-slate-300"
            >
              Clôturer session
            </button>
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[380px_1fr]">
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-black text-slate-800">Informations session</h2>

          <div className="mt-4 space-y-3">
            <Info label="Caissier" value={nomCaissier} />
            <Info label="ID employé" value={String(idEmploye)} />
            <Info label="Session active" value={sessionActive ? `N° ${sessionActive.idsession}` : 'Aucune'} />
            <Info label="État" value={sessionActive?.etat ?? 'FERMÉE'} />
            <Info label="Date ouverture" value={dateFr(sessionActive?.dateouverture)} />
          </div>

          {selection && (
            <div className="mt-5 rounded-2xl border bg-blue-50 p-4">
              <h3 className="font-black text-blue-700">SYNTHÈSE ENCAISSEMENTS EXACTS</h3>
              <div className="mt-3 font-bold text-blue-950">
                <p>CDF : {money(encaissementExact.CDF, 'CDF')} CDF</p>
                <p>USD : {money(encaissementExact.USD, 'USD')} USD</p>
                <p>EUR : {money(encaissementExact.EUR, 'EUR')} EUR</p>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-black text-slate-800">Liste des sessions</h2>

            <button
              onClick={() => void chargerSessions(idEmploye)}
              className="rounded-xl bg-blue-600 px-4 py-2 font-bold text-white"
            >
              Actualiser
            </button>
          </div>

          <div className="mt-4 overflow-auto rounded-2xl border">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-slate-100 text-left">
                <tr>
                  <th className="border p-3">N°</th>
                  <th className="border p-3">Caissier</th>
                  <th className="border p-3">Ouverture</th>
                  <th className="border p-3">Fermeture</th>
                  <th className="border p-3">État</th>
                  <th className="border p-3">Action</th>
                </tr>
              </thead>

              <tbody>
                {sessions.map((s) => (
                  <tr
                    key={s.idsession}
                    onClick={() => setSelection(s)}
                    className={`cursor-pointer hover:bg-blue-50 ${
                      selection?.idsession === s.idsession ? 'bg-blue-50' : 'bg-white'
                    }`}
                  >
                    <td className="border p-3 font-bold">{s.idsession}</td>
                    <td className="border p-3">
                      {`${s.prenom ?? ''} ${s.nom ?? ''}`.trim() || s.idcaissier}
                    </td>
                    <td className="border p-3">{dateFr(s.dateouverture)}</td>
                    <td className="border p-3">{dateFr(s.datefermeture)}</td>
                    <td className="border p-3 font-bold">{s.etat}</td>
                    <td className="border p-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          actualiserResume(s.idsession);
                        }}
                        className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-bold text-white"
                      >
                        Résumé
                      </button>
                    </td>
                  </tr>
                ))}

                {sessions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-500">
                      Aucune session trouvée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {selection && (
        <section className="mt-5 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-black text-slate-800">
              Résumé session N° {selection.idsession}
            </h2>

            <button
              onClick={() => rapportZ(selection.idsession)}
              className="rounded-xl bg-purple-700 px-5 py-3 font-bold text-white"
            >
              Rapport Z
            </button>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <BlocTitre titre="Espèces" cdf={selection.totalespecescdf} usd={selection.totalespecesusd} eur={selection.totalespeceseur} />
            <BlocTitre titre="Carte" cdf={selection.totalcartecdf} usd={selection.totalcarteusd} eur={selection.totalcarteeur} />
            <BlocTitre titre="Mobile Money" cdf={selection.totalmobilemoneycdf} usd={selection.totalmobilemoneyusd} eur={selection.totalmobilemoneyeur} />
            <BlocTitre titre="Remboursements" cdf={selection.totalremboursementscdf} usd={selection.totalremboursementsusd} eur={selection.totalremboursementseur} />
            <BlocTitre titre="Compléments échanges" cdf={selection.totalcomplementcdf} usd={selection.totalcomplementusd} eur={selection.totalcomplementeur} />
            <BlocTitre titre="Crédits" cdf={selection.totalcreditcdf} usd={selection.totalcreditusd} eur={selection.totalcrediteur} />
            <BlocTitre titre="Remises" cdf={selection.totalremisecdf} usd={selection.totalremiseusd} eur={selection.totalremiseeur} />
            <BlocTitre titre="Argent en main" cdf={encaissementExact.CDF} usd={encaissementExact.USD} eur={encaissementExact.EUR} />
          </div>
        </section>
      )}
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-slate-50 p-3">
      <div className="text-xs font-bold uppercase text-slate-500">{label}</div>
      <div className="mt-1 font-black text-slate-900">{value}</div>
    </div>
  );
}

function BlocTitre({
  titre,
  cdf,
  usd,
  eur,
}: {
  titre: string;
  cdf?: any;
  usd?: any;
  eur?: any;
}) {
  function money(v: any, devise: 'CDF' | 'USD' | 'EUR') {
    const n = Number(v ?? 0);
    return n.toLocaleString('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: devise === 'CDF' ? 0 : 2,
    });
  }

  return (
    <div className="rounded-2xl border bg-slate-50 p-4">
      <h3 className="font-black text-blue-700">{titre}</h3>
      <div className="mt-3 space-y-1 font-bold text-slate-800">
        <p>CDF : {money(cdf, 'CDF')} CDF</p>
        <p>USD : {money(usd, 'USD')} USD</p>
        <p>EUR : {money(eur, 'EUR')} EUR</p>
      </div>
    </div>
  );
}