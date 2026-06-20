'use client';

import { useEffect, useMemo, useState } from 'react';

const API_URL = 'https://messiematala-pos-backend-production.up.railway.app';

type Entreprise = {
  identreprise: number;
  nom: string;
};

type Magasin = {
  idmagasin: number;
  identreprise: number;
  nom: string;
  ville: string;
  adresse: string;
};

type Depot = {
  id_depot: number;
  nomdepot: string;
  ville: string;
  adresse: string;
  idmagasin: number;
  identreprise: number;
};

type ParametresDocuments = {
  idEntreprise: number;
  nomEntreprise: string;
  slogan: string;

  logoUrl: string;
  filigraneUrl: string;
  cachetUrl: string;
  signatureDirectionUrl: string;

  idNat: string;
  rccm: string;
  numeroImpot: string;
  numeroTva: string;

  telephone: string;
  telephone2: string;
  email: string;
  siteWeb: string;
  adresse: string;
  ville: string;
  pays: string;

  enteteLigne1: string;
  enteteLigne2: string;
  piedLigne1: string;
  piedLigne2: string;
  mentionLegale: string;

  couleurPrincipale: string;
  couleurSecondaire: string;
  couleurTexte: string;

  facebook: string;
  instagram: string;
  linkedin: string;
  youtube: string;
  tiktok: string;
  whatsapp: string;

  banque: string;
  numeroCompte: string;
  swift: string;
  iban: string;
  mobileMoney: string;

  afficherLogo: boolean;
  afficherFiligrane: boolean;
};

