import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, UserPayload } from '../types';

export const protect = (req: AuthRequest, res: Response, next: NextFunction): void => {
    let token: string | undefined;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as UserPayload;
            req.user = decoded; // { id, role }
            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ success: false, message: 'Not authorized, token failed' });
        }
    } else {
        res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }
};

export const authorize = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        const userRole = req.user?.role?.trim().toLowerCase();
        const requiredRoles = roles.map(r => r.trim().toLowerCase());
        
        if (!req.user || !userRole || !requiredRoles.includes(userRole)) {
            res.status(403).json({ success: false, message: 'User role not authorized' });
            return;
        }
        next();
    };
};
