import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { 
  Navigation,
  Activity,
  Zap,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Download,
  Star,
  User,
  Car,
  Phone,
  MapPin,
  Calendar,
  Clock
} from 'lucide-react';
import { useToast } from '../../context/ToastContextShared';

const MyRides = () => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRideId, setExpandedRideId] = useState(null);
  const [ratingRide, setRatingRide] = useState(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const navigate = useNavigate();
  const { addToast } = useToast();

  const fetchRides = useCallback(async () => {
    try {
      const res = await api.get('/customer/bookings');
      if (res.data.success) {
        const sorted = res.data.bookings.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setRides(sorted);
      }
    } catch (err) {
      console.error('Failed to fetch rides:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchRides();
    });
  }, [fetchRides]);

  const getCleanName = (loc) => {
    if (!loc) return 'Unknown';
    return loc.includes('|||') ? loc.split('|||')[0].trim() : loc;
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-glow-emerald/5';
      case 'cancelled': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'started': return 'bg-primary/10 text-primary border-primary/20 shadow-glow-saffron/5';
      case 'accepted': return 'bg-electric-cyan/10 text-electric-cyan border-electric-cyan/20';
      case 'pending': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default: return 'bg-slate-100 dark:bg-white/5 text-slate-500 border-slate-200 dark:border-white/5';
    }
  };

  const handleRideClick = (ride) => {
    if (['pending', 'accepted', 'started'].includes(ride.status)) {
      if (ride.status === 'pending') navigate(`/customer/waiting/${ride.id}`);
      else navigate(`/customer/ride/${ride.id}`);
    } else {
      setExpandedRideId(expandedRideId === ride.id ? null : ride.id);
    }
  };

  const handleDownloadInvoice = (ride) => {
    const printWindow = window.open('', '_blank');
    const content = `
      <html>
        <head>
          <title>KashmirMove Official Invoice #${ride.id}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;700;900&display=swap');
            body { font-family: 'Outfit', sans-serif; padding: 60px; color: #0f172a; background: #fff; line-height: 1.5; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 4px solid #f59e0b; padding-bottom: 30px; margin-bottom: 40px; }
            .brand { display: flex; flex-direction: column; }
            .logo { font-size: 32px; font-weight: 900; color: #f59e0b; letter-spacing: -1px; }
            .tagline { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 3px; margin-top: 4px; }
            .invoice-meta { text-align: right; }
            .invoice-title { font-size: 48px; font-weight: 900; color: #e2e8f0; margin: 0; line-height: 1; }
            .invoice-id { font-size: 14px; font-weight: 700; color: #0f172a; margin-top: 10px; }
            
            .section { margin-bottom: 50px; }
            .section-title { font-size: 11px; font-weight: 900; text-transform: uppercase; color: #f59e0b; letter-spacing: 2px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 20px; }
            
            .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 40px; }
            .data-item { margin-bottom: 24px; }
            .label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #94a3b8; margin-bottom: 6px; }
            .value { font-size: 15px; font-weight: 600; color: #1e293b; }
            
            .fare-box { background: #f8fafc; border-radius: 30px; padding: 40px; border: 2px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; margin-top: 60px; }
            .fare-label { font-size: 14px; font-weight: 900; color: #64748b; text-transform: uppercase; }
            .fare-amount { font-size: 52px; font-weight: 900; color: #f59e0b; letter-spacing: -2px; }
            
            .footer { margin-top: 100px; padding-top: 30px; border-top: 1px solid #f1f5f9; text-align: center; }
            .footer p { font-size: 12px; color: #94a3b8; font-weight: 500; }
            .seal { display: inline-block; padding: 10px 20px; border: 2px solid #f59e0b; color: #f59e0b; font-weight: 900; font-size: 10px; border-radius: 12px; transform: rotate(-5deg); margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="brand">
              <div class="logo">KASHMIRMOVE</div>
              <div class="tagline">The Royal Valley Network</div>
            </div>
            <div class="invoice-meta">
              <h1 class="invoice-title">INVOICE</h1>
              <div class="invoice-id">REF: KM-DEPL-${ride.id} / ${new Date(ride.created_at).getFullYear()}</div>
            </div>
          </div>

          <div class="grid">
            <div class="section">
              <div class="section-title">Logistics Parameters</div>
              <div class="data-item"><div class="label">Origin Sector</div><div class="value">${ride.pickup_location}</div></div>
              <div class="data-item"><div class="label">Target Destination</div><div class="value">${ride.drop_location}</div></div>
              <div class="data-item"><div class="label">Deployment Timestamp</div><div class="value">${new Date(ride.created_at).toLocaleString()}</div></div>
            </div>
            <div class="section">
              <div class="section-title">Deployment Asset</div>
              <div class="data-item"><div class="label">Assigned Pilot</div><div class="value">${ride.driver_name || 'Generic Service'}</div></div>
              <div class="data-item"><div class="label">Unit Identifier</div><div class="value">${ride.model || 'Standard Unit'} (${ride.vehicle_number || 'UNRESTRICTED'})</div></div>
              <div class="data-item"><div class="label">Mission Status</div><div class="value" style="color: ${ride.status === 'completed' ? '#10b981' : '#f59e0b'}">${ride.status.toUpperCase()}</div></div>
            </div>
          </div>

          <div class="fare-box">
            <div>
              <div class="fare-label">Total Mission Allotment</div>
              <div style="font-size: 11px; color: #94a3b8; margin-top: 4px; font-weight: 700;">PAYMENT METHOD: NETWORK WALLET</div>
            </div>
            <div class="fare-amount">₹${Math.round(ride.fare)}</div>
          </div>

          <div class="footer">
            <p>This is an electronically generated document for the KashmirMove Network. All deployments are recorded on the secure ledger.</p>
            <div class="seal">VERIFIED DEPLOYMENT</div>
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.print();
  };

  const submitRating = async () => {
    if (!ratingRide) return;
    setSubmittingRating(true);
    try {
      const res = await api.post('/customer/review', {
        bookingId: ratingRide.id,
        driverId: ratingRide.driver_id,
        rating: ratingValue,
        comment: ratingComment
      });
      if (res.data.success) {
        addToast('Success', 'Feedback submitted successfully', 'success');
        setRatingRide(null);
        setRatingComment('');
        fetchRides();
      }
    } catch (err) {
      console.error('Feedback submission error:', err);
      addToast('Error', 'Failed to submit feedback', 'error');
    } finally {
      setSubmittingRating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-fade-in pb-20 pt-6 px-4">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
             <div className="w-12 h-1 bg-primary rounded-full"></div>
             <span className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-500 italic">Network Logs</span>
          </div>
          <h2 className="text-4xl sm:text-7xl font-display font-black italic uppercase leading-[0.9] sm:leading-[0.85] tracking-tighter text-slate-900 dark:text-white">
            YOUR <span className="text-primary">RIDES</span>
          </h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Historical archives of your tactical deployments.</p>
        </div>
        
        {!loading && rides.length > 0 && (
           <div className="bg-white dark:bg-white/5 px-6 sm:px-8 py-5 rounded-[2rem] border border-white/10 flex items-center justify-between gap-6 sm:gap-8 shadow-2xl w-full md:w-auto">
              <div className="text-right">
                 <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1 italic">Total Missions</p>
                 <p className="text-4xl font-display font-black text-slate-900 dark:text-white leading-none tracking-tighter">{rides.length}</p>
              </div>
              <div className="w-px h-12 bg-white/10"></div>
              <div className="text-right">
                 <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1 italic">Active Status</p>
                 <div className="flex gap-2 mt-1">
                    <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center text-primary shadow-glow-saffron/20"><Zap size={14} /></div>
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-glow-emerald/20"><ShieldCheck size={14} /></div>
                 </div>
              </div>
           </div>
        )}
      </div>

      {/* Rides List */}
      <div className="space-y-8">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="h-64 rounded-[3rem] bg-slate-100 dark:bg-white/5 animate-pulse border border-white/5" />
          ))
        ) : rides.length === 0 ? (
          <div className="py-24 sm:py-40 px-4 text-center bg-slate-50 dark:bg-white/5 rounded-[2rem] sm:rounded-[4rem] border border-dashed border-slate-200 dark:border-white/10">
            <Activity size={64} className="mx-auto mb-8 text-slate-300 opacity-20" />
            <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-xs italic">No Operations Logged</p>
            <button 
              onClick={() => navigate('/customer/book')}
              className="mt-8 px-12 py-5 bg-primary text-obsidian rounded-[2rem] font-black uppercase text-[11px] tracking-widest shadow-glow-saffron hover:scale-105 transition-all"
            >
              INITIALIZE FIRST MISSION
            </button>
          </div>
        ) : (
          rides.map((ride) => (
            <div 
              key={ride.id}
              className={`group transition-all duration-500 rounded-[2rem] sm:rounded-[3rem] border bg-white dark:bg-slate-900/50 backdrop-blur-sm shadow-2xl overflow-hidden ${
                expandedRideId === ride.id ? 'border-primary/30 ring-4 ring-primary/5' : 'border-slate-100 dark:border-white/5 hover:border-white/20'
              }`}
            >
              {/* Card Header/Summary */}
              <div 
                onClick={() => handleRideClick(ride)}
                className="p-5 sm:p-12 cursor-pointer flex flex-col lg:flex-row items-start sm:items-center gap-6 sm:gap-10"
              >
                {/* Date & Icon */}
                <div className="flex items-center gap-4 sm:gap-6 shrink-0 w-full lg:w-auto">
                  <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center border transition-all duration-500 ${
                    ['pending', 'accepted', 'started'].includes(ride.status)
                    ? 'bg-primary/20 border-primary/30 text-primary shadow-glow-saffron/20'
                    : 'bg-slate-100 dark:bg-white/5 border-white/10 text-slate-400'
                  }`}>
                    <Navigation size={32} className={['pending', 'accepted', 'started'].includes(ride.status) ? 'animate-pulse' : ''} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <Calendar size={12} className="text-slate-500" />
                      <p className="text-lg font-display font-black text-slate-900 dark:text-white uppercase italic tracking-tight">
                        {new Date(ride.created_at).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                       <Clock size={10} />
                       <span>{new Date(ride.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                       <span className="text-slate-700 dark:text-white/20">•</span>
                       <span className="text-primary/70">ID: #{ride.id}</span>
                    </div>
                  </div>
                </div>

                {/* Locations Pathway */}
                <div className="flex-1 w-full min-w-0 py-6 lg:py-0 border-y lg:border-y-0 lg:border-x border-slate-100 dark:border-white/5 px-0 lg:px-10">
                   <div className="flex flex-col gap-4 relative">
                      <div className="absolute left-[7px] top-3 bottom-3 w-px bg-slate-200 dark:bg-white/10 border-dashed border-l"></div>
                      <div className="flex items-center gap-4 group/loc">
                         <div className="w-4 h-4 rounded-full bg-slate-400 border-4 border-slate-100 dark:border-slate-800 z-10"></div>
                         <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest truncate italic">{getCleanName(ride.pickup_location)}</p>
                      </div>
                      <div className="flex items-center gap-4 group/loc">
                         <div className="w-4 h-4 rounded-full bg-primary border-4 border-slate-100 dark:border-slate-800 z-10 shadow-glow-saffron"></div>
                         <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest truncate italic">{getCleanName(ride.drop_location)}</p>
                      </div>
                   </div>
                </div>

                {/* Price & Status */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between lg:justify-end gap-4 sm:gap-10 w-full lg:w-auto shrink-0">
                  <div className="text-right">
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 mb-1 italic">Mission Fare</p>
                    <p className="text-4xl font-display font-black italic text-primary tracking-tighter">₹{Math.round(ride.fare)}</p>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                    <span className={`px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-[0.3em] border shadow-xl ${getStatusStyle(ride.status)}`}>
                      {ride.status}
                    </span>
                    {!['pending', 'accepted', 'started'].includes(ride.status) && (
                      <div className={`p-2 rounded-full transition-all ${expandedRideId === ride.id ? 'bg-primary text-obsidian' : 'bg-slate-100 dark:bg-white/5 text-slate-500'}`}>
                        {expandedRideId === ride.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Section */}
              {expandedRideId === ride.id && (
                <div className="p-5 sm:p-12 bg-slate-50 dark:bg-white/[0.02] border-t border-white/5 animate-slide-up">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    {/* Pilot Detail */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <User size={14} className="text-primary" />
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 italic">Pilot Profile</p>
                      </div>
                      <div className="p-6 bg-white dark:bg-white/5 rounded-[2rem] border border-white/5 space-y-4 shadow-xl">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                             <User size={24} />
                           </div>
                           <div>
                             <p className="text-sm font-black text-slate-900 dark:text-white uppercase italic">{ride.driver_name || 'N/A'}</p>
                             <div className="flex items-center gap-2 mt-1.5 text-slate-500">
                                <Phone size={10} />
                                <span className="text-[9px] font-bold tracking-[0.2em]">{ride.driver_phone || 'NODATA'}</span>
                             </div>
                           </div>
                        </div>
                        <div className="pt-4 border-t border-white/5 flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                             <Car size={20} />
                           </div>
                           <div>
                             <p className="text-[10px] font-black text-slate-400 uppercase italic">{ride.model || 'Generic Asset'}</p>
                             <p className="text-[9px] font-bold text-white/50 tracking-widest mt-1">{ride.vehicle_number || 'UNKNOWN'}</p>
                           </div>
                        </div>
                      </div>
                    </div>

                    {/* Sector Map */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <MapPin size={14} className="text-emerald-500" />
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 italic">Mission Sector</p>
                      </div>
                      <div className="p-6 bg-white dark:bg-white/5 rounded-[2rem] border border-white/5 space-y-6 shadow-xl">
                        <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">Pickup Hub</p>
                          <p className="text-[11px] font-bold text-slate-900 dark:text-white/80 leading-relaxed">{ride.pickup_location}</p>
                        </div>
                        <div className="h-px bg-white/5 border-dashed border-b"></div>
                        <div>
                          <p className="text-[8px] font-black text-primary uppercase tracking-widest mb-2 italic">Terminal Node</p>
                          <p className="text-[11px] font-bold text-slate-900 dark:text-white/80 leading-relaxed">{ride.drop_location}</p>
                        </div>
                      </div>
                    </div>

                    {/* Operational Commands */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <ShieldCheck size={14} className="text-electric-cyan" />
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 italic">Commands</p>
                      </div>
                      <div className="space-y-4">
                        <button 
                          onClick={() => handleDownloadInvoice(ride)}
                          className="w-full py-5 bg-white dark:bg-white/5 hover:bg-primary hover:text-obsidian hover:shadow-glow-saffron border border-slate-200 dark:border-white/10 rounded-2xl flex items-center justify-center gap-4 text-slate-900 dark:text-white text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-lg active:scale-95 group/btn"
                        >
                          <Download size={16} className="group-hover/btn:animate-bounce" /> INVOICE MANIFEST
                        </button>
                        {ride.status === 'completed' && (
                          ride.review_id ? (
                            <div className="w-full py-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex flex-col items-center justify-center gap-2 text-emerald-500 shadow-glow-emerald/5">
                              <span className="text-[9px] font-black uppercase tracking-[0.3em] italic">FEEDBACK SUBMITTED</span>
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map(v => (
                                  <Star 
                                    key={v} 
                                    size={12} 
                                    className="text-primary" 
                                    fill={ride.review_rating >= v ? 'currentColor' : 'none'} 
                                  />
                                ))}
                              </div>
                            </div>
                          ) : (
                            <button 
                              onClick={() => setRatingRide(ride)}
                              className="w-full py-5 bg-primary text-obsidian rounded-2xl flex items-center justify-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] shadow-glow-saffron transition-all hover:scale-[1.02] hover:shadow-2xl active:scale-95"
                            >
                              <Star size={16} /> RATE MISSION
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* RATING MODAL (Obsidian Tactical) - Wrapped in Portal to avoid Layout stacking context and z-index issues */}
      {ratingRide && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-auto">
           {/* Clear backdrop listener - Fades in separate from modal and provides rich backdrop blur */}
           <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-fade-in" onClick={() => setRatingRide(null)}></div>
           
           {/* Modal Card - Scale-in bouncy entry animation */}
           <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-[2.5rem] p-7 space-y-5 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] relative overflow-hidden z-10 animate-scale-in">
              {/* Tactical Carbon Fiber Overlay */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
              
              {/* Animated Gradient Accent */}
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-saffron to-amber-500 opacity-90"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[60px] -mr-16 -mt-16"></div>
              
              <div className="text-center space-y-2 relative z-10">
                 <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-primary mx-auto shadow-inner">
                    <Star size={28} className="drop-shadow-glow-saffron" />
                 </div>
                 <h3 className="text-2xl font-display font-black italic uppercase tracking-tight text-white leading-none">MISSION <br/><span className="bg-gradient-to-r from-primary to-saffron bg-clip-text text-transparent text-3xl">FEEDBACK</span></h3>
                 <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-2">Log Registry #{ratingRide.id}</p>
              </div>

              <div className="flex justify-center gap-3 py-1 relative z-10">
                 {[1, 2, 3, 4, 5].map(v => (
                   <button 
                    key={v}
                    onClick={() => setRatingValue(v)}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500 ${
                      ratingValue >= v 
                      ? 'bg-gradient-to-br from-primary to-saffron text-obsidian shadow-glow-saffron scale-110' 
                      : 'bg-white/5 text-slate-500 border border-white/10 hover:bg-white/10'
                    }`}
                   >
                     <Star size={20} fill={ratingValue >= v ? 'currentColor' : 'none'} />
                   </button>
                 ))}
              </div>

              <div className="space-y-2 relative z-10">
                 <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 italic ml-2">Assessment Log</p>
                 <textarea 
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  placeholder="Provide tactical assessment..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white text-sm outline-none focus:border-primary/50 transition-all min-h-[90px] resize-none placeholder:text-slate-600 shadow-inner"
                 />
              </div>

              <div className="flex gap-3 relative z-10 pt-1">
                 <button 
                  onClick={() => setRatingRide(null)}
                  className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400 transition-all"
                 >
                   ABORT
                 </button>
                 <button 
                  onClick={submitRating}
                  disabled={submittingRating}
                  className="flex-[2] py-4 bg-gradient-to-r from-primary to-saffron text-obsidian rounded-xl text-[9px] font-black uppercase tracking-widest shadow-glow-saffron hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                 >
                   {submittingRating ? 'TRANSMITTING...' : 'COMMIT FEEDBACK'}
                 </button>
              </div>
              
              <div className="text-[8px] text-center font-bold text-slate-500 uppercase tracking-[0.3em] opacity-50">Protocol: Secure Encryption Active</div>
           </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default MyRides;
