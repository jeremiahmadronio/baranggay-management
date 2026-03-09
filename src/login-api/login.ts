import { api } from "../apiClients";

export interface LoginResponse {
  token: string;
  userId: string;
  role: string;
  username?: string;
  firstName?: string;
  lastName?: string;
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

    // Clear ALL old user data first before storing new data
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("userRole");
    localStorage.removeItem("username");
    localStorage.removeItem("firstName");
    localStorage.removeItem("lastName");
    localStorage.removeItem("userEmail");

    // Store new data
    localStorage.setItem("token", response.token);
    localStorage.setItem("userId", response.userId);
    localStorage.setItem("userRole", response.role);
    localStorage.setItem("userEmail", data.email); // Store email used for login

    // Store username/name if available from backend
    if (response.username) {
      localStorage.setItem("username", response.username);
    }
    if (response.firstName) {
      localStorage.setItem("firstName", response.firstName);
    }
    if (response.lastName) {
      localStorage.setItem("lastName", response.lastName);
    }

    return response;
  },

  logout: () => {
    localStorage.clear();
    window.location.href = "/login";
  },
};
