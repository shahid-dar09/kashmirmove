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
    <div className="h-screen grid grid-cols-1 lg:grid-cols-[440px_1fr] bg-obsidian text-white overflow-hidden font-display">
      
      {/* Sidebar Info Panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-[#0B0C14] border-r border-white/5 h-full overflow-hidden select-none">
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-4 group mb-24">
            <div className="relative w-14 h-14 bg-primary rounded-[1.25rem] flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.3)] group-hover:scale-105 transition-transform overflow-visible">
               <div className="relative flex items-center justify-center w-full">
                  <Car className="text-white absolute transition-all duration-500 translate-x-[-4px] group-hover:translate-x-[-14px] group-hover:scale-110" size={24} />
                  <Truck className="text-white absolute transition-all duration-500 translate-x-[6px] group-hover:translate-x-[14px] group-hover:scale-110" size={24} />
               </div>
            </div>
            <span className="text-3xl font-black italic tracking-tight uppercase">
              KASHMIR<span className="text-primary">MOVE</span>
            </span>
          </Link>

          <div className="mt-20">
            <div className="w-20 h-20 bg-electric-purple/5 rounded-[1.75rem] border border-electric-purple/20 flex items-center justify-center mb-8">
               <ShieldCheck size={36} className="text-electric-purple" />
            </div>
            
            <div className="space-y-1">
              <h2 className="text-[40px] font-black italic uppercase leading-none tracking-tight text-white">
                SECURED
              </h2>
              <h2 className="text-[40px] font-black italic uppercase leading-none tracking-tight text-electric-purple">
                INTELLIGENCE
              </h2>
            </div>
            
            <p className="text-slate-400 text-lg font-medium italic leading-relaxed max-w-[320px] mt-8">
              Your data is encrypted and protected with industry-leading protocols. Move with confidence across the valley.
            </p>
          </div>
        </div>

        <div className="relative z-10 w-full pt-8 border-t border-white/5">
           <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-500">
             © 2026 KASHMIRMOVE LOGISTICS
           </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col p-6 lg:p-12 overflow-y-auto bg-gradient-to-br from-[#0F172A] via-[#0A0B14] to-[#1E1B4B] relative">
        
        {/* Top Navigation */}
        <div className="flex justify-between items-center mb-16 relative z-10">
           <button onClick={() => navigate('/')} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors group">
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> EXIT
           </button>
           
           <div className="flex items-center gap-8">
              <div className="relative px-6 py-2 bg-electric-purple/10 border border-electric-purple/20 rounded-full">
                 <span className="text-[10px] font-black uppercase tracking-widest text-electric-purple shadow-[0_0_15px_rgba(139,92,246,0.2)]">LOGIN</span>
                 <div className="absolute inset-0 rounded-full bg-electric-purple/5 animate-pulse"></div>
              </div>
              <Link to="/register" className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors">RIDER</Link>
              <Link to="/register-driver" className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors">PILOT</Link>
           </div>
        </div>

        {/* Content Body */}
        <div className="w-full max-w-[480px] m-auto py-12 relative z-10">
           <div className="text-center mb-10">
              <h1 className="text-[52px] font-black italic uppercase tracking-tighter leading-none mb-3">
                WELCOME<span className="text-electric-purple px-1">BACK</span>
              </h1>
              <p className="text-slate-400 font-medium italic text-base">Authorize your session to continue your journey.</p>
           </div>

           {/* Form Container */}
           <div className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl rounded-[2.5rem] p-10 relative">
              
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
                            className="w-full bg-[#16162A]/50 border border-white/5 rounded-2xl py-4 pl-14 pr-8 font-bold focus:border-electric-purple/50 focus:bg-[#16162A] outline-none transition-all placeholder:text-slate-600 text-white"
                            placeholder="Enter your email"
                            autoComplete="off"
                            required
                          />
                       </div>
                    </div>

                    <div className="space-y-2">
                       <div className="flex justify-between items-center px-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">PASSWORD</label>
                          <button type="button" className="text-[10px] font-black uppercase tracking-widest text-electric-purple hover:underline">FORGOT PASSWORD?</button>
                       </div>
                       <div className="relative group/field">
                          <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                          <input 
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-[#16162A]/50 border border-white/5 rounded-2xl py-4 pl-14 pr-12 font-bold focus:border-electric-purple/50 focus:bg-[#16162A] outline-none transition-all placeholder:text-slate-600 tracking-widest text-white"
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
                    <input type="checkbox" id="maintain-session" className="w-4 h-4 rounded border-white/10 bg-white/5 accent-electric-purple" />
                    <label htmlFor="maintain-session" className="text-xs font-medium text-slate-400">Maintain active session</label>
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
                  className="w-full mt-8 py-5 bg-electric-purple rounded-[1rem] font-black uppercase tracking-[0.15em] text-xs text-white hover:bg-[#7C3AED] transition-all flex items-center justify-center gap-3"
                 >
                    {loading ? (
                      <RefreshCcw className="animate-spin" size={18} />
                    ) : (
                      <>AUTHORIZE SESSION <ArrowRight size={18} /></>
                    )}
                 </button>
              </form>

              <div className="mt-10">
                 <div className="flex items-center gap-4 mb-8">
                    <div className="h-px bg-white/5 flex-1"></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">NEXUS GATE</span>
                    <div className="h-px bg-white/5 flex-1"></div>
                 </div>
                 
                 <div className="text-center space-y-6">
                    <p className="text-[13px] font-medium text-slate-400">
                      New to the network? <Link to="/register" className="text-electric-purple font-bold ml-1 hover:underline">Join as Rider</Link>
                    </p>
                    
                    <Link to="/register-driver" className="flex items-center justify-center w-full py-4 bg-transparent border border-white/5 rounded-[1rem] text-[10px] font-black uppercase tracking-widest text-slate-300 hover:bg-white/5 hover:text-white transition-all">
                       ENROLL AS A FLEET PILOT
                    </Link>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const RefreshCcw = ({ className }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
);

export default Login;