export default function ConfigPostePosPage() {
  const [machineName, setMachineName] = useState('');
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [magasins, setMagasins] = useState<Magasin[]>([]);
  const [depots, setDepots] = useState<Depot[]>([]);

  const [idEntreprise, setIdEntreprise] = useState('');
  const [idMagasin, setIdMagasin] = useState('');
  const [idDepot, setIdDepot] = useState('');
  const [ville, setVille] = useState('');
  const [adresse, setAdresse] = useState('');
  const [nomPOS, setNomPOS] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const magasinSelectionne = useMemo(() => {
    return magasins.find((m) => String(m.idmagasin) === String(idMagasin));
  }, [magasins, idMagasin]);

  const [showManager, setShowManager] = useState(false);

  const [ongletManager, setOngletManager] = useState<
  'identite' | 'admin' | 'contacts' | 'documents' | 'banque'
>('identite');

const [paramsDocs, setParamsDocs] = useState<ParametresDocuments>({
  idEntreprise: 0,
  nomEntreprise: '',
  slogan: '',

  logoUrl: '',
  filigraneUrl: '',
  cachetUrl: '',
  signatureDirectionUrl: '',

  idNat: '',
  rccm: '',
  numeroImpot: '',
  numeroTva: '',

  telephone: '',
  telephone2: '',
  email: '',
  siteWeb: '',
  adresse: '',
  ville: '',
  pays: 'RDC',

  enteteLigne1: '',
  enteteLigne2: '',
  piedLigne1: '',
  piedLigne2: '',
  mentionLegale: '',

  couleurPrincipale: '#1E40AF',
  couleurSecondaire: '#F3F4F6',
  couleurTexte: '#111827',

  facebook: '',
  instagram: '',
  linkedin: '',
  youtube: '',
  tiktok: '',
  whatsapp: '',

  banque: '',
  numeroCompte: '',
  swift: '',
  iban: '',
  mobileMoney: '',

  afficherLogo: true,
  afficherFiligrane: false,
});

  useEffect(() => {
    const machine =
      typeof window !== 'undefined'
        ? window.navigator.platform || 'POSTE-WEB'
        : 'POSTE-WEB';

    setMachineName(machine);
    chargerInitial(machine);
  }, []);

  async function safeJson(res: Response, fallback: any = null) {
  const text = await res.text();

  if (!text || !text.trim()) {
    return fallback;
  }

  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

  async function chargerInitial(machine: string) {
    try {
      setLoading(true);

      const [resEntreprises, resDepots, resPoste] = await Promise.all([
        fetch(`${API_URL}/config-poste-pos/entreprises`, { cache: 'no-store' }),
        fetch(`${API_URL}/config-poste-pos/depots`, { cache: 'no-store' }),
        fetch(
          `${API_URL}/config-poste-pos/poste?machineName=${encodeURIComponent(
            machine,
          )}`,
          { cache: 'no-store' },
        ),
      ]);

      const dataEntreprises = await safeJson(resEntreprises, []);
const dataDepots = await safeJson(resDepots, []);
const poste = await safeJson(resPoste, null);

      setEntreprises(Array.isArray(dataEntreprises) ? dataEntreprises : []);
      setDepots(Array.isArray(dataDepots) ? dataDepots : []);

      if (poste) {
        setIdEntreprise(String(poste.identreprise ?? ''));
        setIdMagasin(String(poste.idmagasin ?? ''));
        setIdDepot(String(poste.iddepot ?? ''));
        setNomPOS(poste.nompos ?? '');

        if (poste.identreprise) {
          await chargerMagasins(
            String(poste.identreprise),
            String(poste.idmagasin),
          );
        }
      }
    } catch (error) {
      console.error(error);
      setMessage('Erreur chargement configuration POS.');
    } finally {
      setLoading(false);
    }
  }

  async function chargerMagasins(id: string, selectedMagasin?: string) {
    if (!id) {
      setMagasins([]);
      setIdMagasin('');
      setVille('');
      setAdresse('');
      return;
    }

    const res = await fetch(
      `${API_URL}/config-poste-pos/magasins?idEntreprise=${id}`,
      { cache: 'no-store' },
    );

    const data = await res.json();
    const liste = Array.isArray(data) ? data : [];

    setMagasins(liste);

    if (selectedMagasin) {
      const mag = liste.find(
        (m: Magasin) => String(m.idmagasin) === String(selectedMagasin),
      );

      if (mag) {
        setIdMagasin(String(mag.idmagasin));
        setVille(mag.ville ?? '');
        setAdresse(mag.adresse ?? '');

        const depot = depots.find(
          (d) => String(d.idmagasin) === String(mag.idmagasin),
        );
        setIdDepot(depot ? String(depot.id_depot) : '');
      }
    }
  }

  async function onEntrepriseChange(value: string) {
  setIdEntreprise(value);
  setIdMagasin('');
  setIdDepot('');
  setVille('');
  setAdresse('');

  if (!value) {
    setMagasins([]);
    return;
  }

  await chargerMagasins(value);
}

  function onMagasinChange(value: string) {
  setIdMagasin(value);

  const mag = magasins.find(
    (m) => String(m.idmagasin) === String(value),
  );

  setVille(mag?.ville ?? '');
  setAdresse(mag?.adresse ?? '');

  const depot = depots.find(
    (d) => String(d.idmagasin) === String(value),
  );

  setIdDepot(depot ? String(depot.id_depot) : '');
}

 async function ajouterEntreprise() {
  const nom = window.prompt("Nom de la nouvelle entreprise :");
  if (!nom || !nom.trim()) return;

  setMessage('');

  const res = await fetch(`${API_URL}/config-poste-pos/entreprises`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nom: nom.trim() }),
  });

  const data = await safeJson(res, null);

  if (!res.ok || !data?.identreprise) {
    setMessage(data?.message || "Entreprise non enregistrée.");
    return;
  }

  const resListe = await fetch(`${API_URL}/config-poste-pos/entreprises`, {
    cache: 'no-store',
  });

  const liste = await safeJson(resListe, []);
  setEntreprises(Array.isArray(liste) ? liste : []);

  setIdEntreprise(String(data.identreprise));
  setMagasins([]);
  setIdMagasin('');
  setIdDepot('');
  setVille('');
  setAdresse('');

  setMessage(`Entreprise "${data.nom}" enregistrée et sélectionnée.`);
}

  async function ajouterMagasin() {
  if (!idEntreprise) {
    setMessage("Choisis d'abord une entreprise.");
    return;
  }

  const nom = window.prompt('Nom du nouveau magasin :');
  if (!nom || !nom.trim()) return;

  const villeMagasin = window.prompt('Ville du magasin :') ?? '';
  const adresseMagasin = window.prompt('Adresse du magasin :') ?? '';

  const res = await fetch(`${API_URL}/config-poste-pos/magasins`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      idEntreprise: Number(idEntreprise),
      nom: nom.trim(),
      ville: villeMagasin.trim(),
      adresse: adresseMagasin.trim(),
    }),
  });

 const text = await res.text();

