import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ChevronRight, 
  Shield, 
  Zap, 
  Star, 
  Users, 
  Navigation,
  Globe,
  Menu,
  X,
  CreditCard,
  Car,
  Truck,
  Activity,
  Calculator,
  Compass,
  MapPin,
  TrendingUp
} from 'lucide-react';

const KASHMIR_DISTRICTS = [
  { name: 'Srinagar', status: 'HIGH DEMAND', activePilots: 48, rateFactor: 1.0 },
  { name: 'Budgam', status: 'ACTIVE DUTY', activePilots: 26, rateFactor: 1.1 },
  { name: 'Ganderbal', status: 'CLEAR ROADWAYS', activePilots: 14, rateFactor: 1.2 },
  { name: 'Anantnag', status: 'HIGH DEMAND', activePilots: 32, rateFactor: 1.3 },
  { name: 'Pulwama', status: 'ACTIVE DUTY', activePilots: 21, rateFactor: 1.25 },
  { name: 'Baramulla', status: 'ACTIVE DUTY', activePilots: 24, rateFactor: 1.35 },
  { name: 'Kupwara', status: 'CLEAR ROADWAYS', activePilots: 9, rateFactor: 1.5 },
  { name: 'Bandipora', status: 'CLEAR ROADWAYS', activePilots: 11, rateFactor: 1.4 },
  { name: 'Kulgam', status: 'ACTIVE DUTY', activePilots: 15, rateFactor: 1.35 },
  { name: 'Shopian', status: 'HIGH DEMAND', activePilots: 13, rateFactor: 1.45 }
];

const VEHICLE_CLASSES = [
  { id: 'rickshaw', label: 'Eco Rickshaw', baseFare: 15, perKm: 5, icon: <Zap className="text-secondary" size={18} /> },
  { id: 'standard', label: 'Standard Sedan', baseFare: 70, perKm: 15, icon: <Car className="text-primary" size={18} /> },
  { id: 'premium', label: 'Premium Cruiser', baseFare: 120, perKm: 22, icon: <Truck className="text-primary" size={18} /> }
];

// Simple lookup matrix for simulated distance between districts in KM
const getSimulatedDistance = (from, to) => {
  if (from === to) return 4.2; // Local intra-district commute average distance
  // Compute deterministic distance based on string lengths and index differences
  const sumLen = from.length + to.length;
  return Math.max(12, (sumLen * 2.5) % 80);
};

