'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Printer,
  RefreshCw,
  Save,
  Star,
  Power,
  FileText,
  Receipt,
  Tags,
  CheckCircle,
  XCircle,
} from 'lucide-react';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://messiematala-pos-backend-production.up.railway.app';

type Imprimante = {
  id_imprimante: number;
  nom_imprimante: string;
  type_impression: string;
  format_papier: string;
  actif: boolean;
  par_defaut: boolean;
};

type FileImpression = {
  id_impression: number;
  module_source: string;
  type_document: string;
  titre: string;
  type_impression: string;
  imprimante_nom: string;
  statut: string;
  date_creation: string;
};

export default function Page() {
  const [imprimantes, setImprimantes] = useState<Imprimante[]>([]);
  const [files, setFiles] = useState<FileImpression[]>([]);
  const [loading, setLoading] = useState(false);

  const [nomImprimante, setNomImprimante] = useState('');
  const [typeImpression, setTypeImpression] = useState('A4');
  const [formatPapier, setFormatPapier] = useState('A4');
  const [parDefaut, setParDefaut] = useState(false);

  const idEntreprise = 1;

  const imprimantesActives = useMemo(
    () => imprimantes.filter((x) => x.actif),
    [imprimantes],
  );

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

  async function patchJson(url: string, body: any = {}) {
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async function charger() {
    try {
      setLoading(true);
      const [imp, file] = await Promise.all([
        getJson(`${API_URL}/gestion-imprimantes?idEntreprise=${idEntreprise}`),
        getJson(`${API_URL}/gestion-imprimantes/file?idEntreprise=${idEntreprise}`),
      ]);
      setImprimantes(imp);
      setFiles(file);
    } catch (e: any) {
      alert('Erreur chargement imprimantes : ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  async function enregistrerImprimante() {
    if (!nomImprimante.trim()) {
      alert('Veuillez saisir le nom de l’imprimante.');
      return;
    }

    try {
      await postJson(`${API_URL}/gestion-imprimantes`, {
        identreprise: idEntreprise,
        nomImprimante,
        typeImpression,
        formatPapier,
        parDefaut,
        creePar: 'Utilisateur POS',
      });

      setNomImprimante('');
      setParDefaut(false);
      await charger();
      alert('Imprimante enregistrée avec succès.');
    } catch (e: any) {
      alert('Erreur enregistrement : ' + e.message);
    }
  }

  async function definirDefaut(id: number) {
    await patchJson(`${API_URL}/gestion-imprimantes/${id}/default`);
    await charger();
  }

  async function toggle(id: number) {
    await patchJson(`${API_URL}/gestion-imprimantes/${id}/toggle`);
    await charger();
  }

  async function testFileImpression(type: string) {
    try {
      await postJson(`${API_URL}/gestion-imprimantes/file`, {
        identreprise: idEntreprise,
        moduleSource: 'TEST',
        typeDocument: 'TEST_IMPRESSION',
        referenceDocument: 'TEST-' + Date.now(),
        titre: `Test impression ${type}`,
        typeImpression: type,
        contenuJson: {
          message: 'Test impression depuis ZAIRE POS',
          date: new Date().toISOString(),
        },
        creePar: 'Utilisateur POS',
      });

      await charger();
      alert('Test ajouté dans la file d’impression.');
    } catch (e: any) {
      alert('Erreur test : ' + e.message);
    }
  }

  useEffect(() => {
    charger();
  }, []);

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-2xl font-bold text-slate-900 md:text-3xl">
                <Printer className="h-8 w-8" />
                Gestion des Impressions
              </h1>
              <p className="mt-2 text-slate-500">
                API centrale pour tickets, factures, rapports A4, étiquettes et documents PDF.
              </p>
            </div>

            <button
              onClick={charger}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <CardStat title="Imprimantes" value={imprimantes.length} icon={<Printer />} />
          <CardStat title="Actives" value={imprimantesActives.length} icon={<CheckCircle />} />
          <CardStat title="En attente" value={files.filter((x) => x.statut === 'EN_ATTENTE').length} icon={<FileText />} />
          <CardStat title="Échecs" value={files.filter((x) => x.statut === 'ECHEC').length} icon={<XCircle />} />
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-xl font-bold text-slate-900">Ajouter une imprimante</h2>

            <div className="mt-5 space-y-4">
              <input
                value={nomImprimante}
                onChange={(e) => setNomImprimante(e.target.value)}
                placeholder="Ex: EPSON TM-T20, Canon LBP, Microsoft Print to PDF"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-slate-900"
              />

              <select
                value={typeImpression}
                onChange={(e) => setTypeImpression(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              >
                <option value="TICKET">Ticket / reçu</option>
                <option value="A4">Document A4</option>
                <option value="ETIQUETTE">Étiquette</option>
                <option value="PDF">PDF virtuel</option>
              </select>

              <select
                value={formatPapier}
                onChange={(e) => setFormatPapier(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              >
                <option value="A4">A4</option>
                <option value="80MM">Ticket 80mm</option>
                <option value="58MM">Ticket 58mm</option>
                <option value="ETIQUETTE">Étiquette</option>
              </select>

              <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={parDefaut}
                  onChange={(e) => setParDefaut(e.target.checked)}
                />
                Définir comme imprimante par défaut
              </label>

              <button
                onClick={enregistrerImprimante}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3 font-bold text-white"
              >
                <Save className="h-5 w-5" />
                Enregistrer
              </button>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 lg:col-span-2">
            <h2 className="text-xl font-bold text-slate-900">Imprimantes configurées</h2>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-slate-500">
                    <th className="py-3">Nom</th>
                    <th>Type</th>
                    <th>Format</th>
                    <th>Défaut</th>
                    <th>État</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {imprimantes.map((item) => (
                    <tr key={item.id_imprimante} className="border-b">
                      <td className="py-3 font-semibold">{item.nom_imprimante}</td>
                      <td>{item.type_impression}</td>
                      <td>{item.format_papier}</td>
                      <td>{item.par_defaut ? 'Oui' : 'Non'}</td>
                      <td>{item.actif ? 'Active' : 'Désactivée'}</td>
                      <td className="space-x-2 text-right">
                        <button
                          onClick={() => definirDefaut(item.id_imprimante)}
                          className="rounded-xl bg-amber-100 px-3 py-2 font-semibold text-amber-700"
                        >
                          <Star className="inline h-4 w-4" /> Défaut
                        </button>
                        <button
                          onClick={() => toggle(item.id_imprimante)}
                          className="rounded-xl bg-slate-100 px-3 py-2 font-semibold text-slate-700"
                        >
                          <Power className="inline h-4 w-4" /> Activer
                        </button>
                      </td>
                    </tr>
                  ))}

                  {!imprimantes.length && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Aucune imprimante configurée.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={() => testFileImpression('TICKET')}
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-700 px-4 py-3 font-semibold text-white"
              >
                <Receipt className="h-5 w-5" />
                Test Ticket
              </button>

              <button
                onClick={() => testFileImpression('A4')}
                className="inline-flex items-center gap-2 rounded-2xl bg-green-700 px-4 py-3 font-semibold text-white"
              >
                <FileText className="h-5 w-5" />
                Test A4
              </button>

              <button
                onClick={() => testFileImpression('ETIQUETTE')}
                className="inline-flex items-center gap-2 rounded-2xl bg-purple-700 px-4 py-3 font-semibold text-white"
              >
                <Tags className="h-5 w-5" />
                Test Étiquette
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-bold text-slate-900">File d’attente des impressions</h2>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-slate-500">
                  <th className="py-3">Date</th>
                  <th>Module</th>
                  <th>Document</th>
                  <th>Titre</th>
                  <th>Type</th>
                  <th>Imprimante</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {files.map((item) => (
                  <tr key={item.id_impression} className="border-b">
                    <td className="py-3">
                      {new Date(item.date_creation).toLocaleString('fr-FR')}
                    </td>
                    <td>{item.module_source}</td>
                    <td>{item.type_document}</td>
                    <td className="font-semibold">{item.titre}</td>
                    <td>{item.type_impression}</td>
                    <td>{item.imprimante_nom || '-'}</td>
                    <td>{item.statut}</td>
                  </tr>
                ))}

                {!files.length && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Aucune impression dans la file.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function CardStat({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: any;
}) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
        </div>
        <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">{icon}</div>
      </div>
    </div>
  );
}