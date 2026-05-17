const multer = require('multer');
const path = require('path');
const fs = require('fs');

const docDir = path.join(__dirname, '../uploads/documents');
if (!fs.existsSync(docDir)) {
    fs.mkdirSync(docDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, docDir);
    },
    filename(req, file, cb) {
        cb(null, `doc-${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage });

module.exports = upload;
