import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, Star, CheckCircle, CreditCard } from 'lucide-react';
import { getMyProfile, getMerchantStats } from '../../api/merchant';

export default function ProDashboard() {
  const [stats, setStats] = useState({});
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    getMyProfile().then(setProfile);
    getMerchantStats().then(setStats);
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
          { to: profile?.commerce?.slug ? `/commerce/${profile.commerce.slug}` : '#', label: 'Voir ma fiche publique', emoji: '👁️' },
        ].map(({ to, label, emoji }) => (
          <Link key={label} to={to} className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
            <span className="text-2xl">{emoji}</span><span className="font-medium text-navy">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
