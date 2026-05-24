# Le Petit Clapas — Plan Phase 1 (Partie 5 : Admin + Marchand + PWA)

> Lire part3.md et part4.md avant de commencer.

---

## Task 12 : Portail Admin

**Files:**
- Create: `client/src/api/admin.js`
- Modify: `client/src/pages/admin/Dashboard.jsx`
- Modify: `client/src/pages/admin/ImportAdmin.jsx`
- Modify: `client/src/pages/admin/AvisAdmin.jsx`
- Modify: `client/src/pages/admin/CommercesAdmin.jsx`
- Modify: `client/src/pages/admin/CategoriesAdmin.jsx`
- Modify: `client/src/pages/admin/AbonnementsAdmin.jsx`
- Modify: `client/src/pages/admin/JeuxAdmin.jsx`

- [ ] **Étape 1 : Créer client/src/api/admin.js**

```js
import client from './client';

export const getStats = () => client.get('/admin/stats').then(r => r.data);
export const getMerchants = () => client.get('/admin/merchants').then(r => r.data);
export const creditMerchant = (data) => client.post('/admin/credits', data).then(r => r.data);
export const getCreditHistory = (id) => client.get(`/admin/credits/${id}`).then(r => r.data);
export const getPendingReviews = () => client.get('/reviews/pending').then(r => r.data);
export const moderateReview = (id, status) => client.put(`/reviews/${id}/moderate`, { status }).then(r => r.data);
export const getGames = () => client.get('/games').then(r => r.data);
export const createGame = (data) => client.post('/games', data).then(r => r.data);
export const previewCSV = (formData) => client.post('/admin/import-csv/preview', formData).then(r => r.data);
export const executeCSV = (formData) => client.post('/admin/import-csv/execute', formData).then(r => r.data);
```

- [ ] **Étape 2 : Implémenter client/src/pages/admin/Dashboard.jsx**

```jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Store, Users, Star, AlertCircle } from 'lucide-react';
import { getStats } from '../../api/admin';

const StatCard = ({ icon: Icon, label, value, color, to }) => (
  <Link to={to} className="card p-6 hover:shadow-md transition-shadow">
    <div className={`inline-flex p-3 rounded-xl ${color} mb-4`}><Icon size={24} className="text-white" /></div>
    <p className="text-3xl font-bold text-navy">{value ?? '—'}</p>
    <p className="text-sm text-gray-500 mt-1">{label}</p>
  </Link>
);

export default function Dashboard() {
  const [stats, setStats] = useState({});
  useEffect(() => { getStats().then(setStats); }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="font-serif text-3xl text-navy mb-8">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Store} label="Commerces actifs" value={stats.totalCommerces} color="bg-navy" to="/admin/commerces" />
        <StatCard icon={Users} label="Utilisateurs" value={stats.totalUsers} color="bg-terracotta" to="/admin/abonnements" />
        <StatCard icon={Star} label="Avis en attente" value={stats.pendingReviews} color="bg-sand" to="/admin/avis" />
        <StatCard icon={AlertCircle} label="Jeux actifs" value={stats.activeGames ?? 0} color="bg-navy-light" to="/admin/jeux" />
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { label: 'Importer des commerces (CSV)', to: '/admin/import', emoji: '📋' },
          { label: 'Gérer les catégories', to: '/admin/categories', emoji: '🏷️' },
          { label: 'Lancer un jeu flash', to: '/admin/jeux', emoji: '🎮' },
        ].map(({ label, to, emoji }) => (
          <Link key={to} to={to} className="card p-5 flex items-center gap-3 hover:shadow-md transition-shadow">
            <span className="text-2xl">{emoji}</span>
            <span className="font-medium text-navy">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Étape 3 : Implémenter client/src/pages/admin/ImportAdmin.jsx (wizard 4 étapes)**

```jsx
import { useState, useRef } from 'react';
import { Upload, Eye, Play, CheckCircle } from 'lucide-react';
import { previewCSV, executeCSV } from '../../api/admin';

const STEPS = ['Upload', 'Mappage', 'Prévisualisation', 'Import'];

