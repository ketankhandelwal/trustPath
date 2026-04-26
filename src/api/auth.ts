import client from './client';

export const adminLogin = (email: string, password: string) =>
  client.post('/api/auth/admin/login', { email, password });

export const doctorLogin = (login_id: string, password: string) =>
  client.post('/api/auth/doctor/login', { login_id, password });

export const logout = () => client.post('/api/auth/logout');

export const getMe = () => client.get('/api/auth/me');

export const adminChangePassword = (old_password: string, new_password: string) =>
  client.post('/api/auth/admin/change-password', { old_password, new_password });

export const doctorChangePassword = (old_password: string, new_password: string) =>
  client.post('/api/auth/doctor/change-password', { old_password, new_password });
