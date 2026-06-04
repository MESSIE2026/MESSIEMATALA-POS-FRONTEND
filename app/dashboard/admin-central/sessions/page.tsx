'use client';

import { useEffect, useMemo, useState } from 'react';

const API = process.env.NEXT_PUBLIC_CENTRAL_API || 'https://messiematala-pos-backend-production.up.railway.app';

type SessionUser = {
  id: number;
  idconnexion: number;
  idutilisateur: number;
  nomutilisateur: string;
  email: string;
  statut: string;
  message?: string;
  deviceid?: string;
  nomappareil?: string;
  systeme?: string;
  navigateur?: string;
  useragent?: string;
  ipadresse?: string;
  ville?: string;
  pays?: string;
  latitude?: string;
  longitude?: string;
  dateconnexion?: string;
  datedeconnexion?: string;

  nom?: string;
  prenom?: string;
  role?: string;
  telephone?: string;
  avatarpath?: string;

  identreprise?: number;
  idmagasin?: number;
  iddepot?: number;
  idposte?: number;

  nomentreprise?: string;
  nommagasin?: string;
  nomdepot?: string;
  nomposte?: string;

  photoProfil?: string;

  dateconnexiontexte?: string;
datedeconnexiontexte?: string;
};

type DetailsUtilisateur = {
  appareils: SessionUser[];
  historique: SessionUser[];
};

