import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, ShieldCheck, Sparkles } from "lucide-react";
import { OrbitLogo } from "@/components/brand/OrbitLogo";

type AuthShellProps = {
  children: ReactNode;
  eyebrow: string;
  mascot: string;
  title: string;
};

export function AuthShell({ children, eyebrow, mascot, title }: AuthShellProps) {
  return (
    <main className="min-h-screen overflow-hidden px-4 py-5 text-orbit-coal dark:text-orbit-text sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-2.5rem)] w-full max-w-7xl overflow-hidden rounded-lg border border-black/10 bg-white/78 shadow-[0_28px_90px_rgba(15,23,42,0.10)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#0F141D]/84 dark:shadow-none lg:grid-cols-[1fr_0.92fr]">
        <section className="relative hidden min-h-full overflow-hidden border-r border-black/10 p-8 dark:border-white/10 lg:block">
          <Link
            aria-label="Back to landing page"
            className="inline-flex items-center gap-3 text-sm font-black text-orbit-coal/62 transition hover:text-orbit-coal dark:text-white/62 dark:hover:text-white"
            href="/"
          >
            <ArrowLeft aria-hidden size={18} />
            Back
          </Link>

          <div className="mt-12 max-w-xl">
            <OrbitLogo className="text-2xl [&>span:first-child]:text-orbit-coal dark:[&>span:first-child]:text-white" />
            <p className="mt-10 text-sm font-black uppercase text-orbit-orange">
              {eyebrow}
            </p>
            <h1 className="mt-4 text-6xl font-black leading-[0.95] text-orbit-coal dark:text-white">
              {title}
            </h1>
            <p className="mt-6 max-w-md text-sm leading-7 text-orbit-coal/62 dark:text-white/62">
              ORBIT keeps sign-in calm and focused: protect your progress and
              return to the daily health loop without friction.
            </p>
          </div>

          <div className="absolute bottom-8 left-8 right-8 grid grid-cols-[1fr_220px] items-end gap-8 rounded-lg border border-orange-300/20 bg-gradient-to-br from-orange-500/14 via-white/26 to-sky-400/10 p-5 dark:via-white/[0.025]">
            <div>
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-orbit-orange to-orbit-amber text-white">
                <ShieldCheck aria-hidden size={21} />
              </div>
              <p className="text-lg font-black text-orbit-coal dark:text-white">
                Secure by design.
              </p>
              <p className="mt-2 text-sm leading-6 text-orbit-coal/58 dark:text-white/58">
                Your progress stays connected to your account, so every small
                win is waiting when you come back.
              </p>
            </div>
            <div className="relative h-56">
              <div className="absolute inset-6 rounded-full border border-dashed border-orbit-orange/28" />
              <Image
                alt="ORBIT authentication mascot"
                className="absolute bottom-0 right-0 h-56 w-56 object-contain drop-shadow-2xl"
                height={280}
                priority
                src={mascot}
                width={280}
              />
            </div>
          </div>
        </section>

        <section className="relative flex min-h-full min-w-0 items-center justify-center overflow-hidden px-5 py-8 sm:px-8">
          <div className="absolute right-6 top-6 hidden items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-2 text-xs font-black text-orbit-coal/58 backdrop-blur dark:border-white/10 dark:bg-white/[0.06] dark:text-white/58 sm:flex">
            <Sparkles aria-hidden className="text-orbit-orange" size={15} />
            Welcome flow
          </div>

          <div className="w-full min-w-0 max-w-[280px] sm:max-w-md">
            <div className="mb-8 flex items-center justify-between gap-4 lg:hidden">
              <Link aria-label="Go to ORBIT landing page" href="/">
                <OrbitLogo className="text-xl [&>span:first-child]:text-orbit-coal dark:[&>span:first-child]:text-white" />
              </Link>
              <Link
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white/70 text-orbit-coal dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
                href="/"
              >
                <ArrowLeft aria-hidden size={18} />
              </Link>
            </div>
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
