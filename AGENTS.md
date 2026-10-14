# KashmirMove Ride-Sharing Application (Full TypeScript)

## Build & Run Commands

### Client (React + Vite + TypeScript)

- `cd client && npm install` - Install dependencies
- `cd client && npm run dev` - Start development server (proxies API to localhost:5000)
- `cd client && npm run build` - Build for production (`tsc -b && vite build`)
- `cd client && npm run lint` - Run ESLint

### Server (Node.js + Express + TypeScript)

- `cd server && npm install` - Install dependencies
- `cd server && npm start` - Start server on port 5000 via `tsx app.ts`
- `cd server && npm run dev` - Start development server with live watch (`tsx watch app.ts`)
- `cd server && npm run build` - Compile TypeScript to `dist/` (`tsc`)
- `cd server && npm run typecheck` - Verify types across server (`tsc --noEmit`)

### Database (MySQL)

- `npx tsx database/run-migration.ts` - Run database migrations
- `npx tsx setup-test-drivers.ts` - Seed test drivers

## Architecture Overview

Three-tier ride-sharing app (100% TypeScript):

- **Client**: React 19 SPA with role-based routing (customer/driver/admin) in TypeScript (.tsx)
- **Server**: Express 5 REST API with JWT auth and role-based middleware in TypeScript (.ts)
- **Database**: MySQL with tables for users, drivers, vehicles, bookings, reviews

Key technologies: React 19, TypeScript, Express 5, MySQL2, Socket.IO, JWT, bcrypt, multer, Cloudinary.

## Project Conventions

### File Structure

- Client: Feature-based (`pages/`, `components/`, `context/`, `services/`, `types/`)
- Server: MVC (`routes/`, `controllers/`, `middleware/`, `config/`, `types/`, `utils/`)
- Database: schema in `database/` folder

### Naming

- Components: PascalCase (`.tsx`)
- Files: camelCase (`.ts`)
- Types: PascalCase (`types/index.ts`)
- Database: snake_case columns, ENUM statuses
- API: `/api/{resource}/{action}`

### Patterns

- Protected routes: `<ProtectedRoute allowedRole="driver">`
- API middleware: `protect` (JWT) → `authorize(role)`
- Database transactions for multi-table operations
- Axios instance with token interceptor in `client/src/services/api.ts`

## Key Files for Patterns

- [client/src/components/ProtectedRoute.tsx](client/src/components/ProtectedRoute.tsx) - Role-based routing
- [server/middleware/authMiddleware.ts](server/middleware/authMiddleware.ts) - JWT auth
- [client/src/services/api.ts](client/src/services/api.ts) - API client with token injection
- [server/controllers/authController.ts](server/controllers/authController.ts) - Auth logic
- [client/src/types/index.ts](client/src/types/index.ts) - Client domain types
- [server/types/index.ts](server/types/index.ts) - Server types
- [database/schema.sql](database/schema.sql) - Database schema
