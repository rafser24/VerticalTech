import api from './api';

export const promocionService = {
  getAll: async (params = {}) => {
    const response = await api.get('/promociones', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/promociones/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/promociones', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/promociones/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    await api.delete(`/promociones/${id}`);
    return true;
  },

  toggleActivo: async (id) => {
    const response = await api.patch(`/promociones/${id}/toggle`);
    return response.data;
  },
};
