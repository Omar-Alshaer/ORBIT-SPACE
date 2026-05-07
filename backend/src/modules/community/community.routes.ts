import { Router } from "express";
import { z } from "zod";
import { HttpError } from "../../shared/http/http-error.js";
import { requireAuth } from "../auth/require-auth.js";
import {
  claimCommunityChallenge,
  createOrbit,
  getCommunitySummary,
  joinCommunityChallenge,
  joinOrbitByCode,
  sendOrbitNudge,
} from "./community.service.js";

export const communityRouter = Router();

const nudgeSchema = z.object({
  memberId: z.string().trim().min(2).max(40),
});
const createOrbitSchema = z.object({
  name: z.string().trim().min(2).max(50),
});
const joinOrbitSchema = z.object({
  code: z.string().trim().min(4).max(24),
});
const challengeSchema = z.object({
  challengeId: z.string().trim().min(3).max(80),
});

communityRouter.get("/summary", requireAuth, async (request, response, next) => {
  try {
    const summary = await getCommunitySummary(request.user!);

    response.status(200).json({ summary });
  } catch (error) {
    next(error);
  }
});

communityRouter.post("/nudges", requireAuth, async (request, response, next) => {
  try {
    const parsedInput = nudgeSchema.safeParse(request.body);
    if (!parsedInput.success) {
      throw new HttpError(400, "Please choose a member to encourage.");
    }

    const summary = await sendOrbitNudge(
      request.user!,
      parsedInput.data.memberId,
    );

    response.status(201).json({ summary });
  } catch (error) {
    next(error);
  }
});

communityRouter.post("/orbits", requireAuth, async (request, response, next) => {
  try {
    const parsedInput = createOrbitSchema.safeParse(request.body);
    if (!parsedInput.success) {
      throw new HttpError(400, "Please choose an Orbit name.");
    }

    const summary = await createOrbit(request.user!, parsedInput.data.name);

    response.status(201).json({ summary });
  } catch (error) {
    next(error);
  }
});

communityRouter.post(
  "/orbits/join",
  requireAuth,
  async (request, response, next) => {
    try {
      const parsedInput = joinOrbitSchema.safeParse(request.body);
      if (!parsedInput.success) {
        throw new HttpError(400, "Please enter a valid Orbit code.");
      }

      const summary = await joinOrbitByCode(request.user!, parsedInput.data.code);

      response.status(200).json({ summary });
    } catch (error) {
      next(error);
    }
  },
);

communityRouter.post(
  "/challenges/join",
  requireAuth,
  async (request, response, next) => {
    try {
      const parsedInput = challengeSchema.safeParse(request.body);
      if (!parsedInput.success) {
        throw new HttpError(400, "Please choose a valid challenge.");
      }

      const summary = await joinCommunityChallenge(
        request.user!,
        parsedInput.data.challengeId,
      );

      response.status(200).json({ summary });
    } catch (error) {
      next(error);
    }
  },
);

communityRouter.post(
  "/challenges/claim",
  requireAuth,
  async (request, response, next) => {
    try {
      const parsedInput = challengeSchema.safeParse(request.body);
      if (!parsedInput.success) {
        throw new HttpError(400, "Please choose a valid challenge.");
      }

      const summary = await claimCommunityChallenge(
        request.user!,
        parsedInput.data.challengeId,
      );

      response.status(200).json({ summary });
    } catch (error) {
      next(error);
    }
  },
);
