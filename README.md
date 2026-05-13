# Multi-Tenant CRM System

A professional, secure, and performant Multi-Tenant CRM built with **Next.js 15**, **Prisma**, **NextAuth.js**, and **Tailwind CSS 4**.

## Key Features

- **Multi-Tenant Isolation**: Strict organization-level data separation ensured via schema and service-layer enforcement.
- **RBAC (Role-Based Access Control)**: Managed roles (`ADMIN` and `MEMBER`) for secure team management and customer assignment.
- **Customer Management**: Full lifecycle management including creation, soft-deletion, and restoration.
- **Assignment System**: Admin-controlled distribution of customers to team members with workload limits.
- **Activity & Auditing**: Comprehensive activity logging for all customer and team operations.
- **Internal Notes**: Threaded notes on customer records for team collaboration.
- **Modern UI**: Built with a custom design system using Radix UI primitives and Tailwind 4.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: NextAuth.js
- **Styling**: Tailwind CSS 4
- **Components**: Radix UI + Sonner (Toasts) + Recharts (Dashboard Stats)
- **Validation**: Zod (Centralized Schema Management)

## Getting Started

### 1. Environment Setup
Copy the example environment file and fill in your credentials:
```bash
cp .env.example .env
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Migration & Seeding
Initialize the database and seed the initial organization and users:
```bash
npx prisma migrate dev
npx prisma db seed
```

### 4. Run Development Server
```bash
npm run dev
```

## Project Structure

The project follows a modular, service-oriented architecture:
- `src/lib/services/`: Core business logic and database access.
- `src/lib/validations/`: Centralized Zod schemas for type-safe validation.
- `src/components/dashboard/`: Domain-specific dashboard components.
- `src/components/customers/`: Customer management views.
- `src/app/api/`: RESTful API endpoints with strict auth and tenant checks.