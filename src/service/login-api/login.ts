import { api } from "../../apiClients";

export interface LoginResponse {
  status: "MFA_REQUIRED" | "CHANGE_PASSWORD_REQUIRED" | "SUCCESS";
  userId: string;
  role: string;
  departments?: string[];
  token?: string;
}

export function persistAuthSession(
  response: LoginResponse,
  email?: string,
): void {
  // Selyado: Papasok lang dito kung SUCCESS at may token talaga
  if (response.status !== "SUCCESS" || !response.token) {
    return;
  }

  localStorage.removeItem("token");
  localStorage.removeItem("userId");
  localStorage.removeItem("userRole");
  localStorage.removeItem("departments");
  localStorage.removeItem("userEmail");

  localStorage.setItem("token", response.token);
  localStorage.setItem("userId", response.userId);
  localStorage.setItem("userRole", response.role);

  if (email) {
    localStorage.setItem("userEmail", email);
  }

  if (response.departments && response.departments.length > 0) {
    localStorage.setItem("departments", JSON.stringify(response.departments));
  }
}

export const authService = {
  login: async (credentials: {
    email: string;
    password: string;
  }): Promise<LoginResponse> => {
    const response = await api.post("/api/v1/auth/login", credentials, {
      requiresAuth: false,
    });

    if (response.status === "SUCCESS") {
      persistAuthSession(response, credentials.email);
    }

    return response;
  },

  verifyMfa: async (data: {
    email: string;
    code: string;
  }): Promise<LoginResponse> => {
    const response = await api.post("/api/v1/auth/verify-mfa", data, {
      requiresAuth: false,
    });

    if (response.status === "SUCCESS") {
      persistAuthSession(response, data.email);
    }

    return response;
  },

  changePasswordNewAccount: async (data: {
    email: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<LoginResponse> => {
    const response = await api.post("/api/v1/auth/change-password", data, {
      requiresAuth: false,
    });

    if (response.status === "SUCCESS") {
      persistAuthSession(response, data.email);
    }

    return response;
  },

  logout: () => {
    localStorage.clear();
  },
};