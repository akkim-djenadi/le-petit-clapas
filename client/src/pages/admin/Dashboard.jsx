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
