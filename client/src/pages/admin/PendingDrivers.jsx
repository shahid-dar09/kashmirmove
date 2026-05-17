import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { RefreshCcw, ShieldCheck, Phone, Car, Target, X, Check, Activity, Shield } from 'lucide-react';
import { useToast } from '../../context/ToastContextShared';

const PendingDrivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/drivers/pending');
      setDrivers(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Defer update to avoid cascading render warning
    Promise.resolve().then(() => {
      fetchPending();
    });
  }, [fetchPending]);

  const handleAction = async (id, status) => {
    try {
      await api.put(`/admin/drivers/${id}/status`, { status });
      addToast("Status Updated", `Pilot status has been updated to ${status}.`, "success");
      setDrivers(drivers.filter(d => d.id !== id));
    } catch {
      addToast("Error", "Failed to update status", "error");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-fade-in pb-20 pt-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-10">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
             <div className="w-12 h-1 bg-red-500 rounded-full"></div>
             <span className="text-[11px] font-black uppercase tracking-[0.4em] text-red-500 italic">Security Verification</span>
          </div>
          <h2 className="text-5xl sm:text-7xl font-display font-black italic uppercase leading-[0.85] tracking-tighter text-slate-900 dark:text-white">
            PENDING <span className="text-primary">PILOTS</span>
          </h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Review mission-readiness and verification applications.</p>
        </div>
        <button 
          onClick={fetchPending} 
          className="w-16 h-16 rounded-3xl bg-white dark:bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-primary transition-all shadow-xl hover:scale-110 active:scale-95"
        >
          <RefreshCcw size={24} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading && drivers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-40">
           <div className="relative mb-8">
              <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              <Shield size={24} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary" />
           </div>
           <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 animate-pulse italic">Scanning Application Ledger...</p>
        </div>
      ) : drivers.length === 0 ? (
        <div className="card-modern py-40 text-center bg-white dark:bg-white/5 border-white/5 rounded-[4rem]">
          <div className="w-24 h-24 bg-slate-100 dark:bg-white/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 opacity-20">
             <Activity size={48} className="text-slate-400" />
          </div>
          <h3 className="text-3xl font-display font-black italic uppercase tracking-tight mb-3 text-slate-900 dark:text-white">Clearance Grid Empty</h3>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">All mission applications have been processed.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {drivers.map(driver => (
            <div key={driver.id} className="card-modern p-10 flex flex-col justify-between bg-white dark:bg-obsidian border-white/5 rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
              <div className="absolute -right-10 -top-10 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                 <ShieldCheck size={180} />
              </div>
              
              <div className="relative z-10 space-y-10">
                <div className="flex items-center gap-6">
                   <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-[2rem] flex items-center justify-center border border-white/10 group-hover:border-primary/30 transition-all overflow-hidden shadow-xl">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${driver.name}`} alt={driver.name} className="w-full h-full scale-110" />
                   </div>
                   <div className="min-w-0">
                      <h4 className="text-2xl font-display font-black italic uppercase tracking-tight text-slate-900 dark:text-white truncate">{driver.name}</h4>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate mt-1">{driver.email}</p>
                   </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-white/5">
                   {[
                     { icon: <Phone size={14} />, label: "Voice Uplink", value: driver.phone },
                     { icon: <Car size={14} />, label: "Fleet Class", value: driver.vehicle_type, premium: true },
                     { icon: <Target size={14} />, label: "Application ID", value: `#PK-${driver.id}` }
                   ].map((item, idx) => (
                     <div key={idx} className="flex justify-between items-center bg-slate-50 dark:bg-white/5 px-6 py-4 rounded-2xl border border-transparent hover:border-white/5 transition-all">
                        <div className="flex items-center gap-3 text-slate-400 group-hover:text-primary transition-colors">
                           {item.icon}
                           <span className="text-[9px] font-black uppercase tracking-widest italic">{item.label}</span>
                        </div>
                        <span className={`text-[11px] font-black uppercase tracking-tighter ${item.premium ? 'text-primary' : 'text-slate-900 dark:text-white'}`}>{item.value}</span>
                     </div>
                   ))}
                </div>
              </div>

              <div className="flex gap-6 mt-12 relative z-10">
                 <button 
                  onClick={() => handleAction(driver.id, 'rejected')} 
                  className="flex-1 py-5 bg-red-500/5 text-red-500 border border-red-500/10 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-3"
                >
                  <X size={16} /> REJECT
                </button>
                 <button 
                  onClick={() => handleAction(driver.id, 'approved')} 
                  className="flex-[1.5] py-5 bg-primary text-obsidian rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-glow-saffron hover:scale-[1.05] active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  <Check size={16} /> AUTHORIZE PILOT
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PendingDrivers;
