import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

// ✅ Use null so misuse is caught
const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (ctx === null) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Prevent stale async updates if a newer auth event arrives
  const runIdRef = useRef(0);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    const safeSet = (fn) => {
      if (mountedRef.current) fn();
    };

    const fetchProfile = async (userId) => {
      // Keep this function "pure": no loading toggles here.
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;
      return data ?? null;
    };

    // Optional: create profile if missing
    const ensureProfile = async (u) => {
      const existing = await fetchProfile(u.id);
      if (existing) return existing;

      // If you DON'T want auto-create, just return null here.
      // return null;

      const { data, error } = await supabase
        .from("user_profiles")
        .insert({
          id: u.id,
          // You can pull full name from auth metadata if you store it there:
          full_name: u.user_metadata?.full_name ?? null,
        })
        .select("*")
        .single();

      if (error) throw error;
      return data;
    };

    const applyAuthState = async (nextSession) => {
      // Each auth event gets a run id. Only latest run can commit state.
      const myRunId = ++runIdRef.current;

      safeSet(() => setLoading(true));

      try {
        const nextUser = nextSession?.user ?? null;

        // Update base auth state immediately
        safeSet(() => {
          setSession(nextSession ?? null);
          setUser(nextUser);
        });

        // Profile resolution
        if (!nextUser) {
          safeSet(() => setProfile(null));
          return;
        }

        const nextProfile = await ensureProfile(nextUser);

        // Only commit if this is still the latest run
        if (runIdRef.current !== myRunId) return;

        safeSet(() => setProfile(nextProfile));
      } catch (err) {
        console.error("[Auth] applyAuthState error:", err);

        // Only latest run should reset
        if (runIdRef.current !== myRunId) return;

        safeSet(() => {
          setSession(null);
          setUser(null);
          setProfile(null);
        });
      } finally {
        // Only latest run ends loading
        if (runIdRef.current === myRunId) {
          safeSet(() => setLoading(false));
        }
      }
    };

    // 1) Bootstrap immediately (so we don't wait for an event)
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) throw error;
        applyAuthState(data?.session ?? null);
      })
      .catch((err) => {
        console.error("[Auth] getSession error:", err);
        safeSet(() => {
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
        });
      });

    // 2) Single subscription stream for all future changes
    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      applyAuthState(nextSession ?? null);
    });

    return () => {
      mountedRef.current = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  const actions = useMemo(
    () => ({
      signUp: async (email, password, fullName) => {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        return { data, error };
      },

      signIn: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        return { data, error };
      },

      signInWithMagicLink: async (email) => {
        const { data, error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: window.location.origin },
        });
        return { data, error };
      },

      signOut: async () => {
        const { error } = await supabase.auth.signOut();
        return { error };
      },

      resetPassword: async (email) => {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        return { data, error };
      },

      updatePassword: async (newPassword) => {
        const { data, error } = await supabase.auth.updateUser({ password: newPassword });
        return { data, error };
      },

      updateProfile: async (updates) => {
        if (!user) return { data: null, error: new Error("No user logged in") };

        const { data, error } = await supabase
          .from("user_profiles")
          .update(updates)
          .eq("id", user.id)
          .select("*")
          .single();

        if (!error) setProfile(data);
        return { data, error };
      },
    }),
    [user]
  );

  const value = useMemo(
    () => ({
      user,
      session,
      profile,
      loading,
      isAuthenticated: !!user,
      isLoaded: !loading,
      ...actions,
    }),
    [user, session, profile, loading, actions]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
export default AuthContext;