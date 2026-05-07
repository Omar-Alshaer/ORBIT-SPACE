import { FieldValue } from "firebase-admin/firestore";
import {
  isCloudinaryConfigured,
  uploadProofImage,
} from "../../config/cloudinary.js";
import { getFirestoreDb } from "../../config/firebase-admin.js";
import { HttpError } from "../../shared/http/http-error.js";
import type { AuthenticatedUser } from "../auth/auth.types.js";
import { awardBadgesForUser } from "../gamification/badge.service.js";
import type { UserProfile } from "../users/user-profile.types.js";
import { getOrCreateUserProfile } from "../users/user-profile.service.js";
import type { DailyMission, DailyMissionsSummary } from "./mission.types.js";

const missionTemplates = [
  {
    detail: "Drink 2 cups and log a quick hydration check.",
    hp: 40,
    id: "hydration-proof",
    title: "Hydration proof",
    type: "hydration",
  },
  {
    detail: "Complete one clean 25-minute focus session.",
    hp: 55,
    id: "deep-focus-block",
    title: "Deep focus block",
    type: "focus",
  },
  {
    detail: "Do a short walk or stretch and confirm movement.",
    hp: 65,
    id: "movement-snap",
    title: "Movement snap",
    type: "movement",
  },
] as const;

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getMissionRef(uid: string, dateKey: string, missionId: string) {
  return getFirestoreDb()
    .collection("users")
    .doc(uid)
    .collection("dailyMissions")
    .doc(dateKey)
    .collection("missions")
    .doc(missionId);
}

function normalizeMission(
  dateKey: string,
  template: (typeof missionTemplates)[number],
  data?: FirebaseFirestore.DocumentData,
) {
  const completedAt =
    typeof data?.completedAt === "string" ? data.completedAt : null;

  return {
    completedAt,
    dateKey,
    detail: template.detail,
    hp: template.hp,
    id: template.id,
    proofNote: typeof data?.proofNote === "string" ? data.proofNote : "",
    proofPublicId:
      typeof data?.proofPublicId === "string" ? data.proofPublicId : "",
    proofUrl: typeof data?.proofUrl === "string" ? data.proofUrl : "",
    status: completedAt ? "completed" : "open",
    title: template.title,
    type: template.type,
  } satisfies DailyMission;
}

function summarize(dateKey: string, missions: DailyMission[]) {
  const completedMissions = missions.filter(
    (mission) => mission.status === "completed",
  );

  return {
    completedCount: completedMissions.length,
    dateKey,
    earnedHpToday: completedMissions.reduce(
      (total, mission) => total + mission.hp,
      0,
    ),
    missions,
    totalCount: missions.length,
  } satisfies DailyMissionsSummary;
}

export async function getDailyMissions(user: AuthenticatedUser) {
  await getOrCreateUserProfile(user);

  const dateKey = getTodayKey();
  const missionSnapshots = await Promise.all(
    missionTemplates.map((template) =>
      getMissionRef(user.uid, dateKey, template.id).get(),
    ),
  );
  const missions = missionTemplates.map((template, index) =>
    normalizeMission(dateKey, template, missionSnapshots[index].data()),
  );

  return summarize(dateKey, missions);
}

export async function completeDailyMission(
  user: AuthenticatedUser,
  missionId: string,
  proof?: {
    note?: string;
    publicId?: string;
    url?: string;
  },
) {
  const template = missionTemplates.find((mission) => mission.id === missionId);
  if (!template) {
    throw new HttpError(404, "Mission not found.");
  }

  const db = getFirestoreDb();
  const dateKey = getTodayKey();
  const missionRef = getMissionRef(user.uid, dateKey, template.id);
  const profileRef = db.collection("users").doc(user.uid);
  const now = new Date().toISOString();
  const baseProfile = await getOrCreateUserProfile(user);

  const result = await db.runTransaction(async (transaction) => {
    const missionSnapshot = await transaction.get(missionRef);
    const profileSnapshot = await transaction.get(profileRef);

    if (missionSnapshot.exists && missionSnapshot.data()?.completedAt) {
      throw new HttpError(409, "Mission already completed today.");
    }

    const currentProfile = profileSnapshot.exists
      ? ({ ...baseProfile, ...profileSnapshot.data() } as UserProfile)
      : baseProfile;
    const nextProfile = {
      ...currentProfile,
      hp: Number(currentProfile.hp ?? 0) + template.hp,
      lastSeenAt: now,
      streak: Math.max(Number(currentProfile.streak ?? 0), 1),
      updatedAt: now,
    } satisfies UserProfile;

    transaction.set(
      missionRef,
      {
        completedAt: now,
        dateKey,
        detail: template.detail,
        hp: template.hp,
        id: template.id,
        proofNote: proof?.note ?? "",
        proofPublicId: proof?.publicId ?? "",
        proofUrl: proof?.url ?? "",
        title: template.title,
        type: template.type,
      },
      { merge: true },
    );
    transaction.set(
      profileRef,
      {
        hp: FieldValue.increment(template.hp),
        lastSeenAt: now,
        streak: nextProfile.streak,
        updatedAt: now,
      },
      { merge: true },
    );

    return {
      completedMission: normalizeMission(dateKey, template, {
        completedAt: now,
        proofNote: proof?.note ?? "",
        proofPublicId: proof?.publicId ?? "",
        proofUrl: proof?.url ?? "",
      }),
      profile: nextProfile,
    };
  });

  await awardBadgesForUser(user.uid, ["mission"]);

  const summary = await getDailyMissions(user);

  return {
    ...result,
    summary,
  };
}

export async function uploadMissionProof(params: {
  file: Express.Multer.File;
  missionId: string;
  note?: string;
  user: AuthenticatedUser;
}) {
  if (!isCloudinaryConfigured()) {
    throw new HttpError(503, "Photo uploads are temporarily unavailable.");
  }

  const template = missionTemplates.find(
    (mission) => mission.id === params.missionId,
  );
  if (!template) {
    throw new HttpError(404, "Mission not found.");
  }

  const dateKey = getTodayKey();
  const safePublicId = `${params.user.uid}-${dateKey}-${template.id}`;
  const upload = await uploadProofImage({
    buffer: params.file.buffer,
    folder: `orbit/proofs/${params.user.uid}/${dateKey}`,
    publicId: safePublicId,
  });

  return completeDailyMission(params.user, template.id, {
    note: params.note,
    publicId: upload.publicId,
    url: upload.secureUrl,
  });
}
