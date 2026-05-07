"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowRight,
  BedDouble,
  Camera,
  CheckCircle2,
  Droplets,
  Flame,
  Footprints,
  HeartPulse,
  ImageUp,
  Loader2,
  Play,
  Sparkles,
  Timer,
  Trophy,
  UploadCloud,
  X,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  EmptyState,
  ErrorNotice,
  LoadingPanel,
  SkeletonMetricGrid,
} from "@/components/app/UiStates";
import type { DailyMission, DailyMissionsSummary } from "@/lib/daily-missions";
import { orbitApi } from "@/lib/orbit-api";

type FocusSession = {
  completedAt: string;
  hp: number;
  id: string;
  minutes: number;
  note: string;
  planName: string;
};

type FocusSummary = {
  earnedHpToday: number;
  sessions: FocusSession[];
  totalMinutes: number;
};

type HealthSummary = {
  checkIn: {
    hpAwarded: number;
    movementMinutes: number;
    score: number;
    sleepHours: number;
    waterCups: number;
  };
  targets: {
    movementMinutes: number;
    sleepHours: number;
    waterCups: number;
  };
};

type CommunityChallenge = {
  actionHref: string;
  id: string;
  label: string;
  progress: number;
  progressLabel: string;
  reward: number;
  status: "available" | "joined" | "claimable" | "claimed";
};

type CommunitySummary = {
  galaxyChallenges: CommunityChallenge[];
  orbitChallenges: CommunityChallenge[];
};

const missionTypeLabel: Record<DailyMission["type"], string> = {
  focus: "Focus",
  hydration: "Hydration",
  movement: "Movement",
};

function percent(value: number, target: number) {
  if (!target) {
    return 0;
  }

  return Math.min(100, Math.round((value / target) * 100));
}

