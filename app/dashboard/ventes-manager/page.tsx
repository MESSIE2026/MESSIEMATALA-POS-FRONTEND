"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Banknote,
  Download,
  Eye,
  FileBarChart,
  FileText,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  Undo2,
  X,
} from "lucide-react";
import {
  couleurPrincipaleDocument,
  getParametresDocuments,
  nomEntrepriseDocument,
  type ParametresDocuments,
} from "../../services/documents.service";

const API_PAR_DEFAUT =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://messiematala-pos-backend-production.up.railway.app";

type TypeRapport =
  | "Journalier"
  | "Hebdomadaire"
  | "Mensuel"
  | "Annuel"
  | "Periode"
  | "ParCaissier";

type Vente = {
  id_vente: number;
  codefacture?: string;
  datevente?: string;
  nomclient?: string;
  nomcaissier?: string;
  modepaiement?: string;
  devise?: string;
  montanttotal?: number | string;
  statut?: string;
  typeoperation?: string;
  total_paye?: number | string;
  total_rembourse?: number | string;
};

type Lookup = {
  sessions: Array<{
    idsession: number;
    dateouverture?: string;
    statut?: string;
    nomcaissier?: string;
  }>;
  caissiers: Array<{ id_employe: number; nom: string }>;
};

type DetailVente = {
  vente: Vente | null;
  lignes: any[];
  paiements: any[];
};

type Contexte = {
  idEntreprise: number;
  idMagasin: number;
  idManager: number;
  nomManager: string;
};

function apiUrl() {
  if (typeof window === "undefined") return API_PAR_DEFAUT;
  return localStorage.getItem("ZAIRE_API_URL") || API_PAR_DEFAUT;
}

function aujourdHui() {
  return new Date().toISOString().slice(0, 10);
}

function dateInput(date: Date) {
  const locale = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return locale.toISOString().slice(0, 10);
}

function calculerPeriode(type: TypeRapport, base: string) {
  const date = new Date(`${base}T12:00:00`);
  if (type === "Journalier") return { debut: base, fin: base };

  if (type === "Hebdomadaire") {
    const lundi = new Date(date);
    lundi.setDate(date.getDate() - ((date.getDay() + 6) % 7));
    const dimanche = new Date(lundi);
    dimanche.setDate(lundi.getDate() + 6);
    return { debut: dateInput(lundi), fin: dateInput(dimanche) };
  }

  if (type === "Mensuel") {
    return {
      debut: dateInput(new Date(date.getFullYear(), date.getMonth(), 1)),
      fin: dateInput(new Date(date.getFullYear(), date.getMonth() + 1, 0)),
    };
  }

  if (type === "Annuel") {
    return {
      debut: dateInput(new Date(date.getFullYear(), 0, 1)),
      fin: dateInput(new Date(date.getFullYear(), 11, 31)),
    };
  }

  return { debut: base, fin: base };
}

function argent(value: unknown, devise = "") {
  const nombre = Number(value || 0);
  return `${nombre.toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} ${devise}`.trim();
}

function contexteLocal(): Contexte | null {
  const idEntreprise = Number(localStorage.getItem("ZAIRE_ID_ENTREPRISE") || 0);
  const idMagasin = Number(localStorage.getItem("ZAIRE_ID_MAGASIN") || 0);
  const raw =
    localStorage.getItem("employe") ||
    localStorage.getItem("user") ||
    localStorage.getItem("utilisateur");

  if (!idEntreprise || !idMagasin || !raw) return null;

  try {
    const employe = JSON.parse(raw);
    const idManager = Number(
      employe.id_employe ??
        employe.idEmploye ??
        employe.ID_Employe ??
        employe.idutilisateur ??
        employe.idUtilisateur ??
        employe.id ??
        0,
    );
    const nomManager = `${employe.prenom || ""} ${employe.nom || ""}`.trim();
    if (!idManager) return null;
    return {
      idEntreprise,
      idMagasin,
      idManager,
      nomManager: nomManager || `Employé #${idManager}`,
    };
  } catch {
    return null;
  }
}