export default function ImportAdmin() {
  const [step, setStep] = useState(0);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [mapping, setMapping] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  const FIELD_LABELS = { name: 'Nom', address: 'Adresse', lat: 'Latitude', lng: 'Longitude', category: 'Catégorie', subcategory: 'Sous-catégorie', phone: 'Téléphone', website: 'Site web', email: 'Email', description: 'Description', image: 'Image (nom fichier)' };

  const handleFile = async (f) => {
    setFile(f); setLoading(true);
    const fd = new FormData(); fd.append('file', f);
    try {
      const data = await previewCSV(fd);
      setPreview(data);
      setMapping(data.mapping);
      setStep(1);
    } finally { setLoading(false); }
  };

  const handleExecute = async () => {
    setLoading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('mapping', JSON.stringify(mapping));
    try {
      const data = await executeCSV(fd);
      setResult(data); setStep(3);
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="font-serif text-3xl text-navy mb-6">Import CSV des commerces</h1>

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i <= step ? 'bg-navy text-white' : 'bg-cream-dark text-gray-400'}`}>{i + 1}</div>
            <span className={`text-sm hidden sm:block ${i === step ? 'text-navy font-semibold' : 'text-gray-400'}`}>{s}</span>
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 ${i < step ? 'bg-navy' : 'bg-cream-dark'} mx-2`} />}
          </div>
        ))}
      </div>

      {/* Étape 0 : Upload */}
      {step === 0 && (
        <div className="card p-8 text-center border-2 border-dashed border-cream-dark hover:border-navy transition-colors cursor-pointer" onClick={() => fileRef.current.click()}>
          <Upload size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="font-semibold text-navy mb-2">Déposez votre fichier CSV</p>
          <p className="text-sm text-gray-400">Colonnes acceptées : nom, adresse, latitude, longitude, catégorie, image…</p>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />
          {loading && <p className="mt-4 text-navy animate-pulse">Analyse en cours…</p>}
        </div>
      )}

      {/* Étape 1 : Mappage */}
      {step === 1 && preview && (
        <div className="card p-6">
          <h2 className="font-semibold text-lg text-navy mb-4">Mapper les colonnes CSV</h2>
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            {Object.entries(FIELD_LABELS).map(([field, label]) => (
              <div key={field}>
                <label className="text-sm font-medium text-gray-600 mb-1 block">{label}</label>
                <select value={mapping[field] || ''} onChange={e => setMapping(m => ({ ...m, [field]: e.target.value }))}
                  className="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy bg-white">
                  <option value="">— Non mappé —</option>
                  {preview.headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            ))}
          </div>
          <button onClick={() => setStep(2)} className="btn-primary flex items-center gap-2"><Eye size={16} />Prévisualiser</button>
        </div>
      )}

      {/* Étape 2 : Prévisualisation */}
      {step === 2 && preview && (
        <div className="card p-6">
          <h2 className="font-semibold text-lg text-navy mb-2">Prévisualisation ({preview.total} lignes)</h2>
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-cream-dark">{Object.values(mapping).filter(Boolean).map(h => <th key={h} className="text-left py-2 pr-4 text-gray-500 font-medium">{h}</th>)}</tr></thead>
              <tbody>
                {preview.preview.map(({ row, errors }, i) => (
                  <tr key={i} className={`border-b border-cream-dark ${errors.length ? 'bg-red-50' : ''}`}>
                    {Object.values(mapping).filter(Boolean).map(h => <td key={h} className="py-2 pr-4 truncate max-w-32">{row[h] || '—'}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="btn-secondary">Modifier le mappage</button>
            <button onClick={handleExecute} disabled={loading} className="btn-primary flex items-center gap-2">
              <Play size={16} />{loading ? 'Import en cours…' : 'Lancer l'import'}
            </button>
          </div>
        </div>
      )}

      {/* Étape 3 : Résultat */}
      {step === 3 && result && (
        <div className="card p-6 text-center">
          <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
          <h2 className="font-serif text-2xl text-navy mb-4">Import terminé</h2>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 rounded-xl p-4"><p className="text-2xl font-bold text-green-600">{result.created}</p><p className="text-sm text-gray-500">Créés</p></div>
            <div className="bg-yellow-50 rounded-xl p-4"><p className="text-2xl font-bold text-yellow-600">{result.skipped}</p><p className="text-sm text-gray-500">Ignorés</p></div>
            <div className="bg-red-50 rounded-xl p-4"><p className="text-2xl font-bold text-red-600">{result.errors.length}</p><p className="text-sm text-gray-500">Erreurs</p></div>
          </div>
          <button onClick={() => { setStep(0); setFile(null); setPreview(null); setResult(null); }} className="btn-primary">
            Nouvel import
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Étape 4 : Implémenter client/src/pages/admin/AvisAdmin.jsx**

```jsx
import { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { moderateReview } from '../../api/admin';
import client from '../../api/client';

export default function AvisAdmin() {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    client.get('/reviews/pending-admin').then(r => setReviews(r.data)).catch(() => {
      // fallback: récupérer tous les avis pending via une route admin
      client.get('/admin/reviews?status=pending').then(r => setReviews(r.data));
    });
  }, []);

  const moderate = async (id, status) => {
    await moderateReview(id, status);
    setReviews(rs => rs.filter(r => r.id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="font-serif text-3xl text-navy mb-6">Modération des avis</h1>
      {reviews.length === 0
        ? <p className="text-gray-400">Aucun avis en attente.</p>
        : <div className="space-y-4">
            {reviews.map(r => (
              <div key={r.id} className="card p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-navy">{r.user?.name} — {'★'.repeat(r.rating)}</p>
                    <p className="text-sm text-gray-500 mt-1">{r.Commerce?.name || `Commerce #${r.commerce_id}`}</p>
                    <p className="mt-2 text-gray-700">{r.comment}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(r.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button onClick={() => moderate(r.id, 'approved')} className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100"><Check size={18} /></button>
                    <button onClick={() => moderate(r.id, 'rejected')} className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"><X size={18} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
      }
    </div>
  );
}
```

Ajouter dans `server/routes/admin.js` (fin du fichier, avant module.exports) :
```js
router.get('/reviews', requireAdmin, async (req, res, next) => {
  try {
    const { status = 'pending' } = req.query;
    const reviews = await Review.findAll({
      where: { status },
      include: [
        { model: User, as: 'user', attributes: ['id', 'name'] },
        { model: Commerce, attributes: ['id', 'name'] },
      ],
      order: [['created_at', 'ASC']],
    });
    res.json(reviews);
  } catch (err) { next(err); }
});
```

- [ ] **Étape 5 : Implémenter client/src/pages/admin/AbonnementsAdmin.jsx**

```jsx
import { useState, useEffect } from 'react';
import { getMerchants, creditMerchant } from '../../api/admin';

export default function AbonnementsAdmin() {
  const [merchants, setMerchants] = useState([]);
  const [form, setForm] = useState({ merchant_id: '', amount: '', note: '', price_paid: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => { getMerchants().then(setMerchants); }, []);

  const handleCredit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await creditMerchant({ ...form, amount: parseInt(form.amount), price_paid: parseFloat(form.price_paid) || null });
      getMerchants().then(setMerchants);
      setForm({ merchant_id: '', amount: '', note: '', price_paid: '' });
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="font-serif text-3xl text-navy mb-6">Abonnements marchands</h1>
      <div className="grid md:grid-cols-2 gap-6">
        {/* Liste marchands */}
        <div>
          <h2 className="font-semibold text-lg mb-3">Soldes actuels</h2>
          <div className="space-y-3">
            {merchants.map(m => (
              <div key={m.id} className={`card p-4 flex items-center justify-between ${m.tickets_balance < 5 ? 'border-l-4 border-terracotta' : ''}`}>
                <div>
                  <p className="font-semibold">{m.User?.name}</p>
                  <p className="text-sm text-gray-500">{m.commerce?.name}</p>
                </div>
                <div className="text-right">
                  <p className={`text-xl font-bold ${m.tickets_balance < 5 ? 'text-terracotta' : 'text-navy'}`}>{m.tickets_balance}</p>
                  <p className="text-xs text-gray-400">tickets restants</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Formulaire crédit */}
        <div>
          <h2 className="font-semibold text-lg mb-3">Créditer un marchand</h2>
          <form onSubmit={handleCredit} className="card p-5 space-y-4">
            <select value={form.merchant_id} onChange={e => setForm(f => ({ ...f, merchant_id: e.target.value }))} required
              className="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy bg-white">
              <option value="">Choisir un marchand</option>
              {merchants.map(m => <option key={m.id} value={m.user_id}>{m.User?.name} — {m.commerce?.name}</option>)}
            </select>
            <input type="number" min="1" placeholder="Nombre de tickets" value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required
              className="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
            <input type="text" placeholder="Note (ex: Pack Pro 50 tickets)" value={form.note}
              onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              className="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
            <input type="number" step="0.01" placeholder="Prix payé (€, optionnel)" value={form.price_paid}
              onChange={e => setForm(f => ({ ...f, price_paid: e.target.value }))}
              className="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
            <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'En cours…' : 'Créditer'}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Étape 6 : Implémenter client/src/pages/admin/JeuxAdmin.jsx**

```jsx
import { useState, useEffect } from 'react';
import { getGames, createGame } from '../../api/admin';
import client from '../../api/client';

export default function JeuxAdmin() {
  const [games, setGames] = useState([]);
  const [offers, setOffers] = useState([]);
  const [form, setForm] = useState({ title: '', type: 'quiz', ticket_offer_id: '', question: '', options: ['', '', '', ''], answer: 0, riddle: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getGames().then(setGames);
    client.get('/ticket-offers/all').then(r => setOffers(r.data)).catch(() => {});
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault(); setLoading(true);
    const content = form.type === 'quiz'
      ? { question: form.question, options: form.options.filter(Boolean), answer: parseInt(form.answer) }
      : { riddle: form.riddle };
    try {
      await createGame({
        title: form.title, type: form.type, content,
        ticket_offer_id: form.ticket_offer_id || undefined,
        starts_at: new Date().toISOString(),
        ends_at: new Date(Date.now() + 2 * 3600000).toISOString(),
      });
      getGames().then(setGames);
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="font-serif text-3xl text-navy mb-6">Jeux Flash</h1>
      <div className="grid md:grid-cols-2 gap-6">
        {/* Historique */}
        <div>
          <h2 className="font-semibold text-lg mb-3">Historique</h2>
          <div className="space-y-3">
            {games.map(g => (
              <div key={g.id} className="card p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold text-navy">{g.title}</p>
                  <span className={`badge text-xs ${g.status === 'active' ? 'bg-green-100 text-green-700' : g.status === 'ended' ? 'bg-gray-100 text-gray-500' : 'bg-yellow-100 text-yellow-700'}`}>{g.status}</span>
                </div>
                <p className="text-xs text-gray-500">Lot : {g.ticketOffer?.advantage || '—'}</p>
                {g.winner && <p className="text-xs text-green-600 mt-1">Gagnant : {g.winner.name}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Créer jeu */}
        <div>
          <h2 className="font-semibold text-lg mb-3">Nouveau jeu</h2>
          <form onSubmit={handleCreate} className="card p-5 space-y-3">
            <input type="text" placeholder="Titre du jeu" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required
              className="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              className="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy bg-white">
              <option value="quiz">Quiz</option>
              <option value="enigme">Énigme</option>
              <option value="flappy">Flappy (goéland)</option>
            </select>
            <select value={form.ticket_offer_id} onChange={e => setForm(f => ({ ...f, ticket_offer_id: e.target.value }))}
              className="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy bg-white">
              <option value="">Lot aléatoire</option>
              {offers.map(o => <option key={o.id} value={o.id}>{o.title} ({o.quantity_remaining} restants)</option>)}
            </select>

            {form.type === 'quiz' && (
              <>
                <input type="text" placeholder="Question" value={form.question} onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
                  className="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
                {form.options.map((opt, i) => (
                  <div key={i} className="flex gap-2">
                    <input type="radio" name="answer" value={i} checked={form.answer === i} onChange={() => setForm(f => ({ ...f, answer: i }))} />
                    <input type="text" placeholder={`Option ${['A','B','C','D'][i]}`} value={opt}
                      onChange={e => { const opts = [...form.options]; opts[i] = e.target.value; setForm(f => ({ ...f, options: opts })); }}
                      className="flex-1 border border-cream-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
                  </div>
                ))}
              </>
            )}

            {form.type === 'enigme' && (
              <textarea placeholder="Texte de l'énigme (réponse unique attendue)" value={form.riddle}
                onChange={e => setForm(f => ({ ...f, riddle: e.target.value }))} rows={3}
                className="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy resize-none" />
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Lancement…' : '🎮 Lancer le jeu'}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
```

Ajouter dans `server/routes/ticketOffers.js` la route pour admin :
```js
router.get('/all', requireAdmin, async (req, res, next) => {
  try {
    const offers = await TicketOffer.findAll({ where: { is_active: true }, include: [{ model: Commerce, attributes: ['id','name'] }] });
    res.json(offers);
  } catch (err) { next(err); }
});
```

- [ ] **Étape 7 : Implémenter CommercesAdmin et CategoriesAdmin (CRUD basique)**

`client/src/pages/admin/CommercesAdmin.jsx`:
```jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { getCommerces, deleteCommerce, updateCommerce } from '../../api/commerces';

export default function CommercesAdmin() {
  const [data, setData] = useState({ data: [], total: 0 });
  const [search, setSearch] = useState('');

  useEffect(() => { getCommerces({ search, limit: 50 }).then(setData); }, [search]);

  const toggleStatus = async (c) => {
    await updateCommerce(c.id, { status: c.status === 'active' ? 'inactive' : 'active' });
    getCommerces({ search, limit: 50 }).then(setData);
  };

  const remove = async (id) => {
    if (!confirm('Supprimer ce commerce ?')) return;
    await deleteCommerce(id);
    setData(d => ({ ...d, data: d.data.filter(c => c.id !== id) }));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-3xl text-navy">Commerces ({data.total})</h1>
        <Link to="/admin/import" className="btn-primary flex items-center gap-2"><Plus size={16} />Importer CSV</Link>
      </div>
      <input type="search" placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)}
        className="w-full border border-cream-dark rounded-lg px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-navy" />
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-cream border-b border-cream-dark">
            <tr>{['Nom', 'Catégorie', 'Statut', 'Sponsorisé', 'Actions'].map(h => <th key={h} className="text-left px-4 py-3 font-semibold text-navy">{h}</th>)}</tr>
          </thead>
          <tbody>
            {data.data.map(c => (
              <tr key={c.id} className="border-b border-cream-dark hover:bg-cream/50">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 text-gray-500">{c.category?.name || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`badge ${c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{c.status}</span>
                </td>
                <td className="px-4 py-3">{c.is_sponsored ? '⭐' : '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => toggleStatus(c)} title="Toggle statut" className="p-1 text-gray-400 hover:text-navy">
                      {c.status === 'active' ? <ToggleRight size={18} className="text-green-500" /> : <ToggleLeft size={18} />}
                    </button>
                    <Link to={`/commerce/${c.slug}`} target="_blank" className="p-1 text-gray-400 hover:text-navy"><Edit size={18} /></Link>
                    <button onClick={() => remove(c.id)} className="p-1 text-gray-400 hover:text-terracotta"><Trash2 size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

`client/src/pages/admin/CategoriesAdmin.jsx`:
```jsx
import { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronDown } from 'lucide-react';
import { getCategories, createCategory, createSubcategory, deleteCategory } from '../../api/categories';

export default function CategoriesAdmin() {
  const [cats, setCats] = useState([]);
  const [newCat, setNewCat] = useState('');
  const [newSub, setNewSub] = useState({});
  const [expanded, setExpanded] = useState({});

  useEffect(() => { getCategories().then(setCats); }, []);

  const addCat = async (e) => {
    e.preventDefault();
    await createCategory({ name: newCat });
    setNewCat('');
    getCategories().then(setCats);
  };

  const addSub = async (catId) => {
    if (!newSub[catId]) return;
    await createSubcategory(catId, { name: newSub[catId] });
    setNewSub(s => ({ ...s, [catId]: '' }));
    getCategories().then(setCats);
  };

  const delCat = async (id) => {
    if (!confirm('Supprimer cette catégorie ?')) return;
    await deleteCategory(id);
    setCats(cs => cs.filter(c => c.id !== id));
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="font-serif text-3xl text-navy mb-6">Catégories & Sous-catégories</h1>
      <form onSubmit={addCat} className="flex gap-3 mb-6">
        <input value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="Nouvelle catégorie" required
          className="flex-1 border border-cream-dark rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-navy" />
        <button type="submit" className="btn-primary flex items-center gap-2"><Plus size={16} />Ajouter</button>
      </form>
      <div className="space-y-3">
        {cats.map(cat => (
          <div key={cat.id} className="card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 cursor-pointer" onClick={() => setExpanded(e => ({ ...e, [cat.id]: !e[cat.id] }))}>
              <span className="font-semibold text-navy">{cat.name} <span className="text-gray-400 text-sm font-normal">({cat.subcategories?.length || 0} sous-cats)</span></span>
              <div className="flex items-center gap-2">
                <button onClick={(e) => { e.stopPropagation(); delCat(cat.id); }} className="p-1 text-gray-400 hover:text-terracotta"><Trash2 size={16} /></button>
                <ChevronDown size={16} className={`text-gray-400 transition-transform ${expanded[cat.id] ? 'rotate-180' : ''}`} />
              </div>
            </div>
            {expanded[cat.id] && (
              <div className="border-t border-cream-dark px-4 pb-3 pt-2">
                {cat.subcategories?.map(s => (
                  <div key={s.id} className="flex items-center justify-between py-1 text-sm">
                    <span className="text-gray-600">· {s.name}</span>
                  </div>
                ))}
                <div className="flex gap-2 mt-2">
                  <input value={newSub[cat.id] || ''} onChange={e => setNewSub(s => ({ ...s, [cat.id]: e.target.value }))}
                    placeholder="Nouvelle sous-catégorie…"
                    className="flex-1 border border-cream-dark rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
                  <button onClick={() => addSub(cat.id)} className="btn-primary text-sm py-1.5 px-3 flex items-center gap-1"><Plus size={14} />Ajouter</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Étape 8 : Commit**

```bash
git add src/pages/admin/ src/api/admin.js
git commit -m "feat: portail admin complet (dashboard, import CSV, avis, catégories, abonnements, jeux)"
```

---

## Task 13 : Portail Marchand

**Files:**
- Create: `client/src/api/merchant.js`
- Modify: `client/src/pages/merchant/ProDashboard.jsx`
- Modify: `client/src/pages/merchant/ProTickets.jsx`
- Modify: `client/src/pages/merchant/ProOffres.jsx`
- Modify: `client/src/pages/merchant/ProAvis.jsx`

- [ ] **Étape 1 : Créer client/src/api/merchant.js**

```js
import client from './client';

export const getMyOffers = () => client.get('/ticket-offers/mine').then(r => r.data);
export const createOffer = (data) => client.post('/ticket-offers', data).then(r => r.data);
export const updateOffer = (id, data) => client.put(`/ticket-offers/${id}`, data).then(r => r.data);
export const getMyOffers_ = () => client.get('/offers/mine').then(r => r.data);
export const createSpecialOffer = (data) => client.post('/offers', data).then(r => r.data);
export const getMyReviews = () => client.get('/reviews/mine').then(r => r.data);
export const getMyProfile = () => client.get('/merchant/profile').then(r => r.data);
```

Ajouter dans `server/routes/ticketOffers.js` les routes marchand manquantes et dans `server/app.js` ajouter la route `/api/merchant` :

`server/routes/merchant.js` (nouveau fichier) :
```js
const router = require('express').Router();
const { requireMerchant } = require('../middleware/auth');
const { MerchantProfile, Commerce, Review, Offer, TicketOffer, UserTicket } = require('../models');

router.get('/profile', requireMerchant, async (req, res, next) => {
  try {
    const profile = await MerchantProfile.findOne({
      where: { user_id: req.user.id },
      include: [{ model: Commerce, as: 'commerce' }],
    });
    res.json(profile);
  } catch (err) { next(err); }
});

router.get('/stats', requireMerchant, async (req, res, next) => {
  try {
    const profile = await MerchantProfile.findOne({ where: { user_id: req.user.id } });
    if (!profile) return res.status(404).json({ error: 'Profil introuvable' });
    const [activeOffers, totalTicketsUsed, pendingReviews] = await Promise.all([
      TicketOffer.count({ where: { commerce_id: profile.commerce_id, is_active: true } }),
      UserTicket.count({ where: { status: 'used' }, include: [{ model: TicketOffer, where: { commerce_id: profile.commerce_id }, required: true }] }),
      Review.count({ where: { commerce_id: profile.commerce_id, status: 'approved' } }),
    ]);
    res.json({ tickets_balance: profile.tickets_balance, activeOffers, totalTicketsUsed, totalReviews: pendingReviews });
  } catch (err) { next(err); }
});

module.exports = router;
```

Dans `server/app.js` ajouter :
```js
const merchantRoutes = require('./routes/merchant');
app.use('/api/merchant', merchantRoutes);
```

- [ ] **Étape 2 : Implémenter ProDashboard.jsx**

```jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, Star, CheckCircle, CreditCard } from 'lucide-react';
import client from '../../api/client';

export default function ProDashboard() {
  const [stats, setStats] = useState({});
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    client.get('/merchant/profile').then(r => setProfile(r.data));
    client.get('/merchant/stats').then(r => setStats(r.data));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="font-serif text-3xl text-navy mb-2">Mon espace pro</h1>
      {profile && <p className="text-gray-500 mb-6">{profile.commerce?.name}</p>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: CreditCard, label: 'Tickets disponibles', value: stats.tickets_balance, color: 'bg-navy', alert: stats.tickets_balance < 5 },
          { icon: Ticket, label: 'Offres actives', value: stats.activeOffers, color: 'bg-terracotta' },
          { icon: CheckCircle, label: 'Tickets utilisés', value: stats.totalTicketsUsed, color: 'bg-sand' },
          { icon: Star, label: 'Avis clients', value: stats.totalReviews, color: 'bg-navy-light' },
        ].map(({ icon: Icon, label, value, color, alert }) => (
          <div key={label} className={`card p-5 ${alert ? 'border-2 border-terracotta' : ''}`}>
            <div className={`inline-flex p-2 rounded-lg ${color} mb-3`}><Icon size={20} className="text-white" /></div>
            <p className={`text-2xl font-bold ${alert ? 'text-terracotta' : 'text-navy'}`}>{value ?? '—'}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
            {alert && <p className="text-xs text-terracotta mt-1">Solde faible — contactez l'admin</p>}
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {[
          { to: '/pro/tickets', label: 'Gérer mes tickets', emoji: '🎟️' },
          { to: '/pro/offres', label: 'Mes offres spéciales', emoji: '🎁' },
          { to: '/pro/avis', label: 'Voir mes avis', emoji: '⭐' },
          { to: `/commerce/${profile?.commerce?.slug}`, label: 'Voir ma fiche publique', emoji: '👁️' },
        ].map(({ to, label, emoji }) => (
          <Link key={to} to={to} className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
            <span className="text-2xl">{emoji}</span><span className="font-medium text-navy">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Étape 3 : Implémenter ProTickets.jsx**

```jsx
import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { getMyOffers, createOffer, updateOffer } from '../../api/merchant';

export default function ProTickets() {
  const [offers, setOffers] = useState([]);
  const [form, setForm] = useState({ title: '', advantage: '', quantity_total: '', valid_until: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { getMyOffers().then(setOffers); }, []);

  const handleCreate = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const offer = await createOffer({ ...form, quantity_total: parseInt(form.quantity_total) });
      setOffers(os => [offer, ...os]);
      setForm({ title: '', advantage: '', quantity_total: '', valid_until: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la création');
    } finally { setLoading(false); }
  };

  const toggle = async (offer) => {
    const updated = await updateOffer(offer.id, { is_active: !offer.is_active });
    setOffers(os => os.map(o => o.id === offer.id ? { ...o, ...updated } : o));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="font-serif text-3xl text-navy mb-6">Mes tickets d'avantages</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="font-semibold mb-3">Offres existantes</h2>
          {offers.length === 0 ? <p className="text-gray-400 text-sm">Aucune offre créée.</p> : (
            <div className="space-y-3">
              {offers.map(o => (
                <div key={o.id} className="card p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-navy">{o.title}</p>
                      <p className="text-sm text-terracotta mt-0.5">{o.advantage}</p>
                      <p className="text-xs text-gray-400 mt-1">{o.quantity_remaining}/{o.quantity_total} restants</p>
                      {o.valid_until && <p className="text-xs text-gray-400">Jusqu'au {new Date(o.valid_until).toLocaleDateString('fr-FR')}</p>}
                    </div>
                    <button onClick={() => toggle(o)} className={`badge ${o.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {o.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="font-semibold mb-3">Créer une offre</h2>
          <form onSubmit={handleCreate} className="card p-5 space-y-3">
            {error && <p className="text-terracotta text-sm bg-terracotta/10 rounded p-2">{error}</p>}
            <input type="text" placeholder="Titre (ex: Café offert)" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required
              className="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
            <textarea placeholder="Avantage détaillé (libre : réduction, produit offert, etc.)" value={form.advantage}
              onChange={e => setForm(f => ({ ...f, advantage: e.target.value }))} required rows={2}
              className="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-navy" />
            <input type="number" min="1" placeholder="Quantité (tickets à utiliser de votre solde)" value={form.quantity_total}
              onChange={e => setForm(f => ({ ...f, quantity_total: e.target.value }))} required
              className="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
            <input type="date" value={form.valid_until} onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))}
              className="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              <Plus size={16} />{loading ? 'Création…' : 'Créer l\'offre'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Étape 4 : Implémenter ProOffres.jsx et ProAvis.jsx**

`client/src/pages/merchant/ProOffres.jsx`:
```jsx
import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import client from '../../api/client';

export default function ProOffres() {
  const [offers, setOffers] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', valid_from: '', valid_until: '' });
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    client.get('/merchant/profile').then(r => {
      setProfile(r.data);
      client.get(`/offers/commerce/${r.data.commerce_id}`).then(r2 => setOffers(r2.data));
    });
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const { data } = await client.post('/offers', { ...form, commerce_id: profile.commerce_id });
    setOffers(os => [data, ...os]);
    setForm({ title: '', description: '', valid_from: '', valid_until: '' });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="font-serif text-3xl text-navy mb-6">Offres spéciales</h1>
      <form onSubmit={handleCreate} className="card p-5 space-y-3 mb-6">
        <input type="text" placeholder="Titre de l'offre" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required
          className="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
        <textarea placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
          className="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-navy" />
        <div className="grid grid-cols-2 gap-3">
          <input type="date" value={form.valid_from} onChange={e => setForm(f => ({ ...f, valid_from: e.target.value }))}
            className="border border-cream-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
          <input type="date" value={form.valid_until} onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))}
            className="border border-cream-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
        </div>
        <button type="submit" className="btn-primary flex items-center gap-2"><Plus size={16} />Ajouter l'offre</button>
      </form>
      <div className="space-y-3">
        {offers.map(o => (
          <div key={o.id} className="card p-4 flex items-start justify-between">
            <div><p className="font-semibold text-navy">{o.title}</p><p className="text-sm text-gray-500 mt-1">{o.description}</p></div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

`client/src/pages/merchant/ProAvis.jsx`:
```jsx
import { useState, useEffect } from 'react';
import client from '../../api/client';

export default function ProAvis() {
  const [reviews, setReviews] = useState([]);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    client.get('/merchant/profile').then(r => {
      setProfile(r.data);
      client.get(`/reviews/commerce/${r.data.commerce_id}`).then(r2 => setReviews(r2.data));
    });
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="font-serif text-3xl text-navy mb-6">Avis clients</h1>
      {reviews.length === 0 ? <p className="text-gray-400">Aucun avis approuvé.</p> : (
        <div className="space-y-3">
          {reviews.map(r => (
            <div key={r.id} className="card p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm">{r.user?.name}</span>
                <span className="text-sand">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                <span className="text-xs text-gray-400 ml-auto">{new Date(r.created_at).toLocaleDateString('fr-FR')}</span>
              </div>
              <p className="text-sm text-gray-600">{r.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

Ajouter les routes manquantes dans `server/routes/admin.js` :
```js
// Offers CRUD basique
const Offer = require('../models').Offer;
router.get('/offers/commerce/:id', async (req, res, next) => {
  try { res.json(await Offer.findAll({ where: { commerce_id: req.params.id } })); } catch (err) { next(err); }
});
```

Et dans `server/routes/favorites.js` ajouter une route offers (ou créer `server/routes/offers.js`) :
```js
// server/routes/offers.js
const router = require('express').Router();
const { Offer } = require('../models');
const { requireMerchant } = require('../middleware/auth');

router.get('/commerce/:id', async (req, res, next) => {
  try { res.json(await Offer.findAll({ where: { commerce_id: req.params.id, is_active: true } })); } catch (err) { next(err); }
});
router.post('/', requireMerchant, async (req, res, next) => {
  try { res.status(201).json(await Offer.create(req.body)); } catch (err) { next(err); }
});
module.exports = router;
```

Dans `server/app.js` ajouter `app.use('/api/offers', require('./routes/offers'));`.

- [ ] **Étape 5 : Commit**

```bash
git add src/pages/merchant/ src/api/merchant.js
git commit -m "feat: portail marchand (dashboard, tickets, offres, avis)"
```

---

## Task 14 : Service Worker & Web Push (PWA)

**Files:**
- Create: `client/public/sw.js`
- Modify: `client/src/main.jsx`

- [ ] **Étape 1 : Créer client/public/sw.js**

```js
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: data.data,
      vibrate: [200, 100, 200],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.game_id ? `/jeu/${event.notification.data.game_id}` : '/';
  event.waitUntil(clients.openWindow(url));
});
```

- [ ] **Étape 2 : Enregistrer le SW et demander permission dans main.jsx**

Ajouter après `createRoot(...).render(...)` dans `client/src/main.jsx` :

```jsx
// Enregistrement Service Worker + Web Push
if ('serviceWorker' in navigator && 'PushManager' in window) {
  navigator.serviceWorker.register('/sw.js').then(async (reg) => {
    const vapidRes = await fetch(`${import.meta.env.VITE_API_URL}/notifications/vapid-key`);
    const { publicKey } = await vapidRes.json();
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: publicKey,
    });
    await fetch(`${import.meta.env.VITE_API_URL}/notifications/push/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify({ endpoint: sub.endpoint, p256dh: btoa(String.fromCharCode(...new Uint8Array(sub.getKey('p256dh')))), auth: btoa(String.fromCharCode(...new Uint8Array(sub.getKey('auth')))) }),
    });
  }).catch(() => {});
}
```

- [ ] **Étape 3 : Créer une icône de base**

```bash
# Télécharger ou créer une icône 192x192 dans client/public/
# Pour les tests, utiliser n'importe quelle image PNG nommée icon-192.png
curl -o client/public/icon-192.png https://via.placeholder.com/192x192/1C3A5E/F2C078?text=PC
```

- [ ] **Étape 4 : Vérifier le build complet**

```bash
cd client && npm run build
# Vérifier qu'il n'y a pas d'erreur TypeScript/ESLint
# Déployer sur Vercel : git push → Vercel déploie automatiquement
```

- [ ] **Étape 5 : Commit final**

```bash
git add public/sw.js src/main.jsx
git commit -m "feat: Service Worker PWA + Web Push notifications"
```

---

## Vérification Finale — Self-Review Plan vs Spec

| Exigence spec | Tâche couverte |
|---|---|
| Auth JWT + Google OAuth | Task 3 |
| 16 tables MySQL | Task 2 |
| API commerces + filtres + carte | Task 4 |
| Avis modérés | Task 5 |
| Favoris | Task 5 |
| Cloudinary + import CSV GitHub | Task 6 |
| Crédits marchands + transactions | Task 6 |
| Tickets QR usage unique | Task 7 |
| Jeux (quiz/énigme/flappy) | Task 8 (backend) + Task 11 (UI) |
| Socket.io temps réel | Task 8 |
| Web Push | Task 8 (backend) + Task 14 (SW) |
| Home + Explorer liste/carte Leaflet | Task 10 |
| Fiche commerce galerie + mini-carte | Task 10 |
| Login + Register + OAuth callback | Task 10 |
| Profil + Favoris + Coffre QR | Task 10 |
| GameBanner + Quiz + Énigme + Flappy goéland | Task 11 |
| Admin dashboard + stats | Task 12 |
| Import CSV 4 étapes | Task 12 |
| Modération avis | Task 12 |
| CRUD catégories + sous-catégories | Task 12 |
| Abonnements marchands | Task 12 |
| Jeux admin | Task 12 |
| Pro dashboard + tickets + offres + avis | Task 13 |
| PWA Service Worker | Task 14 |
| Domaine lepetitclapas.lagenceduclapas.fr | Config Vercel/Railway (post-déploiement) |

---

## Déploiement Railway + Vercel

```bash
# Backend Railway
cd server
railway login
railway init
railway add mysql
railway up

# Frontend Vercel
cd client
vercel --prod
# Configurer VITE_API_URL=https://api.lepetitclapas.lagenceduclapas.fr dans Vercel env

# Variables d'environnement Railway (à configurer dans le dashboard Railway) :
# DB_*, JWT_SECRET, GOOGLE_*, CLOUDINARY_*, VAPID_*, CLIENT_URL, GITHUB_RAW_BASE
```
