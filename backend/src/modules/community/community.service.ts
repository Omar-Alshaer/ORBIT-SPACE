import { FieldValue } from "firebase-admin/firestore";
import { getFirestoreDb } from "../../config/firebase-admin.js";
import { HttpError } from "../../shared/http/http-error.js";
import type { AuthenticatedUser } from "../auth/auth.types.js";
import { getOrCreateUserProfile } from "../users/user-profile.service.js";
import type {
  CommunityActivityItem,
  CommunityChallenge,
  CommunityMember,
  CommunitySummary,
  Orbit,
} from "./community.types.js";

type DailyActivity = {
  completedMissions: number;
  focusMinutes: number;
  healthScore: number;
  hpToday: number;
  movementMinutes: number;
  waterCups: number;
};

type ChallengeTemplate = Omit<
  CommunityChallenge,
  | "claimedAt"
  | "participants"
  | "progress"
  | "progressLabel"
  | "startedAt"
  | "status"
  | "target"
>;

type ChallengeState = {
  claimedAt: string | null;
  startedAt: string | null;
};

const emptyActivity: DailyActivity = {
  completedMissions: 0,
  focusMinutes: 0,
  healthScore: 0,
  hpToday: 0,
  movementMinutes: 0,
  waterCups: 0,
};

const orbitChallengeTemplates: ChallengeTemplate[] = [
  {
    actionHref: "/focus",
    description: "Every completed focus session pushes the whole Orbit forward.",
    id: "orbit-focus-chain",
    label: "Orbit Focus Chain",
    metricLabel: "Focus minutes",
    reward: 45,
    scope: "orbit",
    type: "focus",
  },
  {
    actionHref: "/health",
    description: "Log water and health check-ins to fill the crew hydration bar.",
    id: "crew-hydration",
    label: "Crew Hydration",
    metricLabel: "Water cups",
    reward: 35,
    scope: "orbit",
    type: "health",
  },
  {
    actionHref: "/missions",
    description: "Finish proof-based daily missions together.",
    id: "mission-squad",
    label: "Mission Squad",
    metricLabel: "Missions done",
    reward: 55,
    scope: "orbit",
    type: "mission",
  },
];

const galaxyChallengeTemplates: ChallengeTemplate[] = [
  {
    actionHref: "/health",
    description: "Keep your daily health score climbing with the public Galaxy.",
    id: "hydration-wave",
    label: "Hydration Wave",
    metricLabel: "Health score",
    reward: 60,
    scope: "galaxy",
    type: "health",
  },
  {
    actionHref: "/focus",
    description: "Add deep work minutes to your Galaxy momentum.",
    id: "deep-work-night",
    label: "Deep Work Night",
    metricLabel: "Focus minutes",
    reward: 90,
    scope: "galaxy",
    type: "focus",
  },
  {
    actionHref: "/health",
    description: "Movement minutes from health check-ins power this challenge.",
    id: "move-circle",
    label: "Move Circle",
    metricLabel: "Movement minutes",
    reward: 70,
    scope: "galaxy",
    type: "movement",
  },
];

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getOrbitCode(uid: string) {
  return `ORB-${uid.slice(0, 6).toUpperCase()}`;
}

function getInviteLink(code: string) {
  const appUrl = process.env.ORBIT_APP_URL ?? "http://localhost:3000";

  return `${appUrl.replace(/\/$/, "")}/community?orbitCode=${code}`;
}

function normalizeOrbit(
  data: FirebaseFirestore.DocumentData,
  role: Orbit["role"],
) {
  const code = String(data.code ?? "");

  return {
    code,
    createdAt: String(data.createdAt ?? ""),
    id: String(data.id ?? ""),
    inviteLink: String(data.inviteLink ?? getInviteLink(code)),
    memberCount: Number(data.memberCount ?? 1),
    name: String(data.name ?? "My Orbit"),
    role,
  } satisfies Orbit;
}

function getUserCommunityRef(uid: string) {
  return getFirestoreDb().collection("users").doc(uid).collection("community");
}

function getOrbitsRef() {
  return getFirestoreDb().collection("orbits");
}

function getUserRef(uid: string) {
  return getFirestoreDb().collection("users").doc(uid);
}

function getNudgesRef(uid: string) {
  return getFirestoreDb()
    .collection("users")
    .doc(uid)
    .collection("communityNudges");
}

