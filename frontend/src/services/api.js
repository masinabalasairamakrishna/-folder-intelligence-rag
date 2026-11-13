import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Catch 401 unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register' && window.location.pathname !== '/') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// Folders endpoints
export const folderApi = {
  list: () => api.get('/folders'),
  get: (id) => api.get(`/folders/${id}`),
  create: (data) => api.post('/folders', data),
  update: (id, data) => api.patch(`/folders/${id}`, data),
  delete: (id) => api.delete(`/folders/${id}`),
};

// Documents endpoints
export const docApi = {
  listInFolder: (folderId) => api.get(`/folders/${folderId}/documents`),
  get: (id) => api.get(`/documents/${id}`),
  delete: (id) => api.delete(`/documents/${id}`),
  reindex: (id) => api.post(`/documents/${id}/reindex`),
  upload: (folderId, formData) => api.post(`/folders/${folderId}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

// Chat & RAG endpoints
export const chatApi = {
  ask: (data) => api.post('/chat/ask', data),
  getConversations: (folderId) => api.get('/chat/conversations', { params: { folder_id: folderId } }),
  getConversation: (id) => api.get(`/chat/conversations/${id}`),
  deleteConversation: (id) => api.delete(`/chat/conversations/${id}`),
};

// AI Tools endpoints
export const aiApi = {
  summarizeDoc: (data) => api.post('/ai/summarize-document', data),
  summarizeFolder: (data) => api.post('/ai/summarize-folder', data),
  compareDocs: (data) => api.post('/ai/compare-documents', data),
  generateMCQs: (data) => api.post('/ai/generate-mcqs', data),
};

// Dashboard endpoints
export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
};

export default api;
