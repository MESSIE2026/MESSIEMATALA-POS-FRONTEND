import { getAppConfig, getDeviceId } from "./app-config";

export type LicenseStatus = {
  valid: boolean;
  message: string;
  clientName?: string;
  clelicence?: string;
  plan?: string;
  expiresAt?: string;
  modules?: string[];
  serverurl?: string;
  identreprise?: number;
  idmagasin?: number;
  iddepot?: number;
  idposte?: number;
};

export function saveLicenceKey(clelicence: string) {
  localStorage.setItem("ZAIRE_LICENCE_KEY", clelicence.trim());
}

export function getLicenceKey() {
  return localStorage.getItem("ZAIRE_LICENCE_KEY") || "";
}

export async function checkLicense(): Promise<LicenseStatus> {
  try {
    const cfg = getAppConfig();
    const clelicence = getLicenceKey();

    if (!cfg.licenceServerUrl) {
      return {
        valid: false,
        message: "Serveur de licences non configuré.",
      };
    }

    const res = await fetch(`${cfg.licenceServerUrl}/licence/check`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        deviceid: getDeviceId(),
        clelicence,
        identreprise: Number(cfg.identreprise || 0),
        idmagasin: Number(cfg.idmagasin || 0),
        iddepot: Number(cfg.iddepot || 0),
        idposte: Number(cfg.idposte || 0),
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.valid) {
      return {
        valid: false,
        message: data?.message || "Licence invalide.",
      };
    }

    return data;
  } catch (error: any) {
    return {
      valid: false,
      message: error?.message || "Impossible de vérifier la licence.",
    };
  }
}