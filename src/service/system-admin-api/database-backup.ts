const BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";
const BACKUP_URL = `${BASE}/api/admin/backups`;

export interface BackupResponseDTO {
  id?: string | null;
  fileName: string;
  label?: string | null;
  createdBy?: string | null;
  createdAt: string;
  fileSizeKb: number;
  encrypted: boolean;
}

export interface BackupSchedule {
  frequency: string; // "DAILY" o "WEEKLY"
  hour: number; // 0-23
  minute: number; // 0-59
  dayOfWeek?: string; // "MON", "TUE", etc.
  enabled: boolean;
}

export interface BackupStatsDTO {
  storageUsedGb: number;
  storageLimitGb: number;
  autoBackupFrequency: string;
  nextBackupTime: string;
  lastBackupStatus: string;
  lastBackupDate: string;
}

async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("token");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
      throw new Error("Session expired. Please login again.");
    }
    const contentType = response.headers.get("content-type");
    const errMsg = contentType?.includes("application/json")
      ? (await response.json().catch(() => ({}))).message
      : await response.text();
    throw new Error(errMsg || `HTTP error! status: ${response.status}`);
  }

  if (response.status === 204) return {} as T;

  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) return response.json();
  return response.text() as unknown as T;
}

export const backupApi = {
  triggerManualBackup: (
    label?: string,
    passphrase?: string,
    reason: string = "Manual Backup",
  ): Promise<string> => {
    const params = new URLSearchParams({ reason });
    if (label) params.append("label", label);
    if (passphrase) params.append("passphrase", passphrase);
    return apiFetch<string>(`${BACKUP_URL}/trigger?${params.toString()}`, {
      method: "POST",
    });
  },

  listBackups: (): Promise<BackupResponseDTO[]> =>
    apiFetch<BackupResponseDTO[]>(`${BACKUP_URL}/list`),

  deleteBackup: (
    fileName: string,
    passphrase: string,
    reason: string = "Manual Cleanup",
  ): Promise<string> => {
    const params = new URLSearchParams({ fileName, passphrase, reason });
    return apiFetch<string>(`${BACKUP_URL}/delete?${params.toString()}`, {
      method: "DELETE",
    });
  },

  getStats: (): Promise<BackupStatsDTO> =>
    apiFetch<BackupStatsDTO>(`${BACKUP_URL}/stats`),

  updateSchedule: (schedule: BackupSchedule): Promise<string> =>
    apiFetch<string>(`${BACKUP_URL}/settings/schedule`, {
      method: "POST",
      body: JSON.stringify(schedule),
    }),

  downloadBackup: async (
    fileName: string,
    passphrase?: string,
  ): Promise<Blob> => {
    const token = localStorage.getItem("token");
    const params = new URLSearchParams({ fileName });
    if (passphrase) params.append("passphrase", passphrase);

    const response = await fetch(
      `${BACKUP_URL}/download?${params.toString()}`,
      {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      },
    );

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        throw new Error("Session expired. Please login again.");
      }
      const errMsg = await response.text();
      throw new Error(errMsg || `HTTP error! status: ${response.status}`);
    }

    return response.blob();
  },

  restoreFromCloud: (
    fileName: string,
    passphrase?: string,
  ): Promise<string> => {
    const params = new URLSearchParams({ fileName });
    if (passphrase) params.append("passphrase", passphrase);
    return apiFetch<string>(`${BACKUP_URL}/restore?${params.toString()}`, {
      method: "POST",
    });
  },

  restoreFromUpload: (file: File, passphrase: string): Promise<string> => {
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("passphrase", passphrase);

    return fetch(`${BACKUP_URL}/restore/upload`, {
      method: "POST",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    }).then(async (response) => {
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/login";
          throw new Error("Session expired. Please login again.");
        }
        const errMsg = await response.text();
        throw new Error(errMsg || `HTTP error! status: ${response.status}`);
      }
      return response.text();
    });
  },
};
