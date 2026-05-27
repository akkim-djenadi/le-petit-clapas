import { Link } from 'react-router-dom';
import { Heart, User, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Header = ({ unreadCount = 0 }) => {
  const { user, logout } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-navy text-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="font-serif text-xl text-sand font-bold tracking-wide">
          Le Petit Clapas
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link to="/explorer" className="hover:text-sand transition-colors">Explorer</Link>
          {user?.role === 'admin' && <Link to="/admin" className="hover:text-sand">Admin</Link>}
          {(user?.role === 'merchant' || user?.role === 'admin') && <Link to="/pro/dashboard" className="hover:text-sand">Mon espace</Link>}
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link to="/favoris" className="p-2 hover:text-sand transition-colors"><Heart size={20} /></Link>
              <Link to="/notifications" className="p-2 hover:text-sand relative">
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-terracotta text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
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
