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

const USER_CACHE_KEY = "cached_user_profile";

interface UserContextType {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

/** Save user profile to localStorage for offline use */
function cacheUserProfile(profile: UserProfile) {
  try {
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(profile));
  } catch { /* quota exceeded, silently fail */ }
}

/** Restore user profile from localStorage when offline */
function getCachedUserProfile(): UserProfile | null {
  try {
    const cached = localStorage.getItem(USER_CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

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

      // If the response came from the offline cache (has _fromCache), still use it
      // But also check if we got a real profile back
      if (data && data.username) {
        setUser(data);
        // Cache for offline use
        cacheUserProfile(data);
      } else {
        // Returned empty object (offline interceptor fallback) -> try offline cache
        const cachedProfile = getCachedUserProfile();
        if (cachedProfile) {
          console.log("[UserContext] Using cached user profile (offline empty response)");
          setUser(cachedProfile);
        } else {
          setError("Failed to load user profile");
        }
      }
    } catch (err: any) {
      const errorMessage = err.message || "Failed to fetch user profile";
      console.error("Failed to fetch user profile:", err);

      // OFFLINE FALLBACK: restore from localStorage cache
      const cachedProfile = getCachedUserProfile();
      if (cachedProfile) {
        console.log("[UserContext] Using cached user profile (offline error)");
        setUser(cachedProfile);
        setError(null); // Don't show error if we have cached data
        setLoading(false);
        return;
      }

      setError(errorMessage);

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
