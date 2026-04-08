import { api } from "../apiClients";

export interface LoginResponse {
  token: string;
  userId: string;
  role: string;
  departments?: string[];
  username?: string;
  firstName?: string;
  lastName?: string;
}

export function persistAuthSession(
  response: LoginResponse,
  email?: string,
): void {
  // Clear ALL old user data first before storing new data
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
  localStorage.removeItem("userRole");
  localStorage.removeItem("departments");
  localStorage.removeItem("username");
  localStorage.removeItem("firstName");
  localStorage.removeItem("lastName");
  localStorage.removeItem("userEmail");

  // Store new data
  localStorage.setItem("token", response.token);
  localStorage.setItem("userId", response.userId);
  localStorage.setItem("userRole", response.role);

  if (email) {
    localStorage.setItem("userEmail", email);
  }

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

    // Some accounts may bypass MFA and return a real JWT directly.
    if (response?.token && response.token !== "MFA_REQUIRED") {
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

    persistAuthSession(response, data.email);

    return response;
  },

  logout: () => {
    localStorage.clear();
  },
};
