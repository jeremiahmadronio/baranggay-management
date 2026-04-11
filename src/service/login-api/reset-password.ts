import { api } from "../../apiClients";

export const resetPasswordService = {
  forgotPassword: async (email: string): Promise<void> => {
    await api.post("/api/v1/auth/forgot-password", { email }, {
      requiresAuth: false,
    });
  },

  verifyResetCode: async (data: {
    email: string;
    code: string;
  }): Promise<void> => {
    await api.post("/api/v1/auth/forgot-password/verify", data, {
      requiresAuth: false,
    });
  },

  resetPassword: async (data: {
    email: string;
    code: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<void> => {
    await api.post("/api/v1/auth/forgot-password/reset", data, {
      requiresAuth: false,
    });
  },
};