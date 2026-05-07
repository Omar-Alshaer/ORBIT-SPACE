import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { env } from "./env.js";

function formatPrivateKey(privateKey: string) {
  return `${privateKey.replace(/\\\r?\n/g, "\n").replace(/\\n/g, "\n").trim()}\n`;
}

export function isFirebaseAdminConfigured() {
  return Boolean(
    env.FIREBASE_PROJECT_ID &&
      env.FIREBASE_CLIENT_EMAIL &&
      env.FIREBASE_PRIVATE_KEY,
  );
}

export function getFirebaseAdminApp(): App {
  if (!isFirebaseAdminConfigured()) {
    throw new Error("Firebase Admin credentials are not configured.");
  }

  const existingApp = getApps()[0];
  if (existingApp) {
    return existingApp;
  }

  return initializeApp({
    credential: cert({
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: formatPrivateKey(env.FIREBASE_PRIVATE_KEY ?? ""),
      projectId: env.FIREBASE_PROJECT_ID,
    }),
  });
}

export function getFirebaseAuth() {
  return getAuth(getFirebaseAdminApp());
}

export function getFirestoreDb() {
  return getFirestore(getFirebaseAdminApp());
}
