'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://messiematala-pos-backend-production.up.railway.app';

type Annulation = {
  id: number;
  nomClient?: string;
  numeroCommande?: string;
  dateAchat?: string;
  nomProduit?: string;
  quantiteAchetee?: number;
  quantiteRetournee?: number;
  prixUnitaire?: number;
  prixTotal?: number;
  devise?: string;
  motifRetour?: string;
  commentaires?: string;
  typeRetour?: string;
  idVente?: number;
  idDetailsVente?: number;
  idPaiementRemboursement?: number;
  dateRetour?: string;
};

type DetailSource = {
  idDetailsVente?: number;
  idVente?: number;
  idProduit?: number;
  nomProduit?: string;
  quantiteAchetee?: number;
  quantiteDejaRetournee?: number;
  prixUnitaire?: number;
  devise?: string;
  idEntreprise?: number;
  idMagasin?: number;
  idPoste?: number;
  nomCaissier?: string;

  nomClient?: string;
  numeroFacture?: string;
  idDepotRetour?: number;
  nomDepotRetour?: string;
};

type Produit = {
  id_produit: number;
  nomproduit?: string;
  nom_produit?: string;
  designation?: string;
  prix?: number | string;
  prixvente?: number | string;
  prixunitaire?: number | string;
  devise?: string;
};

type Depot = {
  id_depot?: number;
  idDepot?: number;
  id?: number;
  nomdepot?: string;
  nomDepot?: string;
  nom?: string;
};

