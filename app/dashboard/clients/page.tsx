'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://messiematala-pos-backend-production.up.railway.app';

type Client = {
  id_clients: number;
  nom?: string | null;
  prenom?: string | null;
  telephone?: string | null;
  adresse?: string | null;
  email?: string | null;
  codecarte?: string | null;
  categorieclient?: string | null;
  photopath?: string | null;
  totalachats?: string | number | null;
  nbtickets?: string | number | null;
  dernierachat?: string | null;
  segment?: string | null;
  soldecredit?: string | number | null;
  plafond?: string | number | null;
  points?: string | number | null;
  cashbacksolde?: string | number | null;
  actif?: any;
};

type Onglet = 'fiche' | 'historique' | 'credits' | 'fidelite';

const emptyForm = {
  nom: '',
  prenom: '',
  telephone: '',
  adresse: '',
  email: '',
  codecarte: '',
  categorieclient: 'STANDARD',
  photoPreview: '',
};

function money(v: any) {
  return Number(v || 0).toLocaleString('fr-FR');
}

function initials(nom?: string | null, prenom?: string | null) {
  return `${nom?.[0] || ''}${prenom?.[0] || ''}`.toUpperCase() || 'CL';
}

function safePhoto(src?: string | null) {
  if (!src) return '';
  if (src.startsWith('data:image')) return src;
  if (src.startsWith('/uploads/')) return `${API_URL}${src}`;
  return src;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [clientSelectionne, setClientSelectionne] = useState<Client | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState(emptyForm);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [imageGrandFormat, setImageGrandFormat] = useState('');

  const [recherche, setRecherche] = useState('');
  const [onglet, setOnglet] = useState<Onglet>('fiche');

  const [historique, setHistorique] = useState<any[]>([]);
  const [credits, setCredits] = useState<any[]>([]);
  const [fidelite, setFidelite] = useState<any | null>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');

  function showMessage(text: string, type: 'success' | 'error' | 'info' = 'info') {
    setMessage(text);
    setMessageType(type);
  }

  async function chargerClients() {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/clients`, { cache: 'no-store' });

      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      const list: Client[] = Array.isArray(data) ? data : [];

      setClients(list);

      if (!editingId && !clientSelectionne && list.length > 0) {
        selectionnerClient(list[0]);
      }
    } catch (err) {
      console.error(err);
      showMessage('Impossible de charger les clients.', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    chargerClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        c.segment,
      ]
        .join(' ')
        .toLowerCase()
        .includes(q),
    );
  }, [clients, recherche]);

  const stats = useMemo(() => {
    return {
      total: clients.length,
      vip: clients.filter((c) => c.categorieclient === 'VIP' || c.segment === 'VIP').length,
      credit: clients.filter((c) => Number(c.soldecredit || 0) > 0).length,
      fidelite: clients.filter((c) => Number(c.points || 0) > 0).length,
    };
  }, [clients]);

  function resetForm() {
    setClientSelectionne(null);
    setEditingId(null);
    setForm(emptyForm);
    setPhotoFile(null);
    setHistorique([]);
    setCredits([]);
    setFidelite(null);
    setOnglet('fiche');
    setMessage('');
  }

  function selectionnerClient(c: Client) {
    setClientSelectionne(c);
    setEditingId(c.id_clients);

    setForm({
      nom: c.nom || '',
      prenom: c.prenom || '',
      telephone: c.telephone || '',
      adresse: c.adresse || '',
      email: c.email || '',
      codecarte: c.codecarte || '',
      categorieclient: c.categorieclient || 'STANDARD',
      photoPreview: c.photopath || '',
    });

    setPhotoFile(null);
    setOnglet('fiche');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function choisirPhoto(file?: File) {
    if (!file) return;

    setPhotoFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      setForm((f) => ({ ...f, photoPreview: String(reader.result || '') }));
    };

    reader.readAsDataURL(file);
  }

  async function uploadPhotoClient() {
    let photoPath =
      form.photoPreview && !form.photoPreview.startsWith('data:image')
        ? form.photoPreview
        : null;

    if (photoFile) {
      const fd = new FormData();
      fd.append('file', photoFile);

      const uploadRes = await fetch(`${API_URL}/uploads/employes`, {
        method: 'POST',
        body: fd,
      });

      if (!uploadRes.ok) throw new Error(await uploadRes.text());

      const uploadData = await uploadRes.json();
      photoPath = uploadData.path;
    }

    return photoPath;
  }

  async function enregistrerClient() {
    const nom = form.nom.trim();
    const telephone = form.telephone.trim();

    if (!nom && !telephone) {
      return showMessage('Entrez au moins le nom ou le téléphone du client.', 'error');
    }

    try {
      setSaving(true);
      setMessage('');

      const photoPath = await uploadPhotoClient();

      const payload = {
        nom,
        prenom: form.prenom.trim(),
        telephone,
        adresse: form.adresse.trim(),
        email: form.email.trim(),
        codecarte: form.codecarte.trim(),
        categorieclient: form.categorieclient || 'STANDARD',
        ...(photoPath ? { photopath: photoPath, photoPath } : {}),
      };

      console.log('PAYLOAD CLIENT =', payload);

      const url = editingId
        ? `${API_URL}/clients/${editingId}`
        : `${API_URL}/clients`;

      const method = editingId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const text = await res.text();

      if (!res.ok) {
        console.error('ERREUR API CLIENT =', text);
        throw new Error(text);
      }

      const savedData = text ? JSON.parse(text) : null;
      const savedClient: Client | null = Array.isArray(savedData)
        ? savedData[0]
        : savedData;

      if (savedClient) {
        setClientSelectionne(savedClient);
        setEditingId(savedClient.id_clients);

        setClients((prev) => {
          const exists = prev.some((c) => c.id_clients === savedClient.id_clients);

          if (exists) {
            return prev.map((c) =>
              c.id_clients === savedClient.id_clients ? savedClient : c,
            );
          }

          return [savedClient, ...prev];
        });

        setForm({
          nom: savedClient.nom || '',
          prenom: savedClient.prenom || '',
          telephone: savedClient.telephone || '',
          adresse: savedClient.adresse || '',
          email: savedClient.email || '',
          codecarte: savedClient.codecarte || '',
          categorieclient: savedClient.categorieclient || 'STANDARD',
          photoPreview: savedClient.photopath || '',
        });
      }

      showMessage(editingId ? 'Client modifié avec succès.' : 'Client ajouté avec succès.', 'success');

      setRecherche('');
      setPhotoFile(null);

      await chargerClients();
    } catch (err) {
      console.error(err);
      showMessage("Erreur pendant l'enregistrement du client.", 'error');
    } finally {
      setSaving(false);
    }
  }

  async function supprimerClient() {
    if (!editingId) return showMessage('Sélectionnez un client.', 'error');
    if (!confirm('Voulez-vous vraiment supprimer ce client ?')) return;

    try {
      const res = await fetch(`${API_URL}/clients/${editingId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error(await res.text());

      showMessage('Client supprimé.', 'success');
      resetForm();
      await chargerClients();
    } catch (err) {
      console.error(err);
      showMessage('Erreur suppression client.', 'error');
    }
  }

  async function genererCarte() {
    if (!editingId) return showMessage('Sélectionnez un client.', 'error');

    try {
      const res = await fetch(`${API_URL}/clients/${editingId}/generer-carte`, {
        method: 'POST',
      });

      if (!res.ok) throw new Error(await res.text());

      const savedData = await res.json();
      const savedClient = Array.isArray(savedData) ? savedData[0] : savedData;

      if (savedClient) {
        setClientSelectionne(savedClient);
        setEditingId(savedClient.id_clients);
        setClients((prev) =>
          prev.map((c) => (c.id_clients === savedClient.id_clients ? savedClient : c)),
        );
      }

      showMessage('Carte fidélité générée.', 'success');
      await chargerClients();
    } catch (err) {
      console.error(err);
      showMessage('Erreur génération carte.', 'error');
    }
  }

  async function chargerHistorique() {
    if (!editingId) return showMessage('Sélectionnez un client.', 'error');

    try {
      const res = await fetch(`${API_URL}/clients/${editingId}/historique`);
      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      setHistorique(Array.isArray(data) ? data : []);
      setOnglet('historique');
    } catch (err) {
      console.error(err);
      showMessage('Erreur chargement historique.', 'error');
    }
  }

  async function chargerCredits() {
    if (!editingId) return showMessage('Sélectionnez un client.', 'error');

    try {
      const res = await fetch(`${API_URL}/clients/${editingId}/credits`);
      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      setCredits(Array.isArray(data) ? data : []);
      setOnglet('credits');
    } catch (err) {
      console.error(err);
      showMessage('Erreur chargement crédits.', 'error');
    }
  }

  async function chargerFidelite() {
    if (!editingId) return showMessage('Sélectionnez un client.', 'error');

    try {
      const res = await fetch(`${API_URL}/clients/${editingId}/fidelite`);
      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      setFidelite(Array.isArray(data) ? data[0] : data);
      setOnglet('fidelite');
    } catch (err) {
      console.error(err);
      showMessage('Erreur chargement fidélité.', 'error');
    }
  }

  async function encaisserCredit() {
    if (!editingId) return showMessage('Sélectionnez un client.', 'error');

    await chargerCredits();

    const idCredit = prompt('ID du crédit à encaisser :');
    if (!idCredit) return;

    const montant = prompt('Montant à encaisser :');
    if (!montant) return;

    const modePaiement = prompt('Mode paiement : CASH, MOMO, CARTE...', 'CASH') || 'CASH';
    const note = prompt('Note optionnelle :', '') || '';

    try {
      const res = await fetch(`${API_URL}/clients/credits/${idCredit}/encaisser`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ montant: Number(montant), modePaiement, note }),
      });

      if (!res.ok) throw new Error(await res.text());

      showMessage('Paiement crédit encaissé.', 'success');
      await chargerClients();
      await chargerCredits();
    } catch (err) {
      console.error(err);
      showMessage('Erreur encaissement crédit.', 'error');
    }
  }

  function imprimerPVC() {
    showMessage('Impression PVC à connecter avec QR/barcode.', 'info');
  }

  const nomComplet =
    [form.nom || clientSelectionne?.nom, form.prenom || clientSelectionne?.prenom]
      .filter(Boolean)
      .join(' ') || 'Nouveau client';

  return (
    <main className="min-h-screen bg-slate-100 p-3 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <section className="overflow-hidden rounded-[2rem] bg-slate-950 shadow-sm">
          <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 p-6 text-white">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-200">
                  Relation client
                </p>
                <h1 className="mt-2 text-3xl font-black">
                  Gestion professionnelle des clients
                </h1>
                <p className="mt-2 max-w-3xl text-sm text-slate-300">
                  Fiche client, photo, fidélité, crédit, historique achats, carte client
                  et actions rapides adaptées au mobile, POS, Windows, Mac et Web.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={resetForm}
                  className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950"
                >
                  + Nouveau client
                </button>

                <button
                  onClick={chargerClients}
                  className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white"
                >
                  {loading ? 'Chargement...' : 'Actualiser'}
                </button>
              </div>
            </div>
          </div>
        </section>

        {message && <MessageBox type={messageType}>{message}</MessageBox>}

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard title="Total clients" value={stats.total} />
          <StatCard title="Clients VIP" value={stats.vip} />
          <StatCard title="Avec crédit" value={stats.credit} />
          <StatCard title="Fidélité active" value={stats.fidelite} />
        </section>

        <section className="grid gap-5 xl:grid-cols-[360px_1fr]">
          <aside className="space-y-5">
            <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="flex flex-col items-center text-center">
                {safePhoto(form.photoPreview || clientSelectionne?.photopath) ? (
                  <img
                    src={safePhoto(form.photoPreview || clientSelectionne?.photopath)}
                    alt="Photo client"
                    onClick={() =>
                      setImageGrandFormat(
                        safePhoto(form.photoPreview || clientSelectionne?.photopath),
                      )
                    }
                    className="h-32 w-32 cursor-zoom-in rounded-[2rem] object-cover ring-4 ring-blue-100"
                  />
                ) : (
                  <div className="grid h-32 w-32 place-items-center rounded-[2rem] bg-gradient-to-br from-blue-600 to-slate-950 text-4xl font-black text-white ring-4 ring-blue-100">
                    {initials(form.nom || clientSelectionne?.nom, form.prenom || clientSelectionne?.prenom)}
                  </div>
                )}

                <h2 className="mt-5 text-2xl font-black text-slate-950">
                  {nomComplet}
                </h2>

                <p className="text-sm font-bold text-slate-500">
                  {form.categorieclient || 'STANDARD'}
                </p>

                <label className="mt-4 cursor-pointer rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">
                  Changer photo
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => choisirPhoto(e.target.files?.[0])}
                  />
                </label>
              </div>

              <div className="mt-5 rounded-[1.5rem] bg-gradient-to-br from-slate-950 to-blue-900 p-5 text-white">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-200">
                  Carte fidélité
                </p>

                <p className="mt-3 text-2xl font-black">
                  {form.codecarte || clientSelectionne?.codecarte || 'FID-00000'}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-blue-200">Points</p>
                    <p className="font-black">{money(clientSelectionne?.points)}</p>
                  </div>
                  <div>
                    <p className="text-blue-200">Crédit</p>
                    <p className="font-black">{money(clientSelectionne?.soldecredit)}</p>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2">
                <ActionButton onClick={genererCarte}>Générer carte</ActionButton>
                <ActionButton onClick={imprimerPVC}>Imprimer PVC</ActionButton>
                <ActionButton onClick={chargerHistorique}>Historique</ActionButton>
                <ActionButton onClick={chargerCredits}>Crédits</ActionButton>
                <ActionButton onClick={chargerFidelite}>Fidélité</ActionButton>
                <ActionButton onClick={encaisserCredit}>Encaisser crédit</ActionButton>
              </div>
            </div>
          </aside>

          <section className="space-y-5">
            <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-950">
                    Fiche client
                  </h2>
                  <p className="text-sm text-slate-500">
                    Informations, contact, catégorie et carte fidélité.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={enregistrerClient}
                    disabled={saving}
                    className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white disabled:opacity-50"
                  >
                    {saving
                      ? 'Enregistrement...'
                      : editingId
                        ? 'Modifier client'
                        : 'Ajouter client'}
                  </button>

                  {editingId && (
                    <button
                      onClick={supprimerClient}
                      className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-black text-white"
                    >
                      Supprimer
                    </button>
                  )}
                </div>
              </div>

              <div className="mb-5 grid grid-cols-4 gap-2 rounded-2xl bg-slate-100 p-2">
                <TabButton active={onglet === 'fiche'} onClick={() => setOnglet('fiche')}>
                  Fiche
                </TabButton>
                <TabButton active={onglet === 'historique'} onClick={chargerHistorique}>
                  Achats
                </TabButton>
                <TabButton active={onglet === 'credits'} onClick={chargerCredits}>
                  Crédits
                </TabButton>
                <TabButton active={onglet === 'fidelite'} onClick={chargerFidelite}>
                  Fidélité
                </TabButton>
              </div>

              {onglet === 'fiche' && (
                <Panel title="Informations client">
                  <div className="grid gap-4 lg:grid-cols-3">
                    <Field label="Nom" value={form.nom} onChange={(v) => setForm({ ...form, nom: v })} />
                    <Field label="Prénom" value={form.prenom} onChange={(v) => setForm({ ...form, prenom: v })} />
                    <Field label="Téléphone" value={form.telephone} onChange={(v) => setForm({ ...form, telephone: v })} />
                    <Field label="Adresse" value={form.adresse} onChange={(v) => setForm({ ...form, adresse: v })} />
                    <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
                    <Field label="Code carte" value={form.codecarte} onChange={(v) => setForm({ ...form, codecarte: v })} />

                    <SelectField
                      label="Catégorie"
                      value={form.categorieclient}
                      onChange={(v) => setForm({ ...form, categorieclient: v })}
                      options={[
                        { value: 'STANDARD', label: 'STANDARD' },
                        { value: 'VIP', label: 'VIP' },
                        { value: 'GROSSISTE', label: 'GROSSISTE' },
                        { value: 'FIDELITE', label: 'FIDÉLITÉ' },
                      ]}
                    />
                  </div>
                </Panel>
              )}

              {onglet === 'historique' && (
                <Panel title="Historique des achats">
                  <TableEmpty show={historique.length === 0} text="Aucun achat trouvé." />
                  <div className="space-y-2">
                    {historique.map((v, i) => (
                      <div key={i} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                        <p className="font-black text-slate-950">
                          {v.codefacture || `Vente ${v.id_vente}`}
                        </p>
                        <p className="text-sm text-slate-500">
                          {v.datevente ? String(v.datevente).slice(0, 10) : '-'} ·{' '}
                          {money(v.montanttotal)} {v.devise || ''}
                        </p>
                        <p className="text-xs font-bold text-slate-400">
                          {v.modepaiement || '-'} · {v.statut || '-'}
                        </p>
                      </div>
                    ))}
                  </div>
                </Panel>
              )}

              {onglet === 'credits' && (
                <Panel title="Compte crédit client">
                  <TableEmpty show={credits.length === 0} text="Aucun crédit trouvé." />
                  <div className="space-y-2">
                    {credits.map((c, i) => (
                      <div key={i} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                        <p className="font-black text-slate-950">
                          Crédit #{c.idcredit} · {c.statut || '-'}
                        </p>
                        <p className="text-sm text-slate-500">
                          Total : {money(c.total)} · Reste : {money(c.reste)}
                        </p>
                        <p className="text-xs font-bold text-slate-400">
                          Échéance : {c.dateecheance ? String(c.dateecheance).slice(0, 10) : '-'} · Réf : {c.refvente || '-'}
                        </p>
                      </div>
                    ))}
                  </div>
                </Panel>
              )}

              {onglet === 'fidelite' && (
                <Panel title="Fidélité client">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Info label="Points" value={money(fidelite?.points || clientSelectionne?.points)} />
                    <Info label="Cashback" value={money(fidelite?.cashbacksolde || clientSelectionne?.cashbacksolde)} />
                    <Info label="Statut" value={fidelite?.statut || clientSelectionne?.segment || '-'} />
                  </div>
                </Panel>
              )}
            </div>

            <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_150px]">
                <input
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                  placeholder="Rechercher nom, téléphone, carte, catégorie..."
                  className="rounded-2xl border border-slate-300 px-4 py-3 font-semibold outline-none focus:border-blue-600"
                />

                <button
                  onClick={chargerClients}
                  className="rounded-2xl bg-slate-950 px-5 py-3 font-black text-white"
                >
                  Rechercher
                </button>
              </div>

              <div className="hidden overflow-hidden rounded-2xl ring-1 ring-slate-200 lg:block">
                <table className="w-full text-sm">
                  <thead className="bg-slate-950 text-left text-xs uppercase text-white">
                    <tr>
                      <th className="p-3">Client</th>
                      <th className="p-3">Téléphone</th>
                      <th className="p-3">Carte</th>
                      <th className="p-3">Achats</th>
                      <th className="p-3">Crédit</th>
                      <th className="p-3">Catégorie</th>
                    </tr>
                  </thead>

                  <tbody>
                    {clientsFiltres.map((c) => (
                      <tr
                        key={c.id_clients}
                        onClick={() => selectionnerClient(c)}
                        className={`cursor-pointer border-t border-slate-100 hover:bg-blue-50 ${
                          editingId === c.id_clients ? 'bg-blue-50' : ''
                        }`}
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            {safePhoto(c.photopath) ? (
                              <img
                                src={safePhoto(c.photopath)}
                                alt="Client"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setImageGrandFormat(safePhoto(c.photopath));
                                }}
                                className="h-12 w-12 cursor-zoom-in rounded-2xl object-cover ring-2 ring-blue-100"
                              />
                            ) : (
                              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-900 text-sm font-black text-white">
                                {initials(c.nom, c.prenom)}
                              </div>
                            )}

                            <div>
                              <p className="font-black text-slate-950">
                                {[c.nom, c.prenom].filter(Boolean).join(' ') || '-'}
                              </p>
                              <p className="text-xs text-slate-500">ID {c.id_clients}</p>
                            </div>
                          </div>
                        </td>

                        <td className="p-3 font-bold text-slate-800">{c.telephone || '-'}</td>
                        <td className="p-3 font-black text-slate-800">{c.codecarte || '-'}</td>
                        <td className="p-3 font-bold text-slate-800">{money(c.totalachats)}</td>
                        <td className="p-3 font-bold text-red-700">{money(c.soldecredit)}</td>
                        <td className="p-3">
                          <Badge text={c.categorieclient || c.segment || 'STANDARD'} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 lg:hidden">
                {clientsFiltres.map((c) => (
                  <div
                    key={c.id_clients}
                    onClick={() => selectionnerClient(c)}
                    className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200"
                  >
                    <div className="flex items-center gap-3">
                      {safePhoto(c.photopath) ? (
                        <img
                          src={safePhoto(c.photopath)}
                          alt="Client"
                          onClick={(e) => {
                            e.stopPropagation();
                            setImageGrandFormat(safePhoto(c.photopath));
                          }}
                          className="h-14 w-14 cursor-zoom-in rounded-2xl object-cover ring-2 ring-blue-100"
                        />
                      ) : (
                        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-blue-900 text-lg font-black text-white">
                          {initials(c.nom, c.prenom)}
                        </div>
                      )}

                      <div className="min-w-0">
                        <p className="text-lg font-black text-slate-950">
                          {[c.nom, c.prenom].filter(Boolean).join(' ') || '-'}
                        </p>
                        <p className="text-sm text-slate-500">
                          {c.telephone || '-'} · {c.codecarte || '-'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <Info label="Catégorie" value={c.categorieclient || 'STANDARD'} />
                      <Info label="Crédit" value={money(c.soldecredit)} />
                      <Info label="Achats" value={money(c.totalachats)} />
                      <Info label="Points" value={money(c.points)} />
                    </div>
                  </div>
                ))}
              </div>

              {!loading && clientsFiltres.length === 0 && (
                <div className="rounded-3xl bg-slate-50 p-8 text-center font-black text-slate-500">
                  Aucun client trouvé.
                </div>
              )}
            </div>
          </section>
        </section>
      </div>

      {imageGrandFormat && (
        <div
          onClick={() => setImageGrandFormat('')}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
        >
          <button
            onClick={async (e) => {
              e.stopPropagation();

              const response = await fetch(imageGrandFormat);
              const blob = await response.blob();
              const url = window.URL.createObjectURL(blob);

              const a = document.createElement('a');
              a.href = url;
              a.download = imageGrandFormat.split('/').pop() || 'photo-client.jpg';
              document.body.appendChild(a);
              a.click();
              a.remove();

              window.URL.revokeObjectURL(url);
            }}
            className="absolute left-4 top-4 rounded-full bg-white px-4 py-2 text-sm font-black text-slate-950"
          >
            📥 Télécharger
          </button>

          <button
            onClick={() => setImageGrandFormat('')}
            className="absolute right-4 top-4 rounded-full bg-white px-4 py-2 text-lg font-black text-slate-950"
          >
            ×
          </button>

          <img
            src={imageGrandFormat}
            alt="Photo client grand format"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[95vh] max-w-[98vw] rounded-3xl object-contain shadow-2xl"
          />
        </div>
      )}
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-xs font-black uppercase text-slate-500">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-2xl border border-slate-300 px-4 py-3 font-semibold outline-none focus:border-blue-600"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="text-xs font-black uppercase text-slate-500">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-2xl border border-slate-300 px-4 py-3 font-semibold outline-none focus:border-blue-600"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[1.5rem] bg-white p-4 ring-1 ring-slate-200">
      <h3 className="mb-4 text-sm font-black uppercase tracking-wide text-slate-700">
        {title}
      </h3>
      {children}
    </section>
  );
}

