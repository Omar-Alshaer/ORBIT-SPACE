export type UserProfile = {
  badges: string[];
  createdAt: string;
  displayName: string;
  email: string;
  hp: number;
  lastSeenAt: string;
  photoURL: string;
  streak: number;
  uid: string;
  updatedAt: string;
  username: string;
};

export type UpdateUserProfileInput = {
  displayName?: string;
  photoURL?: string;
  username?: string;
};
