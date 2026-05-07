"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Copy,
  HeartHandshake,
  Link2,
  Loader2,
  Plus,
  Rocket,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { EmptyState, LoadingPanel } from "@/components/app/UiStates";
import { orbitApi } from "@/lib/orbit-api";

type CommunityMember = {
  avatar: string;
  hpToday: number;
  id: string;
  name: string;
  status: "active" | "resting" | "needs-nudge";
};

type CommunityChallenge = {
  actionHref: string;
  claimedAt: string | null;
  description: string;
  id: string;
  label: string;
  metricLabel: string;
  participants: number;
  progress: number;
  progressLabel: string;
  reward: number;
  scope: "galaxy" | "orbit";
  startedAt: string | null;
  status: "available" | "joined" | "claimable" | "claimed";
  target: number;
  type: "focus" | "health" | "mission" | "movement";
};

type CommunityActivityItem = {
  id: string;
  label: string;
  memberName: string;
  tone: "focus" | "health" | "mission" | "rest";
};

type Orbit = {
  code: string;
  createdAt: string;
  id: string;
  inviteLink: string;
  memberCount: number;
  name: string;
  role: "owner" | "member";
};

type CommunitySummary = {
  activeOrbitMembers: number;
  activityFeed: CommunityActivityItem[];
  galaxyChallenges: CommunityChallenge[];
  galaxyRank: number;
  galaxySize: number;
  nudgeSentMemberIds: string[];
  orbit: Orbit | null;
  orbitChallenges: CommunityChallenge[];
  orbitHpToday: number;
  orbitMembers: CommunityMember[];
};

function getStatusText(status: CommunityMember["status"]) {
  if (status === "active") {
    return "Checked in";
  }

  if (status === "needs-nudge") {
    return "Needs a nudge";
  }

  return "Rest day";
}

