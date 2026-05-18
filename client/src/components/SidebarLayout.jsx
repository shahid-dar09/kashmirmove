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
    const socket = io(`http://${window.location.hostname}:5000`, { reconnectionAttempts: 3 });
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
  }, [user?.id]);

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

    // Defer update to avoid cascading render warning
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
      { path: "/driver/requests", icon: MapPin, label: "Ride Requests" },
      { path: "/driver/history", icon: History, label: "Trip History" },
      { path: "/profile", icon: User, label: "Profile" },
    ],
    admin: [
      { path: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { path: "/admin/drivers", icon: Truck, label: "All Drivers" },
      { path: "/admin/customers", icon: Users, label: "All Customers" },
      { path: "/admin/pending", icon: ShieldCheck, label: "Approvals" },
      { path: "/admin/audit", icon: ClipboardList, label: "Audit Ledger" },
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
          to={user?.role === 'admin' ? '/admin/dashboard' : user?.role === 'driver' ? '/driver/dashboard' : '/dashboard'}
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

        {/* Navigation */}
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

                {/* Active Indicator Bar */}
                {isActive && !isCollapsed && (
                  <div className="absolute right-4 w-1 h-4 rounded-full bg-white/40" />
                )}

                {/* Hover Effect Light */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div
          className={`space-y-2 border-t border-slate-200/50 dark:border-white/5 shrink-0 transition-all duration-500 ${isCollapsed ? "p-2" : "p-4"}`}
        >
          <button
            onClick={() => setIsDark((d) => !d)}
            className={`w-full flex items-center rounded-2xl transition-all duration-300 group hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400 ${isCollapsed ? "justify-center h-12 px-0 gap-0" : "px-4 py-3 gap-3"}`}
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-saffron group-hover:rotate-90 transition-transform duration-500" />
            ) : (
              <Moon className="w-5 h-5 text-primary group-hover:-rotate-12 transition-transform duration-500" />
            )}
            <span
              className={`font-bold text-sm whitespace-nowrap transition-all duration-500 ${isCollapsed ? "w-0 opacity-0 overflow-hidden" : "w-auto opacity-100"}`}
            >
              {isDark ? "Luminance" : "Obsidian"}
            </span>
          </button>

          <button
            onClick={handleLogout}
            className={`w-full flex items-center rounded-2xl text-rose hover:bg-rose/10 transition-all duration-300 group ${isCollapsed ? "justify-center h-12 px-0 gap-0" : "px-4 py-3 gap-3"}`}
          >
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span
              className={`font-bold text-sm whitespace-nowrap transition-all duration-500 ${isCollapsed ? "w-0 opacity-0 overflow-hidden" : "w-auto opacity-100"}`}
            >
              Terminate
            </span>
          </button>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`w-full mt-4 h-12 flex items-center justify-center rounded-2xl transition-all duration-300
              ${
                isCollapsed
                  ? "bg-primary/10 text-primary hover:bg-primary hover:text-white"
                  : "bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-primary/10 hover:text-primary"
              }`}
          >
            <ChevronLeft
              className={`w-5 h-5 transition-transform duration-700 ${isCollapsed ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      </aside>

      {/* ===== MAIN AREA ===== */}
      <main
        className={`flex-1 min-w-0 transition-[margin] duration-700 cubic-bezier(0.2, 0.8, 0.2, 1) flex flex-col min-h-screen
        ${isCollapsed ? "md:ml-[80px]" : "md:ml-72"}`}
      >
        {/* ===== HEADER ===== */}
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-midnight/80 backdrop-blur-xl h-20 px-4 sm:px-8 flex items-center justify-between border-b border-slate-200/50 dark:border-white/5">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="p-3 rounded-2xl bg-white dark:bg-white/5 shadow-sm border border-slate-200 dark:border-white/10 md:hidden"
            >
              <Menu className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>

            {/* Breadcrumbs */}
            <div className="hidden sm:flex items-center gap-2">
              <Link
                to={
                  user?.role === "admin"
                    ? "/admin/dashboard"
                    : user?.role === "driver"
                      ? "/driver/dashboard"
                      : "/dashboard"
                }
                className="text-slate-400 hover:text-primary transition-colors"
              >
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

          <div className="flex items-center gap-3 sm:gap-4">
            {/* Active Ride Indicator */}
            {activeRide && (
              <Link
                to={
                  activeRide.status === "started"
                    ? `/customer/ride/${activeRide.id}`
                    : `/customer/waiting/${activeRide.id}`
                }
                className="hidden lg:flex items-center gap-3 px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-2xl hover:bg-primary hover:text-white transition-all animate-pulse"
              >
                <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  Active Mission
                </span>
              </Link>
            )}

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifs(!showNotifs)}
                className={`relative p-3 rounded-2xl bg-white dark:bg-white/5 shadow-sm border border-slate-200 dark:border-white/10 transition-all ${unreadCount > 0 ? "text-primary ring-2 ring-primary/10" : "text-slate-500"}`}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-primary rounded-full border-2 border-white dark:border-midnight animate-pulse" />
                )}
              </button>

              {showNotifs && (
                <div className="absolute right-0 mt-4 w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-obsidian-card rounded-[32px] shadow-premium border border-slate-200 dark:border-white/10 p-6 z-50 animate-scale-in origin-top-right">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h4 className="font-black text-sm uppercase tracking-[0.2em]">
                        Notifications
                      </h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">
                        {unreadCount} New Messages
                      </p>
                    </div>
                    <button
                      onClick={markAllAsRead}
                      className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
                    >
                      Mark all read
                    </button>
                  </div>

                  <div className="space-y-3 max-h-[440px] overflow-y-auto custom-scrollbar pr-2">
                    {notifications.length === 0 ? (
                      <div className="py-12 text-center opacity-40">
                        <Bell size={48} className="mx-auto mb-4" />
                        <p className="text-xs font-bold italic uppercase tracking-widest">
                          Quiet in the valley...
                        </p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-4 rounded-[24px] border transition-all relative group ${n.read ? "bg-slate-50/50 dark:bg-white/[0.02] border-transparent" : "bg-primary/5 border-primary/20 shadow-sm shadow-primary/5"}`}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              clearNotification(n.id);
                            }}
                            className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={12} className="text-slate-400" />
                          </button>

                          <div className="flex gap-4">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${n.type === "otp" ? "bg-saffron/10 text-saffron" : "bg-primary/10 text-primary"}`}
                            >
                              {n.type === "otp" ? (
                                <ShieldCheck size={18} />
                              ) : (
                                <Zap size={18} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p
                                className={`font-black text-xs mb-1 ${n.read ? "text-slate-500" : "text-slate-900 dark:text-white"}`}
                              >
                                {n.title}
                              </p>
                              {n.type === "otp" ? (
                                <div className="mt-2 flex flex-col items-center bg-white/50 dark:bg-white/5 p-3 rounded-xl border border-dashed border-primary/30">
                                  <span className="text-2xl font-black text-primary tracking-[0.3em] font-display">
                                    {n.otp}
                                  </span>
                                </div>
                              ) : (
                                <p className="text-[10px] text-slate-500 font-medium leading-relaxed truncate">
                                  {n.status ||
                                    n.pickupLocation ||
                                    "Update received"}
                                </p>
                              )}
                              <p className="text-[8px] font-black uppercase text-slate-400 mt-2">
                                Just now
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Terminal */}
            <div className="flex items-center gap-4 pl-4 border-l border-slate-200 dark:border-white/10">
              <div className="hidden lg:block text-right">
                <p className="text-xs font-black uppercase tracking-widest leading-none mb-1">
                  {user?.name}
                </p>
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-primary italic">
                  Online
                </p>
              </div>
              <Link to="/profile" className="group relative">
                <div className="w-11 h-11 rounded-[14px] bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-sm group-hover:scale-105 transition-all overflow-hidden">
                  {user?.avatar_url ? (
                    <img
                      src={`http://${window.location.hostname}:5000${user.avatar_url}`}
                      alt="P"
                      className="w-full h-full object-cover"
                    />
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
        <div className="flex-1 p-4 sm:p-6 lg:p-10 transition-all duration-500">
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </div>
      </main>

      {/* ===== MOBILE SIDEBAR ===== */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <div
            className="absolute inset-0 bg-obsidian/60 backdrop-blur-md animate-fade-in"
            onClick={() => setIsMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-[85%] max-w-[320px] bg-white dark:bg-midnight flex flex-col shadow-2xl animate-slide-in-left">
            <div className="h-24 flex items-center justify-between px-8 border-b border-slate-200 dark:border-white/5">
              <div className="flex items-center gap-4 group cursor-pointer">
                <div className="relative w-12 h-10 flex items-center justify-center shrink-0 overflow-visible transition-all duration-500">
                   <div className="relative w-full h-full bg-primary rounded-xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-sm group-hover:shadow-primary/30">
                      <div className="relative flex items-center justify-center w-full">
                        <Car className="text-white absolute transition-all duration-500 translate-x-[-3px] group-hover:translate-x-[-10px] group-hover:scale-110" size={16} />
                        <Truck className="text-white absolute transition-all duration-500 translate-x-[4px] group-hover:translate-x-[10px] group-hover:scale-110" size={16} />
                      </div>
                   </div>
                </div>
                <div className="overflow-visible">
                  <span className="text-xl font-display font-black italic tracking-tighter uppercase pr-8 whitespace-nowrap">
                    Kashmir<span className="text-primary">Move</span>
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-2 text-slate-500"
              >
                <X size={24} />
              </button>
            </div>

            <nav className="flex-1 p-6 space-y-2">
              {currentNav.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${location.pathname === item.path ? "bg-primary text-white" : "text-slate-500 dark:text-slate-400"}`}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>

            <div className="p-6 border-t border-slate-200 dark:border-white/5 space-y-3">
              <button
                onClick={() => setIsDark(!isDark)}
                className="w-full py-4 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center gap-3 font-bold text-slate-500"
              >
                {isDark ? (
                  <Sun size={18} className="text-saffron" />
                ) : (
                  <Moon size={18} className="text-primary" />
                )}
                Theme Toggle
              </button>
              <button
                onClick={handleLogout}
                className="w-full py-4 rounded-2xl bg-rose/10 text-rose font-bold flex items-center justify-center gap-3"
              >
                <LogOut size={18} /> Logout
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Mobile Floating Trigger */}
      {!isMobileOpen && (
        <button
          onClick={() => setIsMobileOpen(true)}
          className="fixed bottom-8 right-6 w-14 h-14 bg-primary text-white rounded-[20px] flex items-center justify-center shadow-2xl z-[60] md:hidden shadow-primary/40 active:scale-95 transition-all"
        >
          <Menu size={24} />
        </button>
      )}
    </div>
  );
};

export default SidebarLayout;
