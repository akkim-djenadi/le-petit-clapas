import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy" />
    </div>
  );
  if (!user) return <Navigate to="/connexion" replace />;
  if (role && user.role !== role && !(role === 'merchant' && user.role === 'admin')) return <Navigate to="/" replace />;
  return children;
};
