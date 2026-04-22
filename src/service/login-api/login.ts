import { api } from "../../apiClients";

// --- INTERFACES (Match sa DTOs mo) ---

export type MfaType = "EMAIL" | "BACKUP_EMAIL" | "TOTP" | "RECOVERY";

export interface LoginResponse {
  status: "MFA_REQUIRED" | "CHANGE_PASSWORD_REQUIRED" | "SUCCESS";
  userId: string;
  role: string;
  departments?: string[];
  token?: string;
  totpEnabled: boolean;
  hasBackupEmail: boolean;
}

export interface MfaSetupResponse {
  secret: string;
  qrCode: string;
}

export interface MfaEnableSuccessResponse {
  status: string;
  recoveryCodes: string[];
}

// --- PERSISTENCE LOGIC ---

export function persistAuthSession(
  response: LoginResponse,
  email?: string,
): void {
  if (response.status !== "SUCCESS" || !response.token) return;

  localStorage.setItem("token", response.token);
  localStorage.setItem("userId", response.userId);
  localStorage.setItem("userRole", response.role);
  if (email) localStorage.setItem("userEmail", email);
  if (response.departments) {
    localStorage.setItem("departments", JSON.stringify(response.departments));
  }
}

// --- AUTH SERVICE ---

export const authService = {
  /**
   * @PostMapping("/login")
   */
  login: async (credentials: {
    email: string;
    password: string;
  }): Promise<LoginResponse> => {
    const response = await api.post("/api/v1/auth/login", credentials, {
      requiresAuth: false,
    });
    if (response.status === "SUCCESS")
      persistAuthSession(response, credentials.email);
    return response;
  },

  /**
   * @PostMapping("/verify-mfa")
   */
  verifyMfa: async (data: {
    email: string;
    code: string;
    type: MfaType;
  }): Promise<LoginResponse> => {
    const response = await api.post("/api/v1/auth/verify-mfa", data, {
      requiresAuth: false,
    });
    if (response.status === "SUCCESS") persistAuthSession(response, data.email);
    return response;
  },

  /**
   * @GetMapping("/setup")
   * Kumukuha ng QR Code at Secret
   */
  initiateTotpSetup: async (): Promise<MfaSetupResponse> => {
    return await api.get("/api/v1/auth/setup", { requiresAuth: true });
  },

  /**
   * @PostMapping("/confirm")
   * Nag-e-enable ng TOTP
   */
  confirmTotpSetup: async (data: {
    code: string;
     secret: string;
  }): Promise<MfaEnableSuccessResponse> => {
    return await api.post("/api/v1/auth/confirm", data, { requiresAuth: true });
  },

  /**
   * @PostMapping("/backup-email/initiate")
   * Dahil @RequestParam ang gamit sa Java, 'params' ang gagamitin natin, hindi 'body'.
   */
  initiateBackupEmail: async (
    primaryEmail: string,
    backupEmail: string,
  ): Promise<void> => {
    await api.post("/api/v1/auth/backup-email/initiate", null, {
      params: { primaryEmail, backupEmail }, // Dito isasaksak yung request params
      requiresAuth: true,
    });
  },

  /**
   * @PostMapping("/backup-email/verify")
   */
  verifyBackupEmail: async (
    primaryEmail: string,
    backupEmail: string,
    code: string,
  ): Promise<void> => {
    await api.post("/api/v1/auth/backup-email/verify", null, {
      params: { primaryEmail, backupEmail, code },
      requiresAuth: true,
    });
  },

  /**
   * @PostMapping("/forgot-password")
   */
  forgotPassword: async (email: string): Promise<void> => {
    await api.post(
      "/api/v1/auth/forgot-password",
      { email },
      { requiresAuth: false },
    );
  },

  /**
   * @PostMapping("/forgot-password/verify")
   */
  verifyResetCode: async (data: {
    email: string;
    code: string;
  }): Promise<void> => {
    await api.post("/api/v1/auth/forgot-password/verify", data, {
      requiresAuth: false,
    });
  },

  /**
   * @PostMapping("/forgot-password/reset")
   */
  resetPassword: async (data: any): Promise<void> => {
    await api.post("/api/v1/auth/forgot-password/reset", data, {
      requiresAuth: false,
    });
  },

  /**
   * @PostMapping("/change-password")
   * Para sa mga New Account setup
   */
  changePasswordNewAccount: async (data: any): Promise<LoginResponse> => {
    const response = await api.post("/api/v1/auth/change-password", data, {
      requiresAuth: false,
    });
    if (response.status === "SUCCESS") persistAuthSession(response, data.email);
    return response;
  },

  checkUsernameAvailability: async (username: string): Promise<boolean> => {
    return await api.get("/api/v1/auth/check-username", {
      params: { username: username.trim() },
      requiresAuth: false,
    });
  },

  logout: () => {
    localStorage.clear();
    window.location.href = "/login";
  },
};
