import { api } from "../apiClients";

export const resetPasswordService = {
  // Step 1: Request password reset (sends code to email)
  forgotPassword: async (email: string): Promise<string> => {
    const response = await api.post(
      "/api/v1/auth/forgot-password",
      { email },
      { requiresAuth: false },
    );
    return response;
  },

  // Step 2: Verify the reset code
  verifyResetCode: async (data: {
    email: string;
    code: string;
  }): Promise<string> => {
    const response = await api.post("/api/v1/auth/verify-reset-code", data, {
      requiresAuth: false,
    });
    return response;
  },

  // Step 3: Complete password reset
  resetPassword: async (data: {
    email: string;
    code: string;
    newPassword: string;
  }): Promise<string> => {
    const response = await api.post("/api/v1/auth/reset-password", data, {
      requiresAuth: false,
    });
    return response;
  },
};
