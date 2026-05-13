# Multi-Tenant CRM System

A production-ready, secure, and performant Multi-Tenant CRM built with **Next.js 15**, **Prisma**, **NextAuth.js**, and **Tailwind CSS 4**.

## 1. Project Overview
This CRM is designed to handle multiple organizations (tenants) within a single application instance. Each organization's data is strictly isolated, ensuring that users can only interact with data belonging to their own organization.

## 2. Tech Stack
- **Frontend**: Next.js 15 (App Router), React 19
- **Backend**: Next.js API Routes (Serverless ready)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: NextAuth.js (Credentials Provider)
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI + Sonner (Toasts) + Recharts (Visualizations)
- **Validation**: Zod (Centralized Schema Management)

## 3. Database Architecture
The schema is designed for scalability and strict isolation:
- **Organization**: The top-level entity representing a tenant.
- **User**: Belongs to an organization and has a specific role (`ADMIN` or `USER`).
- **Customer**: Belongs to an organization and can be assigned to a specific user.
- **Note**: Internal team notes attached to customers.
- **ActivityLog**: An audit trail of all significant actions within an organization.

## 4. Multi-Tenancy Explanation
Strict isolation is enforced at the **Service Layer**:
- Every database query includes an `organizationId` filter.
- Authentication tokens include the user's `organizationId`, which is verified in every API request.
- Cross-tenant data access is architecturally prevented by ensuring all service methods require an explicit `organizationId` parameter.

## 5. User Flow
1. **Signup**: A user registers their organization. They are automatically assigned the `ADMIN` role.
2. **Login**: Users sign in with their organizational credentials.
3. **Team Management**: Admins can invite team members (Members).
4. **Customer Creation**: Users create customer profiles for their organization.
5. **Assignment**: Admins can assign customers to specific team members for follow-up.
6. **Collaboration**: Team members add internal notes to customer profiles.

## 6. Role Explanation
- **Admin**:
  - Full access to all organization data.
  - Can create and manage team members.
  - Can assign/unassign customers.
  - Can view the full organization activity log.
- **Member (User)**:
  - Can view all customers in the organization.
  - Can manage customers specifically assigned to them.
  - Can add and view notes.
  - Cannot manage team members or see cross-user administrative logs.

## 7. Prisma Migration Strategy
The project uses a standard Prisma migration workflow:
- Migrations are stored in `prisma/migrations`.
- An initial `init` migration sets up the entire schema.
- Schema changes are captured via `npx prisma migrate dev`, ensuring versioned and reproducible database states.

## 8. Seeding Strategy
A comprehensive seed script (`prisma/seed.ts`) is provided to bootstrap the environment:
- Creates a default organization: **CRM App Solutions**.
- Creates an Admin user: `admin@crmapp.com`.
- Creates a Member user: `sara@crmapp.com`.
- populates initial customers and notes to demonstrate the system's capabilities.

## 9. How to Run Locally
1. **Environment Setup**:
   ```bash
   cp .env.example .env
   ```
   Update `DATABASE_URL` with your local PostgreSQL connection string.

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Database Initialization**:
   ```bash
   npx prisma migrate dev --name init
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```

## 10. How to Deploy (Vercel + Neon)
1. **Database**: Create a PostgreSQL instance on **Neon.tech**.
2. **Environment Variables**:
   - Set `DATABASE_URL` to your Neon connection string.
   - Set `NEXTAUTH_SECRET` to a random 32-character string.
   - Set `NEXTAUTH_URL` to your production domain.
3. **Build**: Run `npm run build` on Vercel. Ensure `npx prisma generate` is part of your build command (handled automatically by Next.js if configured).

## 11. Important Design Decisions
- **Service Layer Pattern**: All business logic is encapsulated in `src/lib/services/`. This separates concerns from the API routes and makes the logic highly testable.
- **Centralized Validation**: Zod schemas are shared between the frontend and backend to ensure data integrity at both entry and storage points.
- **Soft Deletion**: Customers are "soft-deleted" (using `deletedAt`) to preserve historical notes and activity logs while removing them from active views.

## 12. Performance Considerations
- **Indexing**: Critical fields like `organizationId`, `email`, and `deletedAt` are indexed to ensure fast lookups even as the database grows.
- **Pagination**: The `ActivityDashboard` and `CustomerList` implement server-side pagination to handle large datasets efficiently.
- **Prisma Client Singleton**: The database client is managed as a singleton to prevent connection leaks during development and in serverless environments.