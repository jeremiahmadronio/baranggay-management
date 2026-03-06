import { api } from "../apiClients";

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  contactNumber?: string;
  role?: string;
}

/**
 * Fetches the current logged-in user's profile from the backend.
 * Uses the /api/v1/users/settings-preview endpoint.
 */
export async function getUserProfile(): Promise<UserProfile> {
  return api.get("/api/v1/users/settings-preview");
}
