import { useState, useEffect, useRef, useCallback, useMemo, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../../services/api';
import { useToast } from '../../context/ToastContextShared';
import { AuthContext } from '../../context/AuthContextValue';
import { MapContainer, TileLayer, Marker, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import useRoadRoute from '../../hooks/useRoadRoute';
import { 
  Navigation, 
  Phone, 
  Star, 
  MessageSquare,
  ShieldCheck,
  LocateFixed,
  Signal,
  Car,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import Chat from '../../components/Chat';

// Custom Marker for Driver
const driverIcon = L.divIcon({
  className: 'custom-driver-marker',
  html: `
    <div class="relative">
      <div class="absolute -inset-6 bg-primary/20 rounded-full animate-ping"></div>
      <div class="relative w-12 h-12 bg-obsidian border-4 border-white rounded-[1rem] flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.6)]">
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#F59E0B" stroke-width="2.5"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9C2.1 11.1 2 11.5 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>
      </div>
    </div>
  `,
  iconSize: [48, 48],
  iconAnchor: [24, 24]
});

// Pickup Marker
const pickupIcon = L.divIcon({
  className: 'custom-pickup-marker',
  html: `
    <div class="relative w-10 h-10 bg-emerald-500 border-4 border-white rounded-full flex items-center justify-center shadow-xl">
      <div class="w-3 h-3 bg-white rounded-full"></div>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

// Destination Marker
const destIcon = L.divIcon({
  className: 'custom-dest-marker',
  html: `
    <div class="relative w-10 h-10 bg-red-500 border-4 border-white rounded-full flex items-center justify-center shadow-xl">
      <div class="w-4 h-4 bg-white rounded-[2px] rotate-45"></div>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

const RecenterMap = ({ position, hasCenteredRef }) => {
  const map = useMap();
  useEffect(() => {
    if (position && !hasCenteredRef.current) {
      map.setView(position, 15, { animate: true });
      hasCenteredRef.current = true;
    }
  }, [position, map, hasCenteredRef]);
  return null;
};

const ActiveRide = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [driverPos, setDriverPos] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useContext(AuthContext);
  const socketRef = useRef(null);
  const chatOpenRef = useRef(false);
  const hasCenteredRef = useRef(false);

  useEffect(() => {
    chatOpenRef.current = chatOpen;
  }, [chatOpen]);

  // Routing Logic
  const waypoints = useMemo(() => {
    if (!ride) return [];
    
    let start = [Number(ride.pickup_lat), Number(ride.pickup_lng)];
    let end = [Number(ride.drop_lat), Number(ride.drop_lng)];

    // Fallback if numeric coords are missing (legacy data)
    if (!ride.pickup_lat || !ride.pickup_lng) {
      const parsed = ride.pickup_location.split(',').map(c => parseFloat(c.trim()));
      if (parsed.length === 2 && !isNaN(parsed[0])) start = parsed;
    }
    if (!ride.drop_lat || !ride.drop_lng) {
      const parsed = ride.drop_location.split(',').map(c => parseFloat(c.trim()));
      if (parsed.length === 2 && !isNaN(parsed[0])) end = parsed;
    }

    return [start, end];
  }, [ride]);
  
  const { routePoints } = useRoadRoute(waypoints);

  const effectiveDriverPos = useMemo(() => {
    if (driverPos) return driverPos;
    if (ride?.driver_lat && ride?.driver_lng) {
      return [Number(ride.driver_lat), Number(ride.driver_lng)];
    }
    return null;
  }, [driverPos, ride]);

  const fetchRideDetails = useCallback(async () => {
    try {
      const res = await api.get('/customer/bookings');
      const active = res.data.bookings.find(b => b.id === parseInt(id));
      if (active) {
        setRide(active);
        if (active.status === 'pending') {
          navigate(`/customer/waiting/${id}`);
        }
      } else {
        addToast("Not Found", "Ride details unavailable.", "error");
        navigate('/dashboard');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id, navigate, addToast]);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchRideDetails();
    });
    
    socketRef.current = io(`http://${window.location.hostname}:5000`, {
       transports: ['websocket', 'polling']
    });
    
    const joinRoom = () => {
      if (socketRef.current) socketRef.current.emit('join_booking', id);
    };

    if (socketRef.current.connected) {
      joinRoom();
    }
    socketRef.current.on('connect', joinRoom);
    
    socketRef.current.on('location_update', (data) => {
      setDriverPos([data.lat, data.lng]);
    });
    
    socketRef.current.on('booking_status_updated', (data) => {
      if (data.status === 'cancelled') {
        addToast("Mission Aborted", "The pilot cancelled the deployment.", "error");
        navigate('/customer/rides');
      } else if (data.status === 'completed') {
        addToast("Mission Accomplished", "You have reached your target.", "success");
        navigate('/customer/rides');
      } else {
        fetchRideDetails();
      }
    });

    socketRef.current.on('new_message', (msg) => {
      console.log('DEBUG: Customer received new_message event:', msg, 'chatOpen:', chatOpenRef.current, 'user.id:', user?.id);
      const isMe = String(msg.senderId || msg.sender_id) === String(user?.id);
      if (!isMe && !chatOpenRef.current) {
        setUnreadCount(prev => prev + 1);
      }
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [id, addToast, navigate, fetchRideDetails, user?.id]);

  const cancelRide = async () => {
    if (!window.confirm('Are you sure you want to abort this mission?')) return;
    setCancelling(true);
    try {
      await api.post('/customer/cancel-ride', { bookingId: id });
      addToast("Mission Aborted", "Ride has been cancelled successfully.", "success");
      navigate('/customer/rides');
    } catch (err) {
      addToast("Error", err.response?.data?.message || "Failed to cancel", "error");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] font-display">
      <div className="relative mb-8">
         <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
         <Signal className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary" size={24} />
      </div>
      <p className="text-xs font-black uppercase tracking-[0.4em] text-slate-500 animate-pulse italic">Syncing Telemetry...</p>
    </div>
  );

  if (!ride) return null;

  return (
    <div className="relative h-[calc(100vh-64px)] sm:h-[calc(100vh-80px)] w-full overflow-hidden animate-fade-in font-display">
      
      {/* FULL SCREEN MAP BACKGROUND */}
      <div className="absolute inset-0 z-0">
            <MapContainer 
              center={effectiveDriverPos || (ride ? [Number(ride.pickup_lat), Number(ride.pickup_lng)] : [34.0837, 74.7973])} 
              zoom={15} 
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
            >
              <TileLayer 
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              
              {/* Route Line */}
              {routePoints.length > 0 && (
                <Polyline 
                  positions={routePoints} 
                  color="#06b6d4" 
                  weight={6} 
                  opacity={0.8} 
                  dashArray="10, 15"
                  lineJoin="round"
                />
              )}

              {/* Waypoint Markers */}
              {ride && (
                <>
                  <Marker position={[Number(ride.pickup_lat), Number(ride.pickup_lng)]} icon={pickupIcon} />
                  <Marker position={[Number(ride.drop_lat), Number(ride.drop_lng)]} icon={destIcon} />
                </>
              )}

              {effectiveDriverPos && <Marker position={effectiveDriverPos} icon={driverIcon} />}
              <RecenterMap position={effectiveDriverPos} hasCenteredRef={hasCenteredRef} />
            </MapContainer>
      </div>

      {/* FLOATING RECENTER RADAR BUBBLE (BELOW CHAT BUBBLE) */}
      <div className="absolute top-[10.5rem] right-3 sm:top-28 sm:right-8 z-[9999]">
        <button 
          onClick={() => {
            hasCenteredRef.current = false;
            setDriverPos(prev => prev ? [...prev] : null);
          }}
          className="w-16 h-16 bg-white dark:bg-obsidian rounded-3xl border-2 border-white/20 shadow-2xl flex items-center justify-center text-slate-600 dark:text-white hover:bg-primary hover:text-obsidian transition-all hover:scale-110 active:scale-95 group"
          title="Recenter Radar"
        >
           <LocateFixed size={24} className="group-hover:rotate-12 transition-transform" />
        </button>
      </div>

      {/* TOP FLOATING STATUS BAR */}
      <div className="absolute top-4 sm:top-8 left-1/2 -translate-x-1/2 z-10 w-[calc(100%-1.5rem)] sm:w-[90%] max-w-lg">
        <div className="card-modern p-3 sm:p-4 bg-white/90 dark:bg-obsidian/90 backdrop-blur-xl border-white/20 rounded-[1.5rem] sm:rounded-[2rem] shadow-2xl flex items-center gap-3 sm:gap-6">
           <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shrink-0 animate-pulse">
              <Navigation size={24} />
           </div>
           <div className="min-w-0 flex-1">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 mb-0.5 italic">
                {ride.status === 'started' ? 'MISSION IN TRANSIT' : 'EN ROUTE TO PICKUP'}
              </p>
              <h4 className="text-lg font-black uppercase italic tracking-tighter text-slate-900 dark:text-white truncate">
                {ride.driver_name}
              </h4>
           </div>
           {ride.status !== 'started' && (
             <div className="px-4 py-2 bg-slate-900 dark:bg-primary rounded-xl flex flex-col items-center justify-center shadow-lg shrink-0">
                <span className="text-[8px] font-black uppercase tracking-widest text-white/40 dark:text-obsidian/40 leading-none mb-1">SECURE OTP</span>
                <span className="text-xl font-display font-black tracking-widest text-primary dark:text-obsidian leading-none">{ride.ride_otp || '----'}</span>
             </div>
           )}
        </div>
      </div>

      {/* FLOATING CHAT BUBBLE (TOP RIGHT) */}
      <div className="absolute top-24 right-3 sm:top-8 sm:right-8 z-[9999]">
        <button 
          onClick={() => { setChatOpen(true); setUnreadCount(0); }}
          className="w-16 h-16 bg-white dark:bg-obsidian rounded-3xl border-2 border-white/20 shadow-2xl flex items-center justify-center text-slate-600 dark:text-white hover:bg-primary hover:text-obsidian transition-all hover:scale-110 active:scale-95 group relative"
        >
           <MessageSquare size={24} className="group-hover:rotate-12 transition-transform" />
           {unreadCount > 0 && (
             <span className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white text-[11px] font-black rounded-full flex items-center justify-center border-4 border-white dark:border-obsidian animate-bounce shadow-lg">
               {unreadCount}
             </span>
           )}
        </button>
      </div>

      {/* CHAT WINDOW */}
      {chatOpen && (
        <Chat 
          bookingId={id}
          receiverName={ride.driver_name}
          receiverPhone={ride.driver_phone}
          socketRef={socketRef}
          onClose={() => setChatOpen(false)}
        />
      )}

      {/* BOTTOM CONTROL CARD */}
      <div className={`absolute bottom-0 left-0 right-0 z-20 transition-all duration-700 ease-in-out px-2 sm:px-8 pb-4 sm:pb-8 ${isMinimized ? 'translate-y-[80%]' : 'translate-y-0'}`}>
         <div className="max-w-5xl mx-auto">
            {/* MINIMIZE TOGGLE */}
            <div className="flex justify-center mb-[-20px] relative z-30">
               <button 
                 onClick={() => setIsMinimized(!isMinimized)}
                 className="w-14 h-10 bg-primary rounded-t-2xl flex items-center justify-center text-obsidian shadow-glow-saffron hover:h-12 transition-all group"
               >
                  {isMinimized ? <ChevronUp size={24} className="animate-bounce" /> : <ChevronDown size={24} />}
                  <span className="absolute -top-8 bg-obsidian text-white text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    {isMinimized ? 'RESTORE' : 'HIDE'}
                  </span>
               </button>
            </div>

            <div className="card-modern bg-white/95 dark:bg-obsidian/95 backdrop-blur-2xl border-2 border-white/20 rounded-[2rem] sm:rounded-[3.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden">
               {/* Main Card Content */}
               <div className="p-5 sm:p-12">
                  <div className="flex flex-col lg:flex-row items-start sm:items-center gap-6 sm:gap-10">
                     {/* Driver Profile */}
                     <div className="flex items-center gap-5 sm:gap-8 flex-1 w-full">
                        <div className="relative shrink-0">
                           <div className="w-20 h-20 sm:w-32 sm:h-32 bg-slate-100 dark:bg-white/5 rounded-[2rem] sm:rounded-[2.5rem] border-4 border-primary/20 overflow-hidden shadow-2xl group">
                              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${ride.driver_name}`} alt="Pilot" className="w-full h-full scale-110 group-hover:scale-125 transition-transform duration-500" />
                           </div>
                           <div className="absolute -bottom-2 -right-2 bg-primary text-obsidian p-2.5 rounded-2xl shadow-glow-saffron border-4 border-white dark:border-obsidian">
                              <ShieldCheck size={20} fill="currentColor" />
                           </div>
                        </div>
                        <div className="min-w-0">
                           <div className="flex flex-wrap items-center gap-3 mb-3">
                              <h3 className="text-2xl sm:text-4xl font-display font-black uppercase italic tracking-tighter text-slate-900 dark:text-white truncate">{ride.driver_name}</h3>
                              <div className="flex gap-2">
                                 <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[9px] font-black uppercase tracking-widest rounded-full italic">TOP RATED</span>
                                 <span className="px-3 py-1 bg-primary/10 border border-primary/20 text-primary text-[9px] font-black uppercase tracking-widest rounded-full italic">VERIFIED PILOT</span>
                              </div>
                           </div>
                           <div className="flex flex-wrap items-center gap-3 sm:gap-6">
                              <div className="flex items-center gap-2">
                                 <Star size={14} className="text-primary" fill="currentColor" />
                                 <span className="text-sm font-black text-slate-600 dark:text-slate-300">5.0</span>
                              </div>
                              <div className="flex items-center gap-2">
                                 <Car size={14} className="text-slate-400" />
                                 <span className="text-sm font-black text-slate-600 dark:text-slate-300 uppercase tracking-tight">{ride.vehicle_model} • {ride.vehicle_number}</span>
                              </div>
                           </div>
                        </div>
                     </div>

                     {/* Actions */}
                     <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                        <a 
                          href={`tel:${ride.driver_phone}`} 
                          className="w-full sm:w-auto px-10 h-20 bg-slate-100 dark:bg-white/5 hover:bg-primary hover:text-obsidian rounded-[1.8rem] border border-slate-200 dark:border-white/10 flex items-center justify-center gap-4 transition-all group/btn shadow-xl"
                        >
                           <Phone size={20} className="group-hover:rotate-12 transition-transform" />
                           <span className="text-[11px] font-black uppercase tracking-[0.3em]">CALL PILOT</span>
                        </a>
                        <div className="w-full sm:w-auto px-10 h-20 bg-gradient-to-br from-primary to-saffron-light rounded-[1.8rem] flex flex-col items-center justify-center shadow-glow-saffron shrink-0">
                           <span className="text-[9px] font-black uppercase tracking-[0.2em] text-obsidian/40 leading-none mb-1">ESTIMATED FARE</span>
                           <span className="text-3xl font-display font-black italic text-obsidian leading-none">₹{ride.fare}</span>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Card Footer Metrics */}
               <div className="bg-slate-50/50 dark:bg-white/5 border-t border-slate-100 dark:border-white/5 p-5 sm:px-12 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-xl bg-white dark:bg-white/5 flex items-center justify-center text-slate-400 shadow-sm border border-white/10">
                        <LocateFixed size={20} />
                     </div>
                     <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 mb-0.5 italic">EST. WAIT TIME</p>
                        <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">~4 MINUTES</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-xl bg-white dark:bg-white/5 flex items-center justify-center text-primary shadow-sm border border-white/10">
                        <ShieldCheck size={20} />
                     </div>
                     <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 mb-0.5 italic">SECURITY PROTOCOL</p>
                        <p className="text-sm font-black text-emerald-500 uppercase tracking-tight italic">ENCRYPTED PATH ACTIVE</p>
                     </div>
                  </div>
                  <button 
                    onClick={cancelRide}
                    disabled={cancelling || ride.status === 'started'}
                    className="px-8 py-3 text-[10px] font-black uppercase tracking-[0.3em] text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all disabled:opacity-30 disabled:grayscale"
                  >
                    ABORT MISSION
                  </button>
               </div>
            </div>
         </div>
      </div>

    </div>
  );
};

export default ActiveRide;
