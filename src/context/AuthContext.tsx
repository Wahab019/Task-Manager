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

/**
 * Authentication state and actions shared by the application shell.
 *
 * Consumers use this contract instead of accessing the Appwrite account API
 * directly.
 */
interface AuthContextType {
  user: Models.User<Models.Preferences> | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

/** Default context state used before an AuthProvider is mounted. */
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
  refreshUser: async () => {},
});

/** Props accepted by {@link AuthProvider}. */
type AuthProviderProps = {
  /** Descendant components that receive the authentication context. */
  children: ReactNode;
};

/**
 * Provides shared authentication state to descendant components.
 *
 * The provider loads the current Appwrite account on mount, treats a missing
 * session as signed-out state, and exposes account refresh and logout actions.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  /**
   * Loads the current Appwrite account into context.
   * Missing or invalid sessions become signed-out state, while the loading
   * flag is cleared regardless of whether the lookup succeeds.
   */
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

  /**
   * Deletes the active Appwrite session and redirects to login.
   *
   * Session deletion failures are ignored because the local user state is
   * cleared and navigation should still complete for an inactive session.
   */
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

/** Exposes authentication state and actions from the nearest AuthProvider. */
export const useAuth = () => useContext(AuthContext);