function getChallengeStateRef(uid: string, dateKey: string, challengeId: string) {
  return getUserRef(uid)
    .collection("communityChallenges")
    .doc(`${dateKey}-${challengeId}`);
}

function getChallengeTemplate(challengeId: string) {
  return [...orbitChallengeTemplates, ...galaxyChallengeTemplates].find(
    (challenge) => challenge.id === challengeId,
  );
}

async function getTodayNudges(uid: string) {
  const dateKey = getTodayKey();
  const snapshot = await getNudgesRef(uid)
    .where("dateKey", "==", dateKey)
    .get();

  return snapshot.docs.map((doc) => String(doc.data().memberId ?? ""));
}

async function getDailyActivity(uid: string, dateKey: string) {
  const userRef = getUserRef(uid);
  const [focusSnapshot, healthSnapshot, missionsSnapshot] = await Promise.all([
    userRef.collection("focusSessions").where("dateKey", "==", dateKey).get(),
    userRef.collection("dailyHealth").doc(dateKey).get(),
    userRef
      .collection("dailyMissions")
      .doc(dateKey)
      .collection("missions")
      .get(),
  ]);
  const focus = focusSnapshot.docs.reduce(
    (total, doc) => {
      const data = doc.data();

      return {
        hp: total.hp + Number(data.hp ?? 0),
        minutes: total.minutes + Number(data.minutes ?? 0),
      };
    },
    { hp: 0, minutes: 0 },
  );
  const healthData = healthSnapshot.data() ?? {};
  const missionStats = missionsSnapshot.docs.reduce(
    (total, doc) => {
      const data = doc.data();

      if (!data.completedAt) {
        return total;
      }

      return {
        completed: total.completed + 1,
        hp: total.hp + Number(data.hp ?? 0),
      };
    },
    { completed: 0, hp: 0 },
  );

  return {
    completedMissions: missionStats.completed,
    focusMinutes: focus.minutes,
    healthScore: Number(healthData.score ?? 0),
    hpToday:
      focus.hp + Number(healthData.hpAwarded ?? 0) + Number(missionStats.hp),
    movementMinutes: Number(healthData.movementMinutes ?? 0),
    waterCups: Number(healthData.waterCups ?? 0),
  } satisfies DailyActivity;
}

function sumActivity(activities: DailyActivity[]) {
  return activities.reduce(
    (total, activity) => ({
      completedMissions: total.completedMissions + activity.completedMissions,
      focusMinutes: total.focusMinutes + activity.focusMinutes,
      healthScore: total.healthScore + activity.healthScore,
      hpToday: total.hpToday + activity.hpToday,
      movementMinutes: total.movementMinutes + activity.movementMinutes,
      waterCups: total.waterCups + activity.waterCups,
    }),
    emptyActivity,
  );
}

function toProgress(value: number, target: number) {
  if (target <= 0) {
    return 0;
  }

  return Math.min(100, Math.round(value / target * 100));
}

async function getChallengeStates(uid: string, dateKey: string) {
  const snapshot = await getUserRef(uid)
    .collection("communityChallenges")
    .where("dateKey", "==", dateKey)
    .get();

  return new Map(
    snapshot.docs.map((doc) => {
      const data = doc.data();

      return [
        String(data.challengeId ?? doc.id.replace(`${dateKey}-`, "")),
        {
          claimedAt:
            typeof data.claimedAt === "string" ? data.claimedAt : null,
          startedAt:
            typeof data.startedAt === "string" ? data.startedAt : null,
        } satisfies ChallengeState,
      ];
    }),
  );
}

function getChallengeStatus(progress: number, state?: ChallengeState) {
  if (state?.claimedAt) {
    return "claimed";
  }

  if (state?.startedAt && progress >= 100) {
    return "claimable";
  }

  if (state?.startedAt) {
    return "joined";
  }

  return "available";
}

function hydrateOrbitChallenges(params: {
  activity: DailyActivity;
  memberCount: number;
  states: Map<string, ChallengeState>;
}) {
  const memberCount = Math.max(params.memberCount, 1);
  const targets = {
    focus: memberCount * 50,
    health: memberCount * 8,
    mission: memberCount * 3,
  };

  return orbitChallengeTemplates.map((challenge) => {
    const value =
      challenge.type === "focus"
        ? params.activity.focusMinutes
        : challenge.type === "health"
          ? params.activity.waterCups
          : params.activity.completedMissions;
    const target =
      challenge.type === "focus"
        ? targets.focus
        : challenge.type === "health"
          ? targets.health
          : targets.mission;
    const progress = toProgress(value, target);
    const state = params.states.get(challenge.id);

    return {
      ...challenge,
      claimedAt: state?.claimedAt ?? null,
      participants: memberCount,
      progress,
      progressLabel: `${value}/${target}`,
      startedAt: state?.startedAt ?? null,
      status: getChallengeStatus(progress, state),
      target,
    } satisfies CommunityChallenge;
  });
}

