'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getClientApi,
  getDeviceId,
  setClientApi,
} from '@/lib/api-config';

const CENTRAL_API =
  'https://messiematala-pos-backend-production.up.railway.app';

type Mode = 'CHECKING' | 'LICENCE' | 'LOGIN' | 'REGISTER' | 'FORGOT';

function LoginInput({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  inputRef,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  inputRef?: React.Ref<HTMLInputElement>;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold uppercase tracking-[0.22em] text-emerald-900">
        {label}
      </label>

      <input
        ref={inputRef}
        type={type}
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full border-b-2 border-emerald-900/30 bg-transparent px-2 py-3 text-center text-sm font-bold text-slate-800 outline-none placeholder:text-slate-400 focus:border-emerald-800"
      />
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<Mode>('CHECKING');
  const [deviceId, setDeviceId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [secondesRestantes, setSecondesRestantes] = useState(0);
  const [rememberMe, setRememberMe] = useState(true);

  const [licence, setLicence] = useState({
    clelicence: '',
    identreprise: 1,
    idmagasin: 1,
    iddepot: 4,
    idposte: 1,
  });

  const [login, setLogin] = useState({
    username: '',
    password: '',
  });

  const [register, setRegister] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    nomutilisateur: '',
    password: '',
    confirmPassword: '',
  });

  const [forgot, setForgot] = useState({
    email: '',
    code: '',
    newPassword: '',
    confirmPassword: '',
    codeSent: false,
  });

  useEffect(() => {
    const id = getDeviceId();
    setDeviceId(id);

    setLogin({
      username: localStorage.getItem('ZAIRE_LAST_USERNAME') || '',
      password: '',
    });

    setLicence({
      clelicence: localStorage.getItem('messie_licence') || '',
      identreprise: Number(localStorage.getItem('ZAIRE_ID_ENTREPRISE') || 1),
      idmagasin: Number(localStorage.getItem('ZAIRE_ID_MAGASIN') || 1),
      iddepot: Number(localStorage.getItem('ZAIRE_ID_DEPOT') || 4),
      idposte: Number(localStorage.getItem('ZAIRE_ID_POSTE') || 1),
    });

    setRememberMe(localStorage.getItem('ZAIRE_REMEMBER_ME') !== 'false');
    setMode(getClientApi() ? 'LOGIN' : 'LICENCE');
  }, []);


  useEffect(() => {
  const timer = setInterval(() => {
    const bloqueJusqua =
      localStorage.getItem('LOGIN_BLOQUE_JUSQUA');

    if (!bloqueJusqua) {
      setSecondesRestantes(0);
      return;
    }

    const reste = Math.max(
      0,
      Math.ceil(
        (new Date(bloqueJusqua).getTime() - Date.now()) / 1000,
      ),
    );

    setSecondesRestantes(reste);

    if (reste <= 0) {
      localStorage.removeItem('LOGIN_BLOQUE_JUSQUA');
      setMessage('');
    }
  }, 1000);

  return () => clearInterval(timer);
}, []);

  async function lireReponse(res: Response) {
    const texte = await res.text();
    try {
      return texte ? JSON.parse(texte) : null;
    } catch {
      return texte;
    }
  }

  function getClientInfo() {
  return {
    deviceid: deviceId || getDeviceId(),
    systeme: navigator.platform,
    navigateur: navigator.userAgent,
    ville: localStorage.getItem('ZAIRE_VILLE') || 'Kinshasa',
    pays: localStorage.getItem('ZAIRE_PAYS') || 'RDC',
  };
}

  async function connecter(usernameParam?: string, passwordParam?: string) {
  setMessage('');

  const CLIENT_API = getClientApi();

  if (!CLIENT_API) {
    setMessage('Veuillez d’abord configurer la licence.');
    setMode('LICENCE');
    return;
  }

 const username = String(usernameParam ?? login.username ?? '').trim();
const password = String(passwordParam ?? login.password ?? '').trim();

  if (!username || !password) {
    setMessage('Nom utilisateur et mot de passe obligatoires.');
    return;
  }

  setLoading(true);

  try {
    const res = await fetch(`${CLIENT_API}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-messie-device-id': deviceId || getDeviceId(),
      },
      body: JSON.stringify({
        username,
        password,
        ...getClientInfo(),
      }),
    });

    const data = await lireReponse(res);

    if (!res.ok) {
  const bloqueJusqua =
    data?.message?.bloqueJusqua ||
    data?.bloqueJusqua ||
    null;

  if (bloqueJusqua) {
    localStorage.setItem('LOGIN_BLOQUE_JUSQUA', bloqueJusqua);
  }

  setMessage(
    typeof data?.message === 'string'
      ? data.message
      : data?.message?.message || 'Connexion refusée.',
  );

  return;
}

    if (!data?.accessToken) {
      setMessage('Connexion refusée : token manquant.');
      return;
    }

    if (rememberMe) {
      localStorage.setItem('ZAIRE_LAST_USERNAME', username);
      localStorage.setItem('ZAIRE_REMEMBER_ME', 'true');
    } else {
      localStorage.removeItem('ZAIRE_LAST_USERNAME');
      localStorage.setItem('ZAIRE_REMEMBER_ME', 'false');
    }

    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('employe', JSON.stringify(data.user || {}));
    localStorage.setItem('idEmploye', String(data.user?.id || ''));
    localStorage.setItem('permissions', JSON.stringify(data.permissions || []));
    localStorage.setItem(
  'modulesAutorises',
  JSON.stringify(data.modulesAutorises || []),
);
    localStorage.setItem('posContext', JSON.stringify(data.context || {}));

    router.push('/dashboard');
  } catch (error) {
    console.error(error);
    setMessage('Erreur réseau avec le serveur client.');
  } finally {
    setLoading(false);
  }
}

  async function verifierLicence() {
    setMessage('');

    if (!licence.clelicence.trim()) {
      setMessage('Clé licence obligatoire.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${CENTRAL_API}/licence/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clelicence: licence.clelicence.trim(),
          deviceid: deviceId || getDeviceId(),
          identreprise: licence.identreprise,
          idmagasin: licence.idmagasin,
          iddepot: licence.iddepot,
          idposte: licence.idposte,
        }),
      });

      const data = await lireReponse(res);

      if (!res.ok || !data?.valid) {
        setMessage(data?.message || 'Licence invalide.');
        return;
      }

      if (!data.serverurl) {
        setMessage('Licence valide, mais serverurl client manquant.');
        return;
      }

      setClientApi(data.serverurl);

      localStorage.setItem('messie_licence', licence.clelicence.trim());
      localStorage.setItem('messie_client_name', data.clientName || '');
      localStorage.setItem('messie_plan', data.plan || '');
      localStorage.setItem('ZAIRE_ID_ENTREPRISE', String(licence.identreprise));
      localStorage.setItem('ZAIRE_ID_MAGASIN', String(licence.idmagasin));
      localStorage.setItem('ZAIRE_ID_DEPOT', String(licence.iddepot));
      localStorage.setItem('ZAIRE_ID_POSTE', String(licence.idposte));

      setMessage('Licence validée. Serveur client configuré.');
      setMode('LOGIN');
    } catch {
      setMessage('Erreur réseau avec le serveur central.');
    } finally {
      setLoading(false);
    }
  }

  async function creerCompteCentral() {
  setMessage('');

  if (
    !register.nom.trim() ||
    !register.email.trim() ||
    !register.nomutilisateur.trim() ||
    !register.password.trim()
  ) {
    setMessage('Nom, email, nom utilisateur et mot de passe obligatoires.');
    return;
  }

  if (register.password !== register.confirmPassword) {
    setMessage('Les mots de passe ne correspondent pas.');
    return;
  }

  setLoading(true);

  try {
    const API =
      'https://messiematala-pos-backend-production.up.railway.app';

    const url = `${API}/auth/register`;

    console.log('REGISTER URL =', url);

    const res = await fetch(url, {
      method: 'POST',
      cache: 'no-store',
      mode: 'cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nom: register.nom.trim(),
        prenom: register.prenom.trim(),
        email: register.email.trim(),
        telephone: register.telephone.trim(),
        nomutilisateur: register.nomutilisateur.trim(),
        password: register.password,
        source: 'MESSIE_MATALA_POS_CLIENT_APP',
        ...getClientInfo(),
      }),
    });

    const data = await lireReponse(res);

    console.log('REGISTER RESPONSE =', data);

    if (!res.ok) {
      setMessage(data?.message || 'Demande de compte impossible.');
      return;
    }

    setMessage(data?.message || 'Demande envoyée au serveur central.');
    setMode('LOGIN');
  } catch (error: any) {
    console.error('REGISTER ERROR =', error);
    setMessage(error?.message || 'Erreur réseau avec le serveur central.');
  } finally {
    setLoading(false);
  }
}

  async function envoyerCodeMotDePasse() {
    setMessage('');

    const CLIENT_API = getClientApi();

    if (!CLIENT_API) {
      setMessage('Veuillez d’abord configurer la licence.');
      setMode('LICENCE');
      return;
    }

    if (!forgot.email.trim()) {
      setMessage('Adresse email obligatoire.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${CLIENT_API}/auth/forgot-password/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgot.email.trim() }),
      });

      const data = await lireReponse(res);

      if (!res.ok) {
        setMessage(data?.message || 'Impossible d’envoyer le code.');
        return;
      }

      setForgot((p) => ({ ...p, codeSent: true }));
      setMessage('Code de confirmation envoyé par email.');
    } catch {
      setMessage('Erreur réseau avec le serveur client.');
    } finally {
      setLoading(false);
    }
  }

  async function modifierMotDePasse() {
    setMessage('');

    const CLIENT_API = getClientApi();

    if (!forgot.email.trim() || !forgot.code.trim() || !forgot.newPassword.trim()) {
      setMessage('Email, code et nouveau mot de passe obligatoires.');
      return;
    }

    if (forgot.newPassword !== forgot.confirmPassword) {
      setMessage('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${CLIENT_API}/auth/forgot-password/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgot.email.trim(),
          code: forgot.code.trim(),
          newPassword: forgot.newPassword,
        }),
      });

      const data = await lireReponse(res);

      if (!res.ok) {
        setMessage(data?.message || 'Modification impossible.');
        return;
      }

      setMessage('Mot de passe modifié avec succès.');
      setMode('LOGIN');
      setForgot({
        email: '',
        code: '',
        newPassword: '',
        confirmPassword: '',
        codeSent: false,
      });
    } catch {
      setMessage('Erreur réseau avec le serveur client.');
    } finally {
      setLoading(false);
    }
  }

  if (mode === 'CHECKING') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 text-emerald-950">
        Chargement MESSIE MATALA POS...
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <section className="relative w-full max-w-md overflow-hidden rounded-[28px] bg-white text-slate-800 shadow-2xl ring-1 ring-slate-200">
        <div className="h-32 bg-emerald-950" />

        <div className="absolute left-7 top-7 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-xl text-white ring-1 ring-white/20">
          👑
        </div>

        <div className="-mt-16 flex justify-center">
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-white shadow-xl ring-8 ring-white">
            <span className="text-5xl text-emerald-900">👤</span>
          </div>
        </div>

        <div className="px-10 pb-10 pt-8">
          <div className="text-center">
            <h1 className="text-3xl font-black tracking-wide text-emerald-950">
              MESSIE MATALA POS
            </h1>
            <p className="mt-2 text-xs uppercase tracking-[0.25em] text-slate-500">
              Caisse • Stock • Ventes
            </p>
          </div>

          {message && (
            <div className="mt-6 rounded-2xl bg-emerald-950 px-4 py-3 text-center text-sm font-semibold text-white">
              {message}
            </div>
          )}

          {secondesRestantes > 0 && (
  <div className="mt-3 rounded-2xl bg-red-600 px-4 py-3 text-center text-sm font-bold text-white">
    Compte bloqué. Réessayez dans{' '}
    {Math.floor(secondesRestantes / 60)} min {secondesRestantes % 60} sec.
  </div>
)}

        {mode === 'LOGIN' && (
  <form
    className="mt-8 space-y-6"
    onSubmit={(e) => {
      e.preventDefault();
      connecter();
    }}
  >
    <LoginInput
      label="Username"
      value={login.username}
      onChange={(v) =>
        setLogin((p) => ({
          ...p,
          username: v,
        }))
      }
      placeholder="Nom utilisateur"
    />

    <LoginInput
      label="Password"
      type="password"
      value={login.password}
      onChange={(v) =>
        setLogin((p) => ({
          ...p,
          password: v,
        }))
      }
      placeholder="Mot de passe"
    />

    <button
      type="submit"
      disabled={loading}
      className="w-full rounded-xl bg-emerald-950 py-3 text-sm font-bold uppercase tracking-widest text-white shadow-lg hover:bg-emerald-900 disabled:opacity-60"
    >
      {loading ? 'Connexion...' : 'Sign In'}
    </button>

    <div className="flex items-center justify-between text-xs text-slate-600">
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
          className="accent-emerald-900"
        />
        Remember me
      </label>

      <button
        type="button"
        onClick={() => {
          setMessage('');
          setMode('FORGOT');
        }}
        className="font-semibold text-emerald-900 underline"
      >
        Forgot password?
      </button>
    </div>

    <div className="pt-6 text-center text-xs text-slate-600">
      <p>Not a member?</p>

      <button
        type="button"
        onClick={() => setMode('REGISTER')}
        className="mt-2 rounded-full border border-emerald-900 px-8 py-2 font-semibold text-emerald-950 hover:bg-emerald-50"
      >
        Create account
      </button>
    </div>

    <button
      type="button"
      onClick={() => setMode('LICENCE')}
      className="w-full text-xs font-bold text-emerald-900 underline"
    >
      Configurer / changer licence
    </button>
  </form>
)}

          {mode === 'FORGOT' && (
            <div className="mt-8 space-y-5">
              <LoginInput
                label="Email"
                type="email"
                value={forgot.email}
                onChange={(v) => setForgot((p) => ({ ...p, email: v }))}
                placeholder="email@exemple.com"
              />

              {!forgot.codeSent ? (
                <button
                  onClick={envoyerCodeMotDePasse}
                  disabled={loading}
                  className="w-full rounded-xl bg-emerald-950 py-3 text-sm font-bold uppercase tracking-widest text-white shadow-lg hover:bg-emerald-900 disabled:opacity-60"
                >
                  {loading ? 'Envoi...' : 'Envoyer le code'}
                </button>
              ) : (
                <>
                  <LoginInput
                    label="Code confirmation"
                    value={forgot.code}
                    onChange={(v) => setForgot((p) => ({ ...p, code: v }))}
                    placeholder="Ex : 123456"
                  />

                  <LoginInput
                    label="Nouveau mot de passe"
                    type="password"
                    value={forgot.newPassword}
                    onChange={(v) =>
                      setForgot((p) => ({ ...p, newPassword: v }))
                    }
                  />

                  <LoginInput
                    label="Confirmer"
                    type="password"
                    value={forgot.confirmPassword}
                    onChange={(v) =>
                      setForgot((p) => ({ ...p, confirmPassword: v }))
                    }
                  />

                  <button
                    onClick={modifierMotDePasse}
                    disabled={loading}
                    className="w-full rounded-xl bg-emerald-950 py-3 text-sm font-bold uppercase tracking-widest text-white shadow-lg hover:bg-emerald-900 disabled:opacity-60"
                  >
                    {loading ? 'Modification...' : 'Modifier mot de passe'}
                  </button>
                </>
              )}

              <button
                onClick={() => setMode('LOGIN')}
                className="w-full text-xs font-bold text-emerald-900 underline"
              >
                Retour login
              </button>
            </div>
          )}

          {mode === 'LICENCE' && (
            <div className="mt-8 space-y-5">
              <LoginInput
                label="Clé licence"
                value={licence.clelicence}
                onChange={(v) => setLicence((p) => ({ ...p, clelicence: v }))}
                placeholder="ZAIRE-TEST-001"
              />

              <div className="grid grid-cols-2 gap-4">
                <LoginInput label="Entreprise" type="number" value={licence.identreprise} onChange={(v) => setLicence((p) => ({ ...p, identreprise: Number(v) }))} />
                <LoginInput label="Magasin" type="number" value={licence.idmagasin} onChange={(v) => setLicence((p) => ({ ...p, idmagasin: Number(v) }))} />
                <LoginInput label="Dépôt" type="number" value={licence.iddepot} onChange={(v) => setLicence((p) => ({ ...p, iddepot: Number(v) }))} />
                <LoginInput label="Poste" type="number" value={licence.idposte} onChange={(v) => setLicence((p) => ({ ...p, idposte: Number(v) }))} />
              </div>

              <div className="rounded-2xl bg-slate-100 p-3 text-center text-xs text-slate-600">
                Device ID : {deviceId || 'Chargement...'}
              </div>

              <button
                onClick={verifierLicence}
                disabled={loading}
                className="w-full rounded-xl bg-emerald-950 py-3 text-sm font-bold uppercase tracking-widest text-white shadow-lg hover:bg-emerald-900 disabled:opacity-60"
              >
                {loading ? 'Vérification...' : 'Vérifier licence'}
              </button>

              <button
                onClick={() => setMode('LOGIN')}
                className="w-full text-xs font-bold text-emerald-900 underline"
              >
                Retour login
              </button>
            </div>
          )}

          {mode === 'REGISTER' && (
            <div className="mt-8 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <LoginInput label="Nom" value={register.nom} onChange={(v) => setRegister((p) => ({ ...p, nom: v }))} />
                <LoginInput label="Prénom" value={register.prenom} onChange={(v) => setRegister((p) => ({ ...p, prenom: v }))} />
              </div>

              <LoginInput label="Email" type="email" value={register.email} onChange={(v) => setRegister((p) => ({ ...p, email: v }))} />
              <LoginInput label="Téléphone" value={register.telephone} onChange={(v) => setRegister((p) => ({ ...p, telephone: v }))} />
              <LoginInput label="Username" value={register.nomutilisateur} onChange={(v) => setRegister((p) => ({ ...p, nomutilisateur: v }))} />
              <LoginInput label="Password" type="password" value={register.password} onChange={(v) => setRegister((p) => ({ ...p, password: v }))} />
              <LoginInput label="Confirm" type="password" value={register.confirmPassword} onChange={(v) => setRegister((p) => ({ ...p, confirmPassword: v }))} />

              <button
                onClick={creerCompteCentral}
                disabled={loading}
                className="w-full rounded-xl bg-emerald-950 py-3 text-sm font-bold uppercase tracking-widest text-white shadow-lg hover:bg-emerald-900 disabled:opacity-60"
              >
                {loading ? 'Envoi...' : 'Créer compte'}
              </button>

              <button
                onClick={() => setMode('LOGIN')}
                className="w-full text-xs font-bold text-emerald-900 underline"
              >
                Retour login
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}