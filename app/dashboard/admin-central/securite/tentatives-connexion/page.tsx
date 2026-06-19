'use client';

import { useEffect, useState } from 'react';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://messiematala-pos-backend-production.up.railway.app';

export default function TentativesConnexionPage() {
  const [items, setItems] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [search, setSearch] = useState('');

  async function charger() {
    const [resItems, resStats] = await Promise.all([
      fetch(`${API_URL}/login-attempts?search=${encodeURIComponent(search)}`),
      fetch(`${API_URL}/login-attempts/stats`),
    ]);

    const jsonItems = await resItems.json();
    const jsonStats = await resStats.json();

    setItems(Array.isArray(jsonItems) ? jsonItems : []);
    setStats(jsonStats && !Array.isArray(jsonStats) ? jsonStats : {});
  }

  async function debloquer(email: string) {
  if (!email) {
    alert('Email introuvable.');
    return;
  }

  const managerLogin = window.prompt('Login manager :');
  if (!managerLogin?.trim()) {
    alert('Login manager obligatoire.');
    return;
  }

  const managerPin = window.prompt('PIN Signature Manager :');
  if (!managerPin?.trim()) {
    alert('PIN manager obligatoire.');
    return;
  }

  try {
    const validationRes = await fetch(`${API_URL}/signature-manager/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        managerLogin: managerLogin.trim(),
        managerPin: managerPin.trim(),
        typeAction: 'DEBLOCAGE_COMPTE_LOGIN',
        permissionCode: 'LOGIN_ATTEMPTS_DEBLOQUER',
        reference: email,
        details: `Déblocage manuel du compte ${email}`,
      }),
    });

    const validationData = await validationRes.json();

    if (!validationRes.ok || !validationData?.approved) {
      throw new Error(validationData?.message || 'Signature manager refusée.');
    }

    const res = await fetch(`${API_URL}/login-attempts/debloquer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        managerLogin: managerLogin.trim(),
        idSignature: validationData.idSignature,
      }),
    });

    const text = await res.text();

    let data: any = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { message: text };
    }

    if (!res.ok) {
      throw new Error(data?.message || 'Erreur pendant le déblocage.');
    }

    alert(data?.message || 'Compte débloqué avec succès.');

    setItems((prev) =>
      prev.map((item) =>
        String(item.email || '').toLowerCase() === email.toLowerCase()
          ? {
              ...item,
              bloque_jusqua: null,
              motif: 'Compte débloqué par Signature Manager',
            }
          : item,
      ),
    );

    await charger();
  } catch (error: any) {
    alert(error?.message || 'Impossible de débloquer ce compte.');
    console.error('ERREUR DEBLOCAGE SIGNATURE =', error);
  }
}
  function estEncoreBloque(date?: string | null) {
    if (!date) return false;

    const time = new Date(date).getTime();
    if (Number.isNaN(time)) return false;

    return time > Date.now();
  }

  useEffect(() => {
    charger();
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h1>Tentatives de connexion</h1>

      <div style={{ display: 'flex', gap: 12, margin: '20px 0' }}>
        <Card titre="Succès aujourd'hui" valeur={stats.succes_aujourdhui || 0} />
        <Card titre="Échecs aujourd'hui" valeur={stats.echecs_aujourdhui || 0} />
        <Card titre="Utilisateurs bloqués" valeur={stats.utilisateurs_bloques || 0} />
        <Card titre="IP suspectes" valeur={stats.ips_suspectes || 0} />
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <input
          placeholder="Rechercher email, IP, appareil, motif..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: 10,
            width: 350,
            border: '1px solid #ddd',
            borderRadius: 8,
          }}
        />

        <button
          onClick={charger}
          style={{
            padding: '10px 18px',
            borderRadius: 8,
            background: '#111827',
            color: 'white',
          }}
        >
          Rechercher
        </button>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f3f4f6' }}>
            <th style={th}>Date</th>
            <th style={th}>Email</th>
            <th style={th}>IP</th>
            <th style={th}>Appareil</th>
            <th style={th}>Résultat</th>
            <th style={th}>Motif</th>
            <th style={th}>Bloqué jusqu'à</th>
            <th style={th}>Actions</th>
          </tr>
        </thead>

        <tbody>
          {items.map((x) => (
            <tr key={x.id}>
              <td style={td}>
                {x.createdat ? new Date(x.createdat).toLocaleString('fr-FR') : '-'}
              </td>
              <td style={td}>{x.email || '-'}</td>
              <td style={td}>{x.adresse_ip || '-'}</td>
              <td style={td}>{x.appareil || '-'}</td>
              <td style={td}>{x.succes ? '✅ Succès' : '❌ Échec'}</td>
              <td style={td}>{x.motif || '-'}</td>
              <td style={td}>
                {estEncoreBloque(x.bloque_jusqua)
                  ? new Date(x.bloque_jusqua).toLocaleString('fr-FR')
                  : '-'}
              </td>
              <td style={td}>
                {estEncoreBloque(x.bloque_jusqua) ? (
                  <button
                    onClick={() => debloquer(String(x.email || '').trim())}
                    style={{
                      padding: '7px 12px',
                      borderRadius: 8,
                      background: '#059669',
                      color: 'white',
                      border: 'none',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                    }}
                  >
                    Débloquer
                  </button>
                ) : (
                  '-'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Card({ titre, valeur }: any) {
  return (
    <div
      style={{
        padding: 18,
        borderRadius: 12,
        background: 'white',
        border: '1px solid #e5e7eb',
        minWidth: 180,
      }}
    >
      <div style={{ color: '#6b7280', fontSize: 13 }}>{titre}</div>
      <div style={{ fontSize: 28, fontWeight: 'bold' }}>{valeur}</div>
    </div>
  );
}

const th = {
  padding: 10,
  border: '1px solid #e5e7eb',
  textAlign: 'left' as const,
};

const td = {
  padding: 10,
  border: '1px solid #e5e7eb',
};