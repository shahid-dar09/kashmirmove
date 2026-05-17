import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../context/ToastContextShared';
import api from '../services/api';
import { 
  ArrowLeft, 
  ArrowRight,
  Car, 
  Truck,
  User,
  Mail,
  Phone,
  Lock,
  ShieldCheck
} from 'lucide-react';

const RegisterCustomer = () => {
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return addToast("Validation Error", "Passwords do not match.", "error");
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/register', {
        ...formData,
        role: 'customer'
      });
      if (res.data.success) {
        addToast("Welcome Aboard", "Your premium rider profile has been initialized.", "success");
        navigate('/login');
      }
    } catch (err) {
      addToast("Enrollment Failed", err.response?.data?.message || "Please check your input parameters.", "error");
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
           <div className="w-16 h-16 rounded-2xl border border-amber-500/20 flex items-center justify-center mb-12 bg-amber-500/5 backdrop-blur-xl">
              <ShieldCheck className="text-amber-500" size={32} />
           </div>

           <div>
              <h2 className="text-[40px] font-black italic uppercase leading-none tracking-tight text-white">
                JOIN THE
              </h2>
              <h2 className="text-[40px] font-black italic uppercase leading-none tracking-tight text-amber-500 mb-8">
                ELITE FORCE
              </h2>
              <p className="text-slate-400 font-medium italic text-lg leading-relaxed max-w-md">
                Experience the valley's most reliable and secure transport network. Built for Kashmir, by Kashmir.
              </p>
           </div>
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
              <Link to="/login" className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors">LOGIN</Link>
              <div className="relative px-6 py-2 bg-electric-cyan/10 border border-electric-cyan/20 rounded-full">
                 <span className="text-[10px] font-black uppercase tracking-widest text-electric-cyan shadow-[0_0_15px_rgba(0,245,255,0.2)]">RIDER</span>
                 <div className="absolute inset-0 rounded-full bg-electric-cyan/5 animate-pulse"></div>
              </div>
              <Link to="/register-driver" className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors">PILOT</Link>
           </div>
        </div>

        {/* Content Body */}
        <div className="w-full max-w-[600px] m-auto py-12 relative z-10">
           <div className="text-left mb-10">
              <h1 className="text-[52px] font-black italic uppercase tracking-tighter leading-none mb-3">
                ENROLL AS<br/><span className="bg-clip-text text-transparent bg-gradient-to-r from-electric-purple to-electric-cyan">RIDER</span>
              </h1>
              <p className="text-slate-400 font-medium italic text-base">Begin your journey with the valley's premium transport network.</p>
           </div>

           {/* Form Container */}
           <div className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl rounded-[2.5rem] p-10 relative">
              
              <form onSubmit={handleSubmit}>
                 <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">FULL NAME</label>
                       <div className="relative group/field">
                          <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/field:text-electric-cyan transition-colors" size={18} />
                          <input 
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            className="w-full bg-[#16162A]/50 border border-white/5 rounded-2xl py-4 pl-14 pr-8 font-bold focus:border-electric-cyan/50 focus:bg-[#16162A] outline-none transition-all placeholder:text-slate-600 text-white"
                            placeholder="Enter your name"
                            autoComplete="off"
                            required
                          />
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4 opacity-60">EMAIL ADDRESS</label>
                          <div className="relative group/field">
                             <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/field:text-electric-cyan transition-colors" size={18} />
                             <input 
                               type="email"
                               value={formData.email}
                               onChange={(e) => setFormData({...formData, email: e.target.value})}
                               className="w-full bg-[#16162A]/50 border border-white/5 rounded-2xl py-5 pl-16 pr-8 font-bold focus:border-electric-cyan/50 focus:bg-[#16162A] outline-none transition-all placeholder:text-slate-600 text-white"
                               placeholder="Enter your email"
                               autoComplete="off"
                               required
                             />
                          </div>
                       </div>
                       
                       <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4 opacity-60">PHONE NUMBER</label>
                          <div className="relative group/field">
                             <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/field:text-electric-cyan transition-colors" size={18} />
                             <input 
                               type="tel"
                               value={formData.phone}
                               onChange={(e) => setFormData({...formData, phone: e.target.value})}
                               className="w-full bg-[#16162A]/50 border border-white/5 rounded-2xl py-5 pl-16 pr-8 font-bold focus:border-electric-cyan/50 focus:bg-[#16162A] outline-none transition-all placeholder:text-slate-600 text-white"
                               placeholder="Enter your phone"
                               autoComplete="off"
                               required
                             />
                          </div>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-2">PASSWORD</label>
                          <div className="relative group/field">
                             <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/field:text-electric-cyan transition-colors" size={16} />
                             <input 
                               type="password"
                               value={formData.password}
                               onChange={(e) => setFormData({...formData, password: e.target.value})}
                               className="w-full bg-[#16162A]/50 border border-white/5 rounded-2xl py-4 pl-10 pr-4 font-bold focus:border-electric-cyan/50 focus:bg-[#16162A] outline-none transition-all placeholder:text-slate-600 tracking-widest text-white"
                               placeholder="••••••••"
                               autoComplete="new-password"
                               required
                             />
                          </div>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-2">CONFIRM PASSWORD</label>
                          <div className="relative group/field">
                             <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/field:text-electric-cyan transition-colors" size={16} />
                             <input 
                               type="password"
                               value={formData.confirmPassword}
                               onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                               className="w-full bg-[#16162A]/50 border border-white/5 rounded-2xl py-4 pl-10 pr-4 font-bold focus:border-electric-cyan/50 focus:bg-[#16162A] outline-none transition-all placeholder:text-slate-600 tracking-widest text-white"
                               placeholder="••••••••"
                               autoComplete="new-password"
                               required
                             />
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="mt-6 flex items-center gap-3 ml-2">
                    <input type="checkbox" id="terms" required className="w-4 h-4 rounded border-white/10 bg-white/5 accent-electric-cyan" />
                    <label htmlFor="terms" className="text-xs font-medium text-slate-400">I agree to terms and protocols</label>
                 </div>

                 <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full mt-8 py-5 bg-electric-cyan rounded-[1rem] font-black uppercase tracking-[0.15em] text-xs text-black shadow-[0_0_20px_rgba(0,245,255,0.2)] hover:bg-[#06B6D4] transition-all flex items-center justify-center gap-3"
                 >
                    {loading ? (
                      <RefreshCcw className="animate-spin" size={18} />
                    ) : (
                      <>INITIALIZE RIDER ACCOUNT <ArrowRight size={18} /></>
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
                      Already have an account? <Link to="/login" className="text-electric-cyan font-bold ml-1 hover:underline">Secure Login</Link>
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

export default RegisterCustomer;
