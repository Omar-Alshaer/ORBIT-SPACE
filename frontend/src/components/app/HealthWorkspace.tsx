"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BedDouble,
  CheckCircle2,
  Droplets,
  Footprints,
  Loader2,
  Minus,
  Plus,
  Save,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { orbitApi } from "@/lib/orbit-api";

type HealthCheckIn = {
  dateKey: string;
  hpAwarded: number;
  movementMinutes: number;
  note: string;
  score: number;
  sleepHours: number;
  updatedAt: string;
  waterCups: number;
};

type HealthSummary = {
  checkIn: HealthCheckIn;
  dateKey: string;
  targets: {
    movementMinutes: number;
    sleepHours: number;
    waterCups: number;
  };
};

function percent(value: number, target: number) {
  if (!target) {
    return 0;
  }

  return Math.min(100, Math.round((value / target) * 100));
}

function formatDate(value?: string) {
  if (!value) {
    return "Today";
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
  }).format(new Date(value));
}

export function HealthWorkspace() {
  const { refreshServerSession, serverAuthStatus } = useAuth();
  const [summary, setSummary] = useState<HealthSummary | null>(null);
  const [waterCups, setWaterCups] = useState(0);
  const [sleepHours, setSleepHours] = useState(7);
  const [movementMinutes, setMovementMinutes] = useState(0);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const targets = useMemo(
    () =>
      summary?.targets ?? {
        movementMinutes: 30,
        sleepHours: 8,
        waterCups: 8,
      },
    [summary?.targets],
  );
  const scorePreview = useMemo(() => {
    const hydrationScore = percent(waterCups, targets.waterCups) * 0.35;
    const movementScore =
      percent(movementMinutes, targets.movementMinutes) * 0.3;
    const sleepDistance = Math.abs(sleepHours - targets.sleepHours);
    const sleepScore = Math.max(0, 35 - sleepDistance * 10);

    return Math.round(hydrationScore + movementScore + sleepScore);
  }, [movementMinutes, sleepHours, targets, waterCups]);

  useEffect(() => {
    if (serverAuthStatus !== "authenticated") {
      return;
    }

    let isMounted = true;

    async function loadSummary() {
      try {
        const payload = await orbitApi<{ summary: HealthSummary }>(
          "/api/health/summary",
          { withAuth: true },
        );

        if (!isMounted) {
          return;
        }

        const checkIn = payload.summary.checkIn;
        setSummary(payload.summary);
        setWaterCups(checkIn.waterCups);
        setSleepHours(checkIn.sleepHours || 7);
        setMovementMinutes(checkIn.movementMinutes);
        setNote(checkIn.note);
        setMessage("");
      } catch (error) {
        if (isMounted) {
          setMessage(
            error instanceof Error
              ? error.message
              : "We could not load your health check-in.",
          );
        }
      }
    }

    void loadSummary();

    return () => {
      isMounted = false;
    };
  }, [serverAuthStatus]);

  async function handleSave() {
    setIsSaving(true);
    setMessage("");

    try {
      const payload = await orbitApi<{ summary: HealthSummary }>(
        "/api/health/today",
        {
          body: JSON.stringify({
            movementMinutes,
            note,
            sleepHours,
            waterCups,
          }),
          method: "PUT",
          withAuth: true,
        },
      );

      setSummary(payload.summary);
      setMessage("Health check-in saved.");
      await refreshServerSession();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "We could not save your check-in.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
      <section className="relative overflow-hidden rounded-lg border border-black/10 bg-white/88 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.055] xl:col-span-2">
        <div className="absolute right-10 top-8 h-44 w-44 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_210px] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase text-orbit-orange">
              Health check-in
            </p>
            <h2 className="mt-2 max-w-3xl text-3xl font-black leading-[1.05] text-orbit-coal dark:text-white sm:text-5xl">
              Small habits, saved once a day.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-orbit-coal/60 dark:text-white/60">
              Log water, sleep, and movement without turning your day into a
              spreadsheet. Better health score means more HP.
            </p>
          </div>

          <div className="relative mx-auto aspect-square w-full max-w-[190px]">
            <div className="absolute inset-4 rounded-full border border-dashed border-emerald-400/35" />
            <Image
              alt="ORBIT health mascot"
              className="absolute inset-0 h-full w-full object-contain drop-shadow-2xl"
              height={260}
              priority
              src="/assets/Mascots/mas8.svg"
              width={260}
            />
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-black/10 bg-white/88 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.055]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black text-orbit-orange">
              Today&apos;s score
            </p>
            <p className="mt-3 text-7xl font-black leading-none text-orbit-coal dark:text-white">
              {scorePreview}
            </p>
          </div>
          <Activity aria-hidden className="text-orbit-orange" size={26} />
        </div>
        <div className="mt-6 h-2 overflow-hidden rounded-full bg-black/[0.08] dark:bg-white/[0.08]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-orbit-orange to-orbit-amber transition-[width] duration-500"
            style={{ width: `${scorePreview}%` }}
          />
        </div>

        <div className="mt-6 grid gap-3">
          <div className="rounded-lg border border-black/10 bg-black/[0.025] p-4 dark:border-white/10 dark:bg-white/[0.035]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Droplets aria-hidden className="text-orbit-orange" size={20} />
                <span className="text-sm font-black text-orbit-coal dark:text-white">
                  Hydration
                </span>
              </div>
              <span className="text-sm font-black text-orbit-coal/55 dark:text-white/55">
                {waterCups}/{targets.waterCups}
              </span>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <button
                aria-label="Remove water cup"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-black/10 bg-white/70 text-orbit-coal transition hover:bg-white dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
                onClick={() => setWaterCups((current) => Math.max(0, current - 1))}
                type="button"
              >
                <Minus aria-hidden size={16} />
              </button>
              <div className="h-10 flex-1 rounded-lg bg-black/[0.035] px-3 py-2 text-center text-sm font-black text-orbit-coal dark:bg-white/[0.045] dark:text-white">
                {waterCups} cups
              </div>
              <button
                aria-label="Add water cup"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-orbit-orange text-orbit-coal transition hover:bg-orbit-amber"
                onClick={() => setWaterCups((current) => Math.min(20, current + 1))}
                type="button"
              >
                <Plus aria-hidden size={16} />
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-black/10 bg-black/[0.025] p-4 dark:border-white/10 dark:bg-white/[0.035]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <BedDouble aria-hidden className="text-orbit-orange" size={20} />
                <span className="text-sm font-black text-orbit-coal dark:text-white">
                  Sleep
                </span>
              </div>
              <span className="text-sm font-black text-orbit-coal/55 dark:text-white/55">
                {sleepHours}h
              </span>
            </div>
            <input
              className="mt-4 h-2 w-full accent-orbit-orange"
              max={12}
              min={0}
              onChange={(event) => setSleepHours(Number(event.target.value))}
              step={0.5}
              type="range"
              value={sleepHours}
            />
          </div>

          <div className="rounded-lg border border-black/10 bg-black/[0.025] p-4 dark:border-white/10 dark:bg-white/[0.035]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Footprints aria-hidden className="text-orbit-orange" size={20} />
                <span className="text-sm font-black text-orbit-coal dark:text-white">
                  Movement
                </span>
              </div>
              <span className="text-sm font-black text-orbit-coal/55 dark:text-white/55">
                {movementMinutes}m
              </span>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-2">
              {[0, 10, 20, 30].map((minutes) => (
                <button
                  className={`h-9 rounded-lg text-xs font-black transition ${
                    movementMinutes === minutes
                      ? "bg-orbit-orange text-orbit-coal"
                      : "bg-black/[0.04] text-orbit-coal/60 hover:bg-black/[0.06] dark:bg-white/[0.055] dark:text-white/60"
                  }`}
                  key={minutes}
                  onClick={() => setMovementMinutes(minutes)}
                  type="button"
                >
                  {minutes}m
                </button>
              ))}
            </div>
          </div>
        </div>

        <label
          className="mt-5 block text-sm font-black text-orbit-coal dark:text-white"
          htmlFor="health-note"
        >
          Note
          <textarea
            className="mt-2 min-h-20 w-full resize-none rounded-lg border border-black/10 bg-black/[0.025] px-4 py-3 text-sm font-bold leading-6 text-orbit-coal outline-none transition focus:border-orbit-orange dark:border-white/10 dark:bg-white/[0.035] dark:text-white"
            id="health-note"
            maxLength={160}
            onChange={(event) => setNote(event.target.value)}
            placeholder="How does your body feel today?"
            value={note}
          />
        </label>

        <button
          className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-orbit-orange text-sm font-black text-orbit-coal transition hover:-translate-y-0.5 hover:bg-orbit-amber disabled:opacity-60"
          disabled={isSaving}
          onClick={() => void handleSave()}
          type="button"
        >
          {isSaving ? (
            <Loader2 aria-hidden className="animate-spin" size={17} />
          ) : (
            <Save aria-hidden size={17} />
          )}
          Save check-in
        </button>

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
              <p className="text-sm font-black uppercase">Saved today</p>
              <p className="mt-5 text-6xl font-black leading-none">
                +{summary?.checkIn.hpAwarded ?? 0}
              </p>
              <p className="mt-3 text-sm font-bold text-orbit-coal/70">
                HP from health habits
              </p>
            </div>
            <Sparkles aria-hidden size={34} />
          </div>
        </section>

        <section className="rounded-lg border border-black/10 bg-white/88 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.055]">
          <h3 className="text-lg font-black text-orbit-coal dark:text-white">
            Habit balance
          </h3>
          <div className="mt-4 grid gap-3">
            {[
              {
                icon: Droplets,
                label: "Water",
                value: `${percent(waterCups, targets.waterCups)}%`,
              },
              {
                icon: BedDouble,
                label: "Sleep",
                value: `${Math.round(Math.max(0, 100 - Math.abs(sleepHours - targets.sleepHours) * 25))}%`,
              },
              {
                icon: Footprints,
                label: "Movement",
                value: `${percent(movementMinutes, targets.movementMinutes)}%`,
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div
                  className="flex items-center justify-between gap-3 rounded-lg bg-black/[0.025] px-4 py-3 dark:bg-white/[0.035]"
                  key={item.label}
                >
                  <div className="flex items-center gap-2">
                    <Icon aria-hidden className="text-orbit-orange" size={18} />
                    <span className="text-sm font-black text-orbit-coal dark:text-white">
                      {item.label}
                    </span>
                  </div>
                  <span className="text-sm font-black text-orbit-coal/55 dark:text-white/55">
                    {item.value}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-lg border border-black/10 bg-white/88 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.055]">
          <div className="flex items-center gap-3">
            <CheckCircle2
              aria-hidden
              className="text-orbit-orange"
              size={22}
            />
            <div>
              <h3 className="text-lg font-black text-orbit-coal dark:text-white">
                Last update
              </h3>
              <p className="mt-1 text-sm font-bold text-orbit-coal/52 dark:text-white/52">
                {formatDate(summary?.checkIn.updatedAt)}
              </p>
            </div>
          </div>
        </section>
      </aside>
    </div>
  );
}
