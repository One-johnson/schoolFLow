# School Management System

A comprehensive multi-tenant school management system built with Next.js, Convex, and Shadcn UI.

## Phase 1: Authentication & Multi-Tenancy ✅

**Completed Features:**

### Multi-Tenant Foundation
- Schools database with tenant isolation
- Subdomain/domain-based tenant detection
- Tenant context in middleware

### Authentication System
- Custom authentication with Convex
- Secure password hashing with bcryptjs
- Session management with tokens
- Login and registration pages
- Protected routes with role-based access

### User Roles
- Super Admin (platform level)
- School Admin
- Principal
- Teacher
- Student
- Parent
- Staff

### Layout & Navigation
- Responsive sidebar navigation
- Role-based menu items
- Top navbar with user menu
- Mobile-friendly layout
- Dashboard with overview stats

## Getting Started

### Prerequisites
- Node.js 18+ installed
- Convex account (sign up at https://convex.dev)

### Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up Convex:**
   ```bash
   npx convex dev
   ```
   This will:
   - Create a new Convex project
   - Generate your CONVEX_DEPLOYMENT and NEXT_PUBLIC_CONVEX_URL
   - Start the Convex dev server

3. **Update environment variables:**
   The `.env.local` file will be automatically created with your Convex credentials.

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to `http://localhost:3000`

### First Steps

1. Visit `/register` to create your school account
2. Fill in school details and admin information
3. Login with your credentials
4. Explore the dashboard

## Project Structure

```
src/
├── app/
│   ├── (auth)/           # Authentication pages
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/      # Protected dashboard pages
│   │   └── dashboard/
│   ├── api/              # API routes
│   └── layout.tsx
├── components/
│   ├── ui/               # Shadcn UI components
│   └── layout/           # Layout components
├── contexts/
│   └── auth-context.tsx  # Authentication context
├── lib/
│   ├── auth.ts           # Auth utilities
│   ├── convex-client.tsx # Convex client
│   └── utils.ts
└── hooks/

convex/
├── schema.ts             # Database schema
└── auth.ts               # Auth mutations & queries
```

## Tech Stack

- **Framework:** Next.js 15.3.8 (App Router)
- **Database:** Convex (real-time, serverless)
- **UI Components:** Shadcn UI
- **Styling:** Tailwind CSS
- **Forms:** React Hook Form + Zod
- **Authentication:** Custom with Convex
- **Icons:** Lucide React

## Security Features

- Password hashing with bcryptjs
- HTTP-only cookies for session tokens
- Role-based access control (RBAC)
- Protected routes
- Session expiration (30 days)
- Tenant isolation at database level

## Next Steps (Phase 2+)

- [ ] User management (CRUD operations)
- [ ] Bulk user import
- [ ] Academic structure (classes, subjects)
- [ ] Student management
- [ ] Attendance system
- [ ] Grades & assessments
- [ ] Fee management
- [ ] Communication hub
- [ ] And much more...

## Development

```bash
# Install dependencies
npm install

# Run Convex dev server
npx convex dev

# Run Next.js dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## License

MIT
