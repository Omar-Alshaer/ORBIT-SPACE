export type MemberStatus = "active" | "needs-nudge" | "resting";

export type CommunityMember = {
  avatar: string;
  hpToday: number;
  id: string;
  name: string;
  status: MemberStatus;
};

export type CommunityChallenge = {
  actionHref: string;
  claimedAt: string | null;
  description: string;
  id: string;
  label: string;
  metricLabel: string;
  participants: number;
  progress: number;
  progressLabel: string;
  reward: number;
  scope: "galaxy" | "orbit";
  startedAt: string | null;
  status: "available" | "joined" | "claimable" | "claimed";
  target: number;
  type: "focus" | "health" | "mission" | "movement";
};

export type CommunityActivityItem = {
  id: string;
  label: string;
  memberName: string;
  tone: "focus" | "health" | "mission" | "rest";
};

export type Orbit = {
  code: string;
  createdAt: string;
  id: string;
  inviteLink: string;
  memberCount: number;
  name: string;
  role: "owner" | "member";
};

export type CommunitySummary = {
  activeOrbitMembers: number;
  activityFeed: CommunityActivityItem[];
  galaxyChallenges: CommunityChallenge[];
  galaxyRank: number;
  galaxySize: number;
  nudgeSentMemberIds: string[];
  orbit: Orbit | null;
  orbitChallenges: CommunityChallenge[];
  orbitHpToday: number;
  orbitMembers: CommunityMember[];
};
