'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  CalendarDays,
  ChevronRight,
  GraduationCap,
  Layers3,
  LogOut,
  LucideIcon,
  Megaphone,
  Menu,
  Monitor,
  Package,
  Search,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Store,
  User,
  Users,
  WalletCards,
  X,
} from 'lucide-react';

type ModuleItem = {
  titre: string;
  desc: string;
  url: string;
};

type Pole = {
  id: string;
  titre: string;
  desc: string;
  icon: LucideIcon;
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
    icon: ShoppingCart,
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
  icon: Package,
  modules: [
    { titre: 'Stock', desc: 'Mouvements et inventaires', url: '/dashboard/stock' },
    { titre: 'Inventaire', desc: 'Inventaire manuel et scanner', url: '/dashboard/inventaire' },
    { titre: 'Inventaire Scanner', desc: 'Inventaire par scanner', url: '/dashboard/inventaire-scanner' },
    { titre: 'Opérations Stock', desc: 'Entrées, sorties et journal stock', url: '/dashboard/operations-stock' },
    { titre: 'Réception', desc: 'Réception fournisseur et dépôt', url: '/dashboard/reception' },
    { titre: 'Alertes Stock', desc: 'Centre notifications stock', url: '/dashboard/alertes-stock' },

{
  titre: 'Alertes Stock & Expiration',
  desc: 'Lots, dates expiration, produits expirés et alertes 30/60/90 jours',
  url: '/dashboard/alertes-stock-expiration',
},
    { titre: 'Stock Avancé', desc: 'Contrôle avancé des dépôts', url: '/dashboard/stock-avance' },

    { titre: 'Fournisseurs', desc: 'Fournisseurs, achats et commandes', url: '/dashboard/fournisseurs' },

    {
      titre: 'Catalogue Fournisseur',
      desc: 'Prix d’achat, produits liés aux fournisseurs et délais',
      url: '/dashboard/catalogue-fournisseur',
    },

    {
      titre: 'Bon Commande',
      desc: 'Bons de commande fournisseurs',
      url: '/dashboard/bon-commande',
    },

    {
      titre: 'Facture Fournisseur',
      desc: 'Factures fournisseurs et dettes',
      url: '/dashboard/facture-fournisseur',
    },

    {
      titre: 'Paiements Fournisseur',
      desc: 'Paiements fournisseurs, règlements et soldes',
      url: '/dashboard/paiements-fournisseur',
    },
  ],
},
  {
    id: 'finance',
    titre: 'Finance',
    desc: 'Caisse, dépenses, comptabilité',
    icon: WalletCards,
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
    icon: ShieldCheck,
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
  titre: 'Sauvegardes Serveurs Clients',
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
{ titre: 'Backups Administration Centrale', desc: 'Gestion des backups du système central', url: '/dashboard/admin-central/backups' },
    ],
  },
  {
    id: 'academic',
    titre: 'ZAIRE Academic',
    desc: 'École, étudiants, notes, bulletins',
    icon: GraduationCap,
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
    icon: Building2,
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
    icon: CalendarDays,
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
    icon: Megaphone,
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
    icon: Users,
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
    icon: Settings,
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
  const ActivePoleIcon = activePole.icon;

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
    <main className="min-h-screen bg-[#F7F6F0] text-[#172033]">
      <header className="sticky top-0 z-40 border-b border-[#DDE8DF] bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-20 max-w-[1600px] items-center gap-3 px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#DDE8DF] text-[#166534] lg:hidden"
            aria-label="Ouvrir les pôles"
          >
            <Menu size={22} />
          </button>

          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#166534] font-black text-white shadow-sm">
              MM
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-black tracking-wide text-[#064E3B] sm:text-base">
                MESSIE MATALA POS
              </h1>
              <p className="hidden text-xs text-[#64748B] sm:block">
                Centre de commande général
              </p>
            </div>
          </div>

          <div className="ml-auto hidden min-w-0 flex-1 items-center justify-center gap-2 xl:flex">
            <ContextBadge icon={Building2} label="Entreprise" value={valeur(context.nomEntreprise, 'Non définie')} />
            <ContextBadge icon={Store} label="Magasin" value={valeur(context.nomMagasin, 'Non défini')} />
            <ContextBadge icon={Monitor} label="Poste POS" value={valeur(context.nomPOS, 'Non défini')} />
          </div>

          <div className="relative ml-auto xl:ml-0">
            <button
              type="button"
              onClick={() => setShowProfile((visible) => !visible)}
              className="flex items-center gap-3 rounded-xl border border-[#DDE8DF] bg-white p-1.5 pr-2 transition hover:bg-emerald-50"
              aria-expanded={showProfile}
            >
              <Avatar photo={photoProfil} initiales={initiales} />
              <div className="hidden max-w-44 text-left md:block">
                <p className="truncate text-sm font-bold text-[#172033]">
                  {valeur(nomComplet, 'Utilisateur connecté')}
                </p>
                <p className="truncate text-xs text-[#64748B]">
                  {valeur(employe.role, 'Rôle non défini')}
                </p>
              </div>
            </button>

            {showProfile && (
              <ProfileMenu
                employe={employe}
                context={context}
                compte={compte}
                onClose={() => setShowProfile(false)}
                onLogout={() => setShowLogoutConfirm(true)}
              />
            )}
          </div>
        </div>

        <div className="border-t border-[#DDE8DF] px-4 py-2 xl:hidden sm:px-6">
          <div className="mx-auto flex max-w-[1600px] gap-2 overflow-x-auto">
            <CompactContext label="Entreprise" value={valeur(context.nomEntreprise, 'Non définie')} />
            <CompactContext label="Magasin" value={valeur(context.nomMagasin, 'Non défini')} />
            <CompactContext label="Poste" value={valeur(context.nomPOS, 'Non défini')} />
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1600px]">
        {sidebarOpen && (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Fermer les pôles"
          />
        )}

        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-[290px] flex-col border-r border-[#DDE8DF] bg-white transition-transform duration-200 lg:sticky lg:top-20 lg:z-20 lg:h-[calc(100vh-5rem)] lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between border-b border-[#DDE8DF] p-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#166534]">Navigation</p>
              <h2 className="mt-1 text-lg font-black text-[#172033]">Pôles de gestion</h2>
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-[#64748B] hover:bg-slate-100 lg:hidden"
              aria-label="Fermer"
            >
              <X size={21} />
            </button>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto p-3">
            {poles.map((pole) => {
              const PoleIcon = pole.icon;
              const active = pole.id === activePoleId;

              return (
                <button
                  type="button"
                  key={pole.id}
                  onClick={() => {
                    setActivePoleId(pole.id);
                    setSearch('');
                    setSidebarOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                    active
                      ? 'bg-[#166534] text-white shadow-sm'
                      : 'text-[#475569] hover:bg-emerald-50 hover:text-[#064E3B]'
                  }`}
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    active ? 'bg-white/15' : 'bg-[#F0F7F2] text-[#166534]'
                  }`}>
                    <PoleIcon size={20} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">{pole.titre}</span>
                    <span className={`block text-xs ${active ? 'text-white/70' : 'text-[#64748B]'}`}>
                      {pole.modules.length} modules
                    </span>
                  </span>
                  <ChevronRight size={17} className={active ? 'text-white' : 'text-slate-300'} />
                </button>
              );
            })}
          </nav>

          <div className="border-t border-[#DDE8DF] p-4">
            <div className="rounded-xl bg-[#F7F6F0] p-3 text-xs text-[#64748B]">
              <p className="font-bold text-[#172033]">Plateformes compatibles</p>
              <p className="mt-1">Mobile · Web · Windows · Terminal POS</p>
            </div>
          </div>
        </aside>

        <section className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="rounded-2xl border border-[#DDE8DF] bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#166534]">Tableau de bord</p>
                <h2 className="mt-2 text-2xl font-black text-[#172033] sm:text-3xl">
                  Bonjour{employe.prenom ? `, ${employe.prenom}` : ''}
                </h2>
                <p className="mt-2 text-sm text-[#64748B] sm:text-base">
                  Voici un aperçu de votre espace de gestion.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard icon={Layers3} label="Pôles" value={poles.length} />
                <StatCard icon={Package} label="Modules" value={totalModules} />
                <StatCard icon={Store} label="Magasin" value={context.nomMagasin ? 'Actif' : 'À configurer'} />
                <StatCard icon={Monitor} label="Poste POS" value={context.nomPOS ? 'Actif' : 'À configurer'} />
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-[#DDE8DF] bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-[#DDE8DF] p-5 sm:p-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F0F7F2] text-[#166534]">
                  <ActivePoleIcon size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#172033] sm:text-xl">{activePole.titre}</h3>
                  <p className="text-sm text-[#64748B]">
                    {modulesFiltres.length} module{modulesFiltres.length > 1 ? 's' : ''} disponible{modulesFiltres.length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <label className="relative block w-full md:w-80">
                <Search
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B]"
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Rechercher un module…"
                  className="h-11 w-full rounded-xl border border-[#DDE8DF] bg-[#F7F6F0] pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#166534] focus:ring-2 focus:ring-emerald-100"
                />
              </label>
            </div>

            <div className="grid gap-4 p-4 sm:p-6 md:grid-cols-2 2xl:grid-cols-3">
              {modulesFiltres.map((module) => (
                <Link
                  key={module.url}
                  href={module.url}
                  className="group flex min-h-36 items-start gap-4 rounded-2xl border border-[#DDE8DF] bg-white p-5 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-200"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F0F7F2] text-[#166534] transition group-hover:bg-[#166534] group-hover:text-white">
                    <ActivePoleIcon size={21} />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col self-stretch">
                    <h4 className="line-clamp-2 font-bold text-[#172033] group-hover:text-[#166534]">
                      {module.titre}
                    </h4>
                    <p className="mt-1 line-clamp-2 text-sm leading-5 text-[#64748B]">{module.desc}</p>
                    <span className="mt-auto flex items-center gap-1 pt-3 text-xs font-bold text-[#166534]">
                      Accéder au module <ChevronRight size={15} />
                    </span>
                  </div>
                </Link>
              ))}

              {modulesFiltres.length === 0 && (
                <div className="col-span-full rounded-2xl border border-dashed border-[#DDE8DF] bg-[#F7F6F0] p-10 text-center">
                  <Search className="mx-auto text-slate-300" size={28} />
                  <p className="mt-3 font-bold text-[#172033]">Aucun module trouvé</p>
                  <p className="mt-1 text-sm text-[#64748B]">Essayez un autre mot-clé.</p>
                </div>
              )}
            </div>
          </div>

          <footer className="flex flex-col gap-2 px-1 pb-2 pt-6 text-xs text-[#64748B] sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 MESSIE MATALA POS</p>
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1"><Smartphone size={14} /> Mobile</span>
              <span className="flex items-center gap-1"><Monitor size={14} /> Web & Windows</span>
              <span className="flex items-center gap-1"><ShoppingCart size={14} /> Terminal POS</span>
            </div>
          </footer>
        </section>
      </div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-[#DC2626]">
              <LogOut size={22} />
            </div>
            <h3 className="mt-4 text-xl font-black text-[#172033]">Déconnexion</h3>
            <p className="mt-2 text-[#64748B]">Voulez-vous vraiment vous déconnecter de votre session ?</p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="rounded-xl border border-[#DDE8DF] px-5 py-2.5 text-sm font-bold text-[#475569] hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={deconnecter}
                className="rounded-xl bg-[#DC2626] px-5 py-2.5 text-sm font-bold text-white hover:bg-red-700"
              >
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function ContextBadge({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 max-w-52 items-center gap-2 rounded-xl bg-[#F7F6F0] px-3 py-2">
      <Icon size={16} className="shrink-0 text-[#166534]" />
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wide text-[#64748B]">{label}</p>
        <p className="truncate text-xs font-bold text-[#172033]">{value}</p>
      </div>
    </div>
  );
}

function CompactContext({ label, value }: { label: string; value: string }) {
  return (
    <div className="shrink-0 rounded-lg bg-[#F7F6F0] px-3 py-1.5 text-xs">
      <span className="font-bold text-[#166534]">{label} :</span>{' '}
      <span className="text-[#475569]">{value}</span>
    </div>
  );
}

function Avatar({ photo, initiales }: { photo: string; initiales: string }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#166534] text-sm font-black text-white">
      {photo ? <img src={photo} alt="Photo de profil" className="h-full w-full object-cover" /> : initiales}
    </span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
}) {
  return (
    <div className="min-w-28 rounded-xl border border-[#DDE8DF] bg-[#F7F6F0] p-3">
      <div className="flex items-center gap-2 text-[#166534]">
        <Icon size={16} />
        <p className="text-[11px] font-bold uppercase tracking-wide">{label}</p>
      </div>
      <p className="mt-2 truncate text-base font-black text-[#172033]">{value}</p>
    </div>
  );
}

function ProfileMenu({
  employe,
  context,
  compte,
  onClose,
  onLogout,
}: {
  employe: Employe;
  context: PosContext;
  compte?: string;
  onClose: () => void;
  onLogout: () => void;
}) {
  return (
    <div className="absolute right-0 z-50 mt-3 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-[#DDE8DF] bg-white p-5 shadow-xl">
      <div className="flex items-center justify-between">
        <h3 className="font-black text-[#172033]">Profil utilisateur</h3>
        <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-[#64748B] hover:bg-slate-100">
          <X size={18} />
        </button>
      </div>

      <div className="mt-4 grid gap-3 rounded-xl bg-[#F7F6F0] p-4 text-sm">
        <ProfileRow label="Nom complet" value={`${valeur(employe.prenom, '')} ${valeur(employe.nom, '')}`.trim() || 'Non défini'} />
        <ProfileRow label="Compte" value={valeur(compte)} />
        <ProfileRow label="Rôle" value={valeur(employe.role)} />
        <ProfileRow label="Entreprise" value={valeur(context.nomEntreprise)} />
        <ProfileRow label="Magasin" value={valeur(context.nomMagasin)} />
        <ProfileRow label="Dépôt" value={valeur(context.nomDepot)} />
        <ProfileRow label="Poste POS" value={valeur(context.nomPOS)} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Link
          href="/dashboard/profil"
          onClick={onClose}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#166534] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#064E3B]"
        >
          <User size={17} /> Mon profil
        </Link>
        <button
          type="button"
          onClick={() => {
            onClose();
            onLogout();
          }}
          className="flex items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-bold text-[#DC2626] hover:bg-red-50"
        >
          <LogOut size={17} /> Déconnexion
        </button>
      </div>
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[6.5rem_1fr] gap-2">
      <span className="text-[#64748B]">{label}</span>
      <span className="break-words text-right font-bold text-[#172033]">{value}</span>
    </div>
  );
}