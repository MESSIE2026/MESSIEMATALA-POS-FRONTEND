'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

const API =
  process.env.NEXT_PUBLIC_CENTRAL_API ||
  'https://messiematala-pos-backend-production.up.railway.app';

type DashboardResume = {
  stats: any;
  derniersComptes: any[];
  derniereLicences?: any[];
  dernieresLicences: any[];
  derniersServeurs: any[];
  dernieresSessions: any[];
  notifications: any[];
  audits: any[];
};

export default function AdminCentralDashboardPage() {
  const [data, setData] = useState<DashboardResume | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  async function charger() {
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch(`${API}/admin-dashboard/resume`, {
        cache: 'no-store',
      });

      const json = await res.json();

      if (!res.ok) {
        setMessage(json?.message || 'Erreur chargement dashboard.');
        return;
      }

      setData(json);
    } catch (error: any) {
      setMessage(error?.message || 'Impossible de joindre le serveur central.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    charger();
    const timer = setInterval(charger, 30000);
    return () => clearInterval(timer);
  }, []);

  const stats = data?.stats || {};

  const licences = useMemo(() => {
    return data?.dernieresLicences || data?.derniereLicences || [];
  }, [data]);

  return (
    <main className="min-h-screen bg-[#f4f1e8] p-6 text-slate-900">
      <div className="mx-auto max-w-[1700px] space-y-6">
        <section className="rounded-[30px] border border-emerald-100 bg-white p-7 shadow-sm">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-700">
                MESSIE MATALA POS
              </p>

              <h1 className="mt-2 text-3xl font-black text-emerald-950">
                Dashboard Admin Central
              </h1>

              <p className="mt-2 max-w-3xl text-sm text-slate-500">
                Supervision générale : comptes, licences, serveurs clients,
                sessions utilisateurs, notifications et audit système.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={charger}
                disabled={loading}
                className="rounded-xl bg-emerald-950 px-5 py-3 text-sm font-black text-white disabled:opacity-60"
              >
                {loading ? 'Chargement...' : 'Actualiser'}
              </button>

              <Link
                href="/dashboard/admin-central/validation-comptes"
                className="rounded-xl bg-amber-500 px-5 py-3 text-sm font-black text-white"
              >
                Comptes en attente
              </Link>

              <Link
                href="/dashboard/admin-central/licences"
                className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-black text-white"
              >
                Licences
              </Link>
            </div>
          </div>
        </section>

        {message && (
          <section className="rounded-2xl bg-red-50 p-4 font-bold text-red-700">
            {message}
          </section>
        )}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-6">
          <StatCard title="Comptes en attente" value={stats.comptesEnAttente} tone="amber" />
          <StatCard title="Comptes approuvés" value={stats.comptesApprouves} tone="emerald" />
          <StatCard title="Licences actives" value={stats.licencesActives} tone="blue" />
          <StatCard title="Licences expirées" value={stats.licencesExpirees} tone="red" />
          <StatCard title="Serveurs actifs" value={stats.serveursActifs} tone="emerald" />
          <StatCard title="Utilisateurs connectés" value={stats.utilisateursConnectes} tone="violet" />
          <StatCard title="Serveurs hors ligne" value={stats.serveursInactifs} tone="red" />
          <StatCard title="Notifications non lues" value={stats.notificationsNonLues} tone="amber" />
          <StatCard title="Audit total" value={stats.auditsTotal} tone="slate" />
          <StatCard title="Licences total" value={stats.licencesTotal} tone="blue" />
          <StatCard title="Serveurs total" value={stats.serveursTotal} tone="slate" />
          <StatCard title="Comptes rejetés" value={stats.comptesRejetes} tone="red" />
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          <ModuleCard
            titre="Validation comptes"
            desc="Approuver ou rejeter les nouveaux comptes utilisateurs."
            href="/dashboard/admin-central/validation-comptes"
            bouton="Ouvrir"
          />

          <ModuleCard
            titre="Licences"
            desc="Créer, renouveler, bloquer et libérer les appareils liés aux licences."
            href="/dashboard/admin-central/licences"
            bouton="Gérer"
          />

          <ModuleCard
            titre="Serveurs clients"
            desc="Voir les serveurs clients, leurs statuts et dernières vérifications."
            href="/dashboard/admin-central/serveurs"
            bouton="Superviser"
          />

          <ModuleCard
            titre="Sessions utilisateurs"
            desc="Voir les utilisateurs connectés, appareils, IP, villes et historique."
            href="/dashboard/admin-central/sessions"
            bouton="Consulter"
          />

          <ModuleCard
  titre="Tentatives de connexion"
  desc="Historique des connexions réussies, échecs de mot de passe, comptes bloqués et IP suspectes."
  href="/dashboard/admin-central/securite/tentatives-connexion"
  bouton="Surveiller"
/>

<ModuleCard
  titre="Appareils approuvés"
  desc="Voir les appareils autorisés à se connecter au système."
  href="/dashboard/admin-central/securite/appareils-approuves"
  bouton="Consulter"
/>

<ModuleCard
  titre="Appareils bloqués"
  desc="Voir et débloquer les appareils interdits de connexion."
  href="/dashboard/admin-central/securite/appareils-bloques"
  bouton="Sécuriser"
/>

<ModuleCard
  titre="Sauvegardes"
  desc="Créer, télécharger, restaurer et superviser les sauvegardes des bases de données."
  href="/dashboard/admin-central/sauvegardes"
  bouton="Ouvrir"
/>

          <ModuleCard
            titre="Notifications"
            desc="Suivre les alertes système, licences, comptes et serveurs."
            href="/dashboard/admin-central/notifications"
            bouton="Voir"
          />

          <ModuleCard
            titre="Audit"
            desc="Historique complet des actions sensibles du système central."
            href="/dashboard/admin-central/audit"
            bouton="Contrôler"
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <TableBloc
  title="Derniers comptes"
  columns={['Nom', 'Email', 'Rôle', 'Statut']}
  rows={data?.derniersComptes || []}
  render={(u: any) => [
    `${u.nom || ''} ${u.prenom || ''}`.trim() || u.nomutilisateur || '-',
    u.email || '-',
    u.role || '-',
    u.statut || '-',
  ]}
/>
          <TableBloc title="Dernières licences" columns={['Client', 'Plan', 'Statut', 'Expire']} rows={licences}
           render={(l: any) => [
              l.clientname || '-',
              l.plan || '-',
              l.active ? 'Active' : 'Bloquée',
              formatDate(l.expiresat),
            ]}
          />

          <TableBloc title="Serveurs clients" columns={['Client', 'Serveur', 'Statut', 'Vérification']} rows={data?.derniersServeurs || []}
            render={(s: any) => [
              s.nomclient || '-',
              s.serverurl || '-',
              s.actif ? 'Actif' : 'Hors ligne',
              formatDate(s.derniereverification),
            ]}
          />

          <TableBloc title="Sessions récentes" columns={['Utilisateur', 'Email', 'Statut', 'Connexion']} rows={data?.dernieresSessions || []}
            render={(s: any) => [
              s.nomutilisateur || '-',
              s.email || '-',
              s.statut || '-',
              formatDate(s.dateconnexion),
            ]}
          />

          <TableBloc title="Notifications récentes" columns={['Titre', 'Type', 'Lu', 'Date']} rows={data?.notifications || []}
           render={(n: any) => [
              n.titre || '-',
              n.type || '-',
              n.lu ? 'Oui' : 'Non',
              formatDate(n.createdat),
            ]}
          />

          <TableBloc title="Audit récent" columns={['Action', 'Module', 'Utilisateur', 'Date']} rows={data?.audits || []}
           render={(a: any) => [
              a.action || '-',
              a.module || '-',
              a.utilisateur || '-',
              formatDate(a.createdat),
            ]}
          />
        </section>
      </div>
    </main>
  );
}

