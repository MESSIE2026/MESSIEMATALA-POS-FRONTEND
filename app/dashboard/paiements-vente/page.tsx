'use client';

import { useEffect, useMemo, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://messiematala-pos-backend-production.up.railway.app';

type Tab = 'saisie' | 'historique' | 'rapport';

type Paiement = {
  idPaiement: number;
  idVente: number;
  modePaiement: string;
  devise: string;
  montant: number;
  datePaiement: string;
  referenceTransaction?: string;
  statut: string;
  annulePar?: string;
  dateAnnulation?: string;
  motifAnnulation?: string;
};

type LignePaiement = {
  modePaiement: string;
  devise: string;
  montant: string;
  referenceTransaction: string;
};

export default function Page() {
  const [tab, setTab] = useState<Tab>('saisie');

  const [idVente, setIdVente] = useState('');
  const [idEntreprise, setIdEntreprise] = useState('');
  const [idMagasin, setIdMagasin] = useState('');
  const [idPoste, setIdPoste] = useState('');

  const [lignes, setLignes] = useState<LignePaiement[]>([
    { modePaiement: 'CASH', devise: 'CDF', montant: '', referenceTransaction: '' },
  ]);

  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [rapport, setRapport] = useState<any>(null);

  const [motifAnnulation, setMotifAnnulation] = useState('');
  const [annulePar, setAnnulePar] = useState('');
  const [selectedPaiement, setSelectedPaiement] = useState<Paiement | null>(null);

  const [dateRapport, setDateRapport] = useState(new Date().toISOString().slice(0, 10));
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const totalSaisie = useMemo(() => {
    const t: Record<string, number> = { USD: 0, CDF: 0, EUR: 0 };

    for (const l of lignes) {
      const d = normalizeDevise(l.devise);
      const m = Number(String(l.montant || '0').replace(',', '.'));
      if (Number.isFinite(m) && m > 0) t[d] += m;
    }

    return t;
  }, [lignes]);

  async function apiGet(path: string) {
    const res = await fetch(`${API_URL}${path}`, { cache: 'no-store' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || 'Erreur API');
    return data;
  }

  async function apiPost(path: string, body: any) {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || 'Erreur API');
    return data;
  }

  async function apiPatch(path: string, body: any) {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || 'Erreur API');
    return data;
  }

  function updateLigne(index: number, field: keyof LignePaiement, value: string) {
    setLignes((old) =>
      old.map((l, i) => (i === index ? { ...l, [field]: value } : l)),
    );
  }

  function ajouterLigne() {
    setLignes((old) => [
      ...old,
      { modePaiement: 'CASH', devise: 'CDF', montant: '', referenceTransaction: '' },
    ]);
  }

  function supprimerLigne(index: number) {
    setLignes((old) => old.filter((_, i) => i !== index));
  }

  async function enregistrerSplit() {
    try {
      setLoading(true);
      setMessage('');

      const idV = Number(idVente);
      if (!idV) throw new Error('IdVente obligatoire.');

      const paiementsPayload = lignes
        .map((l) => ({
          idVente: idV,
          modePaiement: l.modePaiement,
          devise: normalizeDevise(l.devise),
          montant: Number(String(l.montant || '0').replace(',', '.')),
          referenceTransaction: l.referenceTransaction,
          deviseOriginale: normalizeDevise(l.devise),
          montantOriginal: Number(String(l.montant || '0').replace(',', '.')),
          tauxApplique: 1,
          idEntreprise: idEntreprise ? Number(idEntreprise) : undefined,
          idMagasin: idMagasin ? Number(idMagasin) : undefined,
          idPoste: idPoste ? Number(idPoste) : undefined,
        }))
        .filter((p) => p.montant > 0);

      if (paiementsPayload.length === 0) {
        throw new Error('Ajoute au moins un paiement valide.');
      }

      const data = await apiPost('/paiements-vente/split', {
        paiements: paiementsPayload,
      });

      setMessage(data.message || 'Paiements enregistrés.');
      await chargerHistorique();
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function chargerHistorique() {
    try {
      setLoading(true);
      setMessage('');

      const idV = Number(idVente);
      if (!idV) throw new Error('Saisis IdVente pour charger l’historique.');

      const data = await apiGet(`/paiements-vente/vente/${idV}`);
      setPaiements(data.paiements || []);
      setTab('historique');
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function annulerPaiement() {
    try {
      if (!selectedPaiement) throw new Error('Sélectionne un paiement.');
      if (!motifAnnulation.trim()) throw new Error('Motif annulation obligatoire.');
      if (!annulePar.trim()) throw new Error('Nom utilisateur obligatoire.');

      setLoading(true);
      setMessage('');

      const data = await apiPatch(
        `/paiements-vente/${selectedPaiement.idPaiement}/annuler`,
        {
          annulePar,
          motifAnnulation,
        },
      );

      setMessage(data.message || 'Paiement annulé.');
      setMotifAnnulation('');
      setSelectedPaiement(null);
      await chargerHistorique();
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function chargerRapport() {
    try {
      setLoading(true);
      setMessage('');

      const params = new URLSearchParams();
      params.set('date', dateRapport);
      if (idEntreprise) params.set('idEntreprise', idEntreprise);
      if (idMagasin) params.set('idMagasin', idMagasin);
      if (idPoste) params.set('idPoste', idPoste);

      const data = await apiGet(`/paiements-vente/rapport-jour?${params.toString()}`);
      setRapport(data);
      setTab('rapport');
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    chargerRapport().catch(() => {});
  }, []);

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl bg-gradient-to-r from-slate-950 to-emerald-900 p-7 text-white">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-widest text-emerald-200">
                Ventes / Caisse
              </p>
              <h1 className="mt-2 text-3xl font-black">Paiements Vente</h1>
              <p className="mt-2 text-sm text-slate-200">
                Split paiement, historique, annulation et rapport journalier.
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 px-5 py-4 ring-1 ring-white/20">
              <p className="text-xs text-slate-300">Total saisie</p>
              <p className="font-black">
                USD {fmt(totalSaisie.USD)} | CDF {fmt(totalSaisie.CDF)} | EUR {fmt(totalSaisie.EUR)}
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[290px_1fr]">
          <aside className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <MenuButton active={tab === 'saisie'} onClick={() => setTab('saisie')}>
              Saisie split
            </MenuButton>
            <MenuButton active={tab === 'historique'} onClick={chargerHistorique}>
              Historique vente
            </MenuButton>
            <MenuButton active={tab === 'rapport'} onClick={chargerRapport}>
              Rapport du jour
            </MenuButton>
          </aside>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            {message && (
              <div className="mb-5 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700">
                {message}
              </div>
            )}

            <div className="mb-6 grid gap-4 md:grid-cols-4">
              <Input label="IdVente" value={idVente} onChange={setIdVente} />
              <Input label="IdEntreprise" value={idEntreprise} onChange={setIdEntreprise} />
              <Input label="IdMagasin" value={idMagasin} onChange={setIdMagasin} />
              <Input label="IdPoste" value={idPoste} onChange={setIdPoste} />
            </div>

            {tab === 'saisie' && (
              <Panel title="Saisie des paiements">
                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-950 text-white">
                      <tr>
                        <th className="p-3 text-left">Mode</th>
                        <th className="p-3 text-left">Devise</th>
                        <th className="p-3 text-right">Montant</th>
                        <th className="p-3 text-left">Référence</th>
                        <th className="p-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {lignes.map((l, i) => (
                        <tr key={i} className="border-t border-slate-200">
                          <td className="p-2">
  <Select
    value={l.modePaiement}
    onChange={(v: string) => updateLigne(i, 'modePaiement', v)}
    options={['CASH', 'MOMO', 'CARTE', 'VIREMENT', 'FIDELITE', 'CREDIT']}
  />
</td>

<td className="p-2">
  <Select
    value={l.devise}
    onChange={(v: string) => updateLigne(i, 'devise', v)}
    options={['CDF', 'USD', 'EUR']}
  />
</td>

<td className="p-2">
                            <input
                              value={l.montant}
                              onChange={(e) => updateLigne(i, 'montant', e.target.value)}
                              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-right font-bold"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              value={l.referenceTransaction}
                              onChange={(e) => updateLigne(i, 'referenceTransaction', e.target.value)}
                              className="w-full rounded-xl border border-slate-200 px-3 py-2"
                            />
                          </td>
                          <td className="p-2 text-right">
                            <button
                              onClick={() => supprimerLigne(i)}
                              className="rounded-xl bg-red-50 px-3 py-2 font-bold text-red-700"
                            >
                              Supprimer
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button onClick={ajouterLigne} className="rounded-2xl bg-slate-100 px-5 py-3 font-black">
                    Ajouter ligne
                  </button>
                  <button
                    onClick={enregistrerSplit}
                    disabled={loading}
                    className="rounded-2xl bg-emerald-700 px-6 py-3 font-black text-white disabled:opacity-50"
                  >
                    Enregistrer paiements
                  </button>
                </div>
              </Panel>
            )}

            {tab === 'historique' && (
              <Panel title="Historique des paiements de la vente">
                <div className="mb-4 grid gap-4 md:grid-cols-3">
                  <Input label="Annulé par" value={annulePar} onChange={setAnnulePar} />
                  <Input label="Motif annulation" value={motifAnnulation} onChange={setMotifAnnulation} />
                  <button
                    onClick={annulerPaiement}
                    disabled={loading || !selectedPaiement}
                    className="mt-7 rounded-2xl bg-red-700 px-6 py-3 font-black text-white disabled:opacity-50"
                  >
                    Annuler paiement sélectionné
                  </button>
                </div>

                <TablePaiements
                  paiements={paiements}
                  selected={selectedPaiement}
                  onSelect={setSelectedPaiement}
                />
              </Panel>
            )}

            {tab === 'rapport' && (
              <Panel title="Rapport journalier paiements / ventes">
                <div className="mb-4 flex flex-wrap items-end gap-3">
                  <Input label="Date" value={dateRapport} onChange={setDateRapport} type="date" />
                  <button
                    onClick={chargerRapport}
                    disabled={loading}
                    className="rounded-2xl bg-slate-950 px-6 py-3 font-black text-white disabled:opacity-50"
                  >
                    Actualiser
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="rounded-2xl bg-emerald-700 px-6 py-3 font-black text-white"
                  >
                    Imprimer / PDF
                  </button>
                </div>

                <div className="mb-5 grid gap-4 md:grid-cols-2">
                  <Card title="Paiements valides" data={rapport?.resume?.valides} />
                  <Card title="Paiements annulés" data={rapport?.resume?.annules} />
                </div>

                <TablePaiements paiements={rapport?.paiements || []} />
              </Panel>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function TablePaiements({
  paiements,
  selected,
  onSelect,
}: {
  paiements: Paiement[];
  selected?: Paiement | null;
  onSelect?: (p: Paiement) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-950 text-white">
          <tr>
            <th className="p-3">ID</th>
            <th className="p-3">Vente</th>
            <th className="p-3">Date</th>
            <th className="p-3">Mode</th>
            <th className="p-3">Devise</th>
            <th className="p-3 text-right">Montant</th>
            <th className="p-3">Statut</th>
            <th className="p-3">Référence / Motif</th>
          </tr>
        </thead>
        <tbody>
          {paiements.map((p) => {
            const active = selected?.idPaiement === p.idPaiement;
            const annule = String(p.statut || '').toUpperCase().startsWith('ANNULE');

            return (
              <tr
                key={p.idPaiement}
                onClick={() => onSelect?.(p)}
                className={`cursor-pointer border-t border-slate-200 ${
                  active ? 'bg-emerald-50' : ''
                } ${annule ? 'text-slate-400 line-through' : ''}`}
              >
                <td className="p-3 font-bold">{p.idPaiement}</td>
                <td className="p-3">{p.idVente}</td>
                <td className="p-3">{formatDate(p.datePaiement)}</td>
                <td className="p-3">{p.modePaiement}</td>
                <td className="p-3">{p.devise}</td>
                <td className="p-3 text-right font-bold">{fmt(p.montant)}</td>
                <td className="p-3">{p.statut}</td>
                <td className="p-3">{p.referenceTransaction || p.motifAnnulation || '-'}</td>
              </tr>
            );
          })}

          {paiements.length === 0 && (
            <tr>
              <td colSpan={8} className="p-6 text-center font-bold text-slate-500">
                Aucun paiement trouvé.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function MenuButton({ active, onClick, children }: any) {
  return (
    <button
      onClick={onClick}
      className={`mb-2 w-full rounded-2xl px-4 py-3 text-left text-sm font-black ${
        active ? 'bg-emerald-700 text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
      }`}
    >
      {children}
    </button>
  );
}

function Panel({ title, children }: any) {
  return (
    <div>
      <h2 className="text-2xl font-black text-slate-950">{title}</h2>
      <div className="mt-6 space-y-4">{children}</div>
    </div>
  );
}

function Input({ label, value, onChange, type = 'text' }: any) {
  return (
    <label className="block">
      <span className="text-sm font-black text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
      />
    </label>
  );
}

function Select({ value, onChange, options }: any) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-slate-200 px-3 py-2 font-bold"
    >
      {options.map((o: string) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
}

function Card({ title, data }: any) {
  return (
    <div className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
      <p className="text-sm font-black text-slate-500">{title}</p>
      <p className="mt-2 text-lg font-black text-slate-950">
        USD {fmt(data?.USD || 0)} | CDF {fmt(data?.CDF || 0)} | EUR {fmt(data?.EUR || 0)}
      </p>
    </div>
  );
}

function normalizeDevise(v: string) {
  const d = String(v || '').toUpperCase();
  if (d === 'FC') return 'CDF';
  if (!['CDF', 'USD', 'EUR'].includes(d)) return 'CDF';
  return d;
}

function fmt(v: any) {
  return Number(v || 0).toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(value: string) {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleString('fr-FR');
  } catch {
    return value;
  }
}