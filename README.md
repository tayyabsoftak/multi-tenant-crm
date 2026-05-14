# Multi-Tenant CRM System

A production-ready, secure, and performant Multi-Tenant CRM built with **Next.js 15**, **Prisma**, **NextAuth.js**, and **Tailwind CSS**. This repository serves as a Full Stack Engineer take-home assignment implementation.

## 1. Architecture Decisions
- **Monorepo / Full-Stack Next.js**: The entire application (frontend, API, and database ORM) is housed in a single Next.js application using the App Router. This keeps the implementation minimal and cohesive.
- **Service Layer Pattern**: Business logic is decoupled from API route handlers and placed inside `src/lib/services/`. This ensures multi-tenancy rules and concurrency protections are enforced in a single, testable location.
- **Centralized Validation**: Zod is used as a single source of truth for data validation. Schemas are shared between the frontend (React Hook Form) and the backend (API routes) to guarantee strict data integrity without duplicating logic.
- **Role-Based Access Control (RBAC)**: Roles are restricted to strictly two levels: `ADMIN` and `USER`. Roles are embedded inside the encrypted JWT to prevent database lookups on every request.

## 2. Multi-Tenancy Enforcement
Strict data isolation is the cornerstone of this system:
- **Database Level**: Every core entity (`User`, `Customer`, `Note`, `ActivityLog`) contains an `organizationId` foreign key.
- **Service Level**: Every database query implicitly requires `organizationId` as a parameter. Cross-tenant leakage is architecturally prevented because the `organizationId` is automatically extracted from the authenticated user's session token and hardcoded into the `where` clause of every Prisma operation.
- **Team Page**: The system intentionally does not separate Admins and Users into different systems. The team page displays all users within the *same* organization.

## 3. Concurrency Handling
Enforcing the business rule that a user can have a **maximum of 5 active customers** requires robust concurrency protections.
- **Serializable Transactions**: Customer creation, updating, assignment, and restoration are wrapped in `prisma.$transaction(..., { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })`.
- **Race Condition Protection**: By elevating the isolation level to `Serializable`, the system locks the read state of the active customer count. If 10 concurrent HTTP requests attempt to assign a 6th customer to a user at the exact same millisecond, the database guarantees that only one transaction will see the count as 4 (and succeed), while the other 9 will see the count as 5 (and correctly fail with a 409 Conflict). There is no bypass allowed.

## 4. Performance Strategy
The system is designed to support 100,000 customers per organization without degradation:
- **Composite Indexes**: The PostgreSQL database utilizes composite indexes (e.g., `@@index([organizationId, deletedAt])`) to rapidly filter active customers per tenant.
- **Efficient Pagination**: Customer lists are paginated at the database level using `take` and `skip`. Search queries are pushed down to the database using `contains` and `mode: 'insensitive'`.
- **N+1 Query Prevention**: Related data (like assigning a user to a customer) is fetched using Prisma's `include` feature, combining queries into single SQL statements instead of looping and fetching individually.
- **Debounced Search**: Frontend search inputs are debounced to prevent spamming the backend API on every keystroke.

## 5. Scaling Approach
As the system grows, the architecture supports several scaling vectors:
- **Stateless Authentication**: NextAuth uses encrypted JWTs instead of database-backed sessions. This allows the Next.js API layer to scale horizontally across multiple instances (or serverless functions) without sticky sessions.
- **Read Replicas**: Prisma can be configured to route read-heavy operations (like the Dashboard summary and Customer List) to a PostgreSQL read replica, keeping the primary database free for transactional writes (like assignments and notes).
- **Database Connection Pooling**: Ready to be integrated with PgBouncer or Prisma Accelerate to handle sudden spikes in serverless connections.

