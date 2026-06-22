'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

const API = 'https://messiematala-pos-backend-production.up.railway.app';

type Produit = {
  id_produit: number;
  nomproduit?: string;
  nom_produit?: string;
  designation?: string;
  refproduit?: string;
  ref_produit?: string;
  reference?: string;
  codebarre?: string;
  code_barre?: string;
  barcode?: string;
  prix?: string | number | null;
  prixvente?: string | number | null;
  prixunitaire?: string | number | null;
  devise?: string | null;
  taille?: string | null;
  couleur?: string | null;
};

type Client = {
  id_clients: number;
  nom?: string;
  telephone?: string | null;
};

type LigneVente = {
  idProduit: number;
  refproduit: string;
  nomproduit: string;
  quantite: number;
  prixunitaire: number;
  remise: number;
  tva: number;
  devise: string;
  taille: string;
  couleur: string;
};

export default function NouvelleVentePage() {
  const router = useRouter();

  const scanRef = useRef<HTMLInputElement | null>(null);
  const autoScanRef = useRef(true);
  const lastScanRef = useRef({ code: '', time: 0 });
  const lastEnterRef = useRef(0);

  const [produits, setProduits] = useState<Produit[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [idClient, setIdClient] = useState<number | null>(null);

  const [scan, setScan] = useState('');
  const [lignes, setLignes] = useState<LigneVente[]>([]);

  const [qteDrafts, setQteDrafts] = useState<Record<string, string>>({});
  const [remiseDrafts, setRemiseDrafts] = useState<Record<string, string>>({});

  const [nomclient, setNomclient] = useState('CLIENT CASH');
  const [telephone, setTelephone] = useState('');
  const [caissier, setCaissier] = useState('NON CONNECTÉ');
  const [modePaiement, setModePaiement] = useState('CASH');
  const [recuUSD, setRecuUSD] = useState('');
const [recuCDF, setRecuCDF] = useState('');
const [recuEUR, setRecuEUR] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    verifierEmployeConnecte();
    chargerProduits();
    chargerClients();

    setTimeout(() => {
      if (autoScanRef.current) scanRef.current?.focus();
    }, 300);
  }, []);

  function cleLigne(l: LigneVente, index: number) {
    return `${l.idProduit}-${index}`;
  }

  function pauseScan() {
    autoScanRef.current = false;
  }

  function reprendreScan() {
    setTimeout(() => {
      autoScanRef.current = true;
      refocusScan();
    }, 250);
  }

  function refocusScan() {
    if (!autoScanRef.current) return;

    setTimeout(() => {
      scanRef.current?.focus();
      scanRef.current?.select();
    }, 80);
  }

  async function lireApi(res: Response) {
    const texte = await res.text();

    try {
      return texte ? JSON.parse(texte) : null;
    } catch {
      return texte;
    }
  }

  function verifierEmployeConnecte() {
    const raw =
      localStorage.getItem('employe') ||
      localStorage.getItem('user') ||
      localStorage.getItem('utilisateur');

    if (!raw) {
      alert('Veuillez vous connecter.');
      router.push('/dashboard/login');
      return;
    }

    try {
      const emp = JSON.parse(raw);

      const idEmploye = Number(
        emp.id_employe ??
          emp.idEmploye ??
          emp.ID_Employe ??
          emp.idutilisateur ??
          emp.idUtilisateur ??
          emp.id ??
          0,
      );

      if (!idEmploye) {
        alert('Session employé invalide.');
        router.push('/dashboard/login');
        return;
      }

      const nomComplet = `${emp.prenom ?? ''} ${emp.nom ?? ''}`.trim();

      localStorage.setItem('employe', JSON.stringify(emp));
      localStorage.setItem('idEmploye', String(idEmploye));
      localStorage.setItem('nomcaissier', nomComplet || 'CAISSIER WEB');

      setCaissier(nomComplet || 'CAISSIER WEB');
    } catch {
      alert('Session employé corrompue.');
      router.push('/dashboard/login');
    }
  }

  async function chargerProduits() {
    try {
      const res = await fetch(`${API}/produits`, { cache: 'no-store' });
      const data = await lireApi(res);

      if (!res.ok) {
        alert(`Erreur produits ${res.status} : ${JSON.stringify(data)}`);
        return;
      }

      setProduits(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      alert('Impossible de charger les produits.');
    }
  }

  async function chargerClients() {
    try {
      const res = await fetch(`${API}/clients`, { cache: 'no-store' });
      const data = await lireApi(res);

      if (!res.ok) return;

      setClients(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    }
  }

  function nettoyerCode(v: unknown) {
    return String(v ?? '')
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '')
      .replace(/–/g, '-')
      .replace(/—/g, '-');
  }

  function normaliserDevise(devise?: string | null) {
    const d = String(devise ?? 'USD').trim().toUpperCase();

    if (d === 'FC' || d === 'CDF') return 'CDF';
    if (d === '$' || d === 'DOLLAR' || d === 'USD') return 'USD';
    if (d === 'EURO' || d === 'EUR') return 'EUR';

    return 'USD';
  }

  function nombreDepuisPrix(valeur: unknown) {
    if (typeof valeur === 'number') {
      return Number.isFinite(valeur) ? valeur : 0;
    }

    let texte = String(valeur ?? '')
      .replace(/\$/g, '')
      .replace(/USD/gi, '')
      .replace(/CDF/gi, '')
      .replace(/FC/gi, '')
      .replace(/\u202f/g, '')
      .replace(/\u00a0/g, '')
      .replace(/\s/g, '')
      .trim();

    if (!texte) return 0;

    if (texte.includes(',') && texte.includes('.')) {
      texte = texte.replace(/\./g, '').replace(',', '.');
    } else if (texte.includes(',') && !texte.includes('.')) {
      texte = texte.replace(',', '.');
    }

    const n = Number(texte);
    return Number.isFinite(n) ? n : 0;
  }

  function nomProduit(p: Produit) {
    return p.nomproduit ?? p.nom_produit ?? p.designation ?? 'PRODUIT';
  }

  function refProduit(p: Produit) {
    return (
      p.refproduit ??
      p.ref_produit ??
      p.reference ??
      p.codebarre ??
      p.code_barre ??
      p.barcode ??
      String(p.id_produit)
    );
  }

  function prixProduit(p: Produit) {
    return nombreDepuisPrix(p.prix ?? p.prixvente ?? p.prixunitaire ?? 0);
  }

  function totalLigne(l: LigneVente) {
    return Math.max(0, l.quantite * l.prixunitaire - l.remise + l.tva);
  }

  function formatMontant(montant: number, devise = 'USD') {
    const d = normaliserDevise(devise);
    const decimals = d === 'CDF' ? 0 : 2;

    return Number(montant || 0).toLocaleString('fr-FR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  function trouverProduit(valeur: string) {
    const q = nettoyerCode(valeur);
    if (!q) return undefined;

    return produits.find((p) => {
      const id = nettoyerCode(p.id_produit);
      const ref = nettoyerCode(p.refproduit ?? p.ref_produit ?? p.reference);
      const code = nettoyerCode(p.codebarre ?? p.code_barre ?? p.barcode);
      const nom = nettoyerCode(p.nomproduit ?? p.nom_produit ?? p.designation);

      return (
        id === q ||
        ref === q ||
        code === q ||
        ref.includes(q) ||
        code.includes(q) ||
        nom.includes(q)
      );
    });
  }

  function ajouterProduit(valeurScan?: string) {
    const valeur = String(valeurScan ?? scan).trim();

    if (!valeur) {
      refocusScan();
      return;
    }

    const now = Date.now();
    const codeNettoye = nettoyerCode(valeur);

    if (
      lastScanRef.current.code === codeNettoye &&
      now - lastScanRef.current.time < 500
    ) {
      setScan('');
      refocusScan();
      return;
    }

    lastScanRef.current = { code: codeNettoye, time: now };

    const produit = trouverProduit(valeur);

    if (!produit) {
      alert(`Produit introuvable : ${valeur}`);
      setScan('');
      refocusScan();
      return;
    }

    const prix = prixProduit(produit);

    if (prix <= 0) {
      alert(`Prix invalide pour le produit ${nomProduit(produit)}.`);
      setScan('');
      refocusScan();
      return;
    }

    setLignes((old) => {
      const existe = old.find((x) => x.idProduit === produit.id_produit);

      if (existe) {
        return old.map((x) =>
          x.idProduit === produit.id_produit
            ? { ...x, quantite: x.quantite + 1 }
            : x,
        );
      }

      return [
        ...old,
        {
          idProduit: produit.id_produit,
          refproduit: refProduit(produit),
          nomproduit: nomProduit(produit),
          quantite: 1,
          prixunitaire: prix,
          remise: 0,
          tva: 0,
          devise: normaliserDevise(produit.devise),
          taille: produit.taille ?? '-',
          couleur: produit.couleur ?? '-',
        },
      ];
    });

    setScan('');
    refocusScan();
  }

  function choisirClient(valeur: string) {
    setNomclient(valeur);

    const texte = valeur.trim().toUpperCase();

    const client = clients.find((c) => {
      const nom = String(c.nom ?? '').trim().toUpperCase();
      return nom === texte;
    });

    if (client) {
      setIdClient(Number(client.id_clients));
      setNomclient(client.nom ?? '');
      setTelephone(client.telephone ?? '');
    } else {
      setIdClient(null);
    }
  }

  function modifierQte(index: number, valeur: string) {
    setLignes((old) =>
      old.map((l, i) => {
        if (i !== index) return l;

        const n = Number(valeur.replace(',', '.'));

        return {
          ...l,
          quantite: valeur.trim() === '' || !Number.isFinite(n) ? l.quantite : Math.max(0, n),
        };
      }),
    );
  }

  function validerQte(index: number) {
    setLignes((old) =>
      old.map((l, i) =>
        i === index ? { ...l, quantite: l.quantite > 0 ? l.quantite : 1 } : l,
      ),
    );
  }

  function modifierRemise(index: number, valeur: string) {
    setLignes((old) =>
      old.map((l, i) => {
        if (i !== index) return l;

        const n = Number(valeur.replace(',', '.'));

        return {
          ...l,
          remise: valeur.trim() === '' || !Number.isFinite(n) ? l.remise : Math.max(0, n),
        };
      }),
    );
  }

  function supprimerArticle(index: number) {
    setLignes((old) => old.filter((_, i) => i !== index));
    refocusScan();
  }

  function supprimerDernierArticle() {
    setLignes((old) => old.slice(0, -1));
    refocusScan();
  }

  function annulerVente() {
    if (lignes.length > 0 && !confirm('Annuler toute la vente ?')) return;

    setLignes([]);
    setScan('');
    setRecuUSD('');
setRecuCDF('');
setRecuEUR('');
    setNomclient('CLIENT CASH');
    setTelephone('');
    setIdClient(null);
    setModePaiement('CASH');
    setQteDrafts({});
    setRemiseDrafts({});
    refocusScan();
  }

  function retraitFidelite() {
    alert('Retrait Fidélité : phase suivante. Le bouton est conservé.');
    refocusScan();
  }

  function imprimerTicket() {
    alert('Impression ticket après finalisation. Le bouton est conservé.');
    refocusScan();
  }

  const totaux = useMemo(() => {
    return {
      USD: lignes
        .filter((x) => normaliserDevise(x.devise) === 'USD')
        .reduce((s, x) => s + totalLigne(x), 0),

      CDF: lignes
        .filter((x) => normaliserDevise(x.devise) === 'CDF')
        .reduce((s, x) => s + totalLigne(x), 0),

      EUR: lignes
        .filter((x) => normaliserDevise(x.devise) === 'EUR')
        .reduce((s, x) => s + totalLigne(x), 0),
    };
  }, [lignes]);

  const devisePrincipale = totaux.USD > 0 ? 'USD' : totaux.CDF > 0 ? 'CDF' : 'EUR';

  const totalPrincipal =
    devisePrincipale === 'USD'
      ? totaux.USD
      : devisePrincipale === 'CDF'
        ? totaux.CDF
        : totaux.EUR;

  const montantRecuUSD = nombreDepuisPrix(recuUSD);
const montantRecuCDF = nombreDepuisPrix(recuCDF);
const montantRecuEUR = nombreDepuisPrix(recuEUR);

const monnaieUSD = Math.max(0, montantRecuUSD - totaux.USD);
const monnaieCDF = Math.max(0, montantRecuCDF - totaux.CDF);
const monnaieEUR = Math.max(0, montantRecuEUR - totaux.EUR);

  async function finaliserVente() {
    if (loading) return;

    if (lignes.length === 0) {
      alert('Ajoute au moins un article.');
      refocusScan();
      return;
    }

    if (totalPrincipal <= 0) {
      alert('Total invalide.');
      refocusScan();
      return;
    }

    const idEmploye = Number(localStorage.getItem('idEmploye') || 0);
    const idSession = Number(localStorage.getItem('idSessionCaisse') || 0);

    if (!idEmploye) {
      alert('Employé non connecté.');
      router.push('/dashboard/login');
      return;
    }

    if (!idSession) {
      alert('Aucune session caisse ouverte. Va d’abord ouvrir une session caisse.');
      router.push('/dashboard/session-caisse');
      return;
    }

    setLoading(true);

    try {
      const articles = lignes.map((l) => ({
        idProduit: l.idProduit,
        id_produit: l.idProduit,
        idproduit: l.idProduit,
        nomproduit: l.nomproduit,
        refproduit: l.refproduit,
        quantite: l.quantite,
        prixunitaire: l.prixunitaire,
        prix: l.prixunitaire,
        devise: normaliserDevise(l.devise),
        remise: l.remise,
        tva: l.tva,
        taille: l.taille,
        couleur: l.couleur,
      }));

      const payload = {
  idClient,
  id_client: idClient,
  nomclient: nomclient.trim() || 'CLIENT CASH',
  telephone: telephone.trim() || null,
  caissier,
  devise: devisePrincipale,
  total: totalPrincipal,
  montanttotal: totalPrincipal,

  idEmploye,
  id_employe: idEmploye,
  idemploye: idEmploye,

  idSession,
  idsession: idSession,
  id_session: idSession,
  id_session_caisse: idSession,
  idsessioncaisse: idSession,

  idEntreprise: Number(localStorage.getItem('ZAIRE_ID_ENTREPRISE') || 1),
  idMagasin: Number(localStorage.getItem('ZAIRE_ID_MAGASIN') || 1),
  idDepot: Number(localStorage.getItem('ZAIRE_ID_DEPOT') || 0),
  idPoste: Number(localStorage.getItem('ZAIRE_ID_POSTE') || 1),

  details: articles,
  produits: articles,
  lignes: articles,

  paiements: [
    ...(montantRecuUSD > 0
      ? [{
          modepaiement: modePaiement,
          modePaiement,
          montant: montantRecuUSD,
          devise: 'USD',
          reference: `WEB-POS-USD-${Date.now()}`,
        }]
      : []),

    ...(montantRecuCDF > 0
      ? [{
          modepaiement: modePaiement,
          modePaiement,
          montant: montantRecuCDF,
          devise: 'CDF',
          reference: `WEB-POS-CDF-${Date.now()}`,
        }]
      : []),

    ...(montantRecuEUR > 0
      ? [{
          modepaiement: modePaiement,
          modePaiement,
          montant: montantRecuEUR,
          devise: 'EUR',
          reference: `WEB-POS-EUR-${Date.now()}`,
        }]
      : []),
  ],
};

console.log('PAYLOAD VENTE', payload);

const res = await fetch(`${API}/ventes`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});

      const data = await lireApi(res);

      if (!res.ok) {
        alert(
          `Erreur API ${res.status} : ${
            typeof data === 'string' ? data : JSON.stringify(data)
          }`,
        );
        refocusScan();
        return;
      }

      const idVente = Number(
        data?.id_vente ??
          data?.idVente ??
          data?.vente?.id_vente ??
          data?.vente?.idVente ??
          0,
      );

      if (idVente > 0) {
        router.push(`/dashboard/ventes/detail?id=${idVente}`);
      } else {
        router.push('/dashboard/ventes');
      }
    } catch (error) {
      console.error(error);
      alert('Erreur réseau : impossible de contacter l’API.');
      refocusScan();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="sticky top-0 z-20 border-b bg-white px-3 py-2 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-base font-black text-emerald-800">
              MESSIE MATALA POS
            </div>
            <div className="text-[11px] font-semibold text-slate-500">
              Nouvelle vente · Scanner · Panier · Paiement
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.push('/dashboard/session-caisse')}
            className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-black text-white"
          >
            Session
          </button>
        </div>

        <div className="mt-2 rounded-lg bg-red-50 px-3 py-1 text-xs font-black text-red-700">
          Caissier : {caissier}
        </div>
      </header>

      <section className="p-3">
        <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_120px]">
          <input
            ref={scanRef}
            value={scan}
            onFocus={() => {
              autoScanRef.current = true;
            }}
            onChange={(e) => setScan(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return;

              e.preventDefault();

              const valeur = e.currentTarget.value.trim();
              const now = Date.now();

              if (!valeur && lignes.length > 0 && now - lastEnterRef.current < 700) {
                finaliserVente();
                return;
              }

              lastEnterRef.current = now;
              ajouterProduit(valeur);
            }}
            className="rounded-xl border-2 border-slate-400 bg-white px-4 py-3 text-base font-black outline-none focus:border-blue-600"
            placeholder="Scanner code-barres, référence ou nom du produit..."
            autoComplete="off"
            spellCheck={false}
          />

          <button
            type="button"
            onClick={() => ajouterProduit()}
            className="rounded-xl bg-blue-600 px-4 py-3 font-black text-white"
          >
            Ajouter
          </button>
        </div>

        <section className="mb-3 rounded-2xl border bg-white p-3 shadow-sm">
          <div className="mb-2 text-xs font-black uppercase text-slate-500">
            Informations client et paiement
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <input
              list="liste-clients"
              value={nomclient}
              onFocus={pauseScan}
              onBlur={reprendreScan}
              onChange={(e) => choisirClient(e.target.value)}
              className="rounded-xl border px-3 py-2 text-sm font-bold"
              placeholder="Client cash ou nom du client"
            />

            <datalist id="liste-clients">
              {clients.map((c) => (
                <option key={c.id_clients} value={c.nom ?? ''}>
                  {c.telephone ?? ''}
                </option>
              ))}
            </datalist>

            <input
              value={telephone}
              onFocus={pauseScan}
              onBlur={reprendreScan}
              onChange={(e) => setTelephone(e.target.value)}
              className="rounded-xl border px-3 py-2 text-sm font-bold"
              placeholder="Téléphone client"
            />

            <select
              value={modePaiement}
              onFocus={pauseScan}
              onBlur={reprendreScan}
              onChange={(e) => setModePaiement(e.target.value)}
              className="rounded-xl border px-3 py-2 text-sm font-black"
            >
              <option value="CASH">ESPÈCES</option>
              <option value="MOBILE MONEY">MOBILE MONEY</option>
              <option value="CARTE">CARTE</option>
              <option value="CREDIT">CRÉDIT</option>
            </select>
          </div>
        </section>

        <section className="mb-3 grid grid-cols-3 gap-2">
          <TotalCard label="USD" value={totaux.USD} devise="USD" />
          <TotalCard label="CDF" value={totaux.CDF} devise="CDF" />
          <TotalCard label="EUR" value={totaux.EUR} devise="EUR" />
        </section>

        <section className="mb-3 rounded-2xl border bg-white p-3 shadow-sm">
  <div className="mb-2 text-xs font-black uppercase text-slate-500">
    Totaux et montants reçus par devise
  </div>

  <div className="grid gap-2 md:grid-cols-3">
    <DevisePaiementCard
      devise="USD"
      total={totaux.USD}
      recu={recuUSD}
      setRecu={setRecuUSD}
      monnaie={monnaieUSD}
      formatMontant={formatMontant}
      pauseScan={pauseScan}
      reprendreScan={reprendreScan}
    />

    <DevisePaiementCard
      devise="CDF"
      total={totaux.CDF}
      recu={recuCDF}
      setRecu={setRecuCDF}
      monnaie={monnaieCDF}
      formatMontant={formatMontant}
      pauseScan={pauseScan}
      reprendreScan={reprendreScan}
    />

    <DevisePaiementCard
      devise="EUR"
      total={totaux.EUR}
      recu={recuEUR}
      setRecu={setRecuEUR}
      monnaie={monnaieEUR}
      formatMontant={formatMontant}
      pauseScan={pauseScan}
      reprendreScan={reprendreScan}
    />
  </div>
</section>

        <section className="hidden overflow-hidden rounded-2xl border bg-white shadow-sm md:block">
          <div className="overflow-auto">
            <table className="w-full min-w-[950px] border-collapse text-sm">
              <thead className="bg-slate-900 text-white">
                <tr>
                  <th className="border p-3">Référence</th>
                  <th className="border p-3">Désignation</th>
                  <th className="border p-3">Qté</th>
                  <th className="border p-3">P.U bloqué</th>
                  <th className="border p-3">Remise</th>
                  <th className="border p-3">Taille</th>
                  <th className="border p-3">Couleur</th>
                  <th className="border p-3">Devise</th>
                  <th className="border p-3">Total</th>
                  <th className="border p-3">Action</th>
                </tr>
              </thead>

              <tbody>
                {lignes.map((l, i) => {
                  const key = cleLigne(l, i);

                  return (
                    <tr key={key} className="text-center font-semibold">
                      <td className="border p-2">{l.refproduit}</td>
                      <td className="border p-2 text-left">{l.nomproduit}</td>

                      <td className="border p-2">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={qteDrafts[key] ?? String(l.quantite)}
                          onFocus={(e) => {
                            pauseScan();
                            setQteDrafts((old) => ({ ...old, [key]: String(l.quantite) }));
                            e.currentTarget.select();
                          }}
                          onChange={(e) => {
                            const v = e.target.value.replace(/[^\d.,]/g, '');
                            setQteDrafts((old) => ({ ...old, [key]: v }));
                            modifierQte(i, v);
                          }}
                          onBlur={() => {
                            validerQte(i);
                            setQteDrafts((old) => {
                              const copy = { ...old };
                              delete copy[key];
                              return copy;
                            });
                            reprendreScan();
                          }}
                          className="w-20 rounded border px-2 py-1 text-center font-black"
                          placeholder="Qté"
                        />
                      </td>

                      <td className="border p-2">
                        <input
                          type="text"
                          value={`${formatMontant(l.prixunitaire, l.devise)}`}
                          readOnly
                          tabIndex={-1}
                          className="w-28 rounded border bg-slate-100 px-2 py-1 text-right font-black text-slate-700"
                          title="Prix unitaire bloqué"
                        />
                      </td>

                      <td className="border p-2">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={remiseDrafts[key] ?? String(l.remise)}
                          onFocus={(e) => {
                            pauseScan();
                            setRemiseDrafts((old) => ({ ...old, [key]: String(l.remise) }));
                            e.currentTarget.select();
                          }}
                          onChange={(e) => {
                            const v = e.target.value.replace(/[^\d.,]/g, '');
                            setRemiseDrafts((old) => ({ ...old, [key]: v }));
                            modifierRemise(i, v);
                          }}
                          onBlur={() => {
                            setRemiseDrafts((old) => {
                              const copy = { ...old };
                              delete copy[key];
                              return copy;
                            });
                            reprendreScan();
                          }}
                          className="w-24 rounded border px-2 py-1 text-right font-black"
                          placeholder="Remise"
                        />
                      </td>

                      <td className="border p-2">{l.taille}</td>
                      <td className="border p-2">{l.couleur}</td>
                      <td className="border p-2">{normaliserDevise(l.devise)}</td>

                      <td className="border p-2 font-black">
                        {formatMontant(totalLigne(l), l.devise)}
                      </td>

                      <td className="border p-2">
                        <button
                          type="button"
                          onClick={() => supprimerArticle(i)}
                          className="rounded bg-red-600 px-3 py-1 font-bold text-white"
                        >
                          X
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {lignes.length === 0 && (
                  <tr>
                    <td colSpan={10} className="h-64 text-center font-bold text-slate-400">
                      Aucun article ajouté. Scanne ou recherche un produit pour commencer.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-2 md:hidden">
          {lignes.length === 0 && (
            <div className="rounded-2xl border bg-white p-8 text-center font-bold text-slate-400">
              Aucun article ajouté. Scanne ou recherche un produit.
            </div>
          )}

          {lignes.map((l, i) => {
            const key = cleLigne(l, i);

            return (
              <div key={key} className="rounded-2xl border bg-white p-3 shadow-sm">
                <div className="flex justify-between gap-2">
                  <div>
                    <div className="font-black">{l.nomproduit}</div>
                    <div className="text-xs font-bold text-slate-500">
                      {l.refproduit} · {l.taille} · {l.couleur}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => supprimerArticle(i)}
                    className="h-8 rounded-lg bg-red-600 px-3 text-sm font-black text-white"
                  >
                    X
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  <div>
                    <label className="mb-1 block text-[10px] font-black text-slate-500">
                      Quantité
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={qteDrafts[key] ?? String(l.quantite)}
                      onFocus={(e) => {
                        pauseScan();
                        setQteDrafts((old) => ({ ...old, [key]: String(l.quantite) }));
                        e.currentTarget.select();
                      }}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^\d.,]/g, '');
                        setQteDrafts((old) => ({ ...old, [key]: v }));
                        modifierQte(i, v);
                      }}
                      onBlur={() => {
                        validerQte(i);
                        setQteDrafts((old) => {
                          const copy = { ...old };
                          delete copy[key];
                          return copy;
                        });
                        reprendreScan();
                      }}
                      className="w-full rounded-lg border px-2 py-2 text-center font-black"
                      placeholder="Qté"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[10px] font-black text-slate-500">
                      P.U bloqué
                    </label>
                    <input
                      type="text"
                      value={formatMontant(l.prixunitaire, l.devise)}
                      readOnly
                      tabIndex={-1}
                      className="w-full rounded-lg border bg-slate-100 px-2 py-2 text-right font-black text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[10px] font-black text-slate-500">
                      Remise
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={remiseDrafts[key] ?? String(l.remise)}
                      onFocus={(e) => {
                        pauseScan();
                        setRemiseDrafts((old) => ({ ...old, [key]: String(l.remise) }));
                        e.currentTarget.select();
                      }}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^\d.,]/g, '');
                        setRemiseDrafts((old) => ({ ...old, [key]: v }));
                        modifierRemise(i, v);
                      }}
                      onBlur={() => {
                        setRemiseDrafts((old) => {
                          const copy = { ...old };
                          delete copy[key];
                          return copy;
                        });
                        reprendreScan();
                      }}
                      className="w-full rounded-lg border px-2 py-2 text-right font-black"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="mt-2 text-right text-lg font-black text-emerald-800">
                  {formatMontant(totalLigne(l), l.devise)} {normaliserDevise(l.devise)}
                </div>
              </div>
            );
          })}
        </section>

        <section className="sticky bottom-0 mt-3 grid grid-cols-2 gap-2 rounded-t-2xl bg-slate-100 pb-2 pt-2 sm:grid-cols-3 lg:grid-cols-6">
          <button
            type="button"
            onClick={retraitFidelite}
            className="rounded-xl bg-slate-300 py-3 text-sm font-black text-slate-700"
          >
            Retrait Fidélité
          </button>

          <button
            type="button"
            onClick={finaliserVente}
            disabled={loading || lignes.length === 0}
            className={`rounded-xl py-3 text-sm font-black text-white ${
              loading || lignes.length === 0
                ? 'bg-green-300'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {loading ? 'Validation...' : 'Finaliser'}
          </button>

          <button
            type="button"
            onClick={annulerVente}
            className="rounded-xl bg-red-600 py-3 text-sm font-black text-white"
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={imprimerTicket}
            className="rounded-xl bg-slate-300 py-3 text-sm font-black text-slate-700"
          >
            Imprimer Ticket
          </button>

          <button
            type="button"
            onClick={supprimerDernierArticle}
            className="rounded-xl bg-slate-300 py-3 text-sm font-black text-slate-700"
          >
            Supprimer article
          </button>

          <button
            type="button"
            onClick={() => router.push('/dashboard/ventes')}
            className="rounded-xl bg-slate-800 py-3 text-sm font-black text-white"
          >
            Retour
          </button>
        </section>
      </section>
    </main>
  );
}

function DevisePaiementCard({
  devise,
  total,
  recu,
  setRecu,
  monnaie,
  formatMontant,
  pauseScan,
  reprendreScan,
}: {
  devise: string;
  total: number;
  recu: string;
  setRecu: (v: string) => void;
  monnaie: number;
  formatMontant: (montant: number, devise?: string) => string;
  pauseScan: () => void;
  reprendreScan: () => void;
}) {
  return (
    <div className="rounded-2xl border bg-slate-50 p-3">
      <div className="mb-2 text-center text-sm font-black text-slate-700">
        Paiement {devise}
      </div>

      <label className="mb-1 block text-xs font-black text-slate-500">
        Montant principal {devise}
      </label>
      <input
        value={`${formatMontant(total, devise)} ${devise}`}
        readOnly
        className="mb-2 w-full rounded-xl border bg-white px-3 py-2 text-right font-black"
      />

      <label className="mb-1 block text-xs font-black text-slate-500">
        Montant reçu {devise}
      </label>
      <input
        value={recu}
        onFocus={pauseScan}
        onBlur={reprendreScan}
        onChange={(e) => setRecu(e.target.value.replace(/[^\d.,]/g, ''))}
        className="mb-2 w-full rounded-xl border bg-white px-3 py-2 text-right font-black"
        placeholder={`Reçu en ${devise}`}
        inputMode="decimal"
      />

      <label className="mb-1 block text-xs font-black text-slate-500">
        Monnaie {devise}
      </label>
      <input
        value={`${formatMontant(monnaie, devise)} ${devise}`}
        readOnly
        className="w-full rounded-xl border bg-emerald-50 px-3 py-2 text-right font-black text-emerald-800"
      />
    </div>
  );
}

function TotalCard({
  label,
  value,
  devise,
}: {
  label: string;
  value: number;
  devise: string;
}) {
  const d = devise.toUpperCase();
  const decimals = d === 'CDF' ? 0 : 2;

  const n = Number(value || 0).toLocaleString('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <div className="rounded-2xl border bg-white p-3 text-center shadow-sm">
      <div className="text-sm font-black text-slate-500">{label}</div>
      <div className="text-xl font-black text-emerald-800">{n}</div>
    </div>
  );
}