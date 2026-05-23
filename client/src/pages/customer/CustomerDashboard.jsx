import { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { AuthContext } from '../../context/AuthContextValue';
import api from '../../services/api';
import Skeleton from '../../components/Skeleton';
import {
  History,
  ArrowUpRight,
  Navigation,
  Star,
  MapPin,
  Truck,
  Car,
  Zap,
  Eye,
  EyeOff,
  Activity,
  ShieldCheck,
  Compass,
  X
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapAutoCenter = ({ drivers }) => {
  const map = useMap();
  const hasCentered = useRef(false);

  useEffect(() => {
    if (drivers.length > 0 && !hasCentered.current) {
      const firstDriver = drivers.find(d => d.current_lat && d.current_lng);
      if (firstDriver) {
        map.setView([firstDriver.current_lat, firstDriver.current_lng], 12);
        hasCentered.current = true;
      }
    }
  }, [drivers, map]);

  return null;
};

const MapResizer = ({ showMap }) => {
  const map = useMap();
  useEffect(() => {
    if (showMap) {
      const timer = setTimeout(() => {
        map.invalidateSize();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [showMap, map]);
  return null;
};

const PilotCard = ({ driver, onBook }) => {
  const map = useMap();
  
  return (
    <div className="p-0 w-[280px] bg-white dark:bg-obsidian-light rounded-[2.5rem] overflow-hidden shadow-premium border border-slate-100 dark:border-white/10 relative">
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
      
      <div className="bg-slate-900 p-6 relative overflow-hidden">
         <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl -mr-12 -mt-12 opacity-30 ${
            driver.type === 'truck' || driver.type === 'pickup' ? 'bg-amber-500' : 
            driver.type === 'rickshaw' ? 'bg-emerald-500' : 'bg-primary'
         }`}></div>

         <button 
            onClick={(e) => {
              e.stopPropagation();
              map.closePopup();
            }}
            className="absolute top-4 right-4 z-50 w-8 h-8 flex items-center justify-center bg-white/5 backdrop-blur-md border border-white/10 rounded-xl text-white/60 hover:text-primary hover:bg-white/10 hover:rotate-90 transition-all duration-300"
         >
            <X size={16} />
         </button>
         
         <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-white/5 backdrop-blur-2xl border border-white/20 rounded-2xl flex items-center justify-center text-primary shadow-inner">
               {driver.type === 'truck' || driver.type === 'pickup' ? <Truck size={24} /> : 
                driver.type === 'rickshaw' ? <Zap size={24} /> : <Car size={24} />}
            </div>
            <div className="flex-1 min-w-0">
               <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500">Fleet Active</p>
               </div>
               <h4 className="text-xl font-black italic uppercase tracking-tighter text-white leading-tight pr-6 overflow-visible">
                  {driver.name}
               </h4>
            </div>
         </div>
      </div>

      <div className="p-6 space-y-6 relative z-10">
         <div className="flex items-center justify-between">
            <div className="flex flex-col">
               <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Operation Model</span>
               <p className="text-xs font-bold uppercase tracking-tight text-slate-900 dark:text-slate-100 truncate max-w-[140px]">{driver.model}</p>
            </div>
            <div className="flex flex-col items-end">
               <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Merit</span>
               <div className="flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                  <Star size={12} className="text-amber-500" fill="currentColor" />
                  <span className="text-xs font-black text-amber-500">{driver.rating || '5.0'}</span>
               </div>
            </div>
         </div>

         <button 
           onClick={() => onBook(driver)}
           className="group relative w-full h-14 bg-primary rounded-xl overflow-hidden shadow-glow-saffron hover:scale-[1.03] active:scale-95 transition-all duration-300"
         >
           <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
           <div className="flex items-center justify-center gap-2 relative z-10">
              <span className="text-[10px] font-black uppercase italic tracking-[0.2em] text-obsidian">Initiate Deployment</span>
              <ArrowUpRight size={16} className="text-obsidian group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
           </div>
         </button>
      </div>
    </div>
  );
};

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const { user, refreshTrigger } = useContext(AuthContext);
  const [recentRides, setRecentRides] = useState([]);
  const [activeRideData, setActiveRideData] = useState(null);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [showMap, setShowMap] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRides: 0,
    completedRides: 0,
    totalSpent: 0,
  });

  const fetchData = useCallback(async () => {
    try {
      const ridesRes = await api.get('/customer/bookings');
      const rides = ridesRes.data.bookings || [];
      
      const active = rides.find(r => r.status === 'accepted' || r.status === 'started' || r.status === 'pending');
      setActiveRideData(active);

      setRecentRides(rides.slice(0, 3));

      const completed = rides.filter((r) => r.status === 'completed');
      setStats({
        totalRides: rides.length,
        completedRides: completed.length,
        totalSpent: completed.reduce((acc, r) => acc + parseFloat(r.fare || 0), 0),
      });

      const driversRes = await api.get('/driver/available');
      if (driversRes.data.success) {
        setAvailableDrivers(driversRes.data.drivers.filter(d => d.current_lat && d.current_lng));
      }
    } catch (err) {
      console.error('Dashboard fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    Promise.resolve().then(() => {
      if (mounted) fetchData();
    });
    
    const interval = setInterval(() => {
      if (mounted) fetchData();
    }, 10000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [refreshTrigger, fetchData]);

  const getDriverIcon = (type) => {
    const isTruck = type === 'truck' || type === 'pickup';
    const isRickshaw = type === 'rickshaw';
    
    const iconSvg = isTruck 
      ? '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><path d="M16 18h3a1 1 0 0 0 1-1v-7.34a1 1 0 0 0-.29-.71l-4.42-4.42A1 1 0 0 0 15 4.24V18"/><circle cx="17" cy="18" r="2"/></svg>'
      : isRickshaw
      ? '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>'
      : '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9C2.1 11.1 2 11.5 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>';

    const colorClass = isTruck ? 'text-amber-500' : isRickshaw ? 'text-emerald-500' : 'text-primary';

    return L.divIcon({
      className: 'custom-driver-marker',
      html: `
        <div class="relative group">
          <div class="absolute -inset-2 bg-primary/20 rounded-full blur-sm group-hover:bg-primary/40 transition-all"></div>
          <div class="relative w-10 h-10 bg-white dark:bg-obsidian border-2 border-primary rounded-xl flex items-center justify-center shadow-lg transition-transform hover:scale-110 ${colorClass}">
            ${iconSvg}
          </div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20]
    });
  };

  const handleQuickBook = (driver) => {
    navigate('/customer/book', { 
      state: { 
        preSelectedDriver: driver,
        preSelectedCategory: driver.type 
      } 
    });
  };

  return (
    <div className="responsive-container space-y-8 pb-16 animate-fade-in font-display">
      
      {/* Active Ride Banner - PREMIUM POLISH */}
      {activeRideData && (
        <div className="animate-slide-up">
           <div className="relative group overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-slate-900 via-obsidian to-slate-900 border border-white/10 shadow-2xl">
              {/* Animated Background Mesh */}
              <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] pointer-events-none"></div>
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/10 rounded-full blur-[100px] group-hover:bg-primary/20 transition-all duration-1000"></div>
              
              <div className="relative z-10 p-5 sm:p-10 flex flex-col lg:flex-row items-start sm:items-center justify-between gap-8">
                 <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-8 w-full lg:w-auto">
                    <div className="relative shrink-0">
                       <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(245,158,11,0.4)] animate-glow-pulse">
                          <Activity size={32} className="text-obsidian" />
                       </div>
                       <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white dark:bg-obsidian rounded-xl border-2 border-primary flex items-center justify-center">
                          <span className="w-3 h-3 bg-primary rounded-full animate-ping"></span>
                       </div>
                    </div>
                    
                    <div className="min-w-0">
                       <div className="flex items-center gap-3 mb-2">
                          <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                                Live Dispatch Protocol
                             </p>
                          </div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{activeRideData.status}</span>
                       </div>
                       <h3 className="text-3xl sm:text-4xl font-black italic uppercase leading-none tracking-tight text-white mb-2">
                          {activeRideData.status === 'pending' ? 'Searching for Pilot' : `Pilot ${activeRideData.driver_name}`}
                       </h3>
                       <p className="text-sm font-medium text-slate-400 flex items-center gap-2 italic">
                          <MapPin size={14} className="text-primary" /> 
                          {activeRideData.status === 'started' ? 'En Route to Destination' : 
                           activeRideData.status === 'pending' ? 'Handshaking with nearby fleet...' : 'Approaching Pickup Location'}
                       </p>
                    </div>
                 </div>

                 <div className="flex items-center gap-3 sm:gap-4 w-full lg:w-auto">
                    <button 
                      onClick={() => navigate(
                        activeRideData.status === 'pending' ? `/customer/waiting/${activeRideData.id}` :
                        activeRideData.status === 'started' ? `/customer/ride/${activeRideData.id}` : 
                        `/customer/waiting/${activeRideData.id}`
                      )}
                      className="flex-1 lg:flex-none h-16 px-12 rounded-2xl bg-primary text-obsidian font-black text-sm uppercase tracking-widest hover:shadow-glow-saffron hover:-translate-y-1 active:scale-95 transition-all duration-300"
                    >
                      Enter Command Center
                    </button>
                    <button className="h-16 w-16 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all">
                       <ShieldCheck size={24} />
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Welcome Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 lg:gap-10 pt-4">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3 mb-6">
             <div className="w-12 h-1 bg-primary rounded-full"></div>
             <span className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-500">Logistics Hub v2.0</span>
          </div>
          <h2 className="text-4xl sm:text-7xl lg:text-8xl font-black mb-6 italic uppercase text-slate-900 dark:text-white leading-[0.95] sm:leading-[0.9] tracking-tighter">
            HELLO, <span className="text-gradient-primary pr-4">{user?.name} </span>
          </h2>
          <p className="text-lg sm:text-xl text-slate-500 dark:text-slate-400 font-medium leading-relaxed italic max-w-xl">
            Command the valley's most sophisticated transport network. Your premium fleet is ready for immediate dispatch.
          </p>
        </div>
        
        <Link 
          to="/customer/book" 
          className="group relative min-h-16 sm:h-24 w-full lg:w-auto px-6 sm:px-14 flex items-center justify-center gap-4 bg-primary rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden shadow-glow-saffron hover:scale-[1.02] active:scale-95 transition-all duration-300"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          <span className="text-lg sm:text-xl font-black uppercase italic tracking-widest text-obsidian relative z-10">Initialize Booking</span>
          <ArrowUpRight className="w-6 h-6 sm:w-8 sm:h-8 text-obsidian group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform relative z-10" />
        </Link>
      </div>

      {/* Live Fleet Preview Map - Tactical Overhaul */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
           <div className="flex items-center gap-3">
              <Compass className="text-primary animate-spin-slow" size={20} />
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Tactical Fleet Overlay</h3>
           </div>
        </div>

        <div className={`relative overflow-hidden group transition-all duration-700 ease-out border border-slate-200 dark:border-white/10 rounded-[32px] bg-white dark:bg-obsidian-light shadow-premium ${showMap ? 'h-[400px] sm:h-[550px]' : 'h-32'}`}>
          <div className="absolute top-3 left-3 right-16 sm:top-6 sm:left-6 sm:right-auto z-[1000]">
             <div className="bg-white/80 dark:bg-obsidian/80 backdrop-blur-xl px-3 sm:px-5 py-3 rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl flex items-center gap-3 sm:gap-4 group/info">
                <div className="relative">
                   <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary group-hover/info:rotate-12 transition-transform">
                      <Zap size={20} fill="currentColor" />
                   </div>
                   <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-obsidian animate-pulse"></div>
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-0.5">Live Grid Active</p>
                   <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                     {availableDrivers.length} Active Nodes • 94% Coverage
                   </p>
                </div>
             </div>
          </div>

          <div className="absolute top-3 right-3 sm:top-6 sm:right-6 z-[1000]">
             <button 
                onClick={() => setShowMap(!showMap)}
                className="w-12 h-12 flex items-center justify-center bg-white/80 dark:bg-obsidian/80 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl hover:border-primary/50 hover:text-primary transition-all active:scale-95"
             >
               {showMap ? <EyeOff size={20} /> : <Eye size={20} />}
             </button>
          </div>

          {/* Grid lines overlay for tactical look */}
          <div className="absolute inset-0 pointer-events-none z-[999] opacity-[0.03] bg-[linear-gradient(rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.05)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]"></div>

          <div className={`h-full w-full transition-all duration-700 ${showMap ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
            <MapContainer 
              center={[34.0837, 74.7973]} 
              zoom={13} 
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
              className="grayscale-[0.2] contrast-[1.1]"
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapAutoCenter drivers={availableDrivers} />
              <MapResizer showMap={showMap} />
              {availableDrivers.map(driver => (
                <Marker 
                  key={driver.driver_id} 
                  position={[driver.current_lat, driver.current_lng]}
                  icon={getDriverIcon(driver.type)}
                >
                  <Popup className="premium-popup">
                    <PilotCard driver={driver} onBook={handleQuickBook} />
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          {!showMap && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-50/40 dark:bg-obsidian/40 backdrop-blur-md rounded-[32px] pointer-events-none transition-all duration-500">
               <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 dark:text-slate-600 animate-pulse">
                     <Compass size={24} />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 dark:text-slate-600">Fleet Map Standby</p>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid - High Contrast */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        <div className="card-modern group hover:border-primary/50 transition-all p-8 animate-slide-up stagger-1 overflow-hidden relative">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-6">Dispatch History</p>
          <div className="flex items-baseline gap-4">
            {loading ? <Skeleton width="100px" height="4rem" /> : 
              <span className="text-5xl sm:text-6xl font-black italic tracking-tighter text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                {stats.totalRides}
              </span>
            }
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Nodes</span>
          </div>
          <div className="mt-8 h-2 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
            <div 
              className="h-full rounded-full bg-primary shadow-glow-saffron transition-all duration-1000 ease-out" 
              style={{ width: `${(stats.completedRides / Math.max(stats.totalRides, 1)) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="card-modern group hover:border-emerald-500/50 transition-all p-8 animate-slide-up stagger-2 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/5 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-6">Capital Outflow</p>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl sm:text-6xl font-black italic tracking-tighter text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors">
              ₹{Math.round(stats.totalSpent)}
            </span>
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Total</span>
          </div>
          <p className="mt-8 text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] italic">Cumulative expenditure logged</p>
        </div>

        <div className="bg-gradient-to-br from-slate-900 via-obsidian to-slate-900 rounded-[2.5rem] border border-white/10 p-8 flex flex-col justify-between animate-slide-up stagger-3 group hover:border-electric-cyan/50 transition-all relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full bg-electric-cyan/5 blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-8">Network Status</p>
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-electric-cyan shadow-[0_0_30px_rgba(0,245,255,0.3)] group-hover:rotate-6 transition-transform">
              <Star className="w-8 h-8 text-obsidian" fill="currentColor" />
            </div>
            <div>
              <p className="text-2xl font-black uppercase italic text-white tracking-tight">Elite Pilot</p>
              <p className="text-[10px] font-bold text-electric-cyan uppercase tracking-[0.2em] mt-1">Priority Dispatch Active</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity - Tactical List */}
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2 sm:px-4">
           <div className="flex items-center gap-3">
              <History className="text-primary" size={24} />
              <h3 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tight text-slate-900 dark:text-white">
                Recent Logs
              </h3>
           </div>
           <Link
             to="/customer/rides"
             className="text-[10px] font-black uppercase tracking-[0.3em] text-primary bg-primary/10 px-4 py-2 rounded-full border border-primary/20 hover:bg-primary hover:text-obsidian transition-all"
           >
             Access Archive
           </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {recentRides.length === 0 ? (
            <div className="col-span-full card-modern border-dashed border-white/10 py-24 flex flex-col items-center justify-center text-slate-500 dark:text-slate-600">
              <Navigation className="w-20 h-20 mb-6 opacity-5 animate-float" />
              <p className="font-black uppercase tracking-[0.3em] text-xs italic">No operational records found in current sector</p>
            </div>
          ) : (
            recentRides.map((ride, i) => (
              <div
                key={ride.id}
                className="card-modern flex flex-col sm:flex-row items-center gap-8 group hover:border-white/20 transition-all p-8 animate-slide-up bg-white dark:bg-white/5"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="relative shrink-0">
                   <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 group-hover:bg-primary/10 transition-colors">
                      <History className="text-slate-400 group-hover:text-primary transition-colors w-8 h-8" />
                   </div>
                   <div className="absolute -top-2 -right-2 w-6 h-6 bg-white dark:bg-obsidian rounded-lg border border-white/10 flex items-center justify-center shadow-lg">
                      <p className="text-[10px] font-black text-primary">{i + 1}</p>
                   </div>
                </div>

                <div className="flex-1 min-w-0 text-center sm:text-left w-full">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-3">
                    <h4 className="font-black text-xl italic uppercase tracking-tight text-slate-900 dark:text-white truncate">
                      {ride.driver_name || "Unassigned Node"}
                    </h4>
                    <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border shrink-0 ${
                      ride.status === "completed"
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                        : ride.status === "cancelled"
                          ? "bg-red-500/10 text-red-500 border-red-500/20"
                          : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                    }`}>
                      {ride.status}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                     <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2 justify-center sm:justify-start">
                        <MapPin size={10} className="text-primary" /> {ride.pickup_location?.split('|||')[0] || ride.pickup_location}
                     </p>
                     <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2 justify-center sm:justify-start">
                        <ArrowUpRight size={10} className="text-slate-700" /> {ride.drop_location?.split('|||')[0] || ride.drop_location}
                     </p>
                  </div>
                </div>

                <div className="text-right shrink-0 w-full sm:w-auto pt-6 sm:pt-0 sm:pl-8 border-t sm:border-t-0 sm:border-l border-slate-100 dark:border-white/10 flex sm:flex-col justify-between items-center sm:items-end">
                  <p className="text-3xl font-black italic tracking-tighter text-slate-900 dark:text-white">
                    ₹{Math.round(ride.fare || 0)}
                  </p>
                  <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] sm:mt-2">
                    {new Date(ride.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