## 6. Trade-offs
To keep the system minimal, clean, and assignment-focused, certain trade-offs were made:
- **Soft Deletes over Archiving**: Deleted customers are kept in the same table with a `deletedAt` timestamp instead of moving them to a separate archive table. While this requires `deletedAt: null` checks on every query, it vastly simplifies restoration logic and maintains referential integrity for notes and activity logs.
- **Serverless API vs Separate Backend**: Instead of a separate NestJS/Express microservice, the API is built directly into Next.js API routes. This reduces infrastructure overhead but tightly couples the backend to the Next.js lifecycle.
- **Standard UI Components**: We utilized pre-built Radix UI/Tailwind components instead of building a bespoke design system from scratch. This accelerates development while maintaining a highly polished, accessible user experience.

## 7. Production Improvement Explanation
Before a massive public launch, the following improvements would be implemented:
- **Rate Limiting**: Implement Redis-based rate limiting (e.g., Upstash) on API routes to protect against brute force attacks and noisy-neighbor problems in a multi-tenant environment.
- **Real-Time Updates**: Replace optimistic UI polling with WebSockets or Server-Sent Events (SSE) to push real-time notifications to team members when a customer is assigned to them.
- **Background Jobs**: Move the `ActivityLog` creation out of the synchronous request path and into a background queue (like BullMQ or Inngest) to speed up API response times for core actions.
- **Automated E2E Testing**: Add Playwright or Cypress to simulate complex multi-tenant scenarios (e.g., logging in as two different organizations and asserting data isolation).

## 8. Setup Instructions

### Project Installation
1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd multi-tenant-crm
   ```
2. **Install dependencies** (Frontend & Backend are integrated):
   ```bash
   npm install
   ```
3. **Environment Variables**:
   Copy the example environment file and configure it:
   ```bash
   cp .env.example .env
   ```
   Set your `DATABASE_URL` and `NEXTAUTH_SECRET`.

### Database Setup
1. **PostgreSQL Setup locally**:
   Ensure you have a local instance of PostgreSQL running and update the `DATABASE_URL` in your `.env` file to point to it (e.g., `postgresql://user:password@localhost:5432/crm?schema=public`).
2. **Run Prisma Migrations**:
   Apply the database schema:
   ```bash
   npx prisma migrate dev
   ```
3. **Seed Database**:
   Populate the initial organization, admin, member, and customers:
   ```bash
   npm run prisma:seed
   ```

### Start Project
Since this is a unified full-stack application, both the frontend and backend start simultaneously.
```bash
npm run dev
```

## 9. Database Reset & Migrations

- **How to Reset Database Safely**:
  If you need to completely wipe your local database and start fresh, run:
  ```bash
  npx prisma migrate reset
  ```
  *Note: This will drop the database, re-run all migrations, and automatically run the seed file.*

- **How to Re-run Migrations**:
  If you pull new code with updated migrations, apply them using:
  ```bash
  npx prisma migrate deploy
  ```

- **How to Run Seed File Manually**:
  ```bash
  npm run prisma:seed
  ```

- **What Happens If Migrations Are Deleted?**
  If the `prisma/migrations` folder is deleted, Prisma will lose the migration history. You would need to clear your database, drop the `_prisma_migrations` table, and create a new initial migration using `npx prisma migrate dev --name init`.

- **Applying Schema Updates**:
  Whenever you modify `prisma/schema.prisma`, you must create a new migration:
  ```bash
  npx prisma migrate dev --name your_change_description
  ```

## 10. Authentication Flow

- **Login Flow**: Users log in using their email and password through NextAuth.js.
- **Admin Creates User**: New team members cannot sign up themselves. An `ADMIN` must create a user from the `/team` dashboard. The password is manually set by the admin and securely hashed using `bcryptjs` before insertion.
- **Session Integrity**: The JSON Web Token (JWT) and NextAuth session securely contain:
  - `userId`
  - `role` (`ADMIN` or `USER`)
  - `organizationId`
  This guarantees that all subsequent requests inherently "know" who the user is and what organization they belong to, without needing an extra database lookup to authorize data access.