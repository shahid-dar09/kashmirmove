import { useState, useContext, useEffect } from "react";
import { useNavigate, useLocation, Link, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  MapPin,
  History,
  User,
  LogOut,
  Menu,
  X,
  Bell,
  Moon,
  Sun,
  ChevronLeft,
  Truck,
  ShieldCheck,
  Zap,
  Navigation,
  Users,
  Car,
  ChevronRight,
  Home,
  ClipboardList,
} from "lucide-react";
import { AuthContext } from "../context/AuthContextValue";
import { io } from "socket.io-client";
import api from "../services/api";

// Professional Audio Assets (CDN URLs)
const SOUNDS = {
  NOTIFICATION:
    "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3",
  SUCCESS: "https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3",
  REQUEST: "https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3",
};

const SidebarLayout = () => {
  const { user, logout, triggerRefresh, refreshTrigger } =
    useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [activeRide, setActiveRide] = useState(null);
  const [notifications, setNotifications] = useState(() => {
    if (!user) return [];
    const stored = localStorage.getItem(`notifs_${user.id}`);
    return stored ? JSON.parse(stored) : [];
  });
  const [showNotifs, setShowNotifs] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem("theme");
    return stored === "dark";
  });

  // Apply dark class to <html>
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  // Sync notifications to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem(`notifs_${user.id}`, JSON.stringify(notifications));
    }
  }, [notifications, user]);

  // Audio Utility
  const playSound = (url) => {
    const audio = new Audio(url);
    audio.volume = 0.4;
    audio
      .play()
      .catch((e) =>
        console.log("Audio playback failed (interaction required):", e),
      );
  };

  // Voice Announcement Utility
  const speak = (text) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Celebration Utility
  const celebrateCompletion = () => {
    const script = document.createElement("script");
    script.src =
      "https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js";
    script.onload = () => {
      window.confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#7C3AED", "#06B6D4", "#10B981", "#F59E0B"],
      });
    };
    document.head.appendChild(script);
  };

  // Socket.io for real-time notifications
  useEffect(() => {
    if (!user?.id) return;
    const SOCKET_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000`;
    const socket = io(SOCKET_URL, { reconnectionAttempts: 3 });
    socket.emit("join", user.id);

    socket.on("new_ride_request", (data) => {
      setNotifications((prev) => [
        {
          id: Date.now(),
          title: "New Ride Request!",
          ...data,
          read: false,
          time: new Date(),
        },
        ...prev,
      ]);
      playSound(SOUNDS.REQUEST);
      triggerRefresh();
    });

    socket.on("booking_status_updated", (data) => {
      setNotifications((prev) => [
        {
          id: Date.now(),
          title: `Ride ${data.status}`,
          ...data,
          read: false,
          time: new Date(),
        },
        ...prev,
      ]);

      if (data.status === "completed") {
        playSound(SOUNDS.SUCCESS);
        speak("Ride completed. Thank you for using Kashmir Move.");
        celebrateCompletion();
      } else {
        playSound(SOUNDS.NOTIFICATION);
        if (data.status === "accepted") {
          speak("Your ride has been accepted by a pilot.");
        }
      }

      triggerRefresh();
    });

    socket.on("ride_otp_issued", (data) => {
      setNotifications((prev) => [
        {
          id: Date.now(),
          title: "Ride OTP Issued",
          otp: data.otp,
          type: "otp",
          read: false,
          time: new Date(),
        },
        ...prev,
      ]);
      playSound(SOUNDS.NOTIFICATION);
    });

    return () => socket.disconnect();
  }, [user?.id, triggerRefresh]);

  // Global Active Ride Check
  useEffect(() => {
    if (user?.role !== "customer") return;
    const checkActiveRide = async () => {
      try {
        const res = await api.get("/customer/bookings");
        const active = res.data.bookings?.find(
          (r) =>
            r.status === "accepted" ||
            r.status === "started" ||
            r.status === "pending",
        );
        setActiveRide(active || null);
      } catch (err) {
        console.error("Active ride check failed:", err);
      }
    };

    Promise.resolve().then(() => {
      checkActiveRide();
    });

    const interval = setInterval(checkActiveRide, 15000);
    return () => clearInterval(interval);
  }, [user, refreshTrigger]);

  const navItems = {
    customer: [
      { path: "/dashboard", icon: LayoutDashboard, label: "Overview" },
      { path: "/customer/book", icon: Navigation, label: "Book Ride" },
      { path: "/customer/rides", icon: History, label: "My Rides" },
      { path: "/profile", icon: User, label: "Profile" },
    ],
    driver: [
      { path: "/driver/dashboard", icon: LayoutDashboard, label: "Overview" },
      { path: "/driver/requests", icon: MapPin, label: "Requests" },
      { path: "/driver/history", icon: History, label: "History" },
      { path: "/profile", icon: User, label: "Profile" },
    ],
    admin: [
      { path: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { path: "/admin/drivers", icon: Truck, label: "Drivers" },
      { path: "/admin/customers", icon: Users, label: "Customers" },
      { path: "/admin/pending", icon: ShieldCheck, label: "Approvals" },
      { path: "/admin/audit", icon: ClipboardList, label: "Audit" },
    ],
  };

  const currentNav = navItems[user?.role] || [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const clearNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Breadcrumbs logic
  const pathnames = location.pathname.split("/").filter((x) => x);
  const breadcrumbs = pathnames.map((name, index) => {
    const routeTo = `/${pathnames.slice(0, index + 1).join("/")}`;
    return {
      name: name.charAt(0).toUpperCase() + name.slice(1),
      path: routeTo,
    };
  });

  const homePath = user?.role === 'admin' ? '/admin/dashboard' : user?.role === 'driver' ? '/driver/dashboard' : '/dashboard';

  return (
    <div className="min-h-screen flex bg-[#f8f9fa] dark:bg-midnight transition-colors duration-500 overflow-x-hidden">

      {/* ===== DESKTOP SIDEBAR ===== */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 hidden md:flex flex-col
          transition-[width] duration-700 cubic-bezier(0.2, 0.8, 0.2, 1)
          glass-sidebar border-r border-slate-200/50 dark:border-white/5
          ${isCollapsed ? "w-[80px]" : "w-72"}`}
      >
        <Link
          to={homePath}
          className={`h-24 flex items-center shrink-0 transition-all duration-500 w-full group ${isCollapsed ? 'px-0' : 'px-6'}`}
        >
          <div className={`relative w-14 h-11 flex items-center justify-center shrink-0 overflow-visible transition-all duration-500 ${isCollapsed ? 'mx-auto' : ''}`}>
            <div className="relative w-full h-full bg-primary rounded-xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-sm group-hover:shadow-primary/40">
              <div className="relative flex items-center justify-center w-full">
                <Car className="text-white absolute transition-all duration-500 translate-x-[-4px] group-hover:translate-x-[-14px] group-hover:scale-110" size={20} />
                <Truck className="text-white absolute transition-all duration-500 translate-x-[6px] group-hover:translate-x-[14px] group-hover:scale-110" size={20} />
              </div>
            </div>
          </div>
          <div className={`ml-4 transition-all duration-500 ${isCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100 overflow-visible'}`}>
            <span className="text-2xl font-display font-black italic tracking-tight uppercase pr-8 whitespace-nowrap">
              Kashmir<span className="text-primary">Move</span>
            </span>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 leading-none mt-1">
              {user?.role} Network
            </p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {currentNav.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-500 relative group overflow-hidden ${isActive ? "text-white bg-primary" : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-primary dark:hover:text-white"}`}
                title={isCollapsed ? item.label : ""}
              >
                <item.icon
                  className={`w-5 h-5 shrink-0 transition-all duration-300 ${isActive ? "animate-spring text-white" : "text-slate-500 dark:text-slate-400 group-hover:scale-110 group-hover:rotate-6 group-hover:text-primary"}`}
                />
                <span
                  className={`font-bold text-sm whitespace-nowrap transition-all duration-500 ${isCollapsed ? "w-0 opacity-0 overflow-hidden" : "w-auto opacity-100"}`}
                >
                  {item.label}
                </span>
                {isActive && !isCollapsed && (
                  <div className="absolute right-4 w-1 h-4 rounded-full bg-white/40" />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
              </Link>
            );
          })}
        </nav>

        {/* Desktop Footer */}
        <div className={`space-y-2 border-t border-slate-200/50 dark:border-white/5 shrink-0 transition-all duration-500 ${isCollapsed ? "p-2" : "p-4"}`}>
          <button
            onClick={() => setIsDark((d) => !d)}
            className={`w-full flex items-center rounded-2xl transition-all duration-300 group hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400 ${isCollapsed ? "justify-center h-12 px-0 gap-0" : "px-4 py-3 gap-3"}`}
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-saffron group-hover:rotate-90 transition-transform duration-500" />
            ) : (
              <Moon className="w-5 h-5 text-primary group-hover:-rotate-12 transition-transform duration-500" />
            )}
            <span className={`font-bold text-sm whitespace-nowrap transition-all duration-500 ${isCollapsed ? "w-0 opacity-0 overflow-hidden" : "w-auto opacity-100"}`}>
              {isDark ? "Luminance" : "Obsidian"}
            </span>
          </button>

          <button
            onClick={handleLogout}
            className={`w-full flex items-center rounded-2xl text-rose hover:bg-rose/10 transition-all duration-300 group ${isCollapsed ? "justify-center h-12 px-0 gap-0" : "px-4 py-3 gap-3"}`}
          >
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className={`font-bold text-sm whitespace-nowrap transition-all duration-500 ${isCollapsed ? "w-0 opacity-0 overflow-hidden" : "w-auto opacity-100"}`}>
              Terminate
            </span>
          </button>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`w-full mt-4 h-12 flex items-center justify-center rounded-2xl transition-all duration-300
              ${isCollapsed ? "bg-primary/10 text-primary hover:bg-primary hover:text-white" : "bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-primary/10 hover:text-primary"}`}
          >
            <ChevronLeft className={`w-5 h-5 transition-transform duration-700 ${isCollapsed ? "rotate-180" : ""}`} />
          </button>
        </div>
      </aside>

      {/* ===== MAIN AREA ===== */}
      <main
        className={`flex-1 min-w-0 transition-[margin] duration-700 cubic-bezier(0.2, 0.8, 0.2, 1) flex flex-col min-h-screen
        ${isCollapsed ? "md:ml-[80px]" : "md:ml-72"}`}
      >
        {/* ===== HEADER ===== */}
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-midnight/80 backdrop-blur-xl h-16 sm:h-20 px-3 sm:px-8 flex items-center justify-between border-b border-slate-200/50 dark:border-white/5">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            {/* Mobile: Brand Logo */}
            <Link
              to={homePath}
              className="flex items-center gap-2.5 group md:hidden"
            >
              <div className="relative w-9 h-8 flex items-center justify-center overflow-visible">
                <div className="relative w-full h-full bg-primary rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                  <div className="relative flex items-center justify-center w-full">
                    <Car className="text-white absolute transition-all duration-500 translate-x-[-3px] group-hover:translate-x-[-9px]" size={13} />
                    <Truck className="text-white absolute transition-all duration-500 translate-x-[4px] group-hover:translate-x-[9px]" size={13} />
                  </div>
                </div>
              </div>
              <span className="text-base font-display font-black italic tracking-tight uppercase text-slate-900 dark:text-white">
                Kashmir<span className="text-primary">Move</span>
              </span>
            </Link>

            {/* Desktop: Breadcrumbs */}
            <div className="hidden md:flex items-center gap-2">
              <Link to={homePath} className="text-slate-400 hover:text-primary transition-colors">
                <Home size={16} />
              </Link>
              {breadcrumbs.map((crumb, i) => (
                <div key={i} className="flex items-center gap-2">
                  <ChevronRight size={14} className="text-slate-300" />
                  <Link
                    to={crumb.path}
                    className={`text-xs font-black uppercase tracking-widest ${i === breadcrumbs.length - 1 ? "text-primary" : "text-slate-400 hover:text-primary transition-colors"}`}
                  >
                    {crumb.name}
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Active Ride Indicator */}
            {activeRide && (
              <Link
                to={activeRide.status === "started" ? `/customer/ride/${activeRide.id}` : `/customer/waiting/${activeRide.id}`}
                className="flex items-center gap-2 px-2.5 py-2 sm:px-4 bg-primary/10 text-primary border border-primary/20 rounded-2xl hover:bg-primary hover:text-white transition-all animate-pulse"
              >
                <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">Active Mission</span>
              </Link>
            )}

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifs(!showNotifs)}
                className={`relative p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-white/5 shadow-sm border border-slate-200 dark:border-white/10 transition-all ${unreadCount > 0 ? "text-primary ring-2 ring-primary/10" : "text-slate-500"}`}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full border-2 border-white dark:border-midnight animate-pulse" />
                )}
              </button>

              {showNotifs && (
                <div className="fixed inset-x-3 top-[4.25rem] sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-4 sm:w-96 max-w-[calc(100vw-1.5rem)] bg-white dark:bg-obsidian-card rounded-[24px] sm:rounded-[32px] shadow-premium border border-slate-200 dark:border-white/10 p-4 sm:p-6 z-50 animate-scale-in origin-top-right">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-black text-sm uppercase tracking-[0.2em]">Notifications</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{unreadCount} New</p>
                    </div>
                    <button onClick={markAllAsRead} className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">
                      Mark all read
                    </button>
                  </div>
                  <div className="space-y-3 max-h-[55vh] sm:max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
                    {notifications.length === 0 ? (
                      <div className="py-10 text-center opacity-40">
                        <Bell size={40} className="mx-auto mb-3" />
                        <p className="text-xs font-bold italic uppercase tracking-widest">Quiet in the valley...</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-4 rounded-[20px] border transition-all relative group ${n.read ? "bg-slate-50/50 dark:bg-white/[0.02] border-transparent" : "bg-primary/5 border-primary/20"}`}
                        >
                          <button
                            onClick={(e) => { e.stopPropagation(); clearNotification(n.id); }}
                            className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={12} className="text-slate-400" />
                          </button>
                          <div className="flex gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${n.type === "otp" ? "bg-saffron/10 text-saffron" : "bg-primary/10 text-primary"}`}>
                              {n.type === "otp" ? <ShieldCheck size={16} /> : <Zap size={16} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`font-black text-xs mb-1 ${n.read ? "text-slate-500" : "text-slate-900 dark:text-white"}`}>{n.title}</p>
                              {n.type === "otp" ? (
                                <div className="mt-1.5 flex items-center justify-center bg-white/50 dark:bg-white/5 p-2 rounded-xl border border-dashed border-primary/30">
                                  <span className="text-xl font-black text-primary tracking-[0.3em] font-display">{n.otp}</span>
                                </div>
                              ) : (
                                <p className="text-[10px] text-slate-500 font-medium leading-relaxed truncate">{n.status || n.pickupLocation || "Update received"}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar */}
            <div className="flex items-center gap-2 sm:gap-4 sm:pl-3 sm:border-l border-slate-200 dark:border-white/10">
              <div className="hidden lg:block text-right">
                <p className="text-xs font-black uppercase tracking-widest leading-none mb-1">{user?.name}</p>
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-primary italic">Online</p>
              </div>
              <Link to="/profile" className="group relative">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[14px] bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-sm group-hover:scale-105 transition-all overflow-hidden">
                  {user?.avatar_url ? (
                    <img src={`${import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000`}${user.avatar_url}`} alt="P" className="w-full h-full object-cover" />
                  ) : (
                    user?.name?.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-secondary rounded-full border-2 border-white dark:border-midnight" />
              </Link>
            </div>
          </div>
        </header>

        {/* ===== CONTENT ===== */}
        <div className="flex-1 p-3 sm:p-6 lg:p-10 transition-all duration-500 pb-24 md:pb-10">
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </div>
      </main>

      {/* ===== MOBILE BOTTOM NAV BAR ===== */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="bg-white/95 dark:bg-midnight/95 backdrop-blur-xl border-t border-slate-200/70 dark:border-white/10 px-1 pt-2 pb-3">
          <div className="flex items-center justify-around">
            {currentNav.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex flex-col items-center gap-0.5 min-w-[52px] group"
                >
                  <div className={`relative w-11 h-9 flex items-center justify-center rounded-2xl transition-all duration-300 ${
                    isActive ? "bg-primary shadow-glow-saffron scale-105" : "active:scale-90"
                  }`}>
                    <item.icon
                      className={`w-5 h-5 transition-all duration-300 ${
                        isActive ? "text-white" : "text-slate-400 dark:text-slate-500"
                      }`}
                    />
                    {activeRide && item.path === '/customer/book' && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-secondary rounded-full border border-white dark:border-midnight animate-pulse" />
                    )}
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-wide transition-colors leading-none ${
                    isActive ? "text-primary" : "text-slate-400 dark:text-slate-500"
                  }`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}

            {/* More (opens drawer) */}
            <button
              onClick={() => setIsMobileOpen(true)}
              className="flex flex-col items-center gap-0.5 min-w-[52px] group"
            >
              <div className="w-11 h-9 flex items-center justify-center rounded-2xl active:scale-90 transition-all duration-300">
                <Menu className="w-5 h-5 text-slate-400 dark:text-slate-500" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-wide text-slate-400 dark:text-slate-500 leading-none">More</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ===== MOBILE DRAWER ===== */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <div
            className="absolute inset-0 bg-obsidian/60 backdrop-blur-md animate-fade-in"
            onClick={() => setIsMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-[82vw] max-w-[290px] bg-white dark:bg-midnight flex flex-col shadow-2xl animate-slide-in-left">
            {/* Drawer Header */}
            <div className="h-18 flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-white/5">
              <div className="flex items-center gap-3">
                <div className="relative w-9 h-8 flex items-center justify-center overflow-visible">
                  <div className="relative w-full h-full bg-primary rounded-lg flex items-center justify-center">
                    <div className="relative flex items-center justify-center w-full">
                      <Car className="text-white absolute translate-x-[-3px]" size={13} />
                      <Truck className="text-white absolute translate-x-[4px]" size={13} />
                    </div>
                  </div>
                </div>
                <span className="text-lg font-display font-black italic tracking-tighter uppercase whitespace-nowrap">
                  Kashmir<span className="text-primary">Move</span>
                </span>
              </div>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* User info */}
            <div className="px-5 py-4 border-b border-slate-200 dark:border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-[14px] bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black overflow-hidden shrink-0">
                  {user?.avatar_url ? (
                    <img src={`${import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000`}${user.avatar_url}`} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    user?.name?.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white truncate">{user?.name}</p>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest">{user?.role} • Online</p>
                </div>
              </div>
            </div>

            {/* Nav Links */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {currentNav.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold transition-all ${location.pathname === item.path ? "bg-primary text-white" : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"}`}
                >
                  <item.icon size={18} />
                  <span className="text-sm">{item.label}</span>
                  {location.pathname === item.path && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60" />
                  )}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="p-3 border-t border-slate-200 dark:border-white/5 space-y-2">
              <button
                onClick={() => { setIsDark(!isDark); setIsMobileOpen(false); }}
                className="w-full py-3.5 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center gap-3 font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
              >
                {isDark ? <Sun size={18} className="text-saffron" /> : <Moon size={18} className="text-primary" />}
                <span className="text-sm">{isDark ? "Light Mode" : "Dark Mode"}</span>
              </button>
              <button
                onClick={handleLogout}
                className="w-full py-3.5 rounded-2xl bg-rose/10 text-rose font-bold flex items-center justify-center gap-3 hover:bg-rose/20 transition-all"
              >
                <LogOut size={18} />
                <span className="text-sm">Sign Out</span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

export default SidebarLayout;
