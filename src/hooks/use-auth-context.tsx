import type { Profile } from "@/lib/profile";
import { createContext, useContext } from "react";

export type AuthData = {
  claims?: Record<string, any> | null;
  profile?: Profile | null;
  isLoading: boolean;
  isProfileLoading: boolean;
  isLoggedIn: boolean;
  refreshProfile: () => Promise<Profile | null>;
};

export const AuthContext = createContext<AuthData>({
  claims: undefined,
  profile: undefined,
  isLoading: true,
  isProfileLoading: true,
  isLoggedIn: false,
  refreshProfile: async () => null,
});

export const useAuthContext = () => useContext(AuthContext);