function hydrateGalaxyChallenges(
  activity: DailyActivity,
  states: Map<string, ChallengeState>,
) {
  const publicBase = {
    focus: 86,
    health: 128,
    movement: 203,
  };
  const targets = {
    focus: 90,
    health: 100,
    movement: 30,
  };

  return galaxyChallengeTemplates.map((challenge) => {
    const value =
      challenge.type === "focus"
        ? activity.focusMinutes
        : challenge.type === "health"
          ? activity.healthScore
          : activity.movementMinutes;
    const target =
      challenge.type === "focus"
        ? targets.focus
        : challenge.type === "health"
          ? targets.health
          : targets.movement;
    const participants =
      challenge.type === "focus"
        ? publicBase.focus
        : challenge.type === "health"
          ? publicBase.health
          : publicBase.movement;
    const progress = toProgress(value, target);
    const state = states.get(challenge.id);

    return {
      ...challenge,
      claimedAt: state?.claimedAt ?? null,
      participants,
      progress,
      progressLabel: `${value}/${target}`,
      startedAt: state?.startedAt ?? null,
      status: getChallengeStatus(progress, state),
      target,
    } satisfies CommunityChallenge;
  });
}

function buildActivityFeed(
  members: CommunityMember[],
  activitiesByUid: Map<string, DailyActivity>,
) {
  return members
    .map((member) => {
      const activity = activitiesByUid.get(member.id) ?? emptyActivity;
      const base = {
        id: member.id,
        memberName: member.name,
      };

      if (activity.completedMissions > 0) {
        return {
          ...base,
          label: `completed ${activity.completedMissions} mission${
            activity.completedMissions > 1 ? "s" : ""
          }`,
          tone: "mission",
        } satisfies CommunityActivityItem;
      }

      if (activity.focusMinutes > 0) {
        return {
          ...base,
          label: `added ${activity.focusMinutes} focus minutes`,
          tone: "focus",
        } satisfies CommunityActivityItem;
      }

      if (activity.healthScore > 0) {
        return {
          ...base,
          label: `logged a ${activity.healthScore}% health check`,
          tone: "health",
        } satisfies CommunityActivityItem;
      }

      return {
        ...base,
        label: "has not checked in yet",
        tone: "rest",
      } satisfies CommunityActivityItem;
    })
    .slice(0, 5);
}

async function getUserOrbit(uid: string) {
  const linkSnapshot = await getUserCommunityRef(uid).doc("orbit").get();

  if (!linkSnapshot.exists) {
    return null;
  }

  const linkData = linkSnapshot.data() ?? {};
  const orbitId = String(linkData.orbitId ?? "");
  const role = linkData.role === "member" ? "member" : "owner";
  if (!orbitId) {
    return null;
  }

  const orbitSnapshot = await getOrbitsRef().doc(orbitId).get();
  if (!orbitSnapshot.exists) {
    return null;
  }

  return normalizeOrbit(orbitSnapshot.data() ?? {}, role);
}

async function upsertOrbitMember(user: AuthenticatedUser, orbitId: string) {
  const profile = await getOrCreateUserProfile(user);
  const memberRef = getOrbitsRef()
    .doc(orbitId)
    .collection("members")
    .doc(user.uid);
  const memberSnapshot = await memberRef.get();

  await memberRef.set(
    {
      avatar:
        profile.photoURL ||
        user.picture ||
        `/assets/Mascots/mas${(user.uid.length % 10) + 1}.svg`,
      hpToday: Math.min(Number(profile.hp ?? 0), 120),
      id: user.uid,
      joinedAt:
        String(memberSnapshot.data()?.joinedAt ?? "") || new Date().toISOString(),
      name: profile.displayName || profile.username || user.email || "ORBIT user",
      status: "active",
    },
    { merge: true },
  );
}

