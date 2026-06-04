export type EmployeSession = {
  id_employe: number;
  nom: string;
  prenom: string;
  poste: string;
  departement?: string;
  nomutilisateur?: string;
  identreprise?: number;
  idmagasin?: number;
};

export function saveEmployeSession(emp: EmployeSession) {
  localStorage.setItem('employe', JSON.stringify(emp));
  localStorage.setItem('idEmploye', String(emp.id_employe));
  localStorage.setItem('nomcaissier', `${emp.prenom ?? ''} ${emp.nom ?? ''}`.trim());
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

export function clearEmployeSession() {
  localStorage.removeItem('employe');
  localStorage.removeItem('idEmploye');
  localStorage.removeItem('nomcaissier');
  localStorage.removeItem('idSessionCaisse');
}