"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  CheckCircle2,
  CircleDashed,
  Flame,
  ImageUp,
  Loader2,
  Search,
  Trophy,
  UploadCloud,
  X,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import type { DailyMission, DailyMissionsSummary } from "@/lib/daily-missions";
import { orbitApi } from "@/lib/orbit-api";

type MissionFilter = "all" | "open" | "completed";

const missionTypeLabel: Record<DailyMission["type"], string> = {
  focus: "Focus",
  hydration: "Hydration",
  movement: "Movement",
};

export function MissionsWorkspace() {
  const { profile, refreshServerSession, serverAuthStatus } = useAuth();
  const [dailySummary, setDailySummary] =
    useState<DailyMissionsSummary | null>(null);
  const [selectedMissionId, setSelectedMissionId] = useState("");
  const [activeFilter, setActiveFilter] = useState<MissionFilter>("all");
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [isCompleting, setIsCompleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingProofFile, setPendingProofFile] = useState<File | null>(null);
  const [proofPreviewUrl, setProofPreviewUrl] = useState("");
  const [proofNote, setProofNote] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const missions = useMemo(
    () => dailySummary?.missions ?? [],
    [dailySummary?.missions],
  );
  const completedCount = dailySummary?.completedCount ?? 0;
  const totalCount = dailySummary?.totalCount ?? 0;
  const earnedHpToday = dailySummary?.earnedHpToday ?? 0;
  const openCount = Math.max(totalCount - completedCount, 0);
  const progress =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const filteredMissions = useMemo(() => {
    return missions.filter((mission) => {
      const matchesFilter =
        activeFilter === "all" ||
        (activeFilter === "open" && mission.status === "open") ||
        (activeFilter === "completed" && mission.status === "completed");
      const matchesQuery = `${mission.title} ${mission.detail}`
        .toLowerCase()
        .includes(query.trim().toLowerCase());

      return matchesFilter && matchesQuery;
    });
  }, [activeFilter, missions, query]);

  const selectedMission =
    missions.find((mission) => mission.id === selectedMissionId) ??
    filteredMissions[0] ??
    missions[0];

  useEffect(() => {
    if (serverAuthStatus !== "authenticated") {
      return;
    }

    let isMounted = true;

    async function loadMissions() {
      setMessage("");

      try {
        const payload = await orbitApi<{ summary: DailyMissionsSummary }>(
          "/api/missions/daily",
          { withAuth: true },
        );

        if (!isMounted) {
          return;
        }

        setDailySummary(payload.summary);
        setSelectedMissionId(
          (currentMissionId) =>
            currentMissionId ||
            payload.summary.missions.find((mission) => mission.status === "open")
              ?.id ||
            payload.summary.missions[0]?.id ||
            "",
        );
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setMessage(
          error instanceof Error
            ? error.message
            : "We could not load your missions right now.",
        );
      }
    }

    void loadMissions();

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

  async function completeMission(mission: DailyMission) {
    if (mission.status === "completed") {
      return;
    }

    setMessage("");
    setIsCompleting(true);

    try {
      const payload = await orbitApi<{ summary: DailyMissionsSummary }>(
        `/api/missions/daily/${mission.id}/complete`,
        { method: "POST", withAuth: true },
      );

      setDailySummary(payload.summary);
      await refreshServerSession();
      setMessage("Mission complete. HP added.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "We could not complete this mission.",
      );
    } finally {
      setIsCompleting(false);
    }
  }

  async function uploadProof() {
    if (!selectedMission || !pendingProofFile) {
      return;
    }

    setMessage("");
    setIsUploading(true);

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
      setMessage("Proof saved. Mission complete.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "We could not save this proof.",
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-lg border border-black/10 bg-white/88 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.055]">
          <div className="grid gap-5 lg:grid-cols-[1fr_220px] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase text-orbit-orange">
                Missions
              </p>
              <h2 className="mt-2 text-3xl font-black leading-tight text-orbit-coal dark:text-white sm:text-4xl">
                Finish today&apos;s queue with proof-backed wins.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-orbit-coal/60 dark:text-white/60">
                Choose what fits your day, complete it once, and keep your HP
                moving.
              </p>
            </div>
            <div className="relative mx-auto hidden aspect-square w-full max-w-[190px] lg:block">
              <div className="absolute inset-4 rounded-full border border-dashed border-orbit-orange/32" />
              <Image
                alt="ORBIT mission mascot"
                className="absolute inset-0 h-full w-full object-contain drop-shadow-2xl"
                height={240}
                src="/assets/Mascots/mas2.svg"
                width={240}
              />
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-black/10 bg-gradient-to-br from-orbit-orange to-orbit-amber p-5 text-orbit-coal shadow-orbit">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-black uppercase">Today&apos;s score</p>
              <p className="mt-4 text-6xl font-black leading-none">{progress}%</p>
            </div>
            <Trophy aria-hidden size={34} />
          </div>
          <div className="mt-5 h-3 rounded-full bg-white/35">
            <div
              className="h-full rounded-full bg-orbit-coal transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {[
              [`${completedCount}/${totalCount || 3}`, "Done"],
              [`${openCount}`, "Open"],
              [`+${earnedHpToday}`, "HP today"],
            ].map(([value, label]) => (
              <div className="rounded-lg bg-white/28 px-3 py-3" key={label}>
                <p className="text-lg font-black leading-none">{value}</p>
                <p className="mt-1 text-xs font-black text-orbit-coal/62">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-black/10 bg-white/88 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.055] xl:col-span-2">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="relative">
              <Search
                aria-hidden
                className="absolute left-4 top-1/2 -translate-y-1/2 text-orbit-coal/35 dark:text-white/35"
                size={18}
              />
              <input
                className="h-11 w-full rounded-lg border border-black/10 bg-white/78 pl-11 pr-4 text-sm font-bold text-orbit-coal outline-none transition placeholder:text-orbit-coal/35 focus:border-orbit-orange focus:ring-4 focus:ring-orange-500/12 dark:border-white/10 dark:bg-white/[0.055] dark:text-white dark:placeholder:text-white/32"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search missions"
                value={query}
              />
            </div>
            <div className="grid grid-cols-3 gap-1 rounded-lg border border-black/10 bg-black/[0.025] p-1 dark:border-white/10 dark:bg-white/[0.035]">
              {[
                ["all", "All"],
                ["open", "Open"],
                ["completed", "Done"],
              ].map(([value, label]) => (
                <button
                  className={`h-9 rounded-md px-3 text-sm font-black transition ${
                    activeFilter === value
                      ? "bg-orbit-coal text-white dark:bg-white dark:text-orbit-coal"
                      : "text-orbit-coal/58 hover:bg-black/[0.04] dark:text-white/58 dark:hover:bg-white/[0.07]"
                  }`}
                  key={value}
                  onClick={() => setActiveFilter(value as MissionFilter)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {message ? (
            <div className="mt-4 rounded-lg border border-orange-300/25 bg-orange-500/10 px-4 py-3 text-sm font-bold text-orbit-coal dark:text-white">
              {message}
            </div>
          ) : null}
        </section>

        <section className="grid gap-4 xl:col-span-2 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="grid gap-3">
            {filteredMissions.map((mission) => {
              const isSelected = selectedMission?.id === mission.id;
              const isCompleted = mission.status === "completed";

              return (
                <button
                  className={`grid gap-4 rounded-lg border bg-white/88 p-4 text-left shadow-sm transition hover:-translate-y-0.5 dark:bg-white/[0.055] sm:grid-cols-[auto_1fr_auto] sm:items-center ${
                    isSelected
                      ? "border-orbit-orange shadow-[0_16px_45px_rgba(255,122,0,0.12)]"
                      : "border-black/10 dark:border-white/10"
                  }`}
                  key={mission.id}
                  onClick={() => setSelectedMissionId(mission.id)}
                  type="button"
                >
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-lg ${
                      isCompleted
                        ? "bg-emerald-500 text-white"
                        : "bg-gradient-to-br from-orbit-orange to-orbit-amber text-orbit-coal"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 aria-hidden size={20} />
                    ) : (
                      <CircleDashed aria-hidden size={20} />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-black text-orbit-coal dark:text-white">
                        {mission.title}
                      </span>
                      <span className="rounded-full bg-black/[0.055] px-2.5 py-1 text-xs font-black text-orbit-coal/52 dark:bg-white/[0.08] dark:text-white/52">
                        {missionTypeLabel[mission.type]}
                      </span>
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-orbit-coal/58 dark:text-white/58">
                      {mission.detail}
                    </span>
                  </span>
                  <span className="flex items-center gap-2 sm:justify-end">
                    <span className="rounded-full bg-orbit-coal px-3 py-1 text-xs font-black text-white dark:bg-white dark:text-orbit-coal">
                      +{mission.hp} HP
                    </span>
                    <span className="text-xs font-black uppercase text-orbit-orange">
                      {isCompleted
                        ? mission.proofUrl
                          ? "Photo saved"
                          : "Complete"
                        : "Ready"}
                    </span>
                  </span>
                </button>
              );
            })}

            {!filteredMissions.length ? (
              <div className="rounded-lg border border-black/10 bg-white/88 p-5 text-sm font-bold text-orbit-coal/58 dark:border-white/10 dark:bg-white/[0.055] dark:text-white/58">
                No missions match this view.
              </div>
            ) : null}
          </div>

          <aside className="rounded-lg border border-black/10 bg-white/88 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.055]">
            <p className="text-sm font-black uppercase text-orbit-orange">
              Mission details
            </p>
            <h3 className="mt-2 text-2xl font-black text-orbit-coal dark:text-white">
              {selectedMission?.title ?? "Select a mission"}
            </h3>
            <p className="mt-2 text-sm leading-6 text-orbit-coal/58 dark:text-white/58">
              {selectedMission?.detail ??
                "Pick a mission to review the next action."}
            </p>

            <div className="mt-5 grid gap-2">
              <button
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orbit-orange to-orbit-amber px-4 text-sm font-black text-orbit-coal shadow-orbit transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-55"
                disabled={
                  !selectedMission ||
                  selectedMission.status === "completed" ||
                  isCompleting
                }
                onClick={() =>
                  selectedMission ? void completeMission(selectedMission) : null
                }
                type="button"
              >
                {isCompleting ? (
                  <Loader2 aria-hidden className="animate-spin" size={17} />
                ) : (
                  <Flame aria-hidden size={17} />
                )}
                Complete mission
              </button>
              <button
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-black/10 bg-white/75 px-4 text-sm font-black text-orbit-coal transition hover:-translate-y-0.5 hover:bg-white disabled:cursor-not-allowed disabled:opacity-55 dark:border-white/10 dark:bg-white/[0.07] dark:text-white dark:hover:bg-white/[0.1]"
                disabled={
                  !selectedMission ||
                  selectedMission.status === "completed" ||
                  isUploading
                }
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                <Camera aria-hidden size={17} />
                Add photo
              </button>
              <input
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    setPendingProofFile(file);
                    setProofNote(
                      selectedMission ? `Photo for ${selectedMission.title}` : "",
                    );
                  }
                }}
                ref={fileInputRef}
                type="file"
              />
            </div>

            <div className="mt-5 rounded-lg border border-black/10 bg-black/[0.025] p-4 dark:border-white/10 dark:bg-white/[0.035]">
              <p className="text-xs font-black uppercase text-orbit-coal/44 dark:text-white/44">
                Reward
              </p>
              <p className="mt-1 text-sm font-black text-orbit-coal dark:text-white">
                {selectedMission ? `+${selectedMission.hp} HP` : "Choose a mission"}
              </p>
            </div>
          </aside>
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
                aria-label="Close upload confirmation"
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
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orbit-orange to-orbit-amber px-4 text-sm font-black text-orbit-coal shadow-orbit transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isUploading}
                  onClick={() => void uploadProof()}
                  type="button"
                >
                  {isUploading ? (
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
