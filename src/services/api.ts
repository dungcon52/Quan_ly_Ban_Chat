import axios from 'axios';
import { Project, Package, Activity, DailyReport, PackageReportingStatus, User, Machinery, MachineryTransfer } from '../types/index.ts';

const api = axios.create({
  baseURL: '/api',
});

// Interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const activeUserId = localStorage.getItem('active_user_id');
  if (activeUserId) {
    config.headers['x-user-id'] = activeUserId;
  }
  return config;
});

export const authService = {
  login: async (username: string, password: string) => {
    const res = await api.post('/auth/login', { username, password });
    return res.data;
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
  switchRole: async (role?: string, userId?: number) => {
    const res = await api.post('/auth/switch-role', { role, userId });
    return res.data;
  },
  getUsers: async (): Promise<User[]> => {
    const res = await api.get('/users');
    return res.data;
  },
  createUser: async (data: any) => {
    const res = await api.post('/users', data);
    return res.data;
  },
  updateUser: async (id: number, data: any) => {
    const res = await api.put(`/users/${id}`, data);
    return res.data;
  },
};

export const projectService = {
  getAll: async (): Promise<Project[]> => {
    const res = await api.get('/projects');
    return res.data;
  },
  getById: async (id: number): Promise<{ project: Project; packages: Package[] }> => {
    const res = await api.get(`/projects/${id}`);
    return res.data;
  },
  create: async (data: Partial<Project>): Promise<Project> => {
    const res = await api.post('/projects', data);
    return res.data;
  },
  update: async (id: number, data: Partial<Project>): Promise<Project> => {
    const res = await api.put(`/projects/${id}`, data);
    return res.data;
  },
  delete: async (id: number) => {
    const res = await api.delete(`/projects/${id}`);
    return res.data;
  },
  getDashboard: async (id: number) => {
    const res = await api.get(`/dashboard/projects/${id}`);
    return res.data;
  },
};

export const packageService = {
  getAll: async (projectId?: number): Promise<Package[]> => {
    const res = await api.get('/packages', { params: { projectId } });
    return res.data;
  },
  getById: async (id: number): Promise<any> => {
    const res = await api.get(`/packages/${id}`);
    return res.data;
  },
  create: async (data: Partial<Package>): Promise<Package> => {
    const res = await api.post('/packages', data);
    return res.data;
  },
  update: async (id: number, data: Partial<Package>): Promise<Package> => {
    const res = await api.put(`/packages/${id}`, data);
    return res.data;
  },
  delete: async (id: number) => {
    const res = await api.delete(`/packages/${id}`);
    return res.data;
  },
  getDashboard: async (id: number) => {
    const res = await api.get(`/dashboard/packages/${id}`);
    return res.data;
  },
};

export const activityService = {
  getAll: async (packageId?: number): Promise<Activity[]> => {
    const res = await api.get('/activities', { params: { packageId } });
    return res.data;
  },
  create: async (data: Partial<Activity>): Promise<Activity> => {
    const res = await api.post('/activities', data);
    return res.data;
  },
  update: async (id: number, data: Partial<Activity>): Promise<Activity> => {
    const res = await api.put(`/activities/${id}`, data);
    return res.data;
  },
  delete: async (id: number) => {
    const res = await api.delete(`/activities/${id}`);
    return res.data;
  },
};

export const reportService = {
  getAll: async (params?: { packageId?: number; date?: string }): Promise<DailyReport[]> => {
    const res = await api.get('/daily-reports', { params });
    return res.data;
  },
  getById: async (id: number): Promise<DailyReport> => {
    const res = await api.get(`/daily-reports/${id}`);
    return res.data;
  },
  create: async (data: any) => {
    const res = await api.post('/daily-reports', data);
    return res.data;
  },
  update: async (id: number, data: any) => {
    const res = await api.put(`/daily-reports/${id}`, data);
    return res.data;
  },
  delete: async (id: number) => {
    const res = await api.delete(`/daily-reports/${id}`);
    return res.data;
  },
  getReportingStatus: async (date?: string): Promise<{
    date: string;
    manpower: number;
    machinery: {
      operating: number;
      total: number;
      maintenance: number;
      standby: number;
    };
    shifts: {
      morning: { total: number; reportedCount: number; packages: any[] };
      evening: { total: number; reportedCount: number; packages: any[] };
    };
    delayedActivities: import('../types/index.ts').DelayedActivity[];
  }> => {
    const res = await api.get('/reporting-status', { params: { date } });
    return res.data;
  },
  resolveDifficulty: async (reportId: number) => {
    const res = await api.post(`/issues/${reportId}/resolve-difficulty`);
    return res.data;
  },
  resolveProposal: async (reportId: number) => {
    const res = await api.post(`/issues/${reportId}/resolve-proposal`);
    return res.data;
  },
};

export const machineryService = {
  getAll: async (params?: { packageId?: number; status?: string; type?: string; search?: string }): Promise<Machinery[]> => {
    const res = await api.get('/machinery', { params });
    return res.data;
  },
  getById: async (id: number): Promise<Machinery & { transfers: MachineryTransfer[]; recentUsages: any[] }> => {
    const res = await api.get(`/machinery/${id}`);
    return res.data;
  },
  create: async (data: Partial<Machinery>): Promise<Machinery> => {
    const res = await api.post('/machinery', data);
    return res.data;
  },
  update: async (id: number, data: Partial<Machinery>) => {
    const res = await api.put(`/machinery/${id}`, data);
    return res.data;
  },
  delete: async (id: number) => {
    const res = await api.delete(`/machinery/${id}`);
    return res.data;
  },
  transfer: async (id: number, data: { toPackageId: number; transferDate?: string; reason?: string; notes?: string }) => {
    const res = await api.post(`/machinery/${id}/transfer`, data);
    return res.data;
  },
  getTransfers: async (): Promise<MachineryTransfer[]> => {
    const res = await api.get('/machinery-transfers');
    return res.data;
  },
  getAvailableForPackage: async (packageId: number, date?: string): Promise<any[]> => {
    const res = await api.get(`/packages/${packageId}/available-machinery`, { params: { date } });
    return res.data;
  },
};

export const systemService = {
  getInfo: async () => {
    const res = await api.get('/system/info');
    return res.data;
  },
};

export default api;
