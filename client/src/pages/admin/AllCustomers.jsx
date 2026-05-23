import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { 
  Search, RefreshCcw, Mail, Phone, 
  Calendar, ShieldAlert, ShieldCheck, User, Filter, X
} from 'lucide-react';

const AllCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUpdating, setIsUpdating] = useState(null);

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await api.get('/admin/customers/all');
      setCustomers(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Defer update to avoid cascading render warning
    Promise.resolve().then(() => {
      fetchCustomers();
    });
  }, [fetchCustomers]);

  const handleToggleStatus = async (customerId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    const confirmMsg = `Are you sure you want to ${newStatus === 'suspended' ? 'SUSPEND' : 'ACTIVATE'} this customer?`;
    
    if (!window.confirm(confirmMsg)) return;

    setIsUpdating(customerId);
    try {
      await api.put(`/admin/users/${customerId}/status`, { status: newStatus });
      setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, status: newStatus } : c));
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    } finally {
      setIsUpdating(null);
    }
  };

  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.phone?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) return (
    <div className="flex-1 flex flex-col items-center justify-center space-y-4 min-h-[400px]">
      <RefreshCcw className="w-12 h-12 text-primary animate-spin" />
      <p className="section-label animate-pulse">Syncing registry records...</p>
    </div>
  );

  return (
    <div className="responsive-container space-y-12 animate-fade-in pb-20 pt-4 sm:pt-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
             <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
             <span className="section-label mb-0">Customer Intelligence</span>
          </div>
          <h2 className="text-4xl sm:text-6xl font-display font-black tracking-tighter italic uppercase leading-tight sm:leading-none text-slate-900 dark:text-ghost">
            User <span className="text-gradient">Registry</span>
          </h2>
          <p className="text-slate-500 font-medium mt-4">Platform-wide customer profiles and wallet metrics.</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
           <button onClick={fetchCustomers} className="btn-modern-secondary flex-1 md:flex-none h-14 px-6 flex items-center justify-center gap-3">
             <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
             <span className="text-[10px] font-black uppercase tracking-widest">Refresh Ledger</span>
           </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search by name, email or phone..."
            className="w-full h-14 sm:h-16 pl-14 sm:pl-16 pr-5 sm:pr-8 bg-white dark:bg-obsidian-card border-2 border-slate-200 dark:border-white/10 rounded-[20px] sm:rounded-[24px] focus:border-primary outline-none transition-all font-bold text-slate-700 dark:text-ghost shadow-premium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative z-20">
           <button 
             onClick={() => setShowFilters(!showFilters)} 
             className={`h-14 sm:h-16 w-full sm:w-auto px-6 sm:px-8 bg-white dark:bg-obsidian-card border-2 rounded-[20px] sm:rounded-[24px] flex items-center justify-center gap-3 font-bold transition-all shadow-premium ${
               statusFilter !== 'all' || showFilters 
                 ? 'border-primary text-primary' 
                 : 'border-slate-200 dark:border-white/10 text-slate-400 hover:border-primary hover:text-primary'
             }`}
           >
              <Filter size={20} />
              <span className="text-[10px] font-black uppercase tracking-widest">
                {statusFilter === 'all' ? 'Filters' : statusFilter}
              </span>
           </button>
           
           {showFilters && (
              <div className="absolute top-full mt-4 right-0 w-48 bg-white dark:bg-obsidian-card border-2 border-slate-200 dark:border-white/10 rounded-[24px] shadow-2xl overflow-hidden animate-slide-up">
                 {['all', 'active', 'suspended'].map(f => (
                    <button 
                      key={f}
                      onClick={() => { setStatusFilter(f); setShowFilters(false); }}
                      className={`w-full text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-colors ${
                        statusFilter === f 
                          ? 'bg-primary/10 text-primary' 
                          : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5'
                      }`}
                    >
                      {f === 'all' ? 'All Customers' : `${f} Only`}
                    </button>
                 ))}
              </div>
           )}
        </div>
      </div>

      {/* Content */}
      {filteredCustomers.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCustomers.map((customer, i) => (
            <div 
              key={customer.id} 
              className={`group bg-white dark:bg-obsidian-card rounded-[24px] sm:rounded-[32px] p-5 sm:p-8 border-2 border-slate-200 dark:border-white/10 shadow-premium hover:border-primary dark:hover:border-primary transition-all hover:translate-y-[-4px] animate-slide-up stagger-${(i % 5) + 1} flex flex-col h-full`}
            >
               {/* Profile Identity Ledger */}
               <div className="mb-6">
                  <div className="flex items-center gap-4 sm:gap-5 mb-6">
                     <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-primary/10 flex items-center justify-center overflow-hidden border border-primary/20 shadow-inner group-hover:scale-110 transition-transform shrink-0">
                       {customer.avatar_url ? (
                         <img src={`http://${window.location.hostname}:5000${customer.avatar_url}`} alt={customer.name} className="w-full h-full object-cover" />
                       ) : (
                         <User size={24} className="text-primary" />
                       )}
                     </div>
                     <div className="flex-1 min-w-0">
                       <h4 className="font-display font-black text-2xl text-slate-900 dark:text-ghost italic leading-tight mb-2 group-hover:text-primary transition-colors">
                         {customer.name}
                       </h4>
                       <div className="flex items-center gap-2">
                         <div className={`w-2 h-2 rounded-full ${customer.status === 'active' ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`}></div>
                         <span className={`text-[10px] font-black uppercase tracking-widest ${customer.status === 'active' ? 'text-emerald-500' : 'text-red-500'}`}>
                           Account {customer.status}
                         </span>
                       </div>
                     </div>
                  </div>
                  <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-300 dark:via-white/10 to-transparent"></div>
               </div>

               {/* Compact Data Rows */}
               <div className="space-y-4 mb-8 flex-1">
                  <div className="flex items-center gap-4 text-slate-600 dark:text-slate-300">
                     <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center shrink-0">
                       <Calendar size={16} />
                     </div>
                     <div className="min-w-0 flex-1 flex items-center gap-2">
                       <p className="text-sm font-bold truncate">Joined Platform</p>
                       <span className="opacity-30">|</span> 
                       <p className="text-sm font-black text-blue-400 whitespace-nowrap">{formatDate(customer.created_at)}</p>
                     </div>
                  </div>
                  <a href={`mailto:${customer.email}`} className="flex items-center gap-4 text-slate-600 dark:text-slate-300 hover:text-primary transition-colors group/link">
                     <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center shrink-0 group-hover/link:scale-110 transition-transform">
                       <Mail size={16} />
                     </div>
                     <p className="text-sm font-bold break-all leading-tight">{customer.email}</p>
                  </a>
                  <a href={`tel:${customer.phone}`} className="flex items-center gap-4 text-slate-600 dark:text-slate-300 hover:text-emerald-500 transition-colors group/link">
                     <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center shrink-0 group-hover/link:scale-110 transition-transform">
                       <Phone size={16} />
                     </div>
                     <p className="text-sm font-bold">{customer.phone}</p>
                  </a>
               </div>

               {/* Action Node */}
               <div className="pt-6 border-t border-slate-100 dark:border-white/5 mt-auto">
                  <button 
                    onClick={() => handleToggleStatus(customer.id, customer.status)}
                    disabled={isUpdating === customer.id}
                    className={`w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 border-2 ${
                      customer.status === 'active' 
                        ? 'bg-red-500/10 text-red-500 border-transparent hover:border-red-500 hover:bg-red-500 hover:text-white' 
                        : 'bg-emerald-500/10 text-emerald-500 border-transparent hover:border-emerald-500 hover:bg-emerald-500 hover:text-white'
                    }`}
                  >
                    {isUpdating === customer.id ? (
                      <RefreshCcw size={14} className="animate-spin" />
                    ) : customer.status === 'active' ? (
                      <>
                        <ShieldAlert size={14} /> Suspend Account
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={14} /> Restore Access
                      </>
                    )}
                  </button>
               </div>
            </div>
          ))}
        </div>
      )}    
      
      {filteredCustomers.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-32 card-modern border-dashed border-2">
           <X size={48} className="text-slate-200 dark:text-white/10 mb-6" />
           <p className="text-xs font-black uppercase tracking-widest text-slate-400">No customers found matching "{searchTerm}"</p>
        </div>
      )}

    </div>
  );
};

export default AllCustomers;
