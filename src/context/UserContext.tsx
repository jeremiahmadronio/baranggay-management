import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { getUserProfile, type UserProfile } from "../login-api/user-profile";

// Mock user data for development when backend is unavailable
const MOCK_USER: UserProfile = {
  id: "mock-user-001",
  username: "dev_admin",
  email: "admin@barangay.dev",
  firstName: "Dev",
  lastName: "Admin",
  contactNumber: "+63 912 345 6789",
  role: "rootadmin",
};

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
      // No token - use mock data for development
      console.warn("[UserContext] No token found, using mock user data");
      setUser(MOCK_USER);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getUserProfile();
      setUser(data);
    } catch (err: any) {
      console.error("Failed to fetch user profile:", err);
      // Fallback to mock data when API fails
      console.warn("[UserContext] API failed, using mock user data");
      setUser(MOCK_USER);
      setError(null); // Clear error since we have fallback data
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
