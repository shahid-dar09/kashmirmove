const db = require('../config/db');
const path = require('path');
const fs = require('fs');

// Upload a document
exports.uploadDocument = async (req, res) => {
    try {
        const userId = req.user.id;
        const { document_type, expiry_date } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // 1. Get driver ID
        const [drivers] = await db.execute(
            'SELECT id FROM drivers WHERE user_id = ?',
            [userId]
        );

        if (drivers.length === 0) {
            return res.status(404).json({ message: 'Driver profile not found' });
        }

        const driverId = drivers[0].id;
        const fileUrl = `/uploads/documents/${req.file.filename}`;

        // 2. Insert or Update document
        // We allow updating if same type exists
        const [existing] = await db.execute(
            'SELECT id, file_url FROM driver_documents WHERE driver_id = ? AND document_type = ?',
            [driverId, document_type]
        );

        if (existing.length > 0) {
            // Delete old file if exists
            const oldPath = path.join(__dirname, '..', existing[0].file_url);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);

            await db.execute(
                'UPDATE driver_documents SET file_url = ?, status = "pending", expiry_date = ? WHERE id = ?',
                [fileUrl, expiry_date || null, existing[0].id]
            );
        } else {
            await db.execute(
                'INSERT INTO driver_documents (driver_id, document_type, file_url, expiry_date) VALUES (?, ?, ?, ?)',
                [driverId, document_type, fileUrl, expiry_date || null]
            );
        }

        res.json({ 
            message: 'Document uploaded successfully', 
            document: { document_type, file_url: fileUrl, status: 'pending' } 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error uploading document' });
    }
};

// Get all documents for a driver
exports.getDocuments = async (req, res) => {
    try {
        const userId = req.user.id;

        const [drivers] = await db.execute(
            'SELECT id FROM drivers WHERE user_id = ?',
            [userId]
        );

        if (drivers.length === 0) {
            return res.status(404).json({ message: 'Driver profile not found' });
        }

        const [docs] = await db.execute(
            'SELECT id, document_type, file_url, status, expiry_date, created_at FROM driver_documents WHERE driver_id = ?',
            [drivers[0].id]
        );

        res.json(docs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching documents' });
    }
};
