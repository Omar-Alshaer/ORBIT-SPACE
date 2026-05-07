import { getFirestoreDb } from "../../config/firebase-admin.js";
import type { AuthenticatedUser } from "../auth/auth.types.js";
import { awardBadgesForUser } from "../gamification/badge.service.js";
import type {
  UpdateUserProfileInput,
  UserProfile,
} from "./user-profile.types.js";

const usersCollection = "users";
const rewardLabels: Record<string, { label: string; reward: number }> = {
  "crew-hydration": { label: "Crew Hydration", reward: 35 },
  "deep-work-night": { label: "Deep Work Night", reward: 90 },
  "hydration-wave": { label: "Hydration Wave", reward: 60 },
  "mission-squad": { label: "Mission Squad", reward: 55 },
  "move-circle": { label: "Move Circle", reward: 70 },
  "orbit-focus-chain": { label: "Orbit Focus Chain", reward: 45 },
};
const defaultAvatarPattern = /^\/assets\/Mascots\/mas([1-9]|10)\.svg$/;

function buildAuthFields(user: AuthenticatedUser) {
  return {
    displayName: user.name ?? "",
    email: user.email ?? "",
    photoURL: user.picture ?? "",
  };
}

function getDefaultAvatar(uid: string) {
  const uidSeed = Array.from(uid).reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );
  const mascotIndex = (uidSeed % 10) + 1;

  return `/assets/Mascots/mas${mascotIndex}.svg`;
}

function normalizeUsername(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_")
    .slice(0, 24);
}

function getFallbackUsername(user: AuthenticatedUser) {
  const nameCandidate = normalizeUsername(user.name ?? "");
  if (nameCandidate.length >= 3) {
    return nameCandidate;
  }

  const emailCandidate = normalizeUsername(user.email?.split("@")[0] ?? "");
  if (emailCandidate.length >= 3) {
    return emailCandidate;
  }

  return `orbit_${user.uid.slice(0, 8).toLowerCase()}`;
}

function normalizeProfile(uid: string, data: FirebaseFirestore.DocumentData) {
  return {
    badges: Array.isArray(data.badges) ? data.badges : [],
    createdAt: String(data.createdAt ?? ""),
    displayName: String(data.displayName ?? ""),
    email: String(data.email ?? ""),
    hp: Number(data.hp ?? 0),
    lastSeenAt: String(data.lastSeenAt ?? ""),
    photoURL: String(data.photoURL ?? ""),
    streak: Number(data.streak ?? 0),
    uid,
    updatedAt: String(data.updatedAt ?? ""),
    username: String(data.username ?? ""),
  } satisfies UserProfile;
}

export async function getOrCreateUserProfile(user: AuthenticatedUser) {
  const db = getFirestoreDb();
  const profileRef = db.collection(usersCollection).doc(user.uid);
  const profileSnapshot = await profileRef.get();
  const now = new Date().toISOString();
  const authFields = buildAuthFields(user);

  if (!profileSnapshot.exists) {
    const newProfile: UserProfile = {
      ...authFields,
      badges: [],
      createdAt: now,
      hp: 0,
      lastSeenAt: now,
      photoURL: authFields.photoURL || getDefaultAvatar(user.uid),
      streak: 0,
      uid: user.uid,
      updatedAt: now,
      username: getFallbackUsername(user),
    };

    await profileRef.set({
      ...newProfile,
      photoSource: authFields.photoURL ? "account" : "default",
    });
    const awardedBadges = await awardBadgesForUser(user.uid, ["profile"]);

    return {
      ...newProfile,
      badges: [...newProfile.badges, ...awardedBadges],
    } satisfies UserProfile;
  }

  const existingProfile = normalizeProfile(
    user.uid,
    profileSnapshot.data() ?? {},
  );
  const shouldUseAccountPhoto =
    Boolean(authFields.photoURL) &&
    existingProfileSnapshotCanUseAccountPhoto(profileSnapshot.data() ?? {}) &&
    (!existingProfile.photoURL ||
      defaultAvatarPattern.test(existingProfile.photoURL));
  const profileUpdates = {
    displayName: existingProfile.displayName || authFields.displayName,
    email: authFields.email || existingProfile.email,
    lastSeenAt: now,
    photoURL: shouldUseAccountPhoto
      ? authFields.photoURL
      : existingProfile.photoURL || getDefaultAvatar(user.uid),
    updatedAt: now,
    username: existingProfile.username || getFallbackUsername(user),
  };

  await profileRef.set(profileUpdates, { merge: true });

  return {
    ...existingProfile,
    ...profileUpdates,
  } satisfies UserProfile;
}

