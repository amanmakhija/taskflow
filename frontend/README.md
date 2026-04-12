# TaskFlow — Frontend

React + TypeScript frontend for TaskFlow, connecting to the Go backend at `localhost:8080`.

## Stack

- **Vite** — build tool
- **React 18 + TypeScript** — UI framework
- **Tailwind CSS** — styling
- **Radix UI primitives** — accessible components (Dialog, Select, Toast, etc.)
- **TanStack Query v5** — server state, caching, mutations
- **React Router v6** — client-side routing
- **Axios** — HTTP client with JWT interceptor
- **Fonts:** Syne (display) + DM Sans (body)

## Running locally

```bash
# Install dependencies
npm install

# Start dev server (proxies /auth, /projects, /tasks → localhost:8080)
npm run dev
# App at http://localhost:5173
```

Make sure the Go backend is running on `:8080` first.

## Build for production

```bash
npm run build
# Output in /dist
```

## Docker

```bash
docker build -t taskflow-frontend .
docker run -p 3000:80 taskflow-frontend
```

The nginx config proxies `/auth`, `/projects`, `/tasks` to `http://api:8080` (docker-compose service name).

## Features

- **Auth** — Login / Register with JWT, persisted in localStorage, protected routes
- **Projects list** — grid/list toggle, create, delete with confirmation
- **Project detail** — kanban-style 3-column layout (Todo / In Progress / Done)
- **Task management** — create, edit, delete via modal; filter by status + priority
- **Optimistic UI** — click a task's status badge to cycle it; reverts on error
- **Stats panel** — hits `/projects/:id/stats` for live counts + completion bar
- **Dark mode** — toggle in navbar, persisted across sessions
- **Loading/error/empty states** — every async operation is covered
- **Responsive** — works at 375px and 1280px+

## Project structure

```
src/
  api/          # Axios service functions (authApi, projectsApi, tasksApi)
  components/   # Reusable UI components
    ui/         # Primitive components (Button, Input, Dialog, Select, Toast…)
  hooks/        # useAuth (context), useToast (global toast bus)
  lib/          # axios instance, cn() util, formatDate, isOverdue
  pages/        # AuthPage, ProjectsPage, ProjectDetailPage
  types/        # TypeScript interfaces (User, Project, Task, …)
```

## Test credentials (seed data)

```
Email:    test@example.com
Password: password123
```
