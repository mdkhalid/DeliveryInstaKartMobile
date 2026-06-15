import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import ENV from '@/constants/config';
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from './storage';

const api = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request Interceptor
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor (auto-refresh)
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach((prom) => {
    if (error || !token) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${ENV.API_BASE_URL}/auth/refresh`, null, {
          withCredentials: true,
          headers: { Cookie: `refreshToken=${refreshToken}` },
        });

        const newToken = data.data?.accessToken || data.accessToken;
        if (!newToken) throw new Error('No new access token');

        await setTokens(newToken, refreshToken);
        processQueue(null, newToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await clearTokens();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  sendOtp: (phone: string) =>
    api.post('/auth/send-otp', { phone }),
  verifyOtp: (phone: string, code: string) =>
    api.post('/auth/verify-otp', { phone, code }),
  logout: () =>
    api.post('/auth/logout'),
};

// User Profile
export const userAPI = {
  getProfile: () =>
    api.get('/users/profile'),
  updateProfile: (data: { firstName?: string; lastName?: string; phone?: string }) =>
    api.put('/users/profile', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/users/change-password', data),
  uploadAvatar: (formData: FormData) =>
    api.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// Orders
export const orderAPI = {
  detail: (id: string) =>
    api.get(`/orders/${id}`),
  list: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get('/orders', { params }),
};

// Stores
export const storeAPI = {
  detail: (id: string) =>
    api.get(`/stores/${id}`),
  list: () =>
    api.get('/stores'),
};

// Delivery Agent (via admin routes)
export const deliveryAPI = {
  getMyAssignments: (params?: { status?: string }) =>
    api.get('/admin/delivery-persons/me/assignments', { params }),

  updateAssignmentStatus: (assignmentId: string, status: string, notes?: string) =>
    api.put(`/admin/delivery-assignments/${assignmentId}/status`, { status, notes }),

  getMyActivity: (days?: number) =>
    api.get('/admin/delivery-persons/me/activity', { params: { days } }),

  getMyStats: () =>
    api.get('/admin/delivery-persons/me/stats'),

  updateLocation: (lat: number, lng: number) =>
    api.put('/admin/delivery-persons/me/location', { lat, lng }),

  toggleStatus: (status: string) =>
    api.put('/admin/delivery-persons/me/status', { status }),

  getMyProfile: () =>
    api.get('/admin/delivery-persons/me'),
};

// Upload
export const uploadAPI = {
  deliveryPhoto: (formData: FormData) =>
    api.post('/upload/issues', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export default api;
