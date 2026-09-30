# RD KeyAuth

A complete license/key management system for software licensing, inspired by platforms like KeyAuth but with its own identity, codebase, and architecture.

## Stack

**Frontend:**
- React 18 + TypeScript
- Vite
- Tailwind CSS
- React Router DOM
- Recharts (charts)
- Lucide React (icons)
- Axios
- React Hot Toast

**Backend:**
- Node.js + TypeScript
- Express.js
- Supabase (PostgreSQL)
- JWT (authentication)
- bcryptjs (password hashing)
- Helmet, CORS, Rate Limiting

**Database:**
- Supabase (PostgreSQL)
- Row Level Security

---

## Prerequisites

1. **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
2. **Supabase Account** - [Sign up](https://supabase.com/)
3. **npm** or **yarn** package manager

---

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd licenseflow
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

---

## Supabase Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com/) and sign in
2. Click "New Project"
3. Give it a name (e.g., `licenseflow`)
4. Set a database password
5. Choose a region close to you
6. Click "Create new project"

### 2. Run the SQL Migration

1. In your Supabase dashboard, go to **SQL Editor**
2. Open the file `supabase/migrations/001_initial_schema.sql`
3. Copy and paste the entire SQL content
4. Click "Run" to execute the migration

This will create all necessary tables:
- `admins` - Admin users
- `applications` - Software applications
- `licenses` - License keys
- `sessions` - Active sessions
- `logs` - Event logs

### 3. Get Your Keys

1. Go to **Settings** > **API** in your Supabase dashboard
2. Copy the **Project URL** and **anon public** key

---

## Environment Configuration

### 1. Create Backend `.env`

```bash
cd backend
cp ../.env.example .env
```

Edit `backend/.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=a-very-long-random-secret-at-least-32-chars
PORT=3001
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

### 2. Create Frontend `.env`

```bash
cd frontend
cp ../.env.example .env
```

Edit `frontend/.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

> **IMPORTANT:** Never commit `.env` files or expose the `SERVICE_ROLE_KEY` in the frontend.

---

## Running the Application

### 1. Start the Backend

```bash
cd backend
npm run dev
```

The API will run on `http://localhost:3001`

### 2. Start the Frontend

```bash
cd frontend
npm run dev
```

The admin panel will run on `http://localhost:5173`

---

## First Admin Setup

After starting both servers, create the first admin account directly in Supabase:

1. Go to your Supabase dashboard
2. Open **Table Editor** > **admins**
3. Click "Insert row"
4. Fill in:
   - `email`: `admin@example.com`
   - `username`: `admin`
   - `password_hash`: Use a bcrypt hash (generate at [bcrypt-generator.com](https://bcrypt-generator.com/))
   - `role`: `superadmin`
5. Save the row

Now you can log in at `http://localhost:5173/login`

---

## Creating an Application

1. Log in to the admin panel
2. Go to **Applications**
3. Click **New Application**
4. Enter a name and version
5. Save - you'll get an `app_id` and `secret`

---

## Generating License Keys

1. Go to **Generate Keys**
2. Select an application
3. Choose plan, duration, and amount
4. Optionally set a prefix (e.g., `PRO`, `PREMIUM`)
5. Click **Generate Keys**
6. Copy, export as TXT, or export as CSV

---

## API Documentation

### Authentication Endpoint (for software integration)

#### POST `/api/auth/login`

Authenticate a license key.

**Request Body:**
```json
{
  "license": "XXXX-XXXX-XXXX-XXXX",
  "hwid": "YOUR_HARDWARE_ID",
  "app_id": "app_xxxxxxxxxx"
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Authenticated",
  "expires_at": "2026-10-12T00:00:00Z",
  "remaining_time": 2592000,
  "session_token": "abc123..."
}
```

**Error Responses:**
```json
{ "success": false, "error": "INVALID_LICENSE", "message": "License not found" }
{ "success": false, "error": "LICENSE_EXPIRED", "message": "License has expired" }
{ "success": false, "error": "LICENSE_BANNED", "message": "License has been banned" }
{ "success": false, "error": "LICENSE_DISABLED", "message": "License has been disabled" }
{ "success": false, "error": "HWID_MISMATCH", "message": "HWID does not match" }
{ "success": false, "error": "INVALID_APPLICATION", "message": "Invalid or inactive application" }
```

#### POST `/api/auth/validate`

Validate an existing session.

**Request Body:**
```json
{
  "license": "XXXX-XXXX-XXXX-XXXX",
  "hwid": "YOUR_HARDWARE_ID"
}
```

#### POST `/api/auth/logout`

End a session.

**Request Body:**
```json
{
  "session_token": "token-from-login"
}
```

### Admin Endpoints (require JWT authentication)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/login` | Admin login |
| GET | `/api/admin/me` | Get current admin |
| POST | `/api/admin/logout` | Admin logout |
| POST | `/api/admin/change-password` | Change password |
| GET | `/api/dashboard/stats` | Dashboard statistics |
| GET | `/api/applications` | List applications |
| POST | `/api/applications` | Create application |
| PUT | `/api/applications/:id` | Update application |
| POST | `/api/applications/:id/regenerate-secret` | Regenerate secret |
| DELETE | `/api/applications/:id` | Delete application |
| GET | `/api/licenses` | List licenses (paginated) |
| GET | `/api/licenses/:id` | Get license details |
| POST | `/api/licenses/generate` | Generate license keys |
| PUT | `/api/licenses/:id/status` | Update license status |
| POST | `/api/licenses/:id/reset-hwid` | Reset HWID |
| DELETE | `/api/licenses/:id` | Delete license |
| GET | `/api/sessions` | List sessions |
| DELETE | `/api/sessions/:id` | Revoke session |
| POST | `/api/sessions/clean` | Clean expired sessions |
| GET | `/api/logs` | List logs (paginated) |

---

## License Status Flow

```
UNUSED → ACTIVE → EXPIRED
              ↓
           BANNED
              ↓
          DISABLED
```

- **UNUSED**: Key created but never activated
- **ACTIVE**: Key activated and within valid period
- **EXPIRED**: Key's duration has passed
- **BANNED**: Key banned by admin
- **DISABLED**: Key disabled by admin

---

## HWID Flow

1. User submits license key + HWID
2. If no HWID is bound yet, the HWID is bound on first activation
3. If HWID is already bound, it's compared with the submitted HWID
4. If they don't match, authentication is denied with `HWID_MISMATCH`
5. Admin can reset HWID to allow re-activation on a new device

---

## Project Structure

```
licenseflow/
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── layouts/         # Layout components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API services
│   │   ├── types/           # TypeScript types
│   │   ├── lib/             # Utility functions
│   │   ├── App.tsx          # Main app component
│   │   ├── main.tsx         # Entry point
│   │   └── index.css        # Global styles
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
│
├── backend/
│   ├── src/
│   │   ├── controllers/     # Route handlers
│   │   ├── routes/          # Express routes
│   │   ├── middleware/       # Auth, error handling
│   │   ├── services/        # Business logic
│   │   ├── database/        # Supabase client
│   │   ├── utils/           # Crypto utilities
│   │   ├── types.ts         # TypeScript types
│   │   ├── config.ts        # Configuration
│   │   └── server.ts        # Express server
│   ├── package.json
│   └── tsconfig.json
│
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
│
├── .env.example
└── README.md
```

---

## Security Features

- **HTTPS** recommended in production
- **Rate limiting** on API endpoints
- **JWT** for admin authentication
- **bcrypt** password hashing
- **Helmet** security headers
- **CORS** properly configured
- **Input validation** on all endpoints
- **SQL injection protection** via Supabase client
- **XSS protection** via Helmet and React
- **HTTP-only cookies** for admin sessions
- **Service role key** stays backend-only
- **HWID binding** for device control

---

## License

MIT