async function getOrbitMembers(orbitId: string) {
  const snapshot = await getOrbitsRef()
    .doc(orbitId)
    .collection("members")
    .limit(20)
    .get();

  const dateKey = getTodayKey();
  const activities = await Promise.all(
    snapshot.docs.map((doc) => getDailyActivity(doc.id, dateKey)),
  );

  return snapshot.docs.map((doc, index) => {
    const data = doc.data();
    const activity = activities[index];
    const status =
      activity.hpToday > 0
        ? "active"
        : data.status === "needs-nudge"
          ? "needs-nudge"
          : "resting";

    return {
      avatar: String(data.avatar ?? "/assets/Mascots/mas2.svg"),
      hpToday: activity.hpToday,
      id: doc.id,
      name: String(data.name ?? "ORBIT user"),
      status,
    } satisfies CommunityMember;
  });
}

export async function getCommunitySummary(user: AuthenticatedUser) {
  const dateKey = getTodayKey();
  const [profile, orbit, nudgeSentMemberIds, userActivity, challengeStates] =
    await Promise.all([
      getOrCreateUserProfile(user),
      getUserOrbit(user.uid),
      getTodayNudges(user.uid),
      getDailyActivity(user.uid, dateKey),
      getChallengeStates(user.uid, dateKey),
    ]);

  const orbitMembers = orbit ? await getOrbitMembers(orbit.id) : [];
  const orbitHpToday = orbitMembers.reduce(
    (total, member) => total + member.hpToday,
    0,
  );
  const activeOrbitMembers = orbitMembers.filter(
    (member) => member.status === "active",
  ).length;
  const hydratedOrbit = orbit
    ? {
        ...orbit,
        memberCount: Math.max(orbit.memberCount, orbitMembers.length),
      }
    : null;
  const orbitActivities = orbit
    ? await Promise.all(
        orbitMembers.map((member) => getDailyActivity(member.id, dateKey)),
      )
    : [];
  const activitiesByUid = new Map(
    orbitMembers.map((member, index) => [member.id, orbitActivities[index]]),
  );
  const orbitActivity = orbit ? sumActivity(orbitActivities) : emptyActivity;
  const hydratedGalaxyChallenges = hydrateGalaxyChallenges(
    userActivity,
    challengeStates,
  );

  return {
    activeOrbitMembers,
    activityFeed: buildActivityFeed(orbitMembers, activitiesByUid),
    galaxyChallenges: hydratedGalaxyChallenges,
    galaxyRank: Math.max(
      1,
      204 - Math.round((userActivity.hpToday + profile.hp * 0.05) / 25),
    ),
    galaxySize: 203,
    nudgeSentMemberIds,
    orbit: hydratedOrbit,
    orbitChallenges: hydratedOrbit
      ? hydrateOrbitChallenges({
          activity: orbitActivity,
          memberCount: hydratedOrbit.memberCount,
          states: challengeStates,
        })
      : [],
    orbitHpToday,
    orbitMembers,
  } satisfies CommunitySummary;
}

export async function createOrbit(user: AuthenticatedUser, name: string) {
  const profile = await getOrCreateUserProfile(user);
  const code = getOrbitCode(user.uid);
  const now = new Date().toISOString();
  const orbitId = `orbit-${user.uid}`;
  const existingOrbit = await getUserOrbit(user.uid);
  const nextName = name.trim() || `${profile.displayName || "My"} Orbit`;

  if (existingOrbit && existingOrbit.role !== "owner") {
    throw new HttpError(409, "You are already inside another Orbit.");
  }

  if (existingOrbit?.id) {
    await getOrbitsRef().doc(existingOrbit.id).set(
      {
        inviteLink: getInviteLink(existingOrbit.code),
        name: nextName,
        updatedAt: now,
      },
      { merge: true },
    );
    await upsertOrbitMember(user, existingOrbit.id);

    return getCommunitySummary(user);
  }

  const orbit: Orbit = {
    code,
    createdAt: now,
    id: orbitId,
    inviteLink: getInviteLink(code),
    memberCount: 1,
    name: nextName,
    role: "owner",
  };

  await getOrbitsRef().doc(orbitId).set({
    ...orbit,
    ownerId: user.uid,
    updatedAt: now,
  });
  await getUserCommunityRef(user.uid).doc("orbit").set({
    orbitId,
    role: "owner",
  });
  await upsertOrbitMember(user, orbitId);

  return getCommunitySummary(user);
}

