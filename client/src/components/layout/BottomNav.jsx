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
