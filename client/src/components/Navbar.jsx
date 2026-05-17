import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Car, Truck, Menu, X, ShieldCheck } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed w-full z-[1000] top-0 left-0 transition-all duration-300 bg-obsidian/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative w-12 h-10 flex items-center justify-center overflow-visible">
               <div className="relative w-full h-full bg-primary rounded-xl flex items-center justify-center">
                  <div className="relative flex items-center justify-center w-full">
                    <Car className="text-white absolute transition-all duration-500 translate-x-[-4px] group-hover:translate-x-[-12px] group-hover:scale-110" size={18} />
                    <Truck className="text-white absolute transition-all duration-500 translate-x-[6px] group-hover:translate-x-[12px] group-hover:scale-110" size={18} />
                  </div>
               </div>
            </div>
            <span className="text-2xl font-display font-black italic tracking-tighter uppercase text-white">
              Kashmir<span className="text-primary">Move</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/features" className="text-xs font-black uppercase tracking-widest text-slate-300 hover:text-primary transition-colors">Features</Link>
            <Link to="/safety" className="text-xs font-black uppercase tracking-widest text-slate-300 hover:text-primary transition-colors">Safety</Link>
            <div className="h-6 w-px bg-white/10"></div>
            <Link to="/login" className="text-xs font-black uppercase tracking-widest text-white hover:text-primary transition-colors">Sign In</Link>
            <Link to="/register" className="btn-modern-primary py-3 px-6 text-[10px] tracking-widest shadow-lg">
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="text-white hover:text-primary transition-colors p-2"
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <div className={`md:hidden absolute w-full bg-obsidian border-b border-white/5 transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
        <div className="px-4 pt-2 pb-6 space-y-2 shadow-2xl">
          <Link 
            to="/features" 
            onClick={() => setIsOpen(false)}
            className="block px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-300 hover:bg-white/5 hover:text-primary rounded-xl"
          >
            Features
          </Link>
          <Link 
            to="/safety" 
            onClick={() => setIsOpen(false)}
            className="px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-300 hover:bg-white/5 hover:text-primary rounded-xl flex items-center justify-between"
          >
            Safety Protocols <ShieldCheck size={16} className="text-emerald-500" />
          </Link>
          <div className="h-px w-full bg-white/10 my-4"></div>
          <Link 
            to="/login" 
            onClick={() => setIsOpen(false)}
            className="block px-4 py-3 text-xs font-black uppercase tracking-widest text-white hover:bg-white/5 hover:text-primary rounded-xl"
          >
            Sign In
          </Link>
          <Link 
            to="/register" 
            onClick={() => setIsOpen(false)}
            className="block px-4 py-4 mt-2 text-center btn-modern-primary text-[10px] tracking-widest w-full"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
