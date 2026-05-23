import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Car,
  Truck,
  Navigation,
  ShieldCheck,
  ArrowLeft,
  Target,
  Box,
  Users,
  Activity,
  MapPin,
  Loader2
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvent } from 'react-leaflet';
import L from 'leaflet';
import { useToast } from '../../context/ToastContextShared';
import api from '../../services/api';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const KASHMIR_DISTRICTS = [
  { id: 1, name: 'Srinagar', lat: 34.0837, lng: 74.7973 },
  { id: 2, name: 'Anantnag', lat: 33.7298, lng: 75.1467 },
  { id: 3, name: 'Ganderbal', lat: 34.3133, lng: 75.5667 },
  { id: 4, name: 'Badgam', lat: 34.2044, lng: 75.0044 },
  { id: 5, name: 'Pulwama', lat: 33.9244, lng: 75.3244 },
  { id: 6, name: 'Kulgam', lat: 33.6133, lng: 75.5333 }
];

const VEHICLE_TYPES = {
  rickshaw: { name: 'E-Rickshaw', icon: <Navigation size={32} />, baseRate: 10, perKm: 3 },
  cab: { name: 'Premium Cab', icon: <Car size={32} />, baseRate: 60, perKm: 25 },
  pickup: { name: 'Cargo Pickup', icon: <Truck size={32} />, baseRate: 150, perKm: 40 }
};

// Reverse geocoding using Nominatim
const getAddressFromCoordinates = async (lat, lng) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
    );
    const data = await response.json();
    const addr = data.address;
    if (!addr) return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    
    const parts = [];
    if (addr.house_number) parts.push(addr.house_number);
    if (addr.amenity) parts.push(addr.amenity);
    else if (addr.building) parts.push(addr.building);
    else if (addr.shop) parts.push(addr.shop);
    else if (addr.office) parts.push(addr.office);
    
    if (addr.road) parts.push(addr.road);
    
    if (addr.neighbourhood) parts.push(addr.neighbourhood);
    else if (addr.suburb) parts.push(addr.suburb);
    else if (addr.hamlet) parts.push(addr.hamlet);

    if (parts.length <= 1) {
       return data.display_name.split(',').slice(0, 2).join(', ');
    }
    
    return parts.join(', ');
  } catch (err) {
    console.error('Geocoding error:', err);
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
};

const MapClickHandler = ({ onLocationSelect }) => {
  useMapEvent('click', (e) => {
    onLocationSelect({
      lat: e.latlng.lat,
      lng: e.latlng.lng
    });
  });
  return null;
};

