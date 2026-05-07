"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  AtSign,
  BadgeCheck,
  CalendarDays,
  Camera,
  Check,
  CheckCircle2,
  Edit3,
  Flame,
  Loader2,
  Mail,
  Save,
  Shield,
  Sparkles,
  Timer,
  Trophy,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/components/auth/AuthProvider";
import { EmptyState, ErrorNotice, LoadingPanel } from "@/components/app/UiStates";
import type { DailyMission, DailyMissionsSummary } from "@/lib/daily-missions";
import { orbitApi } from "@/lib/orbit-api";
import type { UserProfile } from "@/lib/user-profile";

const mascotAvatars = [
  "/assets/Mascots/mas1.svg",
  "/assets/Mascots/mas3.svg",
  "/assets/Mascots/mas6.svg",
  "/assets/Mascots/mas8.svg",
  "/assets/Mascots/mas10.svg",
];

function formatDate(value?: string) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getDefaultAvatar(uid?: string) {
  if (!uid) {
    return mascotAvatars[0];
  }

  const seed = Array.from(uid).reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );

  return `/assets/Mascots/mas${(seed % 10) + 1}.svg`;
}

function getInitialUsername(profile: UserProfile | null, email?: string | null) {
  if (profile?.username) {
    return profile.username;
  }

  const emailName = email?.split("@")[0] ?? "";
  const cleanEmailName = emailName
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 24);

  return cleanEmailName.length >= 3 ? cleanEmailName : "orbit_member";
}

type ProfileEditModalProps = {
  accountPhoto: string;
  avatar: string;
  displayName: string;
  onClose: () => void;
  onSaved: () => void;
  username: string;
};

type RewardItem = {
  claimedAt: string | null;
  id: string;
  label: string;
  reward: number;
  scope: "galaxy" | "orbit";
  startedAt: string | null;
  status: "claimed" | "joined";
};

type RewardsSummary = {
  claimedCount: number;
  rewards: RewardItem[];
  totalClaimedHp: number;
};

type ActivityItem = {
  at: string;
  description: string;
  hp: number;
  id: string;
  label: string;
  type: "focus" | "health" | "mission" | "reward";
};

type ActivitySummary = {
  items: ActivityItem[];
};

