import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContextValue';

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, loading, initialLoading } = useContext(AuthContext);

  if (initialLoading || loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-[#030712] relative overflow-hidden">
        {/* Decorative background glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-[120px] pointer-events-none animate-pulse-slow"></div>

        {/* Dual Spin Spinner */}
        <div className="relative w-20 h-20 mb-8 flex items-center justify-center">
          {/* Saffron Gold Ring */}
          <div className="absolute inset-0 border-4 border-secondary/20 border-t-secondary rounded-full animate-spin"></div>
          {/* Chinar Crimson Ring (counter-spinning) */}
          <div className="absolute inset-2 border-4 border-primary/20 border-b-primary rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.2s' }}></div>
          {/* Center glowing core */}
          <div className="w-6 h-6 bg-[#030712] border-2 border-white/5 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.3)]"></div>
        </div>

        {/* Brand Logo and Title */}
        <div className="text-center space-y-2 relative z-10">
          <h2 className="font-display font-black text-2xl tracking-[0.2em] text-white uppercase italic pr-4">
            KASHMIR<span className="text-primary">MOVE</span>
          </h2>
          <p className="font-display font-black text-xs text-secondary animate-pulse tracking-widest uppercase italic pr-2">
            Establishing Secure Session...
          </p>
        </div>
      </div>
    );
  }
  
  if (!user) return <Navigate to="/login" />;
  if (allowedRole && user.role !== allowedRole) return <Navigate to="/login" />;

  return children;
};

export default ProtectedRoute;
