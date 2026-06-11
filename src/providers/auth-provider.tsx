import { AuthContext } from "@/hooks/use-auth-context";
import { createFallbackProfile, getProfile, type Profile } from "@/lib/profile";
import { supabase } from "@/lib/supabase";
import { useSettingsStore } from "@/store/useSettingsStore";
import type { Session } from "@supabase/supabase-js";
import { PropsWithChildren, useCallback, useEffect, useState } from "react";

export default function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [claims, setClaims] = useState<Record<string, any> | null>();
  const [profile, setProfile] = useState<Profile | null>();
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const userId = session?.user.id;

    if (!userId) {
      setProfile(null);
      return null;
    }

    const nextProfile = await getProfile(userId);
    const resolvedProfile = nextProfile ?? createFallbackProfile(userId);
    setProfile(resolvedProfile);
    return resolvedProfile;
  }, [session?.user.id]);

  useEffect(() => {
    let isCancelled = false;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (isCancelled) return;

      setSession(nextSession);
      if (!nextSession) {
        setClaims(null);
        setProfile(null);
        setIsProfileLoading(false);
      } else {
        setIsProfileLoading(true);
      }
      setIsLoading(false);
    });

    return () => {
      isCancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!profile?.learning_language) {
      return;
    }

    useSettingsStore.getState().setLanguage(profile.learning_language);
  }, [profile?.learning_language]);

  useEffect(() => {
    let isCancelled = false;

    if (!session) return;

    supabase.auth
      .getClaims()
      .then(async ({ data, error }) => {
        if (isCancelled) return;

        if (error) {
          console.error("Error fetching claims:", error);
          if (
            error.message?.includes("User from sub claim in JWT does not exist")
          ) {
            await supabase.auth.signOut();
          }
          setClaims(null);
          setProfile(null);
          return;
        }

        const nextClaims = data?.claims ?? null;
        setClaims(nextClaims);

        const userId = nextClaims?.sub ?? session.user.id;

        if (!userId) {
          setProfile(null);
          return;
        }

        try {
          const nextProfile = await getProfile(userId);
          const resolvedProfile = nextProfile ?? createFallbackProfile(userId);

          if (!isCancelled) {
            setProfile(resolvedProfile);
          }
        } catch (profileError) {
          console.error("Error loading profile:", profileError);

          if (!isCancelled) {
            setProfile(createFallbackProfile(userId));
          }
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsProfileLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [session]);

  return (
    <AuthContext.Provider
      value={{
        claims,
        isLoading,
        isLoggedIn: !!session,
        isProfileLoading,
        profile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
