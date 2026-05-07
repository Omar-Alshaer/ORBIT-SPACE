"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Coffee,
  Flame,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  Settings2,
  Sparkles,
  Star,
  Timer,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { orbitApi } from "@/lib/orbit-api";

type FocusPlan = {
  accent: string;
  bestFor: string;
  breakMinutes: number;
  focusLevel: 1 | 2 | 3 | 4 | 5;
  hp: number;
  id:
    | "classic"
    | "deep"
    | "sprint"
    | "exam"
    | "hardcore"
    | "light"
    | "revision"
    | "custom";
  longBreakAfter: number | null;
  longBreakMinutes: number | null;
  name: string;
  workMinutes: number;
};

type FocusPhase = "work" | "break" | "longBreak";

type FocusSession = {
  completedAt: string;
  dateKey: string;
  hp: number;
  id: string;
  minutes: number;
  note: string;
  planId: string;
  planName: string;
};

type FocusSummary = {
  dateKey: string;
  earnedHpToday: number;
  sessions: FocusSession[];
  totalMinutes: number;
};

const presetPlans: FocusPlan[] = [
  {
    accent: "from-orbit-orange to-orbit-amber",
    bestFor: "Daily study",
    breakMinutes: 5,
    focusLevel: 3,
    hp: 35,
    id: "classic",
    longBreakAfter: 4,
    longBreakMinutes: 20,
    name: "Classic",
    workMinutes: 25,
  },
  {
    accent: "from-sky-400 to-cyan-300",
    bestFor: "Heavy topics",
    breakMinutes: 10,
    focusLevel: 4,
    hp: 70,
    id: "deep",
    longBreakAfter: 3,
    longBreakMinutes: 25,
    name: "Deep Focus",
    workMinutes: 50,
  },
  {
    accent: "from-violet-400 to-fuchsia-300",
    bestFor: "Low energy",
    breakMinutes: 5,
    focusLevel: 2,
    hp: 20,
    id: "sprint",
    longBreakAfter: null,
    longBreakMinutes: null,
    name: "Study Sprint",
    workMinutes: 15,
  },
  {
    accent: "from-rose-400 to-orange-300",
    bestFor: "Exam review",
    breakMinutes: 5,
    focusLevel: 4,
    hp: 55,
    id: "exam",
    longBreakAfter: 5,
    longBreakMinutes: 30,
    name: "Exam Mode",
    workMinutes: 40,
  },
  {
    accent: "from-red-500 to-amber-300",
    bestFor: "Big projects",
    breakMinutes: 15,
    focusLevel: 5,
    hp: 110,
    id: "hardcore",
    longBreakAfter: 2,
    longBreakMinutes: 30,
    name: "Hardcore",
    workMinutes: 90,
  },
  {
    accent: "from-emerald-400 to-lime-300",
    bestFor: "Tired days",
    breakMinutes: 10,
    focusLevel: 1,
    hp: 25,
    id: "light",
    longBreakAfter: null,
    longBreakMinutes: null,
    name: "Light",
    workMinutes: 20,
  },
  {
    accent: "from-indigo-400 to-sky-300",
    bestFor: "Smart recap",
    breakMinutes: 5,
    focusLevel: 3,
    hp: 40,
    id: "revision",
    longBreakAfter: null,
    longBreakMinutes: null,
    name: "Revision",
    workMinutes: 30,
  },
];

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");

  return `${minutes}:${seconds}`;
}