export async function updateUserProfile(
  user: AuthenticatedUser,
  input: UpdateUserProfileInput,
) {
  const db = getFirestoreDb();
  const profileRef = db.collection(usersCollection).doc(user.uid);
  const now = new Date().toISOString();
  const existingProfile = await getOrCreateUserProfile(user);
  const updates: UpdateUserProfileInput & { updatedAt: string } = {
    updatedAt: now,
  };

  if (typeof input.displayName === "string") {
    updates.displayName = input.displayName.trim();
  }

  if (typeof input.username === "string") {
    updates.username = normalizeUsername(input.username);
  }

  if (typeof input.photoURL === "string") {
    updates.photoURL = input.photoURL.trim() || getDefaultAvatar(user.uid);
  }

  await profileRef.set(
    {
      ...updates,
      ...(typeof input.photoURL === "string" ? { photoSource: "custom" } : {}),
    },
    { merge: true },
  );

  return {
    ...existingProfile,
    ...updates,
  } satisfies UserProfile;
}

export async function getUserRewards(user: AuthenticatedUser) {
  const snapshot = await getFirestoreDb()
    .collection(usersCollection)
    .doc(user.uid)
    .collection("communityChallenges")
    .limit(24)
    .get();
  const rewards = snapshot.docs
    .map((doc) => {
      const data = doc.data();
      const challengeId = String(data.challengeId ?? "");
      const fallbackLabel = challengeId
        .split("-")
        .filter(Boolean)
        .map((part) => part[0]?.toUpperCase() + part.slice(1))
        .join(" ");
      const reward = rewardLabels[challengeId];
      const claimedAt =
        typeof data.claimedAt === "string" ? data.claimedAt : null;
      const startedAt =
        typeof data.startedAt === "string" ? data.startedAt : null;

      return {
        challengeId,
        claimedAt,
        id: doc.id,
        label: reward?.label ?? fallbackLabel,
        reward: reward?.reward ?? 0,
        scope: data.scope === "orbit" ? "orbit" : "galaxy",
        startedAt,
        status: claimedAt ? "claimed" : "joined",
      };
    })
    .sort((first, second) =>
      String(second.claimedAt ?? second.startedAt ?? "").localeCompare(
        String(first.claimedAt ?? first.startedAt ?? ""),
      ),
    )
    .slice(0, 8);

  return {
    claimedCount: rewards.filter((reward) => reward.status === "claimed")
      .length,
    rewards,
    totalClaimedHp: rewards
      .filter((reward) => reward.status === "claimed")
      .reduce((total, reward) => total + reward.reward, 0),
  };
}

export async function getUserActivity(user: AuthenticatedUser) {
  const userRef = getFirestoreDb().collection(usersCollection).doc(user.uid);
  const [focusSnapshot, healthSnapshot, missionDaysSnapshot, rewards] =
    await Promise.all([
      userRef.collection("focusSessions").limit(16).get(),
      userRef.collection("dailyHealth").limit(16).get(),
      userRef.collection("dailyMissions").limit(8).get(),
      getUserRewards(user),
    ]);
  const focusItems = focusSnapshot.docs.map((doc) => {
    const data = doc.data();
    const minutes = Number(data.minutes ?? 0);

    return {
      at: String(data.completedAt ?? ""),
      description: `${minutes} focus minutes`,
      hp: Number(data.hp ?? 0),
      id: `focus-${doc.id}`,
      label: String(data.planName ?? "Focus session"),
      type: "focus",
    };
  });
  const healthItems = healthSnapshot.docs.map((doc) => {
    const data = doc.data();

    return {
      at: String(data.updatedAt ?? doc.id),
      description: `Health score ${Number(data.score ?? 0)}%`,
      hp: Number(data.hpAwarded ?? 0),
      id: `health-${doc.id}`,
      label: "Health check-in",
      type: "health",
    };
  });
  const missionSnapshots = await Promise.all(
    missionDaysSnapshot.docs.map(async (dayDoc) => {
      const missionsSnapshot = await dayDoc.ref.collection("missions").get();

      return missionsSnapshot.docs.map((missionDoc) => {
        const data = missionDoc.data();

        if (!data.completedAt) {
          return null;
        }

        return {
          at: String(data.completedAt ?? ""),
          description: String(data.detail ?? "Mission complete"),
          hp: Number(data.hp ?? 0),
          id: `mission-${dayDoc.id}-${missionDoc.id}`,
          label: String(data.title ?? "Daily mission"),
          type: "mission",
        };
      });
    }),
  );
  const missionItems = missionSnapshots
    .flat()
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const rewardItems = rewards.rewards
    .filter((reward) => reward.status === "claimed")
    .map((reward) => ({
      at: String(reward.claimedAt ?? ""),
      description: `${reward.scope} challenge reward`,
      hp: reward.reward,
      id: `reward-${reward.id}`,
      label: reward.label,
      type: "reward",
    }));
  const items = [
    ...focusItems,
    ...healthItems,
    ...missionItems,
    ...rewardItems,
  ]
    .filter((item) => Boolean(item.at))
    .sort((first, second) => second.at.localeCompare(first.at))
    .slice(0, 12);

  return { items };
}

function existingProfileSnapshotCanUseAccountPhoto(
  data: FirebaseFirestore.DocumentData,
) {
  return String(data.photoSource ?? "") !== "custom";
}
