# WorkSphere — Enterprise Work & Project Management Platform

A modern, multi-tenant enterprise project management and collaboration platform built with the production **MERN stack** (MongoDB, Express, React, Node.js).

## Architecture Overview

- **Frontend**: React 18, Vite 5, TypeScript, Tailwind CSS, TanStack Query v5, Zustand, React Router v6.
- **Backend**: Node.js, Express, TypeScript, Mongoose ODM, Zod validation, JWT authentication.
- **Database**: MongoDB 7.0 (multi-tenant schema isolation).

## Directory Structure

```
├── backend/            # Express REST API (TypeScript)
│   ├── src/
│   │   ├── config/     # Database & environment configuration
│   │   ├── middleware/ # Auth, RBAC, tenant isolation, error handling
│   │   ├── models/     # Mongoose schemas (17 models)
│   │   ├── routes/     # 20+ modular API endpoints
│   │   ├── scripts/    # Database seed scripts
│   │   └── utils/      # Helpers and response handlers
│   └── package.json
├── frontend/           # React + Vite Single Page Application (TypeScript)
│   ├── src/
│   │   ├── api/        # Axios API client with automatic token refresh
│   │   ├── components/ # Reusable UI & Layout components
│   │   ├── features/   # Domain-specific feature modules (Agile, Capacity, Automation, etc.)
│   │   ├── hooks/      # TanStack Query custom hooks
│   │   ├── lib/        # i18n translations & RBAC permission maps
│   │   ├── pages/      # Route pages with React.lazy code splitting
│   │   ├── store/      # Zustand auth state & Currency context
│   │   ├── types/      # TypeScript interfaces
│   │   └── utils/      # API unpacking & error formatting helpers
│   └── package.json
├── docker-compose.yml  # Containerized stack setup (Mongo + Backend + Frontend)
└── README.md
```

## Running Locally

### Prerequisites
- Node.js 20+
- MongoDB 7.0+ (or Docker)

### 1. Start MongoDB
Run via Docker:
```bash
docker run -d --name worksphere-mongo -p 27017:27017 mongo:7.0
```
Or start via Docker Compose:
```bash
docker-compose up mongodb -d
```

### 2. Start Backend & Seed Data
```bash
cd backend
npm install

# Seed demo tenants, users, projects, sprints, tasks, and telemetry data
npm run seed

# Start development server
npm run dev
```
Backend runs on `http://localhost:5001`.

### 3. Start Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`.

### 4. Running with Docker Compose (Full Stack)
```bash
docker-compose up --build
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5001`
- MongoDB: `mongodb://localhost:27017/worksphere`
