export type FocusSession = {
  completedAt: string;
  dateKey: string;
  hp: number;
  id: string;
  minutes: number;
  note: string;
  planId: string;
  planName: string;
};

export type FocusSummary = {
  dateKey: string;
  earnedHpToday: number;
  sessions: FocusSession[];
  totalMinutes: number;
};

export type CompleteFocusSessionInput = {
  hp: number;
  minutes: number;
  note?: string;
  planId: string;
  planName: string;
};
