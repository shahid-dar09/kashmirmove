import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../../services/api';
import { useToast } from '../../context/ToastContextShared';
import { 
  Loader2, 
  X, 
  MapPin, 
  Activity, 
  Target,
  Radar,
  Signal
} from 'lucide-react';

const statusMessages = [
  'Broadcasting coordinates...',
  'Scanning Srinagar sector...',
  'Identifying nearest available node...',
  'Handshaking with fleet pilots...',
  'Awaiting protocol confirmation...',
  'Synchronizing with valley grid...',
  'Optimizing route interception...'
];

const WaitingRide = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [statusText, setStatusText] = useState('Initializing Uplink...');
  const socketRef = useRef(null);


  useEffect(() => {
    const interval = setInterval(() => {
      setStatusText(statusMessages[Math.floor(Math.random() * statusMessages.length)]);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchBooking = useCallback(async () => {
    try {
      const res = await api.get('/customer/bookings');
      const current = res.data.bookings.find(b => b.id === parseInt(id));
      if (current) {
        if (current.status === 'accepted' || current.status === 'started') {
          navigate(`/customer/ride/${id}`);
        } else if (current.status === 'completed' || current.status === 'cancelled') {
          navigate('/dashboard');
        } else {
          setBooking(current);
        }
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchBooking();
    });
    
    const SOCKET_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000`;
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5
    });
    
    const joinRoom = () => {
      if (socketRef.current) socketRef.current.emit('join_booking', id);
    };

    if (socketRef.current.connected) {
      joinRoom();
    }
    socketRef.current.on('connect', joinRoom);
    
    socketRef.current.on('booking_status_updated', (data) => {
      if (data.status === 'accepted') {
        addToast("Pilot Found!", "A pilot has accepted your mission.", "success");
        navigate(`/customer/ride/${id}`);
      } else if (data.status === 'cancelled') {
        addToast("Mission Aborted", "The ride request was cancelled.", "error");
        navigate('/dashboard');
      }
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [id, navigate, addToast, fetchBooking]);

  const cancelRequest = async () => {
    setCancelling(true);
    try {
      await api.post('/customer/cancel-ride', { bookingId: id });
      addToast("Request Cancelled", "Your mission request was aborted.", "success");
      navigate('/dashboard');
    } catch (err) {
      addToast("Error", err.response?.data?.message || "Failed to cancel", "error");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] font-display">
      <div className="relative mb-10">
         <div className="w-24 h-24 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
         <Signal className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary" size={32} />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500 animate-pulse italic">Establishing Sector Uplink...</p>
    </div>
  );

  if (!booking) return null;

  return (
    <div className="max-w-4xl mx-auto min-h-[90vh] flex flex-col items-center justify-center py-10 sm:py-12 animate-fade-in px-4 sm:px-6 text-center font-display relative overflow-hidden">
       
       {/* Background Grid - Tactical Overhaul */}
       <div className="absolute inset-0 pointer-events-none opacity-[0.02] dark:opacity-[0.05] bg-[linear-gradient(rgba(0,0,0,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.2)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
       
       {/* High-Fidelity Tactical Radar */}
       <div className="relative w-72 h-72 sm:w-[450px] sm:h-[450px] mb-12 sm:mb-20 flex items-center justify-center">
          {/* Radar Background Rings */}
          <div className="absolute inset-0 border border-primary/5 rounded-full"></div>
          <div className="absolute inset-12 border border-primary/5 rounded-full"></div>
          <div className="absolute inset-24 border border-primary/10 rounded-full"></div>
          <div className="absolute inset-36 border border-primary/10 rounded-full"></div>
          
          {/* Sweeping Beam Effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/10 via-transparent to-transparent animate-[spin_3s_linear_infinite] origin-center opacity-40"></div>
          
          {/* Pinging Rings */}
          <div className="absolute inset-0 border-2 border-primary/20 rounded-full animate-ping opacity-5"></div>
          <div className="absolute inset-20 border border-primary/30 rounded-full animate-ping opacity-10" style={{ animationDelay: '1.5s' }}></div>
          
          <div className="relative z-10">
             <div className="w-32 h-32 sm:w-44 sm:h-44 bg-gradient-to-br from-slate-900 to-obsidian rounded-[3rem] flex items-center justify-center shadow-[0_0_80px_rgba(245,158,11,0.4)] border-4 border-white/10 relative group overflow-hidden">
                <div className="absolute inset-0 bg-primary/10 animate-pulse"></div>
                <div className="relative z-10 flex flex-col items-center gap-3">
                   <Radar size={56} className="text-primary animate-pulse" />
                   <div className="flex gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-primary animate-bounce shadow-glow-saffron" style={{ animationDelay: '0s' }}></div>
                      <div className="w-2 h-2 rounded-full bg-primary animate-bounce shadow-glow-saffron" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 rounded-full bg-primary animate-bounce shadow-glow-saffron" style={{ animationDelay: '0.4s' }}></div>
                   </div>
                </div>
             </div>
             
             {/* Tactical Marker Icons (Faux detected pilots) */}
             <div className="absolute -top-8 right-0 sm:-top-6 sm:-right-16 animate-float">
                <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 px-5 py-2 rounded-2xl backdrop-blur-xl shadow-2xl">
                   <Target className="text-emerald-500 shadow-glow-emerald/50" size={16} />
                   <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 italic">Node Identified</span>
                </div>
             </div>
             <div className="absolute -bottom-12 left-0 sm:-bottom-10 sm:-left-20 animate-float" style={{ animationDelay: '2s' }}>
                <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 px-5 py-2 rounded-2xl backdrop-blur-xl shadow-2xl">
                   <Activity className="text-primary shadow-glow-saffron/50" size={16} />
                   <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary italic">Syncing Grid...</span>
                </div>
             </div>
          </div>
       </div>

       {/* Content Text */}
       <div className="relative z-10 max-w-2xl space-y-8 sm:space-y-10">
          <div className="flex items-center justify-center gap-3 sm:gap-4">
             <div className="w-10 h-1 bg-primary/20 rounded-full"></div>
             <p className="text-[11px] font-black uppercase tracking-[0.5em] text-primary italic animate-pulse">
                {statusText}
              </p>
             <div className="w-10 h-1 bg-primary/20 rounded-full"></div>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-4xl sm:text-8xl font-display font-black italic uppercase tracking-tighter text-slate-900 dark:text-white leading-[0.9] sm:leading-[0.85]">
              SCANNING FOR <br/> <span className="text-primary">PILOTS</span>
            </h2>
            <p className="text-base sm:text-xl text-slate-500 dark:text-slate-400 font-bold italic leading-relaxed max-w-lg mx-auto uppercase tracking-tighter opacity-80">
              Broadcasting mission parameters to the valley's elite pilot network. Stand by for protocol acknowledgement.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
             <div className="card-modern p-8 flex items-center gap-6 text-left bg-white dark:bg-white/5 border-white/5 group rounded-[2.5rem] shadow-xl">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-400 group-hover:text-primary transition-all shadow-inner">
                   <MapPin size={24} />
                </div>
                <div className="min-w-0">
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-1 italic">Deployment Origin</p>
                   <p className="font-black italic text-slate-900 dark:text-white truncate text-lg tracking-tight uppercase leading-none">{booking.pickup_location.split('|||')[0]}</p>
                </div>
             </div>
             <div className="card-modern p-8 flex items-center gap-6 text-left bg-white dark:bg-white/5 border-white/5 group rounded-[2.5rem] shadow-xl">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-400 group-hover:text-primary transition-all shadow-inner">
                   <Target size={24} />
                </div>
                <div className="min-w-0">
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-1 italic">Mission Target</p>
                   <p className="font-black italic text-slate-900 dark:text-white truncate text-lg tracking-tight uppercase leading-none">{booking.drop_location.split('|||')[0]}</p>
                </div>
             </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-10 pt-4">
             <button 
               onClick={cancelRequest}
               disabled={cancelling}
               className="group flex w-full sm:w-auto items-center justify-center gap-4 sm:gap-6 px-6 sm:px-12 py-5 sm:py-6 rounded-[1.5rem] sm:rounded-[2.5rem] bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 font-black uppercase tracking-[0.3em] text-[10px] hover:bg-red-500 hover:text-white dark:hover:bg-red-500 transition-all shadow-2xl border border-white/5"
             >
               {cancelling ? <Loader2 size={20} className="animate-spin" /> : <X size={20} className="group-hover:rotate-90 transition-transform" />}
               ABORT MISSION REQUEST
             </button>
             
             <div className="flex items-center gap-4">
                <div className="w-4 h-4 rounded-full bg-emerald-500 animate-pulse shadow-glow-emerald"></div>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 italic">Security Protocols Active</span>
             </div>
          </div>
       </div>
    </div>
  );
};

export default WaitingRide;
