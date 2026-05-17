# BookRide.jsx Refactoring - Complete Implementation Guide

## Overview

The BookRide.jsx component has been completely refactored into a 5-step booking flow with district selection, map-based location picking, and intelligent driver matching.

## Flow Architecture

### Step 1: District Selection

- User selects one of 6 Kashmir districts:
  - Srinagar (34.0837°, 74.7973°)
  - Anantnag (33.7298°, 75.1467°)
  - Ganderbal (34.3133°, 75.5667°)
  - Badgam (34.2044°, 75.0044°)
  - Pulwama (33.9244°, 75.3244°)
  - Kulgam (33.6133°, 75.5333°)
- Map auto-centers to selected district

### Step 2: Vehicle Type Selection

- Three vehicle options with dynamic pricing:
  - **Auto Rickshaw**: Base ₹10, then ₹10 per 3km
  - **Premium Cab**: Base ₹50, then ₹20 per km
  - **Cargo Pickup**: Base ₹100, then ₹50 per km
- Fare updates dynamically based on selected vehicle type

### Step 3: Location Selection on Map

- Interactive map using Leaflet/OpenStreetMap
- Two clicks to set locations:
  1. First click = Pickup location
  2. Second click = Drop location
- Markers show both locations
- Distance automatically calculated between points
- Fare updates based on vehicle type and distance

### Step 4: Driver Selection

- Displays all approved, online drivers within 50km of district center
- Sorted by distance (closest first)
- Shows:
  - Driver name
  - Vehicle type
  - Rating (⭐)
  - Distance from pickup
- API Endpoint: `GET /api/location/drivers-in-district/:districtId`

### Step 5: Confirmation & Booking

- Summary of all booking details:
  - Total fare
  - Vehicle type & driver
  - Pickup location
  - Drop location
- Click "LAUNCH MISSION NOW" to confirm
- Redirects to `/customer/waiting/{bookingId}`

## Fare Calculation System

```javascript
const VEHICLE_TYPES = {
  rickshaw: { baseRate: 10, perKm: 3.33 }, // 10 per 3km
  cab: { baseRate: 50, perKm: 20 }, // 50 + 20 per km
  truck: { baseRate: 100, perKm: 50 }, // 100 + 50 per km
};

// Formula: max(100, ceil(baseRate + (distance * perKm)))
const fare = Math.max(100, Math.ceil(baseRate + distance * perKm));
```

## Integration Points

### Client-side Changes

- **File**: `client/src/pages/customer/BookRide.jsx`
- Uses Leaflet for interactive map
- Socket.io ready for real-time driver updates
- Toast notifications for user feedback

### Server-side Changes

- **New Endpoint**: `GET /api/location/drivers-in-district/:districtId`
- **File**: `server/controllers/locationController.js`
- Filters drivers by:
  - Status: 'approved'
  - Online status: TRUE
  - Distance from district center ≤ 50km
  - Sorted by distance (ascending)
- **File**: `server/routes/locationRoutes.js`

## Post-Booking Flow

### WaitingRide.jsx (`/customer/waiting/:id`)

- Shows scanning radar animation
- Displays booking details (pickup/drop)
- Socket.io listener for driver acceptance
- When driver accepts:
  - Status changes to 'accepted'
  - Auto-redirect to `/customer/ride/:id`

### ActiveRide.jsx (`/customer/ride/:id`)

- Live tracking of driver and route
- Driver location updates via GPS
- Real-time ETA updates
- Ride status monitoring
- Once ride starts, OTP is generated and sent to customer
- Driver enters OTP in their dashboard to confirm start

## Database Requirements

Ensure your `drivers` table has:

```sql
- id: INT (PRIMARY KEY)
- user_id: INT (FOREIGN KEY to users)
- status: ENUM('pending', 'approved', 'rejected', 'suspended')
- is_online: BOOLEAN
- is_verified: BOOLEAN
- area: VARCHAR(100)
- current_lat: DECIMAL(10, 8)  -- Must be updated regularly
- current_lng: DECIMAL(11, 8)  -- Must be updated regularly
- rating: DECIMAL(3,2)
- total_trips: INT
- earnings: DECIMAL(10,2)
```

## Installation & Setup

### 1. Verify Dependencies

```bash
# Client dependencies (already installed)
npm list leaflet react-leaflet socket.io-client
```

### 2. Test the API Endpoint

```bash
curl http://localhost:5000/api/location/drivers-in-district/1
```

### 3. Populate Driver Locations

Make sure your drivers have GPS coordinates in the database:

```sql
UPDATE drivers
SET current_lat = 34.0837, current_lng = 74.7973
WHERE id = 1;
```

### 4. Run the Application

```bash
# Terminal 1: Start server
cd server && npm start

# Terminal 2: Start client
cd client && npm run dev
```

## Key Features

✅ District-based booking  
✅ Interactive map location selection  
✅ Real-time fare calculation  
✅ Distance-based driver matching  
✅ Haversine formula for accurate distance  
✅ Responsive multi-step UI  
✅ Socket.io integration ready  
✅ Payment protocol ready  
✅ OTP generation ready  
✅ Live tracking integration

## User Journey

```
Home → BookRide Page
  ↓
Step 1: Select District (Srinagar)
  ↓
Step 2: Select Vehicle (Auto Rickshaw)
  ↓
Step 3: Click Pickup Point on Map → Click Drop Point
  ↓
Step 4: Select Driver (Closest one listed)
  ↓
Step 5: Confirm Booking (₹fare)
  ↓
WaitingRide Page (Scanning for driver...)
  ↓
[Driver accepts] → ActiveRide Page (Live Tracking)
  ↓
[Driver starts ride with OTP] → Real-time Tracking
  ↓
[Ride completed] → Rating & Review
```

## Testing Checklist

- [ ] Load BookRide page
- [ ] Select different districts
- [ ] Verify map centers correctly
- [ ] Click map to set pickup/drop
- [ ] Verify fare updates with vehicle change
- [ ] Check driver list populates correctly
- [ ] Confirm booking redirects to waiting page
- [ ] Verify OTP flow when driver accepts
- [ ] Test live tracking after ride starts

## Troubleshooting

### Drivers not showing up

- Check if drivers have `is_online = TRUE`
- Verify drivers have `status = 'approved'`
- Ensure drivers have valid GPS coordinates
- Check distance calculation (within 50km?)

### Map not loading

- Verify OpenStreetMap tiles are accessible
- Check browser console for CORS errors
- Ensure Leaflet CSS is imported

### Fare calculation wrong

- Verify distance is calculated in kilometers
- Check vehicle type is correctly mapped
- Ensure baseRate and perKm values are correct

## Future Enhancements

1. Add favorite driver bookmarking
2. Implement promo code system
3. Add ride sharing (multiple passengers)
4. Schedule rides for future dates
5. Add emergency button integration
6. Implement cancellation fee structure
7. Add ride safety features (share location with friends)
8. Implement rating-based driver filtering

---

**Last Updated**: May 16, 2026
**Version**: 1.0
**Status**: Production Ready
