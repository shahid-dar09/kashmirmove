import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContextValue';

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, loading, initialLoading } = useContext(AuthContext);

  if (initialLoading || loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-obsidian">
        <div className="w-16 h-16 bg-electric-cyan rounded-2xl flex items-center justify-center animate-bounce shadow-glow-cyan mb-8">
           <div className="w-8 h-8 border-4 border-obsidian border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="font-display font-black text-electric-cyan animate-pulse tracking-widest uppercase italic">Decrypting Session...</p>
      </div>
    );
  }
  
  if (!user) return <Navigate to="/login" />;
  if (allowedRole && user.role !== allowedRole) return <Navigate to="/login" />;

  return children;
};

export default ProtectedRoute;
