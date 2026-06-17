'use client';

import { useEffect, useMemo, useState } from 'react';
import { getAuthHeaders } from '@/app/services/compte.service';

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

type Resume = {
  date: string;
  jour: ResumeBloc;
  semaine: ResumeBloc;
  mois: ResumeBloc;
  observation?: string;
};

type Cloture = {
  id: number;
  datecloture: string;
  idcaissier: number;
  nomcaissier?: string;
  entreesfc?: number;
  sortiesfc?: number;
  photofc?: number;
  ventefc?: number;
  balancefc?: number;
  entreesusd?: number;
  sortiesusd?: number;
  photousd?: number;
  venteusd?: number;
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

export default function Page() {
  const [date, setDate] = useState(todayISO());
  const [resume, setResume] = useState<Resume | null>(null);
  const [clotures, setClotures] = useState<Cloture[]>([]);
  const [observation, setObservation] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [idCaissier, setIdCaissier] = useState(0);
  const [nomCaissier, setNomCaissier] = useState('CAISSIER WEB');

  useEffect(() => {
    chargerEmploye();
    charger();
  }, []);

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
      setObservation(d1?.observation || '');
      setClotures(Array.isArray(d2) ? d2 : []);
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

      setMessage(data?.message || 'Clôture validée.');
      setObservation('');
      await charger();
    } catch (e: any) {
      setMessage(e?.message || 'Erreur validation clôture.');
    } finally {
      setLoading(false);
    }
  }

  async function supprimer(id: number) {
    if (!confirm('Supprimer cette clôture ?')) return;

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

      setMessage(data?.message || 'Clôture supprimée.');
      await charger();
    } catch (e: any) {
      setMessage(e?.message || 'Erreur suppression.');
    } finally {
      setLoading(false);
    }
  }

  function imprimer() {
    window.print();
  }

  const jour = resume?.jour;
  const semaine = resume?.semaine;
  const mois = resume?.mois;

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
              <h1 className="mt-2 text-3xl font-black text-slate-950">
                Clôture journalière de caisse
              </h1>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                Récapitulatif journalier, hebdomadaire, mensuel, observation,
                validation et manager.
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
                onClick={imprimer}
                className="rounded-2xl bg-blue-700 px-5 py-3 font-black text-white"
              >
                Imprimer / PDF
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
          <InfoCard title="Date clôture" value={date} />
          <InfoCard title="Caissier" value={nomCaissier} />
          <InfoCard title="ID caissier" value={String(idCaissier || '-')} />
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

        <section className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-xl font-black text-slate-950">Observation</h2>
            <textarea
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              rows={7}
              placeholder="Observation de la journée..."
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
                onClick={() => setObservation('')}
                className="w-full rounded-2xl bg-slate-100 px-5 py-4 font-black text-slate-800"
              >
                Annuler / Vider
              </button>

              <button
                onClick={imprimer}
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

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-slate-950">
                Manager clôtures
              </h2>
              <p className="text-sm font-semibold text-slate-500">
                Liste des dernières clôtures validées.
              </p>
            </div>
            <button
              onClick={charger}
              className="rounded-2xl bg-slate-950 px-5 py-3 font-black text-white"
            >
              Actualiser manager
            </button>
          </div>

          <div className="hidden overflow-x-auto rounded-2xl ring-1 ring-slate-200 lg:block">
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
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {clotures.map((c) => (
                  <tr key={c.id} className="border-t border-slate-100">
                    <td className="p-3 font-black">{c.id}</td>
                    <td className="p-3">{String(c.datecloture).slice(0, 10)}</td>
                    <td className="p-3">{c.nomcaissier || c.idcaissier}</td>
                    <td className="p-3">{money(c.entreesfc)}</td>
                    <td className="p-3">{money(c.sortiesfc)}</td>
                    <td className="p-3 font-black">{money(c.balancefc)}</td>
                    <td className="p-3">{money(c.entreesusd)}</td>
                    <td className="p-3">{money(c.sortiesusd)}</td>
                    <td className="p-3 font-black">{money(c.balanceusd)}</td>
                    <td className="p-3">
                      <button
                        onClick={() => supprimer(c.id)}
                        className="rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-700"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 lg:hidden">
            {clotures.map((c) => (
              <div
                key={c.id}
                className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200"
              >
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="text-lg font-black text-slate-950">
                      Clôture N° {c.id}
                    </p>
                    <p className="text-sm text-slate-500">
                      {String(c.datecloture).slice(0, 10)} ·{' '}
                      {c.nomcaissier || c.idcaissier}
                    </p>
                  </div>
                  <button
                    onClick={() => supprimer(c.id)}
                    className="rounded-xl bg-red-600 px-3 py-2 text-xs font-black text-white"
                  >
                    Suppr.
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Small label="Entrées FC" value={`${money(c.entreesfc)} FC`} />
                  <Small label="Sorties FC" value={`${money(c.sortiesfc)} FC`} />
                  <Small label="Balance FC" value={`${money(c.balancefc)} FC`} />
                  <Small label="Balance USD" value={`${money(c.balanceusd)} USD`} />
                </div>
              </div>
            ))}
          </div>

          {!clotures.length && (
            <div className="rounded-3xl bg-slate-50 p-8 text-center font-black text-slate-500">
              Aucune clôture trouvée.
            </div>
          )}
        </section>
      </div>
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

function RecapCard({
  title,
  devise,
  entrees,
  sorties,
  photo,
  vente,
  balance,
}: {
  title: string;
  devise: string;
  entrees?: number;
  sorties?: number;
  photo?: number;
  vente?: number;
  balance?: number;
}) {
  return (
    <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-xl font-black text-blue-700">{title}</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Small label="Entrées" value={`${money(entrees)} ${devise}`} />
        <Small label="Sorties" value={`${money(sorties)} ${devise}`} />
        <Small label="Photo" value={`${money(photo)} ${devise}`} />
        <Small label="Vente" value={`${money(vente)} ${devise}`} />
        <Small label="Balance" value={`${money(balance)} ${devise}`} />
      </div>
    </div>
  );
}

function MiniCard({
  title,
  devise,
  entrees,
  sorties,
  balance,
}: {
  title: string;
  devise: string;
  entrees?: number;
  sorties?: number;
  balance?: number;
}) {
  return (
    <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-lg font-black text-slate-950">{title}</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Small label="Entrées" value={`${money(entrees)} ${devise}`} />
        <Small label="Sorties" value={`${money(sorties)} ${devise}`} />
        <Small label="Balance" value={`${money(balance)} ${devise}`} />
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