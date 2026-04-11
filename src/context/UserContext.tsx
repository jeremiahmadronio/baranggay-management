import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import {
  getUserProfile,
  type UserProfile,
} from "../service/login-api/user-profile";

interface UserContextType {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getUserProfile();
      setUser(data);
    } catch (err: any) {
      const errorMessage = err.message || "Failed to fetch user profile";
      setError(errorMessage);
      console.error("Failed to fetch user profile:", err);

      // Only redirect to login if token is truly missing or invalid
      // Don't redirect on 403 (permission error) - user might just not have access to profile endpoint
      if (
        errorMessage.includes("No authentication token") ||
        errorMessage.includes("Invalid token")
      ) {
        setTimeout(() => {
          window.location.href = "/login";
        }, 100);
      }
      // For "expired" or "Session expired", just log it - token was already removed
      // User will be redirected on next protected API call if needed
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, loading, error, refetch: fetchUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}

// Helper to get user's display name
export function getUserDisplayName(
  user: UserProfile | null,
  fallback = "User",
): string {
  if (!user) return fallback;
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  if (user.firstName) return user.firstName;
  if (user.username) return user.username;
  return fallback;
}
