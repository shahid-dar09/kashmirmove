import { useState, useEffect, useContext, useCallback } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContextValue';
import { useNavigate } from 'react-router-dom';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../utils/cropImage';
import {
  Mail,
  Phone,
  ShieldCheck,
  CreditCard,
  Settings,
  CheckCircle,
  Camera,
  MapPin,
  Plus,
  Zap,
  Star,
  Loader2,
  TrendingUp,
  FileText,
  ChevronRight,
  Wallet
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Profile = () => {
  const { user, triggerRefresh } = useContext(AuthContext);
  const navigate = useNavigate();

  // Profile Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [editSuccess, setEditSuccess] = useState(false);
  const [driverInfo, setDriverInfo] = useState(null);
  const [savedLocations, setSavedLocations] = useState([]);
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [newLocationForm, setNewLocationForm] = useState({ name: '', address: '' });
  const [locationLoading, setLocationLoading] = useState(false);

  // Avatar Crop State
  const [imageToCrop, setImageToCrop] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  // Public View State
  const [showPublicView, setShowPublicView] = useState(false);

  // Phase 2: SOS & Preferences State
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', phone: '', relationship: '' });
  const [preferences, setPreferences] = useState({
    silent_ride: false,
    ac_needed: false,
    music_allowed: true
  });

  // Phase 3: Analytics & Documents State
  const [analytics, setAnalytics] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [docLoading, setDocLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    vehicle_model: '',
    vehicle_plate: '',
  });

  const fetchDriverProfile = useCallback(async () => {
    try {
      const res = await api.get('/driver/profile');
      setDriverInfo(res.data.driver);
      if (res.data.driver) {
        setFormData((prev) => ({
          ...prev,
          vehicle_model: res.data.driver.vehicle_model || '',
          vehicle_plate: res.data.driver.vehicle_plate || '',
        }));
      }
    } catch (err) {
      console.error('Failed to fetch driver profile:', err);
    }
  }, []);

  const fetchLocations = useCallback(async () => {
    try {
      const res = await api.get('/locations');
      if (res.data.success) setSavedLocations(res.data.locations);
    } catch (err) {
      console.error('Failed to fetch locations', err);
    }
  }, []);

  const fetchEmergencyContacts = useCallback(async () => {
    try {
      const res = await api.get('/user/contacts');
      if (res.data.success) setEmergencyContacts(res.data.contacts);
    } catch (err) {
      console.error('Failed to fetch contacts', err);
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await api.get('/driver/analytics');
      setAnalytics(res.data);
    } catch (err) {
      console.error('Failed to fetch analytics', err);
    }
  }, []);

  const fetchDocuments = useCallback(async () => {
    try {
      setDocLoading(true);
      const res = await api.get('/driver/documents');
      setDocuments(res.data);
    } catch (err) {
      console.error('Failed to fetch documents', err);
    } finally {
      setDocLoading(false);
    }
  }, []);

  const updatePreferences = async (newPrefs) => {
    try {
      setPreferences(newPrefs);
      await api.put('/user/preferences', newPrefs);
    } catch (err) {
      console.error('Failed to update preferences', err);
    }
  };

  useEffect(() => {
    if (!user) return;
    
    // Defer updates to satisfy the 'no-synchronous-setstate-in-effect' rule
    Promise.resolve().then(() => {
      setFormData({
        name: user.name || "",
        phone: user.phone || "",
        password: "",
        vehicle_model: "",
        vehicle_plate: "",
      });

      if (user.role === "driver") {
        fetchDriverProfile();
      }
      fetchLocations();
      fetchEmergencyContacts();
      
      // Sync preferences from user object
      setPreferences({
        silent_ride: !!user.pref_silent_ride,
        ac_needed: !!user.pref_ac_needed,
        music_allowed: user.pref_music_allowed !== undefined ? !!user.pref_music_allowed : true
      });

      if (user.role === 'driver') {
        fetchAnalytics();
        fetchDocuments();
      }
    });
  }, [user, fetchDriverProfile, fetchLocations, fetchEmergencyContacts, fetchAnalytics, fetchDocuments]);

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageToCrop(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = useCallback((_croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSaveCroppedImage = async () => {
    setAvatarLoading(true);
    try {
      const croppedImageBlob = await getCroppedImg(imageToCrop, croppedAreaPixels);
      const formData = new FormData();
      formData.append('avatar', croppedImageBlob, 'avatar.jpg');

      await api.post('/auth/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      triggerRefresh();
      setImageToCrop(null);
    } catch (err) {
      console.error(err);
      alert('Avatar upload failed');
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleDocumentUpload = async (type, file) => {
    if (!file) return;
    setDocLoading(true);
    try {
      const fd = new FormData();
      fd.append('document', file);
      fd.append('document_type', type);
      
      await api.post('/driver/documents', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      fetchDocuments();
    } catch (err) {
      console.error(err);
      alert('Document upload failed');
    } finally {
      setDocLoading(false);
    }
  };

  const handleAddLocation = async (e) => {
    e.preventDefault();
    if (!newLocationForm.name || !newLocationForm.address) return;
    
    setLocationLoading(true);
    try {
      // Geocode using Nominatim
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(newLocationForm.address)}`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        
        const res = await api.post('/locations', {
          type: 'custom',
          name: newLocationForm.name,
          address: data[0].display_name,
          lat: parseFloat(lat),
          lng: parseFloat(lon)
        });
        
        setSavedLocations(prev => [res.data.location, ...prev]);
        setIsAddingLocation(false);
        setNewLocationForm({ name: '', address: '' });
      } else {
        alert("Location not found. Please try a more specific address.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to add location.");
    } finally {
      setLocationLoading(false);
    }
  };

  const handleAddContact = async (e) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.phone) return;
    try {
      await api.post('/user/contacts', contactForm);
      setContactForm({ name: '', phone: '', relationship: '' });
      setIsAddingContact(false);
      fetchEmergencyContacts();
    } catch (err) {
      console.error(err);
      alert('Failed to add contact');
    }
  };

  const handleDeleteContact = async (id) => {
    if (!window.confirm('Remove this contact?')) return;
    try {
      await api.delete(`/user/contacts/${id}`);
      fetchEmergencyContacts();
    } catch (err) {
      console.error(err);
      alert('Failed to delete contact');
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!user) return;
    setEditLoading(true);
    try {
      // 1. Update basic info (Auth API)
      const profileData = { name: formData.name, phone: formData.phone };
      if (formData.password) profileData.password = formData.password;
      
      await api.put('/auth/profile', profileData);

      // 2. Update vehicle info if driver
      if (user?.role === 'driver') {
        await api.put('/driver/vehicle', {
          model: formData.vehicle_model,
          number: formData.vehicle_plate
        });
      }

      setEditSuccess(true);
      setIsEditing(false);
      triggerRefresh();
      setTimeout(() => setEditSuccess(false), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed');
    } finally {
      setEditLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <>
      <div className="max-w-6xl mx-auto space-y-10 animate-fade-in">
      {/* Page Title */}
      <div>
        <h2 className="text-4xl font-display font-black tracking-tight mb-2 uppercase italic">
          Account <span className="text-primary">Command</span>
        </h2>
        <p className="text-slate-500 font-medium">
          Manage your personal profile and security settings.
        </p>
      </div>

      {/* Phase 3: Pilot Intelligence (Analytics) */}
      {user?.role === 'driver' && analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 card-modern p-8 flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h4 className="text-2xl font-display font-black uppercase italic">Financial <span className="text-primary">Pulse</span></h4>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">7-Day Earnings Trend</p>
              </div>
              <div className="p-4 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center gap-3">
                <TrendingUp size={20} />
                <span className="font-black text-lg">₹{analytics.summary?.total_earnings || '0.00'}</span>
              </div>
            </div>
            
            <div className="flex-1 min-h-[250px]">
              <Line 
                data={{
                  labels: analytics.daily.map(d => new Date(d.date).toLocaleDateString('en-IN', { weekday: 'short' })),
                  datasets: [{
                    label: 'Earnings',
                    data: analytics.daily.map(d => d.daily_total),
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 6,
                    pointBackgroundColor: '#f59e0b',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      backgroundColor: '#1e293b',
                      titleFont: { size: 14, weight: 'bold' },
                      bodyFont: { size: 12 },
                      padding: 12,
                      cornerRadius: 12,
                      displayColors: false
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      grid: { color: 'rgba(0,0,0,0.05)' },
                      ticks: { font: { weight: 'bold' } }
                    },
                    x: {
                      grid: { display: false },
                      ticks: { font: { weight: 'bold' } }
                    }
                  }
                }}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="card-modern p-6 flex items-center justify-between group hover:border-primary dark:hover:border-primary transition-all">
               <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Star size={28} fill="currentColor" />
                  </div>
                  <div>
                    <p className="text-2xl font-black">{analytics.summary?.rating || '5.00'}</p>
                    <p className="text-[10px] font-black uppercase text-slate-400">Pilot Rating</p>
                  </div>
               </div>
               <ChevronRight size={20} className="text-slate-300" />
            </div>

            <div className="card-modern p-6 flex items-center justify-between group hover:border-primary dark:hover:border-primary transition-all">
               <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Zap size={28} />
                  </div>
                  <div>
                    <p className="text-2xl font-black">{analytics.summary?.total_trips || '0'}</p>
                    <p className="text-[10px] font-black uppercase text-slate-400">Lifetime Trips</p>
                  </div>
               </div>
               <ChevronRight size={20} className="text-slate-300" />
            </div>

            <div className="card-modern p-6 bg-primary text-white border-none shadow-glow-indigo overflow-hidden relative">
               <div className="relative z-10 flex flex-col h-full justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Available for Payout</p>
                    <p className="text-4xl font-display font-black italic">₹{user?.wallet_balance || '0.00'}</p>
                  </div>
                  <button className="mt-6 w-full py-3 bg-white text-primary rounded-xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-transform">
                    Request Payout
                  </button>
               </div>
               <Wallet size={120} className="absolute -right-8 -bottom-8 opacity-10 rotate-12" />
            </div>
          </div>
        </div>
      )}

      <div className="w-full flex flex-col lg:flex-row gap-8 items-stretch">
        <div className={`w-full ${user?.role === 'driver' ? 'grid grid-cols-1 lg:grid-cols-2 gap-8' : 'flex-1 max-w-2xl'}`}>
          {/* Personal Console */}
          <div className="card-modern p-8 flex flex-col h-full">
            <div className="flex flex-col items-center text-center">
              <div className="relative group cursor-pointer mb-6">
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  id="avatar-upload" 
                  onChange={handleAvatarUpload}
                  disabled={avatarLoading}
                />
                <label htmlFor="avatar-upload" className="w-24 h-24 rounded-[32px] bg-slate-100 dark:bg-white/5 flex items-center justify-center text-4xl font-black text-slate-400 border-2 border-slate-200 dark:border-white/5 overflow-hidden cursor-pointer relative shadow-lg">
                  {avatarLoading ? (
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  ) : user?.avatar_url ? (
                    <img src={`http://localhost:5000${user.avatar_url}`} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    user?.name?.charAt(0)
                  )}
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="text-white" size={24} />
                  </div>
                </label>
              </div>
              <h3 className="text-2xl font-display font-black tracking-tight">
                {user?.name}
              </h3>
              <p className="text-xs font-black uppercase tracking-widest text-primary mt-1 italic">
                {user?.role}
              </p>
            </div>

            <div className="flex-1 flex flex-col space-y-4 pt-8 border-t border-slate-100 dark:border-white/5 text-sm text-left">
              {isEditing ? (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">
                      Full Name
                    </label>
                    <input
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3 font-bold"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">
                      Phone Number
                    </label>
                    <input
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3 font-bold"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      required
                    />
                  </div>
                  {user.role === "driver" && (
                    <>
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">
                          Vehicle Model
                        </label>
                        <input
                          className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3 font-bold"
                          value={formData.vehicle_model}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              vehicle_model: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">
                          License Plate
                        </label>
                        <input
                          className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3 font-bold"
                          value={formData.vehicle_plate}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              vehicle_plate: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                    </>
                  )}
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">
                      New Password (Optional)
                    </label>
                    <input
                      type="password"
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3 font-bold"
                      placeholder="Leave blank to keep same"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={editLoading}
                      className="flex-1 py-3 bg-obsidian text-white dark:bg-ghost dark:text-obsidian rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-obsidian/20"
                    >
                      {editLoading ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-3 bg-slate-100 dark:bg-white/5 rounded-xl font-black uppercase text-[10px] tracking-widest"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-4 text-slate-500 font-medium">
                      <Mail size={18} /> Email
                    </div>
                    <span className="font-bold group-hover:text-primary transition-colors">
                      {user?.email}
                    </span>
                  </div>
                  <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-4 text-slate-500 font-medium">
                      <Phone size={18} /> Phone
                    </div>
                    <span className="font-bold group-hover:text-primary transition-colors">
                      {user?.phone ? (
                        <a href={`tel:${user.phone}`}>{user.phone}</a>
                      ) : "Not set"}
                    </span>
                  </div>
                  {user.role === "driver" && (
                    <>
                      <div className="flex items-center justify-between group">
                        <div className="flex items-center gap-4 text-slate-500 font-medium">
                          <Settings size={18} /> Vehicle
                        </div>
                        <span className="font-bold group-hover:text-primary transition-colors">
                          {driverInfo ? (driverInfo.vehicle_model || "Not set") : "Loading..."}
                        </span>
                      </div>
                      <div className="flex items-center justify-between group">
                        <div className="flex items-center gap-4 text-slate-500 font-medium">
                          <CreditCard size={18} /> Plate
                        </div>
                        <span className="font-bold group-hover:text-primary transition-colors">
                          {driverInfo ? (driverInfo.vehicle_plate || "Not set") : "Loading..."}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-4 text-slate-500 font-medium">
                      <ShieldCheck size={18} /> Identity
                    </div>
                    <span className="text-xs font-black uppercase text-secondary">
                      Verified
                    </span>
                  </div>

                  {editSuccess && (
                    <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl font-bold text-[10px] uppercase text-center flex items-center justify-center gap-2">
                      <CheckCircle size={14} /> Profile Synchronized
                    </div>
                  )}

                  <div className="mt-auto space-y-4 pt-4">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="w-full py-4 bg-slate-100 dark:bg-white/5 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                    >
                      <Settings size={14} /> Edit Profile Settings
                    </button>
                    <button
                      onClick={() => setShowPublicView(true)}
                      className="w-full py-4 bg-primary/10 text-primary rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                      <ShieldCheck size={14} /> View Public Profile
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Side-by-side SOS for Drivers */}
          {user?.role === 'driver' && (
            <div className="card-modern p-8 flex flex-col h-full border-primary/20">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h4 className="text-2xl font-display font-black uppercase italic">Safety <span className="text-secondary">Network</span></h4>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Emergency SOS Contacts</p>
                </div>
                <button 
                  onClick={() => setIsAddingContact(!isAddingContact)}
                  className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center hover:bg-primary hover:text-white transition-all"
                >
                  <Plus size={24} className={isAddingContact ? 'rotate-45' : ''} />
                </button>
              </div>

              <div className="flex-1 space-y-6">
                {isAddingContact && (
                  <form onSubmit={handleAddContact} className="p-6 bg-slate-50 dark:bg-white/5 rounded-[32px] border border-primary/20 animate-slide-up space-y-4">
                    <input 
                      type="text" placeholder="Contact Name" 
                      className="w-full bg-white dark:bg-obsidian border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-3 text-sm font-bold shadow-inner"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                    />
                    <input 
                      type="text" placeholder="Phone Number" 
                      className="w-full bg-white dark:bg-obsidian border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-3 text-sm font-bold shadow-inner"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({...contactForm, phone: e.target.value})}
                    />
                    <input 
                      type="text" placeholder="Relationship" 
                      className="w-full bg-white dark:bg-obsidian border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-3 text-sm font-bold shadow-inner"
                      value={contactForm.relationship}
                      onChange={(e) => setContactForm({...contactForm, relationship: e.target.value})}
                    />
                    <button type="submit" className="w-full py-4 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-transform">
                      Authorize Contact
                    </button>
                  </form>
                )}

                <div className="space-y-4">
                  {emergencyContacts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-300">
                      <ShieldCheck size={48} className="mb-4 opacity-20" />
                      <p className="text-sm font-bold italic">Your network is empty.</p>
                      <p className="text-[10px] uppercase font-black tracking-widest mt-1 opacity-50">Add emergency contacts for pilot safety</p>
                    </div>
                  ) : (
                    emergencyContacts.map(contact => (
                      <div 
                        key={contact.id} 
                        className="flex items-center justify-between p-5 bg-slate-50 dark:bg-white/5 rounded-[32px] group hover:border-primary border border-transparent transition-all cursor-pointer"
                        onClick={() => window.location.href = `tel:${contact.phone}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center">
                            <Phone size={20} />
                          </div>
                          <div>
                            <p className="text-base font-bold">{contact.name}</p>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider">
                              {contact.relationship || 'Contact'} • {contact.phone}
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteContact(contact.id);
                          }}
                          className="p-3 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Plus size={18} className="rotate-45" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-auto pt-8 border-t border-dashed border-slate-200 dark:border-white/10">
                 <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/20">
                    <Zap size={16} className="text-primary" />
                    <p className="text-[10px] font-bold text-primary dark:text-primary/80 uppercase italic">Your safety network is private and used only for emergency SOS triggers.</p>
                 </div>
              </div>
            </div>
          )}




          </div>
          
          {/* Saved Destinations Panel */}
          {user?.role === 'customer' && (
            <div className="w-full lg:w-80 shrink-0">
              <div className="card-modern p-6 space-y-6 h-full flex flex-col">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-sm uppercase tracking-widest text-slate-400">Saved Destinations</h3>
                  <button 
                    onClick={() => setIsAddingLocation(!isAddingLocation)}
                    className="p-2 bg-slate-100 dark:bg-white/5 rounded-lg text-primary hover:bg-primary hover:text-white transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                
                {isAddingLocation && (
                  <form onSubmit={handleAddLocation} className="p-4 bg-slate-50 dark:bg-white/5 rounded-xl space-y-3">
                    <input 
                      type="text" 
                      placeholder="Name (e.g. Home, Gym)" 
                      className="w-full bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 rounded-lg p-2 text-xs font-bold"
                      value={newLocationForm.name}
                      onChange={e => setNewLocationForm({...newLocationForm, name: e.target.value})}
                      required
                    />
                    <input 
                      type="text" 
                      placeholder="Address or Landmark" 
                      className="w-full bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 rounded-lg p-2 text-xs font-bold"
                      value={newLocationForm.address}
                      onChange={e => setNewLocationForm({...newLocationForm, address: e.target.value})}
                      required
                    />
                    <div className="flex gap-2 pt-2">
                      <button type="submit" disabled={locationLoading} className="flex-1 bg-primary text-white text-[10px] font-black uppercase tracking-widest py-2 rounded-lg">
                        {locationLoading ? 'Saving...' : 'Save'}
                      </button>
                      <button type="button" onClick={() => setIsAddingLocation(false)} className="flex-1 bg-slate-200 dark:bg-white/10 text-[10px] font-black uppercase tracking-widest py-2 rounded-lg">
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                <div className="space-y-3">
                  {savedLocations.length === 0 ? (
                    <p className="text-xs text-slate-400 font-medium italic text-center py-4">No saved destinations yet.</p>
                  ) : (
                    savedLocations.map(loc => (
                      <div 
                        key={loc.id} 
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/5 group cursor-pointer hover:border-primary border border-transparent transition-all"
                        onClick={() => navigate('/customer/book', { state: { prefilledDestination: loc } })}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                            <MapPin size={14} />
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-bold">{loc.name}</p>
                            <p className="text-[10px] text-slate-500 truncate max-w-[120px]">{loc.address}</p>
                          </div>
                        </div>
                        <button 
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              await api.delete(`/locations/${loc.id}`);
                              setSavedLocations(prev => prev.filter(l => l.id !== loc.id));
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                          className="text-[10px] font-bold text-red-500 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest"
                        >
                          Remove
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

      {/* Phase 2: Safety & Personalization */}
      {user?.role === 'customer' && (
        <div className="space-y-6">
          <h3 className="text-xl font-display font-black uppercase italic tracking-tight flex items-center gap-3">
            <ShieldCheck className="text-emerald-500" /> Safety & <span className="text-electric-cyan">Personalization</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Emergency Contacts */}
            <div className="card-premium h-full flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h4 className="text-lg font-display font-black uppercase italic">Safety Network</h4>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Emergency SOS Contacts</p>
                </div>
                <button 
                  onClick={() => setIsAddingContact(!isAddingContact)}
                  className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center hover:bg-primary hover:text-white transition-all"
                >
                  <Plus size={20} className={isAddingContact ? 'rotate-45' : ''} />
                </button>
              </div>

              <div className="flex-1 space-y-4">
                {isAddingContact && (
                  <form onSubmit={handleAddContact} className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-primary/20 animate-slide-up space-y-3">
                    <input 
                      type="text" placeholder="Contact Name" 
                      className="w-full bg-white dark:bg-obsidian border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-xs font-bold"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                    />
                    <input 
                      type="text" placeholder="Phone Number" 
                      className="w-full bg-white dark:bg-obsidian border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-xs font-bold"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({...contactForm, phone: e.target.value})}
                    />
                    <input 
                      type="text" placeholder="Relationship (e.g. Brother)" 
                      className="w-full bg-white dark:bg-obsidian border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-xs font-bold"
                      value={contactForm.relationship}
                      onChange={(e) => setContactForm({...contactForm, relationship: e.target.value})}
                    />
                    <button type="submit" className="w-full py-2 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-glow-indigo">
                      Add to Network
                    </button>
                  </form>
                )}

                <div className="space-y-3">
                  {emergencyContacts.length === 0 ? (
                    <p className="text-xs text-slate-400 font-medium italic text-center py-4">No SOS contacts added.</p>
                  ) : (
                    emergencyContacts.map(contact => (
                      <div 
                        key={contact.id} 
                        className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl group cursor-pointer hover:border-emerald-500/30 border border-transparent transition-all"
                        onClick={() => window.location.href = `tel:${contact.phone}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center">
                            <Phone size={16} />
                          </div>
                          <div>
                            <p className="text-sm font-bold">{contact.name}</p>
                            <p className="text-[10px] text-slate-500 font-black uppercase">
                              {contact.relationship || 'Contact'} • {contact.phone}
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteContact(contact.id);
                          }}
                          className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Plus size={14} className="rotate-45" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Ride Preferences */}
            <div className="card-premium h-full">
              <div className="mb-8">
                <h4 className="text-lg font-display font-black uppercase italic">Travel Style</h4>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Personalize your journey</p>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${preferences.silent_ride ? 'bg-primary/10 text-primary' : 'bg-slate-100 dark:bg-white/5 text-slate-400'}`}>
                      <Zap size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold italic uppercase">Silent Ride</p>
                      <p className="text-[10px] text-slate-500 font-medium italic">No unnecessary conversation</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => updatePreferences({...preferences, silent_ride: !preferences.silent_ride})}
                    className={`w-12 h-6 rounded-full transition-all relative ${preferences.silent_ride ? 'bg-primary' : 'bg-slate-200 dark:bg-white/10'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${preferences.silent_ride ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${preferences.ac_needed ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-100 dark:bg-white/5 text-slate-400'}`}>
                      <Settings size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold italic uppercase">Climate Control</p>
                      <p className="text-[10px] text-slate-500 font-medium italic">Prefer AC/Heating on</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => updatePreferences({...preferences, ac_needed: !preferences.ac_needed})}
                    className={`w-12 h-6 rounded-full transition-all relative ${preferences.ac_needed ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-white/10'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${preferences.ac_needed ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${preferences.music_allowed ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-100 dark:bg-white/5 text-slate-400'}`}>
                      <Star size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold italic uppercase">Audio Ambiance</p>
                      <p className="text-[10px] text-slate-500 font-medium italic">Music during the trip</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => updatePreferences({...preferences, music_allowed: !preferences.music_allowed})}
                    className={`w-12 h-6 rounded-full transition-all relative ${preferences.music_allowed ? 'bg-amber-500' : 'bg-slate-200 dark:bg-white/10'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${preferences.music_allowed ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
              </div>

              <div className="mt-8 p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-dashed border-slate-200 dark:border-white/10 text-center">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Your preferences are shared with pilots upon booking</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Phase 3: Digital Document Vault */}
      {user?.role === 'driver' && (
        <div className="space-y-6">
          <h3 className="text-xl font-display font-black uppercase italic tracking-tight flex items-center gap-3">
            <FileText className="text-primary" /> Digital <span className="text-electric-cyan">Document Vault</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { type: 'license', label: 'Driving License', icon: <CreditCard /> },
              { type: 'rc', label: 'Vehicle RC', icon: <FileText /> },
              { type: 'insurance', label: 'Insurance Policy', icon: <ShieldCheck /> }
            ].map((doc) => {
              const savedDoc = documents.find(d => d.document_type === doc.type);
              return (
                <div key={doc.type} className="card-modern p-6 flex flex-col justify-between group hover:border-primary dark:hover:border-primary transition-all">
                  <div className="flex items-start justify-between mb-6">
                    <div className={`p-4 rounded-2xl ${savedDoc ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-100 dark:bg-white/5 text-slate-400'}`}>
                      {doc.icon}
                    </div>
                    {savedDoc && (
                      <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${
                        savedDoc.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' :
                        savedDoc.status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                        'bg-amber-500/10 text-amber-500'
                      }`}>
                        {savedDoc.status}
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="text-lg font-black italic uppercase">{doc.label}</h4>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">
                      {savedDoc ? `Uploaded ${new Date(savedDoc.created_at).toLocaleDateString()}` : 'Verification Required'}
                    </p>
                  </div>

                  <div className="mt-6 pt-6 border-t border-slate-100 dark:border-white/5">
                    <input 
                      type="file" 
                      id={`upload-${doc.type}`}
                      className="hidden" 
                      onChange={(e) => handleDocumentUpload(doc.type, e.target.files[0])}
                    />
                    <label 
                      htmlFor={`upload-${doc.type}`}
                      className="w-full py-3 bg-slate-100 dark:bg-white/5 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 cursor-pointer hover:bg-primary hover:text-white transition-all"
                    >
                      {docLoading ? <Loader2 className="animate-spin" size={14} /> : savedDoc ? 'Update Document' : 'Upload File'}
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>

      {/* Image Crop Modal */}
      {imageToCrop && (
        <div className="fixed inset-0 z-[100] bg-obsidian/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 sm:p-10 animate-fade-in">
          <div className="w-full max-w-2xl bg-white dark:bg-obsidian-card rounded-[40px] overflow-hidden shadow-2xl flex flex-col h-[80vh]">
            <div className="p-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-display font-black uppercase italic">Crop <span className="text-electric-cyan">Avatar</span></h3>
                <p className="text-xs text-slate-500 font-medium">Position your photo within the frame.</p>
              </div>
              <button onClick={() => setImageToCrop(null)} className="p-3 bg-slate-100 dark:bg-white/5 rounded-2xl hover:scale-110 transition-transform">
                 <Plus size={20} className="rotate-45" />
              </button>
            </div>
            
            <div className="flex-1 relative bg-slate-900">
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Zoom Control</p>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(e.target.value)}
                  className="w-full accent-primary"
                />
              </div>
              
              <div className="flex gap-4">
                <button
                  onClick={handleSaveCroppedImage}
                  disabled={avatarLoading}
                  className="flex-1 btn-modern-primary h-14"
                >
                  {avatarLoading ? 'Processing...' : 'Crop & Save'}
                </button>
                <button
                  onClick={() => setImageToCrop(null)}
                  className="px-8 bg-slate-100 dark:bg-white/5 rounded-2xl font-black uppercase text-[10px] tracking-widest"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Public View Modal */}
      {showPublicView && (
        <div className="fixed inset-0 z-[100] bg-obsidian/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-obsidian-card rounded-[40px] overflow-hidden shadow-2xl relative animate-scale-in">
            <button 
              onClick={() => setShowPublicView(false)}
              className="absolute top-6 right-6 p-2 bg-slate-100 dark:bg-white/5 rounded-xl z-10"
            >
              <Plus size={16} className="rotate-45" />
            </button>
            
            <div className="h-32 bg-gradient-to-br from-primary to-secondary relative">
               <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-24 h-24 rounded-[32px] bg-white dark:bg-obsidian border-4 border-white dark:border-obsidian overflow-hidden shadow-xl">
                  {user?.avatar_url ? (
                    <img src={`http://localhost:5000${user.avatar_url}`} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl font-black text-slate-300">
                      {user?.name?.charAt(0)}
                    </div>
                  )}
               </div>
            </div>
            
            <div className="pt-16 pb-10 px-8 text-center space-y-6">
              <div>
                <h4 className="text-2xl font-display font-black italic uppercase">{user?.name}</h4>
                <p className="text-[10px] font-black uppercase text-primary tracking-[0.2em] mt-1">{user?.role} Pilot</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Status</p>
                  <p className="text-xs font-bold text-emerald-500">Active</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Rating</p>
                  <p className="text-xs font-bold">5.0 ⭐</p>
                </div>
              </div>
              
              <div className="space-y-2 text-left">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Verified Credentials</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-primary/10 text-primary text-[9px] font-black rounded-full uppercase">Identity Verified</span>
                  <span className="px-3 py-1 bg-secondary/10 text-secondary text-[9px] font-black rounded-full uppercase">Phone Linked</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Profile;