export function DashboardHome() {
  const { profile, refreshServerSession, serverAuthStatus } = useAuth();
  const [dailySummary, setDailySummary] =
    useState<DailyMissionsSummary | null>(null);
  const [communitySummary, setCommunitySummary] =
    useState<CommunitySummary | null>(null);
  const [focusSummary, setFocusSummary] = useState<FocusSummary | null>(null);
  const [healthSummary, setHealthSummary] = useState<HealthSummary | null>(null);
  const [selectedMissionId, setSelectedMissionId] = useState("");
  const [message, setMessage] = useState("");
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [isUpdatingChallengeId, setIsUpdatingChallengeId] = useState("");
  const [isCompletingMission, setIsCompletingMission] = useState(false);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [proofNote, setProofNote] = useState("");
  const [pendingProofFile, setPendingProofFile] = useState<File | null>(null);
  const [proofPreviewUrl, setProofPreviewUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const hp = profile?.hp ?? 0;
  const streak = profile?.streak ?? 0;
  const badges = profile?.badges ?? [];
  const firstName =
    profile?.displayName?.split(" ")[0] ||
    profile?.email?.split("@")[0] ||
    "there";
  const missions = useMemo(
    () => dailySummary?.missions ?? [],
    [dailySummary?.missions],
  );
  const selectedMission =
    missions.find((mission) => mission.id === selectedMissionId) ??
    missions.find((mission) => mission.status === "open") ??
    missions[0];
  const nextMission = missions.find((mission) => mission.status === "open");
  const completedCount = dailySummary?.completedCount ?? 0;
  const totalCount = dailySummary?.totalCount ?? 3;
  const progress =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const health = healthSummary?.checkIn;
  const healthTargets = healthSummary?.targets ?? {
    movementMinutes: 30,
    sleepHours: 8,
    waterCups: 8,
  };
  const healthScore = health?.score ?? 0;
  const focusMinutes = focusSummary?.totalMinutes ?? 0;
  const todayHp =
    (dailySummary?.earnedHpToday ?? 0) +
    (focusSummary?.earnedHpToday ?? 0) +
    (health?.hpAwarded ?? 0);
  const communityChallenges = useMemo(
    () => [
      ...(communitySummary?.orbitChallenges ?? []),
      ...(communitySummary?.galaxyChallenges ?? []),
    ],
    [communitySummary?.galaxyChallenges, communitySummary?.orbitChallenges],
  );
  const featuredChallenge =
    communityChallenges.find((challenge) => challenge.status === "claimable") ??
    communityChallenges.find((challenge) => challenge.status === "joined") ??
    communityChallenges.find((challenge) => challenge.status === "available") ??
    communityChallenges[0];

  useEffect(() => {
    if (serverAuthStatus !== "authenticated") {
      return;
    }

    let isMounted = true;

    async function loadDashboard() {
      setIsLoadingDashboard(true);
      setMessage("");

      try {
        const [missionsPayload, focusPayload, healthPayload, communityPayload] =
          await Promise.all([
            orbitApi<{ summary: DailyMissionsSummary }>("/api/missions/daily", {
              withAuth: true,
            }),
            orbitApi<{ summary: FocusSummary }>("/api/focus/summary", {
              withAuth: true,
            }),
            orbitApi<{ summary: HealthSummary }>("/api/health/summary", {
              withAuth: true,
            }),
            orbitApi<{ summary: CommunitySummary }>("/api/community/summary", {
              withAuth: true,
            }),
          ]);

        if (!isMounted) {
          return;
        }

        setDailySummary(missionsPayload.summary);
        setCommunitySummary(communityPayload.summary);
        setFocusSummary(focusPayload.summary);
        setHealthSummary(healthPayload.summary);
        setSelectedMissionId(
          (currentMissionId) =>
            currentMissionId ||
            missionsPayload.summary.missions.find(
              (mission) => mission.status === "open",
            )?.id ||
            missionsPayload.summary.missions[0]?.id ||
            "",
        );
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setMessage(
          error instanceof Error
            ? error.message
            : "We could not load your dashboard.",
        );
      } finally {
        if (isMounted) {
          setIsLoadingDashboard(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [serverAuthStatus]);

  useEffect(() => {
    if (!pendingProofFile) {
      setProofPreviewUrl("");
      return;
    }

    const previewUrl = URL.createObjectURL(pendingProofFile);
    setProofPreviewUrl(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [pendingProofFile]);

  async function handleCompleteMission(mission: DailyMission) {
    if (mission.status === "completed") {
      return;
    }

    setMessage("");
    setIsCompletingMission(true);

    try {
      const payload = await orbitApi<{ summary: DailyMissionsSummary }>(
        `/api/missions/daily/${mission.id}/complete`,
        {
          method: "POST",
          withAuth: true,
        },
      );

      setDailySummary(payload.summary);
      await refreshServerSession();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to complete mission.",
      );
    } finally {
      setIsCompletingMission(false);
    }
  }

  async function handleProofUpload() {
    if (!selectedMission || !pendingProofFile) {
      return;
    }

    setMessage("");
    setIsUploadingProof(true);

    try {
      const formData = new FormData();
      formData.append("proof", pendingProofFile);
      formData.append("note", proofNote || `Proof for ${selectedMission.title}`);

      const payload = await orbitApi<{ summary: DailyMissionsSummary }>(
        `/api/missions/daily/${selectedMission.id}/proof`,
        {
          body: formData,
          method: "POST",
          withAuth: true,
        },
      );

      setDailySummary(payload.summary);
      setPendingProofFile(null);
      setProofNote("");
      await refreshServerSession();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to upload proof.",
      );
    } finally {
      setIsUploadingProof(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleChallengeAction(challenge: CommunityChallenge) {
    if (challenge.status === "joined" || challenge.status === "claimed") {
      return;
    }

    const endpoint =
      challenge.status === "claimable"
        ? "/api/community/challenges/claim"
        : "/api/community/challenges/join";
    setIsUpdatingChallengeId(challenge.id);
    setMessage("");

    try {
      const payload = await orbitApi<{ summary: CommunitySummary }>(endpoint, {
        body: JSON.stringify({ challengeId: challenge.id }),
        method: "POST",
        withAuth: true,
      });

      setCommunitySummary(payload.summary);

      if (challenge.status === "claimable") {
        await refreshServerSession();
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to update challenge.",
      );
    } finally {
      setIsUpdatingChallengeId("");
    }
  }

  return (
    <>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="relative overflow-hidden rounded-lg border border-black/10 bg-white/88 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.055] xl:col-span-2">
          <div className="absolute right-10 top-8 h-48 w-48 rounded-full bg-orange-400/10 blur-3xl" />
          <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_210px] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase text-orbit-orange">
                Today
              </p>
              <h2 className="mt-2 max-w-3xl text-3xl font-black leading-[1.05] text-orbit-coal dark:text-white sm:text-5xl">
                Hey {firstName}, pick one small win.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-orbit-coal/60 dark:text-white/60">
                Your focus, health, missions, and rewards live here. No hunting
                around, just the next useful action.
              </p>
            </div>

            <div className="relative mx-auto aspect-square w-full max-w-[190px]">
              <div className="absolute inset-4 rounded-full border border-dashed border-orbit-orange/35" />
              <Image
                alt="ORBIT mascot celebrating progress"
                className="absolute inset-0 h-full w-full object-contain drop-shadow-2xl"
                height={260}
                priority
                src="/assets/Mascots/mas7.svg"
                width={260}
              />
            </div>
          </div>
        </section>

        {isLoadingDashboard ? (
          <SkeletonMetricGrid />
        ) : (
          <section className="grid gap-3 xl:col-span-2 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                icon: Trophy,
                label: "Total HP",
                value: hp.toLocaleString(),
                tone: "from-orbit-orange to-orbit-amber",
              },
              {
                icon: Sparkles,
                label: "Earned today",
                value: `+${todayHp}`,
                tone: "from-sky-400 to-cyan-300",
              },
              {
                icon: Flame,
                label: "Streak",
                value: `${streak} day${streak === 1 ? "" : "s"}`,
                tone: "from-rose-400 to-orange-300",
              },
              {
                icon: CheckCircle2,
                label: "Badges",
                value: String(badges.length),
                tone: "from-emerald-400 to-lime-300",
              },
            ].map((metric) => {
              const Icon = metric.icon;

              return (
                <article
                  className="rounded-lg border border-black/10 bg-white/88 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.055]"
                  key={metric.label}
                >
                  <span
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${metric.tone} text-orbit-coal`}
                  >
                    <Icon aria-hidden size={19} />
                  </span>
                  <p className="mt-4 text-xs font-black uppercase text-orbit-coal/45 dark:text-white/45">
                    {metric.label}
                  </p>
                  <p className="mt-1 text-3xl font-black text-orbit-coal dark:text-white">
                    {metric.value}
                  </p>
                </article>
              );
            })}
          </section>
        )}

        <section className="rounded-lg border border-black/10 bg-white/88 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.055]">
          {isLoadingDashboard ? (
            <LoadingPanel
              description="Finding the best next action for today."
              title="Preparing your plan"
            />
          ) : (
            <>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-black text-orbit-coal dark:text-white">
                    Start here
                  </h3>
                  <p className="mt-1 text-sm font-bold text-orbit-coal/52 dark:text-white/52">
                    The highest-impact action right now.
                  </p>
                </div>
                <span className="rounded-full bg-orange-500/12 px-3 py-1 text-xs font-black uppercase text-orbit-orange">
                  {nextMission ? "Mission" : "Done"}
                </span>
              </div>

              <div className="mt-5 rounded-lg border border-orange-300/20 bg-orange-500/10 p-4">
                <p className="text-sm font-black text-orbit-coal dark:text-white">
                  {nextMission?.title ?? "Daily missions complete"}
                </p>
                <p className="mt-2 text-sm leading-6 text-orbit-coal/60 dark:text-white/60">
                  {nextMission?.detail ??
                    "Nice work. Keep your rhythm with focus or health next."}
                </p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {nextMission ? (
                    <button
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-orbit-orange text-sm font-black text-orbit-coal transition hover:-translate-y-0.5 disabled:opacity-60"
                      disabled={isCompletingMission}
                      onClick={() => void handleCompleteMission(nextMission)}
                      type="button"
                    >
                      {isCompletingMission ? (
                        <Loader2 aria-hidden className="animate-spin" size={17} />
                      ) : (
                        <CheckCircle2 aria-hidden size={17} />
                      )}
                      Mark done
                    </button>
                  ) : (
                    <Link
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-orbit-orange text-sm font-black text-orbit-coal transition hover:-translate-y-0.5"
                      href="/focus"
                    >
                      Start focus
                      <ArrowRight aria-hidden size={17} />
                    </Link>
                  )}
                  <Link
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-black/10 bg-white/70 text-sm font-black text-orbit-coal transition hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/[0.09]"
                    href="/missions"
                  >
                    View missions
                  </Link>
                </div>
              </div>
            </>
          )}

          {message ? (
            <div className="mt-4">
              <ErrorNotice message={message} />
            </div>
          ) : null}
        </section>

        <aside className="grid gap-4">
          <section className="rounded-lg border border-black/10 bg-gradient-to-br from-orbit-orange to-orbit-amber p-5 text-orbit-coal shadow-orbit">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase">Daily progress</p>
                <p className="mt-5 text-6xl font-black leading-none">
                  {progress}%
                </p>
                <p className="mt-3 text-sm font-bold text-orbit-coal/70">
                  {completedCount}/{totalCount} missions complete
                </p>
              </div>
              <Trophy aria-hidden size={34} />
            </div>
            <div className="mt-7 h-2 rounded-full bg-white/35">
              <div
                className="h-full rounded-full bg-orbit-coal transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </section>

          <section className="rounded-lg border border-black/10 bg-white/88 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.055]">
            <h3 className="text-lg font-black text-orbit-coal dark:text-white">
              Quick actions
            </h3>
            <div className="mt-4 grid gap-2">
              {[
                { href: "/focus", icon: Timer, label: "Start focus" },
                { href: "/health", icon: HeartPulse, label: "Log health" },
                { href: "/profile", icon: Sparkles, label: "View rewards" },
              ].map((action) => {
                const Icon = action.icon;

                return (
                  <Link
                    className="flex h-11 items-center gap-3 rounded-lg border border-black/10 bg-black/[0.025] px-3 text-sm font-black text-orbit-coal transition hover:-translate-y-0.5 hover:bg-black/[0.04] dark:border-white/10 dark:bg-white/[0.035] dark:text-white dark:hover:bg-white/[0.06]"
                    href={action.href}
                    key={action.label}
                  >
                    <Icon aria-hidden className="text-orbit-orange" size={18} />
                    {action.label}
                    <ArrowRight aria-hidden className="ml-auto" size={16} />
                  </Link>
                );
              })}
            </div>
          </section>

          {isLoadingDashboard ? (
            <section className="rounded-lg border border-black/10 bg-white/88 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.055]">
              <LoadingPanel rows={2} title="Loading challenge" />
            </section>
          ) : featuredChallenge ? (
            <section className="rounded-lg border border-black/10 bg-white/88 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.055]">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-black text-orbit-coal dark:text-white">
                  Community challenge
                </h3>
                <Sparkles aria-hidden className="text-orbit-orange" size={20} />
              </div>
              <p className="mt-4 text-sm font-black text-orbit-coal dark:text-white">
                {featuredChallenge.label}
              </p>
              <p className="mt-1 text-xs font-bold text-orbit-coal/50 dark:text-white/50">
                {featuredChallenge.status === "claimable"
                  ? "Ready to claim"
                  : featuredChallenge.status === "joined"
                    ? "In progress"
                    : featuredChallenge.status === "claimed"
                      ? "Claimed"
                      : "Suggested"}{" "}
                - {featuredChallenge.progressLabel}
              </p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/[0.07]">
                <div
                  className="h-full rounded-full bg-orbit-orange"
                  style={{ width: `${featuredChallenge.progress}%` }}
                />
              </div>
              <div className="mt-4 grid gap-2">
                {featuredChallenge.status === "joined" ? (
                  <Link
                    className="inline-flex h-10 items-center justify-center rounded-lg bg-orbit-orange px-3 text-sm font-black text-orbit-coal transition hover:-translate-y-0.5"
                    href={featuredChallenge.actionHref}
                  >
                    Continue
                  </Link>
                ) : featuredChallenge.status === "claimed" ? (
                  <Link
                    className="inline-flex h-10 items-center justify-center rounded-lg border border-black/10 bg-black/[0.025] px-3 text-sm font-black text-orbit-coal transition hover:bg-black/[0.04] dark:border-white/10 dark:bg-white/[0.035] dark:text-white"
                    href="/community"
                  >
                    View challenges
                  </Link>
                ) : (
                  <button
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-orbit-orange px-3 text-sm font-black text-orbit-coal transition hover:-translate-y-0.5 disabled:opacity-60"
                    disabled={isUpdatingChallengeId === featuredChallenge.id}
                    onClick={() => void handleChallengeAction(featuredChallenge)}
                    type="button"
                  >
                    {isUpdatingChallengeId === featuredChallenge.id ? (
                      <Loader2 aria-hidden className="animate-spin" size={16} />
                    ) : null}
                    {featuredChallenge.status === "claimable"
                      ? `Claim +${featuredChallenge.reward}`
                      : "Join"}
                  </button>
                )}
                <Link
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-black/10 bg-white/70 px-3 text-sm font-black text-orbit-coal transition hover:bg-white dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
                  href="/community"
                >
                  Community
                </Link>
              </div>
            </section>
          ) : (
            <EmptyState
              description="Join an Orbit or open Galaxy challenges to add a community goal here."
              title="No active challenge yet"
            />
          )}
        </aside>

        <section className="grid gap-4 xl:col-span-2 lg:grid-cols-3">
          <article className="rounded-lg border border-black/10 bg-white/88 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.055]">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-black text-orbit-coal dark:text-white">
                Health
              </h3>
              <Activity aria-hidden className="text-orbit-orange" size={22} />
            </div>
            <p className="mt-4 text-5xl font-black text-orbit-coal dark:text-white">
              {healthScore}
            </p>
            <p className="mt-1 text-sm font-bold text-orbit-coal/52 dark:text-white/52">
              daily score
            </p>
            <div className="mt-5 grid gap-2">
              {[
                {
                  icon: Droplets,
                  label: "Water",
                  value: `${health?.waterCups ?? 0}/${healthTargets.waterCups}`,
                },
                {
                  icon: BedDouble,
                  label: "Sleep",
                  value: `${health?.sleepHours ?? 0}h`,
                },
                {
                  icon: Footprints,
                  label: "Move",
                  value: `${health?.movementMinutes ?? 0}m`,
                },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    className="flex items-center justify-between rounded-lg bg-black/[0.025] px-3 py-2 dark:bg-white/[0.035]"
                    key={item.label}
                  >
                    <span className="flex items-center gap-2 text-sm font-bold text-orbit-coal/60 dark:text-white/60">
                      <Icon aria-hidden className="text-orbit-orange" size={16} />
                      {item.label}
                    </span>
                    <span className="text-sm font-black text-orbit-coal dark:text-white">
                      {item.value}
                    </span>
                  </div>
                );
              })}
            </div>
          </article>

          <article className="rounded-lg border border-black/10 bg-white/88 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.055]">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-black text-orbit-coal dark:text-white">
                Focus
              </h3>
              <Timer aria-hidden className="text-orbit-orange" size={22} />
            </div>
            <p className="mt-4 text-5xl font-black text-orbit-coal dark:text-white">
              {focusMinutes}m
            </p>
            <p className="mt-1 text-sm font-bold text-orbit-coal/52 dark:text-white/52">
              {focusSummary?.sessions.length ?? 0} session
              {(focusSummary?.sessions.length ?? 0) === 1 ? "" : "s"} today
            </p>
            <div className="mt-5 rounded-lg bg-black/[0.025] px-3 py-3 dark:bg-white/[0.035]">
              <p className="text-sm font-black text-orbit-coal dark:text-white">
                {focusSummary?.sessions[0]?.planName ?? "No focus yet"}
              </p>
              <p className="mt-1 truncate text-xs font-bold text-orbit-coal/50 dark:text-white/50">
                {focusSummary?.sessions[0]?.note ||
                  "Start a sprint when you are ready."}
              </p>
            </div>
          </article>

          <article className="rounded-lg border border-black/10 bg-white/88 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.055]">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-black text-orbit-coal dark:text-white">
                Missions
              </h3>
              <CheckCircle2
                aria-hidden
                className="text-orbit-orange"
                size={22}
              />
            </div>
            <div className="mt-5 grid gap-2">
              {isLoadingDashboard ? (
                <LoadingPanel rows={3} title="Loading missions" />
              ) : missions.length ? (
                missions.map((mission) => (
                <button
                  className={`flex items-center gap-3 rounded-lg border px-3 py-3 text-left transition hover:-translate-y-0.5 ${
                    selectedMission?.id === mission.id
                      ? "border-orbit-orange bg-orange-500/10"
                      : "border-black/10 bg-black/[0.025] dark:border-white/10 dark:bg-white/[0.035]"
                  }`}
                  key={mission.id}
                  onClick={() => setSelectedMissionId(mission.id)}
                  type="button"
                >
                  <span
                    className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      mission.status === "completed"
                        ? "bg-emerald-500 text-white"
                        : "bg-orange-500/14 text-orbit-orange"
                    }`}
                  >
                    <CheckCircle2 aria-hidden size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-black text-orbit-coal dark:text-white">
                      {mission.title}
                    </span>
                    <span className="text-xs font-bold text-orbit-coal/48 dark:text-white/48">
                      {missionTypeLabel[mission.type]} · +{mission.hp} HP
                    </span>
                  </span>
                </button>
                ))
              ) : (
                <EmptyState
                  description="Your daily missions will appear here as soon as your plan is ready."
                  title="No missions yet"
                />
              )}
            </div>
          </article>
        </section>

        <section className="rounded-lg border border-black/10 bg-white/88 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.055] xl:col-span-2">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-xl font-black text-orbit-coal dark:text-white">
                Selected mission
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-orbit-coal/58 dark:text-white/58">
                {selectedMission?.detail ??
                  "Pick a mission to complete it or upload a proof photo."}
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:w-[360px]">
              <button
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-orbit-orange text-sm font-black text-orbit-coal transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-55"
                disabled={
                  !selectedMission ||
                  selectedMission.status === "completed" ||
                  isCompletingMission
                }
                onClick={() =>
                  selectedMission
                    ? void handleCompleteMission(selectedMission)
                    : undefined
                }
                type="button"
              >
                {isCompletingMission ? (
                  <Loader2 aria-hidden className="animate-spin" size={17} />
                ) : (
                  <Play aria-hidden fill="currentColor" size={17} />
                )}
                Complete
              </button>
              <button
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-black/10 bg-white/70 text-sm font-black text-orbit-coal transition hover:-translate-y-0.5 hover:bg-white disabled:cursor-not-allowed disabled:opacity-55 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/[0.09]"
                disabled={
                  !selectedMission ||
                  selectedMission.status === "completed" ||
                  isUploadingProof
                }
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                <Camera aria-hidden size={17} />
                Proof
              </button>
              <input
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    setPendingProofFile(file);
                    setProofNote(
                      selectedMission ? `Proof for ${selectedMission.title}` : "",
                    );
                  }
                }}
                ref={fileInputRef}
                type="file"
              />
            </div>
          </div>
        </section>
      </div>

      {pendingProofFile ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-orbit-coal/58 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-lg border border-black/10 bg-white shadow-[0_28px_90px_rgba(0,0,0,0.24)] dark:border-white/10 dark:bg-[#101620]">
            <div className="flex items-center justify-between border-b border-black/10 px-5 py-4 dark:border-white/10">
              <div>
                <p className="text-xs font-black uppercase text-orbit-orange">
                  Confirm photo
                </p>
                <h3 className="mt-1 text-xl font-black text-orbit-coal dark:text-white">
                  Save this mission photo?
                </h3>
              </div>
              <button
                aria-label="Close proof modal"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-orbit-coal transition hover:bg-black/[0.04] dark:border-white/10 dark:text-white dark:hover:bg-white/[0.07]"
                onClick={() => setPendingProofFile(null)}
                type="button"
              >
                <X aria-hidden size={18} />
              </button>
            </div>

            <div className="grid gap-4 p-5">
              <div className="overflow-hidden rounded-lg border border-black/10 bg-black/[0.025] dark:border-white/10 dark:bg-white/[0.035]">
                {proofPreviewUrl ? (
                  <Image
                    alt="Selected mission photo preview"
                    className="h-64 w-full object-cover"
                    height={360}
                    src={proofPreviewUrl}
                    unoptimized
                    width={640}
                  />
                ) : (
                  <div className="flex h-64 items-center justify-center">
                    <ImageUp className="text-orbit-orange" size={32} />
                  </div>
                )}
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-black text-orbit-coal dark:text-white">
                  Note
                </span>
                <textarea
                  className="min-h-24 w-full resize-none rounded-lg border border-black/10 bg-white/80 px-4 py-3 text-sm font-bold text-orbit-coal outline-none transition placeholder:text-orbit-coal/35 focus:border-orbit-orange focus:ring-4 focus:ring-orange-500/12 dark:border-white/10 dark:bg-white/[0.055] dark:text-white"
                  onChange={(event) => setProofNote(event.target.value)}
                  value={proofNote}
                />
              </label>

              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-orbit-orange px-4 text-sm font-black text-orbit-coal transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isUploadingProof}
                  onClick={() => void handleProofUpload()}
                  type="button"
                >
                  {isUploadingProof ? (
                    <Loader2 aria-hidden className="animate-spin" size={17} />
                  ) : (
                    <UploadCloud aria-hidden size={17} />
                  )}
                  Save photo
                </button>
                <button
                  className="inline-flex h-11 items-center justify-center rounded-lg border border-black/10 bg-white/75 px-4 text-sm font-black text-orbit-coal transition hover:bg-white dark:border-white/10 dark:bg-white/[0.07] dark:text-white dark:hover:bg-white/[0.1]"
                  onClick={() => setPendingProofFile(null)}
                  type="button"
                >
                  Choose later
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
