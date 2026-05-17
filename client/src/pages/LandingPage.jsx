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
  Truck
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: <Zap className="text-primary" size={28} />,
      title: "Real-time Tracking",
      description: "Watch your pilot approach in real-time with high-precision GPS integration."
    },
    {
      icon: <Shield className="text-secondary" size={28} />,
      title: "Secure & Trusted",
      description: "Every pilot is verified and every trip is monitored for your peace of mind."
    },
    {
      icon: <Zap className="text-saffron" size={28} />,
      title: "Instant Matching",
      description: "Our advanced algorithm connects you to the nearest pilot in seconds."
    },
    {
      icon: <CreditCard className="text-arctic" size={28} />,
      title: "Cashless Payments",
      description: "Seamlessly pay via integrated wallet or digital payment options."
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Set Destination",
      description: "Enter your pickup point and destination to see estimated fares."
    },
    {
      number: "02",
      title: "Match Pilot",
      description: "We'll find the best rated pilot nearby for your specific vehicle choice."
    },
    {
      number: "03",
      title: "Enjoy the Ride",
      description: "Track your journey and arrive safely at your destination."
    }
  ];

  return (
    <div className="min-h-screen bg-midnight text-white selection:bg-primary/30 selection:text-primary overflow-x-hidden">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${isScrolled ? 'bg-midnight/80 backdrop-blur-xl border-b border-white/5 py-4' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="relative w-14 h-12 flex items-center justify-center overflow-visible">
               <div className="relative w-full h-full bg-primary rounded-xl flex items-center justify-center">
                  <div className="relative flex items-center justify-center w-full">
                    {/* Overlapping initial state, splitting on hover */}
                    <Car className="text-white absolute transition-all duration-500 translate-x-[-4px] group-hover:translate-x-[-14px] group-hover:scale-110" size={20} />
                    <Truck className="text-white absolute transition-all duration-500 translate-x-[6px] group-hover:translate-x-[14px] group-hover:scale-110" size={20} />
                  </div>
               </div>
            </div>
            <span className="text-2xl font-display font-black italic tracking-tight uppercase pr-6">
              Kashmir<span className="text-primary">Move</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-10">
            <a href="#features" className="text-sm font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors">How it works</a>
            <Link to="/login" className="text-sm font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Login</Link>
            <button onClick={() => navigate('/login')} className="btn-modern-primary py-2.5 px-8 text-xs uppercase tracking-widest">
              Get Started
            </button>
          </div>

          <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-midnight border-b border-white/10 p-6 flex flex-col gap-6 md:hidden animate-fade-in">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold">Features</a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold">How it works</a>
            <Link to="/login" className="text-lg font-bold">Login</Link>
            <button onClick={() => navigate('/login')} className="btn-modern-primary w-full py-4 uppercase tracking-widest font-black">Get Started</button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse-slow" />
          <div className="absolute bottom-[10%] right-[-10%] w-[30%] h-[30%] bg-arctic/10 rounded-full blur-[100px] animate-pulse-slow delay-1000" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 overflow-visible">
          <div className="text-center max-w-5xl mx-auto overflow-visible">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 animate-fade-in">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Live in 10 Districts Across Kashmir</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-display font-black leading-[0.9] tracking-tight mb-8 uppercase italic animate-slide-up px-10 overflow-visible">
              The Future of <span className="text-primary italic inline-block pr-4">Mobility</span> <br />
              In <span className="text-gradient-saffron inline-block pr-8">Kashmir</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-400 font-medium max-w-2xl mx-auto mb-12 animate-slide-up animate-delay-100">
              Reliable, secure, and instant ride-sharing for the valley. From daily commutes to logistic moves, we've got you covered.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-slide-up animate-delay-200">
              <button onClick={() => navigate('/login')} className="btn-modern-primary group px-10 py-5 text-sm uppercase tracking-[0.2em]">
                Book Your Ride <ChevronRight className="group-hover:translate-x-1 transition-transform" size={18} />
              </button>
              <button className="btn-ghost px-10 py-5 text-sm uppercase tracking-[0.2em] border-white/10 text-white hover:bg-white/5">
                Join as Pilot
              </button>
            </div>
          </div>
        </div>

        {/* Floating Vehicle Mockup */}
        <div className="mt-20 max-w-5xl mx-auto px-6 relative animate-slide-up animate-delay-300">
          <div className="relative rounded-[40px] overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm p-4">
            <div className="aspect-video bg-midnight/40 rounded-[32px] border border-white/5 flex items-center justify-center overflow-hidden">
               {/* Simplified Mockup UI */}
               <div className="w-full h-full p-8 flex flex-col">
                  <div className="flex justify-between items-center mb-8">
                     <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                     </div>
                     <div className="px-4 py-2 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest">Active Pilots: 142</div>
                  </div>
                  <div className="flex-1 flex gap-8">
                     <div className="w-1/3 space-y-4">
                        <div className="h-12 bg-white/5 rounded-2xl" />
                        <div className="h-12 bg-white/5 rounded-2xl" />
                        <div className="h-24 bg-primary/20 rounded-2xl border border-primary/30" />
                     </div>
                     <div className="flex-1 bg-white/5 rounded-[32px] border border-white/10 relative overflow-hidden">
                        <div className="absolute inset-0 bg-primary/5 animate-pulse" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                           <Navigation className="text-primary animate-float" size={48} />
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          </div>
          {/* Accent Glows */}
          <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary/20 blur-[100px] rounded-full opacity-50" />
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-12 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center">
            <h4 className="text-4xl font-display font-black text-primary mb-1">2.5k+</h4>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Rides Completed</p>
          </div>
          <div className="text-center">
            <h4 className="text-4xl font-display font-black text-saffron mb-1">150+</h4>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Verified Pilots</p>
          </div>
          <div className="text-center">
            <h4 className="text-4xl font-display font-black text-arctic mb-1">10</h4>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Districts Covered</p>
          </div>
          <div className="text-center">
            <h4 className="text-4xl font-display font-black text-secondary mb-1">4.9/5</h4>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Avg. Rating</p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-20">
            <h2 className="text-4xl md:text-6xl font-display font-black uppercase italic mb-6">Premium <br /> <span className="text-primary">Features</span></h2>
            <p className="text-slate-400 font-medium max-w-xl">Designed for the unique landscape of the valley, providing seamless connectivity through technology.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, i) => (
              <div key={i} className="card-modern group hover:border-primary/50 transition-all bg-white/5 border-white/10 p-8">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
                <p className="text-sm text-slate-400 font-medium leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-32 bg-white/[0.02] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-display font-black uppercase italic mb-6">How It <span className="text-arctic">Works</span></h2>
            <p className="text-slate-400 font-medium max-w-xl mx-auto">Three simple steps to start your journey with KashmirMove.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
             {/* Connection Lines (Desktop) */}
             <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-px border-t border-dashed border-white/10 -z-10" />
             
            {steps.map((step, i) => (
              <div key={i} className="text-center group">
                <div className="w-24 h-24 rounded-full bg-midnight border border-white/10 flex items-center justify-center mx-auto mb-8 group-hover:border-primary/50 transition-all shadow-glow-saffron/0 group-hover:shadow-glow-saffron/20">
                  <span className="text-3xl font-display font-black italic text-white group-hover:text-primary transition-colors">{step.number}</span>
                </div>
                <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
                <p className="text-slate-400 font-medium">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="relative rounded-[48px] bg-gradient-to-br from-primary to-midnight-100 p-12 md:p-24 overflow-hidden text-center group">
             {/* Abstract Shapes */}
             <div className="absolute top-0 right-0 w-96 h-96 bg-arctic/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform duration-1000" />
             <div className="absolute bottom-0 left-0 w-64 h-64 bg-saffron/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 group-hover:scale-125 transition-transform duration-1000" />

             <div className="relative z-10 max-w-2xl mx-auto">
                <h2 className="text-4xl md:text-6xl font-display font-black uppercase italic mb-8">Ready to <br /> Start Your <span className="text-arctic">Journey?</span></h2>
                <p className="text-white/80 font-medium text-lg mb-12">Join thousands of riders and pilots moving Kashmir forward every day.</p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                  <button onClick={() => navigate('/login')} className="btn-modern-primary px-12 py-5 text-sm uppercase tracking-widest font-black">Register as Rider</button>
                  <button className="btn-ghost border-white/20 text-white hover:bg-white/10 px-12 py-5 text-sm uppercase tracking-widest font-black">Register as Pilot</button>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:row justify-between items-center gap-8">
           <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="relative w-10 h-8 flex items-center justify-center overflow-visible">
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
          <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em]">© 2026 KashmirMove. Built for the Valley.</p>
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
