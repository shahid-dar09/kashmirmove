import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../context/ToastContextShared';
import api from '../services/api';
import { 
  ArrowLeft, 
  Zap,
  Car, 
  Truck,
  User,
  Users,
  Mail,
  Phone,
  LayoutGrid,
  FileText,
  Upload,
  CheckCircle2
} from 'lucide-react';

const RegisterDriver = () => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    vehicleType: 'cab',
    model: '',
    vehicleNumber: '',
    capacity: '4',
    licenseNumber: '',
    area: 'Srinagar'
  });

  const [files, setFiles] = useState({
    profilePhoto: null,
    idProof: null
  });

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    setFiles(prev => ({
      ...prev,
      [name]: selectedFiles[0]
    }));
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      return addToast("Validation Error", "Please complete all identity fields.", "error");
    }
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    // Append text fields
    Object.keys(formData).forEach(key => {
      data.append(key, formData[key]);
    });
    // Append files
    if (files.profilePhoto) data.append('profilePhoto', files.profilePhoto);
    if (files.idProof) data.append('idProof', files.idProof);

    try {
      const res = await api.post('/driver/register', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      if (res.data.success) {
        addToast("Application Received", "Your Pilot profile is now in queue for admin verification.", "success");
        navigate('/login');
      }
    } catch (err) {
      addToast("Enrollment Failed", err.response?.data?.message || "Please verify your credentials and documents.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen grid grid-cols-1 lg:grid-cols-[440px_1fr] bg-obsidian text-white overflow-hidden font-display">
      
      {/* Sidebar Info Panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 pr-20 bg-[#0B0C14] border-r border-white/5 h-full select-none relative">
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
            <div className="w-16 h-16 rounded-2xl border border-electric-purple/20 flex items-center justify-center mb-12 bg-electric-purple/5 backdrop-blur-xl">
               <Users className="text-electric-purple" size={32} />
            </div>

            <div>
               <h1 className="text-[3.5rem] font-black italic uppercase tracking-tighter leading-[0.9] mb-8">
                 PILOT <br/> <span className="bg-clip-text text-transparent bg-gradient-to-r from-electric-purple to-electric-cyan">ENROLLMENT</span>
               </h1>
               <p className="text-slate-400 font-medium italic text-lg leading-relaxed max-w-md">
                 Join the valley's elite transport guild. <br className="hidden lg:block"/> High performance, zero compromise.
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
           <button onClick={() => step === 2 ? setStep(1) : navigate('/')} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors group">
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> {step === 2 ? 'BACK' : 'EXIT'}
           </button>
           
           <div className="flex items-center gap-8">
              <Link to="/login" className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors">LOGIN</Link>
              <Link to="/register" className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors">RIDER</Link>
              <div className="relative px-6 py-2 bg-electric-purple/10 border border-electric-purple/20 rounded-full">
                 <span className="text-[10px] font-black uppercase tracking-widest text-electric-purple shadow-[0_0_15px_rgba(139,92,246,0.2)]">PILOT</span>
                 <div className="absolute inset-0 rounded-full bg-electric-purple/5 animate-pulse"></div>
              </div>
           </div>
        </div>

        {/* Content Body */}
        <div className="w-full max-w-[650px] m-auto py-12 relative z-10">
           <div className="text-center mb-16">
              <h1 className="text-[52px] font-black italic uppercase tracking-tighter leading-none mb-3">
                PILOT <br/> <span className="bg-clip-text text-transparent bg-gradient-to-r from-electric-purple to-electric-cyan">ENROLLMENT</span>
              </h1>
              <p className="text-slate-400 font-medium italic text-base mt-4">Elevate your status. Command the roads.</p>
           </div>

           {/* Form Container */}
           <div className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl rounded-[40px] p-12 relative overflow-hidden">
              <div className="absolute top-12 right-12 flex gap-1">
                 <div className={`w-8 h-1 ${step >= 1 ? 'bg-electric-purple' : 'bg-white/10'} rounded-full transition-colors`}></div>
                 <div className={`w-8 h-1 ${step >= 2 ? 'bg-electric-cyan' : 'bg-white/10'} rounded-full transition-colors`}></div>
              </div>
              
              <div className="relative z-10 mb-12">
                 <h3 className="text-3xl font-black italic uppercase tracking-tighter mb-2">
                   PHASE <span className="bg-clip-text text-transparent bg-gradient-to-r from-electric-purple to-electric-cyan px-1">{step === 1 ? '01' : '02'}</span>
                 </h3>
                 <p className="text-slate-500 font-medium italic text-sm">
                   {step === 1 ? 'Personal Identity Information' : 'Vehicle & Fleet Details'}
                 </p>
              </div>

              <form onSubmit={step === 1 ? handleNext : handleSubmit} className="relative z-10 space-y-8">
                 {step === 1 ? (
                   /* STEP 1: IDENTITY */
                   <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                      <div className="space-y-3">
                         <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 opacity-60">FULL NAME</label>
                         <div className="relative group/field">
                            <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/field:text-electric-purple transition-colors" size={18} />
                            <input 
                              type="text"
                              value={formData.name}
                              onChange={(e) => setFormData({...formData, name: e.target.value})}
                              className="w-full bg-[#16162A]/50 border border-white/5 rounded-2xl py-5 pl-16 pr-8 font-bold focus:border-electric-purple/50 focus:bg-[#16162A] outline-none transition-all placeholder:text-slate-700 text-white"
                              placeholder="Enter your name"
                              autoComplete="off"
                              required
                            />
                         </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 opacity-60">EMAIL ADDRESS</label>
                            <div className="relative group/field">
                               <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/field:text-electric-purple transition-colors" size={18} />
                               <input 
                                 type="email"
                                 value={formData.email}
                                 onChange={(e) => setFormData({...formData, email: e.target.value})}
                                 className="w-full bg-[#16162A]/50 border border-white/5 rounded-2xl py-5 pl-16 pr-8 font-bold focus:border-electric-purple/50 focus:bg-[#16162A] outline-none transition-all placeholder:text-slate-700 text-white"
                                 placeholder="Enter your email"
                                 autoComplete="off"
                                 required
                               />
                            </div>
                         </div>
                         <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 opacity-60">PHONE NUMBER</label>
                            <div className="relative group/field">
                               <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/field:text-electric-purple transition-colors" size={18} />
                               <input 
                                 type="tel"
                                 value={formData.phone}
                                 onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                 className="w-full bg-[#16162A]/50 border border-white/5 rounded-2xl py-5 pl-16 pr-8 font-bold focus:border-electric-purple/50 focus:bg-[#16162A] outline-none transition-all placeholder:text-slate-700 text-white"
                                 placeholder="Enter your phone"
                                 autoComplete="off"
                                 required
                               />
                            </div>
                         </div>
                      </div>

                      <div className="space-y-3 pt-4">
                         <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 opacity-60">PASSWORD</label>
                         <div className="relative group/field">
                            <Zap className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/field:text-electric-purple transition-colors" size={18} />
                            <input 
                              type="password"
                              value={formData.password}
                              onChange={(e) => setFormData({...formData, password: e.target.value})}
                              className="w-full bg-[#16162A]/50 border border-white/5 rounded-2xl py-5 pl-16 pr-8 font-bold focus:border-electric-purple/50 focus:bg-[#16162A] outline-none transition-all placeholder:text-slate-700 tracking-widest text-white"
                              placeholder="••••••••••••"
                              autoComplete="new-password"
                              required
                            />
                         </div>
                      </div>
                   </div>
                 ) : (
                   /* STEP 2: VEHICLE & DOCS */
                   <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                      <div className="grid grid-cols-2 gap-6">
                         <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 opacity-60">VEHICLE TYPE</label>
                            <div className="relative">
                               <LayoutGrid className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                               <select 
                                 value={formData.vehicleType}
                                 onChange={(e) => setFormData({...formData, vehicleType: e.target.value})}
                                 className="w-full bg-[#16162A]/50 border border-white/5 rounded-2xl py-5 pl-16 pr-8 font-bold focus:border-electric-cyan/50 focus:bg-[#16162A] outline-none transition-all appearance-none text-white px-16"
                               >
                                  <option value="cab" className="bg-obsidian">Cab (Sedan/Hatch)</option>
                                  <option value="rickshaw" className="bg-obsidian">Rickshaw (3-Wheel)</option>
                                  <option value="pickup" className="bg-obsidian">Pickup (Logistics)</option>
                                  <option value="truck" className="bg-obsidian">Truck (Heavy)</option>
                               </select>
                            </div>
                         </div>
                         <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 opacity-60">VEHICLE MODEL</label>
                            <div className="relative">
                               <Car className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                               <input 
                                 type="text"
                                 value={formData.model}
                                 onChange={(e) => setFormData({...formData, model: e.target.value})}
                                 className="w-full bg-[#16162A]/50 border border-white/5 rounded-2xl py-5 pl-16 pr-8 font-bold focus:border-electric-cyan/50 outline-none transition-all placeholder:text-slate-700 text-white"
                                 placeholder="e.g. Alto, Swift"
                                 required
                               />
                            </div>
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                         <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 opacity-60">VEHICLE NUMBER</label>
                            <div className="relative">
                               <FileText className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                               <input 
                                 type="text"
                                 value={formData.vehicleNumber}
                                 onChange={(e) => setFormData({...formData, vehicleNumber: e.target.value})}
                                 className="w-full bg-[#16162A]/50 border border-white/5 rounded-2xl py-5 pl-16 pr-8 font-bold focus:border-electric-cyan/50 outline-none transition-all placeholder:text-slate-700 text-white"
                                 placeholder="JK01-XXXX"
                                 required
                               />
                            </div>
                         </div>
                         <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 opacity-60">LICENSE NUMBER</label>
                            <div className="relative">
                               <CheckCircle2 className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                               <input 
                                 type="text"
                                 value={formData.licenseNumber}
                                 onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})}
                                 className="w-full bg-[#16162A]/50 border border-white/5 rounded-2xl py-5 pl-16 pr-8 font-bold focus:border-electric-cyan/50 outline-none transition-all placeholder:text-slate-700 text-white"
                                 placeholder="DL-XXXXXXXXXXXXX"
                                 required
                               />
                            </div>
                         </div>
                      </div>

                      {/* File Uploads */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                         <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 opacity-60">PROFILE PHOTO</label>
                            <label className="flex items-center justify-center gap-3 w-full bg-white/5 border border-dashed border-white/10 rounded-2xl py-6 cursor-pointer hover:bg-white/10 transition-all group">
                               <input type="file" name="profilePhoto" onChange={handleFileChange} className="hidden" required />
                               {files.profilePhoto ? (
                                 <span className="text-xs font-bold text-electric-cyan truncate px-4">{files.profilePhoto.name}</span>
                               ) : (
                                 <>
                                   <Upload size={18} className="text-slate-500 group-hover:text-white transition-colors" />
                                   <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 group-hover:text-white">UPLOAD PHOTO</span>
                                 </>
                               )}
                            </label>
                         </div>
                         <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 opacity-60">ID PROOF (PDF/IMG)</label>
                            <label className="flex items-center justify-center gap-3 w-full bg-white/5 border border-dashed border-white/10 rounded-2xl py-6 cursor-pointer hover:bg-white/10 transition-all group">
                               <input type="file" name="idProof" onChange={handleFileChange} className="hidden" required />
                               {files.idProof ? (
                                 <span className="text-xs font-bold text-electric-cyan truncate px-4">{files.idProof.name}</span>
                               ) : (
                                 <>
                                   <Upload size={18} className="text-slate-500 group-hover:text-white transition-colors" />
                                   <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 group-hover:text-white">UPLOAD ID</span>
                                 </>
                               )}
                            </label>
                         </div>
                      </div>
                   </div>
                 )}

                 <button 
                  type="submit" 
                  disabled={loading}
                  className={`w-full py-6 mt-4 ${step === 1 ? 'bg-electric-purple shadow-[0_0_30px_rgba(139,92,246,0.3)]' : 'bg-gradient-to-r from-electric-purple to-electric-cyan shadow-[0_0_30px_rgba(6,182,212,0.3)]'} rounded-2xl font-black italic uppercase tracking-[0.2em] text-xs hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 text-white`}
                 >
                    {loading ? (
                      <RefreshCcw className="animate-spin" size={18} />
                    ) : (
                      <>
                        {step === 1 ? 'INITIALIZE ENROLLMENT' : 'FINALIZE PILOT ACCESS'}
                        <ArrowLeft size={16} className="rotate-180" />
                      </>
                    )}
                 </button>
              </form>
           </div>
        </div>
      </div>
    </div>
  );
};

const RefreshCcw = ({ className }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
);

export default RegisterDriver;
