import { createContext, useContext } from "react";

export type AuthData = {
  claims?: Record<string, any> | null;
  profile?: any | null;
  isLoading: boolean;
  isProfileLoading: boolean;
  isLoggedIn: boolean;
};

export const AuthContext = createContext<AuthData>({
  claims: undefined,
  profile: undefined,
  isLoading: true,
  isProfileLoading: true,
  isLoggedIn: false,
});

export const useAuthContext = () => useContext(AuthContext);