async function lireReponse(res: Response) {
  const texte = await res.text();
  try {
    return texte ? JSON.parse(texte) : null;
  } catch {
    return texte;
  }
}

export default function VentesManagerPage() {
  const router = useRouter();
  const [contexte, setContexte] = useState<Contexte | null>(null);
  const [typeRapport, setTypeRapport] = useState<TypeRapport>("Journalier");
  const [dateDebut, setDateDebut] = useState(aujourdHui());
  const [dateFin, setDateFin] = useState(aujourdHui());
  const [recherche, setRecherche] = useState("");
  const [idCaissier, setIdCaissier] = useState(0);
  const [idSession, setIdSession] = useState(0);
  const [lookups, setLookups] = useState<Lookup>({
    sessions: [],
    caissiers: [],
  });
  const [ventes, setVentes] = useState<Vente[]>([]);
  const [stats, setStats] = useState<Record<string, any>>({});
  const [synthese, setSynthese] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<DetailVente | null>(null);
  const [encaissements, setEncaissements] = useState<any[] | null>(null);
  const [venteAnnulation, setVenteAnnulation] = useState<Vente | null>(null);
  const [motif, setMotif] = useState("");
  const [chargement, setChargement] = useState(false);
  const [actionEnCours, setActionEnCours] = useState(false);
  const [erreur, setErreur] = useState("");
  const [parametres, setParametres] = useState<ParametresDocuments | null>(
    null,
  );

  const venteSelectionnee = useMemo(
    () => ventes.find((vente) => vente.id_vente === selectedId) || null,
    [ventes, selectedId],
  );
  const datesAutomatiques = !["Periode", "ParCaissier"].includes(typeRapport);

  useEffect(() => {
    const session = contexteLocal();
    if (!session) {
      alert(
        "Session, entreprise ou magasin non configuré. Veuillez vous reconnecter.",
      );
      router.push("/dashboard/login");
      return;
    }

    setContexte(session);
    void chargerDocuments();
    void chargerLookups(session);
    void charger(session);
  }, []);

  useEffect(() => {
    if (!datesAutomatiques) return;
    const periode = calculerPeriode(typeRapport, dateDebut);
    setDateDebut(periode.debut);
    setDateFin(periode.fin);
  }, [typeRapport]);

  async function chargerDocuments() {
    try {
      setParametres(await getParametresDocuments());
    } catch {
      setParametres(null);
    }
  }

  function parametresRequete(session = contexte) {
    if (!session) throw new Error("Contexte utilisateur absent.");
    return new URLSearchParams({
      typeRapport,
      dateDebut,
      dateFin,
      recherche: recherche.trim(),
      idEntreprise: String(session.idEntreprise),
      idMagasin: String(session.idMagasin),
      idCaissier: String(typeRapport === "ParCaissier" ? idCaissier : 0),
      idSession: String(idSession),
    });
  }

  async function chargerLookups(session: Contexte) {
    try {
      const params = new URLSearchParams({
        idEntreprise: String(session.idEntreprise),
        idMagasin: String(session.idMagasin),
      });
      const res = await fetch(`${apiUrl()}/ventes-manager/lookups?${params}`, {
        cache: "no-store",
      });
      const data = await lireReponse(res);
      if (!res.ok)
        throw new Error(data?.message || "Impossible de charger les filtres.");
      setLookups({
        sessions: data?.sessions || [],
        caissiers: data?.caissiers || [],
      });
    } catch (error: any) {
      setErreur(error?.message || "Impossible de charger les filtres.");
    }
  }

  async function charger(session = contexte) {
    if (!session) return;
    setChargement(true);
    setErreur("");
    try {
      const res = await fetch(
        `${apiUrl()}/ventes-manager?${parametresRequete(session)}`,
        {
          cache: "no-store",
        },
      );
      const data = await lireReponse(res);
      if (!res.ok)
        throw new Error(data?.message || `Erreur API ${res.status}.`);
      setVentes(data?.ventes || []);
      setStats(data?.stats || {});
      setSynthese(data?.synthesePaiement || []);
      setSelectedId((actuel) =>
        actuel &&
        data?.ventes?.some((vente: Vente) => vente.id_vente === actuel)
          ? actuel
          : null,
      );
    } catch (error: any) {
      setErreur(error?.message || "Impossible de charger les ventes.");
    } finally {
      setChargement(false);
    }
  }

  async function ouvrirDetail(vente: Vente) {
    if (!contexte) return;
    setActionEnCours(true);
    setErreur("");
    try {
      const res = await fetch(
        `${apiUrl()}/ventes-manager/${vente.id_vente}/details?${parametresRequete()}`,
        { cache: "no-store" },
      );
      const data = await lireReponse(res);
      if (!res.ok) throw new Error(data?.message || "Détail indisponible.");
      setDetail(data);
    } catch (error: any) {
      setErreur(error?.message || "Détail indisponible.");
    } finally {
      setActionEnCours(false);
    }
  }

  async function afficherEncaissements() {
    if (!contexte) return;
    setActionEnCours(true);
    setErreur("");
    try {
      const res = await fetch(
        `${apiUrl()}/ventes-manager/resume-encaissements?${parametresRequete()}`,
        { cache: "no-store" },
      );
      const data = await lireReponse(res);
      if (!res.ok) throw new Error(data?.message || "Résumé indisponible.");
      setEncaissements(data?.lignes || []);
    } catch (error: any) {
      setErreur(error?.message || "Résumé indisponible.");
    } finally {
      setActionEnCours(false);
    }
  }

  async function annulerVente() {
    if (!contexte || !venteAnnulation || actionEnCours) return;
    if (motif.trim().length < 5) {
      setErreur("Le motif doit contenir au moins 5 caractères.");
      return;
    }

    setActionEnCours(true);
    setErreur("");
    try {
      const res = await fetch(
        `${apiUrl()}/ventes-manager/${venteAnnulation.id_vente}/annuler`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            motif: motif.trim(),
            idManager: contexte.idManager,
            idEntreprise: contexte.idEntreprise,
            idMagasin: contexte.idMagasin,
          }),
        },
      );
      const data = await lireReponse(res);
      if (!res.ok) throw new Error(data?.message || "Annulation refusée.");
      setVenteAnnulation(null);
      setMotif("");
      await charger(contexte);
    } catch (error: any) {
      setErreur(error?.message || "Annulation refusée.");
    } finally {
      setActionEnCours(false);
    }
  }

  function ouvrirPdf(type: "rapport" | "synthese") {
    if (!contexte) return;
    const route = type === "rapport" ? "rapport/pdf" : "synthese-paiement/pdf";
    window.open(
      `${apiUrl()}/ventes-manager/${route}?${parametresRequete()}`,
      "_blank",
    );
  }

  function exporterCsv() {
    const colonnes = [
      "ID",
      "Facture",
      "Date",
      "Client",
      "Caissier",
      "Paiement",
      "Total",
      "Devise",
      "Statut",
    ];
    const echapper = (valeur: unknown) =>
      `"${String(valeur ?? "").replace(/"/g, '""')}"`;
    const lignes = ventes.map((vente) =>
      [
        vente.id_vente,
        vente.codefacture,
        vente.datevente
          ? new Date(vente.datevente).toLocaleString("fr-FR")
          : "",
        vente.nomclient,
        vente.nomcaissier,
        vente.modepaiement,
        vente.montanttotal,
        vente.devise,
        vente.statut,
      ]
        .map(echapper)
        .join(";"),
    );
    const blob = new Blob(
      [`\uFEFF${[colonnes.map(echapper).join(";"), ...lignes].join("\n")}`],
      {
        type: "text/csv;charset=utf-8",
      },
    );
    const lien = document.createElement("a");
    lien.href = URL.createObjectURL(blob);
    lien.download = `ventes-${dateDebut}-${dateFin}.csv`;
    lien.click();
    URL.revokeObjectURL(lien.href);
  }

  const titre = nomEntrepriseDocument(parametres) || "MESSIE MATALA POS";
  const couleur = couleurPrincipaleDocument(parametres) || "#166534";
  const champ =
    "rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:disabled:bg-slate-800";

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100 md:p-7">
      <div className="mx-auto max-w-[1500px] space-y-5">
        <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div
                className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em]"
                style={{ color: couleur }}
              >
                <ShieldCheck size={16} /> Contrôle manager
              </div>
              <h1 className="text-2xl font-black">Ventes Manager — {titre}</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Suivi des ventes, encaissements, retours et annulations
                sécurisées.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {contexte && (
                <div className="hidden text-right text-sm sm:block">
                  <p className="font-bold">{contexte.nomManager}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Validateur connecté
                  </p>
                </div>
              )}
              <button
                type="button"
                onClick={() => void charger()}
                disabled={chargement}
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50 dark:bg-slate-100 dark:text-slate-950"
              >
                {chargement ? (
                  <Loader2 className="mr-2 inline animate-spin" size={16} />
                ) : (
                  <RefreshCw className="mr-2 inline" size={16} />
                )}
                Actualiser
              </button>
            </div>
          </div>
        </header>

        {erreur && (
          <div className="flex items-start justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-200">
            <span>{erreur}</span>
            <button
              type="button"
              onClick={() => setErreur("")}
              aria-label="Fermer"
            >
              <X size={18} />
            </button>
          </div>
        )}

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          {[
            ["Ventes", stats.total_ventes || 0],
            ["Validées", stats.ventes_validees || 0],
            ["Annulées", stats.ventes_annulees || 0],
            ["Total USD", argent(stats.total_usd, "USD")],
            ["Total CDF", argent(stats.total_cdf, "CDF")],
            ["Total EUR", argent(stats.total_eur, "EUR")],
          ].map(([libelle, valeur]) => (
            <article
              key={String(libelle)}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {libelle}
              </p>
              <p className="mt-2 text-lg font-black">{valeur}</p>
            </article>
          ))}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
            <select
              value={typeRapport}
              onChange={(e) => setTypeRapport(e.target.value as TypeRapport)}
              className={champ}
            >
              <option>Journalier</option>
              <option>Hebdomadaire</option>
              <option>Mensuel</option>
              <option>Annuel</option>
              <option>Periode</option>
              <option>ParCaissier</option>
            </select>
            <input
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              className={champ}
            />
            <input
              type="date"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              disabled={datesAutomatiques}
              className={champ}
            />
            <select
              value={idCaissier}
              onChange={(e) => setIdCaissier(Number(e.target.value))}
              disabled={typeRapport !== "ParCaissier"}
              className={champ}
            >
              <option value={0}>Tous les caissiers</option>
              {lookups.caissiers.map((caissier) => (
                <option key={caissier.id_employe} value={caissier.id_employe}>
                  {caissier.nom}
                </option>
              ))}
            </select>
            <select
              value={idSession}
              onChange={(e) => setIdSession(Number(e.target.value))}
              className={champ}
            >
              <option value={0}>Toutes les sessions</option>
              {lookups.sessions.map((session) => (
                <option key={session.idsession} value={session.idsession}>
                  #{session.idsession} —{" "}
                  {session.nomcaissier || session.statut || "Session"}
                </option>
              ))}
            </select>
            <div className="relative xl:col-span-2">
              <Search
                className="absolute left-3 top-3 text-slate-400"
                size={17}
              />
              <input
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void charger()}
                placeholder="Facture, client, caissier…"
                className={`${champ} w-full pl-10`}
              />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void charger()}
              className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white"
            >
              <Search className="mr-2 inline" size={16} />
              Appliquer
            </button>
            <button
              type="button"
              onClick={() => ouvrirPdf("rapport")}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold dark:border-slate-700"
            >
              <FileText className="mr-2 inline" size={16} />
              Rapport PDF
            </button>
            <button
              type="button"
              onClick={() => ouvrirPdf("synthese")}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold dark:border-slate-700"
            >
              <FileBarChart className="mr-2 inline" size={16} />
              Synthèse PDF
            </button>
            <button
              type="button"
              onClick={exporterCsv}
              disabled={!ventes.length}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold disabled:opacity-40 dark:border-slate-700"
            >
              <Download className="mr-2 inline" size={16} />
              Exporter CSV
            </button>
            <button
              type="button"
              onClick={() => void afficherEncaissements()}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold dark:border-slate-700"
            >
              <Banknote className="mr-2 inline" size={16} />
              Encaissements nets
            </button>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
              <h2 className="font-black">Ventes de la période</h2>
              <span className="text-xs text-slate-500">Maximum 500 lignes</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[940px] text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-950/60 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Facture</th>
                    <th>Date</th>
                    <th>Client</th>
                    <th>Caissier</th>
                    <th>Paiement</th>
                    <th>Total</th>
                    <th>Statut</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ventes.map((vente) => {
                    const annulee = String(vente.statut || "")
                      .toUpperCase()
                      .startsWith("ANNU");
                    return (
                      <tr
                        key={vente.id_vente}
                        onClick={() => setSelectedId(vente.id_vente)}
                        className={`cursor-pointer border-t border-slate-100 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60 ${selectedId === vente.id_vente ? "bg-emerald-50 dark:bg-emerald-950/30" : ""}`}
                      >
                        <td className="px-4 py-3 font-bold">
                          {vente.codefacture || `#${vente.id_vente}`}
                        </td>
                        <td>
                          {vente.datevente
                            ? new Date(vente.datevente).toLocaleString("fr-FR")
                            : "-"}
                        </td>
                        <td>{vente.nomclient || "CLIENT CASH"}</td>
                        <td>{vente.nomcaissier || "-"}</td>
                        <td>{vente.modepaiement || "-"}</td>
                        <td className="font-bold">
                          {argent(vente.montanttotal, vente.devise)}
                        </td>
                        <td>
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-bold ${annulee ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-200" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200"}`}
                          >
                            {vente.statut || "VALIDEE"}
                          </span>
                        </td>
                        <td>
                          <div className="flex justify-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                void ouvrirDetail(vente);
                              }}
                              title="Voir paiements et articles"
                              className="rounded-lg p-2 hover:bg-slate-200 dark:hover:bg-slate-700"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              type="button"
                              disabled={annulee}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedId(vente.id_vente);
                                setVenteAnnulation(vente);
                              }}
                              title="Annuler la vente"
                              className="rounded-lg p-2 text-red-700 hover:bg-red-50 disabled:opacity-30 dark:text-red-300 dark:hover:bg-red-950"
                            >
                              <AlertTriangle size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {!chargement && !ventes.length && (
                    <tr>
                      <td
                        colSpan={8}
                        className="p-10 text-center text-slate-500"
                      >
                        Aucune vente pour ces filtres.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-3 font-black">
                <Banknote className="mr-2 inline" size={18} />
                Paiements
              </h2>
              <div className="space-y-2">
                {synthese.map((ligne, index) => (
                  <div
                    key={`${ligne.modepaiement}-${ligne.devise}-${index}`}
                    className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold">{ligne.modepaiement}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {ligne.nombre} opération(s)
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-black">
                      {argent(ligne.total, ligne.devise)}
                    </p>
                  </div>
                ))}
                {!synthese.length && (
                  <p className="text-sm text-slate-500">Aucun encaissement.</p>
                )}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="font-black">Vente sélectionnée</h2>
              {venteSelectionnee ? (
                <>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    {venteSelectionnee.codefacture}
                  </p>
                  <p className="text-lg font-black">
                    {argent(
                      venteSelectionnee.montanttotal,
                      venteSelectionnee.devise,
                    )}
                  </p>
                  <div className="mt-4 grid gap-2">
                    <button
                      type="button"
                      onClick={() => void ouvrirDetail(venteSelectionnee)}
                      className="rounded-xl bg-slate-900 px-3 py-2.5 text-sm font-bold text-white dark:bg-slate-100 dark:text-slate-950"
                    >
                      <Eye className="mr-2 inline" size={16} />
                      Paiements et articles
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/dashboard/annulations?idVente=${venteSelectionnee.id_vente}`,
                        )
                      }
                      className="rounded-xl bg-amber-600 px-3 py-2.5 text-sm font-bold text-white"
                    >
                      <Undo2 className="mr-2 inline" size={16} />
                      Retour partiel / échange
                    </button>
                  </div>
                </>
              ) : (
                <p className="mt-2 text-sm text-slate-500">
                  Sélectionnez une ligne du tableau.
                </p>
              )}
            </div>
          </aside>
        </section>
      </div>

      {detail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-black">
                  {detail.vente?.codefacture || "Détail de la vente"}
                </h3>
                <p className="text-sm text-slate-500">
                  Articles et encaissements enregistrés
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X />
              </button>
            </div>
            <h4 className="mb-2 mt-5 font-bold">Articles</h4>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full min-w-[600px] text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800">
                  <tr>
                    <th className="p-3 text-left">Produit</th>
                    <th>Quantité</th>
                    <th>Prix</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.lignes.map((ligne, i) => (
                    <tr
                      key={ligne.id_details || i}
                      className="border-t border-slate-100 dark:border-slate-800"
                    >
                      <td className="p-3 font-semibold">{ligne.nomproduit}</td>
                      <td className="text-center">{ligne.quantite}</td>
                      <td className="text-center">
                        {argent(ligne.prixunitaire, ligne.devise)}
                      </td>
                      <td className="text-center font-bold">
                        {argent(ligne.montant, ligne.devise)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h4 className="mb-2 mt-5 font-bold">Paiements</h4>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {detail.paiements.map((paiement, i) => (
                <div
                  key={paiement.idpaiement || i}
                  className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800"
                >
                  <div className="flex justify-between">
                    <b>{paiement.modepaiement}</b>
                    <span className="text-xs">{paiement.statut}</span>
                  </div>
                  <p>{argent(paiement.montant, paiement.devise)}</p>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() =>
                router.push(
                  `/dashboard/ventes/detail?id=${detail.vente?.id_vente}`,
                )
              }
              className="mt-5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white dark:bg-slate-100 dark:text-slate-950"
            >
              Ouvrir la fiche complète
            </button>
          </div>
        </div>
      )}

      {encaissements && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black">Encaissements nets</h3>
              <button type="button" onClick={() => setEncaissements(null)}>
                <X />
              </button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {encaissements.map((ligne) => (
                <div
                  key={ligne.devise}
                  className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800"
                >
                  <b>{ligne.devise}</b>
                  <p className="mt-2 text-xs text-slate-500">Encaissé</p>
                  <p className="font-bold">
                    {argent(ligne.encaisse, ligne.devise)}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">Remboursé</p>
                  <p className="font-bold text-red-700 dark:text-red-300">
                    {argent(ligne.rembourse, ligne.devise)}
                  </p>
                  <p className="mt-2 border-t border-slate-200 pt-2 text-xs text-slate-500 dark:border-slate-700">
                    Net
                  </p>
                  <p className="text-lg font-black">
                    {argent(ligne.net, ligne.devise)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {venteAnnulation && contexte && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-red-700 dark:text-red-300">
                  Opération irréversible
                </p>
                <h3 className="mt-1 text-xl font-black">
                  Annuler{" "}
                  {venteAnnulation.codefacture ||
                    `#${venteAnnulation.id_vente}`}
                </h3>
              </div>
              <button type="button" onClick={() => setVenteAnnulation(null)}>
                <X />
              </button>
            </div>
            <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800">
              <span className="text-slate-500 dark:text-slate-400">
                Validation par{" "}
              </span>
              <b>{contexte.nomManager}</b>
            </div>
            <label
              className="mt-4 block text-sm font-bold"
              htmlFor="motif-annulation"
            >
              Motif obligatoire
            </label>
            <textarea
              id="motif-annulation"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Expliquez précisément la raison de l’annulation…"
              maxLength={500}
              className={`${champ} mt-2 h-28 w-full resize-none`}
            />
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Cette action neutralise les paiements et réintègre le stock de la
              vente.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setVenteAnnulation(null)}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold dark:border-slate-700"
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={() => void annulerVente()}
                disabled={actionEnCours || motif.trim().length < 5}
                className="rounded-xl bg-red-800 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40"
              >
                {actionEnCours && (
                  <Loader2 className="mr-2 inline animate-spin" size={16} />
                )}
                Confirmer l’annulation
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}