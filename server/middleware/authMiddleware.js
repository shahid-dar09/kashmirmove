const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded; // { id, role }
            next();
        } catch (error) {
            console.error(error);
            return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
        }
    } else {
        return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        const userRole = req.user?.role?.trim().toLowerCase();
        const requiredRoles = roles.map(r => r.trim().toLowerCase());
        
        if (!req.user || !requiredRoles.includes(userRole)) {
            return res.status(403).json({ success: false, message: 'User role not authorized' });
        }
        next();
    };
};

module.exports = { protect, authorize };
