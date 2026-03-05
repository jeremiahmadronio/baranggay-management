const BASE_URL = "http://localhost:8080";

interface ApiOptions extends RequestInit {
  requiresAuth?: boolean;
}

export const apiClient = async (endpoint: string, options: ApiOptions = {}) => {
  const { requiresAuth = true, headers = {}, body, ...rest } = options;

  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(headers as Record<string, string>),
  };

  if (requiresAuth) {
    const token = localStorage.getItem("token");
    if (token) {
      requestHeaders["Authorization"] = `Bearer ${token}`;
    } else {
      window.location.href = "/login";
      return;
    }
  }

  const url = `${BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...rest,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    // Auto-handle ng Expired Token (401)
    if (response.status === 401) {
      localStorage.clear();
      window.location.href = "/login";
      throw new Error("Session expired. Please login again.");
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Something went wrong");
    }

    // Check content-type to determine how to parse response
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    } else {
      // Return text for non-JSON responses
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
