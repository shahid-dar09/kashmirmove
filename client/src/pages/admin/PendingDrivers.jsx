import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { RefreshCcw, ShieldCheck, Phone, Car, Target, X, Check, Activity, Shield, FileText, CreditCard, ExternalLink } from 'lucide-react';
import { useToast } from '../../context/ToastContextShared';

const DOC_LABELS = {
  license: { label: 'Driving Licence', icon: CreditCard },
  rc: { label: 'Vehicle RC', icon: Car },
  insurance: { label: 'Insurance Policy', icon: ShieldCheck },
  other: { label: 'Other Document', icon: FileText },
};

const PendingDrivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingDocs, setPendingDocs] = useState([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const { addToast } = useToast();

  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/drivers/pending');
      setDrivers(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPendingDocs = useCallback(async () => {
    setDocsLoading(true);
    try {
      const res = await api.get('/admin/documents/pending');
      setPendingDocs(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setDocsLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchPending();
      fetchPendingDocs();
    });
  }, [fetchPending, fetchPendingDocs]);

  const handleAction = async (id, status) => {
    try {
      await api.put(`/admin/drivers/${id}/status`, { status });
      addToast("Status Updated", `Pilot status has been updated to ${status}.`, "success");
      setDrivers(drivers.filter(d => d.id !== id));
    } catch {
      addToast("Error", "Failed to update status", "error");
    }
  };

  const handleDocVerify = async (docId, status) => {
    try {
      await api.put(`/admin/documents/${docId}/verify`, { status });
      addToast(
        status === 'approved' ? 'Document Approved' : 'Document Rejected',
        `Document has been ${status}.`,
        status === 'approved' ? 'success' : 'error'
      );
      setPendingDocs(prev => prev.filter(d => d.id !== docId));
    } catch {
      addToast("Error", "Failed to update document status", "error");
    }
  };

  const getFileUrl = (fileUrl) => {
    // Use same backend base as api.js (VITE_API_URL is the Railway backend root, no /api)
    const base = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000`;
    // Strip any accidental /api prefix from base, then append file path
    return `${base.replace(/\/api$/, '')}${fileUrl}`;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-16 animate-fade-in pb-20 pt-6 px-4 sm:px-0">

      {/* ── Section 1: Pending Driver Applications ── */}
      <div className="space-y-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
               <div className="w-12 h-1 bg-red-500 rounded-full"></div>
               <span className="text-[11px] font-black uppercase tracking-[0.4em] text-red-500 italic">Security Verification</span>
            </div>
            <h2 className="text-4xl sm:text-7xl font-display font-black italic uppercase leading-[0.9] sm:leading-[0.85] tracking-tighter text-slate-900 dark:text-white">
              PENDING <span className="text-primary">PILOTS</span>
            </h2>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Review mission-readiness and verification applications.</p>
          </div>
          <button
            onClick={() => { fetchPending(); fetchPendingDocs(); }}
            className="w-16 h-16 rounded-3xl bg-white dark:bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-primary transition-all shadow-xl hover:scale-110 active:scale-95"
          >
            <RefreshCcw size={24} className={(loading || docsLoading) ? 'animate-spin' : ''} />
          </button>
        </div>

        {loading && drivers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32">
             <div className="relative mb-8">
                <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <Shield size={24} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary" />
             </div>
             <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 animate-pulse italic">Scanning Application Ledger...</p>
          </div>
        ) : drivers.length === 0 ? (
          <div className="card-modern py-20 px-4 text-center bg-white dark:bg-white/5 border-white/5 rounded-[2rem] sm:rounded-[4rem]">
            <div className="w-24 h-24 bg-slate-100 dark:bg-white/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 opacity-20">
               <Activity size={48} className="text-slate-400" />
            </div>
            <h3 className="text-3xl font-display font-black italic uppercase tracking-tight mb-3 text-slate-900 dark:text-white">Clearance Grid Empty</h3>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">All pilot applications have been processed.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {drivers.map(driver => (
              <div key={driver.id} className="card-modern p-6 sm:p-10 flex flex-col justify-between bg-white dark:bg-obsidian border-white/5 rounded-[2rem] sm:rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
                <div className="absolute -right-10 -top-10 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                   <ShieldCheck size={180} />
                </div>
                <div className="relative z-10 space-y-10">
                  <div className="flex items-center gap-4 sm:gap-6">
                     <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 dark:bg-white/5 rounded-[1.5rem] sm:rounded-[2rem] flex items-center justify-center border border-white/10 group-hover:border-primary/30 transition-all overflow-hidden shadow-xl shrink-0">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${driver.name}`} alt={driver.name} className="w-full h-full scale-110" />
                     </div>
                     <div className="min-w-0">
                        <h4 className="text-2xl font-display font-black italic uppercase tracking-tight text-slate-900 dark:text-white truncate">{driver.name}</h4>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate mt-1">{driver.email}</p>
                     </div>
                  </div>
                  <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-white/5">
                     {[
                       { icon: <Phone size={14} />, label: "Voice Uplink", value: driver.phone },
                       { icon: <Car size={14} />, label: "Fleet Class", value: driver.vehicle_type, premium: true },
                       { icon: <Target size={14} />, label: "Application ID", value: `#PK-${driver.id}` }
                     ].map((item, idx) => (
                       <div key={idx} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 bg-slate-50 dark:bg-white/5 px-5 sm:px-6 py-4 rounded-2xl border border-transparent hover:border-white/5 transition-all">
                          <div className="flex items-center gap-3 text-slate-400 group-hover:text-primary transition-colors">
                             {item.icon}
                             <span className="text-[9px] font-black uppercase tracking-widest italic">{item.label}</span>
                          </div>
                          <span className={`text-[11px] font-black uppercase tracking-tighter ${item.premium ? 'text-primary' : 'text-slate-900 dark:text-white'}`}>{item.value}</span>
                       </div>
                     ))}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mt-10 sm:mt-12 relative z-10">
                   <button onClick={() => handleAction(driver.id, 'rejected')} className="flex-1 py-5 bg-red-500/5 text-red-500 border border-red-500/10 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-3">
                     <X size={16} /> REJECT
                   </button>
                   <button onClick={() => handleAction(driver.id, 'approved')} className="flex-[1.5] py-5 bg-primary text-obsidian rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-glow-saffron hover:scale-[1.05] active:scale-95 transition-all flex items-center justify-center gap-3">
                     <Check size={16} /> AUTHORIZE PILOT
                   </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Section 2: Pending Document Vault Submissions ── */}
      <div className="space-y-10">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-1 bg-amber-500 rounded-full"></div>
            <span className="text-[11px] font-black uppercase tracking-[0.4em] text-amber-500 italic">Document Vault Review</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-display font-black italic uppercase leading-tight tracking-tighter text-slate-900 dark:text-white">
            PENDING <span className="text-amber-500">DOCUMENTS</span>
          </h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Review RC, insurance, and driving licence uploads from driver profiles.</p>
        </div>

        {docsLoading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="relative mb-8">
              <div className="w-16 h-16 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
              <FileText size={20} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-amber-500" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 animate-pulse italic">Scanning Document Vault...</p>
          </div>
        ) : pendingDocs.length === 0 ? (
          <div className="card-modern py-16 px-4 text-center bg-white dark:bg-white/5 border-white/5 rounded-[2rem]">
            <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto mb-6 opacity-20">
              <FileText size={40} className="text-slate-400" />
            </div>
            <h3 className="text-2xl font-display font-black italic uppercase tracking-tight mb-2 text-slate-900 dark:text-white">Vault Clear</h3>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No pending document submissions at this time.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {pendingDocs.map(doc => {
              const docInfo = DOC_LABELS[doc.document_type] || DOC_LABELS.other;
              const DocIcon = docInfo.icon;
              return (
                <div key={doc.id} className="card-modern p-6 sm:p-8 flex flex-col justify-between bg-white dark:bg-obsidian border-amber-500/10 rounded-[2rem] shadow-xl relative overflow-hidden group hover:border-amber-500/30 transition-all">
                  <div className="absolute -right-8 -top-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                    <FileText size={160} />
                  </div>

                  <div className="relative z-10 space-y-6">
                    {/* Doc Type Badge */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center">
                          <DocIcon size={22} />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest text-amber-500">{docInfo.label}</p>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Awaiting Verification</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-amber-500/10 text-amber-500 text-[9px] font-black uppercase rounded-full">Pending</span>
                    </div>

                    {/* Driver Info */}
                    <div className="bg-slate-50 dark:bg-white/5 rounded-2xl px-5 py-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Pilot</span>
                        <span className="text-[11px] font-black text-slate-900 dark:text-white truncate max-w-[140px]">{doc.driver_name || '—'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Email</span>
                        <span className="text-[10px] font-bold text-slate-500 truncate max-w-[140px]">{doc.driver_email || '—'}</span>
                      </div>
                      {doc.expiry_date && (
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Expires</span>
                          <span className="text-[10px] font-bold text-slate-900 dark:text-white">{new Date(doc.expiry_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    {/* Preview Link */}
                    <a
                      href={getFileUrl(doc.file_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-3 bg-slate-100 dark:bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-primary hover:text-white transition-all"
                    >
                      <ExternalLink size={14} /> View Document
                    </a>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-4 mt-6 relative z-10">
                    <button
                      onClick={() => handleDocVerify(doc.id, 'rejected')}
                      className="flex-1 py-4 bg-red-500/5 text-red-500 border border-red-500/10 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                      <X size={14} /> Reject
                    </button>
                    <button
                      onClick={() => handleDocVerify(doc.id, 'approved')}
                      className="flex-[1.5] py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                    >
                      <Check size={14} /> Approve
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

export default PendingDrivers;
