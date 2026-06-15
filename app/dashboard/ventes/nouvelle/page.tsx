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

const MODES_PAIEMENT = ['CASH', 'MOBILE MONEY', 'CARTE', 'CREDIT CLIENT', 'MIXTE'];

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
  const [nomclient, setNomclient] = useState('CLIENT CASH');
  const [telephone, setTelephone] = useState('');
  const [caissier, setCaissier] = useState('NON CONNECTÉ');
  const [modePaiement, setModePaiement] = useState('CASH');
  const [recu, setRecu] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    verifierEmployeConnecte();
    chargerProduits();
    chargerClients();

    setTimeout(() => {
      scanRef.current?.focus();
      scanRef.current?.select();
    }, 300);
  }, []);

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
      if (texte === 'CLIENT CASH') setTelephone('');
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

    if (d === 'FC' || d === 'CDF' || d === 'FRANC' || d === 'FRANCS') return 'CDF';
    if (d === '$' || d === 'DOLLAR' || d === 'DOLLARS' || d === 'USD') return 'USD';
    if (d === 'EURO' || d === 'EUROS' || d === 'EUR') return 'EUR';

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

      return id === q || ref === q || code === q || ref.includes(q) || code.includes(q) || nom.includes(q);
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

    if (lastScanRef.current.code === codeNettoye && now - lastScanRef.current.time < 500) {
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
          x.idProduit === produit.id_produit ? { ...x, quantite: x.quantite + 1 } : x,
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

  function modifierQte(index: number, qte: number) {
    setLignes((old) =>
      old.map((l, i) =>
        i === index ? { ...l, quantite: Number.isFinite(qte) && qte > 0 ? qte : 1 } : l,
      ),
    );
  }

  function modifierPrix(index: number, prix: number) {
    setLignes((old) =>
      old.map((l, i) =>
        i === index ? { ...l, prixunitaire: Number.isFinite(prix) && prix >= 0 ? prix : 0 } : l,
      ),
    );
  }

  function modifierRemise(index: number, remise: number) {
    setLignes((old) =>
      old.map((l, i) =>
        i === index ? { ...l, remise: Number.isFinite(remise) && remise >= 0 ? remise : 0 } : l,
      ),
    );
  }

  function modifierTva(index: number, tva: number) {
    setLignes((old) =>
      old.map((l, i) =>
        i === index ? { ...l, tva: Number.isFinite(tva) && tva >= 0 ? tva : 0 } : l,
      ),
    );
  }

  function supprimerArticle(index: number) {
    setLignes((old) => old.filter((_, i) => i !== index));
    refocusScan();
  }

  function annulerVenteEnCours() {
    if (lignes.length > 0 && !confirm('Annuler toute la vente en cours ?')) return;

    setLignes([]);
    setScan('');
    setRecu('');
    setNomclient('CLIENT CASH');
    setTelephone('');
    setIdClient(null);
    setModePaiement('CASH');
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

  const remiseTotale = useMemo(() => {
    return lignes.reduce((s, x) => s + Number(x.remise || 0), 0);
  }, [lignes]);

  const tvaTotale = useMemo(() => {
    return lignes.reduce((s, x) => s + Number(x.tva || 0), 0);
  }, [lignes]);

  const devisePrincipale = totaux.USD > 0 ? 'USD' : totaux.CDF > 0 ? 'CDF' : 'EUR';

  const totalPrincipal =
    devisePrincipale === 'USD' ? totaux.USD : devisePrincipale === 'CDF' ? totaux.CDF : totaux.EUR;

  const montantRecu = recu.trim() === '' ? totalPrincipal : nombreDepuisPrix(recu);
  const monnaie = Math.max(0, montantRecu - totalPrincipal);

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
        remise: remiseTotale,
        tva: tvaTotale,

        idEmploye,
        id_employe: idEmploye,
        idemploye: idEmploye,

        idSession,
        idsession: idSession,
        id_session: idSession,
        id_session_caisse: idSession,
        idsessioncaisse: idSession,

        details: articles,
        produits: articles,
        lignes: articles,

        paiements: [
          {
            modepaiement: modePaiement,
            modePaiement,
            montant: montantRecu,
            devise: devisePrincipale,
            reference: `WEB-POS-${Date.now()}`,
          },
        ],
      };

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

      alert('Vente enregistrée avec succès.');

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
      <header className="border-b bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-wrap justify-between gap-3">
          <div>
            <div className="text-lg font-black text-emerald-800">MESSIE MATALA POS</div>
            <div className="text-xs font-semibold text-slate-500">
              Vente POS · Web · Mobile · Windows · Mac · Linux · Terminal POS
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => router.push('/dashboard/ventes')}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-black text-white hover:bg-slate-700"
            >
              Liste ventes
            </button>

            <button
              type="button"
              onClick={() => router.push('/dashboard/session-caisse')}
              className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-black text-slate-950 hover:bg-amber-300"
            >
              Session caisse
            </button>

            <div className="rounded-xl bg-red-50 px-4 py-2 text-sm font-black text-red-700">
              {caissier}
            </div>
          </div>
        </div>
      </header>

      <section className="grid gap-3 p-3 xl:grid-cols-[1fr_340px]">
        <section className="space-y-3">
          <div className="rounded-2xl border bg-white p-3 shadow-sm">
            <div className="grid gap-3 lg:grid-cols-[1fr_200px_180px]">
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
                className="rounded-xl border-2 border-slate-400 bg-white px-4 py-4 text-lg font-black outline-none focus:border-emerald-700"
                placeholder="Scanner code-barres, référence ou nom produit..."
                autoComplete="off"
                spellCheck={false}
              />

              <button
                type="button"
                onClick={() => ajouterProduit()}
                className="rounded-xl bg-blue-600 px-4 py-3 font-black text-white hover:bg-blue-700"
              >
                Ajouter
              </button>

              <button
                type="button"
                onClick={annulerVenteEnCours}
                className="rounded-xl bg-red-600 px-4 py-3 font-black text-white hover:bg-red-700"
              >
                Annuler vente
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            <div className="overflow-auto">
              <table className="w-full min-w-[1100px] border-collapse text-sm">
                <thead className="bg-slate-900 text-white">
                  <tr>
                    <th className="border border-slate-700 p-3 text-left">Référence</th>
                    <th className="border border-slate-700 p-3 text-left">Désignation</th>
                    <th className="border border-slate-700 p-3 text-center">Qté</th>
                    <th className="border border-slate-700 p-3 text-right">PU</th>
                    <th className="border border-slate-700 p-3 text-right">Remise</th>
                    <th className="border border-slate-700 p-3 text-right">TVA</th>
                    <th className="border border-slate-700 p-3 text-center">Taille</th>
                    <th className="border border-slate-700 p-3 text-center">Couleur</th>
                    <th className="border border-slate-700 p-3 text-center">Devise</th>
                    <th className="border border-slate-700 p-3 text-right">Total</th>
                    <th className="border border-slate-700 p-3 text-center">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {lignes.map((l, i) => (
                    <tr key={`${l.idProduit}-${i}`} className="font-semibold hover:bg-emerald-50">
                      <td className="border p-2">{l.refproduit}</td>
                      <td className="border p-2 font-bold">{l.nomproduit}</td>

                      <td className="border p-2 text-center">
                        <input
                          type="number"
                          value={l.quantite}
                          onFocus={pauseScan}
                          onBlur={reprendreScan}
                          onChange={(e) => modifierQte(i, Number(e.target.value))}
                          className="w-20 rounded border px-2 py-1 text-center font-black"
                        />
                      </td>

                      <td className="border p-2 text-right">
                        <input
                          type="number"
                          value={l.prixunitaire}
                          onFocus={pauseScan}
                          onBlur={reprendreScan}
                          onChange={(e) => modifierPrix(i, Number(e.target.value))}
                          className="w-28 rounded border px-2 py-1 text-right font-black"
                        />
                      </td>

                      <td className="border p-2 text-right">
                        <input
                          type="number"
                          value={l.remise}
                          onFocus={pauseScan}
                          onBlur={reprendreScan}
                          onChange={(e) => modifierRemise(i, Number(e.target.value))}
                          className="w-24 rounded border px-2 py-1 text-right font-black"
                        />
                      </td>

                      <td className="border p-2 text-right">
                        <input
                          type="number"
                          value={l.tva}
                          onFocus={pauseScan}
                          onBlur={reprendreScan}
                          onChange={(e) => modifierTva(i, Number(e.target.value))}
                          className="w-24 rounded border px-2 py-1 text-right font-black"
                        />
                      </td>

                      <td className="border p-2 text-center">{l.taille}</td>
                      <td className="border p-2 text-center">{l.couleur}</td>
                      <td className="border p-2 text-center font-black">{normaliserDevise(l.devise)}</td>
                      <td className="border p-2 text-right font-black">
                        {formatMontant(totalLigne(l), l.devise)}
                      </td>

                      <td className="border p-2 text-center">
                        <button
                          type="button"
                          onClick={() => supprimerArticle(i)}
                          className="rounded bg-red-600 px-3 py-1 font-bold text-white hover:bg-red-700"
                        >
                          X
                        </button>
                      </td>
                    </tr>
                  ))}

                  {lignes.length === 0 && (
                    <tr>
                      <td colSpan={11} className="h-80 text-center text-lg font-bold text-slate-400">
                        Aucun article ajouté. Scanner un produit pour commencer.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <aside className="space-y-3">
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <h2 className="text-lg font-black text-slate-900">Client</h2>

            <div className="mt-3 space-y-3">
              <input
                list="clients-list"
                value={nomclient}
                onFocus={pauseScan}
                onBlur={reprendreScan}
                onChange={(e) => choisirClient(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-3 font-bold outline-none focus:border-emerald-700"
                placeholder="Client"
              />

              <datalist id="clients-list">
                {clients.map((c) => (
                  <option key={c.id_clients} value={c.nom || ''} />
                ))}
              </datalist>

              <input
                value={telephone}
                onFocus={pauseScan}
                onBlur={reprendreScan}
                onChange={(e) => setTelephone(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-3 font-bold outline-none focus:border-emerald-700"
                placeholder="Téléphone"
              />
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <h2 className="text-lg font-black text-slate-900">Paiement</h2>

            <div className="mt-3 space-y-3">
              <select
                value={modePaiement}
                onFocus={pauseScan}
                onBlur={reprendreScan}
                onChange={(e) => setModePaiement(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-3 font-black outline-none focus:border-emerald-700"
              >
                {MODES_PAIEMENT.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>

              <input
                value={recu}
                onFocus={pauseScan}
                onBlur={reprendreScan}
                onChange={(e) => setRecu(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-3 text-right text-xl font-black outline-none focus:border-emerald-700"
                placeholder="Montant reçu"
              />
            </div>
          </div>

          <div className="rounded-2xl border bg-slate-950 p-4 text-white shadow-sm">
            <h2 className="text-lg font-black">TOTAL À PAYER</h2>

            <div className="mt-4 space-y-3">
              <TotalLine label="USD" value={`${formatMontant(totaux.USD, 'USD')} USD`} active={totaux.USD > 0} />
              <TotalLine label="CDF" value={`${formatMontant(totaux.CDF, 'CDF')} CDF`} active={totaux.CDF > 0} />
              <TotalLine label="EUR" value={`${formatMontant(totaux.EUR, 'EUR')} EUR`} active={totaux.EUR > 0} />
            </div>

            <div className="mt-4 rounded-xl bg-white/10 p-3">
              <div className="flex justify-between text-sm font-bold">
                <span>Devise principale</span>
                <span>{devisePrincipale}</span>
              </div>

              <div className="mt-2 flex justify-between text-sm font-bold">
                <span>Montant reçu</span>
                <span>{formatMontant(montantRecu, devisePrincipale)} {devisePrincipale}</span>
              </div>

              <div className="mt-2 flex justify-between text-sm font-black text-emerald-300">
                <span>Monnaie</span>
                <span>{formatMontant(monnaie, devisePrincipale)} {devisePrincipale}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={finaliserVente}
            disabled={loading || lignes.length === 0}
            className={`w-full rounded-2xl py-5 text-xl font-black text-white ${
              loading || lignes.length === 0
                ? 'cursor-not-allowed bg-green-300'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {loading ? 'Validation...' : 'FINALISER'}
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setLignes((old) => old.slice(0, -1))}
              className="rounded-xl bg-slate-700 py-3 font-black text-white hover:bg-slate-800"
            >
              Retirer dernier
            </button>

            <button
              type="button"
              onClick={refocusScan}
              className="rounded-xl bg-blue-600 py-3 font-black text-white hover:bg-blue-700"
            >
              Focus scan
            </button>
          </div>
        </aside>
      </section>
    </main>
  );
}

function TotalLine({
  label,
  value,
  active,
}: {
  label: string;
  value: string;
  active: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-3 ${
        active ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/50'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-black">{label}</span>
        <span className="text-xl font-black">{value}</span>
      </div>
    </div>
  );
}