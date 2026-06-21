'use client';

import { useEffect, useMemo, useState } from 'react';

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://messiematala-pos-backend-production.up.railway.app';

type Resume = {
  entreesFC: number;
  sortiesFC: number;
  entreesUSD: number;
  sortiesUSD: number;
  balanceFC: number;
  balanceUSD: number;
};

type Mouvement = {
  idmouvement: number;
  dateheure: string;
  typemouvement: string;
  montant: number;
  motif: string;
  description?: string | null;
  nomcaissier?: string | null;
  autorisepar?: string | null;
  devise: string;
};

type Tiers = {
  id: number;
  nom: string;
};

const types = ['Entrée', 'Sortie', 'Autres'];
const devises = ['FC', 'USD'];

const motifs = [
  'Fonds de caisse',
  'Vente',
  'Dépense divers',
  'Approvisionnement',
  'PAIEMENT FOURNISSEUR',
  'Paiement Agent',
  'Location',
  'Imprimerie',
  'Service Evenement Complet',
  'Remboursement',
  'Argent Photos',
  'Restauration',
  'Transport',
  'Poubelle',
  'Eau Fontaine',
  'Achat Outils de travail',
  'Versement SIM',
  'Versement BANK',
  'Soustraction SIM',
  'Soustraction BANK',
  'Envoi Patronne',
  'Couture',
  'TOTAL GENERAL ESPECE',
];

