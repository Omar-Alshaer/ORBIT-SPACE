import { FieldValue } from "firebase-admin/firestore";
import { getFirestoreDb } from "../../config/firebase-admin.js";
import type { AuthenticatedUser } from "../auth/auth.types.js";
import { awardBadgesForUser } from "../gamification/badge.service.js";
import { getOrCreateUserProfile } from "../users/user-profile.service.js";
import type {
  CompleteFocusSessionInput,
  FocusSession,
  FocusSummary,
} from "./focus.types.js";

const focusSessionsCollection = "focusSessions";

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getFocusSessionsRef(uid: string) {
  return getFirestoreDb()
    .collection("users")
    .doc(uid)
    .collection(focusSessionsCollection);
}

function normalizeFocusSession(
  id: string,
  data: FirebaseFirestore.DocumentData,
) {
  return {
    completedAt: String(data.completedAt ?? ""),
    dateKey: String(data.dateKey ?? ""),
    hp: Number(data.hp ?? 0),
    id,
    minutes: Number(data.minutes ?? 0),
    note: String(data.note ?? ""),
    planId: String(data.planId ?? ""),
    planName: String(data.planName ?? "Focus session"),
  } satisfies FocusSession;
}

function summarize(dateKey: string, sessions: FocusSession[]) {
  return {
    dateKey,
    earnedHpToday: sessions.reduce((total, session) => total + session.hp, 0),
    sessions,
    totalMinutes: sessions.reduce(
      (total, session) => total + session.minutes,
      0,
    ),
  } satisfies FocusSummary;
}

export async function getFocusSummary(user: AuthenticatedUser) {
  await getOrCreateUserProfile(user);

  const dateKey = getTodayKey();
  const snapshot = await getFocusSessionsRef(user.uid)
    .where("dateKey", "==", dateKey)
    .get();
  const sessions = snapshot.docs
    .map((doc) => normalizeFocusSession(doc.id, doc.data()))
    .sort((first, second) =>
      second.completedAt.localeCompare(first.completedAt),
    )
    .slice(0, 12);

  return summarize(dateKey, sessions);
}

export async function completeFocusSession(
  user: AuthenticatedUser,
  input: CompleteFocusSessionInput,
) {
  const db = getFirestoreDb();
  const dateKey = getTodayKey();
  const now = new Date().toISOString();
  const sessionRef = getFocusSessionsRef(user.uid).doc();
  const profileRef = db.collection("users").doc(user.uid);
  const profile = await getOrCreateUserProfile(user);
  const session: FocusSession = {
    completedAt: now,
    dateKey,
    hp: input.hp,
    id: sessionRef.id,
    minutes: input.minutes,
    note: input.note?.trim() ?? "",
    planId: input.planId,
    planName: input.planName,
  };

  await db.runTransaction(async (transaction) => {
    transaction.set(sessionRef, session);
    transaction.set(
      profileRef,
      {
        hp: FieldValue.increment(input.hp),
        lastSeenAt: now,
        streak: Math.max(Number(profile.streak ?? 0), 1),
        updatedAt: now,
      },
      { merge: true },
    );
  });

  await awardBadgesForUser(user.uid, ["focus"]);

  const summary = await getFocusSummary(user);

  return {
    session,
    summary,
  };
}
