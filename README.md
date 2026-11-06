# CCR Meeting Room Reservation System 🏢

A multi-tenant, real-time meeting room reservation platform designed for commercial business centers. Features role-based access control (`MASTER`, `ADMIN`, `USER`), automated monthly hours tracking, dynamic slot privacy, and multi-client tenancy management.

## 🚀 Features

- **Multi-Tenant Access Control:** Role-based permissions (`MASTER`, `ADMIN`, `USER`) for structured client and administration management.
- **Automated Hours Management:** Shared monthly hour allocations (`Company.horasPeriodo`) with real-time balance tracking, automatic adjustments on reservation creation/edits/cancellations, and manual `MASTER` overrides.
- **Timezone-Aware Operations:** All reservation schedules and usage counters align strictly with `America/Mexico_City` time.
- **Data Privacy & Security:** Encrypted session cookies via signed secrets, secure auth flows, and automated account verification states.
- **Relational Data Persistence:** Type-safe database queries and automated schema orchestrations powered by Prisma ORM.

## 🛠️ Tech Stack

- **Framework / Language:** Next.js (App Router), React, TypeScript
- **Database / ORM:** MySQL, Prisma ORM
- **Deployment & Hosting:** Vercel (Frontend & Serverless Functions), Railway (Managed MySQL Database)
- **Styling:** Tailwind CSS
- **Tools & Utilities:** Node.js (v20.9+), Git, GitHub

## 🔑 Environment Variables

Create a `.env` file in the root directory and configure the following variables before running local development or migrations:

```env
# Database & Authentication
DATABASE_URL="mysql://username:password@localhost:3306/ccr_reservations"
SESSION_SECRET="your-at-least-32-char-random-base64-secret"

# Optional Seed Master Account Configuration
SEED_MASTER_EMAIL="master@ccrbusiness.com"
SEED_MASTER_USERNAME="master_admin"
SEED_MASTER_NAME="Master Director"
SEED_MASTER_PASSWORD="SecurePassword123!"
SEED_MASTER_COMPANY="CCR Business"       # Defaults to 'CCR Business'
SEED_MASTER_DEPARTMENT="Dirección"        # Defaults to 'Dirección'
