# Le Petit Clapas — Plan Phase 1 (Partie 4 : Pages publiques + User + Jeux)

> Lire part3.md avant de commencer.

---

## Task 10 : Pages Publiques (Home, Explorer, CommercePage)

**Files:**
- Create: `client/src/api/commerces.js`
- Create: `client/src/api/categories.js`
- Create: `client/src/components/commerce/CommerceCard.jsx`
- Create: `client/src/components/commerce/CommerceMap.jsx`
- Create: `client/src/components/commerce/CommerceFilters.jsx`
- Modify: `client/src/pages/public/Home.jsx`
- Modify: `client/src/pages/public/Explorer.jsx`
- Modify: `client/src/pages/public/CommercePage.jsx`

- [ ] **Étape 1 : Créer client/src/api/commerces.js**

```js
import client from './client';

export const getCommerces = (params) => client.get('/commerces', { params }).then(r => r.data);
export const getCommerceMap = () => client.get('/commerces/map').then(r => r.data);
export const getSponsored = () => client.get('/commerces/sponsored').then(r => r.data);
export const getCommerce = (slug) => client.get(`/commerces/${slug}`).then(r => r.data);
export const createCommerce = (data) => client.post('/commerces', data).then(r => r.data);
export const updateCommerce = (id, data) => client.put(`/commerces/${id}`, data).then(r => r.data);
export const deleteCommerce = (id) => client.delete(`/commerces/${id}`).then(r => r.data);
export const toggleFavorite = (commerce_id, isFav) =>
  isFav ? client.delete(`/favorites/${commerce_id}`) : client.post(`/favorites/${commerce_id}`);
export const getMyFavorites = () => client.get('/favorites/mine').then(r => r.data);
```

- [ ] **Étape 2 : Créer client/src/api/categories.js**

```js
import client from './client';

export const getCategories = () => client.get('/categories').then(r => r.data);
export const createCategory = (data) => client.post('/categories', data).then(r => r.data);
export const createSubcategory = (catId, data) => client.post(`/categories/${catId}/subcategories`, data).then(r => r.data);
export const deleteCategory = (id) => client.delete(`/categories/${id}`).then(r => r.data);
```

- [ ] **Étape 3 : Créer client/src/components/commerce/CommerceCard.jsx**

```jsx
import { Link } from 'react-router-dom';
import { MapPin, Star, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

export const CommerceCard = ({ commerce, isFavorite, onToggleFavorite }) => {
  const primaryImage = commerce.images?.[0]?.cloudinary_url;
  const avgRating = commerce.reviews?.length
    ? (commerce.reviews.reduce((s, r) => s + r.rating, 0) / commerce.reviews.length).toFixed(1)
    : null;

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }} className="card group">
      <Link to={`/commerce/${commerce.slug}`}>
        <div className="relative h-48 bg-cream-dark overflow-hidden">
          {primaryImage
            ? <img src={primaryImage} alt={commerce.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            : <div className="w-full h-full bg-gradient-to-br from-navy to-navy-light flex items-center justify-center"><span className="text-4xl">🏪</span></div>
          }
          {commerce.is_sponsored && (
            <span className="absolute top-2 left-2 badge bg-sand text-navy">Sponsorisé</span>
          )}
          {onToggleFavorite && (
            <button onClick={(e) => { e.preventDefault(); onToggleFavorite(commerce.id); }}
              className="absolute top-2 right-2 p-2 rounded-full bg-white/90 hover:bg-white transition-colors">
              <Heart size={16} className={isFavorite ? 'fill-terracotta text-terracotta' : 'text-gray-400'} />
            </button>
          )}
        </div>
      </Link>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <Link to={`/commerce/${commerce.slug}`} className="font-serif font-bold text-navy hover:text-terracotta transition-colors leading-tight">
            {commerce.name}
          </Link>
          {avgRating && (
            <span className="flex items-center gap-1 text-sm text-sand shrink-0">
              <Star size={14} className="fill-sand" />{avgRating}
            </span>
          )}
        </div>
        {commerce.category && <span className="text-xs text-gray-500">{commerce.category.name}</span>}
        {commerce.address && (
          <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
            <MapPin size={12} /><span className="truncate">{commerce.address}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};
```

