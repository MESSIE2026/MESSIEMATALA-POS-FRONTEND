'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_CENTRAL_API || 'http://localhost:3002';

export default function AppareilsApprouvesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  function lireListe(json: any) {
    if (Array.isArray(json)) return json;
    if (Array.isArray(json?.data)) return json.data;
    if (Array.isArray(json?.items)) return json.items;
    if (Array.isArray(json?.result)) return json.result;
    return [];
  }

  async function charger() {
    setLoading(true);

    try {
      const [resItems, resStats] = await Promise.all([
        fetch(`${API}/appareils/approuves?search=${encodeURIComponent(search)}`, {
          cache: 'no-store',
        }),
        fetch(`${API}/appareils/stats`, {
          cache: 'no-store',
        }),
      ]);

      const jsonItems = await resItems.json();
      const jsonStats = await resStats.json();

      setItems(lireListe(jsonItems));
      setStats(jsonStats && !Array.isArray(jsonStats) ? jsonStats : {});
    } catch (error) {
      console.error('Erreur chargement appareils approuvés:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function bloquer(x: any) {
    if (!x.deviceid) return;

    const motif = window.prompt(
      `Motif du blocage pour ${x.email || x.nomutilisateur || x.deviceid} ?`,
      'Blocage administrateur',
    );

    if (motif === null) return;

    await fetch(`${API}/appareils/bloquer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idutilisateur: x.idutilisateur,
        email: x.email || x.nomutilisateur || null,
        deviceid: x.deviceid,
        motif,
        bloquepar: 'ADMIN',
      }),
    });

    await charger();
  }

  useEffect(() => {
    charger();
  }, []);

  return (
    <main style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <h1>Appareils approuvés</h1>
          <p>Liste des comptes et des appareils autorisés à se connecter.</p>
        </div>

        <Link href="/dashboard/admin-central" style={btnGray}>
          Retour Dashboard
        </Link>
      </div>

      <div
  style={{
    display: 'flex',
    gap: 12,
    margin: '20px 0',
    flexWrap: 'wrap',
  }}
>
  <Card
    titre="Comptes total"
    valeur={stats.comptes_total || 0}
  />

  <Card
    titre="Comptes approuvés"
    valeur={stats.comptes_approuves || 0}
  />

  <Card
    titre="Appareils approuvés"
    valeur={stats.appareils_approuves || 0}
  />

  <Card
    titre="Appareils bloqués"
    valeur={stats.appareils_bloques || 0}
  />
</div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <input
          placeholder="Rechercher email, device, système, IP..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') charger();
          }}
          style={input}
        />

        <button onClick={charger} style={btnDark}>
          {loading ? 'Chargement...' : 'Rechercher'}
        </button>

        <Link href="/dashboard/admin-central/securite/appareils-bloques" style={btnRed}>
          Voir appareils bloqués
        </Link>
      </div>

      <table style={table}>
        <thead>
          <tr style={{ background: '#f3f4f6' }}>
            <th style={th}>Email</th>
            <th style={th}>Device ID</th>
            <th style={th}>Nom appareil</th>
            <th style={th}>Système</th>
            <th style={th}>Navigateur</th>
            <th style={th}>IP</th>
            <th style={th}>Dernière activité</th>
            <th style={th}>Statut</th>
            <th style={th}>Actions</th>
          </tr>
        </thead>

        <tbody>
          {items.map((x, index) => (
            <tr key={`${x.idutilisateur || 'user'}-${x.deviceid || 'no-device'}-${index}`}>
              <td style={td}>{x.email || x.nomutilisateur || '-'}</td>
              <td style={td}>{x.deviceid || '-'}</td>
              <td style={td}>{x.nomappareil || '-'}</td>
              <td style={td}>{x.systeme || '-'}</td>
              <td style={td}>{x.navigateur || '-'}</td>
              <td style={td}>{x.adresse_ip || '-'}</td>
              <td style={td}>{formatDate(x.lastseen)}</td>

              <td style={td}>
                {x.statut_appareil === 'AUCUN_APPAREIL'
                  ? '⚪ Aucun appareil'
                  : x.bloque
                    ? '🔴 Bloqué'
                    : '🟢 Approuvé'}
              </td>

              <td style={td}>
                {!x.deviceid ? (
                  '-'
                ) : x.bloque ? (
                  '-'
                ) : (
                  <button onClick={() => bloquer(x)} style={btnRedSmall}>
                    Bloquer Appareil
                  </button>
                )}
              </td>
            </tr>
          ))}

          {items.length === 0 && (
            <tr>
              <td colSpan={9} style={{ ...td, textAlign: 'center' }}>
                Aucun appareil trouvé.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}

function Card({ titre, valeur }: any) {
  return (
    <div style={card}>
      <div style={{ color: '#6b7280', fontSize: 13 }}>{titre}</div>
      <div style={{ fontSize: 28, fontWeight: 'bold' }}>{valeur}</div>
    </div>
  );
}

function formatDate(date?: string) {
  if (!date) return '-';
  return new Date(date).toLocaleString('fr-FR');
}

const input = {
  padding: 10,
  width: 360,
  border: '1px solid #ddd',
  borderRadius: 8,
};

const table = {
  width: '100%',
  borderCollapse: 'collapse' as const,
};

const th = {
  padding: 10,
  border: '1px solid #e5e7eb',
  textAlign: 'left' as const,
};

const td = {
  padding: 10,
  border: '1px solid #e5e7eb',
  maxWidth: 260,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap' as const,
};

const card = {
  padding: 18,
  borderRadius: 12,
  background: 'white',
  border: '1px solid #e5e7eb',
  minWidth: 180,
};

const btnDark = {
  padding: '10px 18px',
  borderRadius: 8,
  background: '#111827',
  color: 'white',
  border: 'none',
  fontWeight: 'bold',
  cursor: 'pointer',
};

const btnGray = {
  padding: '10px 18px',
  borderRadius: 8,
  background: '#f3f4f6',
  color: '#111827',
  textDecoration: 'none',
  fontWeight: 'bold',
};

const btnRed = {
  padding: '10px 18px',
  borderRadius: 8,
  background: '#dc2626',
  color: 'white',
  textDecoration: 'none',
  fontWeight: 'bold',
};

const btnRedSmall = {
  padding: '7px 12px',
  borderRadius: 8,
  background: '#dc2626',
  color: 'white',
  border: 'none',
  fontWeight: 'bold',
  cursor: 'pointer',
};