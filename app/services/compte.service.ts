export type EmployeSession = {
  id_employe: number;
  nom: string;
  prenom: string;
  poste?: string;
  role?: string;
  departement?: string;
  nomutilisateur?: string;
  email?: string;
  identreprise?: number;
  idmagasin?: number;
  iddepot?: number;
  idposte?: number;
};

export function saveEmployeSession(emp: EmployeSession, accessToken?: string) {
  localStorage.setItem('employe', JSON.stringify(emp));
  localStorage.setItem('idEmploye', String(emp.id_employe));
  localStorage.setItem(
    'nomcaissier',
    `${emp.prenom ?? ''} ${emp.nom ?? ''}`.trim()
  );

  if (accessToken) {
    localStorage.setItem('accessToken', accessToken);
  }
}

export function getEmployeSession(): EmployeSession | null {
  const raw = localStorage.getItem('employe');
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getAccessToken() {
  return localStorage.getItem('accessToken') || '';
}

export function getAuthHeaders() {
  const token = getAccessToken();

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export function clearEmployeSession() {
  localStorage.removeItem('employe');
  localStorage.removeItem('idEmploye');
  localStorage.removeItem('nomcaissier');
  localStorage.removeItem('idSessionCaisse');
  localStorage.removeItem('accessToken');
}