- [ ] **Étape 4 : Créer client/src/components/commerce/CommerceMap.jsx**

```jsx
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix icône Leaflet avec Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const MONTPELLIER = [43.6108, 3.8767];

export const CommerceMap = ({ points = [], height = '500px' }) => (
  <MapContainer center={MONTPELLIER} zoom={13} style={{ height, width: '100%', borderRadius: '12px' }}>
    <TileLayer
      attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    />
    {points.filter(p => p.lat && p.lng).map(p => (
      <Marker key={p.id} position={[parseFloat(p.lat), parseFloat(p.lng)]}>
        <Popup>
          <Link to={`/commerce/${p.slug}`} className="font-semibold text-navy hover:underline">{p.name}</Link>
        </Popup>
      </Marker>
    ))}
  </MapContainer>
);
```

- [ ] **Étape 5 : Créer client/src/components/commerce/CommerceFilters.jsx**

```jsx
import { useState, useEffect } from 'react';
import { getCategories } from '../../api/categories';

export const CommerceFilters = ({ onChange }) => {
  const [categories, setCategories] = useState([]);
  const [selected, setSelected] = useState({ category: '', subcategory: '', search: '' });

  useEffect(() => { getCategories().then(setCategories); }, []);

  const update = (key, val) => {
    const next = { ...selected, [key]: val };
    if (key === 'category') next.subcategory = '';
    setSelected(next);
    onChange(next);
  };

  const currentCat = categories.find(c => String(c.id) === String(selected.category));

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <input
        type="search" placeholder="Rechercher un lieu…"
        value={selected.search} onChange={e => update('search', e.target.value)}
        className="flex-1 min-w-48 border border-cream-dark rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
      />
      <select value={selected.category} onChange={e => update('category', e.target.value)}
        className="border border-cream-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy bg-white">
        <option value="">Toutes catégories</option>
        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      {currentCat?.subcategories?.length > 0 && (
        <select value={selected.subcategory} onChange={e => update('subcategory', e.target.value)}
          className="border border-cream-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy bg-white">
          <option value="">Toutes sous-catégories</option>
          {currentCat.subcategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      )}
    </div>
  );
};
```

- [ ] **Étape 6 : Implémenter client/src/pages/public/Home.jsx**

```jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { getSponsored, getCommerces } from '../../api/commerces';
import { CommerceCard } from '../../components/commerce/CommerceCard';

export default function Home() {
  const [sponsored, setSponsored] = useState([]);
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    getSponsored().then(setSponsored);
    getCommerces({ limit: 8, sort: 'name' }).then(r => setFeatured(r.data));
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy to-navy-light text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sand text-sm font-semibold tracking-widest uppercase mb-4">
            City Guide · Montpellier
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="font-serif text-4xl md:text-6xl italic mb-6 leading-tight">
            Découvrez les lieux secrets de la ville
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="text-white/70 mb-8">
            Commerces authentiques, sélection éditoriale
          </motion.p>
          <Link to="/explorer" className="inline-flex items-center gap-2 bg-terracotta hover:bg-terracotta-dark text-white font-semibold px-8 py-4 rounded-xl transition-colors">
            Explorer la carte <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Sponsorisés */}
      {sponsored.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-2xl text-navy">Nos partenaires</h2>
            <Link to="/explorer" className="text-sm text-terracotta hover:underline">Voir tout</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sponsored.map(c => <CommerceCard key={c.id} commerce={c} />)}
          </div>
        </section>
      )}

      {/* Coups de cœur */}
      <section className="max-w-6xl mx-auto px-4 pb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-2xl text-navy">Coups de cœur</h2>
          <Link to="/explorer" className="text-sm text-terracotta hover:underline flex items-center gap-1">
            Tout explorer <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featured.map(c => <CommerceCard key={c.id} commerce={c} />)}
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Étape 7 : Implémenter client/src/pages/public/Explorer.jsx**

```jsx
import { useState, useEffect, useCallback } from 'react';
import { LayoutList, Map } from 'lucide-react';
import { getCommerces, getCommerceMap } from '../../api/commerces';
import { CommerceCard } from '../../components/commerce/CommerceCard';
import { CommerceMap } from '../../components/commerce/CommerceMap';
import { CommerceFilters } from '../../components/commerce/CommerceFilters';

