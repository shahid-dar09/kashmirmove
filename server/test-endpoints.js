const jwt = require('jsonwebtoken');

const API_URL = 'http://localhost:5000/api';

async function runTests() {
    console.log('🏁 Starting Integration Endpoint Verification...');

    // 1. Generate local testing token representing customer user id 1
    // Let's sign a JWT token since the server uses jwt auth
    const JWT_SECRET = 'supersecretjwtkeyfor_kashmirmove'; // Hardcoded JWT secret from server's auth controller/middleware
    const token = jwt.sign({ id: 1, role: 'customer' }, JWT_SECRET, { expiresIn: '1d' });
    console.log('🔑 Generated test JWT token:', token);

    // 2. Fetch User Profile (GET /api/auth/profile)
    console.log('\n--- Test 1: Fetching Profile (GET /api/auth/profile) ---');
    try {
        const profileRes = await fetch(`${API_URL}/auth/profile`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const profileData = await profileRes.json();
        console.log('Profile Response Status:', profileRes.status);
        console.log('Profile Data (Preferences Check):', {
            success: profileData.success,
            user: profileData.user ? {
                id: profileData.user.id,
                name: profileData.user.name,
                role: profileData.user.role,
                pref_silent_ride: profileData.user.pref_silent_ride,
                pref_ac_needed: profileData.user.pref_ac_needed,
                pref_music_allowed: profileData.user.pref_music_allowed
            } : null
        });

        if (profileRes.status !== 200) {
            console.error('❌ Profile fetch failed!');
        } else {
            console.log('✅ Profile fetch succeeded with preference fields!');
        }
    } catch (err) {
        console.error('❌ Profile fetch exception:', err);
    }

    // 3. Book Ride (POST /api/customer/book-ride)
    console.log('\n--- Test 2: Booking Ride (POST /api/customer/book-ride) ---');
    try {
        const bookingBody = {
            driverId: 1,
            pickupLocation: 'Srinagar Airport',
            dropLocation: 'Lal Chowk',
            pickupLat: 34.0044,
            pickupLng: 74.7973,
            dropLat: 34.0837,
            dropLng: 74.7965,
            vehicleType: 'rickshaw',
            fare: 150,
            stops: [],
            scheduledAt: null
        };

        const bookingRes = await fetch(`${API_URL}/customer/book-ride`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(bookingBody)
        });

        const bookingData = await bookingRes.json();
        console.log('Booking Response Status:', bookingRes.status);
        console.log('Booking Data:', bookingData);

        if (bookingRes.status !== 201) {
            console.error('❌ Ride booking failed!');
        } else {
            console.log('✅ Ride booking succeeded! Coordinates inserted correctly.');
        }
    } catch (err) {
        console.error('❌ Ride booking exception:', err);
    }

    console.log('\n🏁 Verification Completed!');
    process.exit(0);
}

runTests();