let data: any = null;
try {
  data = text ? JSON.parse(text) : null;
} catch {
  data = null;
}

if (!res.ok || !data?.idmagasin) {
  console.error('Erreur ajout magasin RAW:', text);
  console.error('Erreur ajout magasin JSON:', data);

  setMessage(
    data?.message ||
    text ||
    "Magasin non enregistré."
  );
  return;
}

  await chargerMagasins(String(idEntreprise), String(data.idmagasin));

  setIdMagasin(String(data.idmagasin));
  setIdDepot(String(data.iddepot ?? ''));
  setVille(data.ville ?? '');
  setAdresse(data.adresse ?? '');

  setMessage(`Magasin "${data.nom}" enregistré et sélectionné.`);
}
  async function enregistrer() {
  setMessage('');

  if (!idEntreprise) {
    setMessage('Choisis ou crée une entreprise.');
    return;
  }

  if (!idMagasin) {
    setMessage('Choisis ou crée un magasin.');
    return;
  }

  if (!nomPOS.trim()) {
    setMessage('Nom POS obligatoire.');
    return;
  }

  try {
    setLoading(true);

    const res = await fetch(`${API_URL}/config-poste-pos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        machineName,
        idEntreprise: Number(idEntreprise),
        idMagasin: Number(idMagasin),
        idDepot: idDepot ? Number(idDepot) : undefined,
        nomPOS: nomPOS.trim(),
        ville,
        adresse,
      }),
    });

    const data = await safeJson(res, null);

    if (!res.ok) {
      throw new Error(data?.message || 'Erreur enregistrement POS.');
    }

    if (data?.idDepot) {
      setIdDepot(String(data.idDepot));
    }

    setMessage(data?.message || 'Configuration POS enregistrée avec succès.');
  } catch (error: any) {
    setMessage(error.message || 'Erreur enregistrement POS.');
  } finally {
    setLoading(false);
  }
}

async function ouvrirManager() {
  if (!idEntreprise) {
    setMessage("Choisis d'abord une entreprise.");
    return;
  }

  setShowManager(true);
  setMessage('');

  const entreprise = entreprises.find(
    (e) => String(e.identreprise) === String(idEntreprise),
  );

  const res = await fetch(
    `${API_URL}/config-poste-pos/parametres-documents?idEntreprise=${idEntreprise}`,
    { cache: 'no-store' },
  );

  const data = await safeJson(res, null);

  if (data) {
    setParamsDocs({
      idEntreprise: Number(idEntreprise),
      nomEntreprise: data.nom_entreprise ?? entreprise?.nom ?? '',
      slogan: data.slogan ?? '',
      logoUrl: data.logo_url ?? '',
      filigraneUrl: data.filigrane_url ?? '',
      idNat: data.id_nat ?? '',
      rccm: data.rccm ?? '',
      numeroImpot: data.numero_impot ?? '',
      numeroTva: data.numero_tva ?? '',
      telephone: data.telephone ?? '',
      telephone2: data.telephone2 ?? '',
      email: data.email ?? '',
      siteWeb: data.site_web ?? '',
      adresse: data.adresse ?? adresse ?? '',
      ville: data.ville ?? ville ?? '',
      pays: data.pays ?? 'RDC',
      enteteLigne1: data.entete_ligne1 ?? '',
      enteteLigne2: data.entete_ligne2 ?? '',
      piedLigne1: data.pied_ligne1 ?? '',
      piedLigne2: data.pied_ligne2 ?? '',
      mentionLegale: data.mention_legale ?? '',
      afficherLogo: Boolean(data.afficher_logo ?? true),
      afficherFiligrane: Boolean(data.afficher_filigrane ?? false),
      cachetUrl: data.cachet_url ?? '',
signatureDirectionUrl: data.signature_direction_url ?? '',

couleurPrincipale: data.couleur_principale ?? '#1E40AF',
couleurSecondaire: data.couleur_secondaire ?? '#F3F4F6',
couleurTexte: data.couleur_texte ?? '#111827',

facebook: data.facebook ?? '',
instagram: data.instagram ?? '',
linkedin: data.linkedin ?? '',
youtube: data.youtube ?? '',
tiktok: data.tiktok ?? '',
whatsapp: data.whatsapp ?? '',

banque: data.banque ?? '',
numeroCompte: data.numero_compte ?? '',
swift: data.swift ?? '',
iban: data.iban ?? '',
mobileMoney: data.mobile_money ?? '',
    });
  } else {
    setParamsDocs((prev) => ({
      ...prev,
      idEntreprise: Number(idEntreprise),
      nomEntreprise: entreprise?.nom ?? '',
      adresse,
      ville,
      pays: 'RDC',
    }));
  }
}

async function enregistrerParametresDocuments() {
  if (!idEntreprise) {
    setMessage("Choisis d'abord une entreprise.");
    return;
  }

  if (!paramsDocs.nomEntreprise.trim()) {
    setMessage("Nom entreprise obligatoire.");
    return;
  }

  setLoading(true);
  setMessage('');

  try {
    const res = await fetch(
      `${API_URL}/config-poste-pos/parametres-documents`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...paramsDocs,
          idEntreprise: Number(idEntreprise),
        }),
      },
    );

    const data = await safeJson(res, null);

    if (!res.ok) {
      throw new Error(data?.message || 'Paramètres non enregistrés.');
    }

    setMessage('Paramètres documents enregistrés avec succès.');
    setShowManager(false);
  } catch (error: any) {
    setMessage(error.message || 'Erreur enregistrement paramètres documents.');
  } finally {
    setLoading(false);
  }
}

async function uploadImageDocument(
  file: File,
  champ:
    | 'logoUrl'
    | 'filigraneUrl'
    | 'cachetUrl'
    | 'signatureDirectionUrl',
) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_URL}/config-poste-pos/upload-document-image`, {
    method: 'POST',
    body: formData,
  });

  const data = await safeJson(res, null);

  if (!res.ok || !data?.url) {
    setMessage(data?.message || 'Upload image échoué.');
    return;
  }

  setParamsDocs((prev) => ({
    ...prev,
    [champ]: data.url,
  }));

  setMessage('Image chargée avec succès.');
}
  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h1 className="text-2xl font-black text-slate-900">
            Configuration Poste POS
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Configurer l’entreprise, le magasin, le dépôt et le nom du poste caisse.
          </p>
        </div>

        <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          {message && (
            <div className="mb-5 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">
              {message}
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                MachineName
              </label>
              <input
                value={machineName}
                readOnly
                className="w-full rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 font-semibold text-slate-700 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Nom POS
              </label>
              <input
                value={nomPOS}
                onChange={(e) => setNomPOS(e.target.value)}
                placeholder="Ex: CAISSE 01"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-900 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Entreprise
              </label>
              <div className="flex gap-2">
                <select
  value={String(idEntreprise || '')}
  onChange={(e) => onEntrepriseChange(e.target.value)}
  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-900 outline-none focus:border-blue-500"
>
  <option value="">-- Choisir entreprise --</option>

  {entreprises.map((e) => (
    <option
      key={String(e.identreprise)}
      value={String(e.identreprise)}
    >
      {e.nom}
    </option>
  ))}
</select>

                <button
                  type="button"
                  onClick={ajouterEntreprise}
                  disabled={loading}
                  className="rounded-xl bg-slate-900 px-4 py-3 font-black text-white hover:bg-slate-800 disabled:opacity-50"
                  title="Nouvelle entreprise"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Magasin
              </label>
              <div className="flex gap-2">
                <select
  value={String(idMagasin || '')}
  onChange={(e) => onMagasinChange(e.target.value)}
  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-900 outline-none focus:border-blue-500"
>
  <option value="">-- Choisir magasin --</option>

  {magasins.map((m) => (
    <option
      key={m.idmagasin}
      value={String(m.idmagasin)}
    >
      {m.nom}
      {m.ville ? ` - ${m.ville}` : ''}
    </option>
  ))}
</select>

                <button
                  type="button"
                  onClick={ajouterMagasin}
                  disabled={loading}
                  className="rounded-xl bg-slate-900 px-4 py-3 font-black text-white hover:bg-slate-800 disabled:opacity-50"
                  title="Nouveau magasin"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Dépôt
              </label>
              <select
                value={idDepot}
                onChange={(e) => setIdDepot(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-900 outline-none focus:border-blue-500"
              >
                <option value="">-- Dépôt automatique ou choisir --</option>
                {depots.map((d) => (
                  <option key={d.id_depot} value={d.id_depot}>
                    {d.nomdepot}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Ville
              </label>
              <input
                value={ville}
                readOnly
                className="w-full rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 font-semibold text-slate-700 outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Adresse
              </label>
              <input
                value={adresse}
                readOnly
                className="w-full rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 font-semibold text-slate-700 outline-none"
              />
            </div>
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <button
              onClick={enregistrer}
              disabled={loading}
              className="rounded-xl bg-blue-600 px-6 py-3 font-black text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Traitement...' : 'Enregistrer'}
            </button>

            <button
  type="button"
  onClick={ouvrirManager}
  disabled={loading || !idEntreprise}
  className="rounded-xl bg-emerald-600 px-6 py-3 font-black text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
>
  Manager / Paramètres documents
</button>

            <button
              onClick={() => chargerInitial(machineName)}
              disabled={loading}
              className="rounded-xl bg-slate-900 px-6 py-3 font-black text-white shadow-sm hover:bg-slate-800 disabled:opacity-50"
            >
              Rafraîchir
            </button>
          </div>

          {magasinSelectionne && (
            <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              Magasin sélectionné :{' '}
              <span className="font-bold text-slate-900">
                {magasinSelectionne.nom}
              </span>
            </div>
          )}
        </div>
      </div>

      {showManager && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <div className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-3xl bg-white p-6 shadow-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">
            Manager - Identité documentaire
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Configuration globale utilisée dans les tickets, factures, devis, rapports et PDF.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowManager(false)}
          className="rounded-xl bg-slate-100 px-4 py-2 font-black text-slate-700 hover:bg-slate-200"
        >
          Fermer
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {[
          ['identite', 'Identité'],
          ['admin', 'Administration'],
          ['contacts', 'Contacts'],
          ['documents', 'Documents'],
          ['banque', 'Banque'],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setOngletManager(key as any)}
            className={`rounded-xl px-4 py-2 text-sm font-black ${
              ongletManager === key
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {ongletManager === 'identite' && (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {[
            ['nomEntreprise', 'Nom entreprise'],
            ['slogan', 'Slogan'],
            ['couleurPrincipale', 'Couleur principale'],
            ['couleurSecondaire', 'Couleur secondaire'],
            ['couleurTexte', 'Couleur texte'],
          ].map(([key, label]) => (
            <div key={key}>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                {label}
              </label>
              <input
                value={(paramsDocs as any)[key]}
                onChange={(e) =>
                  setParamsDocs((prev) => ({
                    ...prev,
                    [key]: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 font-semibold outline-none focus:border-emerald-500"
              />
            </div>
          ))}

          {[
            ['logoUrl', 'Logo entreprise'],
            ['filigraneUrl', 'Filigrane'],
            ['cachetUrl', 'Cachet électronique'],
            ['signatureDirectionUrl', 'Signature direction'],
          ].map(([key, label]) => (
            <div key={key} className="rounded-2xl bg-slate-50 p-4">
              <label className="mb-2 block text-sm font-bold text-slate-700">
                {label}
              </label>

              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadImageDocument(file, key as any);
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold"
              />

              {(paramsDocs as any)[key] && (
                <div className="mt-3 rounded-xl bg-white p-3">
                  <img
                    src={
                      String((paramsDocs as any)[key]).startsWith('http')
                        ? (paramsDocs as any)[key]
                        : `${API_URL}${(paramsDocs as any)[key]}`
                    }
                    alt={label}
                    className={`max-h-28 object-contain ${
                      key === 'filigraneUrl' ? 'opacity-40' : ''
                    }`}
                  />
                </div>
              )}
            </div>
          ))}

          <label className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 font-bold text-slate-700">
            <input
              type="checkbox"
              checked={paramsDocs.afficherLogo}
              onChange={(e) =>
                setParamsDocs((prev) => ({
                  ...prev,
                  afficherLogo: e.target.checked,
                }))
              }
            />
            Afficher le logo
          </label>

          <label className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 font-bold text-slate-700">
            <input
              type="checkbox"
              checked={paramsDocs.afficherFiligrane}
              onChange={(e) =>
                setParamsDocs((prev) => ({
                  ...prev,
                  afficherFiligrane: e.target.checked,
                }))
              }
            />
            Afficher le filigrane
          </label>
        </div>
      )}

      {ongletManager === 'admin' && (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {[
            ['idNat', 'ID.NAT.'],
            ['rccm', 'RCCM'],
            ['numeroImpot', 'Numéro impôt'],
            ['numeroTva', 'Numéro TVA'],
          ].map(([key, label]) => (
            <div key={key}>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                {label}
              </label>
              <input
                value={(paramsDocs as any)[key]}
                onChange={(e) =>
                  setParamsDocs((prev) => ({
                    ...prev,
                    [key]: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 font-semibold outline-none focus:border-emerald-500"
              />
            </div>
          ))}
        </div>
      )}

      {ongletManager === 'contacts' && (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {[
            ['telephone', 'Téléphone'],
            ['telephone2', 'Téléphone 2'],
            ['email', 'E-mail'],
            ['siteWeb', 'Site web'],
            ['ville', 'Ville'],
            ['pays', 'Pays'],
            ['adresse', 'Adresse'],
            ['facebook', 'Facebook'],
            ['instagram', 'Instagram'],
            ['linkedin', 'LinkedIn'],
            ['youtube', 'YouTube'],
            ['tiktok', 'TikTok'],
            ['whatsapp', 'WhatsApp'],
          ].map(([key, label]) => (
            <div key={key} className={key === 'adresse' ? 'md:col-span-2' : ''}>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                {label}
              </label>
              <input
                value={(paramsDocs as any)[key]}
                onChange={(e) =>
                  setParamsDocs((prev) => ({
                    ...prev,
                    [key]: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 font-semibold outline-none focus:border-emerald-500"
              />
            </div>
          ))}
        </div>
      )}

      {ongletManager === 'documents' && (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {[
            ['enteteLigne1', 'Entête ligne 1'],
            ['enteteLigne2', 'Entête ligne 2'],
            ['piedLigne1', 'Pied ligne 1'],
            ['piedLigne2', 'Pied ligne 2'],
            ['mentionLegale', 'Mention légale'],
          ].map(([key, label]) => (
            <div
              key={key}
              className={key === 'mentionLegale' ? 'md:col-span-2' : ''}
            >
              <label className="mb-2 block text-sm font-bold text-slate-700">
                {label}
              </label>
              <input
                value={(paramsDocs as any)[key]}
                onChange={(e) =>
                  setParamsDocs((prev) => ({
                    ...prev,
                    [key]: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 font-semibold outline-none focus:border-emerald-500"
              />
            </div>
          ))}

          <div className="md:col-span-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
            <h3 className="font-black text-slate-900">Aperçu rapide</h3>
            <div className="mt-4 rounded-xl bg-white p-5 shadow-sm">
              <div className="flex items-center gap-4 border-b pb-4">
                {paramsDocs.afficherLogo && paramsDocs.logoUrl && (
                  <img
                    src={
                      paramsDocs.logoUrl.startsWith('http')
                        ? paramsDocs.logoUrl
                        : `${API_URL}${paramsDocs.logoUrl}`
                    }
                    alt="Logo"
                    className="h-16 w-16 object-contain"
                  />
                )}

                <div>
                  <div className="text-xl font-black" style={{ color: paramsDocs.couleurPrincipale }}>
                    {paramsDocs.nomEntreprise || 'Nom entreprise'}
                  </div>
                  <div className="text-sm text-slate-500">
                    {paramsDocs.enteteLigne1 || paramsDocs.slogan}
                  </div>
                  <div className="text-xs text-slate-500">
                    RCCM: {paramsDocs.rccm || '-'} | ID.NAT: {paramsDocs.idNat || '-'}
                  </div>
                </div>
              </div>

              <div className="relative min-h-32 py-6 text-sm text-slate-600">
                {paramsDocs.afficherFiligrane && paramsDocs.filigraneUrl && (
                  <img
                    src={
                      paramsDocs.filigraneUrl.startsWith('http')
                        ? paramsDocs.filigraneUrl
                        : `${API_URL}${paramsDocs.filigraneUrl}`
                    }
                    alt="Filigrane"
                    className="absolute left-1/2 top-4 h-28 -translate-x-1/2 object-contain opacity-10"
                  />
                )}
                Exemple contenu document : facture, ticket, rapport ou reçu.
              </div>

              <div className="border-t pt-3 text-center text-xs text-slate-500">
                {paramsDocs.piedLigne1 || paramsDocs.adresse} <br />
                {paramsDocs.mentionLegale || 'Merci pour votre confiance.'}
              </div>
            </div>
          </div>
        </div>
      )}

      {ongletManager === 'banque' && (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {[
            ['banque', 'Banque'],
            ['numeroCompte', 'Numéro compte'],
            ['swift', 'SWIFT'],
            ['iban', 'IBAN'],
            ['mobileMoney', 'Mobile Money'],
          ].map(([key, label]) => (
            <div key={key}>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                {label}
              </label>
              <input
                value={(paramsDocs as any)[key]}
                onChange={(e) =>
                  setParamsDocs((prev) => ({
                    ...prev,
                    [key]: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 font-semibold outline-none focus:border-emerald-500"
              />
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={enregistrerParametresDocuments}
          disabled={loading}
          className="rounded-xl bg-emerald-600 px-6 py-3 font-black text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? 'Enregistrement...' : 'Enregistrer paramètres'}
        </button>

        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-xl bg-blue-600 px-6 py-3 font-black text-white hover:bg-blue-700"
        >
          Aperçu document
        </button>

        <button
          type="button"
          onClick={() => setShowManager(false)}
          className="rounded-xl bg-slate-900 px-6 py-3 font-black text-white hover:bg-slate-800"
        >
          Annuler
        </button>
      </div>
    </div>
  </div>
)}
    </main>
  );
}