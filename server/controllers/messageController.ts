import { Request, Response } from 'express';
import db from '../config/db';

export const getMessageHistory = async (req: Request, res: Response): Promise<any> => {
    const { bookingId } = req.params;
    try {
        const [messages]: any = await db.execute(
            'SELECT * FROM messages WHERE booking_id = ? ORDER BY created_at ASC',
            [bookingId]
        );
        res.json({ success: true, messages });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const saveMessage = async (bookingId: string | number, senderId: string | number, message: string): Promise<boolean> => {
    try {
        const bId = parseInt(String(bookingId), 10);
        const sId = parseInt(String(senderId), 10);
        
        console.log(`DEBUG: DB Save attempt - Booking: ${bId}, Sender: ${sId}`);
        
        if (isNaN(bId) || isNaN(sId)) {
            console.error('DEBUG: Invalid IDs for message save:', { bookingId, senderId });
            return false;
        }

        const [result]: any = await db.execute(
            'INSERT INTO messages (booking_id, sender_id, message) VALUES (?, ?, ?)',
            [bId, sId, message]
        );
        console.log('DEBUG: Message inserted with ID:', result.insertId);
        return true;
    } catch (err: any) {
        console.error('DEBUG: DATABASE ERROR in saveMessage:', err.message);
        return false;
    }
};

export default {
    getMessageHistory,
    saveMessage
};
