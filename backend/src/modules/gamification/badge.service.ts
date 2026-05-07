import { FieldValue } from "firebase-admin/firestore";
import { getFirestoreDb } from "../../config/firebase-admin.js";

type BadgeTrigger = "focus" | "health" | "mission" | "profile";

const badgeLabels = {
  firstFocus: "Focus Spark",
  firstHealth: "Health Pulse",
  firstMission: "Mission Maker",
  hp100: "100 HP Club",
  hp500: "500 HP Orbit",
  hp1000: "Galaxy Spark",
  streak3: "3-Day Rhythm",
  welcome: "Welcome Aboard",
} as const;

export async function awardBadgesForUser(
  uid: string,
  triggers: BadgeTrigger[] = [],
) {
  const db = getFirestoreDb();
  const profileRef = db.collection("users").doc(uid);
  const profileSnapshot = await profileRef.get();

  if (!profileSnapshot.exists) {
    return [];
  }

  const data = profileSnapshot.data() ?? {};
  const existingBadges = Array.isArray(data.badges)
    ? data.badges.map(String)
    : [];
  const nextBadges = new Set(existingBadges);
  const hp = Number(data.hp ?? 0);
  const streak = Number(data.streak ?? 0);

  if (triggers.includes("profile")) {
    nextBadges.add(badgeLabels.welcome);
  }

  if (triggers.includes("focus")) {
    nextBadges.add(badgeLabels.firstFocus);
  }

  if (triggers.includes("health")) {
    nextBadges.add(badgeLabels.firstHealth);
  }

  if (triggers.includes("mission")) {
    nextBadges.add(badgeLabels.firstMission);
  }

  if (hp >= 100) {
    nextBadges.add(badgeLabels.hp100);
  }

  if (hp >= 500) {
    nextBadges.add(badgeLabels.hp500);
  }

  if (hp >= 1000) {
    nextBadges.add(badgeLabels.hp1000);
  }

  if (streak >= 3) {
    nextBadges.add(badgeLabels.streak3);
  }

  const awardedBadges = Array.from(nextBadges).filter(
    (badge) => !existingBadges.includes(badge),
  );

  if (awardedBadges.length) {
    await profileRef.set(
      {
        badges: FieldValue.arrayUnion(...awardedBadges),
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
  }

  return awardedBadges;
}
