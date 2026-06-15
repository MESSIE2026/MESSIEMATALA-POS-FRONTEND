'use client';

import { useEffect, useMemo, useState } from 'react';

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://messiematala-pos-backend-production.up.railway.app';

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

function today() {
  return new Date().toISOString().slice(0, 10);
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

export default function Page() {
  const [ventes, setVentes] = useState<Vente[]>([]);
  const [stats, setStats] = useState<Stats>({});
  const [dateDebut, setDateDebut] = useState(today());
  const [dateFin, setDateFin] = useState(today());
  const [recherche, setRecherche] = useState('');
  const [loading, setLoading] = useState(false);

  const [venteAnnulation, setVenteAnnulation] = useState<Vente | null>(null);
  const [motif, setMotif] = useState('');
  const [manager, setManager] = useState('');
  const [message, setMessage] = useState('');

  async function charger() {
    setLoading(true);
    setMessage('');

    try {
      const params = new URLSearchParams();
      params.set('dateDebut', dateDebut);
      params.set('dateFin', dateFin);
      params.set('recherche', recherche);

      const res = await fetch(`${API}/ventes-manager?${params.toString()}`, {
        cache: 'no-store',
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const data = await res.json();
      setVentes(data.ventes || []);
      setStats(data.stats || {});
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

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt);
      }

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

  return (
    <main className="min-h-screen bg-slate-100 p-3 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-4">
        <section className="rounded-3xl bg-slate-950 p-5 text-white shadow-sm">
          <h1 className="text-2xl font-bold sm:text-3xl">
            Ventes Manager
          </h1>
          <p className="mt-1 text-sm text-slate-300">
            Supervision des ventes, annulations, retours et remboursements.
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

        <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="grid gap-3 md:grid-cols-5">
            <div>
              <label className="text-xs font-bold text-slate-500">
                Date début
              </label>
              <input
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
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
                onChange={(e) => setDateFin(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
              />
            </div>

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

            <button
              onClick={charger}
              disabled={loading}
              className="mt-5 rounded-xl bg-slate-950 px-4 py-2 font-bold text-white disabled:opacity-50"
            >
              {loading ? 'Chargement...' : 'Actualiser'}
            </button>
          </div>
        </section>

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
              {ventesFiltrees.map((v) => (
                <tr key={v.id_vente} className="border-t border-slate-100">
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
                      onClick={() => setVenteAnnulation(v)}
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

        <section className="space-y-3 lg:hidden">
          {ventesFiltrees.map((v) => (
            <div
              key={v.id_vente}
              className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-900">
                    {v.codefacture || `Vente #${v.id_vente}`}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatDate(v.datevente)}
                  </p>
                </div>
                <Badge statut={v.statut} />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <Info label="Client" value={v.nomclient || 'Client cash'} />
                <Info label="Caissier" value={v.nomcaissier || '-'} />
                <Info label="Paiement" value={v.modepaiement || '-'} />
                <Info
                  label="Montant"
                  value={money(v.montanttotal, v.devise || '')}
                />
              </div>

              <button
                onClick={() => setVenteAnnulation(v)}
                disabled={String(v.statut || '').toUpperCase().includes('ANNU')}
                className="mt-4 w-full rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white disabled:bg-slate-300"
              >
                Annuler vente
              </button>
            </div>
          ))}
        </section>

        {ventesFiltrees.length === 0 && (
          <div className="rounded-3xl bg-white p-8 text-center text-slate-500 shadow-sm ring-1 ring-slate-200">
            Aucune vente trouvée.
          </div>
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