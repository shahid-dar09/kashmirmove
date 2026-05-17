# BookRide 5-Phase Refactor - Testing Guide

## ✅ What's New

### 5 Separate Phases

1. **Phase 1**: Select District
2. **Phase 2**: Select Vehicle Type
3. **Phase 3**: Pick Locations & Calculate Fare (Map on left, Form on right)
4. **Phase 4**: Select Driver
5. **Phase 5**: Confirm & Book

### Key Improvements

✅ Separated each step completely  
✅ Map + Location forms side-by-side (map left, forms right)  
✅ Human-readable addresses (using Nominatim reverse geocoding)  
✅ Confirmation buttons for each location  
✅ Real-time distance & fare calculation  
✅ Proper error handling for blank screens

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Setup Test Drivers

```bash
cd c:\Users\ISHAHID09\Desktop\kashmirmove
node setup-test-drivers.js
```

Expected output:

```
✅ Connected to database
✅ Created user: Ahmed Khan
✅ Created driver: Ahmed Khan (Lat: 34.085, Lng: 74.796)
✅ Created vehicle for: Ahmed Khan
[... more drivers ...]
✅ All test drivers setup successfully!

Test drivers created near Srinagar:
  • Ahmed Khan - rickshaw - Rating: ⭐4.8
  • Farooq Ali - cab - Rating: ⭐4.9
  • Ghulam Nabi - truck - Rating: ⭐4.7
```

### Step 2: Start Server

```bash
cd server
npm start
```

Check server is running:

```bash
curl http://localhost:5000/api/locations/drivers-in-district/1
```

Should return JSON with 3 drivers.

### Step 3: Start Client

```bash
cd client
npm run dev
```

### Step 4: Test the Flow

1. Open http://localhost:5173/customer/book
2. Follow 5 phases:
   - **Phase 1**: Click "Srinagar" district
   - **Phase 2**: Click any vehicle (rickshaw/cab/truck)
   - **Phase 3**:
     - Click on map → location appears on right form
     - Click "Confirm Pickup" button
     - Click another location on map
     - Click "Confirm Drop" button
     - See distance & fare update
   - **Phase 4**: Click a driver card
   - **Phase 5**: Click "CONFIRM BOOKING"

---

## 🧪 Detailed Testing Checklist

### Phase 1 - District Selection

- [ ] Page loads with 6 district cards
- [ ] Click "Srinagar" → goes to Phase 2
- [ ] Map center moves to correct district

### Phase 2 - Vehicle Selection

- [ ] 3 vehicle cards show (Rickshaw, Cab, Truck)
- [ ] Can see base fare for each
- [ ] Click any vehicle → goes to Phase 3
- [ ] "BACK" button returns to Phase 1

### Phase 3 - Location Selection

- [ ] Map shows on left, forms on right
- [ ] Click on map → marker appears + address fetches
- [ ] Can click "Confirm Pickup" → locks in
- [ ] After pickup confirmed, can select drop
- [ ] After drop confirmed:
  - [ ] Distance shows (e.g., "2.5 km")
  - [ ] Fare calculates correctly
  - [ ] Form shows human-readable addresses
- [ ] Can click "Change" to reselect location
- [ ] "BACK" button returns to Phase 2

### Phase 4 - Driver Selection

- [ ] Shows list of available drivers
- [ ] Each driver shows: name, vehicle type, rating, distance
- [ ] Click driver → goes to Phase 5
- [ ] "BACK" button returns to Phase 3

### Phase 5 - Confirmation

- [ ] Shows summary with:
  - [ ] Total fare
  - [ ] Vehicle type
  - [ ] Driver name
  - [ ] Pickup address
  - [ ] Drop address
- [ ] "BACK" button returns to Phase 4
- [ ] Click "CONFIRM BOOKING" → redirects to /customer/waiting/:id

---

## 🐛 Troubleshooting

### Blank Screen on Phase 4

**Problem**: No drivers showing  
**Solution**:

```bash
# Check database has drivers
mysql -u root kashmirmove
SELECT id, name, is_online, status, current_lat, current_lng FROM drivers;
```

All drivers should have:

- `is_online = 1`
- `status = 'approved'`
- Valid `current_lat` and `current_lng`

### Addresses showing as "34.0835, 74.7965"

**Problem**: Nominatim is slow or blocked  
**Solution**: This is normal during network issues, the coordinates display is fallback  
Try again after a few seconds.

### Driver list empty after Phase 3

**Problem**: API not fetching drivers  
**Solution**:

```bash
# Test API directly
curl http://localhost:5000/api/locations/drivers-in-district/1
```

Check if returns drivers array. If not, check server logs.

### "Cannot GET /customer/book"

**Problem**: Client not running  
**Solution**:

```bash
cd client
npm run dev
# Wait for "VITE v... ready in X ms"
```

---

## 📊 Fare Calculation Examples

### Auto Rickshaw (₹10 base + ₹10 per 3km)

- 1 km = ₹13
- 3 km = ₹20
- 5 km = ₹27
- 10 km = ₹43

### Premium Cab (₹50 base + ₹20 per km)

- 1 km = ₹70
- 5 km = ₹150
- 10 km = ₹250

### Cargo Pickup (₹100 base + ₹50 per km)

- 1 km = ₹150
- 5 km = ₹350
- 10 km = ₹600

---

## 📱 Expected Page Layout

### Phase 3 - Location Selection (Key Layout)

```
┌─────────────────────────────────────────────┐
│ STEP 3 OF 5 - PICK LOCATIONS               │
├─────────────────────────────────────────────┤
│                                              │
│  [MAP]           │ ┌──────────────────┐    │
│  600px          │ │ PICKUP LOCATION  │    │
│  height         │ │                  │    │
│                  │ │ [Address here]   │    │
│  Click here →    │ │ [Confirm Btn]    │    │
│  Marker shows   │ ├──────────────────┤    │
│                  │ │ DROP LOCATION    │    │
│                  │ │                  │    │
│                  │ │ [Address here]   │    │
│                  │ │ [Confirm Btn]    │    │
│                  │ ├──────────────────┤    │
│                  │ │ Distance: 2.5 km │    │
│                  │ │ Fare: ₹250       │    │
│                  │ └──────────────────┘    │
│                                              │
└─────────────────────────────────────────────┘
```

---

## 🔧 Configuration

All hardcoded values in BookRide.jsx:

```javascript
KASHMIR_DISTRICTS = [
  { id: 1, name: "Srinagar", lat: 34.0837, lng: 74.7973 },
  // ...
];

VEHICLE_TYPES = {
  rickshaw: { baseRate: 10, perKm: 3.33 },
  cab: { baseRate: 50, perKm: 20 },
  truck: { baseRate: 100, perKm: 50 },
};
```

Change these values to customize!

---

## 📝 API Endpoints Used

1. **Fetch Drivers**

   ```
   GET /api/locations/drivers-in-district/:districtId
   ```

2. **Book Ride**

   ```
   POST /api/customer/book-ride
   Body: {
     driverId, pickupLocation, dropLocation, vehicleType, fare
   }
   ```

3. **Reverse Geocoding** (External)
   ```
   GET https://nominatim.openstreetmap.org/reverse
   Params: format=json, lat, lon
   ```

---

## ✅ Ready to Deploy

Once testing passes:

1. User data with proper addresses
2. Driver GPS coordinates auto-update from app
3. Real payment integration
4. OTP system in WaitingRide.jsx
5. Live tracking in ActiveRide.jsx

---

**Test Date**: May 16, 2026  
**Status**: ✅ Ready for User Testing
