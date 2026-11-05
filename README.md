# CCR Meeting Room Reservation System 🏢📅

A full-stack multi-tenant reservation platform designed for businesses to manage shared spaces (Meeting Rooms and Offices) efficiently, enforcing role-based permissions and real-time scheduling constraints.

---

## 🚀 Features

- **Multi-Tenant Architecture:** Isolated environments and management tailored for distinct corporate entities (e.g., CCR).
- **Role-Based Access Control (RBAC):** Granular permissions supporting `MASTER`, `ADMIN`, and `USER` roles to govern approvals, user management, and bookings.
- **Conflict Prevention Engine:** Built-in validation (`checkConflict`) to seamlessly prevent reservation overlaps for rooms and offices.
- **Quota Tracking:** Real-time monitoring of available vs. used hours per company account.
- **Modern Full-Stack Stack:** Powered by Next.js App Router for server-side efficiency and Prisma ORM for robust database integrity.

---

## 🛠️ Tech Stack

- **Frontend & Backend:** Next.js (App Router), React, TypeScript / JavaScript
- **Styling:** Tailwind CSS / SCSS
- **Database & ORM:** MySQL, Prisma ORM
- **Hosting & Deployment:** Vercel (Frontend/App) & Railway (Database)

---

## 🔗 Live Demo

Experience the live application here: [CCR Services Reservation App](https://tu-enlace-de-vercel.vercel.app) *(Actualiza este enlace una vez que esté desplegado)*

---

## 🏁 Getting Started

### Prerequisites

Make sure you have Node.js and npm installed on your machine.

### 1. Clone the repository

```bash
git clone [https://github.com/clientesCcrWeb/AppSalaDeJuntas.git](https://github.com/clientesCcrWeb/AppSalaDeJuntas.git)
cd AppSalaDeJuntas