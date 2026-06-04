export type ZaireAppConfig = {
  apiUrl: string;
  licenceServerUrl: string;
  identreprise: string;
  idmagasin: string;
  iddepot: string;
  idposte: string;
};

const DEFAULT_CENTRAL_SERVER =
  'https://messiematala-pos-backend-production.up.railway.app';

function cleanUrl(url: string) {
  return String(url || "").trim().replace(/\/$/, "");
}

export const CENTRAL_API = cleanUrl(
  process.env.NEXT_PUBLIC_CENTRAL_API ||
    process.env.NEXT_PUBLIC_API_URL ||
    DEFAULT_CENTRAL_SERVER
);

export function getDeviceId() {
  if (typeof window === "undefined") return "";

  let id = localStorage.getItem("ZAIRE_DEVICE_ID");

  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("ZAIRE_DEVICE_ID", id);
  }

  return id;
}

export function getAppConfig(): ZaireAppConfig {
  if (typeof window === "undefined") {
    return {
      apiUrl: "",
      licenceServerUrl: "",
      identreprise: "",
      idmagasin: "",
      iddepot: "",
      idposte: "",
    };
  }

  return {
    apiUrl: cleanUrl(localStorage.getItem("ZAIRE_API_URL") || ""),
    licenceServerUrl: cleanUrl(
      localStorage.getItem("ZAIRE_LICENCE_SERVER_URL") ||
        DEFAULT_CENTRAL_SERVER
    ),
    identreprise: localStorage.getItem("ZAIRE_ID_ENTREPRISE") || "",
    idmagasin: localStorage.getItem("ZAIRE_ID_MAGASIN") || "",
    iddepot: localStorage.getItem("ZAIRE_ID_DEPOT") || "",
    idposte: localStorage.getItem("ZAIRE_ID_POSTE") || "",
  };
}

export function saveAppConfig(config: ZaireAppConfig) {
  if (typeof window === "undefined") return;

  localStorage.setItem("ZAIRE_API_URL", cleanUrl(config.apiUrl));
  localStorage.setItem(
    "ZAIRE_LICENCE_SERVER_URL",
    cleanUrl(config.licenceServerUrl || DEFAULT_CENTRAL_SERVER)
  );

  localStorage.setItem("ZAIRE_ID_ENTREPRISE", String(config.identreprise || ""));
  localStorage.setItem("ZAIRE_ID_MAGASIN", String(config.idmagasin || ""));
  localStorage.setItem("ZAIRE_ID_DEPOT", String(config.iddepot || ""));
  localStorage.setItem("ZAIRE_ID_POSTE", String(config.idposte || ""));
}

export function saveClientServerFromLicence(serverurl: string) {
  if (typeof window === "undefined") return;

  localStorage.setItem("ZAIRE_API_URL", cleanUrl(serverurl));
}

export function clearAppConfig() {
  if (typeof window === "undefined") return;

  localStorage.removeItem("ZAIRE_API_URL");
  localStorage.removeItem("ZAIRE_ID_ENTREPRISE");
  localStorage.removeItem("ZAIRE_ID_MAGASIN");
  localStorage.removeItem("ZAIRE_ID_DEPOT");
  localStorage.removeItem("ZAIRE_ID_POSTE");
}

export function isServerConfigured() {
  const cfg = getAppConfig();

  return Boolean(
    cfg.apiUrl &&
      cfg.licenceServerUrl &&
      cfg.identreprise &&
      cfg.idmagasin &&
      cfg.idposte
  );
}