import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContextValue';
import { useToast } from '../context/ToastContextShared';
import api from '../services/api';
import { 
  ArrowLeft, 
  ArrowRight,
  Car, 
  Truck,
  Mail,
  Lock,
  ShieldCheck,
  Eye,
  EyeOff
} from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      setError('');
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        login(res.data.user, res.data.token);
        addToast("Authentication Successful", "Welcome back to the command center.", "success");
        
        if (res.data.user.role === 'admin') {
          navigate('/admin/dashboard');
        } else if (res.data.user.role === 'driver') {
          navigate('/driver/dashboard');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Invalid credentials provided.";
      if (err.response?.status === 403) {
        setError(msg);
      } else {
        addToast("Access Denied", msg, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen lg:h-screen grid grid-cols-1 lg:grid-cols-[440px_1fr] bg-obsidian text-white overflow-y-auto lg:overflow-hidden font-display">
      
      {/* Sidebar Info Panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-obsidian border-r border-white/5 h-full overflow-hidden select-none">
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-4 group mb-10">
            <div className="relative w-14 h-14 bg-primary rounded-[1.25rem] flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.3)] group-hover:scale-105 transition-transform overflow-visible">
               <div className="relative flex items-center justify-center w-full">
                  <Car className="text-white absolute transition-all duration-500 translate-x-[-4px] group-hover:translate-x-[-14px] group-hover:scale-110" size={24} />
                  <Truck className="text-white absolute transition-all duration-500 translate-x-[6px] group-hover:translate-x-[14px] group-hover:scale-110" size={24} />
               </div>
            </div>
            <span className="text-3xl font-black italic tracking-tight uppercase pr-2">
              KASHMIR<span className="text-primary">MOVE</span>
            </span>
          </Link>

          <div className="mt-8">
            <div className="w-16 h-16 bg-primary/10 rounded-[1.25rem] border border-primary/20 flex items-center justify-center mb-6">
               <ShieldCheck size={28} className="text-primary" />
            </div>
            
            <div className="space-y-1">
              <h2 className="text-[32px] font-black italic uppercase leading-none tracking-tight text-white pr-8">
                SECURED
              </h2>
              <h2 className="text-[32px] font-black italic uppercase leading-none tracking-tight text-primary pr-8">
                RIDE-SHARING
              </h2>
            </div>
            
            <p className="text-slate-400 text-base font-medium italic leading-relaxed max-w-[280px] mt-4">
              Your safety and data privacy are our highest priorities. Travel safely across the valley.
            </p>
          </div>
        </div>

        <div className="relative z-10 w-full pt-6 border-t border-white/5 flex flex-col gap-4">
           <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider leading-relaxed">
             © 2026 KASHMIRMOVE.
             <br />
             Crafted by <a href="https://github.com/shahid-dar09" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-primary transition-colors font-extrabold">Shahid Dar</a>.
           </p>
           
           <div className="flex items-center gap-4">
              <a href="mailto:darshahid45ds@gmail.com" className="text-slate-500 hover:text-primary transition-all duration-300 hover:scale-110" title="Contact Email">
                 <Mail size={16} />
              </a>
              <a href="https://github.com/shahid-dar09" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-primary transition-all duration-300 hover:scale-110" title="GitHub Profile">
                 <svg className="w-[16px] h-[16px] fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                 </svg>
              </a>
              <a href="https://www.linkedin.com/in/dar-shahid-739571370/" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-secondary transition-all duration-300 hover:scale-110" title="LinkedIn Profile">
                 <svg className="w-[16px] h-[16px] fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                 </svg>
              </a>
           </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col p-4 sm:p-6 lg:p-12 overflow-y-auto bg-gradient-to-br from-[#0A0A0F] via-midnight to-[#1A0A0A] relative">
        
        {/* Top Navigation */}
        <div className="flex justify-between items-center gap-4 mb-8 sm:mb-16 relative z-10">
           <button onClick={() => navigate('/')} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors group">
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> EXIT
           </button>
           
           <div className="flex items-center justify-end gap-3 sm:gap-8 flex-wrap">
              <div className="relative px-4 sm:px-6 py-2 bg-primary/10 border border-primary/20 rounded-full">
                 <span className="text-[10px] font-black uppercase tracking-widest text-primary shadow-[0_0_15px_rgba(220,38,38,0.2)]">LOGIN</span>
                 <div className="absolute inset-0 rounded-full bg-primary/5 animate-pulse"></div>
              </div>
              <Link to="/register" className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors">RIDER</Link>
              <Link to="/register-driver" className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors">DRIVER</Link>
           </div>
        </div>

        {/* Content Body */}
        <div className="w-full max-w-[480px] m-auto py-8 sm:py-12 relative z-10">
           <div className="text-center mb-8 sm:mb-10">
              <h1 className="text-4xl sm:text-[52px] font-black italic uppercase tracking-tighter leading-none mb-3 pr-8">
                WELCOME<span className="text-primary pl-1 pr-2">BACK</span>
              </h1>
              <p className="text-slate-400 font-medium italic text-base">Sign in to your account to continue.</p>
           </div>

           {/* Form Container */}
           <div className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl rounded-[1.5rem] sm:rounded-[2.5rem] p-5 sm:p-10 relative">
              
              <form onSubmit={handleSubmit}>
                 <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">EMAIL ADDRESS</label>
                       <div className="relative group/field">
                          <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                          <input 
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-[#16162A]/50 border border-white/5 rounded-2xl py-4 pl-14 pr-8 font-bold focus:border-primary/50 focus:bg-[#16162A] outline-none transition-all placeholder:text-slate-600 text-white"
                            placeholder="Enter your email"
                            autoComplete="off"
                            required
                          />
                       </div>
                    </div>

                    <div className="space-y-2">
                       <div className="flex justify-between items-center px-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">PASSWORD</label>
                          <button type="button" className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">FORGOT PASSWORD?</button>
                       </div>
                       <div className="relative group/field">
                          <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                          <input 
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-[#16162A]/50 border border-white/5 rounded-2xl py-4 pl-14 pr-12 font-bold focus:border-primary/50 focus:bg-[#16162A] outline-none transition-all placeholder:text-slate-600 tracking-widest text-white"
                            placeholder="Enter your password"
                            autoComplete="current-password"
                            required
                          />
                          <button 
                            type="button" 
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-black transition-colors"
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                       </div>
                    </div>
                 </div>

                 <div className="mt-6 flex items-center gap-3 ml-2">
                    <input type="checkbox" id="maintain-session" className="w-4 h-4 rounded border-white/10 bg-white/5 accent-primary" />
                    <label htmlFor="maintain-session" className="text-xs font-medium text-slate-400">Remember me</label>
                 </div>

                 {error && (
                    <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                       <ShieldCheck className="text-red-500 shrink-0" size={18} />
                       <p className="text-[11px] font-bold uppercase tracking-wider text-red-500 leading-tight">
                          {error}
                       </p>
                    </div>
                 )}

                 <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full mt-8 py-5 bg-primary rounded-[1rem] font-black uppercase tracking-[0.15em] text-xs text-white hover:bg-[#B91C1C] transition-all flex items-center justify-center gap-3 shadow-glow-primary"
                 >
                    {loading ? (
                      <RefreshCcw className="animate-spin" size={18} />
                    ) : (
                      <>SIGN IN <ArrowRight size={18} /></>
                    )}
                 </button>
              </form>

              <div className="mt-10">
                    <div className="flex items-center gap-3 sm:gap-4 mb-8">
                    <div className="h-px bg-white/5 flex-1"></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">SECURE GATEWAY</span>
                    <div className="h-px bg-white/5 flex-1"></div>
                 </div>
                 
                 <div className="text-center space-y-6">
                    <p className="text-[13px] font-medium text-slate-400">
                      New to KashmirMove? <Link to="/register" className="text-primary font-bold ml-1 hover:underline">Register as Rider</Link>
                    </p>
                    
                    <Link to="/register-driver" className="flex items-center justify-center w-full py-4 bg-transparent border border-white/5 rounded-[1rem] text-[10px] font-black uppercase tracking-widest text-slate-300 hover:bg-white/5 hover:text-white transition-all">
                       APPLY TO DRIVE
                    </Link>
                 </div>
              </div>
           </div>
         </div>

         {/* ── Footer ── */}
         <footer className="mt-20 py-12 border-t border-white/5 w-full lg:hidden">
           <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6 text-center sm:text-left">
              
              <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/')}>
               <div className="relative w-10 h-8 flex items-center justify-center overflow-visible">
                  <div className="relative w-full h-full bg-primary rounded-lg flex items-center justify-center">
                     <div className="relative flex items-center justify-center w-full">
                       <Car className="text-white absolute transition-all duration-500 translate-x-[-3px] group-hover:translate-x-[-10px] group-hover:scale-110" size={14} />
                       <Truck className="text-white absolute transition-all duration-500 translate-x-[4px] group-hover:translate-x-[10px] group-hover:scale-110" size={14} />
                     </div>
                  </div>
               </div>
               <span className="text-lg font-display font-black italic tracking-tighter uppercase pr-1">
                 Kashmir<span className="text-primary">Move</span>
               </span>
             </div>

             <p className="text-slate-600 text-[9px] font-black uppercase tracking-[0.2em] leading-relaxed">
               © 2026 KashmirMove. Crafted by <a href="https://github.com/shahid-dar09" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-primary transition-colors">Shahid Dar</a>.
             </p>
             
             <div className="flex items-center gap-4">
                <a href="mailto:darshahid45ds@gmail.com" className="text-slate-500 hover:text-primary transition-all duration-300 hover:scale-110" title="Contact Email">
                   <Mail size={16} />
                </a>
                <a href="https://github.com/shahid-dar09" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-primary transition-all duration-300 hover:scale-110" title="GitHub Profile">
                   <svg className="w-[16px] h-[16px] fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                     <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                   </svg>
                </a>
                <a href="https://www.linkedin.com/in/dar-shahid-739571370/" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-secondary transition-all duration-300 hover:scale-110" title="LinkedIn Profile">
                   <svg className="w-[16px] h-[16px] fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                     <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                   </svg>
                </a>
             </div>
           </div>
         </footer>
      </div>
    </div>
  );
};

const RefreshCcw = ({ className }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
);

export default Login;
