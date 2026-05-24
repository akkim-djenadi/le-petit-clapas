# Le Petit Clapas — Plan Phase 1 (Partie 3 : Frontend Foundation)

> Lire part1.md et part2.md avant de commencer.

---

## Task 9 : Scaffolding Frontend (Vite + Tailwind + Router + Design System)

**Files:**
- Create: `client/` (projet Vite React)
- Create: `client/src/styles/index.css`
- Create: `client/src/api/client.js`
- Create: `client/src/context/AuthContext.jsx`
- Create: `client/src/hooks/useAuth.js`
- Create: `client/src/router.jsx`
- Create: `client/src/App.jsx`
- Create: `client/src/components/layout/Header.jsx`
- Create: `client/src/components/layout/BottomNav.jsx`
- Create: `client/src/components/layout/ProtectedRoute.jsx`

- [ ] **Étape 1 : Initialiser le projet Vite**

```bash
cd /Users/akkimdjenadi/Downloads/petitclapas1
npm create vite@latest client -- --template react
cd client
npm install
npm install react-router-dom axios framer-motion leaflet react-leaflet lucide-react
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

- [ ] **Étape 2 : Configurer Tailwind avec les tokens de design**

`client/tailwind.config.js`:
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy:     { DEFAULT: '#1C3A5E', light: '#2E5F8A', dark: '#0F2138' },
        terracotta: { DEFAULT: '#C4603A', light: '#D4785A', dark: '#A04A28' },
        sand:     { DEFAULT: '#F2C078', light: '#F7D9A8', dark: '#D4A050' },
        cream:    { DEFAULT: '#F2EDE4', dark: '#E8E0D0' },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans:  ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
```

- [ ] **Étape 3 : Créer client/src/styles/index.css**

```css
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap');
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body { @apply bg-cream font-sans text-navy; }
  h1, h2, h3 { @apply font-serif; }
}

@layer components {
  .btn-primary {
    @apply bg-navy text-white px-6 py-3 rounded-lg font-semibold hover:bg-navy-dark transition-colors;
  }
  .btn-secondary {
    @apply bg-terracotta text-white px-6 py-3 rounded-lg font-semibold hover:bg-terracotta-dark transition-colors;
  }
  .card {
    @apply bg-white rounded-2xl shadow-sm border border-cream-dark overflow-hidden;
  }
  .badge {
    @apply inline-block text-xs font-semibold px-2 py-1 rounded-full;
  }
}
```

- [ ] **Étape 4 : Créer client/src/api/client.js**

```js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const client = axios.create({ baseURL: API_URL });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/connexion';
    }
    return Promise.reject(err);
  }
);

export default client;
```

- [ ] **Étape 5 : Créer client/src/context/AuthContext.jsx**

```jsx
import { createContext, useContext, useState, useEffect } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }
    client.get('/auth/me')
      .then(res => setUser(res.data))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin: user?.role === 'admin', isMerchant: user?.role === 'merchant' }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

- [ ] **Étape 6 : Créer client/src/hooks/useSocket.js**

```js
import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:4000';

export const useSocket = (onGameLive, onNotification) => {
  const socketRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    socketRef.current = io(SOCKET_URL, { auth: { token } });

    socketRef.current.on('game:live', (data) => onGameLive?.(data));
    socketRef.current.on('notification:new', (data) => onNotification?.(data));

    return () => socketRef.current?.disconnect();
  }, []);

  return socketRef;
};
```

- [ ] **Étape 7 : Créer client/src/components/layout/ProtectedRoute.jsx**

```jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy" /></div>;
  if (!user) return <Navigate to="/connexion" replace />;
  if (role && user.role !== role && !(role === 'merchant' && user.role === 'admin')) return <Navigate to="/" replace />;
  return children;
};
```

- [ ] **Étape 8 : Créer client/src/components/layout/Header.jsx**

```jsx
import { Link, useNavigate } from 'react-router-dom';
import { Heart, User, Menu, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Header = ({ unreadCount = 0 }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-navy text-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="font-serif text-xl text-sand font-bold tracking-wide">
          Le Petit Clapas
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link to="/explorer" className="hover:text-sand transition-colors">Explorer</Link>
          {user?.role === 'admin' && <Link to="/admin" className="hover:text-sand">Admin</Link>}
          {user?.role === 'merchant' && <Link to="/pro/dashboard" className="hover:text-sand">Mon espace</Link>}
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link to="/favoris" className="p-2 hover:text-sand transition-colors"><Heart size={20} /></Link>
              <Link to="/notifications" className="p-2 hover:text-sand relative">
                <Bell size={20} />
                {unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-terracotta text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{unreadCount}</span>}
              </Link>
              <Link to="/profil" className="p-2 hover:text-sand"><User size={20} /></Link>
            </>
          ) : (
            <Link to="/connexion" className="btn-secondary text-sm py-2 px-4">Connexion</Link>
          )}
        </div>
      </div>
    </header>
  );
};
```

- [ ] **Étape 9 : Créer client/src/components/layout/BottomNav.jsx**

```jsx
import { NavLink } from 'react-router-dom';
import { Home, Map, Heart, User } from 'lucide-react';