export async function joinCommunityChallenge(
  user: AuthenticatedUser,
  challengeId: string,
) {
  const template = getChallengeTemplate(challengeId);
  if (!template) {
    throw new HttpError(404, "Challenge not found.");
  }

  if (template.scope === "orbit") {
    const orbit = await getUserOrbit(user.uid);
    if (!orbit) {
      throw new HttpError(409, "Join or create an Orbit first.");
    }
  }

  const dateKey = getTodayKey();
  const now = new Date().toISOString();

  await getChallengeStateRef(user.uid, dateKey, template.id).set(
    {
      challengeId: template.id,
      dateKey,
      scope: template.scope,
      startedAt: now,
      updatedAt: now,
    },
    { merge: true },
  );

  return getCommunitySummary(user);
}

export async function claimCommunityChallenge(
  user: AuthenticatedUser,
  challengeId: string,
) {
  const summary = await getCommunitySummary(user);
  const challenge = [
    ...summary.orbitChallenges,
    ...summary.galaxyChallenges,
  ].find((item) => item.id === challengeId);

  if (!challenge) {
    throw new HttpError(404, "Challenge not found.");
  }

  if (challenge.status === "claimed") {
    throw new HttpError(409, "Challenge reward already claimed.");
  }

  if (challenge.status === "available") {
    throw new HttpError(409, "Join the challenge first.");
  }

  if (challenge.progress < 100) {
    throw new HttpError(409, "Challenge is not complete yet.");
  }

  const db = getFirestoreDb();
  const dateKey = getTodayKey();
  const now = new Date().toISOString();
  const challengeRef = getChallengeStateRef(user.uid, dateKey, challenge.id);
  const profileRef = getUserRef(user.uid);

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(challengeRef);
    const data = snapshot.data() ?? {};

    if (typeof data.claimedAt === "string") {
      throw new HttpError(409, "Challenge reward already claimed.");
    }

    transaction.set(
      challengeRef,
      {
        challengeId: challenge.id,
        claimedAt: now,
        dateKey,
        scope: challenge.scope,
        startedAt: data.startedAt ?? now,
        updatedAt: now,
      },
      { merge: true },
    );
    transaction.set(
      profileRef,
      {
        hp: FieldValue.increment(challenge.reward),
        lastSeenAt: now,
        updatedAt: now,
      },
      { merge: true },
    );
  });

  return getCommunitySummary(user);
}

export async function joinOrbitByCode(user: AuthenticatedUser, code: string) {
  const normalizedCode = code.trim().toUpperCase();
  const currentOrbit = await getUserOrbit(user.uid);
  const snapshot = await getOrbitsRef()
    .where("code", "==", normalizedCode)
    .limit(1)
    .get();

  if (snapshot.empty) {
    throw new HttpError(404, "Orbit code was not found.");
  }

  const orbitDoc = snapshot.docs[0];
  const orbitData = orbitDoc.data();
  const ownerId = String(orbitData.ownerId ?? "");
  const nextRole = ownerId === user.uid ? "owner" : "member";

  if (currentOrbit && currentOrbit.id !== orbitDoc.id) {
    throw new HttpError(409, "You are already inside another Orbit.");
  }

  const memberRef = orbitDoc.ref.collection("members").doc(user.uid);
  const memberSnapshot = await memberRef.get();

  await getUserCommunityRef(user.uid).doc("orbit").set({
    orbitId: orbitDoc.id,
    role: nextRole,
  });
  await upsertOrbitMember(user, orbitDoc.id);

  if (!memberSnapshot.exists) {
    await orbitDoc.ref.set(
      {
        memberCount: FieldValue.increment(1),
      },
      { merge: true },
    );
  }

  return getCommunitySummary(user);
}

export async function sendOrbitNudge(
  user: AuthenticatedUser,
  memberId: string,
) {
  const orbit = await getUserOrbit(user.uid);
  if (!orbit || memberId === user.uid) {
    return getCommunitySummary(user);
  }

  const members = await getOrbitMembers(orbit.id);
  const member = members.find((item) => item.id === memberId);
  if (!member) {
    return getCommunitySummary(user);
  }

  const now = new Date().toISOString();
  const dateKey = getTodayKey();

  await getNudgesRef(user.uid).doc(`${dateKey}-${member.id}`).set(
    {
      dateKey,
      memberId: member.id,
      sentAt: now,
    },
    { merge: true },
  );

  return getCommunitySummary(user);
}
