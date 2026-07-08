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
import jsPDF from 'jspdf';

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
  erreur?: string | null;
  date_impression?: string | null;
};

type ImprimanteWindows = {
  nom: string;
  estParDefaut: boolean;
  estDisponible: boolean;
  estHorsLigne: boolean;
  port: string | null;
  statut: string | null;
};

export default function Page() {
  const [imprimantes, setImprimantes] = useState<Imprimante[]>([]);
  const [files, setFiles] = useState<FileImpression[]>([]);
  const [loading, setLoading] = useState(false);

  const [nomImprimante, setNomImprimante] = useState('');
  const [typeImpression, setTypeImpression] = useState('A4');
  const [formatPapier, setFormatPapier] = useState('A4');
  const [parDefaut, setParDefaut] = useState(false);
  const [imprimantesWindows, setImprimantesWindows] = useState<ImprimanteWindows[]>([]);

  const idEntreprise = 1;

  const imprimantesActives = useMemo(
    () => imprimantes.filter((x) => x.actif),
    [imprimantes],
  );

  const estVirtuelle = (nom: string, port?: string | null) => {
    const n = nom.toLowerCase();

    return (
      n.includes('pdf') ||
      n.includes('xps') ||
      n.includes('onenote') ||
      n.includes('fax') ||
      port === 'PORTPROMPT:' ||
      port === 'nul:' ||
      port === 'SHRFAX:'
    );
  };

  const imprimantesPhysiques = useMemo(
    () => imprimantesWindows.filter((p) => !estVirtuelle(p.nom, p.port)),
    [imprimantesWindows],
  );

  const imprimantesVirtuelles = useMemo(
    () => imprimantesWindows.filter((p) => estVirtuelle(p.nom, p.port)),
    [imprimantesWindows],
  );

  const fileEnAttente = useMemo(
    () => files.filter((x) => x.statut === 'EN_ATTENTE'),
    [files],
  );

  const historiqueImpressions = useMemo(
    () => files.filter((x) => x.statut !== 'EN_ATTENTE'),
    [files],
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

      const [locales, imp, file] = await Promise.all([
        getJson(`${API_URL}/gestion-imprimantes/locales?idEntreprise=${idEntreprise}`),
        getJson(`${API_URL}/gestion-imprimantes?idEntreprise=${idEntreprise}`),
        getJson(`${API_URL}/gestion-imprimantes/file?idEntreprise=${idEntreprise}`),
      ]);

      const listeLocales = Array.isArray(locales) ? locales : [];
      const listeImprimantes = Array.isArray(imp) ? imp : [];

      setImprimantes(listeImprimantes);
      setFiles(Array.isArray(file) ? file : []);

      setImprimantesWindows(
        listeLocales.map((x: any) => ({
          nom: x.nom_imprimante,
          estParDefaut: x.est_par_defaut,
          estDisponible: x.est_disponible,
          estHorsLigne: x.est_hors_ligne,
          port: x.port,
          statut: x.statut,
        })),
      );
    } catch (e: any) {
      alert('Erreur chargement imprimantes : ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  async function enregistrerImprimante() {
    if (!nomImprimante.trim()) {
      alert('Veuillez sélectionner le nom de l’imprimante.');
      return;
    }

    try {
      await postJson(`${API_URL}/gestion-imprimantes/selection`, {
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
      alert('Sélection imprimante enregistrée avec succès.');
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

  async function creerPdfBase64Test(type: string) {
  const html = `
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 40px;
          }
          h1 {
            color: #166534;
          }
          .box {
            border: 2px solid #166534;
            padding: 20px;
            border-radius: 12px;
          }
        </style>
      </head>
      <body>
        <div class="box">
          <h1>ZAIRE POS</h1>
          <h2>Test impression ${type}</h2>
          <p>Document généré pour tester l’agent d’impression Windows.</p>
          <p>Date : ${new Date().toLocaleString('fr-FR')}</p>
        </div>
      </body>
    </html>
  `;

  const win = window.open('', '_blank');
  if (!win) throw new Error('Impossible d’ouvrir la fenêtre PDF.');

  win.document.write(html);
  win.document.close();

  setTimeout(() => {
    win.print();
  }, 500);

  throw new Error(
    "Ce test ouvre seulement l'impression navigateur. Pour envoyer PDF_BASE64 automatiquement, il faut générer le PDF avec jsPDF."
  );
}

  
  async function annulerImpression(id: number) {
    if (!confirm('Voulez-vous annuler cette impression ?')) return;

    await patchJson(`${API_URL}/gestion-imprimantes/file/${id}/statut`, {
      statut: 'ANNULE',
      erreur: 'Annulée par utilisateur',
    });

    await charger();
  }

  async function supprimerImprimante(id: number) {
  if (!confirm("Supprimer cette imprimante ?")) return;

  try {
    const res = await fetch(
      `${API_URL}/gestion-imprimantes/${id}`,
      {
        method: "DELETE",
      },
    );

    if (!res.ok) throw new Error(await res.text());

    await charger();
  } catch (e: any) {
    alert(e.message);
  }
}

async function testFileImpression(type: string) {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: type === 'TICKET' ? [80, 180] : 'a4',
    });

    doc.setFontSize(18);
    doc.text('ZAIRE POS', 15, 20);

    doc.setFontSize(12);
    doc.text(`Test impression ${type}`, 15, 35);
    doc.text('Document généré depuis ZAIRE POS.', 15, 45);
    doc.text(`Date : ${new Date().toLocaleString('fr-FR')}`, 15, 55);

    doc.setDrawColor(22, 101, 52);
    doc.rect(10, 10, type === 'TICKET' ? 60 : 190, 60);

    const pdfBase64 = doc.output('datauristring');

    await postJson(`${API_URL}/gestion-imprimantes/file`, {
      identreprise: idEntreprise,
      moduleSource: 'TEST',
      typeDocument: 'TEST_IMPRESSION',
      referenceDocument: 'TEST-' + Date.now(),
      titre: `Test impression ${type}`,
      typeImpression: type,
      contenuJson: {
        format: 'PDF_BASE64',
        pdfBase64,
        fichierNom: `test-impression-${type}.pdf`,
      },
      creePar: 'Utilisateur POS',
    });

    await charger();
    alert('PDF ajouté dans la file d’impression.');
  } catch (e: any) {
    alert('Erreur test : ' + e.message);
  }
}

  async function marquerImprime(id: number) {
    await patchJson(`${API_URL}/gestion-imprimantes/file/${id}/statut`, {
      statut: 'IMPRIME',
    });

    await charger();
  }

  async function marquerEchec(id: number) {
    await patchJson(`${API_URL}/gestion-imprimantes/file/${id}/statut`, {
      statut: 'ECHEC',
      erreur: 'Échec manuel',
    });

    await charger();
  }

  useEffect(() => {
    charger();

    const timer = setInterval(() => {
      charger();
    }, 30000);

    return () => clearInterval(timer);
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
              Centre de gestion des imprimantes, files d’attente et historiques ZAIRE POS.
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

      <section className="grid gap-4 md:grid-cols-5">
        <CardStat title="Configurées" value={imprimantes.length} icon={<Printer />} />
        <CardStat title="Actives" value={imprimantesActives.length} icon={<CheckCircle />} />
        <CardStat title="Physiques" value={imprimantesPhysiques.length} icon={<Printer />} />
        <CardStat title="En attente" value={fileEnAttente.length} icon={<FileText />} />
        <CardStat title="Échecs" value={files.filter((x) => x.statut === 'ECHEC').length} icon={<XCircle />} />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Configurer une imprimante</h2>

          <div className="mt-5 space-y-4">
            <select
              value={nomImprimante}
              onChange={(e) => setNomImprimante(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
            >
              <option value="">Sélectionnez une imprimante...</option>

              <optgroup label="🖨 Imprimantes physiques">
                {imprimantesPhysiques.map((p) => (
                  <option key={p.nom} value={p.nom} disabled={p.estHorsLigne}>
                    {p.nom}
                    {p.estParDefaut ? ' — Par défaut' : ''}
                    {p.estHorsLigne ? ' — HORS LIGNE' : ' — PRÊTE'}
                    {p.port ? ` — ${p.port}` : ''}
                  </option>
                ))}
              </optgroup>

              <optgroup label="💻 Imprimantes virtuelles">
                {imprimantesVirtuelles.map((p) => (
                  <option key={p.nom} value={p.nom}>
                    {p.nom}
                    {p.estParDefaut ? ' — Par défaut' : ''}
                    {p.estHorsLigne ? ' — HORS LIGNE' : ' — PRÊTE'}
                    {p.port ? ` — ${p.port}` : ''}
                  </option>
                ))}
              </optgroup>
            </select>

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
          <h2 className="text-xl font-bold text-slate-900">
            ⚙️ Imprimantes configurées ZAIRE POS
          </h2>

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

                    <td>
                      {item.par_defaut ? (
                        <span className="rounded-full bg-yellow-100 px-3 py-1 font-bold text-yellow-700">
                          ⭐ Par défaut
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td>
                      {item.actif ? (
                        <span className="rounded-full bg-green-100 px-3 py-1 font-bold text-green-700">
                          🟢 Active
                        </span>
                      ) : (
                        <span className="rounded-full bg-red-100 px-3 py-1 font-bold text-red-700">
                          🔴 Désactivée
                        </span>
                      )}
                    </td>

                    <td className="text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          disabled={item.par_defaut}
                          onClick={() => definirDefaut(item.id_imprimante)}
                          className={`rounded-xl px-3 py-2 font-semibold ${
                            item.par_defaut
                              ? 'cursor-not-allowed bg-yellow-50 text-yellow-400'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          <Star className="inline h-4 w-4" />
                          {item.par_defaut ? 'Par défaut' : 'Définir'}
                        </button>

                        <button
                          onClick={() => toggle(item.id_imprimante)}
                          className={`rounded-xl px-3 py-2 font-semibold ${
                            item.actif
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          <Power className="inline h-4 w-4" />
                          {item.actif ? 'Désactiver' : 'Activer'}
                        </button>

                        <button
                          onClick={() => supprimerImprimante(item.id_imprimante)}
                          className="rounded-xl bg-red-100 px-3 py-2 font-semibold text-red-700"
                        >
                          🗑 Supprimer
                        </button>
                      </div>
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
          <h2 className="text-xl font-bold text-slate-900">📄 File d’attente des impressions</h2>

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
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {fileEnAttente.map((item) => (
                  <tr key={item.id_impression} className="border-b">
                    <td className="py-3">
                      {new Date(item.date_creation).toLocaleString('fr-FR')}
                    </td>
                    <td>{item.module_source}</td>
                    <td>{item.type_document}</td>
                    <td className="font-semibold">{item.titre}</td>
                    <td>{item.type_impression}</td>
                    <td>{item.imprimante_nom || '-'}</td>
                    <td className="font-bold text-amber-600">🟡 {item.statut}</td>
                    <td className="space-x-2 text-right">
                      <button
                        onClick={() => marquerImprime(item.id_impression)}
                        className="rounded-xl bg-emerald-100 px-3 py-2 font-semibold text-emerald-700"
                      >
                        Imprimé
                      </button>
                      <button
                        onClick={() => marquerEchec(item.id_impression)}
                        className="rounded-xl bg-red-100 px-3 py-2 font-semibold text-red-700"
                      >
                        Échec
                      </button>
                      <button
                        onClick={() => annulerImpression(item.id_impression)}
                        className="rounded-xl bg-slate-100 px-3 py-2 font-semibold text-slate-700"
                      >
                        Annuler
                      </button>
                    </td>
                  </tr>
                ))}

                {!fileEnAttente.length && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Aucune impression en attente.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-bold text-slate-900">📚 Historique des impressions</h2>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-slate-500">
                  <th className="py-3">Date</th>
                  <th>Module</th>
                  <th>Document</th>
                  <th>Titre</th>
                  <th>Imprimante</th>
                  <th>Statut</th>
                  <th>Erreur</th>
                </tr>
              </thead>
              <tbody>
                {historiqueImpressions.map((item) => (
                  <tr key={item.id_impression} className="border-b">
                    <td className="py-3">
                      {new Date(item.date_creation).toLocaleString('fr-FR')}
                    </td>
                    <td>{item.module_source}</td>
                    <td>{item.type_document}</td>
                    <td className="font-semibold">{item.titre}</td>
                    <td>{item.imprimante_nom || '-'}</td>
                    <td>
                      {item.statut === 'IMPRIME' && (
                        <span className="font-bold text-emerald-700">🟢 IMPRIMÉ</span>
                      )}
                      {item.statut === 'ECHEC' && (
                        <span className="font-bold text-red-700">🔴 ÉCHEC</span>
                      )}
                      {item.statut === 'ANNULE' && (
                        <span className="font-bold text-slate-600">⚫ ANNULÉ</span>
                      )}
                    </td>
                    <td className="text-red-600">{item.erreur || '-'}</td>
                  </tr>
                ))}

                {!historiqueImpressions.length && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Aucun historique d’impression.
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