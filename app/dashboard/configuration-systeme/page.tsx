"use client";

import { useEffect, useState } from "react";
import { getAppConfig, saveAppConfig, getDeviceId } from "@/lib/app-config";

export default function ConfigurationSystemePage() {
  const [licenceServerUrl, setLicenceServerUrl] = useState("");
  const [apiUrl, setApiUrl] = useState("");

  const [identreprise, setIdentreprise] = useState("");
  const [idmagasin, setIdmagasin] = useState("");
  const [iddepot, setIddepot] = useState("");
  const [idposte, setIdposte] = useState("");

  const [cleLicence, setCleLicence] = useState("");
  const [clientName, setClientName] = useState("");
  const [plan, setPlan] = useState("");
  const [modules, setModules] = useState<string[]>([]);
  const [expiresAt, setExpiresAt] = useState("");

  const [statutLicence, setStatutLicence] = useState("");
  const [message, setMessage] = useState("");

  const [testLoading, setTestLoading] = useState(false);
  const [licenceLoading, setLicenceLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const [deviceId, setDeviceId] = useState("");

  useEffect(() => {
    const cfg = getAppConfig();

    setLicenceServerUrl(cfg.licenceServerUrl || 'https://messiematala-pos-backend-production.up.railway.app');
    setApiUrl(cfg.apiUrl || "");
    setIdentreprise(cfg.identreprise || "");
    setIdmagasin(cfg.idmagasin || "");
    setIddepot(cfg.iddepot || "");
    setIdposte(cfg.idposte || "");
    setCleLicence(localStorage.getItem("ZAIRE_LICENCE_KEY") || "");
    setClientName(localStorage.getItem("ZAIRE_CLIENT_NAME") || "");
    setPlan(localStorage.getItem("ZAIRE_PLAN") || "");
    setExpiresAt(localStorage.getItem("ZAIRE_EXPIRES_AT") || "");

    const savedModules = localStorage.getItem("ZAIRE_MODULES");
    setModules(savedModules ? JSON.parse(savedModules) : []);

    setDeviceId(getDeviceId());
  }, []);

  function cleanUrl(url: string) {
    return url.trim().replace(/\/$/, "");
  }

  async function testerServeur() {
    setMessage("");
    setStatutLicence("");
    setTestLoading(true);

    try {
      if (!apiUrl.trim()) {
        setMessage("Adresse API client obligatoire.");
        return;
      }

      const res = await fetch(`${cleanUrl(apiUrl)}/configuration-systeme`);

      if (!res.ok) {
        setMessage("Serveur trouvé, mais réponse API invalide.");
        return;
      }

      setMessage("Connexion API client réussie.");
    } catch (error: any) {
      setMessage(
        "Impossible de joindre le serveur API client : " +
          (error?.message || "Erreur inconnue")
      );
    } finally {
      setTestLoading(false);
    }
  }

  async function verifierLicence() {
    setMessage("");
    setStatutLicence("");
    setLicenceLoading(true);

    try {
      if (!licenceServerUrl.trim()) {
        setStatutLicence("Serveur de licences obligatoire.");
        return;
      }

      if (!cleLicence.trim()) {
        setStatutLicence("Clé licence obligatoire.");
        return;
      }

      if (!deviceId) {
        setStatutLicence("Device ID non chargé.");
        return;
      }

      const cleanLicenceUrl = cleanUrl(licenceServerUrl);

      const res = await fetch(`${cleanLicenceUrl}/licence/check`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deviceid: deviceId,
          clelicence: cleLicence.trim(),
          identreprise: Number(identreprise || 0),
          idmagasin: Number(idmagasin || 0),
          iddepot: Number(iddepot || 0),
          idposte: Number(idposte || 0),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.valid) {
        setStatutLicence(data?.message || "Licence invalide.");
        return;
      }

      const finalApiUrl = cleanUrl(data.serverurl || "");
      const finalEntreprise = String(data.identreprise || "");
      const finalMagasin = String(data.idmagasin || "");
      const finalDepot = String(data.iddepot || "");
      const finalPoste = String(data.idposte || "");

      if (!finalApiUrl) {
        setStatutLicence(
          "Licence valide, mais aucune adresse serveur client n'est définie."
        );
        return;
      }

      setApiUrl(finalApiUrl);
      setIdentreprise(finalEntreprise);
      setIdmagasin(finalMagasin);
      setIddepot(finalDepot);
      setIdposte(finalPoste);
      setClientName(data.clientName || "");
      setPlan(data.plan || "");
      setModules(Array.isArray(data.modules) ? data.modules : []);
      setExpiresAt(data.expiresAt || "");

      saveAppConfig({
        licenceServerUrl: cleanLicenceUrl,
        apiUrl: finalApiUrl,
        identreprise: finalEntreprise,
        idmagasin: finalMagasin,
        iddepot: finalDepot,
        idposte: finalPoste,
      });

      localStorage.setItem("ZAIRE_LICENCE_KEY", cleLicence.trim());
      localStorage.setItem("ZAIRE_CLIENT_NAME", data.clientName || "");
      localStorage.setItem("ZAIRE_PLAN", data.plan || "");
      localStorage.setItem("ZAIRE_EXPIRES_AT", data.expiresAt || "");
      localStorage.setItem(
        "ZAIRE_MODULES",
        JSON.stringify(Array.isArray(data.modules) ? data.modules : [])
      );

      setStatutLicence(
        `✅ Licence valide - Client : ${data.clientName || "-"} | Plan : ${
          data.plan || "-"
        } | Serveur : ${finalApiUrl} | Expire : ${
          data.expiresAt ? new Date(data.expiresAt).toLocaleDateString() : "-"
        }`
      );
    } catch (error: any) {
      setStatutLicence(
        "Impossible de vérifier la licence : " +
          (error?.message || "Erreur inconnue")
      );
    } finally {
      setLicenceLoading(false);
    }
  }

  function enregistrer() {
    setMessage("");
    setSaveLoading(true);

    try {
      if (!licenceServerUrl.trim()) {
        setMessage("Serveur de licences obligatoire.");
        return;
      }

      if (!apiUrl.trim()) {
        setMessage("Adresse API client obligatoire.");
        return;
      }

      if (!cleLicence.trim()) {
        setMessage("Clé licence obligatoire.");
        return;
      }

      if (!identreprise || !idmagasin || !idposte) {
        setMessage("Vérifie d'abord la licence pour charger la configuration.");
        return;
      }

      saveAppConfig({
        licenceServerUrl: cleanUrl(licenceServerUrl),
        apiUrl: cleanUrl(apiUrl),
        identreprise,
        idmagasin,
        iddepot,
        idposte,
      });

      localStorage.setItem("ZAIRE_LICENCE_KEY", cleLicence.trim());
      localStorage.setItem("ZAIRE_CLIENT_NAME", clientName || "");
      localStorage.setItem("ZAIRE_PLAN", plan || "");
      localStorage.setItem("ZAIRE_EXPIRES_AT", expiresAt || "");
      localStorage.setItem("ZAIRE_MODULES", JSON.stringify(modules || []));

      setMessage("Configuration enregistrée avec succès.");
    } finally {
      setSaveLoading(false);
    }
  }

  function copierDeviceId() {
    navigator.clipboard.writeText(deviceId);
    setMessage("Device ID copié.");
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-5xl rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-3xl font-bold text-slate-900">
          Configuration système MESSIE MATALA POS
        </h1>

        <p className="mt-2 text-slate-500">
          Activation de licence et configuration automatique du serveur client
          pour Web, Windows, Mac, Mobile et Terminal POS.
        </p>

        <div className="mt-8 grid gap-5">
          <div>
            <label className="font-semibold text-slate-700">
              Serveur central de licences
            </label>
            <input
              value={licenceServerUrl}
              onChange={(e) => setLicenceServerUrl(e.target.value)}
              placeholder="https://licences.zairepos.com"
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-slate-500">
              Ce serveur vérifie la clé et retourne automatiquement le serveur du client.
            </p>
          </div>

          <div>
            <label className="font-semibold text-slate-700">Clé licence</label>
            <input
              value={cleLicence}
              onChange={(e) => setCleLicence(e.target.value)}
              placeholder="ZAIRE-PRO-000010"
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700">
              Adresse API client
            </label>
            <input
              value={apiUrl}
              readOnly
              placeholder="Chargée automatiquement après vérification licence"
              className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 text-slate-700"
            />
            <p className="mt-1 text-xs text-slate-500">
              Cette adresse vient du champ serverurl de la licence.
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                Device ID :{" "}
                <span className="break-all font-mono">
                  {deviceId || "Chargement..."}
                </span>
              </div>

              <button
                onClick={copierDeviceId}
                disabled={!deviceId}
                className="rounded-xl bg-slate-800 px-4 py-2 font-bold text-white disabled:opacity-60"
              >
                Copier Device ID
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <ReadOnlyInput label="Client" value={clientName} />
            <ReadOnlyInput label="Plan" value={plan} />
            <ReadOnlyInput
              label="Expiration"
              value={expiresAt ? new Date(expiresAt).toLocaleDateString() : ""}
            />
            <ReadOnlyInput label="Modules" value={modules.join(", ")} />
            <ReadOnlyInput label="Entreprise" value={identreprise} />
            <ReadOnlyInput label="Magasin" value={idmagasin} />
            <ReadOnlyInput label="Dépôt" value={iddepot} />
            <ReadOnlyInput label="Poste POS" value={idposte} />
          </div>

          {statutLicence && (
            <div
              className={`rounded-xl p-4 font-medium ${
                statutLicence.includes("✅")
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {statutLicence}
            </div>
          )}

          {message && (
            <div className="rounded-xl bg-blue-50 p-4 font-medium text-blue-700">
              {message}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              onClick={verifierLicence}
              disabled={licenceLoading}
              className="rounded-xl bg-green-600 px-6 py-3 font-bold text-white disabled:opacity-60"
            >
              {licenceLoading ? "Vérification..." : "Vérifier licence"}
            </button>

            <button
              onClick={testerServeur}
              disabled={testLoading || !apiUrl}
              className="rounded-xl bg-slate-900 px-6 py-3 font-bold text-white disabled:opacity-60"
            >
              {testLoading ? "Test..." : "Tester serveur client"}
            </button>

            <button
              onClick={enregistrer}
              disabled={saveLoading}
              className="rounded-xl bg-blue-600 px-6 py-3 font-bold text-white disabled:opacity-60"
            >
              {saveLoading ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

function ReadOnlyInput({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <label className="font-semibold text-slate-700">{label}</label>
      <input
        value={value || ""}
        readOnly
        placeholder="-"
        className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 text-slate-700"
      />
    </div>
  );
}