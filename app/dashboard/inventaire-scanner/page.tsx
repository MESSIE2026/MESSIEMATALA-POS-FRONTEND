'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Barcode,
  Bell,
  Camera,
  CheckCircle,
  Download,
  PackageCheck,
  Play,
  RefreshCw,
  ScanLine,
  Search,
  ShieldCheck,
  Warehouse,
  X,
} from 'lucide-react';

import { getParametresDocuments } from '@/app/services/documents.service';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://messiematala-pos-backend-production.up.railway.app';

type Depot = {
  idDepot: number;
  nomDepot: string;
  idMagasin?: number;
  idEntreprise?: number;
};

type SessionInventaire = {
  idSession: number;
  idDepot: number;
  nomDepot: string;
  creePar: string;
  dateDebut: string;
  dateFin?: string | null;
  statut: string;
  nbLignes?: number;
};

type LigneInventaire = {
  idLigne: number;
  idSession: number;
  idProduit: number;
  idVariante?: number | null;
  reference: string;
  produit: string;
  variante: string;
  stockSystemeDepot: number;
  qteComptee: number;
  ecart: number;
  actionStock: 'ENTREE' | 'SORTIE' | 'OK' | string;
  dernierScan?: string | null;
};

type ParamsDocs = {
  nom_entreprise?: string;
  slogan?: string;
  couleur_principale?: string;
};

export default function Page() {
  const [depots, setDepots] = useState<Depot[]>([]);
  const [sessions, setSessions] = useState<SessionInventaire[]>([]);
  const [sessionActive, setSessionActive] = useState<SessionInventaire | null>(
    null,
  );
  const [lignes, setLignes] = useState<LigneInventaire[]>([]);

  const [idDepot, setIdDepot] = useState('');
  const [code, setCode] = useState('');
  const [qte, setQte] = useState('1');
  const [search, setSearch] = useState('');

  const [idEntreprise, setIdEntreprise] = useState('1');
  const [idMagasin, setIdMagasin] = useState('0');
  const [utilisateur, setUtilisateur] = useState('Utilisateur POS');

  const [loading, setLoading] = useState(false);
  const [loadingScan, setLoadingScan] = useState(false);
  const [message, setMessage] = useState('');
  const [erreur, setErreur] = useState('');
  const [paramsDocs, setParamsDocs] = useState<ParamsDocs>({});

  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanLoopRef = useRef<number | null>(null);

  const lignesFiltrees = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return lignes;

    return lignes.filter((l) =>
      [
        l.reference,
        l.produit,
        l.variante,
        l.actionStock,
        String(l.ecart),
        String(l.qteComptee),
      ]
        .join(' ')
        .toLowerCase()
        .includes(s),
    );
  }, [lignes, search]);

  const stats = useMemo(() => {
    const total = lignes.length;
    const ok = lignes.filter((x) => Number(x.ecart) === 0).length;
    const entrees = lignes.filter((x) => x.actionStock === 'ENTREE').length;
    const sorties = lignes.filter((x) => x.actionStock === 'SORTIE').length;

    return { total, ok, entrees, sorties };
  }, [lignes]);

  useEffect(() => {
    setIdEntreprise(localStorage.getItem('ZAIRE_ID_ENTREPRISE') || '1');
    setIdMagasin(localStorage.getItem('ZAIRE_ID_MAGASIN') || '0');
    setUtilisateur(
      localStorage.getItem('ZAIRE_NOM_UTILISATEUR') ||
        localStorage.getItem('ZAIRE_USER_NAME') ||
        'Utilisateur POS',
    );
  }, []);

  useEffect(() => {
    chargerInitial();
  }, [idEntreprise, idMagasin]);

  useEffect(() => {
    if (idDepot) {
      chargerSessionOuverte(Number(idDepot));
      chargerSessions(Number(idDepot));
    }
  }, [idDepot]);

  useEffect(() => {
    if (sessionActive?.idSession) {
      chargerLignes(sessionActive.idSession);
    } else {
      setLignes([]);
    }
  }, [sessionActive?.idSession]);

 async function parseJsonResponse(response: Response) {
  const text = await response.text();

  if (!text || !text.trim()) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    console.error('JSON invalide :', text);
    return null;
  }
}

