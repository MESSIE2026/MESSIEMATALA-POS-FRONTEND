const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://messiematala-pos-backend-production.up.railway.app";

export interface ImpressionPdfOptions {
  idEntreprise: number;
  idMagasin?: number;
  idPoste?: number;

  moduleSource: string;
  typeDocument: string;
  referenceDocument: string;
  titre: string;

  typeImpression: string;

  fichierNom: string;
  pdfBase64: string;

  imprimanteNom?: string;

  creePar?: string;
}

export async function envoyerPdfAImpression(
  options: ImpressionPdfOptions,
) {
  const response = await fetch(
    `${API_URL}/gestion-imprimantes/file`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        identreprise: options.idEntreprise,
        idmagasin: options.idMagasin,
        idposte: options.idPoste,

        moduleSource: options.moduleSource,
        typeDocument: options.typeDocument,
        referenceDocument: options.referenceDocument,
        titre: options.titre,

        typeImpression: options.typeImpression,
        imprimanteNom: options.imprimanteNom,

        contenuJson: {
          format: "PDF_BASE64",
          fichierNom: options.fichierNom,
          pdfBase64: options.pdfBase64,
        },

        creePar: options.creePar ?? "Utilisateur POS",
      }),
    },
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return await response.json();
}