function money(v: number, devise = '') {
  return `${Number(v || 0).toLocaleString('fr-FR')} ${devise}`;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function Page() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [date, setDate] = useState(todayISO());

  const [mouvements, setMouvements] = useState<Mouvement[]>([]);
  const [resume, setResume] = useState<Resume>({
    entreesFC: 0,
    sortiesFC: 0,
    entreesUSD: 0,
    sortiesUSD: 0,
    balanceFC: 0,
    balanceUSD: 0,
  });

  const [typeMouvement, setTypeMouvement] = useState('Entrée');
  const [montant, setMontant] = useState('');
  const [devise, setDevise] = useState('FC');
  const [motif, setMotif] = useState('Fonds de caisse');
  const [description, setDescription] = useState('');

  const [tiers, setTiers] = useState<Tiers[]>([]);
  const [idTiers, setIdTiers] = useState('');
  const [nomTiers, setNomTiers] = useState('');

  const motifNormalise = motif
    .trim()
    .toUpperCase()
    .replaceAll('É', 'E')
    .replaceAll('È', 'E')
    .replaceAll('Ê', 'E');

  const paiementAgent = motifNormalise === 'PAIEMENT AGENT';
  const paiementFournisseur = motifNormalise === 'PAIEMENT FOURNISSEUR';

  const titreTiers = paiementAgent
    ? 'Nom agent'
    : paiementFournisseur
      ? 'Nom fournisseur'
      : '';

  const typeTiers = paiementAgent
    ? 'AGENT'
    : paiementFournisseur
      ? 'FOURNISSEUR'
      : '';

  const dateDebut = useMemo(() => `${date}T00:00:00`, [date]);
  const dateFin = useMemo(() => {
    const d = new Date(date);
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10) + 'T00:00:00';
  }, [date]);

  async function charger() {
    try {
      setLoading(true);
      setMessage('');

      const [mouvRes, resumeRes] = await Promise.all([
        fetch(`${API}/entrees-sorties-caisse/mouvements?dateDebut=${dateDebut}&dateFin=${dateFin}`),
        fetch(`${API}/entrees-sorties-caisse/resume?date=${date}`),
      ]);

      if (!mouvRes.ok) throw new Error(await mouvRes.text());
      if (!resumeRes.ok) throw new Error(await resumeRes.text());

      setMouvements(await mouvRes.json());
      setResume(await resumeRes.json());
    } catch (e: any) {
      setMessage(e.message || 'Erreur chargement.');
    } finally {
      setLoading(false);
    }
  }

  async function chargerTiers() {
    if (!paiementAgent && !paiementFournisseur) {
      setTiers([]);
      setIdTiers('');
      setNomTiers('');
      return;
    }

    if (typeMouvement !== 'Sortie') {
      setTypeMouvement('Sortie');
    }

    const url = paiementAgent
      ? `${API}/entrees-sorties-caisse/tiers/employes`
      : `${API}/entrees-sorties-caisse/tiers/fournisseurs`;

    const res = await fetch(url);
    if (res.ok) {
      setTiers(await res.json());
    }
  }

  useEffect(() => {
    charger();
  }, [date]);

  useEffect(() => {
    chargerTiers();
  }, [motif]);

  async function enregistrer() {
    try {
      setLoading(true);
      setMessage('');

      if (!montant || Number(montant) <= 0) {
        throw new Error('Montant obligatoire.');
      }

      if ((paiementAgent || paiementFournisseur) && !idTiers) {
        throw new Error(paiementAgent ? 'Sélectionne un agent.' : 'Sélectionne un fournisseur.');
      }

      const rawUser =
  localStorage.getItem('employe') ||
  localStorage.getItem('user') ||
  localStorage.getItem('utilisateur') ||
  '{}';

const user = JSON.parse(rawUser);

const idEmploye = Number(
  user.idemploye ??
    user.id_employe ??
    user.idEmploye ??
    0,
);

const nomCaissier =
  localStorage.getItem('nomcaissier') ||
  `${user.prenom ?? ''} ${user.nom ?? ''}`.trim() ||
  user.nomutilisateur ||
  user.email ||
  'SYSTEM';

const body = {
  typeMouvement,
  montant: Number(montant),
  devise,
  motif,
  description,
  idTiers: idTiers ? Number(idTiers) : undefined,
  nomTiers: nomTiers || undefined,
  typeTiers: typeTiers || undefined,

  idSession: null,

  idEntreprise:
    user.idEntreprise ??
    user.identreprise ??
    user.id_entreprise ??
    null,

  idMagasin:
    user.idMagasin ??
    user.idmagasin ??
    user.id_magasin ??
    null,

  idPoste:
    user.idPoste ??
    user.idposte ??
    user.id_poste ??
    null,

  idCaissier: idEmploye || null,
  nomCaissier,
};

      const res = await fetch(`${API}/entrees-sorties-caisse/mouvements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.message || 'Erreur enregistrement.');
      }

      setMessage(data?.message || 'Mouvement enregistré.');
      setMontant('');
      setDescription('');
      setIdTiers('');
      setNomTiers('');
      await charger();
    } catch (e: any) {
      setMessage(e.message || 'Erreur.');
    } finally {
      setLoading(false);
    }
  }
function ouvrirPdfSemaine() {
  const idEntreprise = localStorage.getItem('ZAIRE_ID_ENTREPRISE') || '1';

  window.open(
    `${API}/entrees-sorties-caisse/pdf/semaine?date=${date}&idEntreprise=${idEntreprise}`,
    '_blank',
  );
}

  async function supprimer(id: number) {
    if (!confirm('Supprimer ce mouvement ?')) return;

    const res = await fetch(`${API}/entrees-sorties-caisse/manager/supprimer/${id}`, {
      method: 'POST',
    });

    if (res.ok) {
      await charger();
    } else {
      alert(await res.text());
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-3 md:p-8">
      <div className="mx-auto max-w-7xl space-y-4">
        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-black text-blue-950 md:text-3xl">
                Entrées / Sorties de Caisse
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Gestion professionnelle des mouvements de caisse
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold"
              />

              <button
                onClick={charger}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white"
              >
                Actualiser
              </button>

              <button
                onClick={ouvrirPdfSemaine}
                className="rounded-xl bg-blue-900 px-4 py-2 text-sm font-bold text-white"
              >
                PDF semaine
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-6">
          <Card title="Entrées FC" value={money(resume.entreesFC, 'FC')} />
          <Card title="Sorties FC" value={money(resume.sortiesFC, 'FC')} />
          <Card title="Balance FC" value={money(resume.balanceFC, 'FC')} />
          <Card title="Entrées USD" value={money(resume.entreesUSD, 'USD')} />
          <Card title="Sorties USD" value={money(resume.sortiesUSD, 'USD')} />
          <Card title="Balance USD" value={money(resume.balanceUSD, 'USD')} />
        </section>

        <section className="grid gap-4 lg:grid-cols-[420px_1fr]">
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-lg font-black text-slate-900">Nouveau mouvement</h2>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-black uppercase text-slate-500">Type</label>
                <select
                  value={typeMouvement}
                  onChange={(e) => setTypeMouvement(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 font-bold"
                >
                  {types.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black uppercase text-slate-500">Montant</label>
                  <input
                    value={montant}
                    onChange={(e) => setMontant(e.target.value)}
                    type="number"
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 font-bold"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="text-xs font-black uppercase text-slate-500">Devise</label>
                  <select
                    value={devise}
                    onChange={(e) => setDevise(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 font-bold"
                  >
                    {devises.map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-black uppercase text-slate-500">Motif</label>
                <select
                  value={motif}
                  onChange={(e) => setMotif(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 font-bold"
                >
                  {motifs.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </div>

              {(paiementAgent || paiementFournisseur) && (
                <div className="rounded-2xl bg-amber-50 p-3 ring-1 ring-amber-200">
                  <label className="text-xs font-black uppercase text-amber-700">
                    {titreTiers}
                  </label>

                  <select
                    value={idTiers}
                    onChange={(e) => {
                      const id = e.target.value;
                      const found = tiers.find((t) => String(t.id) === id);
                      setIdTiers(id);
                      setNomTiers(found?.nom || '');
                    }}
                    className="mt-1 w-full rounded-xl border border-amber-300 px-3 py-3 font-bold"
                  >
                    <option value="">Sélectionner</option>
                    {tiers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nom}
                      </option>
                    ))}
                  </select>

                  <p className="mt-2 text-xs font-bold text-amber-700">
                    ID sélectionné : {idTiers || '-'}
                  </p>
                </div>
              )}

              <div>
                <label className="text-xs font-black uppercase text-slate-500">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3"
                  placeholder="Observation..."
                />
              </div>

              {message && (
                <div className="rounded-xl bg-slate-100 p-3 text-sm font-bold text-slate-700">
                  {message}
                </div>
              )}

              <button
                onClick={enregistrer}
                disabled={loading}
                className="w-full rounded-2xl bg-blue-950 px-5 py-4 font-black text-white disabled:opacity-50"
              >
                {loading ? 'Traitement...' : 'Enregistrer'}
              </button>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-lg font-black text-slate-900">Mouvements du jour</h2>

            <div className="mt-4 hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase text-slate-500">
                    <th className="py-3">Date</th>
                    <th>Type</th>
                    <th>Montant</th>
                    <th>Motif</th>
                    <th>Description</th>
                    <th>Caissier</th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  {mouvements.map((m) => (
                    <tr key={m.idmouvement} className="border-b last:border-0">
                      <td className="py-3">
                        {new Date(m.dateheure).toLocaleString('fr-FR')}
                      </td>
                      <td className="font-bold">{m.typemouvement}</td>
                      <td className="font-black">
                        {money(Number(m.montant), m.devise)}
                      </td>
                      <td>{m.motif}</td>
                      <td className="max-w-[260px] truncate">{m.description || '-'}</td>
                      <td>{m.nomcaissier || '-'}</td>
                      <td>
                        <button
                          onClick={() => supprimer(m.idmouvement)}
                          className="rounded-lg bg-red-50 px-3 py-1 text-xs font-black text-red-700"
                        >
                          Suppr.
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 space-y-3 md:hidden">
              {mouvements.map((m) => (
                <div
                  key={m.idmouvement}
                  className="rounded-2xl border border-slate-200 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-black text-slate-900">{m.motif}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(m.dateheure).toLocaleString('fr-FR')}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-black text-blue-950">
                        {money(Number(m.montant), m.devise)}
                      </p>
                      <p className="text-xs font-bold text-slate-500">
                        {m.typemouvement}
                      </p>
                    </div>
                  </div>

                  <p className="mt-2 text-sm text-slate-600">
                    {m.description || '-'}
                  </p>

                  <button
                    onClick={() => supprimer(m.idmouvement)}
                    className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-700"
                  >
                    Supprimer
                  </button>
                </div>
              ))}
            </div>

            {!mouvements.length && (
              <div className="mt-8 rounded-2xl bg-slate-50 p-8 text-center text-sm font-bold text-slate-500">
                Aucun mouvement trouvé.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <p className="text-xs font-black uppercase text-slate-500">{title}</p>
      <p className="mt-2 text-xl font-black text-blue-950">{value}</p>
    </div>
  );
}