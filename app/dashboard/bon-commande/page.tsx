'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  RefreshCw,
  FileText,
  Send,
  Trash2,
  Eye,
  List,
  BarChart3,
} from 'lucide-react';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://messiematala-pos-backend-production.up.railway.app';

type Fournisseur = {
  idFournisseur: number;
  nom: string;
};

type Magasin = {
  idMagasin: number;
  nomMagasin: string;
};

type Produit = {
  idProduit: number;
  nomProduit: string;
  refProduit?: string;
};

type BonCommande = {
  idBc: number;
  idFournisseur?: number;
  idMagasin?: number;

  numeroBc: string;
  dateBc: string;

  fournisseur: string;
  magasin: string;

  receveur?: string;
  transit?: string;
  pointFob?: string;
  modalites?: string;

  tva?: number;
  montantDeduit?: number;
  fraisLivraison?: number;
  deviseFraisLivraison?: string;
  autres?: number;

  statut: string;
  nbLignes: number;
  totalCdf: number;
  totalUsd: number;
  totalEur: number;
};

type Ligne = {
  idLigne: number;
  nomProduit: string;
  unite: string;
  qteCommandeeBase: number;
  prixAchat: number;
  devise: string;
  totalLigne: number;
};

const buttonBase =
  'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50';

const buttons = {
  creer: `${buttonBase} bg-green-700`,
  ajouter: `${buttonBase} bg-blue-700`,
  actualiser: `${buttonBase} bg-slate-600`,
  details: `${buttonBase} bg-indigo-700`,
  tous: `${buttonBase} bg-slate-700`,
  pdf: `${buttonBase} bg-red-800`,
  envoyer: `${buttonBase} bg-amber-600`,
  supprimer: `${buttonBase} bg-red-800`,
};