export default function Explorer() {
  const [view, setView] = useState('list'); // 'list' | 'map'
  const [commerces, setCommerces] = useState([]);
  const [mapPoints, setMapPoints] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(false);

  const fetchCommerces = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCommerces({ ...filters, page, limit: 20 });
      setCommerces(data.data);
      setTotal(data.total);
    } finally { setLoading(false); }
  }, [filters, page]);

  useEffect(() => { fetchCommerces(); }, [fetchCommerces]);
  useEffect(() => { if (view === 'map') getCommerceMap().then(setMapPoints); }, [view]);
  useEffect(() => { setPage(1); }, [filters]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-3xl text-navy">Explorer Montpellier</h1>
        <div className="flex gap-2 bg-white rounded-lg border border-cream-dark p-1">
          <button onClick={() => setView('list')} className={`p-2 rounded ${view === 'list' ? 'bg-navy text-white' : 'text-gray-400 hover:text-navy'}`}>
            <LayoutList size={18} />
          </button>
          <button onClick={() => setView('map')} className={`p-2 rounded ${view === 'map' ? 'bg-navy text-white' : 'text-gray-400 hover:text-navy'}`}>
            <Map size={18} />
          </button>
        </div>
      </div>

      <CommerceFilters onChange={setFilters} />

      {view === 'map' ? (
        <CommerceMap points={mapPoints} height="600px" />
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">{total} lieu{total > 1 ? 'x' : ''} trouvé{total > 1 ? 's' : ''}</p>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => <div key={i} className="card h-64 animate-pulse bg-cream-dark" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {commerces.map(c => <CommerceCard key={c.id} commerce={c} />)}
            </div>
          )}
          {total > page * 20 && (
            <div className="text-center mt-8">
              <button onClick={() => setPage(p => p + 1)} className="btn-primary">Voir plus</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
```

- [ ] **Étape 8 : Implémenter client/src/pages/public/CommercePage.jsx**

```jsx
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, Phone, Globe, Clock, Heart, Navigation } from 'lucide-react';
import { motion } from 'framer-motion';
import { getCommerce, toggleFavorite, getMyFavorites } from '../../api/commerces';
import { CommerceMap } from '../../components/commerce/CommerceMap';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';

export default function CommercePage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [commerce, setCommerce] = useState(null);
  const [isFav, setIsFav] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [review, setReview] = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getCommerce(slug).then(setCommerce);
    if (user) getMyFavorites().then(favs => setIsFav(favs.some(f => f.slug === slug)));
  }, [slug, user]);

  const handleFav = async () => {
    await toggleFavorite(commerce.id, isFav);
    setIsFav(!isFav);
  };

  const handleReview = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await client.post('/reviews', { commerce_id: commerce.id, ...review });
      alert('Avis envoyé, en attente de modération. Merci !');
      setReview({ rating: 5, comment: '' });
    } finally { setSubmitting(false); }
  };

  if (!commerce) return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy" /></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Galerie */}
      {commerce.images?.length > 0 && (
        <div className="mb-8">
          <div className="relative h-72 md:h-96 rounded-2xl overflow-hidden mb-2">
            <motion.img key={activeImg} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              src={commerce.images[activeImg].cloudinary_url} alt={commerce.name}
              className="w-full h-full object-cover" />
          </div>
          {commerce.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {commerce.images.map((img, i) => (
                <button key={img.id} onClick={() => setActiveImg(i)}
                  className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${i === activeImg ? 'border-navy' : 'border-transparent'}`}>
                  <img src={img.cloudinary_url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-8">
        {/* Infos principales */}
        <div className="md:col-span-2">
          <div className="flex items-start justify-between mb-4">
            <div>
              {commerce.is_sponsored && <span className="badge bg-sand text-navy mb-2">Sponsorisé</span>}
              <h1 className="font-serif text-3xl text-navy">{commerce.name}</h1>
              {commerce.category && <p className="text-terracotta text-sm mt-1">{commerce.category.name}{commerce.subcategory ? ` · ${commerce.subcategory.name}` : ''}</p>}
            </div>
            {user && (
              <button onClick={handleFav} className="p-3 rounded-full border border-cream-dark hover:border-terracotta transition-colors">
                <Heart size={20} className={isFav ? 'fill-terracotta text-terracotta' : 'text-gray-400'} />
              </button>
            )}
          </div>

          {commerce.description && <p className="text-gray-600 leading-relaxed mb-6">{commerce.description}</p>}

          {/* Offres exclusives */}
          {commerce.offers?.length > 0 && (
            <div className="bg-sand/20 border border-sand rounded-xl p-4 mb-6">
              <h3 className="font-semibold text-navy mb-2">🎁 Offres exclusives</h3>
              {commerce.offers.map(o => (
                <div key={o.id} className="mb-2">
                  <p className="font-medium">{o.title}</p>
                  {o.description && <p className="text-sm text-gray-600">{o.description}</p>}
                </div>
              ))}
            </div>
          )}

          {/* Avis */}
          <div className="mb-6">
            <h3 className="font-serif text-xl text-navy mb-4">Avis clients</h3>
            {commerce.reviews?.length === 0 && <p className="text-gray-400 text-sm">Aucun avis pour le moment.</p>}
            {commerce.reviews?.map(r => (
              <div key={r.id} className="border-b border-cream-dark py-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm">{r.user?.name}</span>
                  <span className="text-sand">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                </div>
                <p className="text-sm text-gray-600">{r.comment}</p>
              </div>
            ))}
          </div>

          {/* Formulaire avis */}
          {user && (
            <form onSubmit={handleReview} className="bg-cream rounded-xl p-4">
              <h4 className="font-semibold mb-3">Laisser un avis</h4>
              <div className="flex gap-2 mb-3">
                {[1,2,3,4,5].map(n => (
                  <button key={n} type="button" onClick={() => setReview(r => ({ ...r, rating: n }))}
                    className={`text-2xl ${n <= review.rating ? 'text-sand' : 'text-gray-300'}`}>★</button>
                ))}
              </div>
              <textarea value={review.comment} onChange={e => setReview(r => ({ ...r, comment: e.target.value }))}
                placeholder="Votre expérience…" rows={3}
                className="w-full border border-cream-dark rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-navy mb-3" />
              <button type="submit" disabled={submitting} className="btn-primary text-sm py-2">
                {submitting ? 'Envoi…' : 'Envoyer'}
              </button>
            </form>
          )}
        </div>

        {/* Sidebar infos contact */}
        <div className="space-y-4">
          <div className="card p-4 space-y-3">
            {commerce.address && (
              <div className="flex gap-2 text-sm">
                <MapPin size={16} className="text-terracotta shrink-0 mt-0.5" />
                <span>{commerce.address}</span>
              </div>
            )}
            {commerce.phone && (
              <a href={`tel:${commerce.phone}`} className="flex gap-2 text-sm hover:text-terracotta transition-colors">
                <Phone size={16} className="text-terracotta shrink-0" />{commerce.phone}
              </a>
            )}
            {commerce.website && (
              <a href={commerce.website} target="_blank" rel="noreferrer" className="flex gap-2 text-sm hover:text-terracotta transition-colors">
                <Globe size={16} className="text-terracotta shrink-0" />Site web
              </a>
            )}
            {commerce.address && (
              <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(commerce.address)}`}
                target="_blank" rel="noreferrer"
                className="flex items-center gap-2 text-sm text-white bg-navy rounded-lg p-2 hover:bg-navy-dark transition-colors">
                <Navigation size={16} />Itinéraire
              </a>
            )}
          </div>

          {/* Mini carte */}
          {commerce.lat && commerce.lng && (
            <CommerceMap points={[commerce]} height="200px" />
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Étape 9 : Implémenter client/src/pages/public/Login.jsx**

```jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { data } = await client.post('/auth/login', form);
      login(data.token, data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Identifiants invalides');
    } finally { setLoading(false); }
  };

  const handleGoogle = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="font-serif text-3xl text-navy text-center mb-8">Connexion</h1>
        <div className="card p-8">
          <button onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 border border-cream-dark rounded-lg py-3 mb-6 hover:bg-cream transition-colors font-medium">
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
            Continuer avec Google
          </button>
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 border-t border-cream-dark" />
            <span className="text-xs text-gray-400">ou</span>
            <div className="flex-1 border-t border-cream-dark" />
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-terracotta text-sm bg-terracotta/10 rounded-lg p-3">{error}</p>}
            <input type="email" placeholder="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required
              className="w-full border border-cream-dark rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-navy" />
            <input type="password" placeholder="Mot de passe" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required
              className="w-full border border-cream-dark rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-navy" />
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-4">
            Pas encore de compte ? <Link to="/inscription" className="text-terracotta hover:underline">S'inscrire</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Étape 10 : Implémenter client/src/pages/public/Register.jsx**

```jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { data } = await client.post('/auth/register', form);
      login(data.token, data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Erreur lors de l\'inscription');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="font-serif text-3xl text-navy text-center mb-8">Créer un compte</h1>
        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-terracotta text-sm bg-terracotta/10 rounded-lg p-3">{error}</p>}
            <input type="text" placeholder="Votre prénom" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required
              className="w-full border border-cream-dark rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-navy" />
            <input type="email" placeholder="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required
              className="w-full border border-cream-dark rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-navy" />
            <input type="password" placeholder="Mot de passe (8 caractères min.)" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} minLength={8} required
              className="w-full border border-cream-dark rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-navy" />
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Création…' : 'Créer mon compte'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-4">
            Déjà un compte ? <Link to="/connexion" className="text-terracotta hover:underline">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Étape 11 : Créer client/src/pages/public/AuthCallback.jsx**

```jsx
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';

export default function AuthCallback() {
  const [params] = useSearchParams();
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get('token');
    const error = params.get('error');
    if (error || !token) { navigate('/connexion?error=oauth'); return; }
    localStorage.setItem('token', token);
    client.get('/auth/me').then(res => {
      login(token, res.data);
      navigate('/');
    });
  }, []);

  return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy" /></div>;
}
```

- [ ] **Étape 12 : Implémenter les pages utilisateur**

`client/src/pages/user/Favorites.jsx`:
```jsx
import { useState, useEffect } from 'react';
import { getMyFavorites } from '../../api/commerces';
import { CommerceCard } from '../../components/commerce/CommerceCard';

export default function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { getMyFavorites().then(setFavorites).finally(() => setLoading(false)); }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="font-serif text-3xl text-navy mb-6">Mes favoris</h1>
      {loading ? <p>Chargement…</p> : favorites.length === 0
        ? <p className="text-gray-400">Aucun favori pour le moment.</p>
        : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {favorites.map(c => <CommerceCard key={c.id} commerce={c} />)}
          </div>
      }
    </div>
  );
}
```

`client/src/pages/user/Coffre.jsx`:
```jsx
import { useState, useEffect } from 'react';
import { QrCode, CheckCircle, Clock, XCircle } from 'lucide-react';
import client from '../../api/client';

const statusConfig = {
  pending: { icon: Clock, label: 'À utiliser', color: 'text-sand' },
  used: { icon: CheckCircle, label: 'Utilisé', color: 'text-green-500' },
  expired: { icon: XCircle, label: 'Expiré', color: 'text-gray-400' },
};

export default function Coffre() {
  const [tickets, setTickets] = useState([]);

  useEffect(() => { client.get('/user-tickets/mine').then(r => setTickets(r.data)); }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="font-serif text-3xl text-navy mb-6">Mon coffre de récompenses</h1>
      {tickets.length === 0
        ? <div className="text-center py-16 text-gray-400">
            <QrCode size={48} className="mx-auto mb-4 opacity-30" />
            <p>Participez aux jeux flash pour gagner des récompenses !</p>
          </div>
        : <div className="space-y-4">
            {tickets.map(t => {
              const { icon: Icon, label, color } = statusConfig[t.status];
              return (
                <div key={t.id} className={`card p-5 ${t.status !== 'pending' ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-navy">{t.ticketOffer?.advantage}</p>
                      <p className="text-sm text-gray-500 mt-1">{t.ticketOffer?.Commerce?.name}</p>
                      <p className="text-xs text-gray-400 mt-2">Gagné le {new Date(t.won_at).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <div className="text-center ml-4">
                      {t.status === 'pending' && (
                        <div className="bg-navy text-white text-xs font-mono p-3 rounded-lg">
                          <QrCode size={48} className="mx-auto mb-1" />
                          <p className="truncate max-w-24">{t.qr_code}</p>
                        </div>
                      )}
                      <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${color}`}>
                        <Icon size={12} />{label}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
      }
    </div>
  );
}
```

`client/src/pages/user/Profile.jsx`:
```jsx
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="font-serif text-3xl text-navy mb-6">Mon profil</h1>
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          {user?.avatar_url
            ? <img src={user.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover" />
            : <div className="w-16 h-16 rounded-full bg-navy flex items-center justify-center text-white font-bold text-xl">{user?.name?.[0]}</div>
          }
          <div>
            <p className="font-semibold text-lg">{user?.name}</p>
            <p className="text-gray-500 text-sm">{user?.email}</p>
            <span className="badge bg-cream-dark text-navy mt-1">{user?.role}</span>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-terracotta hover:underline text-sm">
          <LogOut size={16} />Se déconnecter
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Étape 13 : Vérifier visuellement les pages**

```bash
cd client && npm run dev
# Tester : /, /explorer, /connexion, /inscription
# Vérifier la carte Leaflet sur /explorer (toggle vue carte)
# Vérifier les cards commerce
```

- [ ] **Étape 14 : Commit**

```bash
git add src/
git commit -m "feat: pages publiques Home/Explorer/CommercePage + auth Login/Register + pages user"
```

---

## Task 11 : GameBanner + Jeux Flash UI

**Files:**
- Modify: `client/src/components/games/GameBanner.jsx`
- Create: `client/src/components/games/QuizGame.jsx`
- Create: `client/src/components/games/EnigmeGame.jsx`
- Create: `client/src/components/games/FlappyGame.jsx`
- Create: `client/src/pages/public/GamePage.jsx`

- [ ] **Étape 1 : Implémenter client/src/components/games/GameBanner.jsx**

```jsx
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gamepad2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const GameBanner = ({ game, onClose }) => (
  <AnimatePresence>
    {game && (
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-16 left-0 right-0 z-40 bg-terracotta text-white shadow-lg"
      >
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Gamepad2 size={20} className="shrink-0 animate-pulse" />
            <div>
              <p className="font-semibold text-sm">🎮 Jeu en cours : {game.title}</p>
              <p className="text-xs text-white/80">Lot à gagner : {game.ticketOffer?.advantage}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link to={`/jeu/${game.id}`} onClick={onClose}
              className="bg-white text-terracotta text-xs font-bold px-4 py-2 rounded-lg hover:bg-cream transition-colors">
              Jouer !
            </Link>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded"><X size={18} /></button>
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);
```

- [ ] **Étape 2 : Créer client/src/components/games/QuizGame.jsx**

```jsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import client from '../../api/client';

export const QuizGame = ({ game, onWon }) => {
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const { question, options } = game.content || {};

  const submit = async (idx) => {
    setSelected(idx); setLoading(true);
    try {
      const { data } = await client.post(`/games/${game.id}/play`, { answer: idx });
      setResult(data);
      if (data.won) onWon?.(data);
    } finally { setLoading(false); }
  };

  if (result) return (
    <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="text-center py-8">
      {result.won
        ? <><p className="text-4xl mb-4">🎉</p><h2 className="font-serif text-2xl text-navy mb-2">Bravo ! Vous avez gagné !</h2><p className="text-gray-600">{result.advantage}</p><p className="text-sm text-gray-400 mt-2">Votre ticket est dans votre coffre.</p></>
        : <><p className="text-4xl mb-4">😔</p><h2 className="font-serif text-2xl text-navy mb-2">Mauvaise réponse</h2><p className="text-gray-600">Retentez votre chance au prochain jeu !</p></>
      }
    </motion.div>
  );

  return (
    <div className="py-6">
      <h2 className="font-serif text-2xl text-navy mb-6 text-center">{question}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options?.map((opt, i) => (
          <button key={i} onClick={() => !selected && submit(i)} disabled={loading || selected !== null}
            className={`p-4 rounded-xl border-2 text-left font-medium transition-all ${
              selected === i ? 'border-navy bg-navy text-white' : 'border-cream-dark hover:border-navy hover:bg-cream'
            }`}>
            <span className="font-bold mr-2">{['A', 'B', 'C', 'D'][i]}.</span>{opt}
          </button>
        ))}
      </div>
    </div>
  );
};
```

- [ ] **Étape 3 : Créer client/src/components/games/EnigmeGame.jsx**

```jsx
import { useState } from 'react';
import client from '../../api/client';

export const EnigmeGame = ({ game, onWon }) => {
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await client.post(`/games/${game.id}/play`, { answer });
      setResult(data);
      if (data.won) onWon?.(data);
    } finally { setLoading(false); }
  };

  return (
    <div className="py-6">
      <div className="bg-cream rounded-xl p-6 mb-6">
        <p className="font-serif text-lg text-navy leading-relaxed">{game.content?.riddle}</p>
      </div>
      {result ? (
        <div className="text-center">
          {result.won ? <p className="text-green-600 font-bold text-lg">🎉 Bonne réponse ! Votre récompense est dans votre coffre.</p>
            : <p className="text-terracotta font-medium">Ce n'est pas la bonne réponse. Réessayez !</p>}
        </div>
      ) : (
        <form onSubmit={submit} className="flex gap-3">
          <input type="text" value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Votre réponse…"
            className="flex-1 border border-cream-dark rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-navy" required />
          <button type="submit" disabled={loading} className="btn-primary">{loading ? '…' : 'Envoyer'}</button>
        </form>
      )}
    </div>
  );
};
```

- [ ] **Étape 4 : Créer client/src/components/games/FlappyGame.jsx**

```jsx
import { useEffect, useRef, useState } from 'react';
import client from '../../api/client';

const W = 400, H = 500, GRAVITY = 0.4, JUMP = -8, PIPE_GAP = 140, PIPE_W = 50, SPEED = 2.5;

export const FlappyGame = ({ game, onWon }) => {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    bird: { y: H / 2, vy: 0 },
    pipes: [],
    score: 0,
    frame: 0,
    running: false,
    over: false,
  });
  const rafRef = useRef(null);
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const jump = () => {
    const s = stateRef.current;
    if (s.over) return;
    if (!s.running) s.running = true;
    s.bird.vy = JUMP;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const reset = () => {
      stateRef.current = { bird: { y: H / 2, vy: 0 }, pipes: [], score: 0, frame: 0, running: false, over: false };
      setScore(0); setOver(false);
    };

    const spawnPipe = () => {
      const top = Math.random() * (H - PIPE_GAP - 80) + 40;
      stateRef.current.pipes.push({ x: W, top, passed: false });
    };

    const loop = () => {
      const s = stateRef.current;
      ctx.clearRect(0, 0, W, H);

      // Fond ciel méditerranéen
      ctx.fillStyle = '#1C3A5E';
      ctx.fillRect(0, 0, W, H);

      if (s.running && !s.over) {
        s.bird.vy += GRAVITY;
        s.bird.y += s.bird.vy;
        s.frame++;

        if (s.frame % 90 === 0) spawnPipe();

        s.pipes = s.pipes.filter(p => p.x + PIPE_W > 0);
        for (const p of s.pipes) {
          p.x -= SPEED;
          if (!p.passed && p.x + PIPE_W < 80) { p.passed = true; s.score++; setScore(s.score); }
          // Collision
          if (80 + 20 > p.x && 80 - 20 < p.x + PIPE_W) {
            if (s.bird.y - 14 < p.top || s.bird.y + 14 > p.top + PIPE_GAP) { s.over = true; setOver(true); }
          }
        }
        if (s.bird.y > H || s.bird.y < 0) { s.over = true; setOver(true); }
      }

      // Dessin tuyaux (couleur terre cuite)
      ctx.fillStyle = '#C4603A';
      for (const p of s.pipes) {
        ctx.fillRect(p.x, 0, PIPE_W, p.top);
        ctx.fillRect(p.x, p.top + PIPE_GAP, PIPE_W, H - p.top - PIPE_GAP);
      }

      // Goéland (cercle blanc avec ailes)
      ctx.save();
      ctx.translate(80, s.bird.y);
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.fill();
      // Bec
      ctx.fillStyle = '#F2C078';
      ctx.beginPath(); ctx.moveTo(14, -2); ctx.lineTo(22, 0); ctx.lineTo(14, 4); ctx.fill();
      // Aile
      ctx.fillStyle = '#e0e0e0';
      ctx.beginPath();
      ctx.ellipse(-2, 0, 10, 5, s.bird.vy * 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Score
      ctx.fillStyle = '#F2C078';
      ctx.font = 'bold 24px Inter';
      ctx.fillText(s.score, W / 2 - 10, 40);

      // Écran départ
      if (!s.running && !s.over) {
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('Appuyez pour démarrer !', W / 2, H / 2);
        ctx.textAlign = 'left';
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    loop();
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const handleSubmitScore = async () => {
    setSubmitted(true);
    try {
      const { data } = await client.post(`/games/${game.id}/play`, { answer: score });
      if (data.won) onWon?.(data);
      alert(data.won ? `🎉 Vous avez gagné : ${data.advantage}` : 'Score enregistré ! Tentez au prochain jeu.');
    } catch { setSubmitted(false); }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas ref={canvasRef} width={W} height={H} onClick={jump}
        onKeyDown={(e) => e.code === 'Space' && jump()}
        tabIndex={0} className="rounded-xl cursor-pointer shadow-lg" style={{ maxWidth: '100%' }} />
      {over && !submitted && (
        <div className="text-center">
          <p className="font-bold text-xl text-navy mb-2">Score final : {score}</p>
          <button onClick={handleSubmitScore} className="btn-primary">Soumettre mon score</button>
        </div>
      )}
    </div>
  );
};
```

- [ ] **Étape 5 : Créer client/src/pages/public/GamePage.jsx et l'ajouter au router**

```jsx
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { QuizGame } from '../../components/games/QuizGame';
import { EnigmeGame } from '../../components/games/EnigmeGame';
import { FlappyGame } from '../../components/games/FlappyGame';
import client from '../../api/client';

export default function GamePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [game, setGame] = useState(null);
  const [won, setWon] = useState(false);

  useEffect(() => { client.get(`/games/active`).then(r => setGame(r.data)); }, [id]);

  if (!game) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy" /></div>;
  if (game.status === 'ended') return <div className="text-center py-20 text-gray-400">Ce jeu est terminé.</div>;
  if (!user) return <div className="text-center py-20"><p className="mb-4">Connectez-vous pour jouer</p><a href="/connexion" className="btn-primary">Connexion</a></div>;

  const GameComponent = { quiz: QuizGame, enigme: EnigmeGame, flappy: FlappyGame }[game.type];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-6">
        <span className="badge bg-terracotta text-white mb-2">Jeu en cours</span>
        <h1 className="font-serif text-3xl text-navy">{game.title}</h1>
        {game.ticketOffer && <p className="text-sand mt-2">Lot : {game.ticketOffer.advantage}</p>}
      </div>
      <div className="card p-6">
        {GameComponent && <GameComponent game={game} onWon={(data) => setWon(data)} />}
      </div>
    </div>
  );
}
```

Ajouter dans `client/src/router.jsx` après la ligne AuthCallback :
```jsx
const GamePage = lazy(() => import('./pages/public/GamePage'));
// Dans children :
{ path: 'jeu/:id', element: S(GamePage) },
```

- [ ] **Étape 6 : Commit**

```bash
git add src/
git commit -m "feat: jeux flash UI (Quiz, Énigme, Flappy goéland) + GameBanner temps réel"
```
