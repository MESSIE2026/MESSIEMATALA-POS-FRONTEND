"use client";

import { useEffect, useMemo, useState } from "react";

type Licence = {
  idlicence: number;
  clientname: string;
  clelicence: string;
  deviceid: string | null;
  plan: string;
  modules: string[];
  expiresat: string;
  active: boolean;
  serverurl: string;
  identreprise: number;
  idmagasin: number;
  iddepot: number | null;
  idposte: number;
  createdat: string;
  lastcheckat: string | null;
};

const API_URL = 'https://messiematala-pos-backend-production.up.railway.app';

const initialForm = {
  clientname: "",
  clelicence: "",
  serverurl: 'https://messiematala-pos-backend-production.up.railway.app',
  plan: "PRO",
  modules: "VENTES,PRODUITS,STOCK",
  expiresat: "2031-12-31",
  identreprise: "1",
  idmagasin: "1",
  iddepot: "4",
  idposte: "1",
};

export default function AdminLicencesPage() {
  const [licences, setLicences] = useState<Licence[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [recherche, setRecherche] = useState("");

  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    chargerLicences();
  }, []);

  function updateForm(field: keyof typeof initialForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function chargerLicences() {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${API_URL}/admin-licences`);
      const data = await res.json();

      if (!res.ok) {
        setMessage(data?.message || "Erreur chargement licences.");
        return;
      }

      setLicences(Array.isArray(data) ? data : []);
    } catch (error: any) {
      setMessage(error?.message || "Impossible de joindre le serveur.");
    } finally {
      setLoading(false);
    }
  }

  function genererCle() {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    updateForm("clelicence", `ZAIRE-${Date.now().toString().slice(-5)}-${code}`);
  }

  async function creerLicence() {
    setLoading(true);
    setMessage("");

    try {
      const payload = {
        clientname: form.clientname.trim(),
        clelicence: form.clelicence.trim(),
        serverurl: form.serverurl.trim().replace(/\/$/, ""),
        plan: form.plan,
        modules: form.modules
          .split(",")
          .map((m) => m.trim().toUpperCase())
          .filter(Boolean),
        expiresat: form.expiresat,
        identreprise: Number(form.identreprise),
        idmagasin: Number(form.idmagasin),
        iddepot: form.iddepot ? Number(form.iddepot) : null,
        idposte: Number(form.idposte),
      };

      const res = await fetch(`${API_URL}/admin-licences`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data?.message || "Erreur création licence.");
        return;
      }

      setMessage("Licence créée avec succès.");
      setForm(initialForm);
      await chargerLicences();
    } catch (error: any) {
      setMessage(error?.message || "Erreur création licence.");
    } finally {
      setLoading(false);
    }
  }

  async function actionLicence(id: number, action: string, body?: any) {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${API_URL}/admin-licences/${id}/${action}`, {
        method: "PATCH",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data?.message || "Action impossible.");
        return;
      }

      setMessage("Action exécutée avec succès.");
      await chargerLicences();
    } catch (error: any) {
      setMessage(error?.message || "Erreur action licence.");
    } finally {
      setLoading(false);
    }
  }

  async function renouveler(id: number) {
    const nouvelleDate = prompt("Nouvelle date expiration :", "2035-12-31");
    if (!nouvelleDate) return;

    await actionLicence(id, "renouveler", {
      expiresat: nouvelleDate,
    });
  }

  const licencesFiltrees = useMemo(() => {
    const q = recherche.toLowerCase().trim();

    if (!q) return licences;

    return licences.filter(
      (l) =>
        l.clientname?.toLowerCase().includes(q) ||
        l.clelicence?.toLowerCase().includes(q) ||
        l.serverurl?.toLowerCase().includes(q) ||
        l.deviceid?.toLowerCase().includes(q) ||
        l.plan?.toLowerCase().includes(q)
    );
  }, [licences, recherche]);

  function formatDate(date?: string | null) {
    if (!date) return "-";
    return new Date(date).toLocaleString();
  }

  function Field({
    label,
    value,
    onChange,
    placeholder,
    type = "text",
  }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    type?: string;
  }) {
    return (
      <div>
        <label className="mb-2 block text-sm font-bold text-slate-700">
          {label}
        </label>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
        />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Administrateur Central - Licences
              </h1>
              <p className="mt-2 text-slate-500">
                Création, renouvellement, blocage et libération des licences MESSIE MATALA POS.
              </p>
            </div>

            <button
              onClick={chargerLicences}
              disabled={loading}
              className="rounded-xl bg-slate-900 px-5 py-3 font-bold text-white disabled:opacity-60"
            >
              Actualiser
            </button>
          </div>

          {message && (
            <div className="mt-5 rounded-xl bg-blue-50 p-4 font-medium text-blue-700">
              {message}
            </div>
          )}
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-bold text-slate-900">
            Nouvelle licence
          </h2>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field
              label="Nom client"
              value={form.clientname}
              onChange={(v) => updateForm("clientname", v)}
              placeholder="Ex: BOUTIQUE ETOILE"
            />

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Clé licence
              </label>
              <div className="flex gap-2">
                <input
                  value={form.clelicence}
                  onChange={(e) => updateForm("clelicence", e.target.value)}
                  placeholder="Ex: ZAIRE-PRO-000010"
                  className="w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
                />
                <button
                  onClick={genererCle}
                  className="rounded-xl bg-slate-800 px-4 font-bold text-white"
                >
                  Générer
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Plan
              </label>
              <select
                value={form.plan}
                onChange={(e) => updateForm("plan", e.target.value)}
                className="w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
              >
                <option value="BASIC">BASIC</option>
                <option value="PRO">PRO</option>
                <option value="PREMIUM">PREMIUM</option>
                <option value="ENTERPRISE">ENTERPRISE</option>
              </select>
            </div>

            <div className="md:col-span-3">
              <Field
                label="Adresse serveur client"
                value={form.serverurl}
                onChange={(v) => updateForm("serverurl", v)}
                placeholder="Ex: http://192.168.1.50:3002"
              />
            </div>

            <Field
              label="Modules autorisés"
              value={form.modules}
              onChange={(v) => updateForm("modules", v)}
              placeholder="VENTES,PRODUITS,STOCK"
            />

            <Field
              label="Date d'expiration"
              type="date"
              value={form.expiresat}
              onChange={(v) => updateForm("expiresat", v)}
            />

            <Field
              label="ID Entreprise"
              value={form.identreprise}
              onChange={(v) => updateForm("identreprise", v)}
              placeholder="Ex: 1"
            />

            <Field
              label="ID Magasin"
              value={form.idmagasin}
              onChange={(v) => updateForm("idmagasin", v)}
              placeholder="Ex: 1"
            />

            <Field
              label="ID Dépôt"
              value={form.iddepot}
              onChange={(v) => updateForm("iddepot", v)}
              placeholder="Ex: 4"
            />

            <Field
              label="ID Poste POS"
              value={form.idposte}
              onChange={(v) => updateForm("idposte", v)}
              placeholder="Ex: 1"
            />
          </div>

          <button
            onClick={creerLicence}
            disabled={loading}
            className="mt-5 rounded-xl bg-green-600 px-6 py-3 font-bold text-white disabled:opacity-60"
          >
            Créer la licence
          </button>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <h2 className="text-xl font-bold text-slate-900">
              Licences enregistrées
            </h2>

            <input
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher client, clé, serveur, device..."
              className="rounded-xl border px-4 py-3 outline-none focus:border-blue-500 md:w-96"
            />
          </div>

          <div className="mt-5 w-full overflow-x-auto">
            <table className="min-w-[1650px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-slate-600">
                  <th className="p-3">ID</th>
                  <th className="p-3">Client</th>
                  <th className="p-3">Clé</th>
                  <th className="p-3">Serveur</th>
                  <th className="p-3">Plan</th>
                  <th className="p-3">Modules</th>
                  <th className="p-3">Expire</th>
                  <th className="p-3">Statut</th>
                  <th className="p-3">Device ID</th>
                  <th className="p-3">Créée le</th>
                  <th className="p-3">Dernière vérif.</th>
                  <th className="p-3">Config</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>

              <tbody>
                {licencesFiltrees.map((l) => (
                  <tr key={l.idlicence} className="border-b hover:bg-slate-50">
                    <td className="p-3 font-bold">{l.idlicence}</td>
                    <td className="p-3 font-semibold">{l.clientname}</td>
                    <td className="p-3 font-mono text-xs">{l.clelicence}</td>
                    <td className="p-3 text-xs text-blue-700">
                      {l.serverurl || "-"}
                    </td>
                    <td className="p-3">{l.plan}</td>
                    <td className="p-3">{l.modules?.join(", ") || "-"}</td>
                    <td className="p-3">{formatDate(l.expiresat)}</td>

                    <td className="p-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          l.active
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {l.active ? "Actif" : "Bloqué"}
                      </span>
                    </td>

                    <td className="p-3 text-xs">
                      {l.deviceid ? (
                        <div className="max-w-[260px] break-all font-mono text-slate-700">
                          {l.deviceid}
                        </div>
                      ) : (
                        <span className="font-bold text-orange-600">Libre</span>
                      )}
                    </td>

                    <td className="p-3 text-xs">{formatDate(l.createdat)}</td>
                    <td className="p-3 text-xs">{formatDate(l.lastcheckat)}</td>

                    <td className="p-3 text-xs">
                      E:{l.identreprise} M:{l.idmagasin} D:{l.iddepot || "-"} P:
                      {l.idposte}
                    </td>

                    <td className="p-3">
                      <div className="flex min-w-[120px] flex-col gap-2">
                        <button
                          onClick={() => renouveler(l.idlicence)}
                          className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white"
                        >
                          Renouveler
                        </button>

                        {l.active ? (
                          <button
                            onClick={() =>
                              actionLicence(l.idlicence, "bloquer")
                            }
                            className="rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white"
                          >
                            Bloquer
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              actionLicence(l.idlicence, "debloquer")
                            }
                            className="rounded-lg bg-green-600 px-3 py-2 text-xs font-bold text-white"
                          >
                            Débloquer
                          </button>
                        )}

                        <button
                          onClick={() =>
                            actionLicence(l.idlicence, "liberer-appareil")
                          }
                          className="rounded-lg bg-slate-700 px-3 py-2 text-xs font-bold text-white"
                        >
                          Libérer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {!loading && licencesFiltrees.length === 0 && (
                  <tr>
                    <td className="p-6 text-center text-slate-500" colSpan={13}>
                      Aucune licence trouvée.
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