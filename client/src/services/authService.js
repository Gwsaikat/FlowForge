import api from './api.js';

export async function registerUser(payload) {
  const { data } = await api.post('/auth/register', payload);
  return data.data;
}

export async function loginUser(payload) {
  const { data } = await api.post('/auth/login', payload);
  return data.data;
}

export async function logoutUser() {
  const { data } = await api.post('/auth/logout');
  return data.data;
}

export async function refreshAccessToken() {
  const { data } = await api.post('/auth/refresh');
  return data.data;
}

export async function getCurrentUser() {
  const { data } = await api.get('/auth/me');
  return data.data;
}
