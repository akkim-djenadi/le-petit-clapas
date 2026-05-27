import { createBrowserRouter } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import App from './App';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

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

const Loader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy" />
  </div>
);
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