function TabButton({
  children,
  active,
  onClick,
}: {
  children: ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={
        active
          ? 'rounded-xl bg-slate-950 px-3 py-3 text-sm font-black text-white'
          : 'rounded-xl px-3 py-3 text-sm font-black text-slate-600 hover:bg-white'
      }
    >
      {children}
    </button>
  );
}

function StatCard({ title, value }: { title: string; value: any }) {
  return (
    <div className="rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <p className="text-xs font-black uppercase text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-200">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-black text-slate-900">{value}</p>
    </div>
  );
}

function Badge({ text }: { text: string }) {
  return (
    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700">
      {text}
    </span>
  );
}

function ActionButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-2xl bg-slate-100 px-3 py-3 text-xs font-black text-slate-800 ring-1 ring-slate-200 hover:bg-slate-200"
    >
      {children}
    </button>
  );
}

function MessageBox({
  children,
  type,
}: {
  children: ReactNode;
  type: 'success' | 'error' | 'info';
}) {
  const cls =
    type === 'success'
      ? 'bg-emerald-50 text-emerald-800 ring-emerald-200'
      : type === 'error'
        ? 'bg-red-50 text-red-800 ring-red-200'
        : 'bg-white text-slate-700 ring-slate-200';

  return (
    <div className={`rounded-2xl p-4 text-sm font-black shadow-sm ring-1 ${cls}`}>
      {children}
    </div>
  );
}

function TableEmpty({ show, text }: { show: boolean; text: string }) {
  if (!show) return null;

  return (
    <div className="rounded-2xl bg-slate-50 p-5 text-center text-sm font-black text-slate-500 ring-1 ring-slate-200">
      {text}
    </div>
  );
}