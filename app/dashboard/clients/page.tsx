'use client';

import { useEffect, useMemo, useState } from 'react';

type Client = {
  id_clients: number;
  nom?: string | null;
  prenom?: string | null;
  telephone?: string | null;
  adresse?: string | null;
  email?: string | null;
  codecarte?: string | null;
  categorieclient?: string | null;
  actif?: any;
};

const API_URL = 'https://messiematala-pos-backend-production.up.railway.app';

const inputClass =
  'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600';

const thClass =
  'border border-slate-300 bg-slate-100 p-3 text-left font-bold text-slate-900';

const tdClass =
  'border border-slate-300 bg-white p-3 font-semibold text-slate-900';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [recherche, setRecherche] = useState('');
  const [clientSelectionne, setClientSelectionne] = useState<Client | null>(null);

  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    adresse: '',
    email: '',
    codecarte: '',
    categorieclient: 'STANDARD',
  });

  async function chargerClients() {
    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/clients`, {
        cache: 'no-store',
      });

      if (!res.ok) {
        throw new Error(`Erreur API clients: ${res.status}`);
      }

      const data = await res.json();
      setClients(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      alert('Impossible de charger les clients');
    } finally {
      setLoading(false);
    }
  }

  async function ajouterClient(e: React.FormEvent) {
    e.preventDefault();

    if (!form.nom.trim() && !form.telephone.trim()) {
      alert('Entrez au moins le nom ou le téléphone du client');
      return;
    }

    const res = await fetch(`${API_URL}/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      alert('Erreur ajout client');
      return;
    }

    setForm({
      nom: '',
      prenom: '',
      telephone: '',
      adresse: '',
      email: '',
      codecarte: '',
      categorieclient: 'STANDARD',
    });

    await chargerClients();
  }

  async function modifierClient() {
    if (!clientSelectionne) {
      alert('Sélectionnez un client.');
      return;
    }

    const res = await fetch(`${API_URL}/clients/${clientSelectionne.id_clients}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      alert('Erreur modification client');
      return;
    }

    alert('Client modifié avec succès');
    await chargerClients();
  }

  async function supprimerClient() {
    if (!clientSelectionne) {
      alert('Sélectionnez un client.');
      return;
    }

    if (!confirm('Voulez-vous vraiment supprimer ce client ?')) return;

    const res = await fetch(`${API_URL}/clients/${clientSelectionne.id_clients}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      alert('Erreur suppression client');
      return;
    }

    alert('Client supprimé');
    setClientSelectionne(null);
    await chargerClients();
  }

  async function genererCarte() {
    if (!clientSelectionne) {
      alert('Sélectionnez un client.');
      return;
    }

    const res = await fetch(
      `${API_URL}/clients/${clientSelectionne.id_clients}/generer-carte`,
      { method: 'POST' }
    );

    if (!res.ok) {
      alert('Erreur génération carte');
      return;
    }

    alert('Carte fidélité générée');
    await chargerClients();
  }

  async function voirHistorique() {
    if (!clientSelectionne) {
      alert('Sélectionnez un client.');
      return;
    }

    const res = await fetch(
      `${API_URL}/clients/${clientSelectionne.id_clients}/historique`
    );

    const data = await res.json();
    console.log('Historique achats:', data);

    alert(`Historique chargé : ${Array.isArray(data) ? data.length : 0} vente(s). Voir console navigateur.`);
  }

  async function voirCredits() {
    if (!clientSelectionne) {
      alert('Sélectionnez un client.');
      return;
    }

    const res = await fetch(
      `${API_URL}/clients/${clientSelectionne.id_clients}/credits`
    );

    const data = await res.json();
    console.log('Crédits client:', data);

    alert(`Crédits chargés : ${Array.isArray(data) ? data.length : 0} ligne(s). Voir console navigateur.`);
  }

  function selectionnerClient(c: Client) {
    setClientSelectionne(c);

    setForm({
      nom: c.nom || '',
      prenom: c.prenom || '',
      telephone: c.telephone || '',
      adresse: c.adresse || '',
      email: c.email || '',
      codecarte: c.codecarte || '',
      categorieclient: c.categorieclient || 'STANDARD',
    });
  }

  useEffect(() => {
    chargerClients();
  }, []);

  const clientsFiltres = useMemo(() => {
    const q = recherche.toLowerCase().trim();

    if (!q) return clients;

    return clients.filter((c) =>
      [
        c.id_clients,
        c.nom,
        c.prenom,
        c.telephone,
        c.adresse,
        c.email,
        c.codecarte,
        c.categorieclient,
      ]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [clients, recherche]);

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900">
      <div className="rounded-2xl bg-white p-6 shadow">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Clients</h1>
        <p className="text-slate-600">
          Gestion des clients, cartes fidélité, crédits et historique achats
        </p>
      </div>

      <form onSubmit={ajouterClient} className="mt-5 rounded-2xl bg-white p-5 shadow">
        <h2 className="mb-4 text-lg font-bold text-slate-900">Nouveau client</h2>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <input className={inputClass} placeholder="Nom" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
          <input className={inputClass} placeholder="Prénom" value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} />
          <input className={inputClass} placeholder="Téléphone" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
          <input className={inputClass} placeholder="Adresse" value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} />
          <input className={inputClass} placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className={inputClass} placeholder="Code carte fidélité" value={form.codecarte} onChange={(e) => setForm({ ...form, codecarte: e.target.value })} />

          <select className={inputClass} value={form.categorieclient} onChange={(e) => setForm({ ...form, categorieclient: e.target.value })}>
            <option value="STANDARD">STANDARD</option>
            <option value="VIP">VIP</option>
            <option value="GROSSISTE">GROSSISTE</option>
            <option value="FIDELITE">FIDÉLITÉ</option>
          </select>

          <button type="submit" className="rounded-xl bg-blue-600 px-4 py-3 font-bold text-white hover:bg-blue-700">
            Ajouter client
          </button>
        </div>
      </form>

      <div className="mt-5 rounded-2xl bg-white p-5 shadow">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <input
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600 md:w-96"
            placeholder="Rechercher client, téléphone, carte..."
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
          />

          <button onClick={chargerClients} className="rounded-xl bg-slate-900 px-5 py-3 font-bold text-white hover:bg-slate-700">
            Actualiser
          </button>
        </div>

        <div className="mb-4 flex flex-wrap gap-3">
          <button onClick={modifierClient} className="rounded-lg bg-blue-600 px-4 py-2 font-bold text-white">Modifier</button>
          <button onClick={supprimerClient} className="rounded-lg bg-red-600 px-4 py-2 font-bold text-white">Supprimer</button>
          <button onClick={voirCredits} className="rounded-lg bg-amber-500 px-4 py-2 font-bold text-white">Crédits Clients</button>
          <button onClick={voirCredits} className="rounded-lg bg-orange-600 px-4 py-2 font-bold text-white">Encaisser Crédit</button>
          <button onClick={voirCredits} className="rounded-lg bg-slate-900 px-4 py-2 font-bold text-white">Compte Crédit</button>
          <button onClick={voirHistorique} className="rounded-lg bg-indigo-600 px-4 py-2 font-bold text-white">Historique Achats</button>
          <button onClick={() => alert('Coupons sera ajouté à l’étape suivante.')} className="rounded-lg bg-purple-600 px-4 py-2 font-bold text-white">Coupons</button>
          <button onClick={() => alert('Mouvements Fidélité sera ajouté à l’étape suivante.')} className="rounded-lg bg-cyan-600 px-4 py-2 font-bold text-white">Mouvements Fidélité</button>
          <button onClick={genererCarte} className="rounded-lg bg-emerald-600 px-4 py-2 font-bold text-white">Générer Carte</button>
          <button onClick={() => alert('Impression PVC sera ajoutée après génération QR/barcode.')} className="rounded-lg bg-black px-4 py-2 font-bold text-white">Imprimer PVC</button>
        </div>

        {clientSelectionne && (
          <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-3 font-semibold text-blue-900">
            Client sélectionné : ID {clientSelectionne.id_clients} — {[clientSelectionne.nom, clientSelectionne.prenom].filter(Boolean).join(' ') || 'Sans nom'}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm text-slate-900">
            <thead>
              <tr>
                <th className={thClass}>ID</th>
                <th className={thClass}>Client</th>
                <th className={thClass}>Téléphone</th>
                <th className={thClass}>Adresse</th>
                <th className={thClass}>Email</th>
                <th className={thClass}>Carte</th>
                <th className={thClass}>Catégorie</th>
              </tr>
            </thead>

            <tbody className="bg-white text-slate-900">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-5 text-center font-bold text-slate-900">Chargement...</td>
                </tr>
              ) : clientsFiltres.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-5 text-center font-bold text-slate-900">Aucun client trouvé</td>
                </tr>
              ) : (
                clientsFiltres.map((c) => (
                  <tr
                    key={c.id_clients}
                    onClick={() => selectionnerClient(c)}
                    className={`cursor-pointer hover:bg-blue-50 ${clientSelectionne?.id_clients === c.id_clients ? 'bg-blue-100' : ''}`}
                  >
                    <td className={tdClass}>{c.id_clients}</td>
                    <td className={tdClass}>{[c.nom, c.prenom].filter(Boolean).join(' ') || '-'}</td>
                    <td className={tdClass}>{c.telephone || '-'}</td>
                    <td className={tdClass}>{c.adresse || '-'}</td>
                    <td className={tdClass}>{c.email || '-'}</td>
                    <td className={tdClass}>{c.codecarte || '-'}</td>
                    <td className={tdClass}>{c.categorieclient || 'STANDARD'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}