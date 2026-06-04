'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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
  telephone?: string;
  adresse?: string;
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

export default function ProfilPage() {
  const router = useRouter();

  const [employe, setEmploye] = useState<Employe>({});
  const [context, setContext] = useState<PosContext>({});
  const [message, setMessage] = useState('');
  const [photoProfil, setPhotoProfil] = useState('');
  const [voirPhoto, setVoirPhoto] = useState(false);

  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    username: '',
    nomutilisateur: '',
    telephone: '',
    adresse: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('accessToken');

    if (!token) {
      router.replace('/');
      return;
    }

   const empBase = lireJson<Employe>('employe', {});
const empTemp = lireJson<Employe>('employe', {});
const idProfil = empTemp.idutilisateur || empTemp.id || empTemp.email;
const empProfil = lireJson<Employe>(`profilUtilisateur_${idProfil}`, {});

const emp: Employe = {
  ...empBase,
  ...empProfil,
};
    const ctx = lireJson<PosContext>('posContext', {});

    setEmploye(emp);
    setContext(ctx);
    setPhotoProfil(emp.photoProfil || '');

    setForm({
      nom: emp.nom || '',
      prenom: emp.prenom || '',
      email: emp.email || '',
      username: emp.username || '',
      nomutilisateur: emp.nomutilisateur || '',
      telephone: emp.telephone || '',
      adresse: emp.adresse || '',
    });
  }, [router]);

  const nomComplet = `${valeur(form.prenom, '')} ${valeur(form.nom, '')}`.trim();

  const initiales =
    `${valeur(form.prenom?.[0], '')}${valeur(form.nom?.[0], '')}`
      .trim()
      .toUpperCase() || 'U';

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  function choisirPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage('Veuillez choisir une image valide.');
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const imageBase64 = String(reader.result || '');
      setPhotoProfil(imageBase64);
      setMessage('Photo sélectionnée. Cliquez sur Enregistrer pour confirmer.');
    };

    reader.readAsDataURL(file);
  }

  function supprimerPhoto() {
    setPhotoProfil('');
    setMessage('Photo supprimée. Cliquez sur Enregistrer pour confirmer.');
  }

  function enregistrerProfil(e: React.FormEvent) {
  e.preventDefault();

  const nouveauProfil: Employe = {
    ...employe,
    nom: form.nom.trim(),
    prenom: form.prenom.trim(),
    email: form.email.trim(),
    username: form.username.trim(),
    nomutilisateur: form.nomutilisateur.trim(),
    telephone: form.telephone.trim(),
    adresse: form.adresse.trim(),
    photoProfil,
  };

  const employeActuel = lireJson<Employe>('employe', {});

localStorage.setItem(
  'employe',
  JSON.stringify({
    ...employeActuel,
    photoProfil,
  }),
);
  const idProfil = nouveauProfil.idutilisateur || nouveauProfil.id || nouveauProfil.email;
localStorage.setItem(`profilUtilisateur_${idProfil}`, JSON.stringify(nouveauProfil));

  setEmploye(nouveauProfil);
  setMessage('Profil modifié avec succès.');

  setTimeout(() => {
    router.push('/dashboard');
  }, 700);
}

  return (
    <main className="min-h-screen bg-[#f5f3ea] text-slate-900">
      <header className="border-b border-emerald-100 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-emerald-700">
              MESSIE MATALA POS
            </p>
            <h1 className="mt-2 text-2xl font-black text-emerald-900">
              Profil utilisateur
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Visualisation et modification des informations du compte connecté.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="rounded-xl border border-emerald-200 bg-white px-5 py-3 text-sm font-bold text-emerald-700 hover:bg-emerald-50"
          >
            Retour Dashboard
          </Link>
        </div>
      </header>

      <section className="px-6 py-8">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[360px_1fr]">
          <aside className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <label className="relative flex h-28 w-28 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-emerald-700 text-3xl font-black text-white shadow-md hover:ring-4 hover:ring-emerald-200">
                {photoProfil ? (
                  <img
                    src={photoProfil}
                    alt="Photo profil"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initiales
                )}

                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={choisirPhoto}
                />
              </label>

              <p className="mt-3 text-xs font-bold text-slate-500">
                Cliquez sur la photo pour la changer
              </p>

              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {photoProfil && (
                  <>
                    <button
                      type="button"
                      onClick={() => setVoirPhoto(true)}
                      className="rounded-xl border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50"
                    >
                      Voir la photo
                    </button>

                    <button
                      type="button"
                      onClick={supprimerPhoto}
                      className="rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50"
                    >
                      Supprimer
                    </button>
                  </>
                )}
              </div>

              <h2 className="mt-4 text-xl font-black text-slate-900">
                {valeur(nomComplet, 'Utilisateur connecté')}
              </h2>

              <p className="mt-1 text-sm font-bold text-emerald-700">
                {valeur(employe.role, 'Rôle non défini')}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {valeur(employe.email || employe.username || employe.nomutilisateur)}
              </p>
            </div>

            <div className="mt-6 space-y-3 text-sm">
              <InfoLine label="Statut" value={valeur(employe.statut)} />
              <InfoLine label="Entreprise" value={valeur(context.nomEntreprise)} />
              <InfoLine label="Magasin" value={valeur(context.nomMagasin)} />
              <InfoLine label="Dépôt" value={valeur(context.nomDepot)} />
              <InfoLine label="Poste POS" value={valeur(context.nomPOS)} />
            </div>
          </aside>

          <div className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h3 className="text-xl font-black text-emerald-900">
                Modifier mes informations
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Les informations sont enregistrées localement dans le compte connecté.
              </p>
            </div>

            {message && (
              <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                {message}
              </div>
            )}

            <form onSubmit={enregistrerProfil} className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <Champ label="Nom" name="nom" value={form.nom} onChange={handleChange} />
                <Champ label="Prénom" name="prenom" value={form.prenom} onChange={handleChange} />
                <Champ label="Email" name="email" type="email" value={form.email} onChange={handleChange} />
                <Champ label="Nom utilisateur" name="nomutilisateur" value={form.nomutilisateur} onChange={handleChange} />
                <Champ label="Username" name="username" value={form.username} onChange={handleChange} />
                <Champ label="Téléphone" name="telephone" value={form.telephone} onChange={handleChange} />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Adresse
                </label>
                <textarea
                  name="adresse"
                  value={form.adresse}
                  onChange={handleChange}
                  rows={4}
                  className="w-full rounded-2xl border border-emerald-100 bg-[#faf9f3] px-4 py-3 text-sm outline-none focus:border-emerald-500"
                  placeholder="Adresse complète"
                />
              </div>

              <div className="flex flex-col gap-3 border-t border-emerald-50 pt-5 md:flex-row md:justify-end">
                <Link
                  href="/dashboard"
                  className="rounded-xl border border-slate-200 px-5 py-3 text-center text-sm font-bold text-slate-600 hover:bg-slate-50"
                >
                  Annuler
                </Link>

                <button
                  type="submit"
                  className="rounded-xl bg-emerald-700 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-800"
                >
                  Enregistrer les modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {voirPhoto && photoProfil && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4">
          <div className="relative w-full max-w-3xl rounded-[2rem] bg-white p-4 shadow-2xl">
            <button
              onClick={() => setVoirPhoto(false)}
              className="absolute right-4 top-4 rounded-full bg-red-600 px-4 py-2 text-sm font-black text-white hover:bg-red-700"
            >
              Fermer
            </button>

            <div className="mt-10 flex justify-center">
              <img
                src={photoProfil}
                alt="Photo profil agrandie"
                className="max-h-[75vh] w-auto rounded-3xl object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Champ({
  label,
  name,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  name: string;
  value: string;
  type?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </label>

      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        className="w-full rounded-2xl border border-emerald-100 bg-[#faf9f3] px-4 py-3 text-sm outline-none focus:border-emerald-500"
      />
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#f5f3ea] px-4 py-3">
      <p className="text-[11px] font-bold uppercase text-emerald-700">
        {label}
      </p>
      <p className="mt-1 font-black text-slate-900">{value}</p>
    </div>
  );
}