const navItems = [
  { to: '/', icon: Home, label: 'Accueil' },
  { to: '/explorer', icon: Map, label: 'Explorer' },
  { to: '/favoris', icon: Heart, label: 'Favoris' },
  { to: '/profil', icon: User, label: 'Profil' },
];

export const BottomNav = () => (
  <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-cream-dark md:hidden">
    <div className="flex">
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) =>
          `flex-1 flex flex-col items-center py-2 text-xs font-medium transition-colors ${isActive ? 'text-navy' : 'text-gray-400'}`
        }>
          <Icon size={22} />
          <span className="mt-1">{label}</span>
        </NavLink>
      ))}
    </div>
  </nav>
);
```

- [ ] **Étape 10 : Créer client/src/router.jsx**

```jsx
import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

// Pages — importées en lazy pour performance
import { lazy, Suspense } from 'react';
const Home = lazy(() => import('./pages/public/Home'));
const Explorer = lazy(() => import('./pages/public/Explorer'));
const CommercePage = lazy(() => import('./pages/public/CommercePage'));
const Login = lazy(() => import('./pages/public/Login'));
const Register = lazy(() => import('./pages/public/Register'));
const AuthCallback = lazy(() => import('./pages/public/AuthCallback'));
const Profile = lazy(() => import('./pages/user/Profile'));
const Favorites = lazy(() => import('./pages/user/Favorites'));
const Coffre = lazy(() => import('./pages/user/Coffre'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminCommerces = lazy(() => import('./pages/admin/CommercesAdmin'));
const AdminImport = lazy(() => import('./pages/admin/ImportAdmin'));
const AdminAvis = lazy(() => import('./pages/admin/AvisAdmin'));
const AdminCategories = lazy(() => import('./pages/admin/CategoriesAdmin'));
const AdminAbonnements = lazy(() => import('./pages/admin/AbonnementsAdmin'));
const AdminJeux = lazy(() => import('./pages/admin/JeuxAdmin'));
const ProDashboard = lazy(() => import('./pages/merchant/ProDashboard'));
const ProTickets = lazy(() => import('./pages/merchant/ProTickets'));
const ProOffres = lazy(() => import('./pages/merchant/ProOffres'));
const ProAvis = lazy(() => import('./pages/merchant/ProAvis'));

const Loader = () => <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy" /></div>;
const S = (C) => <Suspense fallback={<Loader />}><C /></Suspense>;

export const router = createBrowserRouter([
  {
    path: '/', element: <App />,
    children: [
      { index: true, element: S(Home) },
      { path: 'explorer', element: S(Explorer) },
      { path: 'commerce/:slug', element: S(CommercePage) },
      { path: 'connexion', element: S(Login) },
      { path: 'inscription', element: S(Register) },
      { path: 'auth/callback', element: S(AuthCallback) },
      { path: 'profil', element: <ProtectedRoute>{S(Profile)}</ProtectedRoute> },
      { path: 'favoris', element: <ProtectedRoute>{S(Favorites)}</ProtectedRoute> },
      { path: 'coffre', element: <ProtectedRoute>{S(Coffre)}</ProtectedRoute> },
      { path: 'admin', element: <ProtectedRoute role="admin">{S(AdminDashboard)}</ProtectedRoute> },
      { path: 'admin/commerces', element: <ProtectedRoute role="admin">{S(AdminCommerces)}</ProtectedRoute> },
      { path: 'admin/import', element: <ProtectedRoute role="admin">{S(AdminImport)}</ProtectedRoute> },
      { path: 'admin/avis', element: <ProtectedRoute role="admin">{S(AdminAvis)}</ProtectedRoute> },
      { path: 'admin/categories', element: <ProtectedRoute role="admin">{S(AdminCategories)}</ProtectedRoute> },
      { path: 'admin/abonnements', element: <ProtectedRoute role="admin">{S(AdminAbonnements)}</ProtectedRoute> },
      { path: 'admin/jeux', element: <ProtectedRoute role="admin">{S(AdminJeux)}</ProtectedRoute> },
      { path: 'pro/dashboard', element: <ProtectedRoute role="merchant">{S(ProDashboard)}</ProtectedRoute> },
      { path: 'pro/tickets', element: <ProtectedRoute role="merchant">{S(ProTickets)}</ProtectedRoute> },
      { path: 'pro/offres', element: <ProtectedRoute role="merchant">{S(ProOffres)}</ProtectedRoute> },
      { path: 'pro/avis', element: <ProtectedRoute role="merchant">{S(ProAvis)}</ProtectedRoute> },
    ],
  },
]);
```

- [ ] **Étape 11 : Créer client/src/App.jsx**

```jsx
import { Outlet, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { GameBanner } from './components/games/GameBanner';
import { useSocket } from './hooks/useSocket';

export default function App() {
  const [activeGame, setActiveGame] = useState(null);
  const location = useLocation();

  useSocket(
    (game) => setActiveGame(game),
    () => {} // notifications gérées dans Header
  );

  const isAdmin = location.pathname.startsWith('/admin') || location.pathname.startsWith('/pro');

  return (
    <div className="min-h-screen pb-16 md:pb-0">
      <Header />
      {activeGame && <GameBanner game={activeGame} onClose={() => setActiveGame(null)} />}
      <main className="pt-16">
        <AnimatePresence mode="wait">
          <motion.div key={location.pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      {!isAdmin && <BottomNav />}
    </div>
  );
}
```

- [ ] **Étape 12 : Créer client/src/main.jsx**

```jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { router } from './router';
import './styles/index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>
);
```

- [ ] **Étape 13 : Créer client/.env**

```
VITE_API_URL=http://localhost:4000/api
```

- [ ] **Étape 14 : Créer les pages placeholder (pour que le router compile)**

```bash
cd client/src
mkdir -p pages/{public,user,admin,merchant} components/games

# Pages public
for p in Home Explorer CommercePage Login Register AuthCallback; do
  echo "export default function $p() { return <div>$p</div>; }" > pages/public/$p.jsx
done

# Pages user
for p in Profile Favorites Coffre; do
  echo "export default function $p() { return <div>$p</div>; }" > pages/user/$p.jsx
done

# Pages admin
for p in Dashboard CommercesAdmin ImportAdmin AvisAdmin CategoriesAdmin AbonnementsAdmin JeuxAdmin; do
  echo "export default function $p() { return <div>$p</div>; }" > pages/admin/$p.jsx
done

# Pages merchant
for p in ProDashboard ProTickets ProOffres ProAvis; do
  echo "export default function $p() { return <div>$p</div>; }" > pages/merchant/$p.jsx
done

# GameBanner placeholder
echo "export const GameBanner = ({ game, onClose }) => null;" > components/games/GameBanner.jsx
```

- [ ] **Étape 15 : Vérifier que l'app démarre**

```bash
cd client && npm run dev
```

Résultat attendu : Vite démarre sur `http://localhost:5173`, page d'accueil s'affiche (placeholder).

- [ ] **Étape 16 : Commit**

```bash
cd client
git add .
git commit -m "feat: scaffolding frontend React + design system + routing + auth context"
```
