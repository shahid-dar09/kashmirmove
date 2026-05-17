import { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import SidebarLayout from './components/SidebarLayout';
import { AuthContext } from './context/AuthContextValue';

// Public Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import RegisterCustomer from './pages/RegisterCustomer';
import RegisterDriver from './pages/RegisterDriver';

// Shared
import Profile from './pages/Profile';

// Customer Pages
import CustomerDashboard from './pages/customer/CustomerDashboard';
import BookRide from './pages/customer/BookRide';
import MyRides from './pages/customer/MyRides';
import ActiveRide from './pages/customer/ActiveRide';
import WaitingRide from './pages/customer/WaitingRide';

// Driver Pages
import DriverOverview from './pages/driver/DriverOverview';
import NewRequests from './pages/driver/NewRequests';
import RideHistory from './pages/driver/RideHistory';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import PendingDrivers from './pages/admin/PendingDrivers';
import AllDrivers from './pages/admin/AllDrivers';
import AllCustomers from './pages/admin/AllCustomers';
import AuditLedger from './pages/admin/AuditLedger';

const RoleBasedDashboard = () => {
  const { user } = useContext(AuthContext);
  if (user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (user?.role === 'driver') return <Navigate to="/driver/dashboard" replace />;
  return <CustomerDashboard />;
};

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<RegisterCustomer />} />
            <Route path="/register-driver" element={<RegisterDriver />} />
            
            {/* Protected Routes Wrapper */}
            <Route element={<ProtectedRoute><SidebarLayout /></ProtectedRoute>}>
              
              {/* Intelligent Dashboard Hub */}
              <Route path="/dashboard" element={<RoleBasedDashboard />} />
              <Route path="/customer/book" element={<BookRide />} />
              <Route path="/customer/rides" element={<MyRides />} />
              <Route path="/customer/ride/:id" element={<ActiveRide />} />
              <Route path="/customer/waiting/:id" element={<WaitingRide />} />

              {/* Driver Routes */}
              <Route path="/driver/dashboard" element={<DriverOverview />} />
              <Route path="/driver/requests" element={<NewRequests />} />
              <Route path="/driver/history" element={<RideHistory />} />

              {/* Admin Routes */}
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/pending" element={<PendingDrivers />} />
              <Route path="/admin/drivers" element={<AllDrivers />} />
              <Route path="/admin/customers" element={<AllCustomers />} />
              <Route path="/admin/audit" element={<AuditLedger />} />

              {/* Shared Protected */}
              <Route path="/profile" element={<Profile />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