type ProfilLocal = {
  email?: string;
  nomutilisateur?: string;
  photoProfil?: string;
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

function valeur(v: any, fallback = '-') {
  if (v === undefined || v === null || String(v).trim() === '') return fallback;
  return String(v);
}

function formatDateLocale(date?: string) {
  if (!date) return '-';

  const valeur = String(date).endsWith('Z')
    ? String(date)
    : `${date}Z`;

  return new Date(valeur).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function actifMaintenant(s: SessionUser) {
  if (s.statut !== 'CONNECTED' || s.datedeconnexion || !s.dateconnexion) {
    return false;
  }

  const diff = Date.now() - new Date(s.dateconnexion).getTime();
  return diff <= 15 * 60 * 1000;
}

function inactif(s: SessionUser) {
  if (s.statut !== 'CONNECTED' || s.datedeconnexion || !s.dateconnexion) {
    return false;
  }

  return !actifMaintenant(s);
}

function deconnecte(s: SessionUser) {
  return s.statut !== 'CONNECTED' || Boolean(s.datedeconnexion);
}

function tempsDepuis(date?: string) {
  if (!date) return 'activité inconnue';

  const diff = Math.max(0, Date.now() - new Date(date).getTime());
  const min = Math.floor(diff / 60000);
  const h = Math.floor(min / 60);
  const j = Math.floor(h / 24);

  if (min < 1) return 'maintenant';
  if (min < 60) return `il y a ${min} min`;
  if (h < 24) return `il y a ${h}h`;
  return `il y a ${j}j`;
}

function statutTexte(s: SessionUser) {
  if (actifMaintenant(s)) return 'Connecté maintenant';
  if (inactif(s)) return `Inactif ${tempsDepuis(s.dateconnexion)}`;
  return 'Déconnecté';
}

function nomAppareilLisible(s: SessionUser) {
  if (s.nomappareil) return s.nomappareil;

  const text = `${s.systeme || ''} ${s.navigateur || ''} ${s.useragent || ''}`.toLowerCase();

  if (text.includes('android')) return 'Téléphone Android';
  if (text.includes('iphone')) return 'iPhone';
  if (text.includes('ipad')) return 'iPad';
  if (text.includes('mac')) return 'Mac';
  if (text.includes('win')) return 'Ordinateur Windows';
  if (text.includes('linux')) return 'Ordinateur Linux';

  return 'Appareil inconnu';
}

function navigateurLisible(s: SessionUser) {
  const text = `${s.navigateur || s.useragent || ''}`.toLowerCase();

  if (text.includes('edg')) return 'Microsoft Edge';
  if (text.includes('chrome')) return 'Google Chrome';
  if (text.includes('firefox')) return 'Mozilla Firefox';
  if (text.includes('safari')) return 'Safari';

  return valeur(s.navigateur || s.useragent);
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionUser[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [details, setDetails] = useState<Record<number, DetailsUtilisateur>>({});
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState<number | null>(null);
  const [filtre, setFiltre] = useState('');
  const [categorie, setCategorie] = useState<'TOUS' | 'ACTIFS' | 'INACTIFS' | 'DECONNECTES'>('TOUS');
  const [ouvert, setOuvert] = useState<number | null>(null);

  async function charger() {
    setLoading(true);

    try {
      const [resSessions, resStats] = await Promise.all([
        fetch(`${API}/connexions-utilisateurs?limit=1000`, { cache: 'no-store' }),
        fetch(`${API}/connexions-utilisateurs/stats`, { cache: 'no-store' }),
      ]);

      const dataSessions = await resSessions.json();
      const dataStats = await resStats.json();

      function profilParUtilisateur(s: SessionUser) {
  const idProfil =
    s.idutilisateur ||
    s.id ||
    s.email ||
    s.nomutilisateur;

  return lireJson<any>(`profilUtilisateur_${idProfil}`, {});
}

      const lignes = Array.isArray(dataSessions) ? dataSessions : [];

      setSessions(
  lignes.map((s: SessionUser) => {
    const profilUser = profilParUtilisateur(s);

    return {
      ...s,
      photoProfil: profilUser.photoProfil || s.photoProfil || s.avatarpath || '',
    };
  }),
);

      setStats(dataStats || null);
    } catch (error) {
      console.error('Erreur chargement sessions', error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }

  async function ouvrirUtilisateur(idutilisateur: number) {
    if (ouvert === idutilisateur) {
      setOuvert(null);
      return;
    }

    setOuvert(idutilisateur);

    if (details[idutilisateur]) return;

    setLoadingDetails(idutilisateur);

    try {
      const res = await fetch(`${API}/connexions-utilisateurs/${idutilisateur}/details`, {
        cache: 'no-store',
      });

      const data = await res.json();

      setDetails((old) => {
  const sessionActuelle = sessions.find((s) => s.idutilisateur === idutilisateur);

  const appareilsBackend = Array.isArray(data?.appareils) ? data.appareils : [];
  const historiqueBackend = Array.isArray(data?.historique) ? data.historique : [];

  return {
    ...old,
    [idutilisateur]: {
      appareils:
        appareilsBackend.length > 0
          ? appareilsBackend
          : sessionActuelle
            ? [sessionActuelle]
            : [],

      historique:
        historiqueBackend.length > 0
          ? historiqueBackend
          : sessionActuelle
            ? [sessionActuelle]
            : [],
    },
  };
});
    } catch (error) {
      console.error('Erreur chargement détails utilisateur', error);
    } finally {
      setLoadingDetails(null);
    }
  }

  useEffect(() => {
    charger();
    const timer = setInterval(charger, 30000);
    return () => clearInterval(timer);
  }, []);

  const sessionsFiltrees = useMemo(() => {
    return sessions.filter((s) => {
      const texte = `${s.nom || ''} ${s.prenom || ''} ${s.email || ''} ${s.nomutilisateur || ''} ${s.nomentreprise || ''} ${s.nommagasin || ''} ${s.nomdepot || ''} ${s.nomposte || ''} ${s.ville || ''} ${s.pays || ''} ${nomAppareilLisible(s)}`.toLowerCase();

      const matchTexte = texte.includes(filtre.toLowerCase());

      const matchCategorie =
        categorie === 'TOUS' ||
        (categorie === 'ACTIFS' && actifMaintenant(s)) ||
        (categorie === 'INACTIFS' && inactif(s)) ||
        (categorie === 'DECONNECTES' && deconnecte(s));

      return matchTexte && matchCategorie;
    });
  }, [sessions, filtre, categorie]);

  const actifs = sessionsFiltrees.filter(actifMaintenant);
  const inactifs = sessionsFiltrees.filter(inactif);
  const deconnectes = sessionsFiltrees.filter(deconnecte);

  return (
    <main className="min-h-screen bg-[#f4f1e8] p-6 text-slate-900">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <section className="rounded-[28px] border border-emerald-100 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-700">
            Administration centrale
          </p>

          <h1 className="mt-2 text-3xl font-black">
            Sessions utilisateurs
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Une seule ligne par compte. Les appareils et l’historique sont visibles dans le détail.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          <StatCard title="Utilisateurs suivis" value={sessionsFiltrees.length} />
<StatCard title="Actifs" value={actifs.length} />
<StatCard title="Inactifs" value={inactifs.length} />
<StatCard title="Déconnectés" value={deconnectes.length} />
<StatCard title="Appareils" value={stats?.appareils_distincts ?? 0} />
<StatCard title="IP distinctes" value={stats?.adresses_ip_distinctes ?? 0} />
        </section>

        <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-[1fr_240px]">
            <input
              value={filtre}
              onChange={(e) => setFiltre(e.target.value)}
              placeholder="Rechercher utilisateur, email, entreprise, magasin, dépôt, poste, appareil..."
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:bg-white"
            />

            <select
              value={categorie}
              onChange={(e) => setCategorie(e.target.value as any)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-emerald-500 focus:bg-white"
            >
              <option value="TOUS">Toutes les catégories</option>
              <option value="ACTIFS">Actifs maintenant</option>
              <option value="INACTIFS">Inactifs</option>
              <option value="DECONNECTES">Déconnectés</option>
            </select>
          </div>
        </section>

        {loading ? (
          <section className="rounded-[24px] bg-white p-10 text-center text-slate-500 shadow-sm">
            Chargement des sessions...
          </section>
        ) : (
          <>
            {(categorie === 'TOUS' || categorie === 'ACTIFS') && (
              <BlocCategorie
                titre="Actifs maintenant"
                couleur="emerald"
                sessions={actifs}
                ouvert={ouvert}
                details={details}
                loadingDetails={loadingDetails}
                onToggle={ouvrirUtilisateur}
              />
            )}

            {(categorie === 'TOUS' || categorie === 'INACTIFS') && (
              <BlocCategorie
                titre="Inactifs"
                couleur="amber"
                sessions={inactifs}
                ouvert={ouvert}
                details={details}
                loadingDetails={loadingDetails}
                onToggle={ouvrirUtilisateur}
              />
            )}

            {(categorie === 'TOUS' || categorie === 'DECONNECTES') && (
              <BlocCategorie
                titre="Déconnectés"
                couleur="red"
                sessions={deconnectes}
                ouvert={ouvert}
                details={details}
                loadingDetails={loadingDetails}
                onToggle={ouvrirUtilisateur}
              />
            )}
          </>
        )}
      </div>
    </main>
  );
}

function BlocCategorie({
  titre,
  couleur,
  sessions,
  ouvert,
  details,
  loadingDetails,
  onToggle,
}: {
  titre: string;
  couleur: 'emerald' | 'amber' | 'red';
  sessions: SessionUser[];
  ouvert: number | null;
  details: Record<number, DetailsUtilisateur>;
  loadingDetails: number | null;
  onToggle: (idutilisateur: number) => void;
}) {
  const color =
    couleur === 'emerald'
      ? 'bg-emerald-50 border-emerald-100 text-emerald-900 text-emerald-700'
      : couleur === 'amber'
        ? 'bg-amber-50 border-amber-100 text-amber-900 text-amber-700'
        : 'bg-red-50 border-red-100 text-red-900 text-red-700';

  return (
    <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
      <div className={`border-b px-6 py-5 ${color}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black">{titre}</h2>
          <span className="rounded-full bg-white px-4 py-2 text-sm font-black">
            {sessions.length}
          </span>
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {sessions.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            Aucun utilisateur dans cette catégorie.
          </div>
        ) : (
          sessions.map((s) => (
            <SessionLine
              key={s.idutilisateur}
              session={s}
              open={ouvert === s.idutilisateur}
              loading={loadingDetails === s.idutilisateur}
              details={details[s.idutilisateur]}
              onToggle={() => onToggle(s.idutilisateur)}
            />
          ))
        )}
      </div>
    </section>
  );
}

function SessionLine({
  session,
  open,
  loading,
  details,
  onToggle,
}: {
  session: SessionUser;
  open: boolean;
  loading: boolean;
  details?: DetailsUtilisateur;
  onToggle: () => void;
}) {
  const fullName =
    `${session.prenom || ''} ${session.nom || ''}`.trim() ||
    session.nomutilisateur ||
    'Utilisateur inconnu';

  const initials =
    `${session.prenom?.[0] || ''}${session.nom?.[0] || ''}`.trim().toUpperCase() ||
    fullName.charAt(0).toUpperCase();

  const avatar = session.photoProfil || session.avatarpath || '';

  const mapsUrl =
    session.latitude && session.longitude
      ? `https://www.google.com/maps?q=${session.latitude},${session.longitude}`
      : session.ville || session.pays
        ? `https://www.google.com/maps/search/${encodeURIComponent(`${session.ville || ''} ${session.pays || ''}`)}`
        : '';

  return (
    <article>
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-slate-50"
      >
        <div className="relative h-14 w-14">
  <div className="h-14 w-14 overflow-hidden rounded-full bg-emerald-700 text-white">
    {avatar ? (
      <img
        src={avatar}
        alt={fullName}
        className="h-full w-full object-cover"
      />
    ) : (
      <div className="flex h-full w-full items-center justify-center font-black">
        {initials}
      </div>
    )}
  </div>

  {actifMaintenant(session) && (
    <div
      className="
        absolute
        bottom-0
        right-0
        h-4
        w-4
        rounded-full
        bg-emerald-500
        border-2
        border-white
        shadow
      "
      title="Connecté"
    />
  )}
</div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-black text-slate-900">
            {fullName}
          </h3>

          <p className="truncate text-sm text-slate-500">
            {session.role || 'Rôle non défini'} · {session.email || session.nomutilisateur}
          </p>

          <p className="mt-1 text-xs font-bold text-slate-400">
            {statutTexte(session)} · {nomAppareilLisible(session)}
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-black ${
            actifMaintenant(session)
              ? 'bg-emerald-100 text-emerald-700'
              : inactif(session)
                ? 'bg-amber-100 text-amber-700'
                : 'bg-red-100 text-red-700'
          }`}
        >
          {statutTexte(session)}
        </span>

        <span className="text-xl font-black text-slate-400">
          {open ? '−' : '+'}
        </span>
      </button>

      {open && (
        <div className="bg-[#fffdf8] px-5 pb-5">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Info label="Téléphone" value={session.telephone} />
            <Info label="Entreprise" value={session.nomentreprise} />
            <Info label="Magasin" value={session.nommagasin} />
            <Info label="Dépôt" value={session.nomdepot} />
            <Info label="Poste POS" value={session.nomposte} />
            <Info label="Appareil actuel" value={nomAppareilLisible(session)} />
            <Info label="Système" value={session.systeme} />
            <Info label="Navigateur" value={navigateurLisible(session)} />
            <Info label="Adresse IP" value={session.ipadresse} />
            <Info label="Ville" value={session.ville} />
            <Info label="Pays" value={session.pays} />
          <Info
  label="Dernière connexion"
  value={formatDateLocale(session.dateconnexion)}
/>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-100 bg-white p-4">
            <h4 className="font-black text-slate-900">
              Appareils utilisés
            </h4>

            {loading ? (
              <p className="mt-3 text-sm text-slate-500">Chargement...</p>
            ) : details?.appareils?.length ? (
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {details.appareils.map((a) => (
                  <div
                    key={`${a.idconnexion}-${a.deviceid || a.nomappareil}`}
                    className="rounded-2xl border border-slate-100 bg-[#faf9f3] p-4"
                  >
                    <p className="font-black text-slate-900">
                      {nomAppareilLisible(a)}
                    </p>
                    <p className="mt-1 text-xs font-bold text-slate-500">
                      {navigateurLisible(a)} · {valeur(a.ipadresse)}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      Dernière activité : {tempsDepuis(a.dateconnexion)}
                    </p>
                    <p className="mt-2 break-words text-[11px] text-slate-400">
                      Device ID : {valeur(a.deviceid)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">Aucun appareil trouvé.</p>
            )}
          </div>

          <div className="mt-5 rounded-2xl border border-slate-100 bg-white p-4">
            <h4 className="font-black text-slate-900">
              Historique récent
            </h4>

            {loading ? (
              <p className="mt-3 text-sm text-slate-500">Chargement...</p>
            ) : details?.historique?.length ? (
              <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100">
                {details.historique.slice(0, 12).map((h) => (
                  <div
                    key={h.idconnexion}
                    className="grid gap-2 border-b border-slate-100 px-4 py-3 text-sm last:border-b-0 md:grid-cols-[180px_160px_1fr]"
                  >
                   <span className="font-bold text-slate-700">
  {formatDateLocale(h.dateconnexion)}
</span>
                    <span className="font-bold text-slate-500">
                      {h.statut}
                    </span>
                    <span className="text-slate-500">
                      {nomAppareilLisible(h)} · {navigateurLisible(h)} · IP {valeur(h.ipadresse)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">Aucun historique trouvé.</p>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-100"
              >
                Voir sur Maps
              </a>
            )}

            <span className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700">
              ID utilisateur : {session.idutilisateur}
            </span>

            <span className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700">
              Device ID : {valeur(session.deviceid)}
            </span>
          </div>
        </div>
      )}
    </article>
  );
}

function StatCard({ title, value }: { title: string; value: any }) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {title}
      </p>
      <h2 className="mt-2 text-3xl font-black text-slate-900">
        {value ?? 0}
      </h2>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: any }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-semibold text-slate-800">
        {valeur(value)}
      </p>
    </div>
  );
}