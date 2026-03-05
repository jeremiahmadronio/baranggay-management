const BASE_URL = "http://localhost:8080";

interface ApiOptions {
  requiresAuth?: boolean;
  method?: string;
  headers?: Record<string, string>;
  body?: any;
}

export const apiClient = async (endpoint: string, options: ApiOptions = {}) => {
  const { requiresAuth = true, headers = {}, body, method = "GET" } = options;

  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...headers,
  };

  if (requiresAuth) {
    const token = localStorage.getItem("token");
    if (token) {
      // Check if token is expired BEFORE making the request
      try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const payload = JSON.parse(atob(base64));
        const currentTime = Date.now() / 1000;
        if (payload.exp < currentTime) {
          console.warn("Token expired, clearing session...");
          localStorage.clear();
          window.location.href = "/login";
          throw new Error("Token expired. Please login again.");
        }
      } catch (e: any) {
        if (e.message === "Token expired. Please login again.") throw e;
        // If token can't be decoded, it's invalid
        console.warn("Invalid token, clearing session...");
        localStorage.clear();
        window.location.href = "/login";
        throw new Error("Invalid token. Please login again.");
      }
      requestHeaders["Authorization"] = `Bearer ${token}`;
    } else {
      window.location.href = "/login";
      return;
    }
  }

  const url = `${BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body:
        body !== undefined && body !== null ? JSON.stringify(body) : undefined,
    });

    // Auto-handle Expired Token (401) or Forbidden (403)
    if (response.status === 401 || response.status === 403) {
      localStorage.clear();
      window.location.href = "/login";
      throw new Error("Session expired. Please login again.");
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Request failed with status ${response.status}`,
      );
    }

    // Check content-type to determine how to parse response
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    } else {
      return await response.text();
    }
  } catch (error: any) {
    console.error("API Error:", error.message);
    throw error;
  }
};

export const api = {
  get: (url: string, options?: ApiOptions) =>
    apiClient(url, { ...options, method: "GET" }),
  post: (url: string, data: any, options?: ApiOptions) =>
    apiClient(url, { ...options, method: "POST", body: data }),
  put: (url: string, data: any, options?: ApiOptions) =>
    apiClient(url, { ...options, method: "PUT", body: data }),
  delete: (url: string, options?: ApiOptions) =>
    apiClient(url, { ...options, method: "DELETE" }),
};

// Paste this in browser console (F12 → Console)
const token = localStorage.getItem("token");
if (token) {
  const payload = JSON.parse(atob(token.split(".")[1]));
  console.log("Token payload:", payload);
  console.log("Email/Subject:", payload.sub || payload.email);
  console.log("Expires:", new Date(payload.exp * 1000).toLocaleString());
} else {
  console.log("No token found");
}