function ProfileEditModal({
  accountPhoto,
  avatar,
  displayName,
  onClose,
  onSaved,
  username,
}: ProfileEditModalProps) {
  const [draftDisplayName, setDraftDisplayName] = useState(displayName);
  const [draftUsername, setDraftUsername] = useState(username);
  const [draftPhotoURL, setDraftPhotoURL] = useState(avatar);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const avatarOptions = useMemo(() => {
    const options = [accountPhoto, avatar, ...mascotAvatars].filter(Boolean);

    return Array.from(new Set(options));
  }, [accountPhoto, avatar]);

  async function handleSave() {
    setIsSaving(true);
    setMessage("");

    try {
      await orbitApi<{ profile: UserProfile }>("/api/users/me", {
        body: JSON.stringify({
          displayName: draftDisplayName,
          photoURL: draftPhotoURL,
          username: draftUsername,
        }),
        method: "PATCH",
        withAuth: true,
      });

      onSaved();
      onClose();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "We could not save these changes.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-orbit-coal/70 px-4 py-6 backdrop-blur-xl">
      <motion.div
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-xl overflow-hidden rounded-lg border border-white/14 bg-white p-5 shadow-orbit dark:bg-[#10151d]"
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase text-orbit-orange">
              Edit profile
            </p>
            <h3 className="mt-2 text-2xl font-black text-orbit-coal dark:text-white">
              Make it feel like you
            </h3>
          </div>
          <button
            aria-label="Close edit profile"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-black/10 text-orbit-coal transition hover:bg-black/[0.04] dark:border-white/10 dark:text-white dark:hover:bg-white/[0.07]"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden size={18} />
          </button>
        </div>

        <div className="mt-6 grid gap-5">
          <div>
            <label
              className="text-sm font-black text-orbit-coal dark:text-white"
              htmlFor="profile-display-name"
            >
              Name
            </label>
            <input
              className="mt-2 h-12 w-full rounded-lg border border-black/10 bg-black/[0.025] px-4 text-sm font-bold text-orbit-coal outline-none transition focus:border-orbit-orange dark:border-white/10 dark:bg-white/[0.055] dark:text-white"
              id="profile-display-name"
              maxLength={60}
              minLength={2}
              onChange={(event) => setDraftDisplayName(event.target.value)}
              value={draftDisplayName}
            />
          </div>

          <div>
            <label
              className="text-sm font-black text-orbit-coal dark:text-white"
              htmlFor="profile-username"
            >
              Username
            </label>
            <div className="mt-2 flex h-12 items-center gap-2 rounded-lg border border-black/10 bg-black/[0.025] px-4 transition focus-within:border-orbit-orange dark:border-white/10 dark:bg-white/[0.055]">
              <AtSign
                aria-hidden
                className="shrink-0 text-orbit-orange"
                size={17}
              />
              <input
                className="h-full min-w-0 flex-1 bg-transparent text-sm font-bold text-orbit-coal outline-none dark:text-white"
                id="profile-username"
                maxLength={24}
                minLength={3}
                onChange={(event) =>
                  setDraftUsername(
                    event.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9_]+/g, "_")
                      .replace(/_+/g, "_"),
                  )
                }
                value={draftUsername}
              />
            </div>
            <p className="mt-2 text-xs font-bold text-orbit-coal/52 dark:text-white/52">
              Letters, numbers, and underscores only.
            </p>
          </div>

          <div>
            <p className="text-sm font-black text-orbit-coal dark:text-white">
              Profile photo
            </p>
            <div className="mt-3 grid grid-cols-5 gap-3">
              {avatarOptions.map((option) => {
                const isSelected = option === draftPhotoURL;

                return (
                  <button
                    aria-label="Choose profile photo"
                    className={`relative aspect-square overflow-hidden rounded-lg border transition ${
                      isSelected
                        ? "border-orbit-orange shadow-[0_0_0_3px_rgba(255,122,0,0.18)]"
                        : "border-black/10 hover:-translate-y-0.5 dark:border-white/10"
                    }`}
                    key={option}
                    onClick={() => setDraftPhotoURL(option)}
                    type="button"
                  >
                    <Image
                      alt="Profile option"
                      className="h-full w-full object-cover"
                      height={96}
                      src={option}
                      unoptimized
                      width={96}
                    />
                    {isSelected ? (
                      <span className="absolute right-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-orbit-orange text-orbit-coal">
                        <Check aria-hidden size={14} />
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
            {accountPhoto ? (
              <p className="mt-2 text-xs font-bold text-orbit-coal/52 dark:text-white/52">
                Your account photo is available as the first option.
              </p>
            ) : null}
          </div>
        </div>

        {message ? (
          <p className="mt-4 rounded-lg border border-orange-300/30 bg-orange-500/10 px-4 py-3 text-sm font-bold text-orbit-coal dark:text-white">
            {message}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            className="inline-flex h-11 items-center justify-center rounded-lg border border-black/10 px-4 text-sm font-black text-orbit-coal transition hover:bg-black/[0.04] dark:border-white/10 dark:text-white dark:hover:bg-white/[0.07]"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-orbit-orange px-5 text-sm font-black text-orbit-coal transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSaving}
            onClick={() => void handleSave()}
            type="button"
          >
            {isSaving ? (
              <Loader2 aria-hidden className="animate-spin" size={17} />
            ) : (
              <Save aria-hidden size={17} />
            )}
            Save changes
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export function ProfileWorkspace() {
  const {
    profile,
    profileError,
    profileStatus,
    refreshServerSession,
    serverAuthStatus,
    user,
  } = useAuth();
  const [dailySummary, setDailySummary] =
    useState<DailyMissionsSummary | null>(null);
  const [rewardsSummary, setRewardsSummary] = useState<RewardsSummary | null>(
    null,
  );
  const [activitySummary, setActivitySummary] =
    useState<ActivitySummary | null>(null);
  const [message, setMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isLoadingProfileActivity, setIsLoadingProfileActivity] = useState(true);

  const displayName =
    profile?.displayName || user?.displayName || profile?.email || "ORBIT user";
  const email = profile?.email || user?.email || "No email added";
  const username = getInitialUsername(profile, profile?.email || user?.email);
  const avatar =
    profile?.photoURL || user?.photoURL || getDefaultAvatar(profile?.uid || user?.uid);
  const accountPhoto = user?.photoURL ?? "";
  const badges = profile?.badges ?? [];
  const completedMissions = useMemo(
    () =>
      (dailySummary?.missions ?? []).filter(
        (mission) => mission.status === "completed",
      ),
    [dailySummary?.missions],
  );
  const savedPhotos = useMemo(
    () =>
      completedMissions.filter(
        (mission): mission is DailyMission & { proofUrl: string } =>
          Boolean(mission.proofUrl),
      ),
    [completedMissions],
  );
  const rewards = rewardsSummary?.rewards ?? [];
  const activityItems = activitySummary?.items ?? [];

  useEffect(() => {
    if (serverAuthStatus !== "authenticated") {
      return;
    }

    let isMounted = true;

    async function loadProfileActivity() {
      setIsLoadingProfileActivity(true);
      setMessage("");

      try {
        const [missionsPayload, rewardsPayload, activityPayload] =
          await Promise.all([
            orbitApi<{ summary: DailyMissionsSummary }>("/api/missions/daily", {
              withAuth: true,
            }),
            orbitApi<{ rewards: RewardsSummary }>("/api/users/rewards", {
              withAuth: true,
            }),
            orbitApi<{ activity: ActivitySummary }>("/api/users/activity", {
              withAuth: true,
            }),
          ]);

        if (!isMounted) {
          return;
        }

        setDailySummary(missionsPayload.summary);
        setRewardsSummary(rewardsPayload.rewards);
        setActivitySummary(activityPayload.activity);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setMessage(
          error instanceof Error
            ? error.message
            : "We could not load your recent activity.",
        );
      } finally {
        if (isMounted) {
          setIsLoadingProfileActivity(false);
        }
      }
    }

    void loadProfileActivity();

    return () => {
      isMounted = false;
    };
  }, [serverAuthStatus]);

  async function handleProfileSaved() {
    setMessage("Profile saved.");
    await refreshServerSession();
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="relative overflow-hidden rounded-lg border border-black/10 bg-white/88 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.055]">
        <div className="absolute right-8 top-6 h-44 w-44 rounded-full bg-orange-400/10 blur-3xl" />
        <div className="relative grid gap-5 lg:grid-cols-[auto_1fr_auto] lg:items-center">
          <div className="relative h-24 w-24 overflow-hidden rounded-lg border border-black/10 bg-gradient-to-br from-orbit-orange to-orbit-amber dark:border-white/10">
            <Image
              alt={`${displayName} avatar`}
              className="h-full w-full object-cover"
              height={140}
              src={avatar}
              unoptimized
              width={140}
            />
          </div>

          <div className="min-w-0">
            <p className="text-sm font-black uppercase text-orbit-orange">
              Profile
            </p>
            <h2 className="mt-2 break-words text-3xl font-black leading-tight text-orbit-coal dark:text-white sm:text-4xl">
              {displayName}
            </h2>
            <div className="mt-3 flex flex-col gap-2 text-sm font-bold text-orbit-coal/58 dark:text-white/58 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <p className="flex min-w-0 items-center gap-2">
                <AtSign aria-hidden size={16} />
                <span className="truncate">@{username}</span>
              </p>
              <p className="flex min-w-0 items-center gap-2">
                <Mail aria-hidden size={16} />
                <span className="truncate">{email}</span>
              </p>
            </div>
          </div>

          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-orbit-orange px-4 text-sm font-black text-orbit-coal transition hover:-translate-y-0.5 hover:bg-orbit-amber"
            onClick={() => setIsEditing(true)}
            type="button"
          >
            <Edit3 aria-hidden size={17} />
            Edit
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-black/10 bg-gradient-to-br from-orbit-orange to-orbit-amber p-5 text-orbit-coal shadow-orbit">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-black uppercase">Health Points</p>
            <p className="mt-4 text-6xl font-black leading-none">
              {(profile?.hp ?? 0).toLocaleString()}
            </p>
          </div>
          <Trophy aria-hidden size={34} />
        </div>
        <p className="mt-5 text-sm font-bold text-orbit-coal/70">
          {profileStatus === "ready"
            ? "Your progress is up to date."
            : "Refreshing your progress."}
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:col-span-2 lg:grid-cols-4">
        {[
          {
            icon: Flame,
            label: "Streak",
            value: `${profile?.streak ?? 0} day${profile?.streak === 1 ? "" : "s"}`,
          },
          {
            icon: CheckCircle2,
            label: "Completed today",
            value: String(dailySummary?.completedCount ?? 0),
          },
          {
            icon: Camera,
            label: "Photos saved",
            value: String(savedPhotos.length),
          },
          {
            icon: BadgeCheck,
            label: "Badges",
            value: String(badges.length),
          },
          {
            icon: Trophy,
            label: "Challenge HP",
            value: `+${rewardsSummary?.totalClaimedHp ?? 0}`,
          },
        ].map((metric) => {
          const Icon = metric.icon;

          return (
            <article
              className="rounded-lg border border-black/10 bg-white/88 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.055]"
              key={metric.label}
            >
              <Icon aria-hidden className="text-orbit-orange" size={22} />
              <p className="mt-4 text-sm font-bold text-orbit-coal/55 dark:text-white/55">
                {metric.label}
              </p>
              <p className="mt-1 text-3xl font-black text-orbit-coal dark:text-white">
                {metric.value}
              </p>
            </article>
          );
        })}
      </section>

      <section className="rounded-lg border border-black/10 bg-white/88 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.055]">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xl font-black text-orbit-coal dark:text-white">
            Account details
          </h3>
          <Shield aria-hidden className="text-orbit-orange" size={22} />
        </div>

        <div className="mt-5 grid gap-3">
          {[
            ["Joined", formatDate(profile?.createdAt)],
            ["Last active", formatDate(profile?.lastSeenAt)],
            ["Updated", formatDate(profile?.updatedAt)],
          ].map(([label, value]) => (
            <div
              className="flex items-center justify-between gap-4 rounded-lg border border-black/10 bg-black/[0.025] px-4 py-3 dark:border-white/10 dark:bg-white/[0.035]"
              key={label}
            >
              <span className="text-sm font-bold text-orbit-coal/55 dark:text-white/55">
                {label}
              </span>
              <span className="text-right text-sm font-black text-orbit-coal dark:text-white">
                {value}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-lg border border-black/10 bg-white/88 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.055] xl:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-orbit-coal dark:text-white">
              Activity timeline
            </h3>
            <Timer aria-hidden className="text-orbit-orange" size={22} />
          </div>
          <div className="mt-5 grid gap-3">
            {isLoadingProfileActivity ? (
              <LoadingPanel rows={4} title="Loading recent activity" />
            ) : activityItems.length ? (
              activityItems.map((item) => (
                <div
                  className="grid gap-3 rounded-lg border border-black/10 bg-black/[0.025] px-4 py-3 dark:border-white/10 dark:bg-white/[0.035] sm:grid-cols-[auto_1fr_auto]"
                  key={item.id}
                >
                  <span
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${
                      item.type === "reward"
                        ? "bg-orbit-orange text-orbit-coal"
                        : "bg-orange-500/12 text-orbit-orange"
                    }`}
                  >
                    {item.type === "focus" ? (
                      <Timer aria-hidden size={16} />
                    ) : item.type === "health" ? (
                      <Shield aria-hidden size={16} />
                    ) : item.type === "mission" ? (
                      <CheckCircle2 aria-hidden size={16} />
                    ) : (
                      <Trophy aria-hidden size={16} />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-orbit-coal dark:text-white">
                      {item.label}
                    </p>
                    <p className="mt-1 text-xs font-bold text-orbit-coal/50 dark:text-white/50">
                      {item.description} · {formatDate(item.at)}
                    </p>
                  </div>
                  <span className="text-sm font-black text-orbit-orange">
                    +{item.hp}
                  </span>
                </div>
              ))
            ) : (
              <EmptyState
                description="Complete a focus session, health check-in, mission, or challenge reward to build your timeline."
                title="No activity yet"
              />
            )}
          </div>
        </article>

        <article className="rounded-lg border border-black/10 bg-white/88 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.055]">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-orbit-coal dark:text-white">
              Rewards history
            </h3>
            <Trophy aria-hidden className="text-orbit-orange" size={22} />
          </div>
          <div className="mt-5 grid gap-3">
            {isLoadingProfileActivity ? (
              <LoadingPanel rows={3} title="Loading rewards" />
            ) : rewards.length ? (
              rewards.map((reward) => (
                <div
                  className="flex items-center gap-3 rounded-lg border border-black/10 bg-black/[0.025] px-4 py-3 dark:border-white/10 dark:bg-white/[0.035]"
                  key={reward.id}
                >
                  <span
                    className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                      reward.status === "claimed"
                        ? "bg-orbit-orange text-orbit-coal"
                        : "bg-black/[0.06] text-orbit-orange dark:bg-white/[0.07]"
                    }`}
                  >
                    <Trophy aria-hidden size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-orbit-coal dark:text-white">
                      {reward.label}
                    </p>
                    <p className="mt-1 text-xs font-bold capitalize text-orbit-coal/50 dark:text-white/50">
                      {reward.scope} ·{" "}
                      {reward.status === "claimed"
                        ? formatDate(reward.claimedAt ?? "")
                        : "Joined"}
                    </p>
                  </div>
                  <span className="text-sm font-black text-orbit-orange">
                    {reward.status === "claimed" ? `+${reward.reward}` : "..."}
                  </span>
                </div>
              ))
            ) : (
              <EmptyState
                description="Join community challenges and claim completed rewards to fill this shelf."
                title="No rewards claimed"
              />
            )}
          </div>
        </article>

        <article className="rounded-lg border border-black/10 bg-white/88 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.055]">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-orbit-coal dark:text-white">
              Badge shelf
            </h3>
            <Sparkles aria-hidden className="text-orbit-orange" size={22} />
          </div>
          <div className="mt-5 grid gap-3">
            {badges.length ? (
              badges.map((badge) => (
                <div
                  className="flex items-center gap-3 rounded-lg border border-orange-300/20 bg-gradient-to-r from-orange-500/10 to-transparent px-4 py-3 text-sm font-black text-orbit-coal dark:border-white/10 dark:from-orange-400/12 dark:text-white"
                  key={badge}
                >
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orbit-orange text-orbit-coal">
                    <Sparkles aria-hidden size={16} />
                  </span>
                  <span>{badge}</span>
                </div>
              ))
            ) : (
              <EmptyState
                description="Badges appear as you complete focus, health, and mission milestones."
                title="Badge shelf is waiting"
              />
            )}
          </div>
        </article>

        <article className="rounded-lg border border-black/10 bg-white/88 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.055]">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-orbit-coal dark:text-white">
              Recent photos
            </h3>
            <Camera aria-hidden className="text-orbit-orange" size={22} />
          </div>
          <div className="mt-5 grid gap-3">
            {isLoadingProfileActivity ? (
              <LoadingPanel rows={3} title="Loading saved photos" />
            ) : savedPhotos.length ? (
              savedPhotos.map((mission) => (
                <div
                  className="grid grid-cols-[72px_1fr] gap-3 rounded-lg border border-black/10 bg-black/[0.025] p-2 dark:border-white/10 dark:bg-white/[0.035]"
                  key={mission.id}
                >
                  <Image
                    alt={`${mission.title} photo`}
                    className="h-[72px] w-[72px] rounded-md object-cover"
                    height={72}
                    src={mission.proofUrl}
                    unoptimized
                    width={72}
                  />
                  <div className="min-w-0 py-1">
                    <p className="truncate text-sm font-black text-orbit-coal dark:text-white">
                      {mission.title}
                    </p>
                    <p className="mt-1 text-xs font-bold text-orbit-coal/50 dark:text-white/50">
                      {mission.completedAt
                        ? formatDate(mission.completedAt)
                        : "Saved today"}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                description="Mission photos you upload today will show up here."
                title="No photos saved today"
              />
            )}
          </div>
        </article>
      </section>

      {message || profileError ? (
        <div className="xl:col-span-2">
          <ErrorNotice message={message || profileError || ""} />
        </div>
      ) : null}

      <section className="rounded-lg border border-black/10 bg-white/88 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.055] xl:col-span-2">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-xl font-black text-orbit-coal dark:text-white">
              Keep your profile warm
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-orbit-coal/58 dark:text-white/58">
              Complete a mission, save a photo, or start a focus block to keep
              this profile growing.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-black/[0.035] px-4 py-3 dark:bg-white/[0.055]">
            <CalendarDays aria-hidden className="text-orbit-orange" size={20} />
            <span className="text-sm font-black text-orbit-coal dark:text-white">
              {dailySummary?.dateKey ?? "Today"}
            </span>
          </div>
        </div>
      </section>

      {isEditing ? (
        <ProfileEditModal
          accountPhoto={accountPhoto}
          avatar={avatar}
          displayName={displayName}
          onClose={() => setIsEditing(false)}
          onSaved={() => {
            void handleProfileSaved();
          }}
          username={username}
        />
      ) : null}
    </div>
  );
}