function formatClock(value: string) {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function getPhaseMinutes(plan: FocusPlan, phase: FocusPhase) {
  if (phase === "work") {
    return plan.workMinutes;
  }

  if (phase === "longBreak") {
    return plan.longBreakMinutes ?? plan.breakMinutes;
  }

  return plan.breakMinutes;
}

function getPhaseLabel(phase: FocusPhase) {
  if (phase === "work") {
    return "Focus time";
  }

  if (phase === "longBreak") {
    return "Long break";
  }

  return "Short break";
}

function getRecommendedPlanId(summary: FocusSummary | null) {
  const hour = new Date().getHours();
  const sessions = summary?.sessions ?? [];
  const totalMinutes = summary?.totalMinutes ?? 0;

  if (!sessions.length && hour < 12) {
    return "classic";
  }

  if (hour >= 20 || totalMinutes >= 120) {
    return "light";
  }

  if (!sessions.length) {
    return "sprint";
  }

  if (totalMinutes >= 60) {
    return "revision";
  }

  return "deep";
}

function clampMinutes(value: number, fallback: number) {
  if (Number.isNaN(value)) {
    return fallback;
  }

  return Math.max(1, Math.min(180, Math.round(value)));
}

export function FocusWorkspace() {
  const { refreshServerSession, serverAuthStatus } = useAuth();
  const [customPlan, setCustomPlan] = useState<FocusPlan>({
    accent: "from-orbit-orange to-orbit-amber",
    bestFor: "Your rhythm",
    breakMinutes: 5,
    focusLevel: 3,
    hp: 30,
    id: "custom",
    longBreakAfter: 4,
    longBreakMinutes: 20,
    name: "Custom",
    workMinutes: 25,
  });
  const allPlans = useMemo(() => [...presetPlans, customPlan], [customPlan]);
  const [activePlanId, setActivePlanId] =
    useState<FocusPlan["id"]>("classic");
  const activePlan = useMemo(
    () => allPlans.find((plan) => plan.id === activePlanId) ?? allPlans[0],
    [activePlanId, allPlans],
  );
  const [activePhase, setActivePhase] = useState<FocusPhase>("work");
  const [completedCycles, setCompletedCycles] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(activePlan.workMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionNote, setSessionNote] = useState("");
  const [summary, setSummary] = useState<FocusSummary | null>(null);
  const [message, setMessage] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const recommendedPlanId = getRecommendedPlanId(summary);
  const totalSeconds = getPhaseMinutes(activePlan, activePhase) * 60;
  const progress = Math.max(
    0,
    Math.min(100, ((totalSeconds - timeRemaining) / totalSeconds) * 100),
  );
  const totalMinutes = summary?.totalMinutes ?? 0;
  const earnedHp = summary?.earnedHpToday ?? 0;
  const sessions = summary?.sessions ?? [];
  const nextBreakText =
    activePlan.longBreakAfter && activePlan.longBreakMinutes
      ? `long break after ${activePlan.longBreakAfter}`
      : "flexible";

  useEffect(() => {
    if (serverAuthStatus !== "authenticated") {
      return;
    }

    let isMounted = true;

    async function loadSummary() {
      try {
        const payload = await orbitApi<{ summary: FocusSummary }>(
          "/api/focus/summary",
          { withAuth: true },
        );

        if (isMounted) {
          setSummary(payload.summary);
          setMessage("");
        }
      } catch (error) {
        if (isMounted) {
          setMessage(
            error instanceof Error
              ? error.message
              : "We could not load your focus log.",
          );
        }
      }
    }

    void loadSummary();

    return () => {
      isMounted = false;
    };
  }, [serverAuthStatus]);

  useEffect(() => {
    setIsRunning(false);
    setActivePhase("work");
    setCompletedCycles(0);
    setTimeRemaining(activePlan.workMinutes * 60);
    setMessage("");
  }, [activePlan]);

  const completeCurrentPhase = useCallback(async () => {
    setIsRunning(false);

    if (activePhase !== "work") {
      setActivePhase("work");
      setTimeRemaining(activePlan.workMinutes * 60);
      setMessage("Break complete. Ready for the next cycle.");
      return;
    }

    const nextCycles = completedCycles + 1;
    const shouldTakeLongBreak =
      Boolean(activePlan.longBreakAfter && activePlan.longBreakMinutes) &&
      nextCycles % Number(activePlan.longBreakAfter) === 0;
    const nextPhase: FocusPhase = shouldTakeLongBreak ? "longBreak" : "break";

    setIsSyncing(true);

    try {
      const payload = await orbitApi<{ summary: FocusSummary }>(
        "/api/focus/sessions",
        {
          body: JSON.stringify({
            hp: activePlan.hp,
            minutes: activePlan.workMinutes,
            note: sessionNote,
            planId: activePlan.id,
            planName: activePlan.name,
          }),
          method: "POST",
          withAuth: true,
        },
      );

      setSummary(payload.summary);
      setCompletedCycles(nextCycles);
      setSessionNote("");
      setActivePhase(nextPhase);
      setTimeRemaining(getPhaseMinutes(activePlan, nextPhase) * 60);
      setMessage(`${activePlan.name} complete. +${activePlan.hp} HP saved.`);
      await refreshServerSession();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "We could not save this focus session.",
      );
      setTimeRemaining(0);
    } finally {
      setIsSyncing(false);
    }
  }, [
    activePhase,
    activePlan,
    completedCycles,
    refreshServerSession,
    sessionNote,
  ]);

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    if (timeRemaining <= 0) {
      void completeCurrentPhase();
      return;
    }

    const timerId = window.setInterval(() => {
      setTimeRemaining((currentTime) => Math.max(0, currentTime - 1));
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [completeCurrentPhase, isRunning, timeRemaining]);

  function selectPlan(planId: FocusPlan["id"]) {
    setActivePlanId(planId);
  }

  function resetTimer() {
    setIsRunning(false);
    setActivePhase("work");
    setCompletedCycles(0);
    setTimeRemaining(activePlan.workMinutes * 60);
    setMessage("Timer reset.");
  }

  function updateCustomPlan(
    field: "workMinutes" | "breakMinutes" | "longBreakMinutes" | "longBreakAfter",
    value: string,
  ) {
    const numericValue = Number(value);

    setCustomPlan((currentPlan) => ({
      ...currentPlan,
      [field]:
        field === "longBreakAfter"
          ? Math.max(1, Math.min(8, Math.round(numericValue || 1)))
          : clampMinutes(numericValue, Number(currentPlan[field]) || 5),
    }));
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
      <section className="relative overflow-hidden rounded-lg border border-black/10 bg-white/88 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.055] xl:col-span-2">
        <div className="absolute right-10 top-8 h-44 w-44 rounded-full bg-orange-400/10 blur-3xl" />
        <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_210px] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase text-orbit-orange">
              Focus
            </p>
            <h2 className="mt-2 max-w-3xl text-3xl font-black leading-[1.05] text-orbit-coal dark:text-white sm:text-5xl">
              Choose a plan, then let the timer do the work.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-orbit-coal/60 dark:text-white/60">
              Presets are compact now: tap a card to select it, start when you
              are ready, and ORBIT saves completed focus sessions to your
              account.
            </p>
          </div>

          <div className="relative mx-auto aspect-square w-full max-w-[190px]">
            <div className="absolute inset-4 rounded-full border border-dashed border-orbit-orange/35" />
            <motion.div
              animate={{ rotate: isRunning ? 360 : 0 }}
              className="absolute inset-0 rounded-full border border-orbit-orange/20"
              transition={{ duration: 18, ease: "linear", repeat: Infinity }}
            />
            <Image
              alt="ORBIT focus mascot"
              className="absolute inset-0 h-full w-full object-contain drop-shadow-2xl"
              height={260}
              priority
              src="/assets/Mascots/mas5.svg"
              width={260}
            />
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-black/10 bg-white/88 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.055]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-black text-orbit-orange">
              {activePlan.name}
            </p>
            <p className="mt-1 text-xs font-bold text-orbit-coal/52 dark:text-white/52">
              {getPhaseLabel(activePhase)} · cycle {completedCycles + 1}
            </p>
          </div>
          <Timer aria-hidden className="text-orbit-orange" size={24} />
        </div>

        <div className="mt-7 text-center">
          <p className="font-mono text-7xl font-black leading-none text-orbit-coal dark:text-white sm:text-8xl">
            {formatTime(timeRemaining)}
          </p>
          <div className="mt-6 h-2 overflow-hidden rounded-full bg-black/[0.08] dark:bg-white/[0.08]">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${activePlan.accent} transition-[width] duration-500`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2">
          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-orbit-coal text-sm font-black text-white transition hover:-translate-y-0.5 disabled:opacity-60 dark:bg-white dark:text-orbit-coal"
            disabled={isSyncing}
            onClick={() => setIsRunning((current) => !current)}
            type="button"
          >
            {isSyncing ? (
              <Loader2 aria-hidden className="animate-spin" size={17} />
            ) : isRunning ? (
              <Pause aria-hidden size={17} />
            ) : (
              <Play aria-hidden size={17} />
            )}
            {isRunning ? "Pause" : "Start"}
          </button>
          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-black/10 bg-white/70 text-sm font-black text-orbit-coal transition hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/[0.09]"
            onClick={resetTimer}
            type="button"
          >
            <RotateCcw aria-hidden size={16} />
            Reset
          </button>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          {[
            ["Work", `${activePlan.workMinutes}m`],
            ["Break", `${activePlan.breakMinutes}m`],
            ["Cycles", nextBreakText],
          ].map(([label, value]) => (
            <div
              className="rounded-lg bg-black/[0.035] px-3 py-2 dark:bg-white/[0.045]"
              key={label}
            >
              <p className="text-xs font-bold text-orbit-coal/45 dark:text-white/45">
                {label}
              </p>
              <p className="mt-1 truncate text-sm font-black text-orbit-coal dark:text-white">
                {value}
              </p>
            </div>
          ))}
        </div>

        <label
          className="mt-5 block text-sm font-black text-orbit-coal dark:text-white"
          htmlFor="focus-note"
        >
          Session note
          <textarea
            className="mt-2 min-h-24 w-full resize-none rounded-lg border border-black/10 bg-black/[0.025] px-4 py-3 text-sm font-bold leading-6 text-orbit-coal outline-none transition focus:border-orbit-orange dark:border-white/10 dark:bg-white/[0.035] dark:text-white"
            id="focus-note"
            maxLength={160}
            onChange={(event) => setSessionNote(event.target.value)}
            placeholder="What are you focusing on?"
            value={sessionNote}
          />
        </label>

        {message ? (
          <p className="mt-4 rounded-lg border border-orange-300/25 bg-orange-500/10 px-4 py-3 text-sm font-bold text-orbit-coal dark:text-white">
            {message}
          </p>
        ) : null}
      </section>

      <aside className="grid gap-4">
        <section className="rounded-lg border border-black/10 bg-gradient-to-br from-orbit-orange to-orbit-amber p-5 text-orbit-coal shadow-orbit">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-black uppercase">Recommended</p>
              <p className="mt-4 text-2xl font-black leading-tight">
                {allPlans.find((plan) => plan.id === recommendedPlanId)?.name}
              </p>
              <p className="mt-2 text-sm font-bold text-orbit-coal/70">
                Based on today&apos;s rhythm.
              </p>
            </div>
            <Sparkles aria-hidden size={30} />
          </div>
          <button
            className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-orbit-coal text-sm font-black text-white transition hover:-translate-y-0.5"
            onClick={() => selectPlan(recommendedPlanId)}
            type="button"
          >
            Use recommendation
          </button>
        </section>

        <section className="rounded-lg border border-black/10 bg-white/88 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.055]">
          <p className="text-sm font-black uppercase text-orbit-orange">
            Today
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div>
              <p className="text-4xl font-black text-orbit-coal dark:text-white">
                {totalMinutes}m
              </p>
              <p className="mt-1 text-xs font-bold text-orbit-coal/48 dark:text-white/48">
                focus time
              </p>
            </div>
            <div>
              <p className="text-4xl font-black text-orbit-coal dark:text-white">
                +{earnedHp}
              </p>
              <p className="mt-1 text-xs font-bold text-orbit-coal/48 dark:text-white/48">
                HP earned
              </p>
            </div>
          </div>
        </section>
      </aside>

      <section className="rounded-lg border border-black/10 bg-white/88 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.055] xl:col-span-2">
        <div className="flex items-center justify-between gap-3 px-1">
          <h3 className="text-xl font-black text-orbit-coal dark:text-white">
            Plans
          </h3>
          <span className="text-xs font-black uppercase text-orbit-orange">
            tap a card
          </span>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {allPlans.map((plan) => {
            const isActive = activePlan.id === plan.id;
            const isRecommended = recommendedPlanId === plan.id;

            return (
              <button
                className={`group rounded-lg border p-3 text-left transition hover:-translate-y-0.5 ${
                  isActive
                    ? "border-orbit-orange bg-orange-500/10 shadow-[0_0_0_3px_rgba(255,122,0,0.13)]"
                    : "border-black/10 bg-black/[0.02] hover:bg-black/[0.035] dark:border-white/10 dark:bg-white/[0.035] dark:hover:bg-white/[0.06]"
                }`}
                key={plan.id}
                onClick={() => selectPlan(plan.id)}
                type="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${plan.accent} text-orbit-coal`}
                  >
                    {plan.id === "hardcore" ? (
                      <Flame aria-hidden size={17} />
                    ) : plan.id === "light" ? (
                      <Coffee aria-hidden size={17} />
                    ) : (
                      <Brain aria-hidden size={17} />
                    )}
                  </span>
                  {isRecommended ? (
                    <span className="rounded-full bg-orbit-orange px-2 py-1 text-[10px] font-black uppercase text-orbit-coal">
                      Best
                    </span>
                  ) : null}
                </div>

                <p className="mt-3 truncate text-sm font-black text-orbit-coal dark:text-white">
                  {plan.name}
                </p>
                <p className="mt-1 text-xs font-bold text-orbit-coal/50 dark:text-white/50">
                  {plan.workMinutes}m work · {plan.breakMinutes}m break
                </p>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-0.5 text-orbit-orange">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star
                        aria-hidden
                        className={
                          index < plan.focusLevel
                            ? "fill-current"
                            : "text-orbit-coal/18 dark:text-white/18"
                        }
                        key={index}
                        size={12}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-black text-orbit-coal/48 dark:text-white/48">
                    +{plan.hp} HP
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-lg border border-black/10 bg-white/88 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.055]">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/12 text-orbit-orange">
            <Settings2 aria-hidden size={20} />
          </span>
          <div>
            <h3 className="text-lg font-black text-orbit-coal dark:text-white">
              Customize
            </h3>
            <p className="text-xs font-bold text-orbit-coal/50 dark:text-white/50">
              For unusual study days.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-4 xl:grid-cols-2">
          {[
            ["Work", "workMinutes", customPlan.workMinutes],
            ["Break", "breakMinutes", customPlan.breakMinutes],
            ["Long", "longBreakMinutes", customPlan.longBreakMinutes ?? 20],
            ["After", "longBreakAfter", customPlan.longBreakAfter ?? 4],
          ].map(([label, field, value]) => (
            <label
              className="text-sm font-black text-orbit-coal dark:text-white"
              key={field}
            >
              {label}
              <input
                className="mt-2 h-10 w-full rounded-lg border border-black/10 bg-black/[0.025] px-3 text-sm font-bold text-orbit-coal outline-none transition focus:border-orbit-orange dark:border-white/10 dark:bg-white/[0.035] dark:text-white"
                min={1}
                max={field === "longBreakAfter" ? 8 : 180}
                onChange={(event) =>
                  updateCustomPlan(
                    field as
                      | "workMinutes"
                      | "breakMinutes"
                      | "longBreakMinutes"
                      | "longBreakAfter",
                    event.target.value,
                  )
                }
                type="number"
                value={Number(value)}
              />
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-black/10 bg-white/88 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.055]">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-lg font-black text-orbit-coal dark:text-white">
            Focus log
          </h3>
          <span className="text-sm font-black text-orbit-orange">Today</span>
        </div>

        <div className="mt-4 grid gap-2">
          {sessions.length ? (
            sessions.slice(0, 5).map((session) => (
              <article
                className="grid gap-2 rounded-lg border border-black/10 bg-black/[0.025] px-3 py-3 dark:border-white/10 dark:bg-white/[0.035] sm:grid-cols-[1fr_auto] sm:items-center"
                key={session.id}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-orbit-coal dark:text-white">
                    {session.planName} · {session.minutes} minutes
                  </p>
                  <p className="mt-1 truncate text-xs font-bold text-orbit-coal/50 dark:text-white/50">
                    {session.note || "No note added"}
                  </p>
                </div>
                <div className="flex items-center gap-2 sm:justify-end">
                  <span className="rounded-full bg-orange-500/12 px-3 py-1 text-xs font-black text-orbit-orange">
                    +{session.hp} HP
                  </span>
                  <span className="text-xs font-black text-orbit-coal/45 dark:text-white/45">
                    {formatClock(session.completedAt)}
                  </span>
                </div>
              </article>
            ))
          ) : (
            <p className="rounded-lg border border-black/10 bg-black/[0.025] px-4 py-4 text-sm font-bold leading-6 text-orbit-coal/58 dark:border-white/10 dark:bg-white/[0.035] dark:text-white/58">
              Completed focus sessions will appear here.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
