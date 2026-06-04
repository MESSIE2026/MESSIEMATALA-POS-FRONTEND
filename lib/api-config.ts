export const CENTRAL_API =
  process.env.NEXT_PUBLIC_CENTRAL_API || "https://messiematala-pos-backend-production.up.railway.app";

export const DEFAULT_CLIENT_API =
  process.env.NEXT_PUBLIC_CLIENT_API || "";

export type ZaireAppConfig = {
  apiUrl: string;
  licenceServerUrl: string;
  identreprise: string;
  idmagasin: string;
  iddepot: string;
  idposte: string;
};

function cleanUrl(url: string) {
  return String(url || "").trim().replace(/\/$/, "");
}

export function getDeviceId() {
  if (typeof window === "undefined") return "";

  let id = localStorage.getItem("ZAIRE_DEVICE_ID");

  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("ZAIRE_DEVICE_ID", id);
  }

  return id;
}

export function getClientApi() {
  if (typeof window === "undefined") return "";

  const savedApi = cleanUrl(localStorage.getItem("ZAIRE_API_URL") || "");

  if (savedApi) return savedApi;

  return cleanUrl(DEFAULT_CLIENT_API || CENTRAL_API);
}

export function setClientApi(serverurl: string) {
  if (typeof window === "undefined") return;

  const url = cleanUrl(serverurl);

  if (!url) return;

  localStorage.setItem("ZAIRE_API_URL", url);
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
    apiUrl: getClientApi(),
    licenceServerUrl: cleanUrl(
      localStorage.getItem("ZAIRE_LICENCE_SERVER_URL") || CENTRAL_API
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
    cleanUrl(config.licenceServerUrl || CENTRAL_API)
  );
  localStorage.setItem("ZAIRE_ID_ENTREPRISE", String(config.identreprise || ""));
  localStorage.setItem("ZAIRE_ID_MAGASIN", String(config.idmagasin || ""));
  localStorage.setItem("ZAIRE_ID_DEPOT", String(config.iddepot || ""));
  localStorage.setItem("ZAIRE_ID_POSTE", String(config.idposte || ""));
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