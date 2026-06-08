import { AuthContext } from "@/hooks/use-auth-context";
import { supabase } from "@/lib/supabase";
import { PropsWithChildren, useEffect, useState } from "react";

export default function AuthProvider({ children }: PropsWithChildren) {
  const [claims, setClaims] = useState<
    Record<string, any> | undefined | null
  >();
  const [profile, setProfile] = useState<any>();
  const [isLoading, setIsLoading] = useState(true);

  // Subscribe to auth changes — INITIAL_SESSION fires on setup
  // to handle session restoration from storage.
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        const { data, error } = await supabase.auth.getClaims();
        if (error) {
          console.error("Error fetching claims:", error);
          if (
            error.message?.includes("User from sub claim in JWT does not exist")
          ) {
            await supabase.auth.signOut();
          }
          setClaims(null);
        } else {
          setClaims(data?.claims ?? null);
        }
      } else {
        setClaims(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch profile whenever claims change
  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      if (claims) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", claims.sub)
          .single();
        setProfile(data);
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    };

    fetchProfile();
  }, [claims]);

  return (
    <AuthContext.Provider
      value={{ claims, isLoading, profile, isLoggedIn: !!claims }}
    >
      {children}
    </AuthContext.Provider>
  );
}
