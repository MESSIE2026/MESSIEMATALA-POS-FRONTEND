'use client';

import { useEffect, useMemo, useState } from 'react';

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://messiematala-pos-backend-production.up.railway.app';

type TypeRapport =
  | 'Journalier'
  | 'Hebdomadaire'
  | 'Mensuel'
  | 'Annuel'
  | 'Periode'
  | 'ParCaissier';

type Onglet = 'rapports' | 'operations';

type Vente = {
  id_vente: number;
  codefacture?: string | null;
  datevente?: string | null;
  nomclient?: string | null;
  nomcaissier?: string | null;
  modepaiement?: string | null;
  devise?: string | null;
  montanttotal?: string | number | null;
  statut?: string | null;
};

type Stats = {
  total_ventes?: number;
  ventes_validees?: number;
  ventes_annulees?: number;
  total_usd?: string | number;
  total_cdf?: string | number;
  total_eur?: string | number;
};

type SynthesePaiement = {
  modepaiement?: string | null;
  devise?: string | null;
  nombre?: number;
  total?: string | number;
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function toInputDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function money(value: any, devise = '') {
  const n = Number(value || 0);
  return `${n.toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} ${devise}`.trim();
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString('fr-FR');
}

function calculerPeriode(type: TypeRapport, baseDate: string) {
  const d = new Date(`${baseDate}T00:00:00`);

  if (type === 'Journalier') {
    return { debut: baseDate, fin: baseDate, finDisabled: true };
  }

  if (type === 'Hebdomadaire') {
    const day = d.getDay();
    const diff = (day + 6) % 7;
    const lundi = new Date(d);
    lundi.setDate(d.getDate() - diff);

    const dimanche = new Date(lundi);
    dimanche.setDate(lundi.getDate() + 6);

    return {
      debut: toInputDate(lundi),
      fin: toInputDate(dimanche),
      finDisabled: true,
    };
  }

  if (type === 'Mensuel') {
    const debut = new Date(d.getFullYear(), d.getMonth(), 1);
    const fin = new Date(d.getFullYear(), d.getMonth() + 1, 0);

    return {
      debut: toInputDate(debut),
      fin: toInputDate(fin),
      finDisabled: true,
    };
  }

  if (type === 'Annuel') {
    const debut = new Date(d.getFullYear(), 0, 1);
    const fin = new Date(d.getFullYear(), 11, 31);

    return {
      debut: toInputDate(debut),
      fin: toInputDate(fin),
      finDisabled: true,
    };
  }

  return {
    debut: baseDate,
    fin: baseDate,
    finDisabled: false,
  };
}

export default function Page() {
  const [onglet, setOnglet] = useState<Onglet>('rapports');

  const [ventes, setVentes] = useState<Vente[]>([]);
  const [stats, setStats] = useState<Stats>({});
  const [synthesePaiement, setSynthesePaiement] = useState<SynthesePaiement[]>(
    [],
  );

  const [typeRapport, setTypeRapport] =
    useState<TypeRapport>('Journalier');

  const [dateDebut, setDateDebut] = useState(today());
  const [dateFin, setDateFin] = useState(today());
  const [recherche, setRecherche] = useState('');

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const [venteAnnulation, setVenteAnnulation] = useState<Vente | null>(null);
  const [motif, setMotif] = useState('');
  const [manager, setManager] = useState('');
  const [message, setMessage] = useState('');

  const finDisabled = ['Journalier', 'Hebdomadaire', 'Mensuel', 'Annuel'].includes(
    typeRapport,
  );

  const venteSelectionnee = useMemo(
    () => ventes.find((v) => v.id_vente === selectedId) || null,
    [ventes, selectedId],
  );

  const ventesFiltrees = useMemo(() => {
    const q = recherche.toLowerCase().trim();
    if (!q) return ventes;

    return ventes.filter((v) =>
      [
        v.codefacture,
        v.nomclient,
        v.nomcaissier,
        v.modepaiement,
        v.statut,
      ]
        .join(' ')
        .toLowerCase()
        .includes(q),
    );
  }, [ventes, recherche]);

  function changerTypeRapport(value: TypeRapport) {
    const periode = calculerPeriode(value, dateDebut);
    setTypeRapport(value);
    setDateDebut(periode.debut);
    setDateFin(periode.fin);
  }

  function changerDateDebut(value: string) {
    const periode = calculerPeriode(typeRapport, value);
    setDateDebut(periode.debut);
    setDateFin(periode.fin);
  }

  async function charger() {
    setLoading(true);
    setMessage('');

    try {
      const params = new URLSearchParams();
      params.set('dateDebut', dateDebut);
      params.set('dateFin', dateFin);
      params.set('recherche', recherche);
      params.set('typeRapport', typeRapport);

      const res = await fetch(`${API}/ventes-manager?${params.toString()}`, {
        cache: 'no-store',
      });

      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();

      setVentes(data.ventes || []);
      setStats(data.stats || {});
      setSynthesePaiement(data.synthesePaiement || []);

      if (selectedId && !(data.ventes || []).some((v: Vente) => v.id_vente === selectedId)) {
        setSelectedId(null);
      }
    } catch (error) {
      console.error(error);
      setMessage('Erreur chargement VentesManager.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function confirmerAnnulation() {
    if (!venteAnnulation) return;

    if (motif.trim().length < 5) {
      setMessage('Le motif doit contenir au moins 5 caractères.');
      return;
    }

    try {
      const res = await fetch(
        `${API}/ventes-manager/${venteAnnulation.id_vente}/annuler`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            motif,
            manager: manager || 'MANAGER',
          }),
        },
      );

      if (!res.ok) throw new Error(await res.text());

      setMessage('Vente annulée avec succès.');
      setVenteAnnulation(null);
      setMotif('');
      setManager('');
      charger();
    } catch (error) {
      console.error(error);
      setMessage("Impossible d'annuler cette vente.");
    }
  }

  async function testerConnexion() {
    try {
      const res = await fetch(`${API}/ventes-manager/tester-connexion`, {
        cache: 'no-store',
      });

      if (!res.ok) throw new Error(await res.text());

      setMessage('Connexion backend/base de données OK.');
    } catch {
      setMessage('Erreur de connexion backend/base de données.');
    }
  }

  function exigerSelection(action: string) {
    if (!venteSelectionnee) {
      setMessage(`Sélectionnez d'abord une vente pour : ${action}.`);
      setOnglet('rapports');
      return null;
    }

    return venteSelectionnee;
  }

  function ouvrirDetails() {
    const v = exigerSelection('Détail vente');
    if (!v) return;

    window.location.href = `/dashboard/ventes/detail?id=${v.id_vente}`;
  }

  function ouvrirSessionCaisse() {
    window.location.href = '/dashboard/session-caisse';
  }

  function actionNonConnectee(label: string) {
    setMessage(`${label} : bouton restauré. Connexion backend à compléter.`);
  }

  return (
    <main className="min-h-screen bg-slate-100 p-3 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-4">
        <section className="rounded-3xl bg-slate-950 p-5 text-white shadow-sm">
          <h1 className="text-2xl font-bold sm:text-3xl">Ventes Manager</h1>
          <p className="mt-1 text-sm text-slate-300">
            Rapports, opérations sensibles, annulations, retours, paiements et
            session caisse.
          </p>
        </section>

        {message && (
          <div className="rounded-2xl bg-white p-4 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200">
            {message}
          </div>
        )}

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Card title="Ventes" value={stats.total_ventes || 0} />
          <Card title="Validées" value={stats.ventes_validees || 0} />
          <Card title="Annulées" value={stats.ventes_annulees || 0} />
          <Card title="Total USD" value={money(stats.total_usd, 'USD')} />
          <Card title="Total CDF" value={money(stats.total_cdf, 'CDF')} />
        </section>

        <section className="rounded-3xl bg-white p-2 shadow-sm ring-1 ring-slate-200">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setOnglet('rapports')}
              className={
                onglet === 'rapports'
                  ? 'rounded-2xl bg-slate-950 px-4 py-3 font-bold text-white'
                  : 'rounded-2xl bg-slate-100 px-4 py-3 font-bold text-slate-600'
              }
            >
              Rapports
            </button>

            <button
              onClick={() => setOnglet('operations')}
              className={
                onglet === 'operations'
                  ? 'rounded-2xl bg-slate-950 px-4 py-3 font-bold text-white'
                  : 'rounded-2xl bg-slate-100 px-4 py-3 font-bold text-slate-600'
              }
            >
              Opérations sensibles
            </button>
          </div>
        </section>

        {onglet === 'rapports' && (
          <>
            <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <div className="grid gap-3 md:grid-cols-6">
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-500">
                    Recherche
                  </label>
                  <input
                    value={recherche}
                    onChange={(e) => setRecherche(e.target.value)}
                    placeholder="Facture, client, caissier..."
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500">
                    Date début
                  </label>
                  <input
                    type="date"
                    value={dateDebut}
                    onChange={(e) => changerDateDebut(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500">
                    Date fin
                  </label>
                  <input
                    type="date"
                    value={dateFin}
                    disabled={finDisabled}
                    onChange={(e) => setDateFin(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500">
                    Type rapport
                  </label>
                  <select
                    value={typeRapport}
                    onChange={(e) =>
                      changerTypeRapport(e.target.value as TypeRapport)
                    }
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                  >
                    <option>Journalier</option>
                    <option>Hebdomadaire</option>
                    <option>Mensuel</option>
                    <option>Annuel</option>
                    <option>Periode</option>
                    <option>ParCaissier</option>
                  </select>
                </div>

                <button
                  onClick={charger}
                  disabled={loading}
                  className="mt-5 rounded-xl bg-slate-950 px-4 py-2 font-bold text-white disabled:opacity-50"
                >
                  {loading ? 'Chargement...' : 'Charger'}
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <ActionButton
                  label="Générer rapport"
                  onClick={() => actionNonConnectee('Générer rapport PDF')}
                />
                <ActionButton
                  label="Synthèse paiement"
                  onClick={() =>
                    setMessage(
                      `Synthèse paiement : ${synthesePaiement.length} ligne(s).`,
                    )
                  }
                />
                <ActionButton
                  label="Exporter PDF"
                  onClick={() => actionNonConnectee('Exporter PDF')}
                />
                <ActionButton
                  label="Exporter Excel"
                  onClick={() => actionNonConnectee('Exporter Excel')}
                />
              </div>
            </section>

            {synthesePaiement.length > 0 && (
              <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                <h2 className="font-bold text-slate-900">
                  Synthèse par mode de paiement
                </h2>

                <div className="mt-3 grid gap-2 md:grid-cols-3">
                  {synthesePaiement.map((s, index) => (
                    <div
                      key={`${s.modepaiement}-${s.devise}-${index}`}
                      className="rounded-2xl bg-slate-50 p-3"
                    >
                      <p className="text-xs font-bold text-slate-500">
                        {s.modepaiement || 'NON DEFINI'}
                      </p>
                      <p className="text-lg font-black text-slate-900">
                        {money(s.total, s.devise || '')}
                      </p>
                      <p className="text-xs text-slate-500">
                        {s.nombre || 0} opération(s)
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <TableVentes
              ventes={ventesFiltrees}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onAnnuler={setVenteAnnulation}
            />

            <CardsMobile
              ventes={ventesFiltrees}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onAnnuler={setVenteAnnulation}
            />
          </>
        )}

        {onglet === 'operations' && (
          <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <div className="mb-4 rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-500">
                Vente sélectionnée
              </p>
              <p className="mt-1 text-lg font-black text-slate-900">
                {venteSelectionnee
                  ? venteSelectionnee.codefacture ||
                    `Vente #${venteSelectionnee.id_vente}`
                  : 'Aucune vente sélectionnée'}
              </p>
              {venteSelectionnee && (
                <p className="text-sm text-slate-500">
                  {money(venteSelectionnee.montanttotal, venteSelectionnee.devise || '')}
                  {' • '}
                  {venteSelectionnee.nomclient || 'Client cash'}
                </p>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <OperationButton
                label="Voir Paiements"
                onClick={() => {
                  const v = exigerSelection('Voir paiements');
                  if (v) actionNonConnectee(`Paiements vente #${v.id_vente}`);
                }}
              />

              <OperationButton
                danger
                label="Annuler Vente"
                onClick={() => {
                  const v = exigerSelection('Annuler vente');
                  if (v) setVenteAnnulation(v);
                }}
              />

              <OperationButton
                label="Retour Produits"
                onClick={() => {
                  const v = exigerSelection('Retour produits');
                  if (v) actionNonConnectee(`Retour produits vente #${v.id_vente}`);
                }}
              />

              <OperationButton
                label="Total du jour"
                onClick={() => actionNonConnectee('Total du jour')}
              />

              <OperationButton
                label="Inventaire du jour"
                onClick={() => actionNonConnectee('Inventaire du jour')}
              />

              <OperationButton
                label="Inventaire période"
                onClick={() => actionNonConnectee('Inventaire période')}
              />

              <OperationButton
                label="Tester la connexion"
                onClick={testerConnexion}
              />

              <OperationButton
                success
                label="Session Caisse"
                onClick={ouvrirSessionCaisse}
              />

              <OperationButton
                dark
                label="Détail Vente"
                onClick={ouvrirDetails}
              />
            </div>
          </section>
        )}
      </div>

      {venteAnnulation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-xl">
            <h2 className="text-xl font-bold text-slate-900">
              Annuler la vente
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Facture : {venteAnnulation.codefacture || venteAnnulation.id_vente}
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500">
                  Motif *
                </label>
                <textarea
                  value={motif}
                  onChange={(e) => setMotif(e.target.value)}
                  className="mt-1 h-24 w-full rounded-xl border border-slate-300 px-3 py-2"
                  placeholder="Exemple : erreur de saisie..."
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500">
                  Manager
                </label>
                <input
                  value={manager}
                  onChange={(e) => setManager(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                  placeholder="Nom du manager"
                />
              </div>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setVenteAnnulation(null)}
                className="flex-1 rounded-xl bg-slate-200 px-4 py-2 font-bold text-slate-700"
              >
                Fermer
              </button>

              <button
                onClick={confirmerAnnulation}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2 font-bold text-white"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function TableVentes({
  ventes,
  selectedId,
  onSelect,
  onAnnuler,
}: {
  ventes: Vente[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onAnnuler: (vente: Vente) => void;
}) {
  if (ventes.length === 0) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center text-slate-500 shadow-sm ring-1 ring-slate-200">
        Aucune vente trouvée.
      </div>
    );
  }

  return (
    <section className="hidden overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 lg:block">
      <table className="w-full text-sm">
        <thead className="bg-slate-100 text-left text-xs uppercase text-slate-500">
          <tr>
            <th className="p-3">Facture</th>
            <th className="p-3">Date</th>
            <th className="p-3">Client</th>
            <th className="p-3">Caissier</th>
            <th className="p-3 text-right">Montant</th>
            <th className="p-3">Paiement</th>
            <th className="p-3">Statut</th>
            <th className="p-3 text-right">Actions</th>
          </tr>
        </thead>

        <tbody>
          {ventes.map((v) => (
            <tr
              key={v.id_vente}
              onClick={() => onSelect(v.id_vente)}
              className={
                selectedId === v.id_vente
                  ? 'cursor-pointer border-t border-slate-100 bg-emerald-50'
                  : 'cursor-pointer border-t border-slate-100 hover:bg-slate-50'
              }
            >
              <td className="p-3 font-bold">{v.codefacture || '-'}</td>
              <td className="p-3">{formatDate(v.datevente)}</td>
              <td className="p-3">{v.nomclient || 'Client cash'}</td>
              <td className="p-3">{v.nomcaissier || '-'}</td>
              <td className="p-3 text-right font-bold">
                {money(v.montanttotal, v.devise || '')}
              </td>
              <td className="p-3">{v.modepaiement || '-'}</td>
              <td className="p-3">
                <Badge statut={v.statut} />
              </td>
              <td className="p-3 text-right">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAnnuler(v);
                  }}
                  disabled={String(v.statut || '').toUpperCase().includes('ANNU')}
                  className="rounded-lg bg-red-600 px-3 py-1 text-xs font-bold text-white disabled:bg-slate-300"
                >
                  Annuler
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function CardsMobile({
  ventes,
  selectedId,
  onSelect,
  onAnnuler,
}: {
  ventes: Vente[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onAnnuler: (vente: Vente) => void;
}) {
  return (
    <section className="space-y-3 lg:hidden">
      {ventes.map((v) => (
        <div
          key={v.id_vente}
          onClick={() => onSelect(v.id_vente)}
          className={
            selectedId === v.id_vente
              ? 'rounded-3xl bg-emerald-50 p-4 shadow-sm ring-2 ring-emerald-500'
              : 'rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200'
          }
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-bold text-slate-900">
                {v.codefacture || `Vente #${v.id_vente}`}
              </p>
              <p className="text-xs text-slate-500">{formatDate(v.datevente)}</p>
            </div>
            <Badge statut={v.statut} />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <Info label="Client" value={v.nomclient || 'Client cash'} />
            <Info label="Caissier" value={v.nomcaissier || '-'} />
            <Info label="Paiement" value={v.modepaiement || '-'} />
            <Info label="Montant" value={money(v.montanttotal, v.devise || '')} />
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onAnnuler(v);
            }}
            disabled={String(v.statut || '').toUpperCase().includes('ANNU')}
            className="mt-4 w-full rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white disabled:bg-slate-300"
          >
            Annuler vente
          </button>
        </div>
      ))}
    </section>
  );
}

function Card({ title, value }: { title: string; value: any }) {
  return (
    <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <p className="text-xs font-bold uppercase text-slate-500">{title}</p>
      <p className="mt-2 text-xl font-black text-slate-900">{value}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-bold text-slate-900">{value}</p>
    </div>
  );
}

function Badge({ statut }: { statut?: string | null }) {
  const s = String(statut || 'VALIDEE').toUpperCase();
  const annulee = s.includes('ANNU');

  return (
    <span
      className={
        annulee
          ? 'rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700'
          : 'rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700'
      }
    >
      {annulee ? 'ANNULÉE' : 'VALIDÉE'}
    </span>
  );
}

function ActionButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200"
    >
      {label}
    </button>
  );
}

function OperationButton({
  label,
  onClick,
  danger,
  success,
  dark,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  success?: boolean;
  dark?: boolean;
}) {
  let cls =
    'rounded-2xl bg-slate-100 px-4 py-5 text-center font-bold text-slate-700 hover:bg-slate-200';

  if (danger) cls = 'rounded-2xl bg-red-600 px-4 py-5 text-center font-bold text-white';
  if (success) cls = 'rounded-2xl bg-emerald-600 px-4 py-5 text-center font-bold text-white';
  if (dark) cls = 'rounded-2xl bg-slate-800 px-4 py-5 text-center font-bold text-white';

  return (
    <button onClick={onClick} className={cls}>
      {label}
    </button>
  );
}