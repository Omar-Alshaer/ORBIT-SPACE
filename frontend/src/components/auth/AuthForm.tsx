"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { useAuth } from "@/components/auth/AuthProvider";
import { auth, googleProvider } from "@/lib/firebase";

type AuthMode = "login" | "register";

type AuthFormProps = {
  mode: AuthMode;
};

const content = {
  login: {
    action: "Sign in",
    helper: "New around here?",
    switchHref: "/register",
    switchLabel: "Create an account",
    title: "Welcome back.",
  },
  register: {
    action: "Create account",
    helper: "Already have progress?",
    switchHref: "/login",
    switchLabel: "Sign in",
    title: "Start your orbit.",
  },
} as const;

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const { isLoading: isAuthLoading, user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const copy = content[mode];

  useEffect(() => {
    if (!isAuthLoading && user) {
      router.replace("/dashboard");
    }
  }, [isAuthLoading, router, user]);

  const passwordScore = useMemo(() => {
    if (!password) {
      return 0;
    }

    const lengthScore = password.length >= 8 ? 1 : 0;
    const numberScore = /\d/.test(password) ? 1 : 0;
    const letterScore = /[a-zA-Z]/.test(password) ? 1 : 0;
    return lengthScore + numberScore + letterScore;
  }, [password]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsLoading(true);

    try {
      if (mode === "register") {
        const credential = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );

        if (name.trim()) {
          await updateProfile(credential.user, {
            displayName: name.trim(),
          });
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }

      setMessage("Signed in successfully. Redirecting to your dashboard.");
      router.push("/dashboard");
    } catch (authError) {
      setError(getAuthErrorMessage(authError));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setError("");
    setMessage("");
    setIsLoading(true);

    try {
      await signInWithPopup(auth, googleProvider);
      setMessage("Signed in successfully. Redirecting to your dashboard.");
      router.push("/dashboard");
    } catch (authError) {
      setError(getAuthErrorMessage(authError));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full min-w-0 max-w-[280px] overflow-hidden rounded-lg border border-black/10 bg-white/76 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.055] sm:max-w-md sm:p-6">
      <div className="mb-7">
        <p className="text-sm font-black uppercase text-orbit-orange">
          {mode === "login" ? "Sign in" : "Join ORBIT"}
        </p>
        <h2 className="mt-2 text-4xl font-black leading-tight text-orbit-coal dark:text-white">
          {copy.title}
        </h2>
        <p className="mt-3 text-sm leading-6 text-orbit-coal/58 dark:text-white/58">
          {mode === "login"
            ? "Continue your missions, streaks, focus sessions, and community accountability."
            : "Create your account and start saving HP, streaks, missions, and proof history."}
        </p>
      </div>

      <button
        className="flex h-12 w-full min-w-0 items-center justify-center gap-3 rounded-lg border border-black/10 bg-white px-3 text-sm font-black text-orbit-coal transition hover:-translate-y-0.5 hover:shadow-[0_12px_35px_rgba(15,23,42,0.10)] disabled:cursor-not-allowed disabled:opacity-65 dark:border-white/10 dark:bg-white/[0.07] dark:text-white dark:hover:bg-white/[0.1]"
        disabled={isLoading}
        onClick={handleGoogleLogin}
        type="button"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-sm font-black text-orbit-orange">
          G
        </span>
        Continue with Google
      </button>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-black/10 dark:bg-white/10" />
        <span className="text-xs font-black uppercase text-orbit-coal/40 dark:text-white/40">
          or email
        </span>
        <span className="h-px flex-1 bg-black/10 dark:bg-white/10" />
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {mode === "register" ? (
          <label className="block">
            <span className="mb-2 block text-sm font-black text-orbit-coal dark:text-white">
              Display name
            </span>
            <span className="relative block min-w-0">
              <UserRound
                aria-hidden
                className="absolute left-4 top-1/2 -translate-y-1/2 text-orbit-coal/35 dark:text-white/35"
                size={18}
              />
              <input
                className="h-12 w-full rounded-lg border border-black/10 bg-white/70 pl-12 pr-4 text-sm font-bold text-orbit-coal outline-none transition placeholder:text-orbit-coal/35 focus:border-orbit-orange focus:ring-4 focus:ring-orange-500/12 disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.055] dark:text-white dark:placeholder:text-white/32"
                disabled={isLoading}
                onChange={(event) => setName(event.target.value)}
                placeholder="Mora Orbit"
                value={name}
              />
            </span>
          </label>
        ) : null}

        <label className="block">
          <span className="mb-2 block text-sm font-black text-orbit-coal dark:text-white">
            Email
          </span>
          <span className="relative block min-w-0">
            <Mail
              aria-hidden
              className="absolute left-4 top-1/2 -translate-y-1/2 text-orbit-coal/35 dark:text-white/35"
              size={18}
            />
            <input
              className="h-12 w-full rounded-lg border border-black/10 bg-white/70 pl-12 pr-4 text-sm font-bold text-orbit-coal outline-none transition placeholder:text-orbit-coal/35 focus:border-orbit-orange focus:ring-4 focus:ring-orange-500/12 disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.055] dark:text-white dark:placeholder:text-white/32"
              disabled={isLoading}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@orbit.app"
              type="email"
              value={email}
            />
          </span>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-black text-orbit-coal dark:text-white">
            Password
          </span>
          <span className="relative block min-w-0">
            <LockKeyhole
              aria-hidden
              className="absolute left-4 top-1/2 -translate-y-1/2 text-orbit-coal/35 dark:text-white/35"
              size={18}
            />
            <input
              className="h-12 w-full rounded-lg border border-black/10 bg-white/70 pl-12 pr-12 text-sm font-bold text-orbit-coal outline-none transition placeholder:text-orbit-coal/35 focus:border-orbit-orange focus:ring-4 focus:ring-orange-500/12 disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.055] dark:text-white dark:placeholder:text-white/32"
              disabled={isLoading}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Minimum 8 characters"
              type={showPassword ? "text" : "password"}
              value={password}
            />
            <button
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-orbit-coal/45 transition hover:bg-black/[0.045] hover:text-orbit-coal dark:text-white/45 dark:hover:bg-white/[0.07] dark:hover:text-white"
              onClick={() => setShowPassword((value) => !value)}
              type="button"
            >
              {showPassword ? (
                <EyeOff aria-hidden size={17} />
              ) : (
                <Eye aria-hidden size={17} />
              )}
            </button>
          </span>
        </label>

        {mode === "register" ? (
          <div>
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map((item) => (
                <span
                  className={`h-1.5 rounded-full ${
                    passwordScore > item
                      ? "bg-gradient-to-r from-orbit-orange to-orbit-amber"
                      : "bg-black/10 dark:bg-white/10"
                  }`}
                  key={item}
                />
              ))}
            </div>
            <p className="mt-2 text-xs font-bold text-orbit-coal/45 dark:text-white/45">
              Use 8+ characters with letters and numbers.
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4">
            <label className="flex items-center gap-2 text-sm font-bold text-orbit-coal/62 dark:text-white/62">
              <input
                className="h-4 w-4 accent-orbit-orange"
                disabled={isLoading}
                type="checkbox"
              />
              Remember me
            </label>
            <button
              className="text-sm font-black text-orbit-orange"
              disabled={isLoading}
              type="button"
            >
              Forgot?
            </button>
          </div>
        )}

        <button
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-orbit-orange to-orbit-amber px-5 text-sm font-black text-orbit-coal shadow-orbit transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isLoading}
          type="submit"
        >
          {isLoading ? "Working..." : copy.action}
          <ArrowRight aria-hidden size={17} />
        </button>
      </form>

      {error ? (
        <div className="mt-4 rounded-lg border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-700 dark:text-red-200">
          {error}
        </div>
      ) : null}

      {message ? (
        <div className="mt-4 rounded-lg border border-orbit-orange/25 bg-orange-500/10 px-4 py-3 text-sm font-bold text-orbit-coal dark:text-white">
          {message}
        </div>
      ) : null}

      <p className="mt-6 text-center text-sm font-bold text-orbit-coal/58 dark:text-white/58">
        {copy.helper}{" "}
        <Link className="font-black text-orbit-orange" href={copy.switchHref}>
          {copy.switchLabel}
        </Link>
      </p>
    </div>
  );
}

function getAuthErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    switch (error.code) {
      case "auth/email-already-in-use":
        return "This email is already registered. Try signing in instead.";
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "Email or password is not correct.";
      case "auth/popup-closed-by-user":
        return "The sign-in popup was closed before finishing.";
      case "auth/weak-password":
        return "Use a stronger password with at least 6 characters.";
      case "auth/operation-not-allowed":
        return "This sign-in option is not available yet.";
      default:
        return "Authentication failed. Please try again.";
    }
  }

  return "Authentication failed. Please try again.";
}
