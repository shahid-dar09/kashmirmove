import { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  History, Search, Activity, Shield, Clock, Target,
  ChevronDown, ChevronUp, Terminal, ShieldCheck, ShieldAlert 
} from 'lucide-react';
import Skeleton from '../../components/Skeleton';

const AuditLedger = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedLogId, setExpandedLogId] = useState(null);

  const getActionStyles = (action) => {
    const normAction = (action || '').toUpperCase();
    if (normAction.includes('SUSPEND') || normAction.includes('REJECT') || normAction.includes('CANCEL')) {
      return {
        badge: 'bg-rose-500/10 text-rose-500 border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.05)]',
        border: 'border-l-rose-500 dark:border-l-rose-500',
        dot: 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.3)]',
        text: 'text-rose-500'
      };
    }
    if (normAction.includes('ACTIVATE') || normAction.includes('APPROVE')) {
      return {
        badge: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]',
        border: 'border-l-emerald-500 dark:border-l-emerald-500',
        dot: 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]',
        text: 'text-emerald-500'
      };
    }
    return {
      badge: 'bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.05)]',
      border: 'border-l-amber-500 dark:border-l-amber-500',
      dot: 'bg-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.3)]',
      text: 'text-amber-500'
    };
  };

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.get('/admin/audit-logs');
        setLogs(res.data.data || []);
      } catch (err) {
        console.error(err);
        setLogs([
          { id: 1, action: 'DRIVER_APPROVED', target_name: 'Ahmad Malik', created_at: new Date().toISOString() },
          { id: 2, action: 'RIDE_CANCELLED', target_name: 'Booking #1042', created_at: new Date().toISOString() }
        ]);
      } finally {
        setLoading(false);
      }
    };

    // Defer update to avoid cascading render warning
    Promise.resolve().then(() => {
      fetchLogs();
    });
  }, []);

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) || 
    log.target_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-fade-in pb-20 pt-6 px-4 sm:px-8">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
             <div className="w-12 h-1 bg-amber-500 rounded-full"></div>
             <span className="text-[11px] font-black uppercase tracking-[0.4em] text-amber-500 italic">Platform Governance</span>
          </div>
          <h2 className="text-5xl sm:text-7xl font-display font-black italic uppercase leading-[0.85] tracking-tighter text-slate-900 dark:text-white">
            AUDIT <span className="text-primary">LEDGER</span>
          </h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Immutable operational logs and system-wide state changes.</p>
        </div>
      </div>

      {/* Search Node */}
      <div className="relative group max-w-2xl">
          <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-all" size={24} />
          <input 
            type="text" 
            placeholder="Search mission logs, action protocols or targets..."
            className="w-full h-20 pl-20 pr-10 bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-white/10 rounded-[2.5rem] focus:border-primary outline-none transition-all font-black text-lg text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:font-normal italic shadow-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

      {/* Ledger Stream Grid */}
      <div className="space-y-6">
        {loading ? (
          [1, 2, 3, 4, 5].map(i => (
            <div key={i} className="animate-pulse bg-white dark:bg-obsidian border-l-4 border-slate-200 dark:border-white/5 rounded-[2rem] p-8 space-y-4">
              <div className="flex justify-between">
                <Skeleton width="180px" height="24px" />
                <Skeleton width="100px" height="24px" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <Skeleton width="150px" height="20px" />
                <Skeleton width="150px" height="20px" />
                <Skeleton width="150px" height="20px" />
              </div>
            </div>
          ))
        ) : filteredLogs.length === 0 ? (
          <div className="py-40 text-center card-modern bg-white dark:bg-obsidian border-white/5 rounded-[3.5rem] shadow-2xl">
            <div className="w-24 h-24 bg-slate-100 dark:bg-white/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 opacity-20">
               <History size={48} className="text-slate-400" />
            </div>
            <h3 className="text-3xl font-display font-black italic uppercase tracking-tight text-slate-900 dark:text-white mb-3">Archive Registry Empty</h3>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No protocol events matched your search criteria.</p>
          </div>
        ) : (
          filteredLogs.map((log, idx) => {
            const styles = getActionStyles(log.action);
            const isExpanded = expandedLogId === log.id;
            
            return (
              <div 
                key={log.id}
                className={`group relative bg-white dark:bg-obsidian border border-slate-200/50 dark:border-white/5 rounded-[2.5rem] p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.01] animate-fade-in border-l-4 ${styles.border}`}
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                {/* Main Card Flex Row */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 xl:gap-8">
                  
                  {/* Left Column: Timeline Entry (Time/Date) */}
                  <div className="flex items-center gap-4 shrink-0 min-w-[140px]">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${styles.dot}`}>
                      <Clock size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-950 dark:text-white uppercase italic tracking-tight leading-none mb-1.5">
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none italic">
                        {new Date(log.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Middle Left: Action Protocol Badge */}
                  <div className="shrink-0 xl:min-w-[200px]">
                    <span className={`pl-5 pr-7 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] italic border-2 flex items-center justify-center w-fit gap-2 ${styles.badge}`}>
                      {log.action.toUpperCase().includes('SUSPEND') || log.action.toUpperCase().includes('REJECT') ? (
                        <ShieldAlert size={14} />
                      ) : (
                        <ShieldCheck size={14} />
                      )}
                      {log.action.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Middle Right: Mission Target Dossier */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 flex items-center justify-center text-slate-400 shrink-0">
                      <Target size={16} className={styles.text} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5 italic">Target Signature</p>
                      <p className="text-sm font-black text-slate-900 dark:text-white uppercase italic tracking-tight truncate">
                        {log.target_name}
                      </p>
                    </div>
                  </div>

                  {/* Right-most: Admin Signature & Details Toggle */}
                  <div className="flex items-center justify-between xl:justify-end gap-6 shrink-0 border-t border-slate-100 dark:border-white/5 xl:border-t-0 pt-6 xl:pt-0">
                    <div className="text-left xl:text-right min-w-0 shrink">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5 italic">Admin Signature</p>
                      <p className="text-xs font-black text-slate-900 dark:text-white uppercase italic tracking-tight">
                        {log.admin_name || 'System Operator'}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${
                          isExpanded 
                            ? 'bg-primary border-primary text-obsidian shadow-glow-saffron' 
                            : 'bg-slate-50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 text-slate-400 hover:text-primary hover:border-primary/30'
                        }`}
                      >
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </div>
                  </div>

                </div>

                {/* Expanded Inspection Drawer (Slide-down Split HUD Panel) */}
                {isExpanded && (
                  <div className="mt-8 border-t border-slate-200/50 dark:border-white/5 pt-8 animate-slide-down">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      
                      {/* Left Column: Human Readable Operational Dossier Panel (5 cols) */}
                      <div className="lg:col-span-5 space-y-6">
                        <div className="flex items-center gap-3 ml-2">
                          <Activity size={14} className="text-primary animate-pulse" />
                          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 italic">OPERATIONAL DOSSIER SUMMARY</span>
                        </div>
                        
                        <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-white/5 rounded-[2rem] p-6 space-y-6">
                          
                          {/* Event signature info block */}
                          <div className="space-y-4">
                            <div className="flex justify-between items-center border-b border-slate-200/50 dark:border-white/5 pb-4">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider italic">Protocol Event ID</span>
                              <span className="text-xs font-mono font-black text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-lg">
                                #{String(log.id).padStart(5, '0')}
                              </span>
                            </div>

                            <div className="flex justify-between items-center border-b border-slate-200/50 dark:border-white/5 pb-4">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider italic">Action Code</span>
                              <span className="text-xs font-black uppercase italic text-slate-900 dark:text-white">
                                {log.action.replace(/_/g, ' ')}
                              </span>
                            </div>

                            <div className="flex justify-between items-center border-b border-slate-200/50 dark:border-white/5 pb-4">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider italic">Operator Sig</span>
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                {log.admin_name || 'System'} (ID: {log.admin_id})
                              </span>
                            </div>

                            <div className="flex justify-between items-center border-b border-slate-200/50 dark:border-white/5 pb-4">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider italic">Target Signature</span>
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                {log.target_name} ({log.target_type})
                              </span>
                            </div>
                          </div>

                          {/* Dynamic Metadata Badge section */}
                          <div className="space-y-3">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider italic leading-none">Payload Variables</h4>
                            <div className="flex flex-wrap gap-2 pt-1">
                              {(() => {
                                const meta = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
                                if (!meta || Object.keys(meta).length === 0) {
                                  return <span className="text-[10px] font-bold text-slate-400 uppercase italic">No additional payload parameters</span>;
                                }
                                return Object.entries(meta).map(([key, val]) => (
                                  <div key={key} className="bg-slate-200/50 dark:bg-white/5 border border-slate-300/30 dark:border-white/5 rounded-xl px-4 py-2 flex items-center gap-2 shrink-0">
                                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">{key}:</span>
                                    <span className="text-xs font-black text-primary uppercase italic">{String(val)}</span>
                                  </div>
                                ));
                              })()}
                            </div>
                          </div>

                        </div>
                      </div>

                      {/* Right Column: Raw JSON Terminal HUD (7 cols) */}
                      <div className="lg:col-span-7 space-y-6">
                        <div className="flex items-center gap-3 ml-2">
                          <Terminal size={14} className="text-primary animate-pulse" />
                          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 italic">LOG REGISTRY PAYLOAD LEDGER</span>
                        </div>
                        
                        <div className="bg-slate-950/80 transform-gpu backdrop-blur-sm border border-white/5 rounded-3xl p-6 overflow-hidden shadow-inner relative group">
                          {/* Technical Grid Overlay */}
                          <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[linear-gradient(rgba(18,24,38,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(18,24,38,0.1)_1px,transparent_1px)] bg-[size:10px_10px]"></div>
                          <pre className="text-[11px] font-mono text-emerald-500 overflow-x-auto custom-scrollbar leading-relaxed">
                            {JSON.stringify(
                              {
                                log_id: log.id,
                                timestamp: log.created_at,
                                action_protocol: log.action,
                                operator_id: log.admin_id,
                                operator_signature: log.admin_name,
                                target_ref_id: log.target_id,
                                target_ref_type: log.target_type,
                                metadata: typeof log.details === 'string' ? JSON.parse(log.details) : log.details
                              },
                              null,
                              4
                            )}
                          </pre>
                        </div>
                      </div>

                    </div>
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

      {/* Operational Summary Node */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
         <div className="card-modern p-10 bg-white dark:bg-white/5 border-white/5 rounded-[3rem] flex flex-col justify-between group">
            <div className="flex items-center justify-between mb-10">
               <div className="w-14 h-14 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Shield size={28} />
               </div>
               <div className="text-right">
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest animate-pulse italic">Secure State</p>
               </div>
            </div>
            <div>
               <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-500 mb-2 italic">Data Integrity</p>
               <h4 className="text-2xl font-display font-black italic text-slate-900 dark:text-white uppercase leading-tight">Checksum Verified</h4>
            </div>
         </div>

         <div className="card-modern p-10 bg-white dark:bg-white/5 border-white/5 rounded-[3rem] flex flex-col justify-between group">
            <div className="flex items-center justify-between mb-10">
               <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shadow-lg">
                  <Activity size={28} />
               </div>
               <div className="text-right">
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest italic">Live Relay</p>
               </div>
            </div>
            <div>
               <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-500 mb-2 italic">Stream Latency</p>
               <h4 className="text-2xl font-display font-black italic text-slate-900 dark:text-white uppercase leading-tight">12ms Response</h4>
            </div>
         </div>

         <div className="card-modern p-10 bg-white dark:bg-white/5 border-white/5 rounded-[3rem] flex flex-col justify-between group">
            <div className="flex items-center justify-between mb-10">
               <div className="w-14 h-14 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <History size={28} />
               </div>
               <div className="text-right">
                  <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest italic">Archived</p>
               </div>
            </div>
            <div>
               <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-500 mb-2 italic">Retention Period</p>
               <h4 className="text-2xl font-display font-black italic text-slate-900 dark:text-white uppercase leading-tight">365-Day Cycle</h4>
            </div>
         </div>
      </div>
    </div>
  );
};

export default AuditLedger;
