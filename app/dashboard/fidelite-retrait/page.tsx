'use client';

import { useEffect, useRef, useState } from 'react';
import {
  BadgeDollarSign,
  Camera,
  CheckCircle2,
  CreditCard,
  FileText,
  History,
  Loader2,
  QrCode,
  RefreshCw,
  Search,
  ShieldCheck,
  User,
} from 'lucide-react';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://messiematala-pos-backend-production.up.railway.app';

type ClientCarte = {
  id_clients: number;
  nom: string;
  prenom: string;
  telephone: string;
  codecarte: string;
  categorieclient: string;
  cashbacksolde: number;
  points: number;
  statut: string;
};

type Mouvement = {
  id: number;
  type: string;
  montant: number;
  cashbackdelta: number;
  soldeapres: number;
  refvente?: number;
  note?: string;
  utilisateur?: string;
  createdat: string;
};

export default function Page() {
  const [codeCarte, setCodeCarte] = useState('');
  const [client, setClient] = useState<ClientCarte | null>(null);
  const [historique, setHistorique] = useState<Mouvement[]>([]);
  const [montant, setMontant] = useState('');
  const [message, setMessage] = useState('');
  const [loadingScan, setLoadingScan] = useState(false);
  const [loadingRetrait, setLoadingRetrait] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const scannerRef = useRef<any>(null);
  const [idOtp, setIdOtp] = useState<number | null>(null);
const [codeOtp, setCodeOtp] = useState('');
const [otpEnvoye, setOtpEnvoye] = useState(false);
const [loadingOtp, setLoadingOtp] = useState(false);

  const inputClass =
    'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-green-700 focus:ring-4 focus:ring-green-100';

  async function getJson(url: string) {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async function postJson(url: string, body: any) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async function scannerCarte(code?: string) {
    const finalCode = String(code || codeCarte || '').trim();

    if (!finalCode) {
      setMessage('Veuillez scanner ou saisir une carte.');
      return;
    }

    try {
      setLoadingScan(true);
      setMessage('');

      const data = await getJson(
        `${API_URL}/fidelite-retrait/scan/${encodeURIComponent(finalCode)}`,
      );

      setClient(data.client);
      setCodeCarte(data.client?.codecarte || finalCode);
      await chargerHistorique(data.client.id_clients);

      setMessage('Client chargé avec succès.');
    } catch (e: any) {
      setClient(null);
      setHistorique([]);
      setMessage('Carte ou client introuvable.');
    } finally {
      setLoadingScan(false);
    }
  }

  async function demanderConfirmationClient() {
  if (!client) {
    setMessage('Veuillez d’abord scanner une carte.');
    return;
  }

  const m = Number(montant || 0);

  if (m <= 0) {
    setMessage('Montant invalide.');
    return;
  }

  
  try {
    setLoadingOtp(true);
    setMessage('');

    const data = await postJson(`${API_URL}/fidelite-retrait/demander-otp`, {
      idClient: client.id_clients,
      montant: m,
      devise: 'USD',
      codeCarte,
      utilisateur: 'CAISSIER',
    });

    setIdOtp(data.otp.id);
    setOtpEnvoye(true);
    setMessage(data.message || 'Code OTP envoyé au client.');
  } catch (e: any) {
    setMessage('Impossible d’envoyer le code OTP.');
  } finally {
    setLoadingOtp(false);
  }
}

async function validerRetraitOtp() {
  if (!client || !idOtp) {
    setMessage('Aucune demande OTP en attente.');
    return;
  }

  if (!codeOtp.trim()) {
    setMessage('Veuillez saisir le code OTP.');
    return;
  }

  try {
    setLoadingRetrait(true);
    setMessage('');

    const data = await postJson(`${API_URL}/fidelite-retrait/valider-otp`, {
      idOtp,
      codeOtp,
      idClient: client.id_clients,
      montant: Number(montant || 0),
      devise: 'USD',
      codeCarte,
      utilisateur: 'CAISSIER',
    });

    setMessage(data.message || 'Retrait validé.');
    setMontant('');
    setCodeOtp('');
    setIdOtp(null);
    setOtpEnvoye(false);

    await scannerCarte(codeCarte);

    if (data?.mouvement?.id) {
      window.open(`${API_URL}/fidelite-retrait/recu/${data.mouvement.id}/pdf`, '_blank');
    }
  } catch (e: any) {
    setMessage('Code OTP incorrect, expiré ou retrait refusé.');
  } finally {
    setLoadingRetrait(false);
  }
}

  async function chargerHistorique(idClient: number) {
    const data = await getJson(`${API_URL}/fidelite-retrait/historique/${idClient}`);
    setHistorique(Array.isArray(data) ? data : []);
  }

  async function ouvrirCamera() {
    setCameraOpen(true);

    const { Html5Qrcode } = await import('html5-qrcode');

    setTimeout(async () => {
      if (scannerRef.current) return;

      const scanner = new Html5Qrcode('reader-fidelite');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText: string) => {
          await fermerCamera();
          setCodeCarte(decodedText);
          await scannerCarte(decodedText);
        },
        () => {},
      );
    }, 300);
  }

  async function fermerCamera() {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
        scannerRef.current = null;
      }
    } catch {}

    setCameraOpen(false);
  }

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl bg-gradient-to-br from-green-800 to-slate-900 p-6 text-white shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold">
                <ShieldCheck size={16} />
                Fidélité client
              </div>
              <h1 className="text-2xl font-black md:text-4xl">
                Retrait carte fidélité
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-green-50">
                Scanner une carte, vérifier le solde cashback, appliquer un retrait et générer un reçu PDF.
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 p-4 text-sm font-bold">
              Solde actuel : {client ? Number(client.cashbacksolde || 0).toFixed(2) : '0.00'} USD
            </div>
          </div>
        </section>

        {message && (
          <div className="rounded-2xl bg-white p-4 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-200">
            {message}
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-2xl bg-green-100 p-3 text-green-800">
                  <QrCode size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    Scanner ou saisir la carte
                  </h2>
                  <p className="text-sm text-slate-500">
                    Compatible caméra téléphone, QR code, code-barres ou scanner USB.
                  </p>
                </div>
              </div>

              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Code carte / téléphone / ID client
              </label>

              <div className="flex flex-col gap-3 md:flex-row">
                <input
                  className={inputClass}
                  value={codeCarte}
                  placeholder="Ex: FID-000001 ou téléphone"
                  onChange={(e) => setCodeCarte(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') scannerCarte();
                  }}
                />

                <button
                  onClick={() => scannerCarte()}
                  disabled={loadingScan}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-700 px-5 py-3 text-sm font-black text-white hover:bg-green-800 disabled:opacity-60"
                >
                  {loadingScan ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
                  Charger
                </button>

                <button
                  onClick={cameraOpen ? fermerCamera : ouvrirCamera}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-700 px-5 py-3 text-sm font-black text-white hover:bg-blue-800"
                >
                  <Camera size={18} />
                  {cameraOpen ? 'Fermer' : 'Caméra'}
                </button>
              </div>

              {cameraOpen && (
                <div className="mt-5 rounded-3xl bg-slate-900 p-4">
                  <div id="reader-fidelite" className="overflow-hidden rounded-2xl bg-white" />
                </div>
              )}
            </div>

            {client && (
              <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <div className="mb-5 flex items-center gap-3">
                  <div className="rounded-2xl bg-blue-100 p-3 text-blue-800">
                    <User size={22} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900">
                      Client chargé
                    </h2>
                    <p className="text-sm text-slate-500">
                      Vérifiez les informations avant retrait.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <Info title="Client" value={`${client.nom || ''} ${client.prenom || ''}`} />
                  <Info title="Téléphone" value={client.telephone || '-'} />
                  <Info title="Catégorie" value={client.categorieclient || 'OCCASIONNEL'} />
                  <Info title="Carte" value={client.codecarte || codeCarte} />
                  <Info title="Statut" value={client.statut || 'BRONZE'} />
                  <Info title="Cashback" value={`${Number(client.cashbacksolde || 0).toFixed(2)} USD`} />
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                      Montant à utiliser
                    </label>
                    <input
                      className={inputClass}
                      type="number"
                      value={montant}
                      placeholder="Ex: 5"
                      onChange={(e) => setMontant(e.target.value)}
                    />
                  </div>

                  <div className="flex items-end">
                    <button
  onClick={demanderConfirmationClient}
  disabled={loadingOtp || loadingRetrait || otpEnvoye}
  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-600 px-6 py-3 text-sm font-black text-white hover:bg-amber-700 disabled:opacity-60"
>
  {loadingOtp ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
  Demander confirmation client
</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {otpEnvoye && (
  <div className="mt-5 rounded-3xl bg-amber-50 p-5 ring-1 ring-amber-200">
    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-amber-700">
      Code OTP client
    </label>

    <input
      className={inputClass}
      value={codeOtp}
      placeholder="Ex: 123456"
      onChange={(e) => setCodeOtp(e.target.value)}
    />

    <button
      onClick={validerRetraitOtp}
      disabled={loadingRetrait}
      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-green-700 px-6 py-3 text-sm font-black text-white hover:bg-green-800 disabled:opacity-60"
    >
      {loadingRetrait ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
      Valider le retrait
    </button>
  </div>
)}

          <div className="space-y-6">
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
                  <History size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    Historique
                  </h2>
                  <p className="text-sm text-slate-500">
                    Derniers mouvements fidélité.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {historique.length === 0 ? (
                  <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                    Aucun mouvement.
                  </p>
                ) : (
                  historique.map((h) => (
                    <div key={h.id} className="rounded-2xl bg-slate-50 p-4 text-sm ring-1 ring-slate-100">
                      <p className="font-black text-slate-900">
                        {h.type} | {Number(h.montant || 0).toFixed(2)} USD
                      </p>
                      <p className="text-slate-600">
                        Solde après : {Number(h.soldeapres || 0).toFixed(2)} USD
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(h.createdat).toLocaleString('fr-FR')}
                      </p>
                      <button
                        onClick={() => window.open(`${API_URL}/fidelite-retrait/recu/${h.id}/pdf`, '_blank')}
                        className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-700 ring-1 ring-slate-200"
                      >
                        <FileText size={14} />
                        PDF
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-center gap-3 text-green-800">
                <CheckCircle2 size={22} />
                <p className="font-black">Intégration vente</p>
              </div>
              <p className="mt-2 text-sm text-slate-500">
                Depuis le module Vente, appelle POST /fidelite-retrait/retrait avec refVente pour soustraire le cashback du montant net.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Info({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-1 text-lg font-black text-slate-900">{value}</p>
    </div>
  );
}