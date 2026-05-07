export type MissionType = "focus" | "hydration" | "movement";

export type DailyMission = {
  completedAt: string | null;
  dateKey: string;
  detail: string;
  hp: number;
  id: string;
  proofNote: string;
  proofPublicId: string;
  proofUrl: string;
  status: "completed" | "open";
  title: string;
  type: MissionType;
};

export type DailyMissionsSummary = {
  completedCount: number;
  dateKey: string;
  earnedHpToday: number;
  missions: DailyMission[];
  totalCount: number;
};
