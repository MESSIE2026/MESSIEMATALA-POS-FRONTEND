'use client';

import { useEffect, useMemo, useState } from 'react';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://messiematala-pos-backend-production.up.railway.app';

type OptionItem = {
  id: number;
  nom: string;
};

type OperationStock = {
  idOperation: number;
  idProduit: number;
  produit: string;
  typeOperation: string;
  quantite: number;
  depotSource?: string;
  depotDestination?: string;
  dateOperation: string;
  utilisateur?: string;
  motif?: string;
  reference?: string;
  emplacement?: string;
  remarques?: string;
};

type Stats = {
  entrees: number;
  sorties: number;
  ajustements: number;
  transferts: number;
  pertes: number;
  total: number;
};

export default function Page() {
  const [items, setItems] = useState<OperationStock[]>([]);
  const [produits, setProduits] = useState<OptionItem[]>([]);
  const [depots, setDepots] = useState<OptionItem[]>([]);
  const [stats, setStats] = useState<Stats>({
    entrees: 0,
    sorties: 0,
    ajustements: 0,
    transferts: 0,
    pertes: 0,
    total: 0,
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState('');
  const [typeFiltre, setTypeFiltre] = useState('');

  const [form, setForm] = useState({
    idProduit: '',
    typeOperation: 'ENTREE',
    quantite: '1',
    idDepotSource: '',
    idDepotDestination: '',
    utilisateur: '',
    motif: '',
    reference: '',
    emplacement: '',
    remarques: '',
    idEntreprise: '1',
    idMagasin: '',
  });

  const motifObligatoire = useMemo(() => {
    return form.typeOperation === 'AJUSTEMENT' || form.typeOperation === 'PERTE';
  }, [form.typeOperation]);

  const depotSourceVisible = useMemo(() => {
    return form.typeOperation !== 'ENTREE';
  }, [form.typeOperation]);

  const depotDestinationVisible = useMemo(() => {
    return form.typeOperation === 'ENTREE' || form.typeOperation === 'TRANSFERT';
  }, [form.typeOperation]);

  useEffect(() => {
    chargerOptions();
    charger();
  }, []);

  async function chargerOptions() {
    try {
      const res = await fetch(`${API_URL}/operations-stock/options?idEntreprise=1`);
      const data = await res.json();

      setProduits(Array.isArray(data.produits) ? data.produits : []);
      setDepots(Array.isArray(data.depots) ? data.depots : []);
    } catch (e) {
      console.error(e);
    }
  }

  async function charger() {
    setLoading(true);

    try {
      const params = new URLSearchParams();
      params.set('idEntreprise', '1');

      if (search.trim()) params.set('search', search.trim());
      if (typeFiltre.trim()) params.set('typeOperation', typeFiltre.trim());

      const [resItems, resStats] = await Promise.all([
        fetch(`${API_URL}/operations-stock?${params.toString()}`),
        fetch(`${API_URL}/operations-stock/stats?idEntreprise=1`),
      ]);

      const jsonItems = await resItems.json();
      const jsonStats = await resStats.json();

      setItems(Array.isArray(jsonItems) ? jsonItems : []);
      setStats(jsonStats || {});
    } catch (e) {
      console.error(e);
      alert('Erreur chargement opérations stock.');
    } finally {
      setLoading(false);
    }
  }

  function updateForm(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault();

    if (!form.idProduit) {
      alert('Veuillez choisir un produit.');
      return;
    }

    if (!form.quantite || Number(form.quantite) <= 0) {
      alert('Quantité invalide.');
      return;
    }

    if (form.typeOperation === 'SORTIE' && !form.idDepotSource) {
      alert('Dépôt source obligatoire pour une sortie.');
      return;
    }

    if (form.typeOperation === 'ENTREE' && !form.idDepotDestination) {
      alert('Dépôt destination obligatoire pour une entrée.');
      return;
    }

    if (
      form.typeOperation === 'TRANSFERT' &&
      (!form.idDepotSource || !form.idDepotDestination)
    ) {
      alert('Dépôt source et destination obligatoires pour un transfert.');
      return;
    }

    if (motifObligatoire && !form.motif.trim()) {
      alert('Motif obligatoire pour ajustement ou perte.');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        idProduit: Number(form.idProduit),
        typeOperation: form.typeOperation,
        quantite: Number(form.quantite),
        idDepotSource: form.idDepotSource ? Number(form.idDepotSource) : null,
        idDepotDestination: form.idDepotDestination
          ? Number(form.idDepotDestination)
          : null,
        utilisateur: form.utilisateur || 'Utilisateur POS',
        motif: form.motif,
        reference: form.reference,
        emplacement: form.emplacement,
        remarques: form.remarques,
        idEntreprise: Number(form.idEntreprise || 1),
        idMagasin: form.idMagasin ? Number(form.idMagasin) : undefined,
      };

      const res = await fetch(`${API_URL}/operations-stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Erreur enregistrement.');
      }

      alert(data.message || 'Opération enregistrée.');

      setForm((prev) => ({
        ...prev,
        quantite: '1',
        motif: '',
        reference: '',
        emplacement: '',
        remarques: '',
      }));

      await charger();
    } catch (e: any) {
      alert(e.message || 'Erreur enregistrement opération stock.');
    } finally {
      setSaving(false);
    }
  }

  async function supprimer(id: number) {
    const ok = window.confirm(`Supprimer l'opération stock N° ${id} ?`);
    if (!ok) return;

    try {
      const res = await fetch(`${API_URL}/operations-stock/${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Erreur suppression.');
      }

      alert(data.message || 'Supprimé.');
      await charger();
    } catch (e: any) {
      alert(e.message || 'Erreur suppression.');
    }
  }

  function ouvrirPdf() {
  window.open(`${API_URL}/operations-stock/pdf?idEntreprise=1`, '_blank');
}

  function dateFr(value?: string) {
    if (!value) return '-';

    try {
      return new Date(value).toLocaleString('fr-FR');
    } catch {
      return value;
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Opérations Stock
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Entrées, sorties, ajustements, transferts et pertes.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={charger}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
              >
                Actualiser
              </button>

              <button
                onClick={ouvrirPdf}
                className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
              >
                PDF
              </button>
            </div>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-5">
          <StatCard title="Entrées" value={stats.entrees || 0} />
          <StatCard title="Sorties" value={stats.sorties || 0} />
          <StatCard title="Ajustements" value={stats.ajustements || 0} />
          <StatCard title="Transferts" value={stats.transferts || 0} />
          <StatCard title="Pertes" value={stats.pertes || 0} />
        </section>

        <section className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <form
            onSubmit={enregistrer}
            className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
          >
            <h2 className="text-xl font-bold text-slate-900">
              Nouveau mouvement
            </h2>

            <div className="mt-5 space-y-4">
              <Field label="Produit">
                <select
                  value={form.idProduit}
                  onChange={(e) => updateForm('idProduit', e.target.value)}
                  className="input"
                >
                  <option value="">Sélectionner un produit</option>
                  {produits.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nom}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Type opération">
                <select
                  value={form.typeOperation}
                  onChange={(e) => updateForm('typeOperation', e.target.value)}
                  className="input"
                >
                  <option value="ENTREE">Entrée</option>
                  <option value="SORTIE">Sortie</option>
                  <option value="AJUSTEMENT">Ajustement</option>
                  <option value="TRANSFERT">Transfert</option>
                  <option value="PERTE">Perte</option>
                </select>
              </Field>

              <Field label="Quantité">
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={form.quantite}
                  onChange={(e) => updateForm('quantite', e.target.value)}
                  className="input"
                />
              </Field>

              {depotSourceVisible && (
                <Field label="Dépôt source">
                  <select
                    value={form.idDepotSource}
                    onChange={(e) => updateForm('idDepotSource', e.target.value)}
                    className="input"
                  >
                    <option value="">Sélectionner</option>
                    {depots.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.nom}
                      </option>
                    ))}
                  </select>
                </Field>
              )}

              {depotDestinationVisible && (
                <Field label="Dépôt destination">
                  <select
                    value={form.idDepotDestination}
                    onChange={(e) =>
                      updateForm('idDepotDestination', e.target.value)
                    }
                    className="input"
                  >
                    <option value="">Sélectionner</option>
                    {depots.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.nom}
                      </option>
                    ))}
                  </select>
                </Field>
              )}

              <Field label={motifObligatoire ? 'Motif obligatoire' : 'Motif'}>
                <input
                  value={form.motif}
                  onChange={(e) => updateForm('motif', e.target.value)}
                  className="input"
                  placeholder="Ex: correction stock, perte, inventaire..."
                />
              </Field>

              <Field label="Référence">
                <input
                  value={form.reference}
                  onChange={(e) => updateForm('reference', e.target.value)}
                  className="input"
                  placeholder="Ex: REF-001"
                />
              </Field>

              <Field label="Emplacement">
                <input
                  value={form.emplacement}
                  onChange={(e) => updateForm('emplacement', e.target.value)}
                  className="input"
                  placeholder="Rayon, étagère, boutique..."
                />
              </Field>

              <Field label="Remarques">
                <textarea
                  value={form.remarques}
                  onChange={(e) => updateForm('remarques', e.target.value)}
                  className="input min-h-24"
                />
              </Field>

              <button
                disabled={saving}
                className="w-full rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-60"
              >
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </form>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                Historique des opérations
              </h2>

              <div className="flex flex-col gap-2 md:flex-row">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Recherche..."
                  className="input md:w-56"
                />

                <select
                  value={typeFiltre}
                  onChange={(e) => setTypeFiltre(e.target.value)}
                  className="input md:w-44"
                >
                  <option value="">Tous</option>
                  <option value="ENTREE">Entrées</option>
                  <option value="SORTIE">Sorties</option>
                  <option value="AJUSTEMENT">Ajustements</option>
                  <option value="TRANSFERT">Transferts</option>
                  <option value="PERTE">Pertes</option>
                </select>

                <button
                  onClick={charger}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                >
                  Filtrer
                </button>
              </div>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-xs uppercase text-slate-500">
                    <th className="px-3 py-3">ID</th>
                    <th className="px-3 py-3">Produit</th>
                    <th className="px-3 py-3">Type</th>
                    <th className="px-3 py-3">Qté</th>
                    <th className="px-3 py-3">Dépôt</th>
                    <th className="px-3 py-3">Référence</th>
                    <th className="px-3 py-3">Date</th>
                    <th className="px-3 py-3 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-3 py-8 text-center text-slate-500">
                        Chargement...
                      </td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-3 py-8 text-center text-slate-500">
                        Aucune opération trouvée.
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr key={item.idOperation} className="border-b hover:bg-slate-50">
                        <td className="px-3 py-3 font-semibold">
                          {item.idOperation}
                        </td>
                        <td className="px-3 py-3">{item.produit || '-'}</td>
                        <td className="px-3 py-3">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                            {item.typeOperation}
                          </span>
                        </td>
                        <td className="px-3 py-3">{item.quantite}</td>
                        <td className="px-3 py-3">
                          {item.depotDestination || item.depotSource || '-'}
                        </td>
                        <td className="px-3 py-3">{item.reference || '-'}</td>
                        <td className="px-3 py-3">{dateFr(item.dateOperation)}</td>
                        <td className="px-3 py-3 text-right">
                          <button
                            onClick={() => supprimer(item.idOperation)}
                            className="rounded-lg bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
                          >
                            Supprimer
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      <style jsx global>{`
        .input {
          width: 100%;
          border-radius: 0.9rem;
          border: 1px solid rgb(203 213 225);
          background: white;
          padding: 0.65rem 0.85rem;
          font-size: 0.875rem;
          outline: none;
        }

        .input:focus {
          border-color: rgb(22 101 52);
          box-shadow: 0 0 0 3px rgba(22, 101, 52, 0.12);
        }
      `}</style>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-slate-700">
        {label}
      </span>
      {children}
    </label>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}