"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { OrbitLogo } from "@/components/brand/OrbitLogo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { appRoutes } from "@/lib/navigation";

type AppShellProps = {
  children: ReactNode;
};

type UserAvatarProps = {
  avatarUrl?: string | null;
  className?: string;
  initials: string;
};

function UserAvatar({ avatarUrl, className = "", initials }: UserAvatarProps) {
  if (avatarUrl) {
    return (
      <span
        aria-hidden
        className={`inline-flex shrink-0 rounded-full bg-cover bg-center ${className}`}
        style={{ backgroundImage: `url(${avatarUrl})` }}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-orbit-orange/14 text-sm font-black text-orbit-orange ${className}`}
    >
      {initials || "O"}
    </span>
  );
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    isLoading,
    logout,
    profile,
    serverUser,
    user,
  } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const activeRoute =
    appRoutes.find((route) => pathname.startsWith(route.href)) ?? appRoutes[0];
  const ActiveIcon = activeRoute.icon;
  const displayName =
    serverUser?.name ||
    profile?.displayName ||
    user?.displayName ||
    serverUser?.email ||
    profile?.email ||
    user?.email ||
    "ORBIT user";
  const avatarUrl = profile?.photoURL || serverUser?.picture || user?.photoURL;
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, router, user]);

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  if (isLoading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 text-orbit-coal dark:text-orbit-text">
        <div className="relative w-full max-w-sm overflow-hidden rounded-lg border border-black/10 bg-white/88 px-6 py-6 text-center shadow-[0_24px_80px_rgba(15,23,42,0.14)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#0F141D]/88">
          <div className="absolute inset-x-10 top-0 h-20 rounded-full bg-orange-400/15 blur-2xl" />
          <div className="relative">
            <OrbitLogo className="justify-center text-2xl [&>span:first-child]:text-orbit-coal dark:[&>span:first-child]:text-white" />
            <div className="mx-auto mt-6 h-2 w-40 overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/[0.08]">
              <motion.div
                animate={{ x: ["-70%", "170%"] }}
                className="h-full w-16 rounded-full bg-orbit-orange"
                transition={{ duration: 1.2, ease: "easeInOut", repeat: Infinity }}
              />
            </div>
            <p className="mt-4 text-sm font-bold text-orbit-coal/58 dark:text-white/58">
              Preparing your day...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden px-2 py-2 text-orbit-coal dark:text-orbit-text sm:px-4 lg:px-5">
      <div className="mx-auto flex min-h-[calc(100vh-1rem)] w-full max-w-[1580px] gap-3 pb-20 lg:pb-0">
        <aside
          className={`relative hidden shrink-0 overflow-visible rounded-lg border border-black/10 bg-white/88 shadow-[0_20px_65px_rgba(15,23,42,0.08)] backdrop-blur-2xl transition-[width] duration-300 dark:border-white/10 dark:bg-[#0F141D]/88 lg:flex lg:flex-col ${
            isSidebarOpen ? "w-[244px] p-3" : "w-[72px] p-2"
          }`}
        >
          <button
            aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            className="absolute -right-3 top-6 z-20 inline-flex h-8 w-8 items-center justify-center rounded-full border border-black/10 bg-white text-orbit-coal shadow-[0_10px_28px_rgba(15,23,42,0.16)] transition hover:-translate-y-0.5 hover:border-orange-300 hover:text-orbit-orange dark:border-white/10 dark:bg-[#101620] dark:text-white dark:hover:border-orange-400/50 dark:hover:text-orbit-orange"
            onClick={() => setIsSidebarOpen((current) => !current)}
            type="button"
          >
            {isSidebarOpen ? (
              <ChevronLeft aria-hidden size={16} />
            ) : (
              <ChevronRight aria-hidden size={16} />
            )}
          </button>

          <Link
            aria-label="Go to ORBIT landing page"
            className={`mb-5 flex h-12 items-center rounded-lg transition ${
              isSidebarOpen
                ? "justify-start px-2"
                : "justify-center bg-black/[0.035] dark:bg-white/[0.055]"
            }`}
            href="/"
          >
            {isSidebarOpen ? (
              <OrbitLogo className="text-xl [&>span:first-child]:text-orbit-coal dark:[&>span:first-child]:text-white" />
            ) : (
              <span className="text-2xl font-black tracking-normal text-orbit-orange">
                O
              </span>
            )}
          </Link>

          {isSidebarOpen ? (
            <div className="mb-4 rounded-lg border border-orange-300/20 bg-gradient-to-br from-orange-500/12 via-white/45 to-sky-400/10 p-3 dark:via-white/[0.02]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase text-orbit-orange">
                    Momentum
                  </p>
                  <p className="mt-1 text-2xl font-black leading-none text-orbit-coal dark:text-white">
                    {profile?.hp?.toLocaleString() ?? 0} HP
                  </p>
                </div>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-orbit-orange/12 text-orbit-orange">
                  <Sparkles aria-hidden size={19} />
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-md bg-white/62 px-2.5 py-2 dark:bg-white/[0.055]">
                  <p className="font-black text-orbit-coal dark:text-white">
                    {profile?.streak ?? 0}
                  </p>
                  <p className="mt-0.5 font-bold text-orbit-coal/48 dark:text-white/48">
                    Streak
                  </p>
                </div>
                <div className="rounded-md bg-white/62 px-2.5 py-2 dark:bg-white/[0.055]">
                  <p className="font-black text-orbit-coal dark:text-white">
                    {profile?.badges?.length ?? 0}
                  </p>
                  <p className="mt-0.5 font-bold text-orbit-coal/48 dark:text-white/48">
                    Badges
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <nav
            aria-label="Primary navigation"
            className={`space-y-1 ${isSidebarOpen ? "" : "mt-2"}`}
          >
            {appRoutes.map((route) => {
              const Icon = route.icon;
              const isActive = pathname.startsWith(route.href);

              return (
                <Link
                  className={`group relative flex h-11 items-center rounded-lg text-sm font-bold transition ${
                    isActive
                      ? "bg-orbit-coal text-white shadow-[0_16px_38px_rgba(13,17,23,0.14)] dark:bg-white dark:text-orbit-coal"
                      : "text-orbit-coal/58 hover:bg-black/[0.045] hover:text-orbit-coal dark:text-white/58 dark:hover:bg-white/[0.07] dark:hover:text-white"
                  } ${isSidebarOpen ? "gap-3 px-3" : "justify-center"}`}
                  href={route.href}
                  key={route.href}
                  title={route.label}
                >
                  {isActive && !isSidebarOpen ? (
                    <span className="absolute left-0 h-5 w-1 rounded-full bg-orbit-orange" />
                  ) : null}
                  <Icon aria-hidden size={18} strokeWidth={2.2} />
                  {isSidebarOpen ? (
                    <>
                      <span>{route.label}</span>
                      <ChevronRight
                        aria-hidden
                        className={`ml-auto transition ${
                          isActive
                            ? "opacity-100"
                            : "opacity-0 group-hover:opacity-45"
                        }`}
                        size={16}
                      />
                    </>
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div
            className={`mt-auto rounded-lg border border-black/10 bg-white/62 dark:border-white/10 dark:bg-white/[0.045] ${
              isSidebarOpen ? "p-3" : "p-2"
            }`}
          >
            {isSidebarOpen ? (
              <div className="mb-3 flex items-center gap-3 rounded-lg bg-black/[0.04] px-3 py-3 dark:bg-white/[0.055]">
                <UserAvatar
                  avatarUrl={avatarUrl}
                  className="h-10 w-10"
                  initials={initials}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-orbit-coal dark:text-white">
                    {displayName}
                  </p>
                  <p className="mt-0.5 truncate text-xs font-bold text-orbit-coal/45 dark:text-white/45">
                    {profile?.username ? `@${profile.username}` : "Keep moving"}
                  </p>
                </div>
              </div>
            ) : null}

            {isSidebarOpen ? (
              <div className="relative mb-2 h-16">
                <Image
                  alt="ORBIT mascot keeping the app alive"
                  className="absolute bottom-0 right-2 h-20 w-20 object-contain drop-shadow-xl"
                  height={220}
                  src="/assets/Mascots/mas4.svg"
                  width={220}
                />
              </div>
            ) : (
              <div className="mb-2 flex justify-center">
                <UserAvatar
                  avatarUrl={avatarUrl}
                  className="h-10 w-10"
                  initials={initials}
                />
              </div>
            )}
            <button
              className="mt-2 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-black/10 bg-white/70 text-sm font-black text-orbit-coal transition hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-white/[0.07] dark:text-white dark:hover:bg-white/[0.1]"
              onClick={handleLogout}
              type="button"
              title="Sign out"
            >
              <LogOut aria-hidden size={16} />
              {isSidebarOpen ? "Sign out" : null}
            </button>
          </div>
        </aside>

        <section className="min-w-0 flex-1 overflow-hidden rounded-lg border border-black/10 bg-white/88 shadow-[0_20px_65px_rgba(15,23,42,0.07)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#0F141D]/88 dark:shadow-none">
          <header className="border-b border-black/10 px-4 py-3 dark:border-white/10 sm:px-5">
            <div className="mb-4 flex items-center justify-between gap-3 lg:hidden">
              <Link aria-label="Go to ORBIT landing page" href="/">
                <OrbitLogo className="text-lg [&>span:first-child]:text-orbit-coal dark:[&>span:first-child]:text-white" />
              </Link>
              <ThemeToggle />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-orbit-orange to-orbit-amber text-white shadow-orbit sm:flex">
                  <ActiveIcon aria-hidden size={21} strokeWidth={2.4} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-extrabold uppercase text-orbit-orange">
                    {activeRoute.label}
                  </p>
                  <h1 className="mt-1 text-lg font-black leading-tight text-orbit-coal dark:text-white sm:text-xl">
                    {activeRoute.description}
                  </h1>
                </div>
              </div>

              <div className="hidden items-center gap-2 lg:flex">
                <button
                  aria-label="Notifications"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white/70 text-orbit-coal shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/[0.1]"
                  type="button"
                >
                  <Bell aria-hidden size={18} />
                </button>
                <button
                  aria-label="Sign out"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white/70 text-orbit-coal shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/[0.1]"
                  onClick={handleLogout}
                  type="button"
                >
                  <LogOut aria-hidden size={18} />
                </button>
                <ThemeToggle />
              </div>
            </div>
          </header>

          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="px-3 py-3 sm:px-4 lg:px-5 xl:px-6"
            initial={false}
            key={pathname}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            {children}
          </motion.div>
        </section>
      </div>

      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-6 rounded-lg border border-black/10 bg-white/90 p-1 shadow-[0_18px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl dark:border-white/10 dark:bg-orbit-ink lg:hidden"
      >
        {appRoutes.map((route) => {
          const Icon = route.icon;
          const isActive = pathname.startsWith(route.href);

          return (
            <Link
              aria-label={route.label}
              className={`flex h-12 items-center justify-center rounded-md transition ${
                isActive
                  ? "bg-orbit-orange text-white"
                  : "text-orbit-coal/56 hover:bg-black/[0.045] dark:text-white/55 dark:hover:bg-white/[0.07]"
              }`}
              href={route.href}
              key={route.href}
            >
              <Icon aria-hidden size={19} strokeWidth={2.3} />
            </Link>
          );
        })}
      </nav>
    </main>
  );
}