const BookRide = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fetchingAddress, setFetchingAddress] = useState(false);
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [bookingData, setBookingData] = useState({
    district: null,
    districtName: '',
    vehicleType: 'rickshaw',
    pickup: null,
    drop: null,
    pickupAddress: '',
    dropAddress: '',
    fare: 0,
    driverId: null
  });

  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [mapCenter, setMapCenter] = useState([34.0837, 74.7973]);
  const [tempLocation, setTempLocation] = useState(null);
  const [tempAddress, setTempAddress] = useState('');
  const [selectingLocation, setSelectingLocation] = useState('pickup');
  const [distance, setDistance] = useState(0);

  // Calculate distance
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Calculate fare
  const calculateFare = (distance, vehicleType) => {
    const vehicle = VEHICLE_TYPES[vehicleType];
    if (!vehicle) return 10;
    // For E-Rickshaw, keep it at baseRate (10) if distance is under 3.5km
    if (vehicleType === 'rickshaw' && distance <= 3.5) return 10;
    const minFare = vehicleType === 'rickshaw' ? 10 : 30;
    return Math.max(minFare, Math.ceil(vehicle.baseRate + distance * vehicle.perKm));
  };

  // Fetch drivers
  const fetchNearbyDrivers = async (districtId) => {
    try {
      const res = await api.get(`/locations/drivers-in-district/${districtId}`);
      if (res.data.success) {
        console.log('Drivers fetched:', res.data.drivers);
        setDrivers(res.data.drivers || []);
      }
    } catch (err) {
      console.error('Error fetching drivers:', err);
      addToast('Error', 'Failed to fetch available drivers', 'error');
      setDrivers([]);
    }
  };

  // District selection
  const handleDistrictSelect = (district) => {
    setBookingData(prev => ({
      ...prev,
      district: district.id,
      districtName: district.name
    }));
    setMapCenter([district.lat, district.lng]);
    setStep(2);
  };

  // Vehicle selection
  const handleVehicleSelect = (vehicleType) => {
    setBookingData(prev => ({
      ...prev,
      vehicleType
    }));
    // Recalculate fare if locations exist
    if (bookingData.pickup && bookingData.drop) {
      const dist = calculateDistance(
        bookingData.pickup.lat, bookingData.pickup.lng,
        bookingData.drop.lat, bookingData.drop.lng
      );
      const newFare = calculateFare(dist, vehicleType);
      setBookingData(prev => ({
        ...prev,
        fare: newFare
      }));
    }
    setStep(3);
  };

  // Handle map click
  const handleMapClick = async (location) => {
    setTempLocation(location);
    setFetchingAddress(true);
    const address = await getAddressFromCoordinates(location.lat, location.lng);
    setTempAddress(address);
    setFetchingAddress(false);
  };

  // Confirm pickup
  const confirmPickup = () => {
    if (!tempLocation || !tempAddress) return;
    setBookingData(prev => ({
      ...prev,
      pickup: tempLocation,
      pickupAddress: tempAddress
    }));
    addToast('Success', 'Pickup location confirmed', 'success');
    setSelectingLocation('drop');
    setTempLocation(null);
    setTempAddress('');
  };

  // Confirm drop
  const confirmDrop = () => {
    if (!tempLocation || !tempAddress || !bookingData.pickup) return;
    const dist = calculateDistance(
      bookingData.pickup.lat, bookingData.pickup.lng,
      tempLocation.lat, tempLocation.lng
    );
    const fare = calculateFare(dist, bookingData.vehicleType);
    setDistance(dist);
    setBookingData(prev => ({
      ...prev,
      drop: tempLocation,
      dropAddress: tempAddress,
      fare
    }));
    addToast('Success', 'Drop location confirmed', 'success');
    fetchNearbyDrivers(bookingData.district);
    setTempLocation(null);
    setTempAddress('');
    setSelectingLocation(null);
  };

  // Select driver
  const handleSelectDriver = (driver) => {
    setSelectedDriver(driver);
    setBookingData(prev => ({
      ...prev,
      driverId: driver.id
    }));
    setStep(5);
  };

  // Confirm booking
  const handleBooking = async () => {
    if (!bookingData.pickup || !bookingData.drop || !selectedDriver) {
      return addToast('Error', 'Please complete all steps', 'error');
    }

    setLoading(true);
    try {
      const res = await api.post('/customer/book-ride', {
        driverId: selectedDriver.id,
        pickupLocation: bookingData.pickupAddress,
        dropLocation: bookingData.dropAddress,
        pickupLat: bookingData.pickup.lat,
        pickupLng: bookingData.pickup.lng,
        dropLat: bookingData.drop.lat,
        dropLng: bookingData.drop.lng,
        vehicleType: bookingData.vehicleType,
        fare: bookingData.fare
      });

      if (res.data.success) {
        addToast('Success', 'Ride booked successfully!', 'success');
        navigate(`/customer/waiting/${res.data.bookingId}`);
      }
    } catch (err) {
      addToast('Error', err.response?.data?.message || 'Booking failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-fade-in pb-20 pt-6 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 md:gap-10">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
             <div className="w-12 h-1 bg-primary rounded-full"></div>
             <span className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-500 italic">Step {step} of 5</span>
          </div>
          <h1 className="text-4xl sm:text-7xl font-display font-black italic uppercase tracking-tighter text-slate-900 dark:text-white leading-[0.9] sm:leading-[0.85]">
            BOOK <span className="text-primary">RIDE</span>
          </h1>
        </div>

        <div className="grid grid-cols-5 gap-2 sm:flex sm:items-center sm:gap-3 p-2 sm:p-3 bg-white dark:bg-white/5 rounded-[1.5rem] sm:rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-xl w-full md:w-auto">
           {[1, 2, 3, 4, 5].map(s => (
             <div 
               key={s} 
               className={`h-12 px-4 flex items-center justify-center rounded-[1.5rem] transition-all duration-500 text-[9px] font-black uppercase tracking-[0.2em] ${
                 step === s 
                   ? 'bg-primary text-obsidian shadow-glow-saffron' 
                   : step > s 
                     ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                     : 'text-slate-400 opacity-50'
               }`}
             >
                {s}
             </div>
           ))}
        </div>
      </div>

      {/* PHASE 1: DISTRICT SELECTION */}
      {step === 1 && (
        <div className="space-y-12 animate-slide-up">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <MapPin size={22} />
              </div>
              <h3 className="text-2xl font-display font-black uppercase italic tracking-tight text-slate-900 dark:text-white">SELECT <span className="text-primary">DISTRICT</span></h3>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {KASHMIR_DISTRICTS.map((district) => (
                <button 
                  key={district.id}
                  onClick={() => handleDistrictSelect(district)}
                  className="card-modern p-8 text-center rounded-[2.5rem] transition-all duration-500 border bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-primary/30 hover:shadow-lg"
                >
                  <MapPin className="mx-auto mb-4 text-primary" size={32} />
                  <h4 className="text-lg font-black text-slate-900 dark:text-white mb-2">{district.name}</h4>
                  <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">District</p>
                </button>
              ))}
           </div>
        </div>
      )}

      {/* PHASE 2: VEHICLE SELECTION */}
      {step === 2 && (
        <div className="space-y-12 animate-slide-up">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <Box size={22} />
              </div>
              <h3 className="text-2xl font-display font-black uppercase italic tracking-tight text-slate-900 dark:text-white">SELECT <span className="text-primary">VEHICLE</span></h3>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {Object.entries(VEHICLE_TYPES).map(([type, vehicle]) => (
                <button 
                  key={type}
                  onClick={() => handleVehicleSelect(type)}
                  className="card-modern p-8 sm:p-10 flex flex-col items-center text-center rounded-[2rem] sm:rounded-[3rem] transition-all duration-500 border bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-primary/30"
                >
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[2rem] sm:rounded-[2.5rem] flex items-center justify-center transition-all mb-8 sm:mb-10 bg-slate-50 dark:bg-white/10 text-slate-400">
                    {vehicle.icon}
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 italic">{vehicle.name}</h4>
                    <p className="text-5xl font-display font-black italic text-slate-900 dark:text-white">₹{vehicle.baseRate}</p>
                    <p className="text-[10px] text-slate-400 italic">Base fare</p>
                  </div>
                </button>
              ))}
           </div>

           <div className="flex gap-8">
              <button onClick={() => setStep(1)} className="flex-1 py-4 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2.5rem] font-black uppercase text-[10px] tracking-[0.3em] hover:bg-slate-200 dark:hover:bg-white/10 transition-all flex items-center justify-center gap-4 text-slate-500">
                 <ArrowLeft size={20} /> BACK
              </button>
           </div>
        </div>
      )}

      {/* PHASE 3: LOCATION & FARE */}
      {step === 3 && (
        <div className="space-y-12 animate-slide-up">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <Target size={22} />
              </div>
              <h3 className="text-2xl font-display font-black uppercase italic tracking-tight text-slate-900 dark:text-white">PICK <span className="text-primary">LOCATIONS</span></h3>
           </div>

           {/* Mobile: form on top, map below. Desktop: side-by-side */}
           <div className="flex flex-col-reverse lg:grid lg:grid-cols-[1fr_400px] gap-6 lg:gap-8 items-start">
             {/* MAP */}
             <div className="h-[300px] sm:h-[420px] lg:h-[600px] rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-200 dark:border-white/10">
               <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                 <TileLayer
                   url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                   attribution='&copy; OpenStreetMap contributors'
                 />
                 <MapClickHandler onLocationSelect={handleMapClick} />
                 {bookingData.pickup && (
                   <Marker position={[bookingData.pickup.lat, bookingData.pickup.lng]} title="Pickup">
                   </Marker>
                 )}
                 {bookingData.drop && (
                   <Marker position={[bookingData.drop.lat, bookingData.drop.lng]} title="Drop">
                   </Marker>
                 )}
                 {tempLocation && (
                   <Marker position={[tempLocation.lat, tempLocation.lng]} title="Selected">
                   </Marker>
                 )}
               </MapContainer>
             </div>

             {/* FORMS SIDEBAR */}
             <div className="space-y-8">
                {/* Pickup Form */}
                <div className={`group p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] border-2 transition-all duration-500 relative overflow-hidden ${bookingData.pickup ? 'border-primary bg-primary/5 shadow-[0_20px_50px_-12px_rgba(245,158,11,0.15)]' : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5'}`}>
                  {bookingData.pickup && <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />}
                  
                  <div className="flex items-center justify-between mb-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 italic">Pickup Node</p>
                    {bookingData.pickup && <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-glow-saffron" />}
                  </div>
                  
                  {bookingData.pickup ? (
                    <div className="space-y-6 relative z-10">
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                           <MapPin size={18} />
                        </div>
                        <p className="text-sm font-black text-slate-900 dark:text-white leading-relaxed">{bookingData.pickupAddress}</p>
                      </div>
                      <button
                        onClick={() => {
                          setBookingData(prev => ({ ...prev, pickup: null, pickupAddress: '' }));
                          setSelectingLocation('pickup');
                        }}
                        className="w-full py-4 bg-slate-900 dark:bg-white/10 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-obsidian transition-all border border-white/5"
                      >
                        RE-INITIALIZE
                      </button>
                    </div>
                  ) : selectingLocation === 'pickup' && tempLocation ? (
                    <div className="space-y-6">
                      <div className="flex gap-4 min-h-[3rem]">
                        <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-white/5 flex items-center justify-center text-slate-400 shrink-0">
                          <Loader2 size={18} className={fetchingAddress ? "animate-spin" : ""} />
                        </div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed">
                          {fetchingAddress ? "Resolving telemetry..." : tempAddress}
                        </p>
                      </div>
                      <button
                        onClick={confirmPickup}
                        disabled={fetchingAddress}
                        className="w-full py-5 bg-primary text-obsidian rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] hover:scale-[1.02] active:scale-95 transition-all shadow-glow-saffron disabled:opacity-50"
                      >
                        CONFIRM DEPLOYMENT
                      </button>
                    </div>
                  ) : selectingLocation === 'pickup' ? (
                    <div className="flex flex-col items-center py-4 text-center space-y-3">
                       <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-white/5 flex items-center justify-center text-slate-400 border border-dashed border-slate-300 dark:border-white/10">
                          <Target size={20} />
                       </div>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Awaiting Map Input...</p>
                    </div>
                  ) : null}
                </div>

                {/* Drop Form */}
                <div className={`group p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] border-2 transition-all duration-500 relative overflow-hidden ${bookingData.drop ? 'border-electric-cyan bg-electric-cyan/5 shadow-[0_20px_50px_-12px_rgba(34,211,238,0.15)]' : bookingData.pickup ? 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5' : 'border-slate-100 dark:border-white/5 bg-slate-100 dark:bg-white/10 opacity-30 cursor-not-allowed'}`}>
                  {bookingData.drop && <div className="absolute top-0 right-0 w-32 h-32 bg-electric-cyan/5 rounded-full -mr-16 -mt-16 blur-3xl" />}
                  
                  <div className="flex items-center justify-between mb-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 italic">Target Node</p>
                    {bookingData.drop && <div className="w-2 h-2 rounded-full bg-electric-cyan animate-pulse shadow-[0_0_10px_#22d3ee]" />}
                  </div>
                  
                  {bookingData.drop ? (
                    <div className="space-y-6 relative z-10">
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-xl bg-electric-cyan/10 flex items-center justify-center text-electric-cyan shrink-0">
                          <Target size={18} />
                        </div>
                        <p className="text-sm font-black text-slate-900 dark:text-white leading-relaxed">{bookingData.dropAddress}</p>
                      </div>
                      <button
                        onClick={() => {
                          setBookingData(prev => ({ ...prev, drop: null, dropAddress: '', fare: 0 }));
                          setDistance(0);
                          setSelectingLocation('drop');
                        }}
                        className="w-full py-4 bg-slate-900 dark:bg-white/10 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-obsidian transition-all border border-white/5"
                      >
                        RE-INITIALIZE
                      </button>
                    </div>
                  ) : bookingData.pickup && selectingLocation === 'drop' && tempLocation ? (
                    <div className="space-y-6">
                      <div className="flex gap-4 min-h-[3rem]">
                        <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-white/5 flex items-center justify-center text-slate-400 shrink-0">
                          <Loader2 size={18} className={fetchingAddress ? "animate-spin" : ""} />
                        </div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed">
                          {fetchingAddress ? "Resolving telemetry..." : tempAddress}
                        </p>
                      </div>
                      <button
                        onClick={confirmDrop}
                        disabled={fetchingAddress}
                        className="w-full py-5 bg-electric-cyan text-obsidian rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] hover:scale-[1.02] active:scale-95 transition-all shadow-[0_10px_30px_-10px_#22d3ee] disabled:opacity-50"
                      >
                        CONFIRM TARGET
                      </button>
                    </div>
                  ) : bookingData.pickup && selectingLocation === 'drop' ? (
                    <div className="flex flex-col items-center py-4 text-center space-y-3">
                       <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-white/5 flex items-center justify-center text-slate-400 border border-dashed border-slate-300 dark:border-white/10">
                          <Navigation size={20} />
                       </div>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Awaiting Destination...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-4 text-center">
                       <p className="text-[10px] font-bold text-slate-300 dark:text-white/10 uppercase tracking-widest italic">Locked until pickup confirmed</p>
                    </div>
                  )}
                </div>

                {/* Manual Proceed Button */}
                {bookingData.pickup && bookingData.drop && (
                  <div className="pt-6 animate-fade-in">
                    <button
                      onClick={() => setStep(4)}
                      className="w-full py-6 bg-emerald-500 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-[0.4em] shadow-[0_20px_50px_-15px_rgba(16,185,129,0.3)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4"
                    >
                      PROCEED TO DRIVERS <Users size={20} />
                    </button>
                    <p className="text-center text-[10px] font-bold text-slate-400 mt-4 uppercase tracking-widest italic">Routing nodes finalized</p>
                  </div>
                )}
             </div>
           </div>

           <div className="flex gap-8">
              <button onClick={() => setStep(2)} className="flex-1 py-4 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2.5rem] font-black uppercase text-[10px] tracking-[0.3em] hover:bg-slate-200 dark:hover:bg-white/10 transition-all flex items-center justify-center gap-4 text-slate-500">
                 <ArrowLeft size={20} /> BACK
              </button>
           </div>
        </div>
      )}

      {/* PHASE 4: DRIVER SELECTION */}
      {step === 4 && (
        <div className="space-y-12 animate-slide-up">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <Users size={22} />
              </div>
              <h3 className="text-2xl font-display font-black uppercase italic tracking-tight text-slate-900 dark:text-white">SELECT <span className="text-primary">DRIVER</span></h3>
           </div>
            {drivers.filter(d => d.vehicle_type === bookingData.vehicleType).length === 0 ? (
              <div className="text-center py-16 bg-slate-50 dark:bg-white/5 rounded-[2.5rem] border border-slate-200 dark:border-white/10">
                <Car className="mx-auto mb-4 text-slate-300" size={48} />
                <p className="text-slate-600 dark:text-slate-300 font-bold uppercase tracking-tight">No {VEHICLE_TYPES[bookingData.vehicleType]?.name}s available</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {drivers
                  .filter(d => d.vehicle_type === bookingData.vehicleType)
                  .map((driver) => (
                  <button
                    key={driver.id}
                    onClick={() => handleSelectDriver(driver)}
                    className="card-modern p-8 rounded-[2.5rem] border-2 transition-all bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-primary/30 hover:shadow-lg"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-6 text-center sm:text-left">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <Users size={32} />
                      </div>
                      <div className="flex-1 text-center sm:text-left">
                        <h4 className="text-lg font-black text-slate-900 dark:text-white mb-1">{driver.name}</h4>
                        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mb-2">{driver.vehicle_type}</p>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-black">⭐ {Number(driver.rating || 4.8).toFixed(1)} • {Number(driver.distance || 0).toFixed(1)} km away</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

           <div className="flex gap-8">
              <button onClick={() => setStep(3)} className="flex-1 py-4 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2.5rem] font-black uppercase text-[10px] tracking-[0.3em] hover:bg-slate-200 dark:hover:bg-white/10 transition-all flex items-center justify-center gap-4 text-slate-500">
                 <ArrowLeft size={20} /> BACK
              </button>
           </div>
        </div>
      )}

      {/* PHASE 5: CONFIRMATION */}
      {step === 5 && (
        <div className="space-y-12 animate-slide-up">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <ShieldCheck size={22} />
              </div>
              <h3 className="text-2xl font-display font-black uppercase italic tracking-tight text-slate-900 dark:text-white">CONFIRM <span className="text-primary">BOOKING</span></h3>
           </div>

           <div className="relative overflow-hidden rounded-[2rem] sm:rounded-[4rem] bg-gradient-to-br from-slate-900 via-obsidian to-slate-900 border border-white/10 p-6 sm:p-20 shadow-[0_60px_120px_-20px_rgba(0,0,0,0.6)]">
              <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
              
              <div className="relative z-10 space-y-10 sm:space-y-16">
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-10">
                     <div className="text-center sm:text-left">
                        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/30 mb-4 italic">Total Fare</p>
                        <h4 className="text-5xl sm:text-7xl font-display font-black italic tracking-tighter text-white leading-none">₹{bookingData.fare}</h4>
                     </div>
                     <div className="text-center sm:text-right space-y-4">
                        <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10 space-y-4 min-w-[200px]">
                           <div>
                              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-2 italic">Mission Distance</p>
                              <p className="text-2xl font-display font-black text-white">{distance.toFixed(1)} KM</p>
                           </div>
                           <div className="inline-block px-8 py-3 bg-primary rounded-2xl shadow-glow-saffron">
                              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-obsidian italic">Ready for Dispatch</span>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-10 pt-10 sm:pt-16 border-t border-white/5">
                     <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary shadow-2xl">
                           <Car size={32} />
                        </div>
                        <div>
                           <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-1 italic">Vehicle Identity</p>
                           <p className="text-xl font-display font-black text-white uppercase italic tracking-tight leading-tight">{VEHICLE_TYPES[bookingData.vehicleType]?.name}</p>
                           <p className="text-[11px] font-bold text-white/50 tracking-[0.1em] mt-1">{selectedDriver?.vehicle_model} • <span className="text-primary/70">{selectedDriver?.vehicle_number}</span></p>
                        </div>
                     </div>
                     <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-500 shadow-2xl">
                           <Users size={32} />
                        </div>
                        <div>
                           <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-1 italic">Pilot Contact</p>
                           <p className="text-xl font-display font-black text-emerald-500 uppercase italic tracking-tight leading-tight">{selectedDriver?.name}</p>
                           <div className="flex items-center gap-3 mt-1">
                              <p className="text-[11px] font-bold text-white/50 tracking-widest">{selectedDriver?.phone}</p>
                              <div className="px-2 py-0.5 bg-emerald-500/10 rounded text-[9px] font-black text-emerald-500">⭐ {Number(selectedDriver?.rating || 4.8).toFixed(1)}</div>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-10 pt-10 sm:pt-16 border-t border-white/5">
                     <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-amber-500 shadow-2xl">
                           <MapPin size={32} />
                        </div>
                        <div>
                           <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-2 italic">Pickup</p>
                           <p className="text-sm font-display font-bold text-white italic tracking-tight">{bookingData.pickupAddress}</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-electric-cyan shadow-2xl">
                           <Target size={32} />
                        </div>
                        <div>
                           <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-2 italic">Drop</p>
                           <p className="text-sm font-display font-bold text-white italic tracking-tight">{bookingData.dropAddress}</p>
                        </div>
                     </div>
                  </div>
              </div>
           </div>
           
           <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
              <button onClick={() => setStep(4)} className="flex-1 py-8 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2.5rem] font-black uppercase text-[10px] tracking-[0.3em] hover:bg-slate-200 dark:hover:bg-white/10 transition-all flex items-center justify-center gap-4 text-slate-500">
                 <ArrowLeft size={20} /> BACK
              </button>
              <button 
                onClick={handleBooking} 
                disabled={loading} 
                className="flex-[2.5] py-8 bg-primary text-obsidian rounded-[2.5rem] font-black uppercase text-[11px] tracking-[0.4em] shadow-glow-saffron hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-6"
              >
                {loading ? "BOOKING..." : "CONFIRM BOOKING"}
                <Activity size={20} className={loading ? "animate-spin" : "animate-pulse"} />
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default BookRide;
