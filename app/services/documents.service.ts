const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://messiematala-pos-backend-production.up.railway.app';

export type ParametresDocuments = {
  id?: string;
  identreprise?: number;

  nom_entreprise?: string;
  slogan?: string;

  logo_url?: string;
  filigrane_url?: string;
  cachet_url?: string;
  signature_direction_url?: string;

  id_nat?: string;
  rccm?: string;
  numero_impot?: string;
  numero_tva?: string;

  telephone?: string;
  telephone2?: string;
  email?: string;
  site_web?: string;
  adresse?: string;
  ville?: string;
  pays?: string;

  nom_responsable?: string;
  fonction_responsable?: string;

  entete_ligne1?: string;
  entete_ligne2?: string;
  pied_ligne1?: string;
  pied_ligne2?: string;
  mention_legale?: string;

  afficher_logo?: boolean;
  afficher_filigrane?: boolean;

  couleur_principale?: string;
  couleur_secondaire?: string;
  couleur_texte?: string;

  facebook?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
  tiktok?: string;
  whatsapp?: string;

  banque?: string;
  numero_compte?: string;
  swift?: string;
  iban?: string;
  mobile_money?: string;

  actif?: boolean;
  createdat?: string;
  updatedat?: string;
};

export async function getParametresDocuments(
  idEntreprise?: number | string,
): Promise<ParametresDocuments | null> {
  const id =
    idEntreprise ||
    localStorage.getItem('ZAIRE_ID_ENTREPRISE') ||
    '1';

  try {
    const res = await fetch(
      `${API_URL}/config-poste-pos/parametres-documents?idEntreprise=${id}`,
      { cache: 'no-store' },
    );

    if (!res.ok) return null;

    const text = await res.text();

    if (!text || !text.trim()) {
      return null;
    }

    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  } catch {
    return null;
  }
}

export function documentImageUrl(url?: string) {
  if (!url) return '';

  if (url.startsWith('data:image/')) return url;

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  const cleanUrl = url.startsWith('/') ? url : `/${url}`;

  return `${API_URL}${cleanUrl}`;
}

export function nomEntrepriseDocument(params?: ParametresDocuments | null) {
  return params?.nom_entreprise || 'ENTREPRISE';
}

export function couleurPrincipaleDocument(params?: ParametresDocuments | null) {
  return params?.couleur_principale || '#1E40AF';
}

export function couleurTexteDocument(params?: ParametresDocuments | null) {
  return params?.couleur_texte || '#111827';
}