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
    if (!email) return;

    const ok = window.confirm(`Débloquer le compte ${email} ?`);
    if (!ok) return;

    await fetch(`${API_URL}/login-attempts/debloquer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    await charger();
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
              <td style={td}>{new Date(x.createdat).toLocaleString('fr-FR')}</td>
              <td style={td}>{x.email}</td>
              <td style={td}>{x.adresse_ip || '-'}</td>
              <td style={td}>{x.appareil || '-'}</td>
              <td style={td}>{x.succes ? '✅ Succès' : '❌ Échec'}</td>
              <td style={td}>{x.motif}</td>
              <td style={td}>
                {x.bloque_jusqua
                  ? new Date(x.bloque_jusqua).toLocaleString('fr-FR')
                  : '-'}
              </td>
              <td style={td}>
                {x.bloque_jusqua ? (
                  <button
                    onClick={() => debloquer(x.email)}
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