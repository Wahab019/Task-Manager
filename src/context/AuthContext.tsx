"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { Models } from "appwrite";
import { account } from "@/lib/appwrite";

interface AuthContextType {
  user: Models.User<Models.Preferences> | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
  refreshUser: async () => {},
});

// Provides shared auth state to descendant components.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Loads the current Appwrite account and stores it in auth context.
  // Missing sessions are treated as signed-out state instead of fatal errors.
  const fetchUser = async () => {
    try {
      const currentUser = await account.get();
      setUser(currentUser);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  // Deletes the active Appwrite session, clears cached user state, and sends the user back to login.
  // Failures are logged because logout is a navigation-side action.
  const logout = async () => {
    try {
      await account.deleteSession("current");
    } catch (_) {
      // Ignore error if session was inactive
    } finally {
      setUser(null);
      router.push("/login");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        logout,
        refreshUser: fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Exposes authenticated user data and auth actions from AuthContext.
// Components call it instead of importing Appwrite directly.
export const useAuth = () => useContext(AuthContext);
