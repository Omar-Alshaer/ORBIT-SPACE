"use client";

import {
  onAuthStateChanged,
  signOut,
  type User,
} from "firebase/auth";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { auth } from "@/lib/firebase";
import { orbitApi } from "@/lib/orbit-api";
import type { UserProfile } from "@/lib/user-profile";

type ServerUser = {
  email?: string;
  name?: string;
  picture?: string;
  uid: string;
};

type ServerAuthStatus = "idle" | "checking" | "authenticated" | "error";
type ProfileStatus = "idle" | "loading" | "ready" | "error";

type AuthContextValue = {
  isLoading: boolean;
  logout: () => Promise<void>;
  profile: UserProfile | null;
  profileError: string;
  profileStatus: ProfileStatus;
  refreshServerSession: () => Promise<void>;
  serverAuthError: string;
  serverAuthStatus: ServerAuthStatus;
  serverUser: ServerUser | null;
  user: User | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [serverUser, setServerUser] = useState<ServerUser | null>(null);
  const [serverAuthError, setServerAuthError] = useState("");
  const [serverAuthStatus, setServerAuthStatus] =
    useState<ServerAuthStatus>("idle");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileError, setProfileError] = useState("");
  const [profileStatus, setProfileStatus] = useState<ProfileStatus>("idle");

  const refreshServerSession = useCallback(async () => {
    setServerAuthError("");

    if (!auth.currentUser) {
      setServerUser(null);
      setServerAuthStatus("idle");
      return;
    }

    setServerAuthStatus("checking");
    setProfileStatus("loading");

    try {
      const [payload, profilePayload] = await Promise.all([
        orbitApi<{ user: ServerUser }>("/api/auth/me", {
          withAuth: true,
        }),
        orbitApi<{ profile: UserProfile }>("/api/users/me", {
          withAuth: true,
        }),
      ]);

      setServerUser(payload.user);
      setServerAuthStatus("authenticated");
      setProfile(profilePayload.profile);
      setProfileError("");
      setProfileStatus("ready");
    } catch (error) {
      setServerUser(null);
      setServerAuthStatus("error");
      setServerAuthError(
        error instanceof Error
          ? error.message
          : "We could not refresh your account right now.",
      );
      setProfile(null);
      setProfileStatus("error");
      setProfileError(
        error instanceof Error
          ? error.message
          : "We could not load your progress right now.",
      );
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setIsLoading(false);

      if (!nextUser) {
        setServerUser(null);
        setServerAuthError("");
        setServerAuthStatus("idle");
        setProfile(null);
        setProfileError("");
        setProfileStatus("idle");
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    void refreshServerSession();
  }, [refreshServerSession, user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoading,
      logout: async () => {
        setServerUser(null);
        setServerAuthError("");
        setServerAuthStatus("idle");
        setProfile(null);
        setProfileError("");
        setProfileStatus("idle");
        await signOut(auth);
      },
      profile,
      profileError,
      profileStatus,
      refreshServerSession,
      serverAuthError,
      serverAuthStatus,
      serverUser,
      user,
    }),
    [
      isLoading,
      profile,
      profileError,
      profileStatus,
      refreshServerSession,
      serverAuthError,
      serverAuthStatus,
      serverUser,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return value;
}
