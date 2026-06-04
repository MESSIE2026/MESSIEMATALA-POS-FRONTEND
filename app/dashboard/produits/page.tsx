'use client';

import { useEffect, useMemo, useState } from 'react';

type Produit = {
  id_produit: number;
  nomproduit: string;
  refproduit?: string;
  codebarre?: string;
  prix: number;
  quantite?: number;
  stockinitial?: number;
  entrees?: number;
  sorties?: number;
  stockactuel?: number;
  devise?: string;
  categorie?: string;
  taille?: string;
  couleur?: string;
  description?: string;
  imagepath?: string;
  isreglemente?: boolean;
  signaturemanagerrequired?: boolean;
  permissioncode?: string;
  agemin?: number;
  niveaurestriction?: number;
};

type FormProduit = {
  id_produit?: number;
  nomproduit: string;
  refproduit: string;
  categorie: string;
  taille: string;
  couleur: string;
  quantite: number;
  prix: number;
  devise: string;
  codebarre: string;
  description: string;
  imagepath: string;
  depotStockInitial: string;
  isreglemente: boolean;
  signaturemanagerrequired: boolean;
  permissioncode: string;
  agemin: number;
  niveaurestriction: number;
};

const API = 'https://messiematala-pos-backend-production.up.railway.app';

const emptyForm: FormProduit = {
  nomproduit: '',
  refproduit: '',
  categorie: '',
  taille: '',
  couleur: '',
  quantite: 1,
  prix: 0,
  devise: 'USD',
  codebarre: '',
  description: '',
  imagepath: '',
  depotStockInitial: '',
  isreglemente: false,
  signaturemanagerrequired: false,
  permissioncode: '',
  agemin: 0,
  niveaurestriction: 0,
};

