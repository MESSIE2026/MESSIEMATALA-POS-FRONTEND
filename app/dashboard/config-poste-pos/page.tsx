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
    </main>
  );
}