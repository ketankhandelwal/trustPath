import client from './client';

// Doctors
export const listDoctors = (params?: Record<string, unknown>) =>
  client.get('/api/admin/doctors', { params });

export const getDoctor = (id: string) => client.get(`/api/admin/doctors/${id}`);

export const createDoctor = (data: Record<string, unknown>) =>
  client.post('/api/admin/doctors', data);

export const updateDoctor = (id: string, data: Record<string, unknown>) =>
  client.put(`/api/admin/doctors/${id}`, data);

export const toggleDoctorStatus = (id: string, isActive: boolean) =>
  client.patch(`/api/admin/doctors/${id}/status`, { is_active: isActive });

// Reports
export const listReports = (params?: Record<string, unknown>) =>
  client.get('/api/admin/reports', { params });

export const getReport = (id: string) => client.get(`/api/admin/reports/${id}`);

export const createReport = (data: FormData) =>
  client.post('/api/admin/reports', data, { headers: { 'Content-Type': 'multipart/form-data' } });

export const updateReport = (id: string, data: FormData) =>
  client.put(`/api/admin/reports/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });

export const updateReportStatus = (id: string, status: string) =>
  client.patch(`/api/admin/reports/${id}/status`, { status });

export const downloadReport = (id: string) =>
  client.get(`/api/admin/reports/${id}/download`, { responseType: 'blob' });

// Referrals
export const listReferrals = (params?: Record<string, unknown>) =>
  client.get('/api/admin/referrals', { params });