async function getJson(url: string) {
  const response = await fetch(url, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return parseJsonResponse(response);
}

async function postJson(url: string, body: any) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return parseJsonResponse(response);
}

  function notify(msg: string) {
    setMessage(msg);
    setErreur('');
    setTimeout(() => setMessage(''), 3500);
  }

  function fail(e: any, msg: string) {
    console.error(e);
    setErreur(msg);
    setMessage('');
  }

  async function chargerInitial() {
  setLoading(true);

  try {
    let depotsData = await getJson(
      `${API_URL}/inventaire-scanner/depots?idEntreprise=${Number(idEntreprise || 1)}&idMagasin=${Number(idMagasin || 0)}`,
    );

    if (!Array.isArray(depotsData) || depotsData.length === 0) {
      depotsData = await getJson(
        `${API_URL}/inventaire-scanner/depots?idEntreprise=${Number(idEntreprise || 1)}&idMagasin=0`,
      );
    }

    const depotsValides = Array.isArray(depotsData)
      ? depotsData.filter((d) => Number(d.idDepot || 0) > 0)
      : [];

    setDepots(depotsValides);

    if (depotsValides.length > 0) {
      const depotActuel = Number(idDepot || 0);
      const existe = depotsValides.some((d) => Number(d.idDepot) === depotActuel);

      if (!existe) {
        setIdDepot(String(depotsValides[0].idDepot));
      }
    } else {
      setIdDepot('');
      setErreur('Aucun dépôt valide trouvé pour cette entreprise.');
    }

    try {
      const p = await getParametresDocuments(Number(idEntreprise || 1));
      setParamsDocs(p || {});
    } catch {
      setParamsDocs({});
    }
  } catch (e) {
    fail(e, 'Erreur chargement dépôts inventaire.');
  } finally {
    setLoading(false);
  }
}

  async function chargerSessions(dep = Number(idDepot || 0)) {
    if (!dep) return;

    try {
      const data = await getJson(
        `${API_URL}/inventaire-scanner/sessions?idDepot=${dep}&statut=TOUS`,
      );
      setSessions(Array.isArray(data) ? data : []);
    } catch (e) {
      fail(e, 'Erreur chargement sessions inventaire.');
    }
  }

  async function chargerSessionOuverte(dep = Number(idDepot || 0)) {
    if (!dep) return;

    try {
      const data = await getJson(
        `${API_URL}/inventaire-scanner/sessions/ouverture/${dep}`,
      );

      setSessionActive(data || null);
    } catch (e) {
      fail(e, 'Erreur chargement session ouverte.');
    }
  }

  async function chargerLignes(idSession: number) {
    try {
      const data = await getJson(
        `${API_URL}/inventaire-scanner/sessions/${idSession}/lignes`,
      );
      setLignes(Array.isArray(data) ? data : []);
    } catch (e) {
      fail(e, 'Erreur chargement lignes inventaire.');
    }
  }

  async function creerSession() {
  const depot = Number(idDepot || 0);

  if (depot <= 0) {
    setErreur('Sélectionne un dépôt valide avant de créer une session.');
    return;
  }

  const depotExiste = depots.some((d) => Number(d.idDepot) === depot);

  if (!depotExiste) {
    setErreur('Le dépôt sélectionné est invalide. Clique sur Actualiser.');
    return;
  }

  setLoading(true);

  try {
    const payload = {
      idDepot: depot,
      creePar: utilisateur || 'Utilisateur POS',
      idEntreprise: Number(idEntreprise || 1),
      idMagasin: Number(idMagasin || 0),
    };

    console.log('PAYLOAD SESSION INVENTAIRE', payload);

    const s = await postJson(`${API_URL}/inventaire-scanner/sessions`, payload);

    if (!s?.idSession) {
      throw new Error('Session créée mais réponse invalide.');
    }

    setSessionActive(s);
    await chargerSessions(depot);
    notify(`Session inventaire #${s.idSession} créée.`);
    setTimeout(() => document.getElementById('scan-input')?.focus(), 150);
  } catch (e) {
    fail(e, 'Erreur création session inventaire.');
  } finally {
    setLoading(false);
  }
}

  async function appliquerScan(codeForce?: string) {
    const codeFinal = String(codeForce || code || '').trim();

    if (!sessionActive?.idSession) {
      alert('Crée ou récupère une session ouverte avant de scanner.');
      return;
    }

    if (!codeFinal) {
      alert('Scanne ou saisis un code-barres.');
      return;
    }

    if (Number(qte) <= 0) {
      alert('La quantité doit être supérieure à 0.');
      return;
    }

    setLoadingScan(true);

    try {
      const data = await postJson(`${API_URL}/inventaire-scanner/scan`, {
        idSession: sessionActive.idSession,
        code: codeFinal,
        qteCompteeBase: Number(qte),
        utilisateur,
        idEntreprise: Number(idEntreprise),
        idMagasin: Number(idMagasin),
      });

      setCode('');
      setQte('1');
      await chargerLignes(sessionActive.idSession);
      notify(data?.message || 'Scan appliqué.');
      setTimeout(() => document.getElementById('scan-input')?.focus(), 120);
    } catch (e) {
      fail(e, 'Produit introuvable, code dupliqué ou erreur scan.');
    } finally {
      setLoadingScan(false);
    }
  }

  async function validerInventaire() {
    if (!sessionActive?.idSession) {
      alert('Aucune session ouverte.');
      return;
    }

    const ok = window.confirm(
      `Valider la session #${sessionActive.idSession} et appliquer les écarts au stock ?`,
    );

    if (!ok) return;

    setLoading(true);

    try {
      const data = await postJson(`${API_URL}/inventaire-scanner/valider`, {
        idSession: sessionActive.idSession,
        utilisateur,
        idEntreprise: Number(idEntreprise),
        idMagasin: Number(idMagasin),
      });

      notify(data?.message || 'Inventaire validé.');
      setSessionActive(null);
      setLignes([]);
      await chargerSessions(Number(idDepot));
    } catch (e) {
      fail(e, 'Erreur validation inventaire.');
    } finally {
      setLoading(false);
    }
  }

  function ouvrirPdf() {
    if (!sessionActive?.idSession) {
      alert('Aucune session à exporter.');
      return;
    }

    window.open(
      `${API_URL}/inventaire-scanner/sessions/${sessionActive.idSession}/pdf`,
      '_blank',
    );
  }

  async function ouvrirCamera() {
    setCameraError('');
    setCameraOpen(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      demarrerDetectionCamera();
    } catch (e) {
      console.error(e);
      setCameraError(
        "Impossible d'ouvrir la caméra. Utilise le champ manuel ou l'application scanner du téléphone.",
      );
    }
  }

  function fermerCamera() {
    if (scanLoopRef.current) {
      window.cancelAnimationFrame(scanLoopRef.current);
      scanLoopRef.current = null;
    }

    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOpen(false);
  }

  async function demarrerDetectionCamera() {
    const BarcodeDetectorClass = (window as any).BarcodeDetector;

    if (!BarcodeDetectorClass) {
      setCameraError(
        "Scanner caméra non supporté par ce navigateur. Utilise l'application scanner du téléphone puis colle le code ici.",
      );
      return;
    }

    const detector = new BarcodeDetectorClass({
      formats: [
        'ean_13',
        'ean_8',
        'code_128',
        'code_39',
        'qr_code',
        'upc_a',
        'upc_e',
      ],
    });

    const loop = async () => {
      try {
        if (videoRef.current && cameraOpen) {
          const codes = await detector.detect(videoRef.current);

          if (codes?.length > 0) {
            const value = String(codes[0].rawValue || '').trim();

            if (value) {
              fermerCamera();
              setCode(value);
              await appliquerScan(value);
              return;
            }
          }
        }
      } catch {}

      scanLoopRef.current = window.requestAnimationFrame(loop);
    };

    scanLoopRef.current = window.requestAnimationFrame(loop);
  }

  function handleScanKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      appliquerScan();
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-3 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-4">
        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-black text-slate-900">
                <ScanLine className="text-green-700" />
                Inventaire Scanner
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {paramsDocs.nom_entreprise || 'ZAIRE MODE'} · Scan PDA,
                téléphone, terminal POS ou saisie manuelle.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => chargerInitial()}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                <RefreshCw size={16} />
                Actualiser
              </button>

              <button
                onClick={ouvrirPdf}
                disabled={!sessionActive}
                className="inline-flex items-center gap-2 rounded-xl bg-red-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                <Download size={16} />
                PDF
              </button>
            </div>
          </div>
        </section>

        {message && (
          <div className="rounded-2xl bg-green-50 p-4 text-sm font-bold text-green-800 ring-1 ring-green-200">
            {message}
          </div>
        )}

        {erreur && (
          <div className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-800 ring-1 ring-red-200">
            {erreur}
          </div>
        )}

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Card title="Lignes scannées" value={stats.total} icon={<Barcode />} />
          <Card title="Correctes" value={stats.ok} icon={<CheckCircle />} />
          <Card title="Entrées" value={stats.entrees} icon={<PackageCheck />} />
          <Card title="Sorties" value={stats.sorties} icon={<ShieldCheck />} />
        </section>

        <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="grid gap-3 lg:grid-cols-4">
            <div>
              <label className="text-xs font-black text-slate-600">Dépôt</label>
              <select
                value={idDepot}
                onChange={(e) => setIdDepot(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">Sélectionner dépôt</option>
                {depots.map((d) => (
                  <option key={d.idDepot} value={d.idDepot}>
                    {d.nomDepot}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-black text-slate-600">
                Session active
              </label>
              <div className="mt-1 rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold">
                {sessionActive
                  ? `#${sessionActive.idSession} · ${sessionActive.statut}`
                  : 'Aucune session ouverte'}
              </div>
            </div>

            <button
  onClick={creerSession}
  disabled={loading || Number(idDepot || 0) <= 0}
  className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-green-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
>
  <Play size={16} />
  Nouvelle session
</button>

            <button
  onClick={() => Number(idDepot || 0) > 0 && chargerSessionOuverte(Number(idDepot))}
  disabled={loading || Number(idDepot || 0) <= 0}
  className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
>
  <Warehouse size={16} />
  Récupérer session
</button>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="grid gap-3 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <label className="text-xs font-black text-slate-600">
                Code-barres / QR
              </label>
              <input
                id="scan-input"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={handleScanKeyDown}
                placeholder="Scanner ou coller le code ici..."
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                autoComplete="off"
              />
            </div>

            <div>
              <label className="text-xs font-black text-slate-600">
                Quantité comptée
              </label>
              <input
                type="number"
                min={1}
                value={qte}
                onChange={(e) => setQte(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <button
              onClick={() => appliquerScan()}
              disabled={loadingScan || !sessionActive}
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-green-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              <Barcode size={16} />
              {loadingScan ? 'Scan...' : 'Appliquer'}
            </button>

            <button
              onClick={ouvrirCamera}
              disabled={!sessionActive}
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              <Camera size={16} />
              Caméra téléphone
            </button>
          </div>

          <p className="mt-3 flex items-center gap-2 rounded-xl bg-blue-50 p-3 text-xs font-semibold text-blue-800 ring-1 ring-blue-100">
            <Bell size={14} />
            Si la caméra ne marche pas, ouvre l’application scanner du téléphone,
            copie le code, colle-le dans le champ, puis appuie sur Entrée.
          </p>
        </section>

        {cameraOpen && (
          <section className="rounded-3xl bg-slate-950 p-4 text-white shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-black">Scanner caméra</h2>
              <button
                onClick={fermerCamera}
                className="inline-flex items-center gap-2 rounded-xl bg-red-700 px-3 py-2 text-sm font-bold"
              >
                <X size={16} />
                Fermer
              </button>
            </div>

            <video
              ref={videoRef}
              className="h-[320px] w-full rounded-2xl bg-black object-cover"
              muted
              playsInline
            />

            {cameraError && (
              <p className="mt-3 rounded-xl bg-amber-100 p-3 text-sm font-bold text-amber-900">
                {cameraError}
              </p>
            )}
          </section>
        )}

        <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-700">
                Lignes inventaire
              </h2>
              <p className="text-xs text-slate-500">
                Écarts calculés entre stock système et quantité comptée.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-3 text-slate-400"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Recherche produit, référence..."
                  className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-sm sm:w-72"
                />
              </div>

              <button
                onClick={() =>
                  sessionActive?.idSession && chargerLignes(sessionActive.idSession)
                }
                disabled={!sessionActive}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                <RefreshCw size={16} />
                Rafraîchir
              </button>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <Th>Réf.</Th>
                  <Th>Produit</Th>
                  <Th>Variante</Th>
                  <Th>Stock</Th>
                  <Th>Comptée</Th>
                  <Th>Écart</Th>
                  <Th>Action</Th>
                  <Th>Dernier scan</Th>
                </tr>
              </thead>

              <tbody>
                {lignesFiltrees.map((l) => (
                  <tr key={l.idLigne} className="border-t">
                    <Td>{l.reference || '-'}</Td>
                    <Td>{l.produit || '-'}</Td>
                    <Td>{l.variante || '-'}</Td>
                    <Td>{Number(l.stockSystemeDepot || 0).toLocaleString('fr-FR')}</Td>
                    <Td>{Number(l.qteComptee || 0).toLocaleString('fr-FR')}</Td>
                    <Td>
                      <BadgeEcart value={Number(l.ecart || 0)} />
                    </Td>
                    <Td>
                      <BadgeAction action={l.actionStock} />
                    </Td>
                    <Td>
                      {l.dernierScan
                        ? new Date(l.dernierScan).toLocaleString('fr-FR')
                        : '-'}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!loading && lignesFiltrees.length === 0 && (
              <div className="p-8 text-center text-sm text-slate-500">
                Aucune ligne scannée.
              </div>
            )}
          </div>
        </section>

        <section className="flex flex-col gap-2 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-black text-slate-800">
              Validation inventaire
            </h2>
            <p className="text-xs text-slate-500">
              Cette action applique les écarts au stock et écrit les mouvements
              dans l’audit.
            </p>
          </div>

          <button
            onClick={validerInventaire}
            disabled={loading || !sessionActive || lignes.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-700 px-5 py-2 text-sm font-black text-white disabled:opacity-50"
          >
            <ShieldCheck size={16} />
            Valider inventaire
          </button>
        </section>

        <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-3 text-sm font-black text-slate-700">
            Dernières sessions
          </h2>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <Th>Session</Th>
                  <Th>Dépôt</Th>
                  <Th>Créée par</Th>
                  <Th>Date début</Th>
                  <Th>Statut</Th>
                  <Th>Lignes</Th>
                </tr>
              </thead>

              <tbody>
                {sessions.map((s) => (
                  <tr
                    key={s.idSession}
                    className="cursor-pointer border-t hover:bg-slate-50"
                    onClick={() => setSessionActive(s)}
                  >
                    <Td>#{s.idSession}</Td>
                    <Td>{s.nomDepot || '-'}</Td>
                    <Td>{s.creePar || '-'}</Td>
                    <Td>
                      {s.dateDebut
                        ? new Date(s.dateDebut).toLocaleString('fr-FR')
                        : '-'}
                    </Td>
                    <Td>{s.statut || '-'}</Td>
                    <Td>{s.nbLignes || 0}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function Card({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-slate-500">{title}</p>
        <div className="text-green-700">{icon}</div>
      </div>
      <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="whitespace-nowrap px-4 py-3 font-black">{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="whitespace-nowrap px-4 py-3">{children}</td>;
}

function BadgeEcart({ value }: { value: number }) {
  const cls =
    value === 0
      ? 'bg-green-100 text-green-700'
      : value > 0
        ? 'bg-blue-100 text-blue-700'
        : 'bg-red-100 text-red-700';

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-black ${cls}`}>
      {value.toLocaleString('fr-FR')}
    </span>
  );
}

function BadgeAction({ action }: { action: string }) {
  const cls =
    action === 'OK'
      ? 'bg-green-100 text-green-700'
      : action === 'ENTREE'
        ? 'bg-blue-100 text-blue-700'
        : 'bg-red-100 text-red-700';

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-black ${cls}`}>
      {action || '-'}
    </span>
  );
}