function money(value: number | string | null | undefined) {
  return Number(value || 0).toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function Page() {
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [magasins, setMagasins] = useState<Magasin[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [bons, setBons] = useState<BonCommande[]>([]);
  const [lignes, setLignes] = useState<Ligne[]>([]);
  const [idBcActif, setIdBcActif] = useState<number | null>(null);

  const [form, setForm] = useState({
    idFournisseur: '',
    idMagasin: '',
    numeroBc: '',
    dateBc: new Date().toISOString().slice(0, 10),
    receveur: '',
    transit: 'TRANSPORT ROUTIER',
    pointFob: 'KINSHASA',
    modalites: 'Paiement à la livraison',
    tva: '0',
    montantDeduit: '0',
    fraisLivraison: '0',
    deviseFraisLivraison: 'CDF',
    autres: '0',
  });

  const [ligne, setLigne] = useState({
    idProduit: '',
    qteCommandeeBase: '1',
    prixAchat: '0',
    devise: 'CDF',
    unite: 'PCS',
  });

  const stats = useMemo(() => {
    return {
      nombreBc: bons.length,
      brouillons: bons.filter((b) => b.statut === 'BROUILLON').length,
      envoyes: bons.filter((b) => b.statut === 'ENVOYE').length,
      totalCdf: bons.reduce((s, b) => s + Number(b.totalCdf || 0), 0),
      totalUsd: bons.reduce((s, b) => s + Number(b.totalUsd || 0), 0),
      totalEur: bons.reduce((s, b) => s + Number(b.totalEur || 0), 0),
    };
  }, [bons]);

  useEffect(() => {
    chargerBase();
    chargerBons();
  }, []);

  async function chargerBase() {
    const [f, m, p] = await Promise.all([
      fetch(`${API_URL}/bon-commande/fournisseurs`).then((r) => r.json()),
      fetch(`${API_URL}/bon-commande/magasins`).then((r) => r.json()),
      fetch(`${API_URL}/bon-commande/produits`).then((r) => r.json()),
    ]);

    setFournisseurs(Array.isArray(f) ? f : []);
    setMagasins(Array.isArray(m) ? m : []);
    setProduits(Array.isArray(p) ? p : []);
  }

  async function chargerBons() {
    const idEntreprise = localStorage.getItem('ZAIRE_ID_ENTREPRISE') || '1';
    const data = await fetch(
      `${API_URL}/bon-commande?idEntreprise=${idEntreprise}`,
    ).then((r) => r.json());

    setBons(Array.isArray(data) ? data : []);
  }

  async function chargerDetails(bc: BonCommande | number) {
  const idBc = typeof bc === 'number' ? bc : bc.idBc;

  setIdBcActif(idBc);

  if (typeof bc !== 'number') {
    setForm((old) => ({
      ...old,
      idFournisseur: bc.idFournisseur ? String(bc.idFournisseur) : '',
      idMagasin: bc.idMagasin ? String(bc.idMagasin) : '',

      numeroBc: bc.numeroBc || '',
      dateBc: bc.dateBc
        ? new Date(bc.dateBc).toISOString().slice(0, 10)
        : old.dateBc,

      receveur: bc.receveur || '',
      transit: bc.transit || 'TRANSPORT ROUTIER',
      pointFob: bc.pointFob || 'KINSHASA',
      modalites: bc.modalites || 'Paiement à la livraison',

      tva: String(bc.tva || 0),
      montantDeduit: String(bc.montantDeduit || 0),
      fraisLivraison: String(bc.fraisLivraison || 0),
      deviseFraisLivraison: bc.deviseFraisLivraison || 'CDF',
      autres: String(bc.autres || 0),
    }));
  }

  const data = await fetch(`${API_URL}/bon-commande/details/${idBc}`).then(
    (r) => r.json(),
  );

  setLignes(Array.isArray(data) ? data : []);
}

  async function creerBc() {
  if (!form.idFournisseur || Number(form.idFournisseur) <= 0) {
    alert('Choisis un fournisseur.');
    return;
  }

  const payload = {
    idFournisseur: Number(form.idFournisseur),
    id_fournisseur: Number(form.idFournisseur), // sécurité

    idMagasin: form.idMagasin ? Number(form.idMagasin) : null,
    idmagasin: form.idMagasin ? Number(form.idMagasin) : null,

    numeroBc: form.numeroBc || undefined,
    dateBc: form.dateBc,

    idEntreprise: Number(localStorage.getItem('ZAIRE_ID_ENTREPRISE') || 1),
    identreprise: Number(localStorage.getItem('ZAIRE_ID_ENTREPRISE') || 1),

    receveur: form.receveur,
    transit: form.transit,
    pointFob: form.pointFob,
    pointfob: form.pointFob,
    modalites: form.modalites,

    tva: Number(form.tva || 0),
    montantDeduit: Number(form.montantDeduit || 0),
    montantdeduit: Number(form.montantDeduit || 0),
    fraisLivraison: Number(form.fraisLivraison || 0),
    fraislivraison: Number(form.fraisLivraison || 0),
    deviseFraisLivraison: form.deviseFraisLivraison || 'CDF',
    devisefraislivraison: form.deviseFraisLivraison || 'CDF',
    autres: Number(form.autres || 0),

    creePar:
      localStorage.getItem('ZAIRE_NOM_UTILISATEUR') ||
      localStorage.getItem('ZAIRE_USER_NAME') ||
      'SYSTEME',
    creepar:
      localStorage.getItem('ZAIRE_NOM_UTILISATEUR') ||
      localStorage.getItem('ZAIRE_USER_NAME') ||
      'SYSTEME',
  };

  const res = await fetch(`${API_URL}/bon-commande`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data.message || 'Erreur création BC.');
    return;
  }

  setIdBcActif(data.idBc);
  setForm((old) => ({ ...old, numeroBc: data.numeroBc }));
  await chargerBons();
  alert('Bon de commande créé avec succès.');
}

const [loadingLigne, setLoadingLigne] = useState(false);
const [loadingEnvoyer, setLoadingEnvoyer] = useState(false);

  async function ajouterLigne() {
  if (loadingLigne) return;

  if (!idBcActif) {
    alert("Crée d'abord le bon de commande.");
    return;
  }

  const idProduit = Number(ligne.idProduit || 0);

  if (!idProduit) {
    alert('Choisis un produit.');
    return;
  }

  setLoadingLigne(true);

  try {
    const payload = {
      idProduit,
      qteCommandeeBase: Number(ligne.qteCommandeeBase || 1),
      prixAchat: Number(ligne.prixAchat || 0),
      devise: ligne.devise || 'CDF',
      unite: ligne.unite || 'PCS',
      idEntreprise: Number(localStorage.getItem('ZAIRE_ID_ENTREPRISE') || 1),
      idMagasin: form.idMagasin ? Number(form.idMagasin) : null,
    };

    const res = await fetch(`${API_URL}/bon-commande/${idBcActif}/lignes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || 'Erreur ajout ligne.');
      return;
    }

    setLigne({
      idProduit: '',
      qteCommandeeBase: '1',
      prixAchat: '0',
      devise: 'CDF',
      unite: 'PCS',
    });

    await chargerDetails(idBcActif);
    await chargerBons();

    alert(data.message || 'Ligne ajoutée avec succès.');
  } finally {
    setLoadingLigne(false);
  }
}

async function envoyerBc() {
  if (loadingEnvoyer) return;

  if (!idBcActif) {
    alert('Sélectionne un BC.');
    return;
  }

  setLoadingEnvoyer(true);

  try {
    const res = await fetch(`${API_URL}/bon-commande/${idBcActif}/envoyer`, {
      method: 'PATCH',
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || 'Erreur changement statut.');
      return;
    }

    await chargerBons();

    alert(data.message || 'Bon de commande envoyé.');
  } finally {
    setLoadingEnvoyer(false);
  }
}

  async function supprimerBc(idBc: number) {
    if (!confirm('Voulez-vous vraiment supprimer ce bon de commande ?')) return;

    const res = await fetch(`${API_URL}/bon-commande/${idBc}`, {
      method: 'DELETE',
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || 'Erreur suppression.');
      return;
    }

    if (idBcActif === idBc) {
      setIdBcActif(null);
      setLignes([]);
    }

    await chargerBons();
  }

 async function telechargerPdf() {
  if (!idBcActif) {
    alert('Sélectionne un BC.');
    return;
  }

  const res = await fetch(`${API_URL}/bon-commande/${idBcActif}/pdf`);
  const blob = await res.blob();

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');

  a.href = url;
  a.download = `BC_${idBcActif}.pdf`;
  document.body.appendChild(a);
  a.click();

  a.remove();
  window.URL.revokeObjectURL(url);
}

  function ouvrirPdfMensuel() {
    const mois = new Date().toISOString().slice(0, 7);
    const idEntreprise = localStorage.getItem('ZAIRE_ID_ENTREPRISE') || '1';
    window.open(
      `${API_URL}/bon-commande/pdf-mensuel?mois=${mois}&idEntreprise=${idEntreprise}`,
      '_blank',
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="mb-6 rounded-3xl bg-slate-900 p-6 text-white shadow-sm">
        <h1 className="text-2xl font-bold md:text-3xl">
          Bon de Commande Fournisseur
        </h1>
        <p className="mt-2 text-sm text-slate-300">
          Création, lignes, statut, détails, PDF BC et rapport mensuel.
        </p>
      </div>

      <section className="mb-6 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        {[
          ['Nombre BC', stats.nombreBc],
          ['Brouillons', stats.brouillons],
          ['Envoyés', stats.envoyes],
          ['Total CDF', money(stats.totalCdf)],
          ['Total USD', money(stats.totalUsd)],
          ['Total EUR', money(stats.totalEur)],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
          >
            <p className="text-xs font-semibold uppercase text-slate-500">
              {label}
            </p>
            <p className="mt-2 text-xl font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="grid gap-4 md:grid-cols-4">
          <label className="text-sm">
            Fournisseur
            <select
  className="mt-1 w-full rounded-xl border p-2"
  value={form.idFournisseur}
  onChange={(e) => {
    const value = e.target.value;
    setForm((old) => ({
      ...old,
      idFournisseur: value,
    }));
  }}
>
  <option value="">Choisir...</option>
  {fournisseurs.map((f) => (
    <option key={f.idFournisseur} value={String(f.idFournisseur)}>
      {f.nom}
    </option>
  ))}
</select>
          </label>

          <label className="text-sm">
            Magasin
            <select
  className="mt-1 w-full rounded-xl border p-2"
  value={form.idMagasin}
  onChange={(e) => {
    const value = e.target.value;
    setForm((old) => ({
      ...old,
      idMagasin: value,
    }));
  }}
>
  <option value="">Choisir...</option>
  {magasins.map((m) => (
    <option key={m.idMagasin} value={String(m.idMagasin)}>
      {m.nomMagasin}
    </option>
  ))}
</select>
          </label>

          <label className="text-sm">
            N° BC
            <input
              className="mt-1 w-full rounded-xl border bg-slate-50 p-2"
              value={form.numeroBc}
              readOnly
              placeholder="Automatique"
            />
          </label>

          <label className="text-sm">
            Date BC
            <input
              type="date"
              className="mt-1 w-full rounded-xl border p-2"
              value={form.dateBc}
              onChange={(e) => setForm({ ...form, dateBc: e.target.value })}
            />
          </label>

          {[
            ['receveur', 'Receveur'],
            ['transit', 'Transit'],
            ['pointFob', 'Point F.O.B.'],
            ['modalites', 'Modalités'],
            ['tva', 'TVA'],
            ['montantDeduit', 'Montant déduit'],
            ['fraisLivraison', 'Frais livraison'],
            ['autres', 'Autres'],
          ].map(([key, label]) => (
            <label key={key} className="text-sm">
              {label}
              <input
                className="mt-1 w-full rounded-xl border p-2"
                value={(form as any)[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            </label>
          ))}

          <label className="text-sm">
            Devise livraison
            <select
              className="mt-1 w-full rounded-xl border p-2"
              value={form.deviseFraisLivraison}
              onChange={(e) =>
                setForm({ ...form, deviseFraisLivraison: e.target.value })
              }
            >
              <option>CDF</option>
              <option>USD</option>
              <option>EUR</option>
            </select>
          </label>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button className={buttons.creer} onClick={creerBc}>
            <Plus size={16} /> Créer BC
          </button>

          <button className={buttons.actualiser} onClick={chargerBons}>
            <RefreshCw size={16} /> Actualiser
          </button>

          <button className={buttons.pdf} onClick={telechargerPdf}>
            <FileText size={16} /> PDF BC
          </button>

          <button className={buttons.pdf} onClick={ouvrirPdfMensuel}>
            <BarChart3 size={16} /> PDF Mensuel
          </button>

          <button
  className={buttons.envoyer}
  onClick={envoyerBc}
  disabled={loadingEnvoyer}
>
  <Send size={16} /> {loadingEnvoyer ? 'Envoi...' : 'Envoyer'}
</button>
        </div>
      </section>

      <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-4 text-lg font-bold text-slate-900">
          Ajouter une ligne
        </h2>

        <div className="grid gap-4 md:grid-cols-5">
          <label className="text-sm md:col-span-2">
            Produit
            <select
              className="mt-1 w-full rounded-xl border p-2"
              value={ligne.idProduit}
              onChange={(e) => setLigne({ ...ligne, idProduit: e.target.value })}
            >
              <option value="">Choisir...</option>
              {produits.map((p) => (
                <option key={p.idProduit} value={p.idProduit}>
                  {p.nomProduit}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm">
            Quantité
            <input
              type="number"
              className="mt-1 w-full rounded-xl border p-2"
              value={ligne.qteCommandeeBase}
              onChange={(e) =>
                setLigne({ ...ligne, qteCommandeeBase: e.target.value })
              }
            />
          </label>

          <label className="text-sm">
            Prix achat
            <input
              type="number"
              className="mt-1 w-full rounded-xl border p-2"
              value={ligne.prixAchat}
              onChange={(e) =>
                setLigne({ ...ligne, prixAchat: e.target.value })
              }
            />
          </label>

          <label className="text-sm">
            Devise
            <select
              className="mt-1 w-full rounded-xl border p-2"
              value={ligne.devise}
              onChange={(e) => setLigne({ ...ligne, devise: e.target.value })}
            >
              <option>CDF</option>
              <option>USD</option>
              <option>EUR</option>
            </select>
          </label>

          <label className="text-sm">
            Unité
            <input
              className="mt-1 w-full rounded-xl border p-2"
              value={ligne.unite}
              onChange={(e) => setLigne({ ...ligne, unite: e.target.value })}
            />
          </label>
        </div>

       <button
  className={`${buttons.ajouter} mt-4`}
  onClick={ajouterLigne}
  disabled={loadingLigne}
>
  <Plus size={16} /> {loadingLigne ? 'Ajout...' : 'Ajouter ligne'}
</button>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="mb-4 flex items-center gap-2">
            <List size={18} />
            <h2 className="text-lg font-bold">Tous les BC</h2>
          </div>

          <div className="overflow-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-slate-900 text-white">
                <tr>
                  <th className="p-2 text-left">ID</th>
                  <th className="p-2 text-left">N° BC</th>
                  <th className="p-2 text-left">Date</th>
                  <th className="p-2 text-left">Fournisseur</th>
                  <th className="p-2 text-left">Magasin</th>
                  <th className="p-2 text-center">Statut</th>
                  <th className="p-2 text-right">CDF</th>
                  <th className="p-2 text-right">USD</th>
                  <th className="p-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bons.map((b) => (
                  <tr key={b.idBc} className="border-b hover:bg-slate-50">
                    <td className="p-2">#{b.idBc}</td>
                    <td className="p-2">{b.numeroBc}</td>
                    <td className="p-2">
                      {new Date(b.dateBc).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="p-2">{b.fournisseur}</td>
                    <td className="p-2">{b.magasin}</td>
                    <td className="p-2 text-center">{b.statut}</td>
                    <td className="p-2 text-right">{money(b.totalCdf)}</td>
                    <td className="p-2 text-right">{money(b.totalUsd)}</td>
                    <td className="p-2">
                      <div className="flex justify-end gap-2">
                        <button
                          className={buttons.details}
                          onClick={() => chargerDetails(b)}
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          className={buttons.supprimer}
                          onClick={() => supprimerBc(b.idBc)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {bons.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-6 text-center text-slate-500">
                      Aucun bon de commande.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="mb-4 flex items-center gap-2">
            <Eye size={18} />
            <h2 className="text-lg font-bold">
              Détails BC {idBcActif ? `#${idBcActif}` : ''}
            </h2>
          </div>

          <div className="overflow-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead className="bg-slate-900 text-white">
                <tr>
                  <th className="p-2 text-left">Produit</th>
                  <th className="p-2 text-center">Unité</th>
                  <th className="p-2 text-right">Qté</th>
                  <th className="p-2 text-right">PU</th>
                  <th className="p-2 text-center">Devise</th>
                  <th className="p-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {lignes.map((l) => (
                  <tr key={l.idLigne} className="border-b">
                    <td className="p-2">{l.nomProduit}</td>
                    <td className="p-2 text-center">{l.unite}</td>
                    <td className="p-2 text-right">{l.qteCommandeeBase}</td>
                    <td className="p-2 text-right">{money(l.prixAchat)}</td>
                    <td className="p-2 text-center">{l.devise}</td>
                    <td className="p-2 text-right">{money(l.totalLigne)}</td>
                  </tr>
                ))}

                {lignes.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-500">
                      Aucune ligne sélectionnée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}