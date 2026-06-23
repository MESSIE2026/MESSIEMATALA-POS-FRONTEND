'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type ModuleItem = {
  titre: string;
  desc: string;
  url: string;
};

type Pole = {
  id: string;
  titre: string;
  desc: string;
  icon: string;
  modules: ModuleItem[];
};

type Employe = {
  id?: number;
  idutilisateur?: number;
  nom?: string;
  prenom?: string;
  email?: string;
  username?: string;
  nomutilisateur?: string;
  role?: string;
  statut?: string;
  photoProfil?: string;
};

type PosContext = {
  idEntreprise?: number;
  nomEntreprise?: string;
  idMagasin?: number;
  nomMagasin?: string;
  idDepot?: number | null;
  nomDepot?: string;
  idPoste?: number;
  nomPOS?: string;
  posConfigured?: boolean;
};

function lireJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;

  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function valeur(v: any, fallback = 'Non défini') {
  if (v === undefined || v === null || String(v).trim() === '') return fallback;
  return String(v);
}

const poles: Pole[] = [
  {
    id: 'vente',
    titre: 'Vente & POS',
    desc: 'Caisse, tickets, clients, paiements',
    icon: '🛒',
    modules: [
      { titre: 'Ventes', desc: 'Gestion des ventes et tickets', url: '/dashboard/ventes' },
      { titre: 'Détails Vente', desc: 'Produits vendus par facture', url: '/dashboard/details-vente' },
      { titre: 'Ventes Manager', desc: 'Supervision manager des ventes', url: '/dashboard/ventes-manager' },
      { titre: 'Clients', desc: 'Gestion clients et fidélité', url: '/dashboard/clients' },
      { titre: 'Produits', desc: 'Catalogue produits et prix', url: '/dashboard/produits' },
      { titre: 'Caisse', desc: 'Sessions caisse et encaissements', url: '/dashboard/caisse' },
      { titre: 'Session Caisse', desc: 'Ouverture et clôture caisse', url: '/dashboard/session-caisse' },
      { titre: 'Paiements Vente', desc: 'Paiements clients', url: '/dashboard/paiements-vente' },
      { titre: 'Crédits Clients', desc: 'Crédits, acomptes et restes', url: '/dashboard/credits-clients' },
      { titre: 'Encaisser Crédit', desc: 'Encaissement crédit client', url: '/dashboard/encaisser-credit' },
      { titre: 'Annulations', desc: 'Annulations ventes et audit', url: '/dashboard/annulations' },
      { titre: 'Historique Achats', desc: 'Historique achats clients', url: '/dashboard/historique-achats' },
      { titre: 'Gestion Imprimantes', desc: 'Tickets, reçus et imprimantes POS', url: '/dashboard/gestion-imprimantes' },
    ],
  },
 {
  id: 'stock',
  titre: 'Stock',
  desc: 'Dépôts, inventaire, fournisseurs',
  icon: '📦',
  modules: [
    { titre: 'Stock', desc: 'Mouvements et inventaires', url: '/dashboard/stock' },
    { titre: 'Inventaire', desc: 'Inventaire manuel et scanner', url: '/dashboard/inventaire' },
    { titre: 'Inventaire Scanner', desc: 'Inventaire par scanner', url: '/dashboard/inventaire-scanner' },
    { titre: 'Opérations Stock', desc: 'Entrées, sorties et journal stock', url: '/dashboard/operations-stock' },
    { titre: 'Réception', desc: 'Réception fournisseur et dépôt', url: '/dashboard/reception' },
    { titre: 'Alertes Stock', desc: 'Stock faible et expiration', url: '/dashboard/alertes-stock' },
    { titre: 'Stock Avancé', desc: 'Contrôle avancé des dépôts', url: '/dashboard/stock-avance' },
    { titre: 'Fournisseurs', desc: 'Fournisseurs, achats et commandes', url: '/dashboard/fournisseurs' },

    { 
      titre: 'Catalogue Fournisseur', 
      desc: 'Prix d’achat, produits liés aux fournisseurs et délais', 
      url: '/dashboard/catalogue-fournisseur' 
    },

    { titre: 'Bon Commande', desc: 'Bons de commande', url: '/dashboard/bon-commande' },
    { titre: 'Facture Fournisseur', desc: 'Factures fournisseurs', url: '/dashboard/facture-fournisseur' },
  ],
},
  {
    id: 'finance',
    titre: 'Finance',
    desc: 'Caisse, dépenses, comptabilité',
    icon: '💳',
    modules: [
      { titre: 'Dépenses', desc: 'Sorties caisse et charges', url: '/dashboard/depenses' },
      { titre: 'Entrées', desc: 'Entrées caisse et recettes', url: '/dashboard/entrees' },
      { titre: 'Entrées / Sorties Caisse', desc: 'Mouvements financiers', url: '/dashboard/entrees-sorties-caisse' },
      { titre: 'Clôture Journalière', desc: 'Clôture et rapport du jour', url: '/dashboard/cloture-journaliere' },
      { titre: 'Taux de Change', desc: 'USD, CDF, EUR', url: '/dashboard/taux-change' },
      { titre: 'Comptables', desc: 'Comptabilité générale', url: '/dashboard/comptables' },
      { titre: 'Validation Dépenses', desc: 'Validation des dépenses', url: '/dashboard/validation-depenses' },
      { titre: 'Statistiques Avancées', desc: 'Analyses et tableaux de bord', url: '/dashboard/statistiques-avancees' },
      { titre: 'Dashboard Boss', desc: 'Vue direction générale', url: '/dashboard/dashboard-boss' },
    ],
  },
  {
    id: 'admin',
    titre: 'Admin Central',
    desc: 'Licences, serveurs, audit SaaS',
    icon: '🛡️',
    modules: [
      {
  titre: 'Dashboard Central',
  desc: 'Vue générale du système central',
  url: '/dashboard/admin-central',
},
      { titre: 'Configuration Système', desc: 'Paramètres globaux du système', url: '/dashboard/configuration-systeme' },
      { titre: 'Admin Licence', desc: 'Administration centrale des licences clients', url: '/dashboard/admin-central/licences' },
      { titre: 'Validation Comptes', desc: 'Validation et approbation des comptes utilisateurs', url: '/dashboard/admin-central/validation-comptes' },
      { titre: 'Connexions', desc: 'Utilisateurs connectés et appareils', url: '/dashboard/admin-central/sessions' },
      { titre: 'Notifications', desc: 'Notifications globales du système', url: '/dashboard/admin-central/notifications' },
      { titre: 'Serveurs Clients', desc: 'Supervision des serveurs clients', url: '/dashboard/admin-central/serveurs' },
      { titre: 'Audit', desc: 'Historique des actions administratives', url: '/dashboard/admin-central/audit' },
      { titre: 'Entreprises', desc: 'Gestion globale des entreprises clientes', url: '/dashboard/admin-central/entreprises' },
      { titre: 'Magasins', desc: 'Gestion globale des magasins', url: '/dashboard/admin-central/magasins' },
      { titre: 'Dépôts', desc: 'Gestion globale des dépôts', url: '/dashboard/admin-central/depots' },
      { titre: 'Postes POS', desc: 'Gestion des postes de caisse', url: '/dashboard/admin-central/postes-pos' },
      { titre: 'Utilisateurs', desc: 'Gestion des utilisateurs du système', url: '/dashboard/admin-central/utilisateurs' },
{ titre: 'Rôles & Permissions', desc: 'Gestion des rôles et droits', url: '/dashboard/admin-central/roles' },

{
  titre: 'Modules Entreprises',
  desc: 'Autoriser les modules achetés par chaque entreprise',
  url: '/dashboard/admin-central/entreprise-modules',
},

{
  titre: 'Sauvegardes',
  desc: 'Créer, télécharger, restaurer et superviser les sauvegardes des serveurs clients',
  url: '/dashboard/admin-central/sauvegardes',
},


{
  titre: 'Permissions Utilisateurs',
  desc: 'Attribuer les permissions aux utilisateurs par entreprise',
  url: '/dashboard/admin-central/utilisateur-permissions',
},

{
  titre: 'Tentatives Connexion',
  desc: 'Historique des connexions réussies, échouées et blocages',
  url: '/dashboard/admin-central/securite/tentatives-connexion',
},

{
  titre: 'Appareils approuvés',
  desc: 'Appareils autorisés à se connecter',
  url: '/dashboard/admin-central/securite/appareils-approuves',
},
{
  titre: 'Appareils bloqués',
  desc: 'Appareils interdits de connexion',
  url: '/dashboard/admin-central/securite/appareils-bloques',
},

{ titre: 'Appareils', desc: 'Appareils liés aux licences', url: '/dashboard/admin-central/appareils' },
{ titre: 'Sauvegardes', desc: 'Gestion des sauvegardes', url: '/dashboard/admin-central/backups' },
    ],
  },
  {
    id: 'academic',
    titre: 'ZAIRE Academic',
    desc: 'École, étudiants, notes, bulletins',
    icon: '🎓',
    modules: [
      { titre: 'Académique', desc: 'Dashboard académique', url: '/dashboard/academique' },
      { titre: 'Dashboard Académique', desc: 'Statistiques académiques', url: '/dashboard/dashboard-academique' },
      { titre: 'Étudiants', desc: 'Gestion étudiants', url: '/dashboard/etudiants' },
      { titre: 'Enseignants', desc: 'Gestion enseignants', url: '/dashboard/enseignants' },
      { titre: 'Classes', desc: 'Gestion classes', url: '/dashboard/classes' },
      { titre: 'Cours', desc: 'Gestion cours', url: '/dashboard/cours' },
      { titre: 'Notes', desc: 'Notes étudiants', url: '/dashboard/notes' },
      { titre: 'Bulletins', desc: 'Bulletins scolaires', url: '/dashboard/bulletins' },
      { titre: 'Affectations Cours', desc: 'Affectation enseignants-cours', url: '/dashboard/affectations-cours' },
      { titre: 'Année Académique', desc: 'Années scolaires', url: '/dashboard/annee-academique' },
      { titre: 'Inscriptions', desc: 'Inscriptions académiques', url: '/dashboard/inscriptions' },
      { titre: 'Paiements Étudiants', desc: 'Paiements frais scolaires', url: '/dashboard/paiements-etudiants' },
      { titre: 'Rapports Académiques', desc: 'Rapports scolaires', url: '/dashboard/rapports-academiques' },
    ],
  },
  {
    id: 'immobilier',
    titre: 'Immobilier',
    desc: 'Biens, loyers, locataires',
    icon: '🏢',
    modules: [
      { titre: 'Immobilier', desc: 'Dashboard immobilier', url: '/dashboard/immobilier' },
      { titre: 'Clients Immobilier', desc: 'Clients, locataires et propriétaires', url: '/dashboard/clients-immobilier' },
      { titre: 'Biens Immobiliers', desc: 'Maisons, appartements et unités', url: '/dashboard/biens-immobiliers' },
      { titre: 'Contrats Bail', desc: 'Contrats de location', url: '/dashboard/contrats-bail' },
      { titre: 'Paiements Loyers', desc: 'Loyers et dettes locataires', url: '/dashboard/paiements-loyers' },
      { titre: 'Charges Immobilier', desc: 'Charges et dépenses immobilières', url: '/dashboard/charges-immobilier' },
      { titre: 'Documents Immobilier', desc: 'Documents, PDF et fichiers', url: '/dashboard/documents-immobilier' },
      { titre: 'Rapports Immobilier', desc: 'Rapports PDF immobilier', url: '/dashboard/rapports-immobilier' },
      { titre: 'Locataires', desc: 'Gestion des locataires', url: '/dashboard/locataires' },
      { titre: 'Maintenance Immobilier', desc: 'Maintenance, réparations et suivi', url: '/dashboard/maintenance-immobilier' },
    ],
  },
  {
    id: 'salle',
    titre: 'Salle & Événement',
    desc: 'Réservations, contrats, planning',
    icon: '🏛️',
    modules: [
      { titre: 'Salle / Événement', desc: 'Gestion salle principale', url: '/dashboard/salle' },
      { titre: 'Clients Salle', desc: 'Clients événementiels', url: '/dashboard/clients-salle' },
      { titre: 'Réservation Salle', desc: 'Réservations et horaires', url: '/dashboard/reservation-salle' },
      { titre: 'Calendrier Salle', desc: 'Planning journalier et mensuel', url: '/dashboard/calendrier-salle' },
      { titre: 'Paiements Salle', desc: 'Paiements réservations', url: '/dashboard/paiements-salle' },
      { titre: 'Contrats Salle', desc: 'Contrats événementiels', url: '/dashboard/contrats-salle' },
      { titre: 'Location Matériels', desc: 'Location, caution et reçu', url: '/dashboard/location-materiels' },
      { titre: 'Tarification Salle', desc: 'Prix heure, jour, weekend', url: '/dashboard/tarification-salle' },
    ],
  },
  {
    id: 'marketing',
    titre: 'Marketing',
    desc: 'Coupons, fidélité, campagnes',
    icon: '📣',
    modules: [
      { titre: 'Marketing', desc: 'Promotions et fidélité', url: '/dashboard/marketing' },
      { titre: 'Partenaires', desc: 'Partenaires et comptes promo', url: '/dashboard/partenaires' },
      { titre: 'Remises Promotions', desc: 'Remises et campagnes', url: '/dashboard/remises-promotions' },
      { titre: 'Paramètres Fidélité', desc: 'Points et cartes fidélité', url: '/dashboard/parametres-fidelite' },
      { titre: 'Fidélité Retrait', desc: 'Retraits fidélité client', url: '/dashboard/fidelite-retrait' },
      { titre: 'Coupons', desc: 'Coupons, codes promo et réductions', url: '/dashboard/coupons' },
      { titre: 'Objectifs Campagnes', desc: 'Objectifs et suivi campagnes', url: '/dashboard/objectifs-campagnes' },
    ],
  },
  {
    id: 'rh',
    titre: 'RH & Sécurité',
    desc: 'Employés, rôles, présences',
    icon: '👥',
    modules: [
      { titre: 'Employés', desc: 'Gestion employés et accès', url: '/dashboard/employes' },
      { titre: 'Utilisateurs', desc: 'Comptes utilisateurs', url: '/dashboard/utilisateurs' },
      { titre: 'Permissions', desc: 'Droits d’accès modules', url: '/dashboard/permissions' },
      { titre: 'Connexions Utilisateurs', desc: 'Historique connexions', url: '/dashboard/connexions-utilisateurs' },
      { titre: 'Signature Manager', desc: 'Validations manager', url: '/dashboard/signature-manager' },
      { titre: 'Présence / Absence', desc: 'Présences agents', url: '/dashboard/presence-absence' },
      { titre: 'Salaires Agents', desc: 'Salaires du personnel', url: '/dashboard/salaires-agents' },
      { titre: 'Performance Agents', desc: 'Objectifs et performances', url: '/dashboard/performance-agents' },
      { titre: 'Primes Commissions', desc: 'Primes et commissions', url: '/dashboard/primes-commissions' },
    ],
  },
  {
    id: 'systeme',
    titre: 'Système',
    desc: 'Backup, activation, outils',
    icon: '⚙️',
    modules: [
      { titre: 'Audit Log', desc: 'Journal audit système', url: '/dashboard/audit-log' },
      { titre: 'Backup Restore', desc: 'Sauvegarde et restauration', url: '/dashboard/backup-restore' },
      { titre: 'SQL Admin Credentials', desc: 'Accès administrateur SQL', url: '/dashboard/sql-admin-credentials' },
      { titre: 'Test', desc: 'Tests techniques', url: '/dashboard/test' },
      { titre: 'Activation', desc: 'Activation licence', url: '/dashboard/activation' },
      { titre: 'À Propos', desc: 'Informations application', url: '/dashboard/a-propos' },
      { titre: 'Config Poste POS', desc: 'Configuration poste caisse', url: '/dashboard/config-poste-pos' },
      { titre: 'Base', desc: 'Base système', url: '/dashboard/base' },
    ],
  },
];