export function CommunityWorkspace() {
  const searchParams = useSearchParams();
  const { serverAuthStatus, user } = useAuth();
  const [summary, setSummary] = useState<CommunitySummary | null>(null);
  const [activeView, setActiveView] = useState<"galaxy" | "orbit">("orbit");
  const [selectedChallengeId, setSelectedChallengeId] = useState("");
  const [nudgeSentTo, setNudgeSentTo] = useState("");
  const [isNudgingMemberId, setIsNudgingMemberId] = useState("");
  const [orbitName, setOrbitName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [isCreatingOrbit, setIsCreatingOrbit] = useState(false);
  const [isJoiningOrbit, setIsJoiningOrbit] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [isUpdatingChallengeId, setIsUpdatingChallengeId] = useState("");
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
  const [copiedText, setCopiedText] = useState("");
  const [message, setMessage] = useState("");
  const orbitMembers = useMemo(
    () => summary?.orbitMembers ?? [],
    [summary?.orbitMembers],
  );
  const orbitChallenges = useMemo(
    () => summary?.orbitChallenges ?? [],
    [summary?.orbitChallenges],
  );
  const galaxyChallenges = useMemo(
    () => summary?.galaxyChallenges ?? [],
    [summary?.galaxyChallenges],
  );
  const activeChallenges =
    activeView === "orbit" ? orbitChallenges : galaxyChallenges;
  const selectedChallenge =
    activeChallenges.find((challenge) => challenge.id === selectedChallengeId) ??
    activeChallenges[0];
  const canCreateOrbit = orbitName.trim().length >= 2 && !isCreatingOrbit;
  const canJoinOrbit = joinCode.trim().length >= 4 && !isJoiningOrbit;
  const remainingProgress = selectedChallenge
    ? Math.max(0, selectedChallenge.target - Number(
        selectedChallenge.progressLabel.split("/")[0] ?? 0,
      ))
    : 0;

  useEffect(() => {
    const inviteCode = searchParams.get("orbitCode");

    if (inviteCode) {
      setJoinCode(inviteCode.toUpperCase());
      setActiveView("orbit");
    }
  }, [searchParams]);

  useEffect(() => {
    if (serverAuthStatus !== "authenticated") {
      return;
    }

    let isMounted = true;

    async function loadCommunity() {
      setIsLoadingSummary(true);
      try {
        const payload = await orbitApi<{ summary: CommunitySummary }>(
          "/api/community/summary",
          { withAuth: true },
        );

        if (!isMounted) {
          return;
        }

        setSummary(payload.summary);
        setOrbitName(payload.summary.orbit?.name ?? "");
        setSelectedChallengeId(
          (currentChallengeId) =>
            currentChallengeId ||
            payload.summary.orbitChallenges[0]?.id ||
            payload.summary.galaxyChallenges[0]?.id ||
            "",
        );
        setMessage("");
      } catch (error) {
        if (isMounted) {
          setMessage(
            error instanceof Error
              ? error.message
              : "We could not load your community.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingSummary(false);
        }
      }
    }

    void loadCommunity();

    return () => {
      isMounted = false;
    };
  }, [serverAuthStatus]);

  function switchView(view: "galaxy" | "orbit") {
    setActiveView(view);
    const challenges = view === "orbit" ? orbitChallenges : galaxyChallenges;
    setSelectedChallengeId(challenges[0]?.id ?? "");
  }

  async function handleCreateOrbit() {
    setIsCreatingOrbit(true);
    setMessage("");

    try {
      const payload = await orbitApi<{ summary: CommunitySummary }>(
        "/api/community/orbits",
        {
          body: JSON.stringify({ name: orbitName }),
          method: "POST",
          withAuth: true,
        },
      );

      setSummary(payload.summary);
      setOrbitName(payload.summary.orbit?.name ?? "");
      setActiveView("orbit");
      setMessage(payload.summary.orbit ? "Orbit is ready." : "Orbit updated.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "We could not save this Orbit.",
      );
    } finally {
      setIsCreatingOrbit(false);
    }
  }

  async function handleJoinOrbit() {
    setIsJoiningOrbit(true);
    setMessage("");

    try {
      const payload = await orbitApi<{ summary: CommunitySummary }>(
        "/api/community/orbits/join",
        {
          body: JSON.stringify({ code: joinCode }),
          method: "POST",
          withAuth: true,
        },
      );

      setSummary(payload.summary);
      setOrbitName(payload.summary.orbit?.name ?? "");
      setJoinCode("");
      setActiveView("orbit");
      setMessage("You joined the Orbit.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "We could not join this Orbit.",
      );
    } finally {
      setIsJoiningOrbit(false);
    }
  }

  async function handleNudge(member: CommunityMember) {
    setIsNudgingMemberId(member.id);
    setMessage("");

    try {
      const payload = await orbitApi<{ summary: CommunitySummary }>(
        "/api/community/nudges",
        {
          body: JSON.stringify({ memberId: member.id }),
          method: "POST",
          withAuth: true,
        },
      );

      setSummary(payload.summary);
      setNudgeSentTo(member.name);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "We could not send this nudge.",
      );
    } finally {
      setIsNudgingMemberId("");
    }
  }

  async function copyInvite(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedText(label);
      setMessage("");
    } catch {
      setMessage("Copy failed. Select the code and copy it manually.");
    }
  }

  async function handleChallengeAction(challenge: CommunityChallenge) {
    if (challenge.status === "joined") {
      return;
    }

    const endpoint =
      challenge.status === "claimable"
        ? "/api/community/challenges/claim"
        : "/api/community/challenges/join";
    setIsUpdatingChallengeId(challenge.id);
    setMessage("");
    setCopiedText("");

    try {
      const payload = await orbitApi<{ summary: CommunitySummary }>(endpoint, {
        body: JSON.stringify({ challengeId: challenge.id }),
        method: "POST",
        withAuth: true,
      });

      setSummary(payload.summary);
      setMessage(
        challenge.status === "claimable"
          ? "Challenge reward claimed."
          : "Challenge joined.",
      );
      setIsChallengeModalOpen(challenge.status !== "claimable");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "We could not update this challenge.",
      );
    } finally {
      setIsUpdatingChallengeId("");
    }
  }

  return (
    <div className="grid gap-4">
      <section className="relative overflow-hidden rounded-lg border border-black/10 bg-white/88 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.055] sm:p-5">
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-black uppercase text-orbit-orange">
              Community
            </p>
            <h2 className="mt-2 text-2xl font-black leading-tight text-orbit-coal dark:text-white sm:text-4xl">
              Orbits for friends. Galaxy for everyone.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-orbit-coal/58 dark:text-white/58">
              Keep your private crew separate from public challenges, without
              extra noise.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden h-20 w-20 shrink-0 sm:block">
              <Image
                alt="ORBIT community mascot"
                className="h-full w-full object-contain drop-shadow-xl"
                height={180}
                priority
                src="/assets/Mascots/mas9.svg"
                width={180}
              />
            </div>
            <div className="grid min-w-[132px] grid-cols-2 gap-2 rounded-lg border border-black/10 bg-black/[0.025] p-2 dark:border-white/10 dark:bg-white/[0.035]">
              <button
                className={`rounded-md px-3 py-2 text-sm font-black transition ${
                  activeView === "orbit"
                    ? "bg-orbit-orange text-orbit-coal"
                    : "text-orbit-coal/58 hover:bg-black/[0.045] dark:text-white/58 dark:hover:bg-white/[0.06]"
                }`}
                onClick={() => switchView("orbit")}
                type="button"
              >
                Orbit
              </button>
              <button
                className={`rounded-md px-3 py-2 text-sm font-black transition ${
                  activeView === "galaxy"
                    ? "bg-orbit-orange text-orbit-coal"
                    : "text-orbit-coal/58 hover:bg-black/[0.045] dark:text-white/58 dark:hover:bg-white/[0.06]"
                }`}
                onClick={() => switchView("galaxy")}
                type="button"
              >
                Galaxy
              </button>
            </div>
          </div>
        </div>
      </section>

      {nudgeSentTo || message || copiedText ? (
        <section className="rounded-lg border border-orange-300/25 bg-orange-500/10 px-4 py-3 text-sm font-bold text-orbit-coal dark:text-white">
          {nudgeSentTo
            ? `Sent a friendly nudge to ${nudgeSentTo}.`
            : copiedText
              ? `Copied invite ${copiedText}.`
              : message}
        </section>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        {activeView === "orbit" ? (
          <section className="rounded-lg border border-black/10 bg-white/88 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.055] sm:p-5">
            {isLoadingSummary ? (
              <LoadingPanel
                description="Getting your crew and challenges ready."
                rows={4}
                title="Loading your Orbit"
              />
            ) : summary?.orbit ? (
              <>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-black uppercase text-orbit-orange">
                      My Orbit
                    </p>
                    <h3 className="mt-1 text-2xl font-black text-orbit-coal dark:text-white">
                      {summary.orbit.name}
                    </h3>
                    <p className="mt-1 text-sm font-bold text-orbit-coal/52 dark:text-white/52">
                      {summary.activeOrbitMembers} active today · +
                      {summary.orbitHpToday} HP
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-black/10 bg-black/[0.025] px-3 text-sm font-black text-orbit-coal transition hover:bg-black/[0.045] dark:border-white/10 dark:bg-white/[0.035] dark:text-white"
                      onClick={() => void copyInvite(summary.orbit!.code, "code")}
                      type="button"
                    >
                      <Copy aria-hidden size={15} />
                      {summary.orbit.code}
                    </button>
                    <button
                      aria-label="Copy invite link"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-orbit-orange text-orbit-coal transition hover:-translate-y-0.5"
                      onClick={() =>
                        void copyInvite(summary.orbit!.inviteLink, "link")
                      }
                      type="button"
                    >
                      <Link2 aria-hidden size={17} />
                    </button>
                  </div>
                </div>

                <div className="mt-5 grid gap-2">
                  {orbitMembers.map((member) => (
                    <article
                      className="flex items-center gap-3 rounded-lg border border-black/10 bg-black/[0.025] px-3 py-3 dark:border-white/10 dark:bg-white/[0.035]"
                      key={member.id}
                    >
                      <Image
                        alt={`${member.name} avatar`}
                        className="h-10 w-10 rounded-lg object-contain"
                        height={64}
                        src={member.avatar}
                        width={64}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-orbit-coal dark:text-white">
                          {member.name}
                        </p>
                        <p className="text-xs font-bold text-orbit-coal/52 dark:text-white/52">
                          {member.id === user?.uid
                            ? `${getStatusText(member.status)} - You`
                            : getStatusText(member.status)}{" "}
                          · +{member.hpToday} HP
                        </p>
                      </div>
                      {member.status === "needs-nudge" &&
                      member.id !== user?.uid ? (
                        <button
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-orbit-orange px-3 text-xs font-black text-orbit-coal transition hover:-translate-y-0.5 disabled:opacity-60"
                          disabled={isNudgingMemberId === member.id}
                          onClick={() => void handleNudge(member)}
                          type="button"
                        >
                          {isNudgingMemberId === member.id ? (
                            <Loader2
                              aria-hidden
                              className="animate-spin"
                              size={14}
                            />
                          ) : (
                            <Send aria-hidden size={14} />
                          )}
                          Nudge
                        </button>
                      ) : (
                        <CheckCircle2
                          aria-hidden
                          className={
                            member.status === "active"
                              ? "text-emerald-500"
                              : "text-orbit-coal/24 dark:text-white/24"
                          }
                          size={20}
                        />
                      )}
                    </article>
                  ))}
                </div>
              </>
            ) : (
              <div>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-black uppercase text-orbit-orange">
                      My Orbit
                    </p>
                    <h3 className="mt-1 text-2xl font-black text-orbit-coal dark:text-white">
                      Create or join a crew
                    </h3>
                  </div>
                  <HeartHandshake
                    aria-hidden
                    className="text-orbit-orange"
                    size={24}
                  />
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <label className="rounded-lg border border-orange-300/20 bg-orange-500/10 p-4 text-sm font-black text-orbit-coal dark:text-white">
                    New Orbit name
                    <input
                      className="mt-2 h-11 w-full rounded-lg border border-black/10 bg-white/75 px-3 text-sm font-bold text-orbit-coal outline-none transition focus:border-orbit-orange dark:border-white/10 dark:bg-white/[0.055] dark:text-white"
                      onChange={(event) => setOrbitName(event.target.value)}
                      placeholder="Study Crew"
                      value={orbitName}
                    />
                    <button
                      className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-orbit-orange text-sm font-black text-orbit-coal transition hover:-translate-y-0.5 disabled:opacity-60"
                      disabled={!canCreateOrbit}
                      onClick={() => void handleCreateOrbit()}
                      type="button"
                    >
                      {isCreatingOrbit ? (
                        <Loader2
                          aria-hidden
                          className="animate-spin"
                          size={16}
                        />
                      ) : (
                        <Plus aria-hidden size={16} />
                      )}
                      Create Orbit
                    </button>
                  </label>

                  <label className="rounded-lg border border-black/10 bg-black/[0.025] p-4 text-sm font-black text-orbit-coal dark:border-white/10 dark:bg-white/[0.035] dark:text-white">
                    Join with code
                    <input
                      className="mt-2 h-11 w-full rounded-lg border border-black/10 bg-white/75 px-3 text-sm font-bold uppercase text-orbit-coal outline-none transition focus:border-orbit-orange dark:border-white/10 dark:bg-white/[0.055] dark:text-white"
                      onChange={(event) => setJoinCode(event.target.value)}
                      placeholder="ORB-ABC123"
                      value={joinCode}
                    />
                    <button
                      className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-black/10 bg-white/80 text-sm font-black text-orbit-coal transition hover:-translate-y-0.5 hover:bg-white disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.07] dark:text-white"
                      disabled={!canJoinOrbit}
                      onClick={() => void handleJoinOrbit()}
                      type="button"
                    >
                      {isJoiningOrbit ? (
                        <Loader2
                          aria-hidden
                          className="animate-spin"
                          size={16}
                        />
                      ) : (
                        <Link2 aria-hidden size={16} />
                      )}
                      Join Orbit
                    </button>
                  </label>
                </div>
              </div>
            )}
          </section>
        ) : (
          <section className="rounded-lg border border-black/10 bg-white/88 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.055] sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black uppercase text-orbit-orange">
                  Galaxy
                </p>
                <h3 className="mt-1 text-2xl font-black text-orbit-coal dark:text-white">
                  Public challenges
                </h3>
                <p className="mt-1 text-sm font-bold text-orbit-coal/52 dark:text-white/52">
                  {summary?.galaxySize ?? 0} participants · rank #
                  {summary?.galaxyRank ?? 12}
                </p>
              </div>
              <Rocket aria-hidden className="text-orbit-orange" size={24} />
            </div>

            <div className="mt-5 grid gap-2">
              {isLoadingSummary ? (
                <LoadingPanel
                  description="Finding live challenges for today."
                  rows={4}
                  title="Loading Galaxy"
                />
              ) : galaxyChallenges.length ? (
                galaxyChallenges.map((challenge) => (
                <button
                  className={`rounded-lg border p-4 text-left transition hover:-translate-y-0.5 ${
                    selectedChallenge?.id === challenge.id
                      ? "border-orbit-orange bg-orange-500/10"
                      : "border-black/10 bg-black/[0.025] dark:border-white/10 dark:bg-white/[0.035]"
                  }`}
                  key={challenge.id}
                  onClick={() => setSelectedChallengeId(challenge.id)}
                  type="button"
                >
                  <p className="text-sm font-black text-orbit-coal dark:text-white">
                    {challenge.label}
                  </p>
                  <p className="mt-1 text-xs font-bold text-orbit-coal/50 dark:text-white/50">
                    {challenge.status === "claimed"
                      ? "Claimed"
                      : challenge.status === "claimable"
                        ? "Ready to claim"
                        : challenge.status === "joined"
                          ? "Joined"
                          : "Not joined"}{" "}
                    · {challenge.metricLabel}: {challenge.progressLabel}
                  </p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/[0.07]">
                    <div
                      className="h-full rounded-full bg-orbit-orange"
                      style={{ width: `${challenge.progress}%` }}
                    />
                  </div>
                </button>
                ))
              ) : (
                <EmptyState
                  description="New public challenges will appear here when the next event starts."
                  icon={Rocket}
                  title="No Galaxy challenges yet"
                />
              )}
            </div>
          </section>
        )}

        <aside className="grid gap-4 content-start">
          {activeView === "orbit" && summary?.orbit ? (
            <section className="rounded-lg border border-black/10 bg-white/88 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.055]">
              <h3 className="text-lg font-black text-orbit-coal dark:text-white">
                Settings
              </h3>
              <label className="mt-4 block text-sm font-black text-orbit-coal dark:text-white">
                Orbit name
                <input
                  className="mt-2 h-11 w-full rounded-lg border border-black/10 bg-black/[0.025] px-3 text-sm font-bold text-orbit-coal outline-none transition focus:border-orbit-orange dark:border-white/10 dark:bg-white/[0.035] dark:text-white"
                  onChange={(event) => setOrbitName(event.target.value)}
                  value={orbitName}
                />
              </label>
              <button
                className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-orbit-orange text-sm font-black text-orbit-coal transition hover:-translate-y-0.5 disabled:opacity-60"
                disabled={!canCreateOrbit}
                onClick={() => void handleCreateOrbit()}
                type="button"
              >
                {isCreatingOrbit ? (
                  <Loader2 aria-hidden className="animate-spin" size={16} />
                ) : (
                  <Plus aria-hidden size={16} />
                )}
                Save
              </button>
            </section>
          ) : null}

          {isLoadingSummary ? (
            <section className="rounded-lg border border-black/10 bg-white/88 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.055]">
              <LoadingPanel rows={2} title="Loading challenge" />
            </section>
          ) : selectedChallenge ? (
            <section className="rounded-lg border border-black/10 bg-gradient-to-br from-orbit-orange to-orbit-amber p-5 text-orbit-coal shadow-orbit">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-black uppercase">
                    {activeView === "orbit" ? "Orbit challenge" : "Galaxy challenge"}
                  </p>
                  <p className="mt-4 text-2xl font-black leading-tight">
                    {selectedChallenge.label}
                  </p>
                  <p className="mt-2 text-sm font-bold text-orbit-coal/70">
                    {selectedChallenge.metricLabel}:{" "}
                    {selectedChallenge.progressLabel}
                  </p>
                </div>
                <Sparkles aria-hidden size={32} />
              </div>
              <p className="mt-4 text-sm font-bold leading-6 text-orbit-coal/72">
                {selectedChallenge.description}
              </p>
              <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/35">
                <div
                  className="h-full rounded-full bg-orbit-coal"
                  style={{ width: `${selectedChallenge.progress}%` }}
                />
              </div>
              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="text-sm font-black text-orbit-coal/70">
                  +{selectedChallenge.reward} HP reward
                </p>
                {selectedChallenge.status === "joined" ? (
                  <Link
                    className="inline-flex h-9 items-center justify-center rounded-lg bg-orbit-coal px-3 text-xs font-black text-white transition hover:-translate-y-0.5"
                    href={selectedChallenge.actionHref}
                  >
                    Continue
                  </Link>
                ) : selectedChallenge.status === "claimed" ? (
                  <span className="inline-flex h-9 items-center justify-center rounded-lg bg-orbit-coal/15 px-3 text-xs font-black text-orbit-coal">
                    Claimed
                  </span>
                ) : (
                  <button
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-orbit-coal px-3 text-xs font-black text-white transition hover:-translate-y-0.5 disabled:opacity-65"
                    disabled={isUpdatingChallengeId === selectedChallenge.id}
                    onClick={() => void handleChallengeAction(selectedChallenge)}
                    type="button"
                  >
                    {isUpdatingChallengeId === selectedChallenge.id ? (
                      <Loader2 aria-hidden className="animate-spin" size={14} />
                    ) : null}
                    {selectedChallenge.status === "claimable"
                      ? "Claim"
                      : "Join"}
                  </button>
                )}
              </div>
              <button
                className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-lg border border-orbit-coal/12 bg-white/24 px-3 text-xs font-black text-orbit-coal transition hover:bg-white/34"
                onClick={() => setIsChallengeModalOpen(true)}
                type="button"
              >
                Details
              </button>
            </section>
          ) : (
            <EmptyState
              description="Choose Orbit or Galaxy once challenges are available."
              title="No challenge selected"
            />
          )}

          {activeView === "orbit" &&
          summary?.orbit &&
          summary.activityFeed.length ? (
            <section className="rounded-lg border border-black/10 bg-white/88 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.055]">
              <h3 className="text-lg font-black text-orbit-coal dark:text-white">
                Today
              </h3>
              <div className="mt-3 grid gap-2">
                {summary.activityFeed.map((item) => (
                  <div
                    className="flex items-start gap-3 rounded-lg bg-black/[0.025] px-3 py-3 dark:bg-white/[0.035]"
                    key={item.id}
                  >
                    <span
                      className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                        item.tone === "focus"
                          ? "bg-orange-500"
                          : item.tone === "health"
                            ? "bg-emerald-500"
                            : item.tone === "mission"
                              ? "bg-sky-500"
                              : "bg-orbit-coal/25 dark:bg-white/25"
                      }`}
                    />
                    <p className="text-sm font-bold leading-5 text-orbit-coal/65 dark:text-white/65">
                      <span className="font-black text-orbit-coal dark:text-white">
                        {item.memberName}
                      </span>{" "}
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {activeView === "orbit" && summary?.orbit ? (
            <section className="rounded-lg border border-black/10 bg-white/88 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.055]">
              <h3 className="text-lg font-black text-orbit-coal dark:text-white">
                Orbit challenges
              </h3>
              <div className="mt-3 grid gap-2">
                {orbitChallenges.length ? (
                  orbitChallenges.map((challenge) => (
                  <button
                    className={`rounded-lg border p-3 text-left transition ${
                      selectedChallenge?.id === challenge.id
                        ? "border-orbit-orange bg-orange-500/10"
                        : "border-black/10 bg-black/[0.025] dark:border-white/10 dark:bg-white/[0.035]"
                    }`}
                    key={challenge.id}
                    onClick={() => setSelectedChallengeId(challenge.id)}
                    type="button"
                  >
                    <p className="text-sm font-black text-orbit-coal dark:text-white">
                      {challenge.label}
                    </p>
                    <p className="mt-1 text-xs font-bold text-orbit-coal/50 dark:text-white/50">
                      {challenge.status === "claimed"
                        ? "Claimed"
                        : challenge.status === "claimable"
                          ? "Ready to claim"
                          : challenge.status === "joined"
                            ? "Joined"
                            : "Not joined"}{" "}
                      · {challenge.progressLabel}
                    </p>
                  </button>
                  ))
                ) : (
                  <EmptyState
                    description="Your Orbit challenges will unlock after you create or join an Orbit."
                    icon={HeartHandshake}
                    title="No Orbit challenges yet"
                  />
                )}
              </div>
            </section>
          ) : null}
        </aside>
      </div>

      {isChallengeModalOpen && selectedChallenge ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-orbit-coal/58 px-4 py-6 backdrop-blur-sm">
          <section className="w-full max-w-xl overflow-hidden rounded-lg border border-black/10 bg-white shadow-[0_28px_90px_rgba(0,0,0,0.24)] dark:border-white/10 dark:bg-[#101620]">
            <header className="flex items-start justify-between gap-4 border-b border-black/10 px-5 py-4 dark:border-white/10">
              <div>
                <p className="text-xs font-black uppercase text-orbit-orange">
                  {selectedChallenge.scope === "orbit"
                    ? "Orbit challenge"
                    : "Galaxy challenge"}
                </p>
                <h3 className="mt-1 text-2xl font-black leading-tight text-orbit-coal dark:text-white">
                  {selectedChallenge.label}
                </h3>
              </div>
              <button
                aria-label="Close challenge details"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/10 text-orbit-coal transition hover:bg-black/[0.04] dark:border-white/10 dark:text-white dark:hover:bg-white/[0.07]"
                onClick={() => setIsChallengeModalOpen(false)}
                type="button"
              >
                <X aria-hidden size={18} />
              </button>
            </header>

            <div className="grid gap-4 p-5">
              <p className="text-sm font-bold leading-6 text-orbit-coal/62 dark:text-white/62">
                {selectedChallenge.description}
              </p>

              <div className="rounded-lg border border-orange-300/25 bg-orange-500/10 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase text-orbit-coal/48 dark:text-white/48">
                      Progress
                    </p>
                    <p className="mt-1 text-2xl font-black text-orbit-coal dark:text-white">
                      {selectedChallenge.progressLabel}
                    </p>
                  </div>
                  <span className="rounded-full bg-white/55 px-3 py-1 text-xs font-black text-orbit-coal">
                    {selectedChallenge.progress}%
                  </span>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/[0.08] dark:bg-white/[0.1]">
                  <div
                    className="h-full rounded-full bg-orbit-orange"
                    style={{ width: `${selectedChallenge.progress}%` }}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  {
                    label: "Needed",
                    value:
                      selectedChallenge.status === "claimed"
                        ? "Done"
                        : String(remainingProgress),
                  },
                  {
                    label: "Reward",
                    value: `+${selectedChallenge.reward} HP`,
                  },
                  {
                    label: "State",
                    value:
                      selectedChallenge.status === "claimable"
                        ? "Ready"
                        : selectedChallenge.status,
                  },
                ].map((item) => (
                  <div
                    className="rounded-lg border border-black/10 bg-black/[0.025] p-3 dark:border-white/10 dark:bg-white/[0.035]"
                    key={item.label}
                  >
                    <p className="text-xs font-black uppercase text-orbit-coal/45 dark:text-white/45">
                      {item.label}
                    </p>
                    <p className="mt-1 text-lg font-black capitalize text-orbit-coal dark:text-white">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {selectedChallenge.status === "joined" ? (
                  <Link
                    className="inline-flex h-11 items-center justify-center rounded-lg bg-orbit-orange px-4 text-sm font-black text-orbit-coal transition hover:-translate-y-0.5"
                    href={selectedChallenge.actionHref}
                  >
                    Continue activity
                  </Link>
                ) : selectedChallenge.status === "claimed" ? (
                  <button
                    className="inline-flex h-11 cursor-default items-center justify-center rounded-lg bg-emerald-500 px-4 text-sm font-black text-white"
                    type="button"
                  >
                    Reward claimed
                  </button>
                ) : (
                  <button
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-orbit-orange px-4 text-sm font-black text-orbit-coal transition hover:-translate-y-0.5 disabled:opacity-60"
                    disabled={isUpdatingChallengeId === selectedChallenge.id}
                    onClick={() => void handleChallengeAction(selectedChallenge)}
                    type="button"
                  >
                    {isUpdatingChallengeId === selectedChallenge.id ? (
                      <Loader2 aria-hidden className="animate-spin" size={16} />
                    ) : null}
                    {selectedChallenge.status === "claimable"
                      ? "Claim reward"
                      : "Join challenge"}
                  </button>
                )}
                <Link
                  className="inline-flex h-11 items-center justify-center rounded-lg border border-black/10 bg-white/75 px-4 text-sm font-black text-orbit-coal transition hover:bg-white dark:border-white/10 dark:bg-white/[0.07] dark:text-white dark:hover:bg-white/[0.1]"
                  href={selectedChallenge.actionHref}
                >
                  Open activity
                </Link>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