export default function Page() {
  const [produits, setProduits] = useState<Produit[]>([]);
  const [equivalences, setEquivalences] = useState<any[]>([]);
  const [form, setForm] = useState<FormProduit>(emptyForm);
  const [search, setSearch] = useState('');
  const [scanCode, setScanCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [modeInfos, setModeInfos] = useState(true);

  const categories = ['Vêtements', 'Chaussures', 'Accessoires', 'Beauté', 'Pharmacie', 'Autres'];
  const tailles = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44'];
  const devises = ['USD', 'CDF', 'EUR'];
  const permissions = ['VENTE_PRODUIT_REGLEMENTE', 'VENTE_REGLEMENTE_N1', 'VENTE_REGLEMENTE_N2', 'VENTE_REGLEMENTE_N3'];
  const formatsEtiquettes = ['A4 - 3 x 8', 'A4 - 4 x 10', 'Petit format', 'Grand format'];

  useEffect(() => {
    chargerProduits();
  }, []);

  async function chargerProduits(q = '') {
    try {
      setLoading(true);
      const url = q ? `${API}/produits?q=${encodeURIComponent(q)}` : `${API}/produits`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setProduits(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      alert('Impossible de charger les produits');
    } finally {
      setLoading(false);
    }
  }

  function remplirDepuisProduit(p: Produit) {
    setForm({
      id_produit: p.id_produit,
      nomproduit: p.nomproduit || '',
      refproduit: p.refproduit || '',
      categorie: p.categorie || '',
      taille: p.taille || '',
      couleur: p.couleur || '',
      quantite: Number(p.quantite ?? p.stockinitial ?? 1),
      prix: Number(p.prix ?? 0),
      devise: p.devise || 'USD',
      codebarre: p.codebarre || '',
      description: p.description || '',
      imagepath: p.imagepath || '',
      depotStockInitial: '',
      isreglemente: Boolean(p.isreglemente),
      signaturemanagerrequired: Boolean(p.signaturemanagerrequired),
      permissioncode: p.permissioncode || '',
      agemin: Number(p.agemin ?? 0),
      niveaurestriction: Number(p.niveaurestriction ?? 0),
    });
    setModeInfos(true);
  }

  function effacer() {
    setForm(emptyForm);
    setEquivalences([]);
    setScanCode('');
  }

  async function enregistrer() {
    try {
      const res = await fetch(`${API}/produits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nomproduit: form.nomproduit,
          refproduit: form.refproduit,
          categorie: form.categorie,
          taille: form.taille,
          couleur: form.couleur,
          quantite: form.quantite,
          stockinitial: form.quantite,
          prix: form.prix,
          devise: form.devise,
          codebarre: form.codebarre,
          codebarretrim: form.codebarre?.trim(),
          description: form.description,
          imagepath: form.imagepath,
          isreglemente: form.isreglemente,
          signaturemanagerrequired: form.signaturemanagerrequired,
          permissioncode: form.permissioncode,
          agemin: form.agemin,
          niveaurestriction: form.niveaurestriction,
          isactif: true,
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      await chargerProduits();
      alert('Produit enregistré');
      effacer();
    } catch (e) {
      console.error(e);
      alert('Erreur enregistrement produit');
    }
  }

  async function modifier() {
    if (!form.id_produit) return alert('Sélectionne d’abord un produit');

    try {
      const res = await fetch(`${API}/produits/${form.id_produit}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error(await res.text());
      await chargerProduits();
      alert('Produit modifié');
    } catch (e) {
      console.error(e);
      alert('Erreur modification produit');
    }
  }

  async function scanner(code: string) {
    if (!code.trim()) return;

    try {
      const res = await fetch(`${API}/produits/scan/${encodeURIComponent(code.trim())}`, {
        cache: 'no-store',
      });

      if (!res.ok) throw new Error(await res.text());

      const p = await res.json();
      remplirDepuisProduit(p);
    } catch {
      alert(`Produit introuvable : ${code}`);
    }
  }

  function genererCodeBarre() {
    const ref = form.refproduit || `PRD-${Date.now()}`;
    setForm((f) => ({ ...f, codebarre: ref }));
  }

  function supprimerSoft() {
    alert('Pour supprimer, il faut ajouter DELETE ou PATCH isactif=false côté backend.');
  }

  function imprimerEtiquettes() {
    alert('Impression étiquettes : à connecter avec génération PDF/print navigateur.');
  }

  function signatureManager() {
    setForm((f) => ({
      ...f,
      signaturemanagerrequired: true,
      permissioncode: f.permissioncode || 'VENTE_PRODUIT_REGLEMENTE',
    }));
  }

  function formatPrix(v: any, devise?: string) {
    return `${Number(v || 0).toLocaleString('fr-FR')} ${devise || ''}`;
  }

  const stockActuelPreview = useMemo(() => {
    return Number(form.quantite || 0);
  }, [form.quantite]);

  return (
    <main className="min-h-screen bg-slate-100 p-4">
      <div className="mb-4 rounded-xl bg-blue-600 p-2 text-center">
        <button
          onClick={() => setModeInfos(!modeInfos)}
          className="rounded-lg px-8 py-2 font-bold text-white hover:bg-blue-700"
        >
          {modeInfos ? 'Informations Produits ▼' : 'Informations Produits ▲'}
        </button>
      </div>

      {modeInfos ? (
        <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="mb-4 text-lg font-bold text-slate-800">Informations produit</h2>

            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Nom">
                <input value={form.nomproduit} onChange={(e) => setForm({ ...form, nomproduit: e.target.value })} className="input" />
              </Field>

              <Field label="Référence">
                <input value={form.refproduit} onChange={(e) => setForm({ ...form, refproduit: e.target.value })} className="input" />
              </Field>

              <Field label="Catégorie">
                <select value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })} className="input">
                  <option value="">Choisir</option>
                  {categories.map((x) => <option key={x}>{x}</option>)}
                </select>
              </Field>

              <Field label="Taille">
                <select value={form.taille} onChange={(e) => setForm({ ...form, taille: e.target.value })} className="input">
                  <option value="">Choisir</option>
                  {tailles.map((x) => <option key={x}>{x}</option>)}
                </select>
              </Field>

              <Field label="Couleur">
                <input value={form.couleur} onChange={(e) => setForm({ ...form, couleur: e.target.value })} className="input" />
              </Field>

              <Field label="Quantité">
                <input type="number" value={form.quantite} onChange={(e) => setForm({ ...form, quantite: Number(e.target.value) })} className="input" />
              </Field>

              <Field label="Prix">
                <input type="number" value={form.prix} onChange={(e) => setForm({ ...form, prix: Number(e.target.value) })} className="input" />
              </Field>

              <Field label="Devise">
                <div className="flex gap-2">
                  <select value={form.devise} onChange={(e) => setForm({ ...form, devise: e.target.value })} className="input">
                    {devises.map((x) => <option key={x}>{x}</option>)}
                  </select>
                  <input value={form.id_produit || ''} readOnly placeholder="ID" className="input w-24 text-center font-bold" />
                </div>
              </Field>

              <Field label="Code barre">
                <input value={form.codebarre} onChange={(e) => setForm({ ...form, codebarre: e.target.value })} className="input" />
              </Field>

              <Field label="Date ajout">
                <input value={new Date().toLocaleDateString('fr-FR')} readOnly className="input" />
              </Field>
            </div>

            <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm font-semibold">
              Stock actuel aperçu : {stockActuelPreview}
            </div>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="mb-3 text-lg font-bold text-slate-800">Image produit</h2>

            <div className="mb-3 flex h-44 items-center justify-center rounded-xl border bg-slate-50">
              {form.imagepath ? (
                <img src={form.imagepath} alt="Produit" className="max-h-full max-w-full object-contain" />
              ) : (
                <span className="text-slate-400">Aucune image</span>
              )}
            </div>

            <input
              value={form.imagepath}
              onChange={(e) => setForm({ ...form, imagepath: e.target.value })}
              placeholder="Chemin image ou URL"
              className="input mb-3"
            />

            <button className="btn w-full">Changer l’image</button>

            <div className="mt-5">
              <label className="mb-1 block font-bold text-blue-700">Scan code</label>
              <input
                value={scanCode}
                onChange={(e) => setScanCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') scanner(scanCode);
                }}
                className="input"
                placeholder="Scanner code-barres..."
                autoComplete="off"
              />
            </div>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 xl:col-span-2">
            <h2 className="mb-4 text-lg font-bold text-slate-800">Description</h2>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input min-h-24"
            />
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 xl:col-span-2">
            <h2 className="mb-4 text-lg font-bold text-slate-800">Réglementation</h2>

            <div className="grid gap-3 md:grid-cols-5">
              <label className="flex items-center gap-2 font-semibold">
                <input
                  type="checkbox"
                  checked={form.isreglemente}
                  onChange={(e) => setForm({ ...form, isreglemente: e.target.checked })}
                />
                Produit réglementé
              </label>

              <label className="flex items-center gap-2 font-semibold">
                <input
                  type="checkbox"
                  checked={form.signaturemanagerrequired}
                  onChange={(e) => setForm({ ...form, signaturemanagerrequired: e.target.checked })}
                />
                Signature requise
              </label>

              <select
                value={form.permissioncode}
                onChange={(e) => setForm({ ...form, permissioncode: e.target.value })}
                className="input"
                disabled={!form.signaturemanagerrequired}
              >
                <option value="">Permission</option>
                {permissions.map((x) => <option key={x}>{x}</option>)}
              </select>

              <input
                type="number"
                value={form.agemin}
                onChange={(e) => setForm({ ...form, agemin: Number(e.target.value) })}
                className="input"
                placeholder="Âge min"
                disabled={!form.isreglemente}
              />

              <select
                value={form.niveaurestriction}
                onChange={(e) => setForm({ ...form, niveaurestriction: Number(e.target.value) })}
                className="input"
                disabled={!form.isreglemente}
              >
                <option value={0}>0 - Aucun</option>
                <option value={1}>1 - Faible</option>
                <option value={2}>2 - Moyen</option>
                <option value={3}>3 - Élevé</option>
              </select>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 xl:col-span-2">
            <h2 className="mb-4 text-lg font-bold text-slate-800">Actions rapides</h2>

            <div className="grid gap-3 md:grid-cols-4">
              <button onClick={enregistrer} className="btn">Enregistrer</button>
              <button onClick={modifier} className="btn">Modifier</button>
              <button onClick={effacer} className="btn bg-slate-700">Annuler</button>
              <button onClick={supprimerSoft} className="btn bg-red-600">Supprimer</button>

              <button className="btn">Détails</button>
              <button className="btn">Stock initial</button>
              <button onClick={genererCodeBarre} className="btn">Code barre</button>
              <button onClick={imprimerEtiquettes} className="btn">Imprimer étiquettes</button>

              <button onClick={signatureManager} className="btn">Signature</button>
              <button className="btn">Ajouter équiv.</button>
              <select className="input">
                <option>Produit équivalent</option>
              </select>
              <button className="btn bg-red-500">Retirer équiv.</button>

              <label className="font-bold text-blue-700">Format étiquettes :</label>
              <select className="input md:col-span-3">
                {formatsEtiquettes.map((x) => <option key={x}>{x}</option>)}
              </select>

              <button className="btn md:col-span-4">Modifier prix</button>
            </div>
          </section>
        </div>
      ) : (
        <div className="grid gap-4">
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="mb-4 text-lg font-bold">Liste des produits</h2>

            <div className="mb-4 flex gap-3">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') chargerProduits(search);
                }}
                className="input"
                placeholder="Rechercher nom, référence ou code-barres..."
              />
              <button onClick={() => chargerProduits(search)} className="btn w-40">Rechercher</button>
              <button onClick={() => chargerProduits('')} className="btn w-40 bg-slate-700">Actualiser</button>
            </div>

            <div className="overflow-auto rounded-xl border">
              <table className="w-full min-w-[1350px] text-left text-sm text-slate-900">
                <thead className="bg-slate-900 text-white">
                  <tr>
                    <th className="px-3 py-3">ID</th>
                    <th className="px-3 py-3">Nom produit</th>
                    <th className="px-3 py-3">Référence</th>
                    <th className="px-3 py-3">Code barre</th>
                    <th className="px-3 py-3">Prix</th>
                    <th className="px-3 py-3">Stock initial</th>
                    <th className="px-3 py-3">Entrées</th>
                    <th className="px-3 py-3">Sorties</th>
                    <th className="px-3 py-3">Stock actuel</th>
                    <th className="px-3 py-3">Devise</th>
                    <th className="px-3 py-3">Catégorie</th>
                    <th className="px-3 py-3">Taille</th>
                    <th className="px-3 py-3">Couleur</th>
                    <th className="px-3 py-3">Réglementé</th>
                    <th className="px-3 py-3">Signature</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr><td colSpan={15} className="p-6 text-center">Chargement...</td></tr>
                  ) : produits.length === 0 ? (
                    <tr><td colSpan={15} className="p-6 text-center">Aucun produit trouvé.</td></tr>
                  ) : (
                    produits.map((p) => (
                      <tr
  key={p.id_produit}
  onClick={() => remplirDepuisProduit(p)}
  className="cursor-pointer border-b border-slate-200 bg-white text-slate-900 hover:bg-blue-50"
>
                        <td className="px-3 py-2 font-bold text-slate-900">{p.id_produit}</td>
                        <td className="px-3 py-2 font-semibold text-slate-900">{p.nomproduit}</td>
                        <td className="px-3 py-2">{p.refproduit || '-'}</td>
                        <td className="px-3 py-2">{p.codebarre || '-'}</td>
                        <td className="px-3 py-2 font-semibold text-slate-900">{formatPrix(p.prix, p.devise)}</td>
                        <td className="px-3 py-2">{p.stockinitial ?? 0}</td>
                        <td className="px-3 py-2">{p.entrees ?? 0}</td>
                        <td className="px-3 py-2">{p.sorties ?? 0}</td>
                        <td className="px-3 py-2 font-bold text-slate-900">{p.stockactuel ?? 0}</td>
                        <td className="px-3 py-2">{p.devise || '-'}</td>
                        <td className="px-3 py-2">{p.categorie || '-'}</td>
                        <td className="px-3 py-2">{p.taille || '-'}</td>
                        <td className="px-3 py-2">{p.couleur || '-'}</td>
                        <td className="px-3 py-2">{p.isreglemente ? 'Oui' : 'Non'}</td>
                        <td className="px-3 py-2">{p.signaturemanagerrequired ? 'Oui' : 'Non'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="mb-4 text-lg font-bold">Équivalences du produit sélectionné</h2>
            <div className="overflow-auto rounded-xl border">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-sky-500 text-white">
                  <tr>
                    <th className="px-3 py-3">ID</th>
                    <th className="px-3 py-3">ID Produit</th>
                    <th className="px-3 py-3">Nom produit</th>
                    <th className="px-3 py-3">Référence</th>
                    <th className="px-3 py-3">Code barre</th>
                    <th className="px-3 py-3">Prix</th>
                    <th className="px-3 py-3">Devise</th>
                    <th className="px-3 py-3">Type</th>
                    <th className="px-3 py-3">Priorité</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={9} className="p-6 text-center text-slate-500">
                      Équivalences à connecter côté backend.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      <style jsx global>{`
  * {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
  }

  .input {
    width: 100%;
    border: 1px solid #cbd5e1;
    border-radius: 0.75rem;
    background: #ffffff;
    padding: 0.65rem 0.8rem;
    outline: none;
    color: #0f172a;
    font-weight: 700;
    font-size: 16px;
  }

  .input::placeholder {
    color: #64748b;
    opacity: 1;
  }

  .input:read-only {
    color: #0f172a;
    background: #f8fafc;
    opacity: 1;
  }

  select.input {
    color: #0f172a;
    font-weight: 700;
  }

  select.input option {
    color: #0f172a;
    background: #ffffff;
  }

  .input:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
  }

  .btn {
    border-radius: 0.75rem;
    background: #2563eb;
    padding: 0.7rem 1rem;
    color: white;
    font-weight: 700;
  }

  .btn:hover {
    background: #1d4ed8;
  }
`}</style>
    </main>
  );
}



function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1">
      <span className="font-bold text-blue-700">{label} :</span>
      {children}
    </label>
  );
}