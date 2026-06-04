import { getAppConfig, getDeviceId } from "./app-config";

export function getApiUrl() {
  const cfg = getAppConfig();

  if (!cfg.apiUrl) {
    throw new Error("Adresse API client non configurée.");
  }

  return cfg.apiUrl;
}

export async function apiFetch(path: string, options?: RequestInit) {
  const cfg = getAppConfig();
  const baseUrl = getApiUrl();

  return fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-zaire-device-id": getDeviceId(),
      "x-zaire-entreprise": cfg.identreprise,
      "x-zaire-magasin": cfg.idmagasin,
      "x-zaire-depot": cfg.iddepot,
      "x-zaire-poste": cfg.idposte,
      ...(options?.headers || {}),
    },
  });
}