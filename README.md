# 🚀 TaskFlow — Full Stack Task Management System

## 1. Overview

**TaskFlow** is a minimal yet production-ready task management system where users can:

- Register and log in securely
- Create and manage projects
- Add, update, and delete tasks within projects
- Assign tasks and track their status and priority
- View project-level analytics (task stats)

This project demonstrates a complete full-stack architecture with authentication, relational data modeling, REST APIs, and a responsive frontend.

---

## 🛠 Tech Stack

### Backend

- Go (Gin)
- PostgreSQL
- pgx (database driver)
- JWT (authentication)
- bcrypt (password hashing)
- golang-migrate (migrations)

### Frontend

- React + TypeScript (Vite)
- Tailwind CSS
- Nginx (production build + reverse proxy)

### Infrastructure

- Docker & Docker Compose

---

## 2. Architecture Decisions

### 🔹 Backend Architecture

- **Layered Architecture**:
  `Handler → Service → Repository → DB`
- Clear separation of concerns improves maintainability and testability
- No heavy ORM used → direct SQL for better control and performance

### 🔹 Authentication

- JWT-based authentication with 24-hour expiry
- Middleware-based route protection
- User context injected into requests

### 🔹 Database Design

- PostgreSQL with normalized schema
- ENUMs for task status & priority
- Indexes for performance (project_id, assignee_id)

### 🔹 Migrations

- Managed via `golang-migrate`
- Version-controlled schema changes
- Includes seed data for testing

### 🔹 Frontend

- SPA built with React + Vite
- Nginx used for:
  - Serving static files
  - Reverse proxying `/api` → backend

### 🔹 Tradeoffs

- No ORM → more SQL but better performance and control
- Minimal UI styling → prioritized functionality over design
- No real-time updates → kept scope focused and stable

---

## 3. Running Locally

### Prerequisites

- Docker installed

---

### Steps

```bash
git clone https://github.com/amanmakhjia/taskflow
cd taskflow

# create env files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# run everything
docker compose up --build
```

---

### Access the app

- Frontend: http://localhost:3000
- Backend API: http://localhost:8080

---

## 4. Running Migrations

Migrations are **automatically executed** via Docker on startup using the `migrate` service.

No manual steps required.

---

## 5. Test Credentials

Use the seeded user:

```
Email:    test@example.com
Password: password123
```

---

## 6. API Reference

### 🔐 Auth

| Method | Endpoint       | Description   |
| ------ | -------------- | ------------- |
| POST   | /auth/register | Register user |
| POST   | /auth/login    | Login user    |

---

### 📁 Projects

| Method | Endpoint            | Description                 |
| ------ | ------------------- | --------------------------- |
| GET    | /projects           | List user projects          |
| POST   | /projects           | Create project              |
| GET    | /projects/:id       | Get project + tasks         |
| PATCH  | /projects/:id       | Update project (owner only) |
| DELETE | /projects/:id       | Delete project (owner only) |
| GET    | /projects/:id/stats | Task analytics (bonus)      |

---

### ✅ Tasks

| Method | Endpoint            | Description                    |
| ------ | ------------------- | ------------------------------ |
| GET    | /projects/:id/tasks | List tasks (filters supported) |
| POST   | /projects/:id/tasks | Create task                    |
| PATCH  | /tasks/:id          | Update task                    |
| DELETE | /tasks/:id          | Delete task (authorized only)  |

---

### 🔎 Filters

```
GET /projects/:id/tasks?status=todo
GET /projects/:id/tasks?assignee=<user_id>
```

---

### ⚠️ Error Format

```json
{
  "error": "validation failed",
  "fields": {
    "email": "is required"
  }
}
```

---

## 7. What I'd Do With More Time

- ✅ Add pagination for projects/tasks
- ✅ Implement role-based access (multi-user collaboration)
- ✅ Add real-time updates (WebSockets)
- ✅ Improve UI/UX with better design system
- ✅ Add integration tests (auth + task flows)
- ✅ Add caching layer for stats endpoint
- ✅ Implement CI/CD pipeline

---

## 🎯 Key Highlights

- Fully containerized full-stack app
- Clean backend architecture (Go best practices)
- Proper auth & authorization handling
- Production-ready Docker setup
- SQL-first approach (no ORM magic)
- Bonus stats API implemented

---

## 🧠 Notes

This project was built with a focus on:

- correctness
- clarity
- production-readiness

Rather than adding unnecessary complexity, the goal was to deliver a **complete and reliable system** within the given constraints.

---

## 📦 Submission

GitHub Repo: _(add your link here)_

---

🔥 Thanks for reviewing TaskFlow!
