import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { AuthRequest } from '../types';

const docDir = path.join(__dirname, '../uploads/documents');
if (!fs.existsSync(docDir)) {
    fs.mkdirSync(docDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination(_req, _file, cb) {
        cb(null, docDir);
    },
    filename(req: AuthRequest, file, cb) {
        const userId = req.user?.id || 'unknown';
        cb(null, `doc-${userId}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage });

export default upload;
