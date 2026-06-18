'use client';

import { useEffect, useMemo, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://messiematala-pos-backend-production.up.railway.app';

type Tab = 'signature' | 'setup' | 'pin' | 'history' | 'empreinte';

type HistoryItem = {
  idSignature: number;
  dateSignature: string;
  typeAction: string;
  reference: string;
  details: string;
  idEmployeDemandeur: number | null;
  idManager: number;
  managerNom: string;
  machine: string;
};

export default function Page() {
  const [tab, setTab] = useState<Tab>('signature');

  const [managerLogin, setManagerLogin] = useState('');
  const [managerPin, setManagerPin] = useState('');

  const [typeAction, setTypeAction] = useState('ANNULATION_VENTE');
  const [permissionCode, setPermissionCode] = useState('VENTE_ANNULER');
  const [reference, setReference] = useState('');
  const [details, setDetails] = useState('');
  const [idEmployeDemandeur, setIdEmployeDemandeur] = useState('');

  const [setupLogin, setSetupLogin] = useState('');
  const [setupPin, setSetupPin] = useState('');
  const [setupConfirm, setSetupConfirm] = useState('');

  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const [approvedInfo, setApprovedInfo] = useState<any>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const badge = useMemo(() => {
    return approvedInfo?.approved ? 'Signature validée' : 'Signature requise';
  }, [approvedInfo]);

  async function apiPost(path: string, body: any) {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(
        typeof data?.message === 'string'
          ? data.message
          : JSON.stringify(data?.message || data || 'Erreur API'),
      );
    }

    return data;
  }

  async function apiGet(path: string) {
    const res = await fetch(`${API_URL}${path}`, { cache: 'no-store' });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data?.message || 'Erreur API');
    }

    return data;
  }

  async function validerSignature() {
    try {
      setLoading(true);
      setMessage('');

      const data = await apiPost('/signature-manager/validate', {
        managerLogin,
        managerPin,
        typeAction,
        permissionCode,
        reference,
        details,
        idEmployeDemandeur: idEmployeDemandeur
          ? Number(idEmployeDemandeur)
          : undefined,
      });

      setApprovedInfo(data);
      setMessage(data.message || 'Signature validée.');
      chargerHistorique();
    } catch (e: any) {
      setApprovedInfo(null);
      setMessage(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function configurerPin() {
    if (setupPin !== setupConfirm) {
      setMessage('Les deux PIN ne correspondent pas.');
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      const data = await apiPost('/signature-manager/setup-pin', {
        managerLogin: setupLogin,
        newPin: setupPin,
      });

      setMessage(data.message);
      setSetupPin('');
      setSetupConfirm('');
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function changerPin() {
    if (newPin !== confirmPin) {
      setMessage('Les deux nouveaux PIN ne correspondent pas.');
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      const data = await apiPost('/signature-manager/change-pin', {
        managerLogin,
        oldPin,
        newPin,
      });

      setMessage(data.message);
      setOldPin('');
      setNewPin('');
      setConfirmPin('');
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function chargerHistorique() {
    try {
      const data = await apiGet('/signature-manager/history?limit=50');
      setHistory(Array.isArray(data) ? data : []);
    } catch {
      setHistory([]);
    }
  }

  useEffect(() => {
    chargerHistorique();
  }, []);

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl bg-gradient-to-r from-slate-950 to-emerald-900 p-7 text-white shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-widest text-emerald-200">
                Sécurité POS
              </p>
              <h1 className="mt-2 text-3xl font-black">
                Signature Manager
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-200">
                Validation manager pour annulation, retour, remise spéciale,
                suppression, clôture caisse et autres actions sensibles.
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 px-5 py-4 text-right ring-1 ring-white/20">
              <p className="text-xs text-slate-300">État</p>
              <p className="text-lg font-black">{badge}</p>
              {approvedInfo?.managerNom && (
                <p className="text-sm text-emerald-200">
                  {approvedInfo.managerNom} · {approvedInfo.managerPoste}
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[290px_1fr]">
          <aside className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <MenuButton active={tab === 'signature'} onClick={() => setTab('signature')}>
              Autorisation sensible
            </MenuButton>
            <MenuButton active={tab === 'setup'} onClick={() => setTab('setup')}>
              Configurer PIN
            </MenuButton>
            <MenuButton active={tab === 'pin'} onClick={() => setTab('pin')}>
              Changer PIN
            </MenuButton>
            <MenuButton active={tab === 'history'} onClick={() => { setTab('history'); chargerHistorique(); }}>
              Historique signatures
            </MenuButton>
            <MenuButton active={tab === 'empreinte'} onClick={() => setTab('empreinte')}>
              Empreinte / futur
            </MenuButton>
          </aside>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            {message && (
              <div className="mb-5 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700">
                {message}
              </div>
            )}

            {tab === 'signature' && (
              <Panel title="Autorisation d’une action sensible">
                <div className="grid gap-4 md:grid-cols-2">
                  <Input label="Login manager" value={managerLogin} onChange={setManagerLogin} />
                  <Input label="PIN signature" type="password" value={managerPin} onChange={setManagerPin} />
                  <Input label="Type d’action" value={typeAction} onChange={setTypeAction} />
                  <Input label="Code permission" value={permissionCode} onChange={setPermissionCode} />
                  <Input label="Référence" value={reference} onChange={setReference} />
                  <Input label="ID employé demandeur" value={idEmployeDemandeur} onChange={setIdEmployeDemandeur} />
                </div>

                <TextArea label="Détails / justification" value={details} onChange={setDetails} />

                <button
                  onClick={validerSignature}
                  disabled={loading}
                  className="mt-4 rounded-2xl bg-emerald-700 px-6 py-3 font-black text-white hover:bg-emerald-800 disabled:opacity-50"
                >
                  Valider l’autorisation manager
                </button>

                {approvedInfo?.approved && (
                  <div className="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
                    Signature #{approvedInfo.idSignature} validée par{' '}
                    {approvedInfo.managerNom}.
                  </div>
                )}
              </Panel>
            )}

            {tab === 'setup' && (
              <Panel title="Configurer le PIN signature">
                <div className="rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-800">
                  À utiliser seulement la première fois pour un manager.
                  Ce PIN est séparé du mot de passe de connexion.
                </div>

                <Input label="Login manager" value={setupLogin} onChange={setSetupLogin} />
                <Input label="Nouveau PIN signature" type="password" value={setupPin} onChange={setSetupPin} />
                <Input label="Confirmer PIN signature" type="password" value={setupConfirm} onChange={setSetupConfirm} />

                <button
                  onClick={configurerPin}
                  disabled={loading}
                  className="mt-4 rounded-2xl bg-slate-950 px-6 py-3 font-black text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  Configurer le PIN
                </button>
              </Panel>
            )}

            {tab === 'pin' && (
              <Panel title="Changer le PIN signature">
                <Input label="Login manager" value={managerLogin} onChange={setManagerLogin} />
                <Input label="Ancien PIN signature" type="password" value={oldPin} onChange={setOldPin} />
                <Input label="Nouveau PIN signature" type="password" value={newPin} onChange={setNewPin} />
                <Input label="Confirmer nouveau PIN" type="password" value={confirmPin} onChange={setConfirmPin} />

                <button
                  onClick={changerPin}
                  disabled={loading}
                  className="mt-4 rounded-2xl bg-slate-950 px-6 py-3 font-black text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  Enregistrer le nouveau PIN
                </button>
              </Panel>
            )}

            {tab === 'history' && (
              <Panel title="Historique des signatures manager">
                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-950 text-white">
                      <tr>
                        <th className="p-3">ID</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Action</th>
                        <th className="p-3">Référence</th>
                        <th className="p-3">Manager</th>
                        <th className="p-3">Détails</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((h) => (
                        <tr key={h.idSignature} className="border-t border-slate-200">
                          <td className="p-3 font-bold">{h.idSignature}</td>
                          <td className="p-3">{formatDate(h.dateSignature)}</td>
                          <td className="p-3 font-bold">{h.typeAction || '-'}</td>
                          <td className="p-3">{h.reference || '-'}</td>
                          <td className="p-3">{h.managerNom || '-'}</td>
                          <td className="p-3">{h.details || '-'}</td>
                        </tr>
                      ))}

                      {history.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-6 text-center font-bold text-slate-500">
                            Aucune signature trouvée.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Panel>
            )}

            {tab === 'empreinte' && (
              <Panel title="Empreinte / Windows Hello">
                <div className="rounded-2xl bg-slate-100 p-5 text-sm font-bold text-slate-700">
                  Réservé pour une future intégration WebAuthn / Windows Hello.
                  Pour l’instant, la sécurité principale est le PIN signature manager.
                </div>
              </Panel>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function MenuButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`mb-2 w-full rounded-2xl px-4 py-3 text-left text-sm font-black ${
        active
          ? 'bg-emerald-700 text-white'
          : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
      }`}
    >
      {children}
    </button>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-2xl font-black text-slate-950">{title}</h2>
      <div className="mt-6 space-y-4">{children}</div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-black text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-black text-slate-700">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
      />
    </label>
  );
}

function formatDate(value: string) {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleString('fr-FR');
  } catch {
    return value;
  }
}