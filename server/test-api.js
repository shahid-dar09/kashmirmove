const jwt = require('jsonwebtoken');

async function test() {
    const token = jwt.sign({ id: 2, role: 'driver' }, 'supersecretjwtkeyfor_kashmirmove', { expiresIn: '1d' });
    
    try {
        const res = await fetch('http://localhost:5000/api/driver/status', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ isOnline: false })
        });
        
        const data = await res.json();
        console.log('Status:', res.status);
        console.log('Data:', data);
    } catch (error) {
        console.error('Error:', error);
    }
}
test();
