const axios = require('axios');

async function test() {
    try {
        // 1. Login as admin
        const login = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@kashmirmove.com',
            password: 'admin'
        });
        
        const token = login.data.token;
        console.log('Logged in as Admin');

        // 2. Fetch pending documents
        const res = await axios.get('http://localhost:5000/api/admin/documents/pending', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Response Status:', res.status);
        console.log('Response Data:', JSON.stringify(res.data, null, 2));
    } catch (err) {
        console.error('Error:', err.response?.data || err.message);
    }
}

test();
