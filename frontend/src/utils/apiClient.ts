import axios from "axios";

const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== "undefined") {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isLocalhost) {
      return `http://${window.location.hostname}:5000/api`;
    }
  }
  return "http://localhost:5000/api";
};

/**
 * Professional API Client
 * Centralized axios instance with automated JWT handling and silent token refresh.
 */
const apiClient = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Crucial for sending/receiving HTTP-only refresh cookies
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Helper to get or create device ID
const getDeviceId = () => {
  if (typeof window !== "undefined") {
    let deviceId = localStorage.getItem("kambata_device_id");
    if (!deviceId) {
      deviceId = "dev_" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      localStorage.setItem("kambata_device_id", deviceId);
    }
    return deviceId;
  }
  return null;
};

// Request Interceptor: Attach JWT token and device ID
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      config.headers = config.headers || {};
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log(`[DEBUG AUTH] apiClient attaching Bearer token to ${config.method?.toUpperCase()} ${config.url}`);
      } else {
        console.log(`[DEBUG AUTH] apiClient NO TOKEN to attach for ${config.method?.toUpperCase()} ${config.url}`);
      }
      
      const deviceId = getDeviceId();
      if (deviceId) {
        config.headers["x-device-id"] = deviceId;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401s by attempting to refresh token
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    const isAuthRoute = originalRequest.url?.includes("/auth/login") || originalRequest.url?.includes("/auth/register");
    
    if (error.response?.status === 401 && !originalRequest._retry && typeof window !== "undefined" && !isAuthRoute) {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return apiClient(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to get a new access token using the HTTP-only refresh cookie
        const { data } = await axios.post(
          `${apiClient.defaults.baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        
        const newAccessToken = data.accessToken;
        localStorage.setItem("token", newAccessToken);
        
        // Update default and original request headers
        apiClient.defaults.headers.common['Authorization'] = 'Bearer ' + newAccessToken;
        originalRequest.headers['Authorization'] = 'Bearer ' + newAccessToken;
        
        processQueue(null, newAccessToken);
        return apiClient(originalRequest);
      } catch (err) {
        processQueue(err, null);
        // If refresh fails (e.g. refresh token expired), clean up and force re-authentication
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