export default function AnnulationsPage() {
  const router = useRouter();

  const [items, setItems] = useState<Annulation[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [depots, setDepots] = useState<Depot[]>([]);

  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [typeRetour, setTypeRetour] = useState<'REMBOURSEMENT' | 'ECHANGE'>(
    'REMBOURSEMENT',
  );

  const [form, setForm] = useState({
    nomClient: '',
    numeroCommande: '',
    dateAchat: new Date().toISOString().slice(0, 10),
    nomProduit: '',
    quantiteAchetee: 1,
    quantiteRetournee: 1,
    prixUnitaire: 0,
    devise: 'USD',
    motifRetour: 'Produit défectueux',
    commentaires: '',
    idVente: 0,
    idDetailsVente: 0,
    idProduitRetour: 0,
    idDepotRetour: 0,
    idProduitNouveau: 0,
    idDepotSortieEchange: 0,
    qteNouveau: 1,
    prixUnitaireNouveau: 0,
    nomProduitNouveau: '',
    modePaiementComplement: 'CASH',
    idEntreprise: 1,
    idMagasin: 1,
    idPoste: 1,
    utilisateur: 'SYSTEM',
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idDetails = Number(params.get('idDetails') || 0);
    const idVente = Number(params.get('idVente') || 0);

    chargerAnnulations();
    chargerProduits();
    chargerDepots();

    if (idVente > 0) {
      setForm((f) => ({ ...f, idVente }));
    }

    if (idDetails > 0) {
      chargerDepuisDetail(idDetails);
    }
  }, []);

  async function lireApi(res: Response) {
    const texte = await res.text();
    try {
      return texte ? JSON.parse(texte) : null;
    } catch {
      return texte;
    }
  }

  function nombre(v: any) {
    if (typeof v === 'number') return Number.isFinite(v) ? v : 0;

    const texte = String(v ?? '0')
      .replace(/\$/g, '')
      .replace(/USD/gi, '')
      .replace(/CDF/gi, '')
      .replace(/FC/gi, '')
      .replace(/\s/g, '')
      .replace(',', '.');

    const n = Number(texte);
    return Number.isFinite(n) ? n : 0;
  }

  function formatMontant(v: any, devise = 'USD') {
    const d = String(devise || 'USD').toUpperCase();

    return nombre(v).toLocaleString('fr-FR', {
      minimumFractionDigits: d === 'CDF' ? 0 : 2,
      maximumFractionDigits: d === 'CDF' ? 0 : 2,
    });
  }

  function nomProduit(p: Produit) {
    return p.nomproduit || p.nom_produit || p.designation || 'PRODUIT';
  }

  function prixProduit(p: Produit) {
    return nombre(p.prixvente ?? p.prix ?? p.prixunitaire ?? 0);
  }

  function idDepot(d: Depot) {
    return Number(d.id_depot ?? d.idDepot ?? d.id ?? 0);
  }

  function nomDepot(d: Depot) {
    return d.nomdepot || d.nomDepot || d.nom || `Dépôt ${idDepot(d)}`;
  }

  async function chargerAnnulations(q = search) {
    setLoading(true);

    try {
      const res = await fetch(
        `${API}/annulations?search=${encodeURIComponent(q || '')}`,
        { cache: 'no-store' },
      );

      const data = await lireApi(res);

      if (!res.ok) {
        alert(`Erreur API ${res.status} : ${JSON.stringify(data)}`);
        return;
      }

      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      alert('Impossible de charger les annulations.');
    } finally {
      setLoading(false);
    }
  }

  async function chargerDepuisDetail(idDetails: number) {
    try {
      const res = await fetch(`${API}/annulations/from-detail/${idDetails}`, {
        cache: 'no-store',
      });

      const data: DetailSource = await lireApi(res);

      if (!res.ok) {
        alert(`Erreur détail : ${JSON.stringify(data)}`);
        return;
      }

      setForm((f) => ({
  ...f,
  nomClient: data.nomClient || 'CLIENT CASH',
  numeroCommande: data.numeroFacture || String(data.idVente || f.idVente),

  idDetailsVente: Number(data.idDetailsVente || idDetails),
  idVente: Number(data.idVente || f.idVente),
  idProduitRetour: Number(data.idProduit || 0),
  nomProduit: data.nomProduit || '',
  quantiteAchetee: nombre(data.quantiteAchetee),
  quantiteRetournee: 1,
  prixUnitaire: nombre(data.prixUnitaire),
  devise: data.devise || 'USD',

  idEntreprise: Number(data.idEntreprise || 1),
  idMagasin: Number(data.idMagasin || 1),
  idPoste: Number(data.idPoste || 1),

  idDepotRetour: Number(data.idDepotRetour || 0),

  utilisateur: data.nomCaissier || 'SYSTEM',
}));
    } catch (e) {
      console.error(e);
      alert('Impossible de charger le détail de vente.');
    }
  }

  async function chargerProduits() {
    try {
      const res = await fetch(`${API}/produits`, { cache: 'no-store' });
      const data = await lireApi(res);

      if (res.ok && Array.isArray(data)) {
        setProduits(data);
      }
    } catch {}
  }

 async function chargerDepots() {
  try {
    const idEntreprise = Number(
      localStorage.getItem('ZAIRE_ID_ENTREPRISE') || 1,
    );

    const idMagasin = Number(
      localStorage.getItem('ZAIRE_ID_MAGASIN') || 1,
    );

    const res = await fetch(
      `${API}/config-poste-pos/depots?idEntreprise=${idEntreprise}&idMagasin=${idMagasin}`,
      {
        cache: 'no-store',
      },
    );

    const data = await lireApi(res);

    if (res.ok && Array.isArray(data)) {
      setDepots(data);
    }
  } catch (e) {
    console.error(e);
  }
}

  const prixTotal = useMemo(() => {
    return nombre(form.quantiteRetournee) * nombre(form.prixUnitaire);
  }, [form.quantiteRetournee, form.prixUnitaire]);

  const totalNouveau = useMemo(() => {
    return nombre(form.qteNouveau) * nombre(form.prixUnitaireNouveau);
  }, [form.qteNouveau, form.prixUnitaireNouveau]);

  const differenceEchange = totalNouveau - prixTotal;

  function changerProduitEchange(id: number) {
    const p = produits.find((x) => Number(x.id_produit) === Number(id));

    setForm((f) => ({
      ...f,
      idProduitNouveau: id,
      nomProduitNouveau: p ? nomProduit(p) : '',
      prixUnitaireNouveau: p ? prixProduit(p) : 0,
    }));
  }

  async function enregistrer() {
    if (!form.nomClient.trim()) return alert('Nom client obligatoire.');
    if (!form.numeroCommande.trim()) return alert('Numéro commande obligatoire.');
    if (!form.nomProduit.trim()) return alert('Nom produit obligatoire.');
    if (nombre(form.quantiteRetournee) <= 0) return alert('Quantité invalide.');
    if (nombre(form.prixUnitaire) <= 0) return alert('Prix unitaire invalide.');

    if (typeRetour === 'ECHANGE') {
      if (!form.idProduitNouveau) return alert('Sélectionne le produit échangé.');
      if (!form.idDepotSortieEchange) {
        return alert('Sélectionne le dépôt de sortie échange.');
      }
      if (nombre(form.qteNouveau) <= 0) return alert('Quantité échangée invalide.');
    }

    if (!form.idDepotRetour) {
      return alert('Sélectionne le dépôt de retour.');
    }

    const ok = window.confirm(
      typeRetour === 'ECHANGE'
        ? 'Confirmer cet échange ?'
        : 'Confirmer ce remboursement ?',
    );

    if (!ok) return;

    setSaving(true);

    try {
     const payload = {
  nomClient: form.nomClient,
  numeroCommande: form.numeroCommande,
  dateAchat: form.dateAchat,
  nomProduit: form.nomProduit,
  quantiteAchetee: nombre(form.quantiteAchetee),
  quantiteRetournee: nombre(form.quantiteRetournee),
  prixUnitaire: nombre(form.prixUnitaire),
  devise: form.devise,
  motifRetour: form.motifRetour,
  commentaires: form.commentaires,
  typeRetour,

  idVente: form.idVente || undefined,
  idDetailsVente: form.idDetailsVente || undefined,
  utilisateur: form.utilisateur || 'SYSTEM',

  remettreStock: true,
  faireRemboursement: typeRetour === 'REMBOURSEMENT',

  idProduitRetour: form.idProduitRetour || undefined,

  idDepot: form.idDepotRetour || undefined,
  idDepotRetour: form.idDepotRetour || undefined,

  idProduitNouveau:
    typeRetour === 'ECHANGE' ? form.idProduitNouveau : undefined,

  idDepotSortieEchange:
    typeRetour === 'ECHANGE'
      ? form.idDepotSortieEchange
      : undefined,

  qteNouveau:
    typeRetour === 'ECHANGE' ? nombre(form.qteNouveau) : undefined,

  prixUnitaireNouveau:
    typeRetour === 'ECHANGE'
      ? nombre(form.prixUnitaireNouveau)
      : undefined,

  nomProduitNouveau:
    typeRetour === 'ECHANGE' ? form.nomProduitNouveau : undefined,

  modePaiementComplement:
    typeRetour === 'ECHANGE' ? form.modePaiementComplement : undefined,

  idEntreprise: form.idEntreprise || 1,
  idMagasin: form.idMagasin || 1,
  idPoste: form.idPoste || 1,
};

      const res = await fetch(`${API}/annulations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await lireApi(res);

      if (!res.ok) {
        alert(`Erreur enregistrement : ${JSON.stringify(data)}`);
        return;
      }

      alert(data?.message || 'Opération enregistrée.');
      chargerAnnulations();
    } catch (e) {
      console.error(e);
      alert('Erreur pendant l’enregistrement.');
    } finally {
      setSaving(false);
    }
  }

  function reinitialiser() {
    setTypeRetour('REMBOURSEMENT');
    setForm({
      nomClient: '',
      numeroCommande: '',
      dateAchat: new Date().toISOString().slice(0, 10),
      nomProduit: '',
      quantiteAchetee: 1,
      quantiteRetournee: 1,
      prixUnitaire: 0,
      devise: 'USD',
      motifRetour: 'Produit défectueux',
      commentaires: '',
      idVente: 0,
      idDetailsVente: 0,
      idProduitRetour: 0,
      idDepotRetour: 0,
      idProduitNouveau: 0,
      idDepotSortieEchange: 0,
      qteNouveau: 1,
      prixUnitaireNouveau: 0,
      nomProduitNouveau: '',
      modePaiementComplement: 'CASH',
      idEntreprise: 1,
      idMagasin: 1,
      idPoste: 1,
      utilisateur: 'SYSTEM',
    });
  }

  return (
    <main className="min-h-screen bg-slate-100 p-3 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-bold text-red-600">
                Annulations / Retours / Échanges
              </p>
              <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">
                Gestion des annulations
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Remboursement, échange, retour stock et historique.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                onClick={() => router.push('/dashboard/ventes')}
                className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white"
              >
                Ventes
              </button>

              <button
                onClick={reinitialiser}
                className="rounded-2xl bg-orange-500 px-5 py-3 text-sm font-bold text-white"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="mb-4 flex rounded-2xl bg-slate-100 p-1">
              <button
                onClick={() => setTypeRetour('REMBOURSEMENT')}
                className={`flex-1 rounded-xl px-4 py-3 text-sm font-black ${
                  typeRetour === 'REMBOURSEMENT'
                    ? 'bg-red-600 text-white'
                    : 'text-slate-600'
                }`}
              >
                Remboursement
              </button>

              <button
                onClick={() => setTypeRetour('ECHANGE')}
                className={`flex-1 rounded-xl px-4 py-3 text-sm font-black ${
                  typeRetour === 'ECHANGE'
                    ? 'bg-purple-700 text-white'
                    : 'text-slate-600'
                }`}
              >
                Échange
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Nom client"
                value={form.nomClient}
                onChange={(v) => setForm({ ...form, nomClient: v })}
              />

              <Input
                label="N° commande / facture"
                value={form.numeroCommande}
                onChange={(v) => setForm({ ...form, numeroCommande: v })}
              />

              <Input
                label="Date achat"
                type="date"
                value={form.dateAchat}
                onChange={(v) => setForm({ ...form, dateAchat: v })}
              />

              <Input
                label="Produit retourné"
                value={form.nomProduit}
                onChange={(v) => setForm({ ...form, nomProduit: v })}
              />

              <Input
                label="Quantité achetée"
                type="number"
                value={form.quantiteAchetee}
                onChange={(v) =>
                  setForm({ ...form, quantiteAchetee: nombre(v) })
                }
              />

              <Input
                label="Quantité retournée"
                type="number"
                value={form.quantiteRetournee}
                onChange={(v) =>
                  setForm({ ...form, quantiteRetournee: nombre(v) })
                }
              />

              <Input
                label="Prix unitaire"
                type="number"
                value={form.prixUnitaire}
                onChange={(v) =>
                  setForm({ ...form, prixUnitaire: nombre(v) })
                }
              />

              <Select
                label="Devise"
                value={form.devise}
                onChange={(v) => setForm({ ...form, devise: v })}
                options={['USD', 'CDF', 'EUR']}
              />

              <Select
                label="Motif retour"
                value={form.motifRetour}
                onChange={(v) => setForm({ ...form, motifRetour: v })}
                options={[
                  'Produit défectueux',
                  'Erreur de commande',
                  'Non conforme',
                  'Produit endommagé',
                  'Autre',
                ]}
              />

              <Select
                label="Dépôt retour"
                value={String(form.idDepotRetour || '')}
                onChange={(v) =>
                  setForm({ ...form, idDepotRetour: Number(v) })
                }
                options={depots.map((d) => ({
                  label: nomDepot(d),
                  value: String(idDepot(d)),
                }))}
              />

              <Input
                label="Commentaires"
                value={form.commentaires}
                onChange={(v) => setForm({ ...form, commentaires: v })}
              />

              <Input
                label="Utilisateur"
                value={form.utilisateur}
                onChange={(v) => setForm({ ...form, utilisateur: v })}
              />
            </div>

            {typeRetour === 'ECHANGE' && (
              <div className="mt-5 rounded-3xl bg-purple-50 p-4 ring-1 ring-purple-100">
                <h2 className="mb-3 text-lg font-black text-purple-900">
                  Informations échange
                </h2>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Select
                    label="Produit échangé"
                    value={String(form.idProduitNouveau || '')}
                    onChange={(v) => changerProduitEchange(Number(v))}
                    options={produits.map((p) => ({
                      label: nomProduit(p),
                      value: String(p.id_produit),
                    }))}
                  />

                  <Input
                    label="Qté produit échangé"
                    type="number"
                    value={form.qteNouveau}
                    onChange={(v) =>
                      setForm({ ...form, qteNouveau: nombre(v) })
                    }
                  />

                  <Input
                    label="Prix produit échangé"
                    type="number"
                    value={form.prixUnitaireNouveau}
                    onChange={(v) =>
                      setForm({
                        ...form,
                        prixUnitaireNouveau: nombre(v),
                      })
                    }
                  />

                  <Select
                    label="Dépôt sortie échange"
                    value={String(form.idDepotSortieEchange || '')}
                    onChange={(v) =>
                      setForm({
                        ...form,
                        idDepotSortieEchange: Number(v),
                      })
                    }
                    options={depots.map((d) => ({
                      label: nomDepot(d),
                      value: String(idDepot(d)),
                    }))}
                  />

                  <Select
                    label="Mode paiement complément"
                    value={form.modePaiementComplement}
                    onChange={(v) =>
                      setForm({ ...form, modePaiementComplement: v })
                    }
                    options={['CASH', 'CARTE', 'MOBILE MONEY']}
                  />
                </div>
              </div>
            )}

            <div className="mt-5 flex flex-col gap-3 rounded-3xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-500">Total retour</p>
                <p className="text-2xl font-black text-red-600">
                  {formatMontant(prixTotal, form.devise)} {form.devise}
                </p>

                {typeRetour === 'ECHANGE' && (
                  <p className="mt-1 text-sm font-bold text-purple-700">
                    Différence échange :{' '}
                    {formatMontant(differenceEchange, form.devise)}{' '}
                    {form.devise}
                  </p>
                )}
              </div>

              <button
                onClick={enregistrer}
                disabled={saving}
                className="rounded-2xl bg-emerald-700 px-6 py-3 text-sm font-black text-white disabled:opacity-50"
              >
                {saving
                  ? 'Enregistrement...'
                  : typeRetour === 'ECHANGE'
                    ? 'Valider échange'
                    : 'Rembourser'}
              </button>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-xl font-black text-slate-900">
              Résumé opération
            </h2>

            <div className="mt-4 space-y-3">
              <Info label="Type" value={typeRetour} />
              <Info label="Vente" value={form.idVente || '-'} />
              <Info label="Détail vente" value={form.idDetailsVente || '-'} />
              <Info label="Produit" value={form.nomProduit || '-'} />
              <Info
                label="Quantité retournée"
                value={form.quantiteRetournee || 0}
              />
              <Info
                label="Montant"
                value={`${formatMontant(prixTotal, form.devise)} ${form.devise}`}
              />
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="text-xl font-black text-slate-900">
              Historique des annulations
            </h2>

            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Recherche..."
                className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-600"
              />

              <button
                onClick={() => chargerAnnulations(search)}
                className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white"
              >
                Rechercher
              </button>
            </div>
          </div>

          {loading ? (
            <div className="rounded-2xl bg-slate-50 p-8 text-center text-slate-500">
              Chargement...
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-8 text-center text-slate-500">
              Aucune annulation trouvée.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left text-xs uppercase text-slate-500">
                    <th className="px-3 py-2">ID</th>
                    <th className="px-3 py-2">Client</th>
                    <th className="px-3 py-2">Commande</th>
                    <th className="px-3 py-2">Produit</th>
                    <th className="px-3 py-2 text-right">Qté</th>
                    <th className="px-3 py-2 text-right">Total</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Motif</th>
                    <th className="px-3 py-2">Date</th>
                  </tr>
                </thead>

                <tbody>
                  {items.map((a) => (
                    <tr key={a.id} className="bg-slate-50 text-sm">
                      <td className="rounded-l-2xl px-3 py-3 font-bold">
                        #{a.id}
                      </td>
                      <td className="px-3 py-3">{a.nomClient || '-'}</td>
                      <td className="px-3 py-3">{a.numeroCommande || '-'}</td>
                      <td className="px-3 py-3 font-bold">
                        {a.nomProduit || '-'}
                      </td>
                      <td className="px-3 py-3 text-right">
                        {a.quantiteRetournee || 0}
                      </td>
                      <td className="px-3 py-3 text-right font-black text-red-600">
                        {formatMontant(a.prixTotal, a.devise)} {a.devise}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black ${
                            a.typeRetour === 'ECHANGE'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {a.typeRetour || '-'}
                        </span>
                      </td>
                      <td className="px-3 py-3">{a.motifRetour || '-'}</td>
                      <td className="rounded-r-2xl px-3 py-3">
                        {a.dateRetour
                          ? new Date(a.dateRetour).toLocaleString('fr-FR')
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Input({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: any;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-black uppercase text-slate-500">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-600"
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<string | { label: string; value: string }>;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-black uppercase text-slate-500">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-600"
      >
        <option value="">-- Sélectionner --</option>
        {options.map((o) =>
          typeof o === 'string' ? (
            <option key={o} value={o}>
              {o}
            </option>
          ) : (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ),
        )}
      </select>
    </label>
  );
}

function Info({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-black uppercase text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}