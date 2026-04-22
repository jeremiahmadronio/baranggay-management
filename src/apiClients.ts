const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

interface ApiOptions {
  requiresAuth?: boolean;
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, string | number | boolean>; 
}

export const apiClient = async (endpoint: string, options: ApiOptions = {}) => {
  const { requiresAuth = true, headers = {}, body, method = "GET", params } = options;

  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...headers,
  };

  // --- 1. TOKEN VALIDATION LOGIC ---
  if (requiresAuth) {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const payload = JSON.parse(atob(base64));
        const currentTime = Date.now() / 1000;
        
        if (payload.exp < currentTime) {
          localStorage.removeItem("token");
          throw new Error("Session expired. Please login again.");
        }
      } catch (e: any) {
        if (e.message.includes("expired")) throw e;
        localStorage.removeItem("token");
        throw new Error("Invalid session. Please login again.");
      }
      requestHeaders["Authorization"] = `Bearer ${token}`;
    } else {
      throw new Error("No authentication token found. Please login.");
    }
  }

  // --- 2. QUERY PARAMETERS HANDLER ---
  // Dito natin bubuoin yung URL kung may 'params' na pinasa
  let url = `${BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  // --- 3. FETCH EXECUTION ---
  try {
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body !== undefined && body !== null ? JSON.stringify(body) : undefined,
    });

    // Handle non-OK responses
    if (!response.ok) {
      let errorMessage = `Error ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        const text = await response.text();
        if (text) errorMessage = text;
      }

      if (response.status === 401 && !endpoint.includes("/auth/login")) {
        localStorage.removeItem("token");
      }
      throw new Error(errorMessage);
    }

    // Handle response content type
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    }
    return await response.text();

  } catch (error: any) {
    if (error.message === "Failed to fetch") {
      throw new Error("Server is unreachable. Please check your connection.");
    }
    throw error;
  }
};

// --- 4. EXPORTED API WRAPPERS ---
export const api = {
  get: (url: string, options?: ApiOptions) =>
    apiClient(url, { ...options, method: "GET" }),
    
  post: (url: string, data?: any, options?: ApiOptions) =>
    apiClient(url, { ...options, method: "POST", body: data }),
    
  put: (url: string, data?: any, options?: ApiOptions) =>
    apiClient(url, { ...options, method: "PUT", body: data }),
    
  delete: (url: string, options?: ApiOptions) =>
    apiClient(url, { ...options, method: "DELETE" }),
};