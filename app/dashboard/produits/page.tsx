'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';
import {
  Barcode,
  Boxes,
  CheckCircle2,
  Edit,
  ImageIcon,
  Package,
  Plus,
  Printer,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  XCircle,
} from 'lucide-react';

type Produit = {
  id_produit: number;
  nomproduit: string;
  refproduit?: string;
  codebarre?: string;
  codebarretrim?: string;
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
  ordonnanceobligatoire?: boolean;
  signaturemanagerrequired?: boolean;
  permissioncode?: string;
  agemin?: number;
  niveaurestriction?: number;
  isactif?: boolean;
  identreprise?: number;
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
  isreglemente: boolean;
  signaturemanagerrequired: boolean;
  permissioncode: string;
  agemin: number;
  niveaurestriction: number;
};

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://messiematala-pos-backend-production.up.railway.app';

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
  isreglemente: false,
  signaturemanagerrequired: false,
  permissioncode: '',
  agemin: 0,
  niveaurestriction: 0,
};

export default function Page() {
  const [produits, setProduits] = useState<Produit[]>([]);
  const [form, setForm] = useState<FormProduit>(emptyForm);
  const [search, setSearch] = useState('');
  const [scanCode, setScanCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const categories = ['Vêtements', 'Chaussures', 'Accessoires', 'Beauté', 'Pharmacie', 'Autres'];
  const tailles = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44'];
  const devises = ['USD', 'CDF', 'EUR'];
  const permissions = ['VENTE_PRODUIT_REGLEMENTE', 'VENTE_REGLEMENTE_N1', 'VENTE_REGLEMENTE_N2', 'VENTE_REGLEMENTE_N3'];

  useEffect(() => {
    chargerProduits();
  }, []);

  const stats = useMemo(() => {
    const total = produits.length;
    const stock = produits.reduce((s, p) => s + Number(p.stockactuel ?? p.quantite ?? 0), 0);
    const reglementes = produits.filter((p) => p.isreglemente || p.signaturemanagerrequired).length;
    const rupture = produits.filter((p) => Number(p.stockactuel ?? p.quantite ?? 0) <= 0).length;

    return { total, stock, reglementes, rupture };
  }, [produits]);

  async function chargerProduits(q = '') {
    try {
      setLoading(true);
      const url = q.trim()
        ? `${API}/produits?q=${encodeURIComponent(q.trim())}`
        : `${API}/produits`;

      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      setProduits(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      alert('Impossible de charger les produits.');
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
      quantite: Number(p.quantite ?? p.stockactuel ?? p.stockinitial ?? 1),
      prix: Number(p.prix ?? 0),
      devise: p.devise || 'USD',
      codebarre: p.codebarre || p.codebarretrim || '',
      description: p.description || '',
      imagepath: p.imagepath || '',
      isreglemente: Boolean(p.isreglemente),
      signaturemanagerrequired: Boolean(p.signaturemanagerrequired),
      permissioncode: p.permissioncode || '',
      agemin: Number(p.agemin ?? 0),
      niveaurestriction: Number(p.niveaurestriction ?? 0),
    });
  }

  function nouveau() {
    setForm(emptyForm);
    setScanCode('');
  }

  async function enregistrer() {
    if (!form.nomproduit.trim()) return alert('Nom produit obligatoire.');
    if (Number(form.prix) < 0) return alert('Prix invalide.');

    try {
      setSaving(true);

      const payload = {
        nomproduit: form.nomproduit,
        refproduit: form.refproduit,
        categorie: form.categorie,
        taille: form.taille,
        couleur: form.couleur,
        quantite: Number(form.quantite || 0),
        stockinitial: Number(form.quantite || 0),
        stockactuel: Number(form.quantite || 0),
        prix: Number(form.prix || 0),
        devise: form.devise,
        codebarre: form.codebarre,
        codebarretrim: form.codebarre?.trim(),
        description: form.description,
        imagepath: form.imagepath,
        isreglemente: form.isreglemente,
        signaturemanagerrequired: form.signaturemanagerrequired,
        permissioncode: form.permissioncode,
        agemin: Number(form.agemin || 0),
        niveaurestriction: Number(form.niveaurestriction || 0),
        isactif: true,
      };

      const res = await fetch(`${API}/produits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(await res.text());

      await chargerProduits(search);
      alert('Produit enregistré.');
      nouveau();
    } catch (e) {
      console.error(e);
      alert('Erreur enregistrement produit.');
    } finally {
      setSaving(false);
    }
  }

  async function modifier() {
    if (!form.id_produit) return alert('Sélectionne d’abord un produit.');

    try {
      setSaving(true);

      const res = await fetch(`${API}/produits/${form.id_produit}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nomproduit: form.nomproduit,
          refproduit: form.refproduit,
          categorie: form.categorie,
          taille: form.taille,
          couleur: form.couleur,
          quantite: Number(form.quantite || 0),
          stockactuel: Number(form.quantite || 0),
          prix: Number(form.prix || 0),
          devise: form.devise,
          codebarre: form.codebarre,
          codebarretrim: form.codebarre?.trim(),
          description: form.description,
          imagepath: form.imagepath,
          isreglemente: form.isreglemente,
          signaturemanagerrequired: form.signaturemanagerrequired,
          permissioncode: form.permissioncode,
          agemin: Number(form.agemin || 0),
          niveaurestriction: Number(form.niveaurestriction || 0),
        }),
      });

      if (!res.ok) throw new Error(await res.text());

      await chargerProduits(search);
      alert('Produit modifié.');
    } catch (e) {
      console.error(e);
      alert('Erreur modification produit.');
    } finally {
      setSaving(false);
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
    setForm((f) => ({ ...f, codebarre: ref, refproduit: f.refproduit || ref }));
  }

  function signatureManager() {
    setForm((f) => ({
      ...f,
      signaturemanagerrequired: true,
      isreglemente: true,
      permissioncode: f.permissioncode || 'VENTE_PRODUIT_REGLEMENTE',
    }));
  }

  function supprimerSoft() {
    alert('Suppression à connecter côté backend : PATCH isactif=false ou DELETE.');
  }

  function imprimerEtiquettes() {
    alert('Impression étiquettes à connecter avec PDF/print navigateur.');
  }

  function formatPrix(v: any, devise?: string) {
    return `${Number(v || 0).toLocaleString('fr-FR')} ${devise || ''}`;
  }

  function stockOf(p: Produit) {
    return Number(p.stockactuel ?? p.quantite ?? 0);
  }

  return (
    <main className="min-h-screen bg-slate-100 p-3 text-slate-900 md:p-6">
      <section className="mb-5 rounded-3xl bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 p-5 text-white shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-200">
              Stock / Produits
            </p>
            <h1 className="mt-2 text-2xl font-black md:text-3xl">Catalogue Produits</h1>
            <p className="mt-1 text-sm text-slate-300">
              Fiches produits avec image, prix, stock, réglementation et code-barres.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <StatCard label="Produits" value={stats.total} />
            <StatCard label="Stock total" value={stats.stock} />
            <StatCard label="Réglementés" value={stats.reglementes} />
            <StatCard label="Rupture" value={stats.rupture} danger />
          </div>
        </div>
      </section>

      <section className="mb-5 grid gap-4 xl:grid-cols-[440px_1fr]">
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black">
                {form.id_produit ? `Modifier produit #${form.id_produit}` : 'Nouveau produit'}
              </h2>
              <p className="text-sm font-medium text-slate-500">
                Remplis les informations puis enregistre.
              </p>
            </div>

            <button
              onClick={nouveau}
              className="rounded-2xl bg-slate-800 px-4 py-2 text-sm font-black text-white hover:bg-slate-950"
            >
              Nouveau
            </button>
          </div>

          <div className="grid gap-3">
            <Field label="Nom produit">
              <input
                value={form.nomproduit}
                onChange={(e) => setForm({ ...form, nomproduit: e.target.value })}
                className="input"
                placeholder="Ex: ROBE SOIREE"
              />
            </Field>

            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Référence">
                <input
                  value={form.refproduit}
                  onChange={(e) => setForm({ ...form, refproduit: e.target.value })}
                  className="input"
                  placeholder="PRD-001044"
                />
              </Field>

              <Field label="Code-barres">
                <input
                  value={form.codebarre}
                  onChange={(e) => setForm({ ...form, codebarre: e.target.value })}
                  className="input"
                  placeholder="ZAIRE2026"
                />
              </Field>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <Field label="Prix">
                <input
                  type="number"
                  value={form.prix}
                  onChange={(e) => setForm({ ...form, prix: Number(e.target.value) })}
                  className="input"
                />
              </Field>

              <Field label="Devise">
                <select
                  value={form.devise}
                  onChange={(e) => setForm({ ...form, devise: e.target.value })}
                  className="input"
                >
                  {devises.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </Field>

              <Field label="Quantité">
                <input
                  type="number"
                  value={form.quantite}
                  onChange={(e) => setForm({ ...form, quantite: Number(e.target.value) })}
                  className="input"
                />
              </Field>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <Field label="Catégorie">
                <select
                  value={form.categorie}
                  onChange={(e) => setForm({ ...form, categorie: e.target.value })}
                  className="input"
                >
                  <option value="">Choisir</option>
                  {categories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Field>

              <Field label="Taille">
                <select
                  value={form.taille}
                  onChange={(e) => setForm({ ...form, taille: e.target.value })}
                  className="input"
                >
                  <option value="">Choisir</option>
                  {tailles.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </Field>

              <Field label="Couleur">
                <input
                  value={form.couleur}
                  onChange={(e) => setForm({ ...form, couleur: e.target.value })}
                  className="input"
                />
              </Field>
            </div>

            <Field label="Image URL / chemin">
              <input
                value={form.imagepath}
                onChange={(e) => setForm({ ...form, imagepath: e.target.value })}
                className="input"
                placeholder="https://... ou /uploads/produits/image.png"
              />
            </Field>

            <Field label="Description">
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="input min-h-20 resize-none"
                placeholder="Description courte du produit..."
              />
            </Field>

            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <h3 className="mb-3 font-black text-slate-800">Réglementation</h3>

              <div className="grid gap-3">
                <label className="flex items-center gap-2 text-sm font-bold">
                  <input
                    type="checkbox"
                    checked={form.isreglemente}
                    onChange={(e) => setForm({ ...form, isreglemente: e.target.checked })}
                  />
                  Produit réglementé
                </label>

                <label className="flex items-center gap-2 text-sm font-bold">
                  <input
                    type="checkbox"
                    checked={form.signaturemanagerrequired}
                    onChange={(e) =>
                      setForm({ ...form, signaturemanagerrequired: e.target.checked })
                    }
                  />
                  Signature Manager requise
                </label>

                <select
                  value={form.permissioncode}
                  onChange={(e) => setForm({ ...form, permissioncode: e.target.value })}
                  disabled={!form.signaturemanagerrequired}
                  className="input"
                >
                  <option value="">Permission</option>
                  {permissions.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>

                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    type="number"
                    value={form.agemin}
                    onChange={(e) => setForm({ ...form, agemin: Number(e.target.value) })}
                    disabled={!form.isreglemente}
                    className="input"
                    placeholder="Âge minimum"
                  />

                  <select
                    value={form.niveaurestriction}
                    onChange={(e) =>
                      setForm({ ...form, niveaurestriction: Number(e.target.value) })
                    }
                    disabled={!form.isreglemente}
                    className="input"
                  >
                    <option value={0}>0 - Aucun</option>
                    <option value={1}>1 - Faible</option>
                    <option value={2}>2 - Moyen</option>
                    <option value={3}>3 - Élevé</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              <ActionButton onClick={enregistrer} disabled={saving} icon={<Plus size={17} />}>
                Enregistrer
              </ActionButton>

              <ActionButton onClick={modifier} disabled={saving || !form.id_produit} icon={<Edit size={17} />}>
                Modifier
              </ActionButton>

              <ActionButton onClick={genererCodeBarre} icon={<Barcode size={17} />} variant="slate">
                Générer code-barres
              </ActionButton>

              <ActionButton onClick={signatureManager} icon={<ShieldCheck size={17} />} variant="amber">
                Signature
              </ActionButton>

              <ActionButton onClick={imprimerEtiquettes} icon={<Printer size={17} />} variant="blue">
                Imprimer étiquettes
              </ActionButton>

              <ActionButton onClick={supprimerSoft} icon={<Trash2 size={17} />} variant="red">
                Supprimer
              </ActionButton>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_250px]">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-slate-400" size={18} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') chargerProduits(search);
                }}
                className="input pl-10"
                placeholder="Rechercher nom, référence, code-barres..."
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => chargerProduits(search)}
                className="flex-1 rounded-2xl bg-blue-700 px-4 py-3 font-black text-white hover:bg-blue-800"
              >
                Rechercher
              </button>

              <button
                onClick={() => {
                  setSearch('');
                  chargerProduits('');
                }}
                className="rounded-2xl bg-slate-800 px-4 py-3 text-white hover:bg-slate-950"
              >
                <RefreshCw size={18} />
              </button>
            </div>
          </div>

          <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_220px]">
            <input
              value={scanCode}
              onChange={(e) => setScanCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') scanner(scanCode);
              }}
              className="input"
              placeholder="Scanner ou saisir un code-barres..."
            />

            <button
              onClick={() => scanner(scanCode)}
              className="rounded-2xl bg-emerald-700 px-4 py-3 font-black text-white hover:bg-emerald-800"
            >
              Scanner
            </button>
          </div>

          {loading ? (
            <div className="rounded-3xl border border-dashed border-slate-300 p-10 text-center font-bold text-slate-500">
              Chargement des produits...
            </div>
          ) : produits.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 p-10 text-center font-bold text-slate-500">
              Aucun produit trouvé.
            </div>
          ) : (
            <div className="grid max-h-[calc(100vh-260px)] gap-4 overflow-auto pr-1">
              {produits.map((p) => (
                <ProduitCard
                  key={p.id_produit}
                  produit={p}
                  selected={form.id_produit === p.id_produit}
                  onClick={() => remplirDepuisProduit(p)}
                  formatPrix={formatPrix}
                  stock={stockOf(p)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <style jsx global>{`
        .input {
          width: 100%;
          border: 1px solid #cbd5e1;
          border-radius: 1rem;
          background: #ffffff;
          padding: 0.75rem 0.9rem;
          outline: none;
          color: #0f172a;
          font-weight: 700;
          font-size: 15px;
        }

        .input::placeholder {
          color: #64748b;
        }

        .input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
        }

        .input:disabled {
          background: #f1f5f9;
          color: #64748b;
        }
      `}</style>
    </main>
  );
}

function ProduitCard({
  produit,
  selected,
  onClick,
  formatPrix,
  stock,
}: {
  produit: Produit;
  selected: boolean;
  onClick: () => void;
  formatPrix: (v: any, devise?: string) => string;
  stock: number;
}) {
  const image = produit.imagepath?.trim();

  return (
    <button
      onClick={onClick}
      className={`grid gap-4 rounded-3xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md md:grid-cols-[130px_1fr] ${
        selected ? 'border-blue-600 ring-2 ring-blue-100' : 'border-slate-200'
      }`}
    >
      <div className="flex h-36 items-center justify-center overflow-hidden rounded-3xl bg-slate-100 ring-1 ring-slate-200">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={produit.nomproduit} className="h-full w-full object-cover" />
        ) : (
          <div className="grid place-items-center text-slate-400">
            <ImageIcon size={42} />
            <span className="mt-2 text-xs font-bold">Aucune image</span>
          </div>
        )}
      </div>

      <div className="min-w-0">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-black text-white">
                #{produit.id_produit}
              </span>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                {produit.categorie || 'Sans catégorie'}
              </span>
              {produit.isreglemente || produit.signaturemanagerrequired ? (
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
                  Réglementé
                </span>
              ) : (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                  Libre
                </span>
              )}
            </div>

            <h3 className="mt-2 truncate text-xl font-black text-slate-950">
              {produit.nomproduit || 'Produit'}
            </h3>

            <p className="mt-1 text-sm font-bold text-slate-500">
              Réf : {produit.refproduit || '-'} · Code : {produit.codebarre || produit.codebarretrim || '-'}
            </p>
          </div>

          <div className="text-left lg:text-right">
            <p className="text-xl font-black text-blue-700">
              {formatPrix(produit.prix, produit.devise)}
            </p>
            <p className={`text-sm font-black ${stock <= 0 ? 'text-red-600' : 'text-emerald-700'}`}>
              Stock : {stock.toLocaleString('fr-FR')}
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-2 text-sm font-bold text-slate-700 md:grid-cols-4">
          <Info label="Initial" value={produit.stockinitial ?? 0} />
          <Info label="Entrées" value={produit.entrees ?? 0} />
          <Info label="Sorties" value={produit.sorties ?? 0} />
          <Info label="Actuel" value={stock} />
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs font-black">
          <Badge label={`Taille : ${produit.taille || '-'}`} />
          <Badge label={`Couleur : ${produit.couleur || '-'}`} />
          <Badge label={`Devise : ${produit.devise || '-'}`} />
          <Badge label={produit.signaturemanagerrequired ? 'Signature : Oui' : 'Signature : Non'} />
        </div>

        {produit.description ? (
          <p className="mt-3 line-clamp-2 text-sm font-medium text-slate-500">
            {produit.description}
          </p>
        ) : null}
      </div>
    </button>
  );
}

function StatCard({
  label,
  value,
  danger,
}: {
  label: string;
  value: number;
  danger?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/15">
      <p className="text-xs font-bold text-slate-300">{label}</p>
      <p className={`text-xl font-black ${danger ? 'text-red-200' : 'text-white'}`}>
        {Number(value || 0).toLocaleString('fr-FR')}
      </p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1">
      <span className="text-sm font-black text-blue-800">{label}</span>
      {children}
    </label>
  );
}

function Info({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-base font-black text-slate-950">
        {Number(value || 0).toLocaleString('fr-FR')}
      </p>
    </div>
  );
}

function Badge({ label }: { label: string }) {
  return <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">{label}</span>;
}

function ActionButton({
  children,
  onClick,
  icon,
  disabled,
  variant = 'green',
}: {
  children: ReactNode;
  onClick: () => void;
  icon: ReactNode;
  disabled?: boolean;
  variant?: 'green' | 'blue' | 'red' | 'slate' | 'amber';
}) {
  const colors: Record<string, string> = {
    green: 'bg-green-700 hover:bg-green-800',
    blue: 'bg-blue-700 hover:bg-blue-800',
    red: 'bg-red-700 hover:bg-red-800',
    slate: 'bg-slate-700 hover:bg-slate-800',
    amber: 'bg-amber-600 hover:bg-amber-700',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-3 font-black text-white disabled:cursor-not-allowed disabled:opacity-50 ${colors[variant]}`}
    >
      {icon}
      {children}
    </button>
  );
}