const LandingPage = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [heroMode, setHeroMode] = useState('passenger'); // 'passenger' | 'pilot'
  
  // Calculator State
  const [pickup, setPickup] = useState('Srinagar');
  const [drop, setDrop] = useState('Anantnag');
  const [vehicleClass, setVehicleClass] = useState('standard');
  const [estimatedFare, setEstimatedFare] = useState(0);
  const [estimatedDistance, setEstimatedDistance] = useState(0);

  const isRickshawRestricted = vehicleClass === 'rickshaw' && pickup !== drop;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update Estimated Fare
  useEffect(() => {
    if (isRickshawRestricted) {
      setEstimatedFare(0);
      setEstimatedDistance(0);
      return;
    }
    
    const dist = getSimulatedDistance(pickup, drop);
    const fromDistrict = KASHMIR_DISTRICTS.find(d => d.name === pickup) || { rateFactor: 1.0 };
    const toDistrict = KASHMIR_DISTRICTS.find(d => d.name === drop) || { rateFactor: 1.0 };
    
    if (dist === 0) {
      setEstimatedFare(0);
      setEstimatedDistance(0);
    } else {
      const avgFactor = (fromDistrict.rateFactor + toDistrict.rateFactor) / 2;
      
      // Highly realistic local Kashmiri custom tariff formula
      let rawFare = 0;
      if (vehicleClass === 'rickshaw') {
        // E-Rickshaw: ₹15 flat for the first 3 KM, then ₹5 per KM thereafter
        rawFare = dist <= 3 ? 15 : 15 + ((dist - 3) * 5);
      } else if (vehicleClass === 'standard') {
        // Standard Cab: ₹50 flat for the first 3 KM, then ₹10 per KM thereafter
        rawFare = dist <= 3 ? 50 : 50 + ((dist - 3) * 10);
      } else if (vehicleClass === 'premium') {
        // Premium Cab: ₹80 flat for the first 3 KM, then ₹15 per KM thereafter
        rawFare = dist <= 3 ? 80 : 80 + ((dist - 3) * 15);
      }

      setEstimatedFare(Math.round(rawFare * avgFactor));
      setEstimatedDistance(Math.round(dist * 10) / 10);
    }
  }, [pickup, drop, vehicleClass, isRickshawRestricted]);

  const features = [
    {
      icon: <Zap className="text-primary" size={28} />,
      title: "Real-time Telemetry",
      description: "Watch your pilot approach in real-time with high-precision district GPS tracking."
    },
    {
      icon: <Shield className="text-secondary" size={28} />,
      title: "Secure Clearances",
      description: "Every pilot is verified via our strict Document Vault before taking duty in the valley."
    },
    {
      icon: <Star className="text-primary" size={28} />,
      title: "Saffron-Grade Quality",
      description: "Our fleet maintains a rigorous 4.8+ rating threshold to deliver top-tier hospitality."
    },
    {
      icon: <CreditCard className="text-primary" size={28} />,
      title: "Cashless Ledger",
      description: "Fast digital wallet credits ensure transparent cashless settlements after every trip."
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Uplink Coordinates",
      description: "Input your valley origin and destination districts inside the console."
    },
    {
      number: "02",
      title: "Fleet Dispatch",
      description: "Our matching engine instantly secures the closest verified pilot."
    },
    {
      number: "03",
      title: "Arrive in Comfort",
      description: "Secure your ride with security OTP codes and enjoy a serene valley commute."
    }
  ];

  return (
    <div className="min-h-screen bg-midnight text-white selection:bg-primary/20 selection:text-primary overflow-x-hidden font-sans">
      
      {/* ── Navigation ── */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${isScrolled ? 'bg-midnight/90 backdrop-blur-xl border-b border-white/5 py-4 shadow-2xl' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="relative w-12 h-10 sm:w-14 sm:h-12 flex items-center justify-center overflow-visible shrink-0">
               <div className="relative w-full h-full bg-primary rounded-xl flex items-center justify-center shadow-glow-primary">
                  <div className="relative flex items-center justify-center w-full">
                    <Car className="text-white absolute transition-all duration-500 translate-x-[-4px] group-hover:translate-x-[-14px] group-hover:scale-110" size={20} />
                    <Truck className="text-white absolute transition-all duration-500 translate-x-[6px] group-hover:translate-x-[14px] group-hover:scale-110" size={20} />
                  </div>
               </div>
            </div>
            <span className="text-xl sm:text-2xl font-display font-black italic tracking-tight uppercase">
              Kashmir<span className="text-primary">Move</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-10">
            <a href="#calculator" className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Estimate</a>
            <a href="#features" className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Protocol</a>
            <Link to="/login" className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Sign In</Link>
            <button onClick={() => navigate('/login')} className="btn-modern-primary py-2.5 px-8 text-[10px] uppercase tracking-widest">
              LAUNCH TERMINAL
            </button>
          </div>

          <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-midnight/95 backdrop-blur-2xl border-b border-white/10 p-6 flex flex-col gap-6 md:hidden animate-fade-in">
            <a href="#calculator" onClick={() => setMobileMenuOpen(false)} className="text-base font-black uppercase tracking-widest">Estimate</a>
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-base font-black uppercase tracking-widest">Features</a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="text-base font-black uppercase tracking-widest">Protocol</a>
            <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="text-base font-black uppercase tracking-widest">Sign In</Link>
            <button onClick={() => { setMobileMenuOpen(false); navigate('/login'); }} className="btn-modern-primary w-full py-4 uppercase tracking-widest font-black text-xs">LAUNCH TERMINAL</button>
          </div>
        )}
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-36 overflow-hidden">
        
        {/* Glowing Atmosphere */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[140px] animate-pulse-slow" />
          <div className="absolute bottom-[10%] right-[-10%] w-[40%] h-[40%] bg-secondary/5 rounded-full blur-[120px] animate-pulse-slow delay-1000" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            
            {/* Live Pill */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 mb-8 animate-fade-in shadow-2xl">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-glow-primary" />
              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-300">Royal Chinar Autumn Theme Active</span>
            </div>

            {/* Segmented Mode Switcher */}
            <div className="flex justify-center mb-10">
              <div className="relative p-1.5 bg-white/5 backdrop-blur-md rounded-[20px] border border-white/10 flex gap-2">
                <button 
                  onClick={() => setHeroMode('passenger')}
                  className={`px-8 py-3.5 rounded-[16px] text-[10px] font-black uppercase tracking-widest transition-all ${
                    heroMode === 'passenger' 
                      ? 'bg-primary text-white shadow-glow-primary' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  I am a Passenger
                </button>
                <button 
                  onClick={() => setHeroMode('pilot')}
                  className={`px-8 py-3.5 rounded-[16px] text-[10px] font-black uppercase tracking-widest transition-all ${
                    heroMode === 'pilot' 
                      ? 'bg-secondary text-white shadow-glow-emerald' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  I am a Pilot
                </button>
              </div>
            </div>

            {/* Interactive Copy Blocks */}
            <div className="min-h-[220px] flex items-center justify-center">
              {heroMode === 'passenger' ? (
                <div className="space-y-6 animate-fade-in">
                  <h1 className="text-5xl sm:text-7xl md:text-8xl font-display font-black leading-[0.95] sm:leading-[0.85] tracking-tighter uppercase italic">
                    TRAVEL THE VALLEY <br />
                    IN <span className="text-gradient">SOVEREIGN</span> COMFORT
                  </h1>
                  <p className="text-slate-400 text-base sm:text-xl font-bold max-w-2xl mx-auto leading-relaxed">
                    Secure, high-precision dispatch connecting you with premium Kashmiri transport units. Built for the valleys, the cities, and the highways.
                  </p>
                </div>
              ) : (
                <div className="space-y-6 animate-fade-in">
                  <h1 className="text-5xl sm:text-7xl md:text-8xl font-display font-black leading-[0.95] sm:leading-[0.85] tracking-tighter uppercase italic">
                    OWN YOUR ROUTE. <br />
                    EARN AT <span className="text-gradient-saffron">SAFFRON</span> RATES
                  </h1>
                  <p className="text-slate-400 text-base sm:text-xl font-bold max-w-2xl mx-auto leading-relaxed">
                    Upload credentials to our secure Document Vault and establish direct operational control. Fast clearances, premium client base, direct payouts.
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4 sm:gap-6 mt-10">
              <button 
                onClick={() => navigate('/login')}
                className={`px-12 py-5 text-xs font-black uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-3 transition-all ${
                  heroMode === 'passenger' ? 'btn-modern-primary' : 'btn-modern-secondary'
                }`}
              >
                {heroMode === 'passenger' ? 'SECURE PASSAGE' : 'COMMISSION VEHICLE'}
                <ChevronRight size={16} />
              </button>
              <a 
                href="#calculator"
                className="btn-ghost px-12 py-5 text-xs font-black uppercase tracking-[0.2em] border-white/10 hover:bg-white/5 flex items-center justify-center text-white"
              >
                ESTIMATE FARE
              </a>
            </div>

          </div>
        </div>

        {/* ── High-Fidelity Animated Mockup Map ── */}
        <div className="mt-20 max-w-5xl mx-auto px-4 sm:px-6 relative animate-slide-up">
          <div className="relative rounded-[32px] sm:rounded-[48px] overflow-hidden border border-white/10 bg-white/5 backdrop-blur-md p-3 sm:p-5">
            <div className="aspect-[16/10] sm:aspect-video bg-obsidian-card rounded-[24px] sm:rounded-[36px] border border-white/5 flex items-center justify-center overflow-hidden relative">
               
               {/* Telemetry Mockup Map Display */}
               <div className="absolute inset-0 bg-[#0c0d16] flex flex-col p-4 sm:p-8 select-none">
                  
                  {/* Top Dashboard Control Strip */}
                  <div className="flex justify-between items-center mb-6 sm:mb-10 relative z-10 shrink-0">
                     <div className="flex gap-2">
                        <div className="w-3.5 h-3.5 rounded-full bg-red-500/80" />
                        <div className="w-3.5 h-3.5 rounded-full bg-yellow-500/80" />
                        <div className="w-3.5 h-3.5 rounded-full bg-green-500/80" />
                     </div>
                     <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-xl border border-white/10 backdrop-blur-xl">
                        <Activity className="text-primary animate-pulse" size={14} />
                        <span className="text-[8px] sm:text-[9px] font-mono font-black uppercase tracking-widest text-primary">Live Valley Grid Signal: SECURE</span>
                     </div>
                  </div>

                  {/* Grid Content */}
                  <div className="flex-1 flex gap-4 sm:gap-8 relative min-h-0">
                     
                     {/* Left Telemetry Console */}
                     <div className="hidden md:block w-72 space-y-4 shrink-0 relative z-10">
                        
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
                           <p className="text-[8px] font-mono font-black text-slate-500 uppercase tracking-widest mb-2">ACTIVE VEHICLE</p>
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                 <Car size={20} />
                              </div>
                              <div>
                                 <p className="text-xs font-black uppercase">PILOT ALPHA-02</p>
                                 <p className="text-[9px] font-bold text-slate-400 uppercase">Srinagar District</p>
                              </div>
                           </div>
                        </div>

                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
                           <p className="text-[8px] font-mono font-black text-slate-500 uppercase tracking-widest mb-1.5">TELEMETRY Dossier</p>
                           <div className="space-y-2">
                              <div className="flex justify-between">
                                 <span className="text-[9px] font-bold text-slate-400">Route Distance</span>
                                 <span className="text-[9px] font-mono font-black text-white">18.4 KM</span>
                              </div>
                              <div className="flex justify-between">
                                 <span className="text-[9px] font-bold text-slate-400">ETA</span>
                                 <span className="text-[9px] font-mono font-black text-primary">~14 MIN</span>
                              </div>
                           </div>
                        </div>

                        <div className="p-5 bg-gradient-to-br from-primary/15 to-transparent rounded-2xl border-2 border-primary/30 text-center relative overflow-hidden">
                           <p className="text-[9px] font-black uppercase tracking-widest text-primary mb-1">PROPOSED FARE</p>
                           <p className="text-3xl font-display font-black italic">₹380.00</p>
                           <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1.5">Standard Fleet Carrier</p>
                        </div>
                     </div>

                     {/* Right Vector Map Simulation */}
                     <div className="flex-1 bg-white/[0.02] rounded-[28px] border border-white/5 relative overflow-hidden flex items-center justify-center">
                        
                        {/* Map Grid Vector Background */}
                        <div className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
                        
                        {/* Simulated Valley Topography Map Paths */}
                        <svg className="absolute inset-0 w-full h-full p-6" viewBox="0 0 500 300" fill="none" xmlns="http://www.w3.org/2000/svg">
                          {/* Route line */}
                          <path 
                            d="M 50 250 Q 150 50, 300 200 T 450 50" 
                            stroke="rgba(255,255,255,0.06)" 
                            strokeWidth="6" 
                            strokeLinecap="round" 
                          />
                          <path 
                            id="glowing-route"
                            d="M 50 250 Q 150 50, 300 200 T 450 50" 
                            stroke="url(#route-grad)" 
                            strokeWidth="4" 
                            strokeLinecap="round" 
                            strokeDasharray="8,8"
                            className="animate-shimmer"
                          />
                          
                          {/* Gradients */}
                          <defs>
                            <linearGradient id="route-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#DC2626" />
                              <stop offset="50%" stopColor="#F59E0B" />
                              <stop offset="100%" stopColor="#06b6d4" />
                            </linearGradient>
                          </defs>

                          {/* Pickup point marker */}
                          <circle cx="50" cy="250" r="8" fill="#DC2626" />
                          <circle cx="50" cy="250" r="16" stroke="#DC2626" strokeWidth="2" opacity="0.4" className="animate-ping" />

                          {/* Destination target flag */}
                          <circle cx="450" cy="50" r="8" fill="#06b6d4" />
                          <circle cx="450" cy="50" r="16" stroke="#06b6d4" strokeWidth="2" opacity="0.4" className="animate-ping" />

                          {/* Vehicle animated along path */}
                          <circle r="6" fill="#F59E0B" className="shadow-lg">
                            <animateMotion 
                              dur="12s" 
                              repeatCount="indefinite" 
                              path="M 50 250 Q 150 50, 300 200 T 450 50" 
                            />
                          </circle>
                        </svg>

                        {/* Top-Right Floating Status */}
                        <div className="absolute top-4 right-4 bg-obsidian/85 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-xl">
                           <p className="text-[7px] font-mono text-slate-500 uppercase tracking-widest leading-none mb-1">GPS LINK STATUS</p>
                           <p className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">ONLINE TRACKING</p>
                        </div>
                     </div>
                  </div>
               </div>

            </div>
          </div>
          {/* Accent glow behind mockup */}
          <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] bg-primary/10 blur-[120px] rounded-full opacity-40" />
        </div>
      </section>

      {/* ── Stats Telemetry Strip ── */}
      <section className="py-12 border-y border-white/5 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center">
            <h4 className="text-4xl sm:text-5xl font-display font-black text-primary mb-1">2,850+</h4>
            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-500">Missions Completed</p>
          </div>
          <div className="text-center">
            <h4 className="text-4xl sm:text-5xl font-display font-black text-secondary mb-1">182+</h4>
            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-500">Verified Fleet Pilots</p>
          </div>
          <div className="text-center">
            <h4 className="text-4xl sm:text-5xl font-display font-black text-primary mb-1">10</h4>
            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-500">Kashmiri Districts</p>
          </div>
          <div className="text-center">
            <h4 className="text-4xl sm:text-5xl font-display font-black text-secondary mb-1">4.92/5</h4>
            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-500">Average Review Dossier</p>
          </div>
        </div>
      </section>

      {/* ── Pricing Estimate Terminal (Calculator Widget) ── */}
      <section id="calculator" className="py-24 sm:py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid lg:grid-cols-12 gap-16 items-center">
            
            {/* Left Copy block */}
            <div className="lg:col-span-5 space-y-6">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-1 bg-primary rounded-full"></div>
                 <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary italic">Tariff Protocol</span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-display font-black italic uppercase tracking-tighter leading-none">
                PREDICTIVE <br />
                <span className="text-gradient">PRICE</span> CONSOLE
              </h2>
              <p className="text-slate-400 font-bold text-base leading-relaxed">
                Enter your exact pickup and drop districts inside the terminal simulator. Select your transport carrier class to receive transparent estimated fares, factored dynamically by regional demand metrics.
              </p>
              <div className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                 <Calculator className="text-primary shrink-0" size={24} />
                 <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                   *Estimates are calculated using a baseline algorithm. In-trip tariffs might vary slightly depending on extreme weather conditions or high-demand signals.
                 </p>
              </div>
            </div>

            {/* Right Calculator Card */}
            <div className="lg:col-span-7 relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-[40px] blur opacity-15 group-hover:opacity-25 transition duration-1000" />
              
              <div className="relative bg-obsidian-light p-6 sm:p-10 rounded-[36px] border border-white/10 shadow-2xl space-y-8">
                 
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Origin selector */}
                    <div>
                       <label className="text-[8px] font-mono font-black text-slate-500 uppercase tracking-widest block mb-2">ORIGIN DISTRICT</label>
                       <select 
                         value={pickup}
                         onChange={(e) => setPickup(e.target.value)}
                         className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-primary text-sm font-black uppercase tracking-wider transition-colors"
                       >
                          {KASHMIR_DISTRICTS.map(d => (
                            <option key={d.name} value={d.name} className="bg-obsidian-card text-white uppercase">{d.name}</option>
                          ))}
                       </select>
                    </div>

                    {/* Destination selector */}
                    <div>
                       <label className="text-[8px] font-mono font-black text-slate-500 uppercase tracking-widest block mb-2">TARGET DESTINATION</label>
                       <select 
                         value={drop}
                         onChange={(e) => setDrop(e.target.value)}
                         className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-primary text-sm font-black uppercase tracking-wider transition-colors"
                       >
                          {KASHMIR_DISTRICTS.map(d => (
                            <option key={d.name} value={d.name} className="bg-obsidian-card text-white uppercase">{d.name}</option>
                          ))}
                       </select>
                    </div>
                 </div>

                 {/* Vehicle Class Segmented Selector */}
                 <div>
                    <label className="text-[8px] font-mono font-black text-slate-500 uppercase tracking-widest block mb-3">VEHICLE CARRIER CLASS</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                       {VEHICLE_CLASSES.map(v => (
                          <button
                            key={v.id}
                            onClick={() => setVehicleClass(v.id)}
                            className={`p-5 rounded-2xl border flex flex-col items-center gap-3 transition-all ${
                              vehicleClass === v.id 
                                ? 'bg-primary/10 border-primary text-white shadow-glow-primary/20' 
                                : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                            }`}
                          >
                             {v.icon}
                             <span className="text-[10px] font-black uppercase tracking-widest">{v.label}</span>
                          </button>
                       ))}
                    </div>
                 </div>

                 {/* Fare Output Console */}
                 <div className="p-6 sm:p-8 bg-black/40 rounded-[28px] border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.02]">
                       <Compass size={120} className="animate-spin-slow" />
                    </div>
                    
                    <div className="text-center sm:text-left relative z-10 max-w-full sm:max-w-xs">
                       <p className="text-[8px] font-mono font-black text-slate-500 uppercase tracking-[0.2em] mb-1">PROPOSED ALLOTMENT</p>
                       {isRickshawRestricted ? (
                         <>
                           <p className="text-3xl font-display font-black italic text-rose leading-none">
                             RESTRICTED
                           </p>
                           <p className="text-[9px] font-bold text-rose/80 mt-2 uppercase tracking-wide leading-normal">
                             E-Rickshaws cannot perform cross-district transit. Choose a Sedan or Premium Cruiser.
                           </p>
                         </>
                       ) : (
                         <>
                           <p className="text-5xl font-display font-black italic text-primary leading-none">
                             ₹{estimatedFare}
                           </p>
                           <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-widest">
                             ESTIMATED DISTANCE: <span className="text-white font-mono font-bold">{estimatedDistance} KM</span>
                           </p>
                         </>
                       )}
                    </div>

                    <button 
                      onClick={() => !isRickshawRestricted && navigate('/login')}
                      disabled={isRickshawRestricted}
                      className={`w-full sm:w-auto px-10 py-5 rounded-2xl font-black uppercase text-xs tracking-widest transition-all shrink-0 ${
                        isRickshawRestricted 
                          ? 'bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed shadow-none' 
                          : 'bg-primary text-white shadow-glow-primary hover:scale-105 active:scale-95'
                      }`}
                    >
                       {isRickshawRestricted ? 'LOCKED' : 'SECURE BOOKING'}
                    </button>
                 </div>

              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ── Premium Features Grid ── */}
      <section id="features" className="py-24 sm:py-32 bg-white/[0.01] border-y border-white/5 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-xl mx-auto mb-20">
             <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-6 h-0.5 bg-primary rounded-full"></div>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary italic">Valley Specifications</span>
                <div className="w-6 h-0.5 bg-primary rounded-full"></div>
             </div>
             <h2 className="text-4xl sm:text-5xl font-display font-black uppercase italic tracking-tight">PREMIUM UTILITIES</h2>
             <p className="text-slate-500 font-bold uppercase tracking-widest text-[9px] mt-2">Engineered with precision protocols optimized for local terrain.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, i) => (
              <div key={i} className="card-modern group hover:border-primary/40 transition-all bg-obsidian-light border-white/10 p-8 flex flex-col justify-between h-full">
                <div>
                   <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                     {feature.icon}
                   </div>
                   <h3 className="text-xl font-display font-black uppercase italic mb-3 tracking-tight">{feature.title}</h3>
                   <p className="text-sm text-slate-400 font-semibold leading-relaxed">
                     {feature.description}
                   </p>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full mt-8 overflow-hidden">
                   <div className="w-0 h-full bg-primary group-hover:w-full transition-all duration-700" />
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── Kashmiri Operational Districts Grid ── */}
      <section className="py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-xl mx-auto mb-20">
             <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-6 h-0.5 bg-secondary rounded-full"></div>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-secondary italic">Active Sectors</span>
                <div className="w-6 h-0.5 bg-secondary rounded-full"></div>
             </div>
             <h2 className="text-4xl sm:text-5xl font-display font-black uppercase italic tracking-tight">TERRITORY OF OPERATION</h2>
             <p className="text-slate-500 font-bold uppercase tracking-widest text-[9px] mt-2">Active coverage and dispatch networks spanning 10 key districts.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-8">
             {KASHMIR_DISTRICTS.map((d, i) => (
                <div key={i} className="bg-white/5 p-6 rounded-[24px] border border-white/5 hover:border-primary/20 transition-all flex flex-col justify-between gap-6 group">
                   <div>
                      <div className="flex items-center justify-between mb-3">
                         <span className="text-[9px] font-mono text-slate-500 uppercase font-black">SECTOR #{i+1}</span>
                         <MapPin size={12} className="text-slate-600 group-hover:text-primary transition-colors" />
                      </div>
                      <h4 className="text-lg font-display font-black uppercase tracking-tight text-white">{d.name}</h4>
                   </div>
                   <div className="space-y-3">
                      <span className={`px-2.5 py-1 text-[8px] font-black uppercase tracking-wider rounded-md inline-block ${
                         d.status === 'HIGH DEMAND' ? 'bg-primary/10 text-primary border border-primary/20 animate-pulse' :
                         d.status === 'ACTIVE DUTY' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                         'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                      }`}>
                         {d.status}
                      </span>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                         Active: <span className="text-white font-mono">{d.activePilots} Units</span>
                      </p>
                   </div>
                </div>
             ))}
          </div>

        </div>
      </section>

      {/* ── Protocol & How It Works ── */}
      <section id="how-it-works" className="py-24 sm:py-32 bg-white/[0.01] border-t border-white/5 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="text-center max-w-xl mx-auto mb-20">
            <h2 className="text-4xl sm:text-5xl font-display font-black uppercase italic tracking-tight">OPERATIONAL PROTOCOL</h2>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[9px] mt-2">Three seamless steps to initialize secure, fast valley transit.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
             {/* Connection Lines (Desktop) */}
             <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-px border-t border-dashed border-white/10 -z-10" />
             
            {steps.map((step, i) => (
              <div key={i} className="text-center group">
                <div className="w-24 h-24 rounded-[32px] bg-obsidian-light border border-white/10 flex items-center justify-center mx-auto mb-8 group-hover:border-primary/50 transition-all shadow-glow-primary/0 group-hover:shadow-glow-primary/10">
                  <span className="text-3xl font-display font-black italic text-white group-hover:text-primary transition-colors">{step.number}</span>
                </div>
                <h3 className="text-2xl font-display font-black uppercase italic mb-3 tracking-tight">{step.title}</h3>
                <p className="text-slate-400 font-semibold text-sm leading-relaxed max-w-xs mx-auto">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tactical Action CTA Footer ── */}
      <section className="py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-[32px] sm:rounded-[56px] bg-gradient-to-br from-primary/15 to-transparent p-8 sm:p-16 md:p-24 overflow-hidden text-center group border border-primary/20">
             
             {/* Abstract Atmospheric Gradients */}
             <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform duration-1000 pointer-events-none" />
             <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 group-hover:scale-125 transition-transform duration-1000 pointer-events-none" />

             <div className="relative z-10 max-w-3xl mx-auto">
                <h2 className="text-4xl sm:text-6xl font-display font-black uppercase italic mb-6 tracking-tighter">
                   Ready to Start <br />
                   Your Valley <span className="text-gradient">Commute?</span>
                </h2>
                <p className="text-slate-400 font-bold text-base sm:text-lg mb-12 max-w-xl mx-auto leading-relaxed">
                   Establish connection, secure your fleet partner, and experience the finest ride-sharing network built for the valleys of Kashmir.
                </p>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4 sm:gap-6">
                  <button onClick={() => navigate('/login')} className="btn-modern-primary px-12 py-5 text-xs font-black uppercase tracking-widest">
                     LAUNCH CONSOLE
                  </button>
                  <button onClick={() => navigate('/login')} className="btn-ghost border-white/10 text-white hover:bg-white/5 px-12 py-5 text-xs font-black uppercase tracking-widest">
                     JOIN AS PARTNER PILOT
                  </button>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-16 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-10 text-center md:text-left">
           
           <div className="flex items-center gap-4 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="relative w-11 h-9 flex items-center justify-center overflow-visible">
               <div className="relative w-full h-full bg-primary rounded-lg flex items-center justify-center">
                  <div className="relative flex items-center justify-center w-full">
                    <Car className="text-white absolute transition-all duration-500 translate-x-[-3px] group-hover:translate-x-[-10px] group-hover:scale-110" size={14} />
                    <Truck className="text-white absolute transition-all duration-500 translate-x-[4px] group-hover:translate-x-[10px] group-hover:scale-110" size={14} />
                  </div>
               </div>
            </div>
            <span className="text-xl font-display font-black italic tracking-tighter uppercase">
              Kashmir<span className="text-primary">Move</span>
            </span>
          </div>

          <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.25em]">© 2026 KashmirMove. Developed specifically for the valley.</p>
          
          <div className="flex gap-6">
             <Globe className="text-slate-500 hover:text-white cursor-pointer transition-colors" size={18} />
             <Users className="text-slate-500 hover:text-white cursor-pointer transition-colors" size={18} />
             <Star className="text-slate-500 hover:text-white cursor-pointer transition-colors" size={18} />
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
