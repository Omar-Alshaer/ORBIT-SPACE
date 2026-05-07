"use client";

import { motion } from "framer-motion";
import { OrbitLogo } from "@/components/brand/OrbitLogo";
import { MascotFloat } from "@/components/landing/MascotFloat";
import { mascots } from "@/lib/brand";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};

export function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden text-orbit-coal dark:text-orbit-text">
      <section className="relative flex min-h-screen items-center px-5 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-10 py-8 sm:gap-12 lg:grid-cols-[1fr_0.86fr] lg:py-0">
          <motion.div
            animate="visible"
            className="relative z-10 max-w-3xl"
            initial="hidden"
            transition={{ staggerChildren: 0.12 }}
          >
            <motion.header
              className="mb-10 flex items-center justify-between gap-6 sm:mb-16"
              variants={fadeUp}
            >
              <OrbitLogo className="text-xl [&>span:first-child]:text-orbit-coal dark:[&>span:first-child]:text-white sm:text-2xl" />
              <span className="hidden text-sm font-bold text-orbit-coal/52 dark:text-white/52 sm:inline">
                Health-focused productivity
              </span>
            </motion.header>

            <motion.h1
              className="max-w-[21rem] text-4xl font-black leading-[1.02] text-orbit-coal dark:text-white sm:max-w-4xl sm:text-6xl sm:leading-[0.98] lg:text-8xl"
              variants={fadeUp}
            >
              <span className="block sm:inline">Stay in your orbit.</span>{" "}
              <span className="block sm:inline">Keep progressing.</span>
            </motion.h1>

            <motion.p
              className="mt-7 max-w-[21rem] text-base font-medium leading-8 text-orbit-coal/72 dark:text-white/78 sm:max-w-2xl sm:text-lg"
              variants={fadeUp}
            >
              Build healthier days with missions, focus sessions, proof-based
              challenges, HP, streaks, and small groups that keep momentum
              moving.
            </motion.p>

            <motion.div
              className="mt-10 flex max-w-[21rem] flex-col gap-3 sm:max-w-none sm:flex-row"
              variants={fadeUp}
            >
              <a
                className="inline-flex h-12 items-center justify-center rounded-full bg-gradient-to-r from-orbit-orange to-orbit-amber px-7 text-sm font-extrabold text-orbit-coal shadow-orbit transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_28px_90px_rgba(255,122,0,0.25)] focus:outline-none focus:ring-2 focus:ring-orbit-amber focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-orbit-ink"
                href="/register"
              >
                Start your orbit
              </a>
              <a
                className="inline-flex h-12 items-center justify-center rounded-full border border-black/10 bg-white/76 px-7 text-sm font-bold text-orbit-coal/82 backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:bg-white dark:border-white/18 dark:bg-white/[0.09] dark:text-white dark:hover:border-white/28 dark:hover:bg-white/[0.13]"
                href="/login"
              >
                Sign in
              </a>
            </motion.div>

            <motion.div
              className="mt-8 grid max-w-xl gap-2 sm:grid-cols-3"
              variants={fadeUp}
            >
              {["Daily missions", "Proof uploads", "HP streaks"].map((item) => (
                <div
                  className="rounded-lg border border-black/10 bg-white/70 px-3 py-2 text-sm font-black text-orbit-coal/68 backdrop-blur dark:border-white/12 dark:bg-white/[0.10] dark:text-white/82"
                  key={item}
                >
                  {item}
                </div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative mx-auto aspect-square w-full max-w-[360px] sm:max-w-[480px] lg:max-w-[560px]"
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="absolute inset-6 animate-orbit rounded-full border border-dashed border-orange-400/28 dark:border-orange-300/22" />
            <div className="absolute inset-20 rounded-full bg-white/40 blur-sm dark:bg-white/[0.03]" />
            <MascotFloat
              alt={mascots[0].alt}
              className="absolute left-1/2 top-1/2 w-[68%] -translate-x-1/2 -translate-y-1/2 [animation-delay:0.2s]"
              priority
              src={mascots[0].src}
            />
            <MascotFloat
              alt={mascots[2].alt}
              className="absolute -left-2 top-[8%] w-[29%] [animation-delay:1.1s]"
              priority
              src={mascots[2].src}
            />
            <MascotFloat
              alt={mascots[4].alt}
              className="absolute bottom-[8%] right-0 w-[27%] [animation-delay:1.8s]"
              priority
              src={mascots[4].src}
            />
          </motion.div>
        </div>
      </section>

      <section
        className="relative px-5 pb-24 sm:px-8 lg:px-12"
        id="missions"
      >
        <motion.div
          className="mx-auto grid max-w-7xl items-center gap-10 border-y border-black/10 py-16 dark:border-white/10 md:grid-cols-[0.82fr_1fr]"
          initial={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          viewport={{ once: true, amount: 0.25 }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <div className="relative min-h-[320px]">
            <MascotFloat
              alt={mascots[6].alt}
              className="absolute left-[8%] top-0 w-48 sm:w-60 [animation-delay:0.4s]"
              src={mascots[6].src}
            />
            <MascotFloat
              alt={mascots[8].alt}
              className="absolute bottom-0 right-[8%] w-40 sm:w-52 [animation-delay:1.4s]"
              src={mascots[8].src}
            />
          </div>

          <div className="max-w-2xl">
            <h2 className="text-3xl font-black leading-tight text-orbit-coal dark:text-white sm:text-5xl">
              Daily missions that feel alive, not heavy.
            </h2>
            <p className="mt-5 text-base font-medium leading-8 text-orbit-coal/68 dark:text-white/72">
              Hydration, sleep, movement, and focus become lightweight missions.
              Upload proof, earn HP, and keep your streak in motion with the
              ORBIT crew around you.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {["Hydration", "Focus", "Movement"].map((item) => (
                <div
                  className="rounded-lg border border-black/10 bg-white/70 px-4 py-3 text-sm font-bold text-orbit-coal/72 backdrop-blur dark:border-white/10 dark:bg-white/[0.035] dark:text-white/78"
                  key={item}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      <section className="px-5 pb-28 sm:px-8 lg:px-12" id="flow">
        <motion.div
          className="mx-auto grid max-w-7xl gap-8 md:grid-cols-3"
          initial={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          viewport={{ once: true, amount: 0.25 }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          {[
            ["01", "Track", mascots[1].src, mascots[1].alt],
            ["02", "Prove", mascots[5].src, mascots[5].alt],
            ["03", "Level up", mascots[9].src, mascots[9].alt],
          ].map(([step, title, src, alt]) => (
            <article
              className="relative min-h-[320px] overflow-hidden rounded-lg border border-black/10 bg-white/72 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.035]"
              key={step}
            >
              <div className="flex items-center justify-between text-sm font-extrabold text-orbit-coal/50 dark:text-white/50">
                <span>{step}</span>
                <span>{title}</span>
              </div>
              <MascotFloat
                alt={alt}
                className="absolute bottom-[-26px] left-1/2 w-64 -translate-x-1/2"
                src={src}
              />
            </article>
          ))}
        </motion.div>
      </section>
    </main>
  );
}
