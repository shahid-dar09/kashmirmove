import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import api from '../../services/api';
import { 
  Truck, Star, Phone, 
  Search, ShieldCheck,
  RefreshCcw, Filter, Mail, X, ExternalLink, TrendingUp, Zap, Clock, Wallet, ShieldAlert,
  Activity, Shield, ChevronRight
} from 'lucide-react';

const AllDrivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Modal States
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [driverDocs, setDriverDocs] = useState([]);
  const [commandMessage, setCommandMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showContactModal || showDetailsModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showContactModal, showDetailsModal]);

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/drivers/all');
      setDrivers(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Defer update to avoid cascading render warning
    Promise.resolve().then(() => {
      fetchDrivers();
    });
  }, [fetchDrivers]);

  const filteredDrivers = drivers.filter(d => {
    const matchesSearch = d.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          d.vehicle_model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          d.vehicle_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openContact = (driver) => {
    setSelectedDriver(driver);
    setShowContactModal(true);
  };

  const fetchDriverDocs = async (driverId) => {
    try {
      const res = await api.get(`/admin/drivers/${driverId}/documents`);
      if (res.data.success) {
        setDriverDocs(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching docs:', error);
    }
  };

  const openDetails = (driver) => {
    setSelectedDriver(driver);
    setDriverDocs([]); // Reset
    fetchDriverDocs(driver.driver_id);
    setShowDetailsModal(true);
  };

  const handleSendCommand = async () => {
    if (!commandMessage.trim()) return;
    setIsSending(true);
    try {
      const res = await api.post(`/admin/drivers/${selectedDriver.driver_id}/send-message`, {
        message: commandMessage
      });
      if (res.data.success) {
        alert('Priority Command Dispatched to Pilot Dashboard!');
        setCommandMessage('');
        setShowContactModal(false);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to dispatch command.');
    } finally {
      setIsSending(false);
    }
  };

  const [isUpdating, setIsUpdating] = useState(null);

  const handleToggleDriverStatus = async (driverId, currentStatus) => {
    const newStatus = currentStatus === 'suspended' ? 'approved' : 'suspended';
    const confirmMsg = `Are you sure you want to ${newStatus === 'suspended' ? 'SUSPEND' : 'ACTIVATE'} this driver?`;
    
    if (!window.confirm(confirmMsg)) return;

    setIsUpdating(driverId);
    try {
      await api.put(`/admin/drivers/${driverId}/status`, { status: newStatus });
      setDrivers(prev => prev.map(d => d.driver_id === driverId ? { ...d, status: newStatus } : d));
      if (selectedDriver?.driver_id === driverId) {
        setSelectedDriver(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update driver status');
    } finally {
      setIsUpdating(null);
    }
  };

  if (loading && drivers.length === 0) return (
    <div className="flex-1 flex flex-col items-center justify-center space-y-6 min-h-[500px]">
      <div className="relative">
         <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
         <Activity className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary" size={20} />
      </div>
      <p className="font-display font-black text-slate-500 uppercase tracking-[0.4em] text-[10px] animate-pulse">Cataloging Fleet Partners</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-10 sm:space-y-12 animate-fade-in pb-20 pt-6">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 px-4 sm:px-0">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
             <div className="w-12 h-1 bg-primary rounded-full"></div>
             <span className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-500 italic">Fleet Management</span>
          </div>
          <h2 className="text-4xl sm:text-7xl font-display font-black tracking-tighter italic uppercase leading-[0.9] sm:leading-[0.85] text-slate-900 dark:text-white">
            PARTNER <span className="text-primary">CATALOG</span>
          </h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Full registry and operational monitoring of all transport units.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
           <button 
            onClick={() => {
              const headers = ["Name", "Email", "Phone", "Status", "Vehicle Model", "Vehicle Number", "Rating", "Trips", "Earnings"];
              const rows = filteredDrivers.map(d => [
                d.name,
                d.email,
                d.phone,
                d.status,
                d.vehicle_model || 'N/A',
                d.vehicle_number || 'N/A',
                d.rating || '5.0',
                d.total_trips || 0,
                d.earnings || 0
              ]);
              
              const csvContent = "data:text/csv;charset=utf-8," 
                + headers.join(",") + "\n"
                + rows.map(r => r.join(",")).join("\n");
              
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement("a");
              link.setAttribute("href", encodedUri);
              link.setAttribute("download", `kashmirmove_drivers_${new Date().toISOString().split('T')[0]}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="flex-1 lg:px-8 py-5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-[1.8rem] font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 dark:hover:bg-white/10 transition-all shadow-xl flex items-center justify-center gap-3"
          >
             <TrendingUp size={16} /> EXPORT CATALOG
           </button>
           <button onClick={fetchDrivers} className="flex-1 lg:w-16 h-16 rounded-[1.5rem] bg-primary text-obsidian flex items-center justify-center shadow-glow-saffron hover:scale-110 active:scale-95 transition-all">
             <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
           </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-6 px-4 sm:px-0">
        <div className="flex-1 relative group">
          <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-all" size={24} />
          <input 
            type="text" 
            placeholder="Search by name, vehicle class or unit number..." 
            className="w-full h-16 sm:h-20 pl-14 sm:pl-20 pr-6 sm:pr-10 bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-white/10 rounded-[1.5rem] sm:rounded-[2.5rem] focus:border-primary outline-none transition-all font-black text-base sm:text-lg text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:font-normal italic shadow-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative z-20">
           <button 
             onClick={() => setShowFilters(!showFilters)} 
             className={`h-16 sm:h-20 w-full sm:w-auto px-6 sm:px-10 rounded-[1.5rem] sm:rounded-[2rem] border-2 flex items-center justify-center gap-4 font-black uppercase tracking-widest text-xs transition-all shadow-xl ${
               statusFilter !== 'all' || showFilters 
                 ? 'bg-primary border-primary text-obsidian shadow-glow-saffron' 
                 : 'bg-white dark:bg-white/5 border-slate-100 dark:border-white/10 text-slate-500 hover:border-primary hover:text-primary'
             }`}
           >
              <Filter size={20} />
              <span>
                {statusFilter === 'all' ? 'Filter Protocols' : statusFilter}
              </span>
           </button>
           
           {showFilters && (
              <div className="absolute top-full mt-4 right-0 w-64 bg-white/95 dark:bg-obsidian/95 backdrop-blur-xl border-2 border-slate-100 dark:border-white/10 rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden animate-slide-up">
                 {['all', 'approved', 'suspended', 'pending'].map(f => (
                    <button 
                      key={f}
                      onClick={() => { setStatusFilter(f); setShowFilters(false); }}
                      className={`w-full text-left px-8 py-5 text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-between ${
                        statusFilter === f 
                          ? 'bg-primary/10 text-primary' 
                          : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-white/10'
                      }`}
                    >
                      {f === 'all' ? 'All Units' : f === 'approved' ? 'Active Duty' : `${f} Status`}
                      {statusFilter === f && <ShieldCheck size={14} />}
                    </button>
                 ))}
              </div>
           )}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 px-4 sm:px-0">
        {filteredDrivers.map((driver) => (
          <div key={driver.driver_id} className="group animate-slide-up bg-white dark:bg-obsidian border-white/5 rounded-[2rem] sm:rounded-[4rem] p-6 sm:p-10 shadow-2xl relative overflow-hidden flex flex-col h-full hover:border-primary/40 transition-all">
            <div className="absolute -right-10 -top-10 opacity-[0.02] group-hover:opacity-[0.06] transition-opacity">
               <Shield size={200} />
            </div>
            
            <div className="relative z-10 flex flex-col h-full">
               <div className="flex items-center gap-5 sm:gap-6 mb-8 sm:mb-10">
                 <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[1.5rem] sm:rounded-[2rem] bg-slate-100 dark:bg-white/10 border border-white/5 flex items-center justify-center overflow-hidden shadow-xl group-hover:scale-110 transition-transform shrink-0">
                   {driver.avatar_url ? (
                     <img src={`http://${window.location.hostname}:5000${driver.avatar_url}`} alt="" className="w-full h-full object-cover" />
                   ) : (
                     <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${driver.name}`} alt="" className="w-full h-full scale-110" />
                   )}
                 </div>
                 <div className="min-w-0 flex-1">
                     <h4 className="text-2xl font-display font-black tracking-tight italic text-slate-900 dark:text-white leading-tight mb-3 group-hover:text-primary transition-colors break-words">{driver.name}</h4>
                     <div className="flex items-center gap-3">
                       <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${driver.status === 'approved' ? 'bg-emerald-500 shadow-glow-emerald' : driver.status === 'suspended' ? 'bg-red-500 shadow-glow-red animate-pulse' : 'bg-amber-500 shadow-glow-amber'}`}></div>
                       <span className={`text-[10px] font-black uppercase tracking-[0.2em] italic ${driver.status === 'approved' ? 'text-emerald-500' : driver.status === 'suspended' ? 'text-red-500' : 'text-amber-500'}`}>
                         {driver.status === 'approved' ? 'Active Duty' : driver.status}
                       </span>
                     </div>
                  </div>
               </div>
 
               <div className="space-y-3 mb-10 flex-1">
                 {/* Fleet Unit */}
                 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 dark:bg-white/5 px-5 sm:px-6 py-3.5 rounded-2xl border border-transparent hover:border-white/5 transition-all">
                    <div className="flex items-center gap-3 text-slate-400">
                       <Truck size={14} />
                       <span className="text-[9px] font-black uppercase tracking-widest italic">Fleet Unit</span>
                    </div>
                    <div className="flex items-center gap-3 min-w-0">
                       <p className="text-[11px] font-black text-slate-900 dark:text-white truncate uppercase italic">{driver.vehicle_model || 'Standard'}</p>
                       <span className="text-[11px] font-black text-primary uppercase italic">{driver.vehicle_number}</span>
                    </div>
                 </div>

                 {/* Vehicle Class */}
                 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 dark:bg-white/5 px-5 sm:px-6 py-3.5 rounded-2xl border border-transparent hover:border-white/5 transition-all">
                    <div className="flex items-center gap-3 text-slate-400">
                       <Zap size={14} className="text-primary" />
                       <span className="text-[9px] font-black uppercase tracking-widest italic">Vehicle Class</span>
                    </div>
                    <span className="text-[10px] font-black text-primary uppercase italic bg-primary/10 border border-primary/20 px-3 py-1 rounded-lg">
                      {driver.vehicle_type || 'Standard'}
                    </span>
                 </div>

                 {/* Voice Link */}
                 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 dark:bg-white/5 px-5 sm:px-6 py-3.5 rounded-2xl border border-transparent hover:border-white/5 transition-all">
                    <div className="flex items-center gap-3 text-slate-400">
                       <Phone size={14} className="text-emerald-500" />
                       <span className="text-[9px] font-black uppercase tracking-widest italic">Voice Link</span>
                    </div>
                    <a href={`tel:${driver.phone}`} className="text-xs font-bold text-slate-900 dark:text-white hover:text-primary transition-colors">
                      {driver.phone}
                    </a>
                 </div>

                 {/* Secure Mail */}
                 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 dark:bg-white/5 px-5 sm:px-6 py-3.5 rounded-2xl border border-transparent hover:border-white/5 transition-all min-w-0">
                    <div className="flex items-center gap-3 text-slate-400 shrink-0">
                       <Mail size={14} className="text-blue-500" />
                       <span className="text-[9px] font-black uppercase tracking-widest italic">Secure Mail</span>
                    </div>
                    <a href={`mailto:${driver.email}`} className="text-xs font-bold text-slate-900 dark:text-white hover:text-primary transition-colors truncate max-w-[150px] sm:max-w-[180px]" title={driver.email}>
                      {driver.email}
                    </a>
                 </div>

                 {/* Performance Dossier Stats */}
                 <div className="grid grid-cols-2 gap-3">
                   <div className="flex items-center justify-between bg-slate-50 dark:bg-white/5 px-5 py-3 rounded-2xl border border-transparent hover:border-white/5 transition-all">
                      <div className="flex items-center gap-2 text-slate-400">
                         <Star size={13} className="text-amber-500" fill="currentColor" />
                         <span className="text-[8px] font-black uppercase tracking-widest italic">Rating</span>
                      </div>
                      <p className="text-xs font-display font-black italic text-slate-900 dark:text-white">{driver.rating || '5.0'}</p>
                   </div>

                   <div className="flex items-center justify-between bg-slate-50 dark:bg-white/5 px-5 py-3 rounded-2xl border border-transparent hover:border-white/5 transition-all">
                      <div className="flex items-center gap-2 text-slate-400">
                         <Activity size={13} />
                         <span className="text-[8px] font-black uppercase tracking-widest italic">Trips</span>
                      </div>
                      <p className="text-xs font-display font-black italic text-slate-900 dark:text-white">{driver.total_trips || '0'}</p>
                   </div>
                 </div>
              </div>

              <div className="pt-8 border-t border-slate-100 dark:border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <button 
                  onClick={() => openContact(driver)}
                  className="py-5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-white/10 transition-all flex items-center justify-center gap-3 text-slate-500 dark:text-white"
                 >
                   <Mail size={16} /> CONTACT
                 </button>
                 <button 
                  onClick={() => openDetails(driver)}
                  className="py-5 bg-primary text-obsidian rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-glow-saffron hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
                 >
                   DETAILS <ChevronRight size={16} />
                 </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredDrivers.length === 0 && (
        <div className="py-24 sm:py-40 px-4 text-center card-modern bg-white dark:bg-white/5 border-white/5 rounded-[2rem] sm:rounded-[4rem]">
           <Filter size={64} className="mx-auto mb-8 opacity-10 text-slate-400" />
           <h3 className="text-3xl font-display font-black italic uppercase tracking-tight text-slate-900 dark:text-white mb-3">No Units Located</h3>
           <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No partners match your current filter parameters.</p>
           <button onClick={() => setSearchTerm('')} className="mt-8 text-primary font-black uppercase tracking-widest text-[10px] hover:underline">RESET SEARCH TERMINAL</button>
        </div>
      )}

      {/* MODALS RENDERED VIA PORTAL */}
      {/* MODALS RENDERED VIA PORTAL */}
      {showContactModal && selectedDriver && createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in overflow-hidden">
           <div className="w-full max-w-md bg-gradient-to-br from-slate-900 via-obsidian to-slate-900 rounded-[2.5rem] shadow-[0_50px_150px_-20px_rgba(0,0,0,0.85)] border border-white/10 overflow-hidden animate-slide-up relative">
              
              {/* Top Accent Line */}
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary to-amber-500 z-50" />

              <div className="p-8 sm:p-10 relative">
                 
                 {/* Secure Centered Header */}
                 <div className="flex flex-col items-center text-center mt-2 mb-6">
                    <div className="relative shrink-0 mb-4 group">
                       <div className="absolute -inset-0.5 rounded-[1.6rem] bg-gradient-to-tr from-primary to-amber-500 opacity-60 group-hover:opacity-100 transition duration-300" />
                       <div className="w-16 h-16 bg-obsidian rounded-[1.4rem] p-1 relative z-10 border border-white/10 shadow-2xl flex items-center justify-center overflow-hidden">
                          {selectedDriver.avatar_url ? (
                            <img src={`http://${window.location.hostname}:5000${selectedDriver.avatar_url}`} alt="" className="w-full h-full object-cover rounded-[1rem]" />
                          ) : (
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedDriver.name}`} alt="" className="w-full h-full scale-110" />
                          )}
                       </div>
                    </div>
                    
                    <h3 className="text-2xl font-display font-black italic uppercase tracking-tighter text-white leading-none mb-1.5">
                      SECURE <span className="text-primary">UPLINK</span>
                    </h3>
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.25em] italic">
                      PILOT DOSSIER #{selectedDriver.id || 'N/A'} • {selectedDriver.name}
                    </p>
                 </div>

                 {/* Compact Communication Details (Glass Badges) */}
                 <div className="grid grid-cols-2 gap-3 mb-6">
                    <a 
                      href={`mailto:${selectedDriver.email}`}
                      className="flex items-center justify-center gap-2 py-2 px-3 bg-slate-950/40 rounded-xl border border-white/5 hover:border-primary/20 transition-all text-white/70 hover:text-white group relative overflow-hidden"
                    >
                       <Mail size={12} className="text-primary" />
                       <span className="text-[10px] font-mono font-bold truncate max-w-[120px]">{selectedDriver.email}</span>
                    </a>
                    
                    <a 
                      href={`tel:${selectedDriver.phone}`}
                      className="flex items-center justify-center gap-2 py-2 px-3 bg-slate-950/40 rounded-xl border border-white/5 hover:border-emerald-500/20 transition-all text-white/70 hover:text-white group relative overflow-hidden"
                    >
                       <Phone size={12} className="text-emerald-500" />
                       <span className="text-[10px] font-mono font-bold truncate">{selectedDriver.phone}</span>
                    </a>
                 </div>

                 {/* Monospace Command Input Area */}
                 <div className="mb-6">
                    <div className="flex items-center gap-2 mb-2 ml-1">
                       <Zap size={11} className="text-primary" />
                       <span className="text-[8px] font-black uppercase tracking-[0.25em] text-white/40 italic">Priority Command Broadcast</span>
                    </div>
                    <div className="relative group">
                       <textarea 
                          placeholder="TRANSMIT SECURE OPERATIONAL COMMAND TO PILOT TERMINAL..."
                          value={commandMessage}
                          onChange={(e) => setCommandMessage(e.target.value)}
                          disabled={isSending}
                          className="w-full bg-slate-950/50 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white focus:border-primary/40 focus:ring-2 focus:ring-primary/10 outline-none transition-all h-24 shadow-inner placeholder:text-white/10 resize-none italic leading-relaxed"
                       ></textarea>
                       <div className="absolute bottom-3 right-4 text-[7px] font-mono font-black text-white/20 tracking-widest pointer-events-none">
                          SECURE LAYER • TRANS-WARP
                       </div>
                    </div>
                 </div>

                 {/* Side-by-Side Tactical Action Buttons */}
                 <div className="flex gap-3 mb-4">
                    <button 
                       onClick={() => setShowContactModal(false)}
                       className="w-1/3 py-3.5 bg-transparent border border-white/10 hover:border-white/25 hover:bg-white/5 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] text-white/50 hover:text-white transition-all"
                    >
                       CANCEL
                    </button>
                    
                    <button 
                       onClick={handleSendCommand}
                       disabled={isSending || !commandMessage.trim()}
                       className="w-2/3 py-3.5 bg-gradient-to-r from-primary to-amber-500 hover:from-primary hover:to-amber-400 text-obsidian rounded-2xl font-black uppercase tracking-[0.2em] text-[9px] shadow-glow-saffron hover:scale-[1.01] active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-30 disabled:scale-100 disabled:shadow-none"
                    >
                       {isSending ? (
                         <>
                           <Activity size={12} className="animate-pulse" /> DISPATCHING...
                         </>
                       ) : (
                         <>
                           DISPATCH COMMAND <ExternalLink size={12} />
                         </>
                       )}
                    </button>
                 </div>

                 {/* Secure encryption footer signature */}
                 <div className="text-center text-[7px] font-mono font-black text-white/20 uppercase tracking-[0.3em] mt-3">
                    PROTOCOL: SECURE COMMAND UPLINK ACTIVE
                 </div>

              </div>
           </div>
        </div>,
        document.body
      )}

      {showDetailsModal && selectedDriver && createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-8 bg-black/85 backdrop-blur-sm animate-fade-in overflow-hidden">
           <div className="w-full max-w-6xl bg-gradient-to-br from-slate-900 via-obsidian to-slate-900 rounded-[2rem] sm:rounded-[4rem] shadow-[0_50px_200px_-20px_rgba(0,0,0,0.9)] border border-white/10 overflow-hidden animate-slide-up relative flex flex-col max-h-[90vh]">
              <button 
                onClick={() => setShowDetailsModal(false)}
                className="absolute top-4 right-4 sm:top-6 sm:right-6 z-[60] w-10 h-10 sm:w-12 sm:h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-red-500 transition-all shadow-2xl"
              >
                <X size={20} />
              </button>
 
              {/* Premium Glassmorphic Hero Header (Sleek Compact & GPU Optimized) */}
              <div 
                className="relative p-6 sm:p-8 border-b border-white/10 shrink-0 overflow-hidden"
                style={{
                  backgroundImage: `
                    radial-gradient(circle at top right, rgba(245, 158, 11, 0.08) 0%, transparent 60%),
                    radial-gradient(circle at bottom left, rgba(16, 185, 129, 0.04) 0%, transparent 50%),
                    linear-gradient(to bottom right, #0f172a, #0b0f19, #020617)
                  `
                }}
              >
                 <Activity size={180} className="absolute -right-16 -top-16 text-white/[0.02] rotate-12 pointer-events-none" />
                 
                 <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                    {/* Avatar Container with neon frame */}
                    <div className="relative shrink-0 group">
                       <div className="absolute -inset-0.5 rounded-[1.8rem] bg-gradient-to-tr from-primary to-amber-500 opacity-60 group-hover:opacity-100 transition duration-300" />
                       <div className="w-24 h-24 bg-obsidian rounded-[1.6rem] p-1.5 relative z-10 border border-white/10 shadow-2xl flex items-center justify-center overflow-hidden">
                          {selectedDriver.avatar_url ? (
                            <img src={`http://${window.location.hostname}:5000${selectedDriver.avatar_url}`} alt="" className="w-full h-full object-cover rounded-[1.1rem]" />
                          ) : (
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedDriver.name}`} alt="" className="w-full h-full scale-110" />
                          )}
                       </div>
                       <div className="absolute -bottom-1 -right-1 z-20 w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-obsidian shadow-glow-saffron border-2 border-obsidian">
                          <ShieldCheck size={16} />
                       </div>
                    </div>

                    {/* Driver Profile Data */}
                    <div className="text-center md:text-left flex-1 min-w-0">
                       <span className="px-4 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-full text-[9px] font-black uppercase tracking-[0.25em] italic">
                          Premium Pilot Unit
                       </span>
                       <h3 className="text-2xl sm:text-4xl font-display font-black text-white italic uppercase tracking-tighter leading-tight mt-4 mb-2 break-words drop-shadow-2xl">
                          {selectedDriver.name}
                       </h3>
                       <div className="flex items-center justify-center md:justify-start gap-3">
                          <div className={`w-2 h-2 rounded-full ${selectedDriver.status === 'approved' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'} shrink-0`} />
                          <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] italic leading-none">
                             Sector Status: Nominal • {selectedDriver.status === 'approved' ? 'Active Duty' : selectedDriver.status}
                          </p>
                       </div>
                    </div>
                 </div>
              </div>
 
              {/* Scrollable Content (GPU Accelerated & Momentum Scrolling) */}
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar bg-black/10 overscroll-contain [-webkit-overflow-scrolling:touch] transform-gpu translate-z-0">
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <div className="lg:col-span-2 space-y-12">
                       <div>
                          <div className="flex items-center gap-4 mb-8">
                             <div className="w-10 h-1 bg-primary rounded-full"></div>
                             <h5 className="text-[11px] font-black uppercase tracking-[0.4em] text-white/30 italic">Performance Dossier</h5>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                             {[
                               { label: 'Total Revenue', value: `₹${selectedDriver.earnings || '0.00'}`, icon: <Wallet size={18} /> },
                               { label: 'Mission Total', value: selectedDriver.total_trips || '0', icon: <Activity size={18} /> },
                               { label: 'Pilot Rating', value: selectedDriver.rating || '5.0', icon: <Star size={18} className="text-amber-500" fill="currentColor" /> }
                             ].map((stat, sidx) => (
                               <div key={sidx} className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5 shadow-2xl group hover:border-primary/20 transition-all">
                                  <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                                     {stat.icon}
                                  </div>
                                  <p className="text-4xl font-display font-black italic text-white tracking-tighter">{stat.value}</p>
                                  <p className="text-[10px] font-black uppercase text-white/30 tracking-widest mt-2 italic">{stat.label}</p>
                               </div>
                             ))}
                          </div>
                       </div>

                       <div>
                          <div className="flex items-center gap-4 mb-8">
                             <div className="w-10 h-1 bg-primary rounded-full"></div>
                             <h5 className="text-[11px] font-black uppercase tracking-[0.4em] text-white/30 italic">Registered Fleet Unit</h5>
                          </div>
                          <div className="p-6 sm:p-10 bg-white/5 rounded-[2rem] sm:rounded-[3rem] border border-white/5 shadow-2xl flex flex-col sm:flex-row justify-between items-center gap-6 sm:gap-10 hover:border-primary/20 transition-all group">
                             <div className="flex items-center gap-8">
                                <div className="w-24 h-24 bg-primary/10 text-primary rounded-[2rem] flex items-center justify-center shadow-inner group-hover:scale-105 transition-all">
                                   <Truck size={48} />
                                </div>
                                <div>
                                   <p className="text-3xl font-display font-black uppercase italic text-white tracking-tight leading-none mb-3">{selectedDriver.vehicle_model || 'Standard Fleet Vehicle'}</p>
                                   <p className="text-[11px] font-black text-white/30 uppercase tracking-[0.3em] italic">{selectedDriver.vehicle_type} Class Carrier Partner</p>
                                </div>
                             </div>
                             <div className="text-center sm:text-right">
                                <p className="text-[10px] font-black uppercase text-white/30 mb-3 italic tracking-widest">Unit Plate Identification</p>
                                <div className="px-10 py-4 bg-obsidian text-white rounded-2xl font-display font-black text-3xl italic shadow-glow-saffron border border-primary/20">
                                   {selectedDriver.vehicle_number}
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-8">
                       <div className="flex items-center gap-4 mb-2">
                          <div className="w-10 h-1 bg-emerald-500 rounded-full"></div>
                          <h5 className="text-[11px] font-black uppercase tracking-[0.4em] text-white/30 italic">Clearance Protocol</h5>
                       </div>
                       <div className="p-6 sm:p-8 bg-white/5 rounded-[2rem] sm:rounded-[3rem] border border-white/5 shadow-2xl space-y-6">
                          {['license', 'rc', 'insurance'].map((type) => {
                            const doc = driverDocs.find(d => d.document_type === type);
                            const label = type === 'license' ? 'Driving License' : type === 'rc' ? 'Vehicle RC' : 'Vehicle Insurance';
                            
                            return (
                              <div key={type} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-transparent hover:border-white/5 transition-all">
                                 <div>
                                   <span className="text-[10px] font-black text-white/40 block uppercase tracking-widest italic">{label}</span>
                                   {doc && (
                                     <a 
                                       href={`http://${window.location.hostname}:5000${doc.file_url}`} 
                                       target="_blank" 
                                       rel="noopener noreferrer"
                                       className="text-[10px] font-black text-primary uppercase tracking-[0.2em] hover:underline mt-2 inline-block italic"
                                     >
                                       Open File
                                     </a>
                                   )}
                                 </div>
                                 <div className="flex items-center gap-3">
                                    {doc?.status === 'approved' ? (
                                      <ShieldCheck size={18} className="text-emerald-500 shadow-glow-emerald/20" />
                                    ) : (
                                      <Clock size={18} className="text-amber-500 shadow-glow-amber/20" />
                                    )}
                                 </div>
                              </div>
                            );
                          })}
                       </div>

                       <div className={`p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] border shadow-2xl relative overflow-hidden group ${selectedDriver.status === 'suspended' ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-red-500/5 border-red-500/10'}`}>
                          <div className="absolute right-0 top-0 p-8 opacity-[0.05]">
                             <ShieldAlert size={80} />
                          </div>
                          <div className="flex items-center gap-4 mb-6 relative z-10">
                             <ShieldAlert className={selectedDriver.status === 'suspended' ? 'text-emerald-500' : 'text-red-500'} size={24} />
                             <span className="text-[11px] font-black uppercase tracking-[0.3em] italic text-white/60">Fleet Security Protocol</span>
                          </div>
                          <p className="text-[11px] font-black text-white/30 mb-10 italic leading-relaxed uppercase tracking-widest">
                            {selectedDriver.status === 'suspended' 
                              ? 'This account is currently restricted. Reactivating will restore full platform access immediately.' 
                              : 'Suspending a pilot will immediately revoke all operational access and active mission signals.'}
                          </p>
                          <button 
                            onClick={() => handleToggleDriverStatus(selectedDriver.driver_id, selectedDriver.status)}
                            disabled={isUpdating === selectedDriver.driver_id}
                            className={`w-full py-6 rounded-[1.8rem] font-black text-[11px] uppercase tracking-[0.3em] transition-all shadow-2xl ${
                              selectedDriver.status === 'suspended'
                                ? 'bg-emerald-500 text-white shadow-glow-emerald hover:scale-105'
                                : 'bg-red-500 text-white shadow-glow-red hover:scale-105'
                            }`}
                          >
                             {isUpdating === selectedDriver.driver_id ? (
                               <RefreshCcw size={18} className="animate-spin mx-auto" />
                             ) : selectedDriver.status === 'suspended' ? (
                               'ACTIVATE DASHBOARD'
                             ) : (
                               'SUSPEND ACCOUNT'
                             )}
                          </button>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AllDrivers;