function StatCard({ title, value, tone }: any) {
  const styles: any = {
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-800',
    amber: 'border-amber-100 bg-amber-50 text-amber-800',
    blue: 'border-blue-100 bg-blue-50 text-blue-800',
    red: 'border-red-100 bg-red-50 text-red-800',
    violet: 'border-violet-100 bg-violet-50 text-violet-800',
    slate: 'border-slate-200 bg-white text-slate-900',
  };

  return (
    <div className={`rounded-[24px] border p-5 shadow-sm ${styles[tone] || styles.slate}`}>
      <p className="text-xs font-black uppercase tracking-wide opacity-70">
        {title}
      </p>
      <h2 className="mt-3 text-3xl font-black">
        {value ?? 0}
      </h2>
    </div>
  );
}

function ModuleCard({ titre, desc, href, bouton }: any) {
  return (
    <div className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-black text-emerald-950">
        {titre}
      </h2>

      <p className="mt-2 min-h-[44px] text-sm text-slate-500">
        {desc}
      </p>

      <Link
        href={href}
        className="mt-5 inline-flex rounded-xl bg-emerald-950 px-5 py-3 text-sm font-black text-white"
      >
        {bouton}
      </Link>
    </div>
  );
}

function TableBloc({ title, columns, rows, render }: any) {
  return (
    <section className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm">
      <div className="border-b bg-slate-50 px-5 py-4">
        <h2 className="font-black text-slate-900">
          {title}
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[650px] text-left text-sm">
          <thead>
            <tr className="border-b text-xs uppercase tracking-wide text-slate-500">
              {columns.map((c: string) => (
                <th key={c} className="px-4 py-3 font-black">
                  {c}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-500">
                  Aucune donnée.
                </td>
              </tr>
            )}

            {rows.map((row: any, index: number) => {
              const values = render(row);

              return (
                <tr key={index} className="border-b last:border-b-0 hover:bg-slate-50">
                  {values.map((v: any, i: number) => (
                    <td key={i} className="max-w-[260px] truncate px-4 py-3">
                      {v || '-'}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function formatDate(date?: string | null) {
  if (!date) return '-';

  try {
    return new Date(date).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
}