'use client';

import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_CENTRAL_API || 'http://localhost:3002';

export default function SauvegardesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function charger() {
    const [resItems, resStats] = await Promise.all([
      fetch(`${API}/backups`),
      fetch(`${API}/backups/stats`),
    ]);

    setItems(await resItems.json());
    setStats(await resStats.json());
  }

  useEffect(() => {
    charger();
  }, []);

  async function creerSauvegarde() {
    const ok = window.confirm('Créer une nouvelle sauvegarde maintenant ?');
    if (!ok) return;

    setLoading(true);

    try {
      const res = await fetch(`${API}/backups/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identreprise: 1 }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(json.message || 'Erreur pendant la sauvegarde.');
        return;
      }

      alert('Sauvegarde créée avec succès.');
      await charger();
    } finally {
      setLoading(false);
    }
  }

  async function restaurer(x: any) {
    const ok = window.confirm(
      'ATTENTION : cette opération peut remplacer les données actuelles. Continuer ?'
    );

    if (!ok) return;

    const res = await fetch(`${API}/backups/restore/${x.id}`, {
      method: 'POST',
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      alert(json.message || 'Erreur pendant la restauration.');
      return;
    }

    alert(json.message || 'Base restaurée.');
  }

  async function supprimer(x: any) {
    const ok = window.confirm(`Supprimer la sauvegarde ${x.nomfichier} ?`);
    if (!ok) return;

    const res = await fetch(`${API}/backups/${x.id}`, {
      method: 'DELETE',
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      alert(json.message || 'Erreur pendant la suppression.');
      return;
    }

    await charger();
  }

  function telecharger(x: any) {
    window.open(`${API}/backups/download/${x.id}`, '_blank');
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Sauvegardes</h1>

      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <Card title="Total" value={stats?.total || 0} />
        <Card title="Aujourd’hui" value={stats?.aujourd_hui || 0} />
        <Card title="Échecs" value={stats?.echecs || 0} />
        <Card
          title="Dernière"
          value={
            stats?.derniere
              ? new Date(stats.derniere).toLocaleString()
              : '-'
          }
        />
      </div>

      <button
        onClick={creerSauvegarde}
        disabled={loading}
        style={{
          padding: '10px 16px',
          marginBottom: 20,
          cursor: 'pointer',
        }}
      >
        {loading ? 'Sauvegarde en cours...' : 'Créer une sauvegarde'}
      </button>

      <table width="100%" border={1} cellPadding={8} style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Entreprise</th>
            <th>Serveur</th>
            <th>Type</th>
            <th>Taille</th>
            <th>Date</th>
            <th>Statut</th>
            <th>Fichier</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {items.map((x) => (
            <tr key={x.id}>
              <td>{x.id}</td>
              <td>{x.entreprise || x.nomclient || '-'}</td>
              <td>{x.serverurl || '-'}</td>
              <td>{x.typebackup}</td>
              <td>{x.taillemo || 0} Mo</td>
              <td>{x.createdat ? new Date(x.createdat).toLocaleString() : '-'}</td>
              <td>{x.statut}</td>
              <td>{x.nomfichier}</td>
              <td style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => telecharger(x)}>Télécharger</button>
                <button onClick={() => restaurer(x)}>Restaurer</button>
                <button onClick={() => supprimer(x)}>Supprimer</button>
              </td>
            </tr>
          ))}

          {items.length === 0 && (
            <tr>
              <td colSpan={9} style={{ textAlign: 'center' }}>
                Aucune sauvegarde trouvée.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}

function Card({ title, value }: any) {
  return (
    <div
      style={{
        border: '1px solid #ddd',
        borderRadius: 8,
        padding: 16,
        minWidth: 160,
      }}
    >
      <div style={{ fontSize: 13, color: '#666' }}>{title}</div>
      <div style={{ fontSize: 22, fontWeight: 'bold' }}>{value}</div>
    </div>
  );
}