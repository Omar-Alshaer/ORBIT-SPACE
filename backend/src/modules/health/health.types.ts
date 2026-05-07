export type HealthCheckIn = {
  dateKey: string;
  hpAwarded: number;
  movementMinutes: number;
  note: string;
  score: number;
  sleepHours: number;
  updatedAt: string;
  waterCups: number;
};

export type HealthSummary = {
  dateKey: string;
  checkIn: HealthCheckIn;
  targets: {
    movementMinutes: number;
    sleepHours: number;
    waterCups: number;
  };
};

export type SaveHealthCheckInInput = {
  movementMinutes: number;
  note?: string;
  sleepHours: number;
  waterCups: number;
};