const totalModules = poles.reduce((total, pole) => total + pole.modules.length, 0);

export default function DashboardPage() {
  const router = useRouter();

  const [activePoleId, setActivePoleId] = useState(poles[0].id);
  const [search, setSearch] = useState('');
  const [employe, setEmploye] = useState<Employe>({});
  const [context, setContext] = useState<PosContext>({});
  const [showProfile, setShowProfile] = useState(false);
const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
  const token = localStorage.getItem('accessToken');

  if (!token) {
    router.replace('/');
    return;
  }

  const empBase = lireJson<Employe>('employe', {});
const idProfil = empBase.idutilisateur || empBase.id || empBase.email;
const empProfil = lireJson<Employe>(`profilUtilisateur_${idProfil}`, {});

const memeUtilisateur =
  empProfil.email &&
  empBase.email &&
  empProfil.email.toLowerCase() === empBase.email.toLowerCase();

setEmploye({
  ...empBase,
  ...(memeUtilisateur ? empProfil : {}),
  photoProfil: memeUtilisateur
    ? empProfil.photoProfil || empBase.photoProfil || ''
    : empBase.photoProfil || '',
});

  setContext(lireJson<PosContext>('posContext', {}));
}, [router]);

  const activePole = poles.find((p) => p.id === activePoleId) || poles[0];

  const modulesFiltres = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return activePole.modules;

    return activePole.modules.filter(
      (m) =>
        m.titre.toLowerCase().includes(q) ||
        m.desc.toLowerCase().includes(q),
    );
  }, [activePole, search]);

  const nomComplet = `${valeur(employe.prenom, '')} ${valeur(employe.nom, '')}`.trim();
  const compte = employe.email || employe.username || employe.nomutilisateur;
  const initiales =
    `${valeur(employe.prenom?.[0], '')}${valeur(employe.nom?.[0], '')}`.trim().toUpperCase() || 'U';
    const photoProfil = employe.photoProfil || '';

  async function deconnecter() {
  const emp = lireJson<Employe>('employe', {});
 const API =
  localStorage.getItem('ZAIRE_API_URL') ||
  'https://messiematala-pos-backend-production.up.railway.app';

  try {
    await fetch(`${API}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idutilisateur: emp.idutilisateur || emp.id,
      }),
    });
  } catch (error) {
    console.error('Erreur déconnexion serveur', error);
  }

  localStorage.removeItem('accessToken');
  localStorage.removeItem('employe');
  localStorage.removeItem('idEmploye');
  localStorage.removeItem('permissions');
  localStorage.removeItem('posContext');

  router.replace('/');
}

  return (
    <main className="min-h-screen bg-[#f5f3ea] text-slate-900">
      <header className="border-b border-emerald-100 bg-white">
        <div className="flex flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-700 text-2xl text-white">
              M
            </div>

            <div>
              <h1 className="text-xl font-black text-emerald-900">
                MESSIE MATALA POS
              </h1>
              <p className="text-sm text-slate-500">
                Centre de Commande Général
              </p>
            </div>
          </div>

          <div className="grid gap-3 text-sm md:grid-cols-3">
            <InfoBox
              label="Entreprise / Société"
              value={valeur(context.nomEntreprise, 'Entreprise non définie')}
            />
            <InfoBox
              label="Magasin / Structure"
              value={valeur(context.nomMagasin, 'Magasin non défini')}
            />
            <InfoBox
  label="Dépôt / Poste POS"
  value={`${valeur(context.nomDepot, 'Dépôt non défini')} / ${valeur(
    context.nomPOS,
    'Poste non défini',
  )}`}
/>
          </div>

          <div className="relative">
  <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-2">
    <button
  onClick={() => setShowProfile(!showProfile)}
  className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-emerald-700 font-black text-white"
>
  {photoProfil ? (
    <img
      src={photoProfil}
      alt="Photo profil"
      className="h-full w-full object-cover"
    />
  ) : (
    initiales
  )}
</button>

    <div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowProfile(!showProfile)}
          className="text-left text-sm font-bold hover:text-emerald-800"
        >
          {valeur(nomComplet, 'Utilisateur connecté')}
        </button>

        <Link
          href="/dashboard/profil"
          className="rounded-lg border border-emerald-200 bg-white px-2 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-50"
        >
          Profil
        </Link>
      </div>

      <p className="text-xs text-emerald-700">
        ● Connecté · {valeur(employe.role, 'Rôle non défini')}
      </p>

      <p className="text-[11px] text-slate-500">
        {valeur(compte, 'Compte non défini')}
      </p>
    </div>

    <button
      onClick={() => setShowLogoutConfirm(true)}
      className="rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50"
    >
      Déconnexion
    </button>
  </div>

  {showProfile && (
    <div className="absolute right-0 z-50 mt-3 w-80 rounded-2xl border border-emerald-100 bg-white p-5 shadow-xl">
      <h3 className="text-lg font-black text-emerald-900">
        Informations du profil
      </h3>

      <div className="mt-4 space-y-2 text-sm">
        <p><b>Nom :</b> {valeur(employe.nom)}</p>
        <p><b>Prénom :</b> {valeur(employe.prenom)}</p>
        <p><b>Email :</b> {valeur(employe.email)}</p>
        <p><b>Compte :</b> {valeur(compte)}</p>
        <p><b>Rôle :</b> {valeur(employe.role)}</p>
        <p><b>Statut :</b> {valeur(employe.statut)}</p>
        <p><b>Entreprise :</b> {valeur(context.nomEntreprise)}</p>
        <p><b>Magasin :</b> {valeur(context.nomMagasin)}</p>
        <p><b>Dépôt :</b> {valeur(context.nomDepot)}</p>
        <p><b>Poste POS :</b> {valeur(context.nomPOS)}</p>
      </div>

      <div className="mt-5 flex gap-2">
        <Link
          href="/dashboard/profil"
          className="flex-1 rounded-xl bg-emerald-700 px-4 py-2 text-center text-sm font-bold text-white hover:bg-emerald-800"
        >
          Modifier profil
        </Link>

        <button
          onClick={() => setShowProfile(false)}
          className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
        >
          Fermer
        </button>
      </div>
    </div>
  )}
</div>
      </div>
        <nav className="flex flex-wrap gap-2 border-t border-emerald-50 px-6 py-3">
          <MenuTop active label="Accueil" />
          <MenuTop label="Pôles" />
          <MenuTop label="Modules" />
          <MenuTop label="Rapports" />
          <MenuTop label="Paramètres" />

          <Link
            href="/dashboard/a-propos"
            className="rounded-xl px-4 py-2 text-sm font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-800"
          >
            À Propos
          </Link>
        </nav>
      </header>

      <section className="px-6 py-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-[2rem] border border-emerald-100 bg-gradient-to-r from-white via-[#fffaf0] to-emerald-50 p-8 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-emerald-700">
                  Tableau de bord
                </p>

                <h2 className="mt-3 text-3xl font-black text-slate-950">
                  Bienvenue dans votre espace de gestion
                </h2>

                <p className="mt-3 max-w-3xl text-slate-600">
                  Choisissez un pôle pour afficher ses modules. La page reste légère,
                  claire et agréable avant l’ouverture d’un module détaillé.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <MiniStat label="Pôles" value={poles.length} />
                <MiniStat label="Modules" value={totalModules} />
                <MiniStat label="Supports" value="5" />
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {poles.map((pole) => {
              const active = pole.id === activePoleId;

              return (
                <button
                  key={pole.id}
                  onClick={() => {
                    setActivePoleId(pole.id);
                    setSearch('');
                  }}
                  className={`rounded-[1.6rem] border p-5 text-left transition hover:-translate-y-1 hover:shadow-md ${
                    active
                      ? 'border-emerald-400 bg-emerald-700 text-white shadow-md'
                      : 'border-emerald-100 bg-white text-slate-900'
                  }`}
                >
                  <div
                    className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-3xl ${
                      active ? 'bg-white/20' : 'bg-emerald-50'
                    }`}
                  >
                    {pole.icon}
                  </div>

                  <h3 className="text-lg font-black">{pole.titre}</h3>
                  <p className={active ? 'mt-2 text-sm text-white/80' : 'mt-2 text-sm text-slate-500'}>
                    {pole.desc}
                  </p>

                  <p className={active ? 'mt-4 text-xs font-bold text-white' : 'mt-4 text-xs font-bold text-emerald-700'}>
                    {pole.modules.length} modules
                  </p>
                </button>
              );
            })}
          </div>

          <div className="mt-8 rounded-[2rem] border border-emerald-100 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-emerald-50 p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-xl font-black text-emerald-900">
                  {activePole.icon} Modules — {activePole.titre}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {modulesFiltres.length} module(s) disponible(s)
                </p>
              </div>

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un module..."
                className="w-full rounded-2xl border border-emerald-100 bg-[#faf9f3] px-4 py-3 text-sm outline-none focus:border-emerald-500 md:w-80"
              />
            </div>

            <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
              {modulesFiltres.map((m, index) => (
                <Link
                  key={m.url}
                  href={m.url}
                  className="group rounded-2xl border border-slate-100 bg-[#fffdf7] p-4 transition hover:border-emerald-300 hover:bg-emerald-50"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-sm font-black text-emerald-800">
                      {String(index + 1).padStart(2, '0')}
                    </div>

                    <div>
                      <h4 className="font-black text-slate-900 group-hover:text-emerald-800">
                        {m.titre}
                      </h4>
                      <p className="mt-1 text-sm text-slate-500">{m.desc}</p>
                      <p className="mt-3 text-xs font-bold text-emerald-700">
                        Ouvrir →
                      </p>
                    </div>
                  </div>
                </Link>
              ))}

              {modulesFiltres.length === 0 && (
                <div className="col-span-full rounded-2xl bg-slate-50 p-8 text-center text-slate-500">
                  Aucun module trouvé.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-emerald-100 bg-white px-6 py-4 text-sm text-slate-500">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <p>© 2026 MESSIE MATALA POS</p>
          <p>Web · Mobile · Windows · Mac · Terminal POS</p>
        </div>
      </footer>

      {showLogoutConfirm && (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
    <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
      <h3 className="text-xl font-black text-slate-900">
        Déconnexion
      </h3>

      <p className="mt-3 text-slate-600">
        Voulez-vous vraiment vous déconnecter ?
      </p>

      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={() => setShowLogoutConfirm(false)}
          className="rounded-xl border border-slate-200 px-5 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
        >
          Non
        </button>

        <button
          onClick={deconnecter}
          className="rounded-xl bg-red-600 px-5 py-2 text-sm font-bold text-white hover:bg-red-700"
        >
          Oui
        </button>
      </div>
    </div>
  </div>
)}
    </main>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#f5f3ea] px-4 py-2">
      <p className="text-[11px] font-bold uppercase text-emerald-700">{label}</p>
      <p className="font-black text-slate-900">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-white px-5 py-4 text-center shadow-sm">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black text-emerald-800">{value}</p>
    </div>
  );
}

function MenuTop({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <button
      className={`rounded-xl px-4 py-2 text-sm font-bold ${
        active
          ? 'bg-emerald-700 text-white'
          : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-800'
      }`}
    >
      {label}
    </button>
  );
}