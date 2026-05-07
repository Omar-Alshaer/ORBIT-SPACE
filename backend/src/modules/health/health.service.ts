import { FieldValue } from "firebase-admin/firestore";
import { getFirestoreDb } from "../../config/firebase-admin.js";
import type { AuthenticatedUser } from "../auth/auth.types.js";
import { awardBadgesForUser } from "../gamification/badge.service.js";
import { getOrCreateUserProfile } from "../users/user-profile.service.js";
import type {
  HealthCheckIn,
  HealthSummary,
  SaveHealthCheckInInput,
} from "./health.types.js";

const dailyHealthCollection = "dailyHealth";
const targets = {
  movementMinutes: 30,
  sleepHours: 8,
  waterCups: 8,
};

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getHealthRef(uid: string, dateKey: string) {
  return getFirestoreDb()
    .collection("users")
    .doc(uid)
    .collection(dailyHealthCollection)
    .doc(dateKey);
}

function calculateScore(input: SaveHealthCheckInInput) {
  const hydrationScore =
    Math.min(input.waterCups, targets.waterCups) / targets.waterCups * 35;
  const movementScore =
    Math.min(input.movementMinutes, targets.movementMinutes) /
    targets.movementMinutes *
    30;
  const sleepDistance = Math.abs(input.sleepHours - targets.sleepHours);
  const sleepScore = Math.max(0, 35 - sleepDistance * 10);

  return Math.round(hydrationScore + movementScore + sleepScore);
}

function normalizeCheckIn(
  dateKey: string,
  data?: FirebaseFirestore.DocumentData,
) {
  return {
    dateKey,
    hpAwarded: Number(data?.hpAwarded ?? 0),
    movementMinutes: Number(data?.movementMinutes ?? 0),
    note: String(data?.note ?? ""),
    score: Number(data?.score ?? 0),
    sleepHours: Number(data?.sleepHours ?? 0),
    updatedAt: String(data?.updatedAt ?? ""),
    waterCups: Number(data?.waterCups ?? 0),
  } satisfies HealthCheckIn;
}

function toSummary(dateKey: string, checkIn: HealthCheckIn) {
  return {
    checkIn,
    dateKey,
    targets,
  } satisfies HealthSummary;
}

export async function getHealthSummary(user: AuthenticatedUser) {
  await getOrCreateUserProfile(user);

  const dateKey = getTodayKey();
  const snapshot = await getHealthRef(user.uid, dateKey).get();
  const checkIn = normalizeCheckIn(dateKey, snapshot.data());

  return toSummary(dateKey, checkIn);
}

export async function saveHealthCheckIn(
  user: AuthenticatedUser,
  input: SaveHealthCheckInInput,
) {
  const db = getFirestoreDb();
  const dateKey = getTodayKey();
  const now = new Date().toISOString();
  const healthRef = getHealthRef(user.uid, dateKey);
  const profileRef = db.collection("users").doc(user.uid);
  const profile = await getOrCreateUserProfile(user);
  const score = calculateScore(input);
  const computedHp = Math.round(score * 0.7);

  const savedCheckIn = await db.runTransaction(async (transaction) => {
    const healthSnapshot = await transaction.get(healthRef);
    const existing = normalizeCheckIn(dateKey, healthSnapshot.data());
    const hpAwarded = Math.max(existing.hpAwarded, computedHp);
    const hpDelta = Math.max(0, hpAwarded - existing.hpAwarded);
    const checkIn: HealthCheckIn = {
      dateKey,
      hpAwarded,
      movementMinutes: input.movementMinutes,
      note: input.note?.trim() ?? "",
      score,
      sleepHours: input.sleepHours,
      updatedAt: now,
      waterCups: input.waterCups,
    };

    transaction.set(healthRef, checkIn, { merge: true });

    if (hpDelta > 0) {
      transaction.set(
        profileRef,
        {
          hp: FieldValue.increment(hpDelta),
          lastSeenAt: now,
          streak: Math.max(Number(profile.streak ?? 0), 1),
          updatedAt: now,
        },
        { merge: true },
      );
    } else {
      transaction.set(
        profileRef,
        {
          lastSeenAt: now,
          updatedAt: now,
        },
        { merge: true },
      );
    }

    return checkIn;
  });

  await awardBadgesForUser(user.uid, ["health"]);

  return toSummary(dateKey, savedCheckIn);
}
