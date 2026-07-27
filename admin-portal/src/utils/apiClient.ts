import axios from "axios";

const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_ADMIN_API_URL) {
    return process.env.NEXT_PUBLIC_ADMIN_API_URL;
  }
  if (typeof window !== "undefined") {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isLocalhost) {
      return `http://${window.location.hostname}:5000/api/admin`;
    }
  }
  return "http://localhost:5000/api/admin";
};

const apiClient = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("adminToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminUser");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// Global Stale-While-Revalidate (SWR) Memory Cache
const getCache = new Map<string, { data: any; expiry: number }>();
const CACHE_TTL = 300000; // 5 minutes

const originalGet = apiClient.get;

apiClient.get = async (url: string, config?: any) => {
  const cacheKey = url + JSON.stringify(config || {});
  const cached = getCache.get(cacheKey);

  if (cached && Date.now() < cached.expiry) {
    // Background revalidation
    originalGet.call(apiClient, url, config).then(res => {
      getCache.set(cacheKey, { data: res, expiry: Date.now() + CACHE_TTL });
    }).catch(() => {});
    
    return Promise.resolve({ ...cached.data });
  }

  const response = await originalGet.call(apiClient, url, config);
  getCache.set(cacheKey, { data: response, expiry: Date.now() + CACHE_TTL });
  return response;
};

// Auto-invalidate cache on mutations
['post', 'put', 'patch', 'delete'].forEach(method => {
  const originalMethod = (apiClient as any)[method];
  (apiClient as any)[method] = async (...args: any[]) => {
    getCache.clear();
    return originalMethod.apply(apiClient, args);
  };
});

export default apiClient;
