import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { Clock, CreditCard, ChevronRight, Zap, Loader2, Target, MapPin, Activity } from 'lucide-react';
import { useToast } from '../../context/ToastContextShared';

const NewRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const { addToast } = useToast();

  const fetchRequests = useCallback(async () => {
    try {
      const res = await api.get('/driver/bookings');
      if (res.data.success) {
        // Filter for pending requests
        const pending = res.data.bookings.filter(b => b.status === 'pending');
        setRequests(pending);
      }
    } catch (err) {
      console.error('Failed to fetch requests:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchRequests();
    });
    const interval = setInterval(fetchRequests, 5000);
    return () => clearInterval(interval);
  }, [fetchRequests]);

  const handleAccept = async (bookingId) => {
    setProcessingId(bookingId);
    try {
      const res = await api.put('/driver/booking-status', { bookingId, status: 'accepted' });
      if (res.data.success) {
        addToast("Mission Accepted", "Head to the pickup location immediately.", "success");
        setRequests(prev => prev.filter(r => r.id !== bookingId));
      }
    } catch (err) {
      addToast("Command Failed", err.response?.data?.message || "Could not accept ride.", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const getCleanName = (loc) => {
    if (!loc) return 'Unknown';
    return loc.includes('|||') ? loc.split('|||')[0].trim() : loc;
  };

  if (loading && requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="relative mb-8">
           <div className="w-20 h-20 border-4 border-primary/10 rounded-full animate-ping absolute inset-0"></div>
           <Activity className="w-12 h-12 text-primary relative z-10 animate-pulse" />
        </div>
        <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-[10px] animate-pulse">Scanning Grid for Incoming Missions...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 sm:space-y-12 animate-fade-in pb-20 pt-6 px-4 sm:px-0">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
           <div className="w-12 h-1 bg-primary rounded-full"></div>
           <span className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-500 italic">Sector Intelligence</span>
        </div>
        <h2 className="text-4xl sm:text-6xl font-display font-black italic uppercase leading-none tracking-tighter text-slate-900 dark:text-white">
          MISSION <span className="text-primary">ACQUISITION</span>
        </h2>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Available deployments in your current operating zone.</p>
      </div>

      {requests.length === 0 ? (
        <div className="card-modern py-24 text-center border-dashed border-2 border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01]">
          <div className="w-24 h-24 bg-slate-100 dark:bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto mb-8 opacity-40">
            <Zap size={40} className="text-slate-400" />
          </div>
          <h3 className="text-2xl font-display font-black italic uppercase tracking-tight mb-3">No Active Signals</h3>
          <p className="text-slate-500 max-w-xs mx-auto text-xs font-bold uppercase tracking-widest leading-relaxed">Stand by for encrypted ride requests from local logistics nodes.</p>
        </div>
      ) : (
        <div className="grid gap-8">
          {requests.map((req) => (
            <div key={req.id} className="card-modern group hover:border-primary/50 transition-all p-0 overflow-hidden bg-white dark:bg-white/5 border-white/5 relative">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 transition-opacity pointer-events-none">
                 <Target size={120} />
              </div>
              
              <div className="p-5 sm:p-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-6 sm:gap-10">
                <div className="flex-1 space-y-8 w-full">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                    <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                       <span className="px-4 py-1.5 bg-primary/10 text-primary text-[10px] font-black rounded-full uppercase tracking-[0.2em] border border-primary/20 shadow-glow-saffron/10">
                         {req.vehicle_type || 'Standard'}
                       </span>
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                         MISSION ID: #{req.id}
                       </span>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 italic">Est. Allotment</p>
                      <p className="text-4xl font-display font-black text-primary italic tracking-tighter">₹{Math.round(req.fare)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center shrink-0">
                         <MapPin size={18} className="text-slate-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Pickup Point</p>
                        <p className="font-black text-sm text-slate-900 dark:text-white truncate uppercase tracking-tight leading-snug">{getCleanName(req.pickup_location)}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                         <Target size={18} className="text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Target Point</p>
                        <p className="font-black text-sm text-slate-900 dark:text-white truncate uppercase tracking-tight leading-snug">{getCleanName(req.drop_location)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 pt-6 border-t border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-2.5 text-slate-400 group-hover:text-primary transition-colors">
                      <Clock size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest">{new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} Uplink</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-slate-400">
                      <CreditCard size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest">DIGITAL WALLET</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleAccept(req.id)}
                  disabled={processingId === req.id}
                  className="w-full sm:w-64 py-6 bg-primary text-obsidian font-black uppercase tracking-[0.2em] text-xs rounded-3xl shadow-glow-saffron hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50 relative z-10 shrink-0"
                >
                  {processingId === req.id ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>ACCEPT MISSION <ChevronRight size={18} /></>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NewRequests;
