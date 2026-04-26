import client from './client';

export const referPatient = (data: Record<string, unknown>) =>
  client.post('/api/doctor/refer-patient', data);

export const myReferrals = (params?: Record<string, unknown>) =>
  client.get('/api/doctor/my-referrals', { params });

export const listMyReports = (params?: Record<string, unknown>) =>
  client.get('/api/doctor/reports', { params });

export const getMyReport = (id: string) => client.get(`/api/doctor/reports/${id}`);

export const downloadMyReport = (id: string) =>
  client.get(`/api/doctor/reports/${id}/download`, { responseType: 'blob' });
