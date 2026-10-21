import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  google: (credential) => api.post('/auth/google', { credential }),
  verifyOtp: (data) => api.post('/auth/verify-otp', data),
  resendOtp: (data) => api.post('/auth/resend-otp', data),
  config: () => api.get('/auth/config'),
  me: () => api.get('/auth/me'),
  updateMe: (data) => api.patch('/auth/me', data),
};

export const eventsAPI = {
  list: (params) => api.get('/events', { params }),
  get: (id) => api.get(`/events/${id}`),
  create: (formData) => api.post('/events', formData),
  update: (id, formData) => api.put(`/events/${id}`, formData),
  remove: (id) => api.delete(`/events/${id}`),
};

export const registrationsAPI = {
  mine: () => api.get('/registrations/mine'),
  register: (eventId) => api.post(`/registrations/${eventId}`),
  cancel: (eventId) => api.delete(`/registrations/${eventId}`),
};

export const aiAPI = {
  describe: (data) => api.post('/ai/describe', data),
  recommend: () => api.get('/ai/recommend'),
  chat: (message) => api.post('/ai/chat', { message }),
};

export const notificationsAPI = {
  list: () => api.get('/notifications'),
  read: (id) => api.patch(`/notifications/${id}/read`),
  readAll: () => api.patch('/notifications/read-all'),
};

export const dashboardAPI = {
  admin: () => api.get('/dashboard/admin'),
  student: () => api.get('/dashboard/student'),
};

export default api;
