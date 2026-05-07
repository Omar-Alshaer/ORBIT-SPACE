import type { RequestHandler } from "express";
import {
  getFirebaseAuth,
  isFirebaseAdminConfigured,
} from "../../config/firebase-admin.js";
import { HttpError } from "../../shared/http/http-error.js";

function getBearerToken(authorizationHeader: string | undefined) {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    return null;
  }

  return authorizationHeader.slice("Bearer ".length).trim();
}

export const requireAuth: RequestHandler = async (request, _response, next) => {
  try {
    const token = getBearerToken(request.headers.authorization);
    if (!token) {
      throw new HttpError(401, "Please sign in to continue.");
    }

    if (!isFirebaseAdminConfigured()) {
      throw new HttpError(
        503,
        "Account access is temporarily unavailable.",
      );
    }

    const decodedToken = await getFirebaseAuth()
      .verifyIdToken(token)
      .catch(() => {
        throw new HttpError(401, "Please sign in again to continue.");
      });

    request.user = {
      email: decodedToken.email,
      name: decodedToken.name,
      picture: decodedToken.picture,
      uid: decodedToken.uid,
    };

    next();
  } catch (error) {
    next(error);
  }
};
