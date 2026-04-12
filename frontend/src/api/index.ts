import api from '@/lib/axios';
import type { AuthResponse, Project, Task, ProjectStats } from '@/types';

// Auth
export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post<AuthResponse>('/auth/register', data).then((r) => r.data),
  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', data).then((r) => r.data),
};

// Projects
export const projectsApi = {
  list: (page = 1, limit = 20) =>
    api.get<{ projects: Project[] } | Project[]>('/projects', { params: { page, limit } }).then((r) => {
      const d = r.data as any;
      return (d.projects ?? d) as Project[];
    }),

  get: (id: string) =>
    api.get<Project>(`/projects/${id}`).then((r) => r.data),

  create: (data: { name: string; description?: string }) =>
    api.post<Project>('/projects', data).then((r) => r.data),

  update: (id: string, data: { name?: string; description?: string }) =>
    api.patch<Project>(`/projects/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/projects/${id}`),

  stats: (id: string) =>
    api.get<ProjectStats>(`/projects/${id}/stats`).then((r) => r.data),
};

// Tasks
export const tasksApi = {
  list: (projectId: string, params?: { status?: string; assignee?: string }) =>
    api
      .get<{ tasks: Task[] } | Task[]>(`/projects/${projectId}/tasks`, { params })
      .then((r) => {
        const d = r.data as any;
        return (d.tasks ?? d) as Task[];
      }),

  create: (projectId: string, data: Partial<Task>) =>
    api.post<Task>(`/projects/${projectId}/tasks`, data).then((r) => r.data),

  update: (id: string, data: Partial<Task>) =>
    api.patch<Task>(`/tasks/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/tasks/${id}`),
};
