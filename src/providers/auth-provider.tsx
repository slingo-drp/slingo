import { AuthContext } from "@/hooks/use-auth-context";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";
import { PropsWithChildren, useEffect, useState } from "react";

export default function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [claims, setClaims] = useState<Record<string, any> | null>();
  const [profile, setProfile] = useState<any>();
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

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

        if (!nextClaims?.sub) {
          setProfile(null);
          return;
        }

        const { data: nextProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", nextClaims.sub)
          .single();

        if (!isCancelled) {
          setProfile(nextProfile ?? null);
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
