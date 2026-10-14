import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
    cors: {
        origin: (_origin, callback) => callback(null, true),
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
import authRoutes from './routes/authRoutes';
import driverRoutes from './routes/driverRoutes';
import adminRoutes from './routes/adminRoutes';
import customerRoutes from './routes/customerRoutes';
import reviewRoutes from './routes/reviewRoutes';
import messageRoutes from './routes/messageRoutes';
import locationRoutes from './routes/locationRoutes';
import userRoutes from './routes/userRoutes';
import { saveMessage } from './controllers/messageController';
import { initializeDatabase } from './config/dbInit';

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/review', reviewRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/user', userRoutes);

// Socket.io logic
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    
    socket.on('join', (userId: string | number) => {
        socket.join(`user_${userId}`);
    });

    socket.on('join_booking', (bookingId: string | number) => {
        socket.join(`booking_${bookingId}`);
        // Tell others in the room I'm here
        socket.to(`booking_${bookingId}`).emit('peer_status', { online: true });
        console.log(`Socket ${socket.id} joined booking_${bookingId}`);
    });

    socket.on('check_peer_status', (bookingId: string | number) => {
        // Broadcast a "ping" to the room, anyone there will respond
        socket.to(`booking_${bookingId}`).emit('peer_status', { online: true, isPing: true });
    });

    socket.on('peer_response', (data: { bookingId: string | number }) => {
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

    socket.on('send_message', async (data: { bookingId: string | number; senderId: string | number; message: string }) => {
        const { bookingId, senderId, message } = data;
        console.log('DEBUG: Sending message:', { bookingId, senderId, message });
        
        if (!bookingId || !senderId || !message) {
            console.error('DEBUG: Missing message data:', { bookingId, senderId, message });
            return;
        }

        const saved = await saveMessage(bookingId, senderId, message);
        console.log('DEBUG: Message saved to DB:', saved);

        io.to(`booking_${bookingId}`).emit('new_message', {
            senderId,
            message,
            timestamp: new Date()
        });
    });

    socket.on('update_location', (data: { bookingId: string | number; lat: number; lng: number }) => {
        const { bookingId, lat, lng } = data;
        io.to(`booking_${bookingId}`).emit('location_update', { lat, lng });
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ success: true, message: 'Server is running' });
});

const PORT = process.env.PORT || 5000;

// Initialize database schema and start server
initializeDatabase()
    .then(() => {
        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('CRITICAL: Failed to initialize database schema. Server shutting down.', err);
        process.exit(1);
    });

export { app, server, io };
