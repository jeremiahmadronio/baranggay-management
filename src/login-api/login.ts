import { api } from "../apiClients";

export interface LoginResponse {
  token: string;
  userId: string;
  role: string;
}

export const authService = {
  login: async (credentials: {
    email: string;
    password: string;
  }): Promise<LoginResponse> => {
    const response = await api.post("/api/v1/auth/login", credentials, {
      requiresAuth: false,
    });

    return response;
  },

  verifyMfa: async (data: {
    email: string;
    code: string;
  }): Promise<LoginResponse> => {
    const response = await api.post("/api/v1/auth/verify-mfa", data, {
      requiresAuth: false,
    });

    localStorage.setItem("token", response.token);
    localStorage.setItem("userId", response.userId);
    localStorage.setItem("userRole", response.role);

    return response;
  },

  logout: () => {
    localStorage.clear();
    window.location.href = "/login";
  },
};
