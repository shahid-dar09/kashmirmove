export type UserRole = 'customer' | 'driver' | 'admin';
export type UserStatus = 'active' | 'suspended';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status?: UserStatus;
  avatar_url?: string | null;
  wallet_balance?: number | string;
  pref_silent_ride?: boolean | number;
  pref_ac_needed?: boolean | number;
  pref_music_allowed?: boolean | number;
}

export type DriverStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type VehicleType = 'cab' | 'pickup' | 'truck' | 'rickshaw';

export interface Driver {
  id: number;
  user_id: number;
  name?: string;
  phone?: string;
  email?: string;
  status: DriverStatus;
  is_online: boolean;
  is_verified: boolean;
  area: string;
  current_lat: number | null;
  current_lng: number | null;
  rating: number;
  total_trips: number;
  earnings?: number;
  vehicle_type?: VehicleType;
  vehicle_number?: string;
  vehicle_model?: string;
  vehicle_capacity?: string;
  distance?: number;
}

export type BookingStatus = 'pending' | 'accepted' | 'started' | 'completed' | 'cancelled';

export interface Booking {
  id: number;
  user_id: number;
  customer_name?: string;
  customer_phone?: string;
  driver_id?: number | null;
  driver_name?: string;
  driver_phone?: string;
  vehicle_type: VehicleType;
  pickup_location: string;
  drop_location: string;
  pickup_lat?: number;
  pickup_lng?: number;
  drop_lat?: number;
  drop_lng?: number;
  stops?: string[] | null;
  fare: number;
  status: BookingStatus;
  ride_otp?: string | null;
  scheduled_at?: string | null;
  created_at: string;
}

export interface District {
  id: number;
  name: string;
  lat: number;
  lng: number;
  description?: string;
  activeDrivers?: number;
}

export interface ToastItem {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  [key: string]: any;
}
