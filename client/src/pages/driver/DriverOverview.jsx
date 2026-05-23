import { useState, useEffect, useContext, useCallback, useRef, useMemo } from 'react';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContextValue';
import { 
  TrendingUp, Navigation, Star, MapPin, 
  CheckCircle, Zap, History,
  Truck, AlertCircle, Loader2, Phone,
  MessageSquare, X, Clock, 
  ShieldCheck, Activity, User, Map, Target,
  ChevronRight, Shield
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Skeleton from '../../components/Skeleton';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { io } from 'socket.io-client';
import useRoadRoute from '../../hooks/useRoadRoute';
import Chat from '../../components/Chat';

// Premium custom markers
const PICKUP_ICON = L.divIcon({
  className: 'km-pickup-marker',
  html: `<div style="width:36px;height:36px;background:#10b981;border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 4px 15px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
           <div style="transform:rotate(45deg);width:10px;height:10px;background:white;border-radius:50%"></div>
         </div>`,
  iconSize: [36, 36],
  iconAnchor: [14, 36]
});

const DESTINATION_ICON = L.divIcon({
  className: 'km-dest-marker',
  html: `<div style="position:relative;">
           <div style="width:36px;height:36px;background:#ef4444;border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 4px 15px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
             <div style="transform:rotate(45deg);">
               <svg viewBox='0 0 24 24' width='14' height='14' fill='white'><path d='M14 6l-1-2H5v17h2v-7h5l1 2h7V6h-6z'/></svg>
             </div>
           </div>
         </div>`,
  iconSize: [36, 36],
  iconAnchor: [14, 36]
});

const makeStopIcon = (num) => L.divIcon({
  className: 'km-stop-marker',
  html: `<div style="width:28px;height:28px;background:#f59e0b;border:3px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;color:white;box-shadow:0 3px 12px rgba(0,0,0,0.25);font-family:sans-serif">${num}</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14]
});

const MapAutoCenter = ({ driverPos, pickup, recenterTrigger }) => {
  const map = useMap();
  const hasCentered = useRef(false);

  useEffect(() => {
    // Initial centering
    if (driverPos && !hasCentered.current) {
      map.setView(driverPos, 15);
      hasCentered.current = true;
    } else if (pickup && !driverPos && !hasCentered.current) {
      map.setView(pickup, 13);
      hasCentered.current = true;
    }
  }, [driverPos, pickup, map]);

  // Manual recenter trigger
  useEffect(() => {
    if (recenterTrigger > 0 && driverPos) {
      map.setView(driverPos, 15, { animate: true });
    }
  }, [recenterTrigger, driverPos, map]);

  return null;
};

const KASHMIR_DISTRICTS = [
  'Srinagar', 'Budgam', 'Ganderbal', 'Bandipora',
  'Baramulla', 'Kupwara', 'Anantnag', 'Kulgam',
  'Pulwama', 'Shopian'
];

const DriverOverview = () => {
  const { refreshTrigger, triggerRefresh, user } = useContext(AuthContext);
  const [driverStats, setDriverStats] = useState(null);
  const [activeRide, setActiveRide] = useState(null);
  const [upcomingRides, setUpcomingRides] = useState([]);
  const [online, setOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState('');
  const [area, setArea] = useState('Srinagar');
  const [areaUpdating, setAreaUpdating] = useState(false);
  const [areaSuccess, setAreaSuccess] = useState(false);
  const [driverPos, setDriverPos] = useState(null);
  const [recenterTrigger, setRecenterTrigger] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [systemNotifications, setSystemNotifications] = useState([]);
  const socketRef = useRef(null);
  const chatOpenRef = useRef(false);
  const lastSavedTime = useRef(0);

  useEffect(() => {
    chatOpenRef.current = chatOpen;
  }, [chatOpen]);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('/driver/notifications');
      if (res.data.success) {
        setSystemNotifications(res.data.notifications);
      }
    } catch (err) {
      console.error('Notification error:', err);
    }
  }, []);

  useEffect(() => {
    // Defer initial fetch to avoid cascading render warning
    const t = setTimeout(() => {
      fetchNotifications();
    }, 0);
    const interval = setInterval(fetchNotifications, 5000); // Poll every 5s
    return () => {
      clearTimeout(t);
      clearInterval(interval);
    };
  }, [fetchNotifications]);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await api.get('/driver/profile');
      setDriverStats(res.data.driver);
      setOnline(res.data.driver.is_online ? true : false);
      setArea(res.data.driver.area || 'Srinagar');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchActiveRide = useCallback(async () => {
    try {
      const res = await api.get('/driver/bookings');
      if (res.data.success) {
        const bookings = res.data.bookings || [];
        
        // Priority selection:
        // 1. Started trips
        // 2. Accepted immediate trips (no scheduled_at)
        // 3. Accepted scheduled trips (sorted by time)
        
        const started = bookings.find(b => b.status === 'started');
        let selected = null;
        let queue = [];

        if (started) {
          selected = started;
          queue = bookings.filter(b => b.status === 'accepted');
        } else {
          const immediate = bookings.find(b => b.status === 'accepted' && !b.scheduled_at);
          if (immediate) {
            selected = immediate;
            queue = bookings.filter(b => b.status === 'accepted' && b.id !== immediate.id);
          } else {
            const scheduled = bookings
              .filter(b => b.status === 'accepted' && b.scheduled_at)
              .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
            
            if (scheduled.length > 0) {
              selected = scheduled[0];
              queue = scheduled.slice(1);
            }
          }
        }

        if (selected) {
          setActiveRide(selected);
          setUpcomingRides(queue);
          
          if (socketRef.current) socketRef.current.emit('join_booking', selected.id);
        } else {
          setActiveRide(null);
          setUpcomingRides([]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch active ride:', err);
    }
  }, []);

  const handleAcknowledge = async (noteId) => {
    try {
      await api.put(`/driver/notifications/${noteId}/read`);
      setSystemNotifications(prev => prev.filter(n => n.id !== noteId));
    } catch (err) {
      console.error('Failed to acknowledge notification:', err);
    }
  };

  const isInitialMount = useRef(true);

  useEffect(() => {
    const initFetch = async () => {
      await Promise.all([fetchProfile(), fetchActiveRide()]);
    };

    // Defer update to avoid cascading render warning
    Promise.resolve().then(() => {
      initFetch();
    });
    
    isInitialMount.current = false;
  }, [refreshTrigger, fetchProfile, fetchActiveRide]);

  // Stable Socket Connection Setup (Runs once on mount)
  useEffect(() => {
    socketRef.current = io(`http://${window.location.hostname}:5000`);
    
    socketRef.current.on('connect', () => {
      console.log('DEBUG: Socket connected successfully');
    });

    socketRef.current.on('new_ride_request', () => {
      triggerRefresh();
    });

    socketRef.current.on('new_message', (msg) => {
      console.log('DEBUG: Driver received new_message event:', msg, 'chatOpen:', chatOpenRef.current, 'user.id:', user?.id);
      const isMe = String(msg.senderId || msg.sender_id) === String(user?.id);
      if (!isMe && !chatOpenRef.current) {
        setUnreadCount(prev => prev + 1);
      }
    });

    socketRef.current.on('booking_status_updated', () => {
      triggerRefresh();
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [triggerRefresh, user?.id]);

  // Join/re-join booking room dynamically when activeRide ID changes or socket reconnects
  useEffect(() => {
    if (!activeRide?.id || !socketRef.current) return;

    const joinRoom = () => {
      console.log('DEBUG: Emitting join_booking for room:', activeRide.id);
      socketRef.current.emit('join_booking', activeRide.id);
    };

    // Join immediately if connected
    if (socketRef.current.connected) {
      joinRoom();
    }

    // Register connect listener to re-join on reconnects
    socketRef.current.on('connect', joinRoom);

    return () => {
      if (socketRef.current) {
        socketRef.current.off('connect', joinRoom);
      }
    };
  }, [activeRide?.id]);

  // Real-time Driver Location Tracking & Emission
  useEffect(() => {
    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setDriverPos([lat, lng]);
          
          // Save to database (throttled to once every 15 seconds)
          const now = Date.now();
          if (now - lastSavedTime.current > 15000) {
            lastSavedTime.current = now;
            api.put('/driver/location', { lat, lng })
              .catch(err => console.error("Failed to save live location to DB:", err));
          }

          // Emit to customer if active ride exists
          if (activeRide && socketRef.current && socketRef.current.connected) {
            socketRef.current.emit('update_location', {
              bookingId: activeRide.id,
              lat,
              lng
            });
          }
        },
        (error) => console.error("Geolocation error:", error),
        { enableHighAccuracy: true, maximumAge: 10000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [activeRide]);

  const parseCoords = (loc) => {
    if (!loc || !loc.includes('|||')) return null;
    try {
      const coordsStr = loc.split('|||')[1].trim();
      const parts = coordsStr.split(',').map(n => parseFloat(n.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return [parts[0], parts[1]];
      }
      return null;
    } catch {
      return null;
    }
  };

  const calculateDistance = (p1, p2) => {
    if (!p1 || !p2) return null;
    const R = 6371; // km
    const dLat = (p2[0] - p1[0]) * Math.PI / 180;
    const dLon = (p2[1] - p1[1]) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(p1[0] * Math.PI / 180) * Math.cos(p2[0] * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (R * c).toFixed(1);
  };

  const getCleanName = (loc) => {
    if (!loc) return 'Unknown';
    if (loc.includes('|||')) return loc.split('|||')[0].trim();
    return loc;
  };

  const startRide = async () => {
    if (!activeRide || otpValue.length !== 4) return;
    setVerifyingOtp(true);
    setError('');
    try {
      const res = await api.post('/driver/start-ride', { 
        bookingId: activeRide.id, 
        otp: otpValue 
      });
      if (res.data.success) {
        setOtpValue('');
        triggerRefresh();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const cancelRide = async () => {
    if (!activeRide || !window.confirm('Are you sure you want to cancel this ride?')) return;
    setCancelling(true);
    try {
      await api.post('/driver/cancel-ride', { bookingId: activeRide.id });
      triggerRefresh();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel');
    } finally {
      setCancelling(false);
    }
  };

  const completeRide = async () => {
    if (!activeRide) return;
    setCompleting(true);
    try {
      await api.put('/driver/booking-status', { bookingId: activeRide.id, status: 'completed' });
      setActiveRide(null);
      triggerRefresh();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete ride');
    } finally {
      setCompleting(false);
    }
  };

  const toggleStatus = async () => {
    try {
      const res = await api.put('/driver/status', { isOnline: !online });
      setOnline(res.data.isOnline);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const updateArea = async (newArea) => {
    setAreaUpdating(true);
    setAreaSuccess(false);
    try {
      await api.put('/driver/location', { area: newArea });
      setArea(newArea);
      setAreaSuccess(true);
      setTimeout(() => setAreaSuccess(false), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update area');
    } finally {
      setAreaUpdating(false);
    }
  };

  // Use numeric columns if available, fallback to legacy string parsing
  const pickup = useMemo(() => {
    if (!activeRide) return null;
    if (activeRide.pickup_lat && activeRide.pickup_lng) {
      return [Number(activeRide.pickup_lat), Number(activeRide.pickup_lng)];
    }
    return parseCoords(activeRide.pickup_location);
  }, [activeRide]);

  const destination = useMemo(() => {
    if (!activeRide) return null;
    if (activeRide.drop_lat && activeRide.drop_lng) {
      return [Number(activeRide.drop_lat), Number(activeRide.drop_lng)];
    }
    return parseCoords(activeRide.drop_location);
  }, [activeRide]);

  const intermediateStops = activeRide?.stops ? (typeof activeRide.stops === 'string' ? JSON.parse(activeRide.stops) : activeRide.stops) : [];
  const stopPoints = intermediateStops.map(s => parseCoords(s)).filter(p => p !== null);

  // Pre-compute stable string keys so useMemo deps are simple expressions
  const pickupKey = pickup ? pickup.join(',') : '';
  const destinationKey = destination ? destination.join(',') : '';
  const stopsKey = stopPoints.map(p => p.join(',')).join('|');

  const allWaypoints = useMemo(() => {
    if (!pickup || !destination) return [];
    return [pickup, ...stopPoints, destination];
  }, [pickupKey, destinationKey, stopsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const { routePoints, distanceKm, durationMin } = useRoadRoute(allWaypoints);

  const effectiveDriverPos = useMemo(() => {
    if (driverPos) return driverPos;
    if (driverStats?.current_lat && driverStats?.current_lng) {
      return [Number(driverStats.current_lat), Number(driverStats.current_lng)];
    }
    if (pickup) {
      return [pickup[0] + 0.005, pickup[1] + 0.005]; // Simulated fallback near pickup in dev
    }
    return [34.0837, 74.7973]; // Srinagar center fallback
  }, [driverPos, driverStats, pickup]);

  const distToPickup = (effectiveDriverPos && pickup) ? calculateDistance(effectiveDriverPos, pickup) : null;

  // Emit location updates dynamically when effectiveDriverPos changes (including fallbacks)
  useEffect(() => {
    if (activeRide && effectiveDriverPos && socketRef.current) {
      console.log('DEBUG: Emitting live location update:', effectiveDriverPos);
      socketRef.current.emit('update_location', {
        bookingId: activeRide.id,
        lat: effectiveDriverPos[0],
        lng: effectiveDriverPos[1]
      });
    }
  }, [activeRide, effectiveDriverPos]);

  const isScheduledInFuture = activeRide?.scheduled_at && new Date(activeRide.scheduled_at) > new Date();

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-20">
        <div className="w-16 h-16 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-full animate-spin" style={{animationDuration: '2s'}}></div>
          <div className="absolute inset-1 bg-white dark:bg-obsidian rounded-full"></div>
        </div>
        <p className="font-display font-bold text-slate-500 uppercase tracking-widest text-xs">Loading Driver Console</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-fade-in pb-12">
      
      {/* System Command Notifications */}
      {systemNotifications.length > 0 && (
        <div className="mb-8 space-y-4">
          {systemNotifications.map((note) => (
            <div key={note.id} className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-saffron-light rounded-[32px] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
              <div className="relative p-6 sm:p-8 bg-white dark:bg-obsidian-card rounded-[32px] border-2 border-primary/20 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0">
                    <Zap size={32} className="animate-bounce" />
                  </div>
                  <div>
                    <h4 className="text-xl font-display font-black italic uppercase tracking-tighter text-primary">Priority Admin Command</h4>
                    <p className="text-lg font-bold mt-1 text-slate-700 dark:text-white leading-relaxed">{note.message}</p>
                    <p className="text-[10px] font-black uppercase text-slate-400 mt-2 tracking-widest">{new Date(note.created_at).toLocaleTimeString()}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleAcknowledge(note.id)}
                  className="px-8 py-3 bg-primary text-white rounded-xl font-black uppercase tracking-widest text-[11px] hover:scale-105 active:scale-95 transition-all shadow-glow-saffron"
                >
                  Acknowledge
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Profile Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 lg:gap-10 px-4 sm:px-0 pt-6">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
             <div className="w-12 h-1 bg-primary rounded-full"></div>
             <span className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-500">Fleet ID: {driverStats?.id || 'ALPHA-01'}</span>
          </div>
          <h2 className="text-4xl sm:text-7xl font-display font-black italic uppercase leading-[0.9] sm:leading-[0.85] tracking-tighter text-slate-900 dark:text-white">
            PILOT <span className="text-primary">CONSOLE</span>
          </h2>
          <div className="flex items-center gap-3 py-2">
             <div className={`w-2 h-2 rounded-full ${online ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse' : 'bg-red-500'}`}></div>
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
               {online ? 'Uplink Established' : 'Network Disconnected'}
             </span>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          {upcomingRides.length > 0 && (
            <div className="flex items-center gap-4 bg-primary/5 px-8 py-4 rounded-3xl border border-primary/20">
               <Activity size={20} className="text-primary animate-pulse" />
               <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-primary/60 leading-none mb-1.5">Mission Queue</p>
                  <p className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">{upcomingRides.length} PENDING DUTIES</p>
               </div>
            </div>
          )}
          <button 
            onClick={toggleStatus}
            className={`min-h-16 sm:h-20 px-6 sm:px-12 rounded-[1.5rem] sm:rounded-[2rem] text-xs sm:text-sm font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-4 shadow-2xl ${
              online 
                ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white' 
                : 'bg-primary text-obsidian shadow-glow-saffron'
            }`}
          >
            {online ? 'TERMINATE UPLINK' : 'INITIALIZE NETWORK'}
            <Zap className={`w-5 h-5 ${online ? '' : 'animate-pulse'}`} fill="currentColor" />
          </button>
        </div>
      </div>

      {/* ===== ACTIVE TRIP BANNER & MAP ===== */}
      {activeRide && (
        <div className="space-y-8 animate-fade-in px-4 sm:px-0">
          <div className="relative overflow-hidden rounded-[2rem] sm:rounded-[3rem] bg-gradient-to-br from-slate-900 via-obsidian to-slate-900 text-white p-5 sm:p-12 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-white/10">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-electric-cyan/5 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-10 relative z-10">
              {/* Pilot Icon Node */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 shadow-2xl">
                <User className="w-10 h-10 text-primary" />
              </div>

              {/* Mission Intelligence */}
              <div className="flex-1 min-w-0 w-full space-y-6">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-2 h-2 rounded-full ${
                      activeRide.status === 'started' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse' : 
                      isScheduledInFuture ? 'bg-amber-500' : 'bg-electric-cyan animate-pulse'
                    }`} />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
                      {activeRide.status === 'started' ? 'MISSION IN PROGRESS' : 
                       isScheduledInFuture ? 'UPCOMING APPOINTMENT' : 'EN ROUTE TO ORIGIN'}
                    </span>
                  </div>
                  <h3 className="font-display font-black italic uppercase text-2xl sm:text-4xl tracking-tighter leading-none mb-4">
                    {activeRide.customer_name || 'IDENTIFIED UNIT'}
                  </h3>
                  {activeRide.customer_phone && (
                    <a 
                      href={`tel:${activeRide.customer_phone}`} 
                      className="inline-flex items-center gap-3 px-6 py-2.5 bg-white/5 hover:bg-primary hover:text-obsidian rounded-2xl border border-white/10 transition-all text-xs font-black uppercase tracking-widest"
                    >
                      <Phone size={14} fill="currentColor" />
                      SECURE COMMS: {activeRide.customer_phone}
                    </a>
                  )}
                </div>
                
                {/* Tactical Chain */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-white/5">
                  <div className="flex items-start gap-4 group/loc">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 text-white/40 group-hover/loc:text-primary transition-colors">
                      <MapPin size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 mb-1">Origin Node</p>
                      <p className="text-sm font-bold text-white/70 truncate leading-snug">
                        {getCleanName(activeRide.pickup_location)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 group/loc">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                      <Target size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 mb-1">Target Node</p>
                      <p className="text-sm font-bold text-white truncate leading-snug">
                        {getCleanName(activeRide.drop_location)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Allotment + Command Actions */}
              <div className="flex flex-col items-stretch lg:items-end justify-between w-full lg:w-72 gap-8 pt-8 lg:pt-0 lg:pl-10 lg:border-l border-white/5">
                <div className="text-center lg:text-right w-full">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 mb-3 italic">Operational Allotment</p>
                  <p className="text-5xl sm:text-6xl font-display font-black italic tracking-tighter text-white leading-none">₹{Math.round(activeRide.fare)}</p>
                </div>
                
                <div className="flex flex-wrap lg:flex-col gap-3 w-full">
                  <div className="flex gap-2 flex-1">
                    <button
                      onClick={() => { setChatOpen(true); setUnreadCount(0); }}
                      className="flex-1 h-16 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all flex items-center justify-center relative group"
                    >
                      <MessageSquare size={20} className="group-hover:scale-110 transition-transform" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white text-[11px] font-black rounded-full flex items-center justify-center border-2 border-obsidian shadow-glow-red/50 shadow-lg z-20 animate-bounce">
                          {unreadCount}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        if (pickup && destination) {
                          const stopList = stopPoints.map(p => `${p[0]},${p[1]}`).join('/');
                          const url = stopPoints.length > 0 
                            ? `https://www.google.com/maps/dir/${pickup[0]},${pickup[1]}/${stopList}/${destination[0]},${destination[1]}`
                            : `https://www.google.com/maps/dir/?api=1&origin=${pickup[0]},${pickup[1]}&destination=${destination[0]},${destination[1]}&travelmode=driving`;
                          window.open(url, '_blank');
                        }
                      }}
                      className="flex-[2] h-16 bg-white/5 hover:bg-primary hover:text-obsidian rounded-2xl border border-white/10 transition-all flex items-center justify-center gap-3 font-black uppercase text-xs tracking-widest"
                    >
                      <Navigation size={18} /> NAVIGATE
                    </button>
                  </div>

                  {activeRide.status === 'started' ? (
                    <button
                      onClick={completeRide}
                      disabled={completing}
                      className="w-full h-16 bg-emerald-500 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                      {completing ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                      FINALIZE MISSION
                    </button>
                  ) : isScheduledInFuture ? (
                    <div className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-3 opacity-50 cursor-not-allowed">
                       <Clock size={18} className="text-amber-500" />
                       <span className="text-xs font-black uppercase tracking-widest">SCHEDULE LOCK</span>
                    </div>
                  ) : (
                    <div className="w-full space-y-3">
                       <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-2">
                          <div className="flex-1 h-16 bg-white/5 border border-white/20 rounded-2xl px-4 flex items-center justify-center group-focus-within:border-primary transition-colors">
                             <Shield size={18} className="text-primary mr-3" />
                             <input 
                               type="text" 
                               maxLength="4"
                               placeholder="OTP CODE"
                               value={otpValue}
                               onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                               className="bg-transparent text-white outline-none w-20 text-center font-black tracking-[0.4em] text-lg placeholder:text-[10px] placeholder:tracking-widest placeholder:text-white/20"
                             />
                          </div>
                          <button
                            onClick={startRide}
                            disabled={verifyingOtp || otpValue.length !== 4}
                            className="flex-[1.5] h-16 bg-primary text-obsidian rounded-2xl font-black uppercase text-xs tracking-widest shadow-glow-saffron hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                          >
                            {verifyingOtp ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} fill="currentColor" />}
                            START MISSION
                          </button>
                       </div>
                       <button
                         onClick={cancelRide}
                         disabled={cancelling}
                         className="w-full py-3 text-red-400 hover:text-white hover:bg-red-500/20 rounded-xl transition-all font-black uppercase text-[10px] tracking-[0.3em] flex items-center justify-center gap-2"
                       >
                         {cancelling ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                         ABORT DEPLOYMENT
                       </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* Real-time Map View */}
          <div className="relative rounded-[2.5rem] overflow-hidden h-[360px] sm:h-[600px] bg-obsidian shadow-2xl border-none">
            <MapContainer 
              key={activeRide.id}
              center={effectiveDriverPos || pickup || [34.0837, 74.7973]} 
              zoom={14} 
              style={{ height: '100%', width: '100%', borderRadius: '2.5rem' }}
              zoomControl={false}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                maxZoom={20}
              />
              
              {pickup && <Marker position={pickup} icon={PICKUP_ICON} />}
              {stopPoints.map((coords, idx) => (
                <Marker key={idx} position={coords} icon={makeStopIcon(idx + 1)} />
              ))}
              {destination && <Marker position={destination} icon={DESTINATION_ICON} />}

              {effectiveDriverPos && (
                <Marker 
                  position={effectiveDriverPos} 
                  icon={L.divIcon({
                    className: 'driver-icon-container',
                    html: `<div style="width:40px;height:40px;background:#f59e0b;border:4px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 0 30px rgba(245,158,11,0.4);position:relative;">
                            <div style="position:absolute;width:60px;height:60px;background:rgba(245,158,11,0.2);border-radius:50%;animation:driver-pulse 2s ease-out infinite;"></div>
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="white"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.27-3.66c.08-.22.28-.34.5-.34h10.46c.22 0 .42.12.5.34L19 11H5z"/></svg>
                          </div>`,
                    iconSize: [40, 40],
                    iconAnchor: [20, 20]
                  })}
                />
              )}
              
              {routePoints.length >= 2 && (
                <>
                  <Polyline positions={routePoints} color="#f59e0b" weight={6} opacity={0.8} dashArray="10, 10" />
                  <MapAutoCenter driverPos={effectiveDriverPos} pickup={pickup} recenterTrigger={recenterTrigger} />
                </>
              )}
            </MapContainer>
            
            {/* Top Telemetry Strip (Responsive Overlay) */}
            <div className="absolute top-0 left-0 right-0 sm:top-8 sm:left-8 sm:right-auto z-[1000] w-full sm:w-auto">
              <div className="bg-obsidian/90 backdrop-blur-xl p-3 sm:p-6 rounded-none sm:rounded-3xl border-b sm:border border-white/10 shadow-2xl sm:min-w-[240px] pointer-events-none w-full">
                 <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-2 sm:mb-4 italic text-center sm:text-left">Operational Telemetry</p>
                 <div className="flex flex-row sm:flex-col justify-around sm:justify-start items-center sm:items-stretch gap-4 sm:space-y-4 w-full">
                   <div className="flex flex-col sm:flex-row sm:items-center justify-between text-center sm:text-left">
                     <span className="text-[8px] sm:text-[10px] font-bold text-white/40 uppercase tracking-widest block sm:inline">Pilot to Origin</span>
                     <span className="text-xs sm:text-sm font-black text-white italic block sm:mt-0 mt-0.5">{distToPickup ? `${distToPickup} KM` : 'SCANNING...'}</span>
                   </div>
                   <div className="hidden sm:block h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                     <div className="h-full bg-primary w-2/3 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                   </div>
                   {distanceKm && (
                     <div className="flex flex-col sm:flex-row sm:items-center justify-between text-center sm:text-left sm:pt-2 sm:border-t sm:border-white/5">
                       <span className="text-[8px] sm:text-[10px] font-bold text-white/40 uppercase tracking-widest block sm:inline">Route Total</span>
                       <span className="text-xs sm:text-sm font-black text-electric-cyan italic block sm:mt-0 mt-0.5">{distanceKm} KM</span>
                     </div>
                   )}
                   {durationMin && (
                     <div className="flex flex-col sm:flex-row sm:items-center justify-between text-center sm:text-left">
                       <span className="text-[8px] sm:text-[10px] font-bold text-white/40 uppercase tracking-widest block sm:inline">Est. Deployment</span>
                       <span className="text-xs sm:text-sm font-black text-primary italic block sm:mt-0 mt-0.5">~{durationMin} MIN</span>
                     </div>
                   )}
                 </div>
              </div>
            </div>

            {/* Recenter Radar Floating GPS Button */}
            <button 
              onClick={() => setRecenterTrigger(prev => prev + 1)}
              className="absolute bottom-4 right-4 z-[1000] bg-primary text-obsidian w-12 h-12 rounded-full shadow-glow-saffron hover:scale-105 active:scale-95 transition-all flex items-center justify-center group"
              title="Recenter Radar"
            >
              <Navigation size={18} className="group-hover:rotate-12 transition-transform" />
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mx-4 sm:mx-0 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl font-bold flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4 sm:px-0">
        <div className="card-modern relative overflow-hidden group hover:border-primary/50 transition-all bg-white dark:bg-white/5">
          <div className="absolute -right-6 -top-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
            <Activity size={160} className="rotate-12" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-6 italic">Today's Allotment</p>
          <div className="flex items-baseline gap-2">
            {loading ? <Skeleton width="120px" height="3rem" /> : <span className="text-4xl sm:text-6xl font-display font-black italic tracking-tighter text-slate-900 dark:text-white leading-none">₹{driverStats?.today_earnings || 0}</span>}
          </div>
          <div className="mt-8 flex items-center gap-3">
             <div className="px-3 py-1 bg-emerald-500/10 rounded-full flex items-center gap-2">
                <TrendingUp size={12} className="text-emerald-500" />
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">+24.8%</span>
             </div>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">from last session</p>
          </div>
        </div>

        <div className="card-modern relative overflow-hidden group hover:border-primary/50 transition-all bg-white dark:bg-white/5">
          <div className="absolute -right-6 -top-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
            <Target size={160} className="-rotate-12" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-6 italic">Total Missions</p>
          <div className="flex items-baseline gap-3">
            <span className="text-4xl sm:text-6xl font-display font-black italic tracking-tighter text-slate-900 dark:text-white leading-none">{driverStats?.total_trips || 0}</span>
            <span className="text-xl font-black italic text-slate-400 uppercase tracking-tighter">Nodes</span>
          </div>
          <p className="mt-8 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Verified career operations logged</p>
        </div>

        <div className="card-modern bg-gradient-to-br from-slate-900 via-obsidian to-slate-900 text-white flex flex-col justify-between border-white/10 shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-primary/5 blur-[80px] pointer-events-none"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-6 italic">Pilot Efficiency</p>
          <div className="flex items-center gap-6 relative z-10">
            <span className="text-5xl sm:text-7xl font-display font-black italic leading-none tracking-tighter">{driverStats?.rating || '5.0'}</span>
            <div className="space-y-2">
              <div className="flex text-primary">
                {[1,2,3,4,5].map(i => <Star key={i} size={18} fill="currentColor" />)}
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary shadow-glow-saffron/20 px-2 py-0.5 bg-primary/10 rounded-md">ELITE STATUS</p>
            </div>
          </div>
        </div>
      </div>

      {/* Operating Area Card */}
      <div className="mx-4 sm:mx-0 card-modern bg-white dark:bg-white/5 border-white/5 relative overflow-hidden group">
        <div className="absolute -right-10 -bottom-10 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
           <Map size={180} />
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-10 relative z-10">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center shrink-0 border border-primary/20">
              <MapPin className="w-10 h-10 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2 italic">Operating Sector</p>
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-3xl sm:text-4xl font-display font-black italic uppercase tracking-tighter text-slate-900 dark:text-white leading-none">{area}</span>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] px-4 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-full border border-emerald-500/20">
                  ACTIVE DEPLOYMENT ZONE
                </span>
                {areaSuccess && (
                  <div className="flex items-center gap-2 text-emerald-500 animate-fade-in">
                    <ShieldCheck size={14} />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em]">SYNCHRONIZED</span>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-slate-400 mt-3 font-bold uppercase tracking-widest">Visibility Protocol: Global broadcast active in this sector.</p>
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0 w-full sm:w-80">
            {areaUpdating && <Loader2 className="w-5 h-5 text-primary animate-spin" />}
            <div className="relative flex-1">
               <select
                 value={area}
                 onChange={(e) => updateArea(e.target.value)}
                 disabled={areaUpdating}
                 className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-black uppercase tracking-widest rounded-2xl px-6 py-5 text-[11px] focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary cursor-pointer disabled:opacity-50 transition-all appearance-none"
               >
                 {KASHMIR_DISTRICTS.map(d => (
                   <option key={d} value={d}>{d}</option>
                 ))}
               </select>
               <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 rotate-90 text-primary pointer-events-none" size={16} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mx-4 sm:mx-0">
        {/* Quick Actions */}
        <div className="space-y-8">
          <div className="flex items-center gap-3">
             <div className="w-10 h-1 bg-primary rounded-full"></div>
             <h3 className="text-2xl font-display font-black italic uppercase tracking-tight">OPERATIONAL <span className="text-primary">NODES</span></h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Link to="/driver/requests" className="card-modern group hover:bg-primary transition-all p-10 flex flex-col items-center justify-center text-center gap-6 relative overflow-hidden bg-white dark:bg-white/5">
              <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                 <Zap size={80} />
              </div>
              <div className="w-16 h-16 bg-electric-cyan/10 rounded-2xl flex items-center justify-center group-hover:bg-obsidian/10 transition-colors">
                <Navigation className="text-electric-cyan group-hover:text-obsidian" size={28} />
              </div>
              <div>
                 <p className="font-black italic uppercase tracking-tighter text-xl group-hover:text-obsidian">New Requests</p>
                 <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1 group-hover:text-obsidian/60">Incoming Signals</p>
              </div>
            </Link>
            <Link to="/driver/history" className="card-modern group hover:bg-obsidian transition-all p-10 flex flex-col items-center justify-center text-center gap-6 relative overflow-hidden bg-white dark:bg-white/5 dark:hover:bg-ghost">
              <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                 <History size={80} />
              </div>
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-white/10 transition-colors">
                <History className="text-primary group-hover:text-white dark:group-hover:text-obsidian" size={28} />
              </div>
              <div>
                 <p className="font-black italic uppercase tracking-tighter text-xl group-hover:text-white dark:group-hover:text-obsidian">Trip History</p>
                 <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1 group-hover:text-white/60 dark:group-hover:text-obsidian/60">Mission Archives</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Vehicle Info Card */}
        <div className="space-y-8">
          <div className="flex items-center gap-3">
             <div className="w-10 h-1 bg-primary rounded-full"></div>
             <h3 className="text-2xl font-display font-black italic uppercase tracking-tight">ACTIVE <span className="text-primary">CARRIER</span></h3>
          </div>
          <div className="card-modern p-6 sm:p-10 flex flex-col sm:flex-row items-center gap-6 sm:gap-10 group bg-white dark:bg-white/5 border-white/5 overflow-hidden relative">
            <div className="absolute -right-6 -bottom-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
               <Truck size={120} className="-rotate-12" />
            </div>
            <div className="w-24 h-24 sm:w-28 sm:h-28 bg-slate-100 dark:bg-white/10 rounded-[2.5rem] flex items-center justify-center group-hover:scale-110 transition-transform overflow-hidden shrink-0 shadow-xl border border-white/5">
               <Truck size={48} className="text-slate-400 group-hover:text-primary transition-colors" />
            </div>
            <div className="flex-1 min-w-0 w-full text-center sm:text-left space-y-4">
               <div>
                  <div className="flex items-center justify-center sm:justify-between gap-4 mb-2">
                    <h4 className="text-2xl sm:text-3xl font-display font-black italic uppercase tracking-tighter text-slate-900 dark:text-white truncate leading-none">{driverStats?.vehicle_model || 'Standard Move'}</h4>
                    <span className="hidden sm:inline-block text-[9px] font-black uppercase tracking-[0.2em] px-4 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-full border border-emerald-500/20">VERIFIED UNIT</span>
                  </div>
                  <p className="text-[11px] font-black text-primary uppercase tracking-[0.3em] italic">{driverStats?.vehicle_plate || 'JK01-XXXX'}</p>
               </div>
               <div className="space-y-2">
                  <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-500 italic">
                     <span>Deployment Ready</span>
                     <span>98% Integrity</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden flex gap-1">
                     <div className="h-full bg-primary w-3/4 shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                     <div className="h-full bg-secondary w-1/4"></div>
                  </div>
               </div>
            </div>
          </div>
        </div>
        </div>

        {chatOpen && activeRide && (
          <Chat 
            bookingId={activeRide.id}
            receiverName={activeRide.customer_name}
            receiverPhone={activeRide.customer_phone}
            socketRef={socketRef}
            onClose={() => setChatOpen(false)}
          />
        )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideUpChat {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up { animation: slideUpChat 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        @keyframes driver-pulse {
          0% { transform: scale(0.8); opacity: 0.6; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        .km-pickup-marker, .km-dest-marker, .km-stop-marker, .driver-icon-container {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-tile-pane { filter: saturate(1.05) contrast(1.02); }
      `}} />
    </div>
  );
};

export default DriverOverview;
