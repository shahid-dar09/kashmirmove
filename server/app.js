const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: (origin, callback) => callback(null, true),
        methods: ["GET", "POST"],
        credentials: true
    },
    transports: ['polling', 'websocket'],
    pingTimeout: 60000,
    pingInterval: 25000
});

// Make io accessible to our routes
app.set('io', io);

// CORS Configuration
const allowedOrigins = process.env.CLIENT_URL
  ? [process.env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:3000']
  : true; // Allow all in dev

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import Routes
const authRoutes = require('./routes/authRoutes');
const driverRoutes = require('./routes/driverRoutes');
const adminRoutes = require('./routes/adminRoutes');
const customerRoutes = require('./routes/customerRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const messageRoutes = require('./routes/messageRoutes');
const locationRoutes = require('./routes/locationRoutes');
const userRoutes = require('./routes/userRoutes');
const messageController = require('./controllers/messageController');

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/review', reviewRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/user', userRoutes);

// Update Socket.io logic to use controller
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    
    socket.on('join', (userId) => {
        socket.join(`user_${userId}`);
    });

    socket.on('join_booking', (bookingId) => {
        socket.join(`booking_${bookingId}`);
        // Tell others in the room I'm here
        socket.to(`booking_${bookingId}`).emit('peer_status', { online: true });
        console.log(`Socket ${socket.id} joined booking_${bookingId}`);
    });

    socket.on('check_peer_status', (bookingId) => {
        // Broadcast a "ping" to the room, anyone there will respond
        socket.to(`booking_${bookingId}`).emit('peer_status', { online: true, isPing: true });
    });

    socket.on('peer_response', (data) => {
        const { bookingId } = data;
        socket.to(`booking_${bookingId}`).emit('peer_status', { online: true });
    });

    socket.on('disconnecting', () => {
        for (const room of socket.rooms) {
            if (room.startsWith('booking_')) {
                socket.to(room).emit('peer_status', { online: false });
            }
        }
    });

    socket.on('send_message', async (data) => {
        const { bookingId, senderId, message } = data;
        console.log('DEBUG: Sending message:', { bookingId, senderId, message });
        
        if (!bookingId || !senderId || !message) {
            console.error('DEBUG: Missing message data:', { bookingId, senderId, message });
            return;
        }

        const saved = await messageController.saveMessage(bookingId, senderId, message);
        console.log('DEBUG: Message saved to DB:', saved);

        io.to(`booking_${bookingId}`).emit('new_message', {
            senderId,
            message,
            timestamp: new Date()
        });
    });

    socket.on('update_location', (data) => {
        const { bookingId, lat, lng } = data;
        io.to(`booking_${bookingId}`).emit('location_update', { lat, lng });
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'Server is running' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
