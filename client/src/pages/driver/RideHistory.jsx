import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { 
  Calendar, 
  User, 
  Activity,
  ChevronDown,
  ChevronUp,
  Download,
  Phone,
  Navigation,
  Briefcase
} from 'lucide-react';

const RideHistory = () => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRideId, setExpandedRideId] = useState(null);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await api.get('/driver/bookings');
      if (res.data.success) {
        const sorted = res.data.bookings.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setRides(sorted);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchHistory();
    });
  }, [fetchHistory]);

  const getCleanName = (loc) => {
    if (!loc) return 'Unknown';
    return loc.includes('|||') ? loc.split('|||')[0].trim() : loc;
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-glow-emerald/5';
      case 'cancelled': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'started': return 'bg-primary/10 text-primary border-primary/20 animate-pulse shadow-glow-saffron/5';
      case 'accepted': return 'bg-electric-cyan/10 text-electric-cyan border-electric-cyan/20';
      default: return 'bg-slate-100 dark:bg-white/5 text-slate-500 border-slate-200 dark:border-white/5';
    }
  };

  const handleDownloadInvoice = (ride) => {
    const printWindow = window.open('', '_blank');
    const content = `
      <html>
        <head>
          <title>KashmirMove Official Manifest #${ride.id}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;700;900&display=swap');
            body { font-family: 'Outfit', sans-serif; padding: 60px; color: #0f172a; background: #fff; line-height: 1.5; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 4px solid #10b981; padding-bottom: 30px; margin-bottom: 40px; }
            .brand { display: flex; flex-direction: column; }
            .logo { font-size: 32px; font-weight: 900; color: #10b981; letter-spacing: -1px; }
            .tagline { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 3px; margin-top: 4px; }
            .manifest-meta { text-align: right; }
            .manifest-title { font-size: 48px; font-weight: 900; color: #e2e8f0; margin: 0; line-height: 1; }
            .manifest-id { font-size: 14px; font-weight: 700; color: #0f172a; margin-top: 10px; }
            
            .section { margin-bottom: 50px; }
            .section-title { font-size: 11px; font-weight: 900; text-transform: uppercase; color: #10b981; letter-spacing: 2px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 20px; }
            
            .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 40px; }
            .data-item { margin-bottom: 24px; }
            .label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #94a3b8; margin-bottom: 6px; }
            .value { font-size: 15px; font-weight: 600; color: #1e293b; }
            
            .revenue-box { background: #f8fafc; border-radius: 30px; padding: 40px; border: 2px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; margin-top: 60px; }
            .revenue-label { font-size: 14px; font-weight: 900; color: #64748b; text-transform: uppercase; }
            .revenue-amount { font-size: 52px; font-weight: 900; color: #10b981; letter-spacing: -2px; }
            
            .footer { margin-top: 100px; padding-top: 30px; border-top: 1px solid #f1f5f9; text-align: center; }
            .footer p { font-size: 12px; color: #94a3b8; font-weight: 500; }
            .seal { display: inline-block; padding: 10px 20px; border: 2px solid #10b981; color: #10b981; font-weight: 900; font-size: 10px; border-radius: 12px; transform: rotate(-5deg); margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="brand">
              <div class="logo">KASHMIRMOVE PILOT</div>
              <div class="tagline">Official Sector Deployment Record</div>
            </div>
            <div class="manifest-meta">
              <h1 class="manifest-title">MANIFEST</h1>
              <div class="manifest-id">ARCHIVE: PILOT-LOG-${ride.id} / ${new Date(ride.created_at).getFullYear()}</div>
            </div>
          </div>

          <div class="grid">
            <div class="section">
              <div class="section-title">Operational Sectors</div>
              <div class="data-item"><div class="label">Pickup Hub</div><div class="value">${ride.pickup_location}</div></div>
              <div class="data-item"><div class="label">Target Terminal</div><div class="value">${ride.drop_location}</div></div>
              <div class="data-item"><div class="label">Operation Timestamp</div><div class="value">${new Date(ride.created_at).toLocaleString()}</div></div>
            </div>
            <div class="section">
              <div class="section-title">Client Intelligence</div>
              <div class="data-item"><div class="label">Identified Client</div><div class="value">${ride.customer_name || 'Generic Client'}</div></div>
              <div class="data-item"><div class="label">Verified Contact</div><div class="value">${ride.customer_phone || 'N/A'}</div></div>
              <div class="data-item"><div class="label">Status Protocol</div><div class="value" style="color: ${ride.status === 'completed' ? '#10b981' : '#f59e0b'}">${ride.status.toUpperCase()}</div></div>
            </div>
          </div>

          <div class="revenue-box">
            <div>
              <div class="revenue-label">Mission Revenue Allotted</div>
              <div style="font-size: 11px; color: #94a3b8; margin-top: 4px; font-weight: 700;">CREDITED TO PILOT LEDGER</div>
            </div>
            <div class="revenue-amount">₹${Math.round(ride.fare)}</div>
          </div>

          <div class="footer">
            <p>This document serves as the official operational record for the Pilot. All data is verified and synced with the KashmirMove Network.</p>
            <div class="seal">VERIFIED OPERATION</div>
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-fade-in pb-20 pt-6 px-4">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
             <div className="w-12 h-1 bg-primary rounded-full"></div>
             <span className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-500 italic">Deployment Archives</span>
          </div>
          <h2 className="text-4xl sm:text-7xl font-display font-black italic uppercase leading-[0.9] sm:leading-[0.85] tracking-tighter text-slate-900 dark:text-white">
            SECTOR <span className="text-primary">LOGS</span>
          </h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Logbook of your verified field operations.</p>
        </div>
        
        {!loading && rides.length > 0 && (
           <div className="bg-white dark:bg-white/5 px-6 sm:px-8 py-5 rounded-[2rem] border border-white/10 flex items-center justify-between gap-6 sm:gap-8 shadow-2xl w-full md:w-auto">
              <div className="text-right">
                 <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1 italic">Total Missions</p>
                 <p className="text-4xl font-display font-black text-slate-900 dark:text-white leading-none tracking-tighter">{rides.length}</p>
              </div>
              <div className="w-px h-12 bg-white/10"></div>
              <div className="text-right">
                 <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1 italic">Total Revenue</p>
                 <p className="text-4xl font-display font-black text-emerald-500 leading-none tracking-tighter">
                   ₹{Math.round(rides.reduce((acc, r) => acc + (r.status === 'completed' ? Number(r.fare) : 0), 0))}
                 </p>
              </div>
           </div>
        )}
      </div>

      {/* Mission Cards */}
      <div className="space-y-8">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="h-64 rounded-[3rem] bg-slate-100 dark:bg-white/5 animate-pulse border border-white/5" />
          ))
        ) : rides.length === 0 ? (
          <div className="py-24 sm:py-40 px-4 text-center bg-slate-50 dark:bg-white/5 rounded-[2rem] sm:rounded-[4rem] border border-dashed border-slate-200 dark:border-white/10">
            <Activity size={64} className="mx-auto mb-8 text-slate-300 opacity-20" />
            <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-xs italic">Archives Empty</p>
          </div>
        ) : (
          rides.map((ride) => (
            <div 
              key={ride.id}
              className={`group transition-all duration-500 rounded-[2rem] sm:rounded-[3rem] border bg-white dark:bg-slate-900/50 backdrop-blur-sm shadow-2xl overflow-hidden ${
                expandedRideId === ride.id ? 'border-primary/30 ring-4 ring-primary/5' : 'border-slate-100 dark:border-white/5 hover:border-white/20'
              }`}
            >
              {/* Summary View */}
              <div 
                onClick={() => setExpandedRideId(expandedRideId === ride.id ? null : ride.id)}
                className="p-5 sm:p-12 cursor-pointer flex flex-col lg:flex-row items-start sm:items-center gap-6 sm:gap-10"
              >
                {/* Date & Client Summary */}
                <div className="flex items-center gap-4 sm:gap-6 shrink-0 w-full lg:w-auto">
                  <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center border transition-all duration-500 ${
                    ['started', 'accepted'].includes(ride.status)
                    ? 'bg-primary/20 border-primary/30 text-primary shadow-glow-saffron/20'
                    : 'bg-slate-100 dark:bg-white/5 border-white/10 text-slate-400'
                  }`}>
                    <Calendar size={32} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <p className="text-lg font-display font-black text-slate-900 dark:text-white uppercase italic tracking-tight">
                        {new Date(ride.created_at).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                       <User size={10} />
                       <span className="text-slate-900 dark:text-white/80">{ride.customer_name || 'Generic Client'}</span>
                       <span className="text-slate-700 dark:text-white/20">•</span>
                       <span className="text-primary/70">#{ride.id}</span>
                    </div>
                  </div>
                </div>

                {/* Tactical Path */}
                <div className="flex-1 w-full min-w-0 py-6 lg:py-0 border-y lg:border-y-0 lg:border-x border-slate-100 dark:border-white/5 px-0 lg:px-10">
                   <div className="flex flex-col gap-4 relative">
                      <div className="absolute left-[7px] top-3 bottom-3 w-px bg-slate-200 dark:bg-white/10 border-dashed border-l"></div>
                      <div className="flex items-center gap-4">
                         <div className="w-4 h-4 rounded-full bg-slate-400 border-4 border-slate-100 dark:border-slate-800 z-10"></div>
                         <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest truncate italic">{getCleanName(ride.pickup_location)}</p>
                      </div>
                      <div className="flex items-center gap-4">
                         <div className="w-4 h-4 rounded-full bg-primary border-4 border-slate-100 dark:border-slate-800 z-10 shadow-glow-saffron"></div>
                         <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest truncate italic">{getCleanName(ride.drop_location)}</p>
                      </div>
                   </div>
                </div>

                {/* Revenue & Status */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between lg:justify-end gap-4 sm:gap-10 w-full lg:w-auto shrink-0">
                  <div className="text-right">
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 mb-1 italic">Mission Allotment</p>
                    <p className="text-4xl font-display font-black italic text-emerald-500 tracking-tighter">₹{Math.round(ride.fare)}</p>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                    <span className={`px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-[0.3em] border shadow-xl ${getStatusStyle(ride.status)}`}>
                      {ride.status}
                    </span>
                    <div className={`p-2 rounded-full transition-all ${expandedRideId === ride.id ? 'bg-primary text-obsidian' : 'bg-slate-100 dark:bg-white/5 text-slate-500'}`}>
                      {expandedRideId === ride.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed View */}
              {expandedRideId === ride.id && (
                <div className="p-5 sm:p-12 bg-slate-50 dark:bg-white/[0.02] border-t border-white/5 animate-slide-up">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    {/* Client Data */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <Briefcase size={14} className="text-primary" />
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 italic">Client Profile</p>
                      </div>
                      <div className="p-6 bg-white dark:bg-white/5 rounded-[2rem] border border-white/5 space-y-4 shadow-xl">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                             <User size={24} />
                           </div>
                           <div>
                             <p className="text-sm font-black text-slate-900 dark:text-white uppercase italic leading-none">{ride.customer_name || 'Generic Client'}</p>
                             <div className="flex items-center gap-2 mt-2 text-slate-500">
                                <Phone size={10} />
                                <span className="text-[9px] font-bold tracking-[0.2em]">{ride.customer_phone || 'NODATA'}</span>
                             </div>
                           </div>
                        </div>
                      </div>
                    </div>

                    {/* Logistics Manifest */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <Navigation size={14} className="text-emerald-500" />
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 italic">Sector Manifest</p>
                      </div>
                      <div className="p-6 bg-white dark:bg-white/5 rounded-[2rem] border border-white/5 space-y-6 shadow-xl">
                        <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">Origin Hub</p>
                          <p className="text-[11px] font-bold text-slate-900 dark:text-white/80 leading-relaxed">{ride.pickup_location}</p>
                        </div>
                        <div className="h-px bg-white/5 border-dashed border-b"></div>
                        <div>
                          <p className="text-[8px] font-black text-primary uppercase tracking-widest mb-2 italic">Target Terminal</p>
                          <p className="text-[11px] font-bold text-slate-900 dark:text-white/80 leading-relaxed">{ride.drop_location}</p>
                        </div>
                      </div>
                    </div>

                    {/* Pilot Commands */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <Activity size={14} className="text-electric-cyan" />
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 italic">Pilot Commands</p>
                      </div>
                      <div className="space-y-4">
                        <button 
                          onClick={() => handleDownloadInvoice(ride)}
                          className="w-full py-5 bg-white dark:bg-white/5 hover:bg-emerald-500 hover:text-white hover:shadow-glow-emerald border border-slate-200 dark:border-white/10 rounded-2xl flex items-center justify-center gap-4 text-slate-900 dark:text-white text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-lg active:scale-95 group/btn"
                        >
                          <Download size={16} className="group-hover/btn:animate-bounce" /> DOWNLOAD MANIFEST
                        </button>
                        <div className="p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl text-center">
                           <p className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.3em] italic">Revenue Status</p>
                           <p className="text-xl font-display font-black text-slate-900 dark:text-white mt-2 italic tracking-tighter">₹{Math.round(ride.fare)} ALLOTTED</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RideHistory;
