import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { 
  Users, Truck,
  ShieldCheck, AlertCircle, 
  Activity, DollarSign, CheckCircle,
  FileText, Shield, TrendingUp,
  Target
} from 'lucide-react';
import { 
  Chart as ChartJS, CategoryScale, LinearScale, 
  PointElement, LineElement, Title, Tooltip, 
  Legend, Filler, BarElement 
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, 
  BarElement, Title, Tooltip, Legend, Filler
);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data.stats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Defer update to avoid cascading render warning
    Promise.resolve().then(() => {
      fetchStats();
    });
  }, [fetchStats]);

  const chartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'Weekly Trips',
      data: [65, 59, 80, 81, 56, 95, 120],
      fill: true,
      borderColor: '#F59E0B',
      backgroundColor: 'rgba(245, 158, 11, 0.05)',
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: '#F59E0B',
    }]
  };

  const barData = {
    labels: ['Central', 'North', 'South', 'West'],
    datasets: [{
      label: 'Revenue by Zone',
      data: [12000, 19000, 15000, 8000],
      backgroundColor: ['#F59E0B', '#FBBF24', '#10B981', '#059669'],
      borderRadius: 12,
    }]
  };

  if (loading) return (
    <div className="flex-1 flex flex-col items-center justify-center space-y-6">
      <div className="relative">
         <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
         <Activity className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary" size={20} />
      </div>
      <p className="font-display font-black text-slate-500 uppercase tracking-[0.4em] text-[10px] animate-pulse">Aggregating System Intelligence</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-fade-in pb-20 pt-6">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
             <div className="w-12 h-1 bg-primary rounded-full"></div>
             <span className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-500 italic">Live Systems Terminal</span>
          </div>
          <h2 className="text-5xl sm:text-7xl font-display font-black tracking-tighter italic uppercase leading-[0.85] text-slate-900 dark:text-white">
            FLEET <span className="text-primary">COMMAND</span>
          </h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Real-time operational telemetry and global sector metrics.</p>
        </div>
        <div className="flex gap-4 w-full lg:w-auto">
           <button 
            onClick={() => {
              const csvContent = "data:text/csv;charset=utf-8," 
                + "Metric,Value\n"
                + `Total Customers,${stats?.total_users || 0}\n`
                + `Active Drivers,${stats?.active_drivers || 0}\n`
                + `Completed Rides,${stats?.total_trips || 0}\n`
                + `Total Revenue,INR ${stats?.total_revenue || 0}\n`
                + `Pending Approvals,${stats?.pending_approvals || 0}`;
              
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement("a");
              link.setAttribute("href", encodedUri);
              link.setAttribute("download", `kashmirmove_report_${new Date().toISOString().split('T')[0]}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="flex-1 lg:px-8 py-5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-[1.8rem] font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 dark:hover:bg-white/10 transition-all shadow-xl flex items-center justify-center gap-3"
          >
            <FileText size={16} /> DATA EXPORT
          </button>
           <button 
            onClick={() => navigate('/admin/audit')}
            className="flex-1 lg:px-10 py-5 bg-primary text-obsidian rounded-[1.8rem] font-black uppercase tracking-[0.2em] text-[10px] shadow-glow-saffron hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <Shield size={16} /> SYSTEM AUDIT
          </button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { label: 'Customer Base', value: stats?.total_users || 0, icon: <Users size={28} />, color: 'blue', growth: '8.4%' },
          { label: 'Verified Pilots', value: stats?.active_drivers || 0, icon: <Truck size={28} />, color: 'purple', growth: '12.1%' },
          { label: 'Total Missions', value: stats?.total_trips || 0, icon: <CheckCircle size={28} />, color: 'emerald', growth: '2.1%' },
          { label: 'Gross Allotment', value: `₹${Math.round(stats?.total_revenue || 0)}`, icon: <DollarSign size={28} />, color: 'primary', growth: '12.5%', premium: true }
        ].map((item, idx) => (
          <div key={idx} className={`relative overflow-hidden card-modern p-10 flex flex-col items-start transition-all duration-500 rounded-[3rem] ${
            item.premium 
            ? 'bg-gradient-to-br from-slate-900 via-obsidian to-slate-900 border-primary/20' 
            : 'bg-white dark:bg-white/5 border-white/5'
          } hover:border-primary/40 group`}>
            <div className="absolute -right-6 -top-6 opacity-[0.03] group-hover:opacity-10 transition-opacity">
               {item.icon}
            </div>
            <div className="flex items-center justify-between w-full mb-10">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                item.premium ? 'bg-primary/20 text-primary' : 'bg-slate-100 dark:bg-white/10 text-slate-400 group-hover:text-primary group-hover:bg-primary/10'
              }`}>
                {item.icon}
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black uppercase text-emerald-500 flex items-center gap-1 justify-end italic">
                  <TrendingUp size={12} /> {item.growth}
                </span>
                <p className={`text-[9px] font-bold uppercase tracking-widest mt-1 ${item.premium ? 'text-white/30' : 'text-slate-400'}`}>Weekly Index</p>
              </div>
            </div>
            <p className={`text-[10px] font-black uppercase tracking-[0.3em] mb-3 italic ${item.premium ? 'text-white/40' : 'text-slate-400'}`}>{item.label}</p>
            <p className={`text-5xl font-display font-black tracking-tighter italic ${item.premium ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="card-modern p-10 bg-white dark:bg-white/5 border-white/5 rounded-[4rem] shadow-2xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-10 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
              <Activity size={120} />
           </div>
           <div className="flex items-center justify-between mb-12 relative z-10">
             <div>
               <div className="flex items-center gap-3 mb-2">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 italic">Telemetry</span>
               </div>
               <h3 className="font-display font-black text-3xl italic uppercase text-slate-900 dark:text-white tracking-tight leading-none">Mission <span className="text-primary">Velocity</span></h3>
             </div>
             <div className="bg-primary/10 px-4 py-2 rounded-2xl border border-primary/20">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary italic">Live Cycle Feed</span>
             </div>
           </div>
           <div className="h-[350px] relative z-10">
            <Line 
              data={chartData} 
              options={{ 
                responsive: true, 
                maintainAspectRatio: false,
                scales: { 
                  y: { 
                    grid: { color: 'rgba(255,255,255,0.02)' }, 
                    border: { display: false },
                    ticks: { font: { family: 'Outfit', weight: 'bold', size: 10 }, color: '#94a3b8' } 
                  },
                  x: { 
                    grid: { display: false }, 
                    border: { display: false },
                    ticks: { font: { family: 'Outfit', weight: 'bold', size: 10 }, color: '#94a3b8' } 
                  }
                },
                plugins: { 
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: '#111111',
                    padding: 16,
                    titleFont: { family: 'Outfit', weight: '900', size: 14 },
                    bodyFont: { family: 'Inter', weight: 'bold', size: 12 },
                    cornerRadius: 16,
                    displayColors: false,
                    borderColor: 'rgba(245,158,11,0.2)',
                    borderWidth: 1
                  }
                }
              }} 
            />
          </div>
        </div>

        <div className="card-modern p-10 bg-white dark:bg-white/5 border-white/5 rounded-[4rem] shadow-2xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-10 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
              <Target size={120} />
           </div>
           <div className="flex items-center justify-between mb-12 relative z-10">
             <div>
               <div className="flex items-center gap-3 mb-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 italic">Sector Intel</span>
               </div>
               <h3 className="font-display font-black text-3xl italic uppercase text-slate-900 dark:text-white tracking-tight leading-none">Territorial <span className="text-primary">Yield</span></h3>
             </div>
             <div className="bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Regional Distribution</span>
             </div>
           </div>
           <div className="h-[350px] relative z-10">
            <Bar 
              data={barData} 
              options={{ 
                responsive: true, 
                maintainAspectRatio: false,
                scales: { 
                  y: { 
                    grid: { color: 'rgba(255,255,255,0.02)' }, 
                    border: { display: false },
                    ticks: { font: { family: 'Outfit', weight: 'bold', size: 10 }, color: '#94a3b8' } 
                  },
                  x: { 
                    grid: { display: false }, 
                    border: { display: false },
                    ticks: { font: { family: 'Outfit', weight: 'bold', size: 10 }, color: '#94a3b8' } 
                  }
                },
                plugins: { 
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: '#111111',
                    padding: 16,
                    cornerRadius: 16,
                    displayColors: false,
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1
                  }
                }
              }} 
            />
          </div>
        </div>
      </div>

      {/* Critical Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="card-modern p-10 bg-red-500/5 border-red-500/20 rounded-[4rem] shadow-2xl relative overflow-hidden group">
           <div className="absolute -right-8 -top-8 opacity-[0.03] group-hover:opacity-10 transition-opacity">
              <AlertCircle size={150} />
           </div>
           <div className="flex flex-col sm:flex-row items-center gap-10 relative z-10">
              <div className="w-24 h-24 bg-red-500/10 rounded-[2.5rem] flex items-center justify-center text-red-500 shadow-xl border border-red-500/20 shrink-0 group-hover:rotate-12 transition-transform">
                 <AlertCircle size={44} />
              </div>
              <div className="flex-1 text-center sm:text-left">
                 <p className="text-[11px] font-black uppercase tracking-[0.4em] text-red-500 mb-3 italic leading-none">Priority Intervention Needed</p>
                 <h4 className="text-3xl font-display font-black text-slate-900 dark:text-white mb-3 italic uppercase tracking-tight">Pending Approvals</h4>
                 <p className="text-sm text-slate-500 dark:text-slate-400 mb-10 font-bold leading-relaxed uppercase tracking-widest text-[10px]">
                   There {stats?.pending_approvals === 1 ? 'is' : 'are'} <span className="text-red-500">{stats?.pending_approvals || 0}</span> pilot application{stats?.pending_approvals !== 1 ? 's' : ''} awaiting background verification terminal.
                 </p>
                 <button 
                  onClick={() => navigate('/admin/pending')} 
                  className="w-full sm:w-auto px-10 py-5 bg-red-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-red-600 transition-all shadow-glow-red hover:scale-105 active:scale-95"
                >
                  REVIEW MISSION FILES →
                </button>
              </div>
           </div>
        </div>

        <div className="card-modern p-10 bg-emerald-500/5 border-emerald-500/20 rounded-[4rem] shadow-2xl relative overflow-hidden group">
           <div className="absolute -right-8 -top-8 opacity-[0.03] group-hover:opacity-10 transition-opacity">
              <ShieldCheck size={150} />
           </div>
           <div className="flex flex-col sm:flex-row items-center gap-10 relative z-10">
              <div className="w-24 h-24 bg-emerald-500/10 rounded-[2.5rem] flex items-center justify-center text-emerald-500 shadow-xl border border-emerald-500/20 shrink-0 group-hover:rotate-12 transition-transform">
                 <ShieldCheck size={44} />
              </div>
              <div className="flex-1 text-center sm:text-left">
                 <p className="text-[11px] font-black uppercase tracking-[0.4em] text-emerald-500 mb-3 italic leading-none">Systems Status: Nominal</p>
                 <h4 className="text-3xl font-display font-black text-slate-900 dark:text-white mb-3 italic uppercase tracking-tight">Infrastructure Health</h4>
                 <p className="text-sm text-slate-500 dark:text-slate-400 mb-10 font-bold leading-relaxed uppercase tracking-widest text-[10px]">
                   All regional nodes operating at 99.9% uptime. Real-time socket relays stable across Srinagar sector.
                 </p>
                 <div className="flex gap-3 justify-center sm:justify-start">
                    {[1,2,3,4,5,6,7,8].map(i => (
                       <div key={i} className="w-8 h-2 bg-emerald-500/20 rounded-full overflow-hidden border border-emerald-500/10">
                          <div className="w-full h-full bg-emerald-500 animate-pulse shadow-glow-emerald" style={{ animationDelay: `${i*0.15}s` }}></div>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;
