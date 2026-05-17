# KashmirMove Ride-Sharing Application

## Build & Run Commands

### Client (React + Vite)

- `cd client && npm install` - Install dependencies
- `cd client && npm run dev` - Start development server (proxies API to localhost:5000)
- `cd client && npm run build` - Build for production
- `cd client && npm run lint` - Run ESLint

### Server (Node.js + Express)

- `cd server && npm install` - Install dependencies
- `cd server && npm start` - Start server on port 5000
- `cd server && node test-api.js` - Test API endpoints

### Database (MySQL)

- `node database/init-db.js` - Initialize database from schema.sql
- `node server/test-db.js` - Test database connection
- `node server/fix-db.js` - Fix invalid ENUM values in bookings
- `node server/update-vehicle-types.js` - Add 'rickshaw' to vehicle categories

## Architecture Overview

Three-tier ride-sharing app:

- **Client**: React SPA with role-based routing (customer/driver/admin)
- **Server**: Express REST API with JWT auth and role-based middleware
- **Database**: MySQL with tables for users, drivers, vehicles, bookings, reviews

Key technologies: React 19, Express 5, MySQL2, JWT, bcrypt, multer for uploads.

## Project Conventions

### File Structure

- Client: Feature-based (pages/, components/, context/, services/)
- Server: MVC (routes/, controllers/, middleware/, config/)
- Database: schema.sql in database/ folder

### Naming

- Components: PascalCase (.jsx)
- Files: camelCase (.js)
- Database: snake_case columns, ENUM statuses
- API: /api/{resource}/{action}

### Patterns

- Protected routes: `<ProtectedRoute allowedRole="driver">`
- API middleware: `protect` (JWT) → `authorize(role)`
- Database transactions for multi-table operations
- Axios instance with token interceptor in client/services/api.js

## Common Pitfalls

- MySQL root user has no password (localhost only)
- JWT secret is hardcoded (not production-ready)
- No automated tests; use manual test scripts
- File uploads have no size limits
- Some controller functions are incomplete
- CORS enabled but no specific origins configured

## Key Files for Patterns

- [client/src/components/ProtectedRoute.jsx](client/src/components/ProtectedRoute.jsx) - Role-based routing
- [server/middleware/authMiddleware.js](server/middleware/authMiddleware.js) - JWT auth
- [client/src/services/api.js](client/src/services/api.js) - API client with token injection
- [server/controllers/authController.js](server/controllers/authController.js) - Auth logic
- [database/schema.sql](database/schema.sql) - Database schema
