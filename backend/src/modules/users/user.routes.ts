import { Router } from "express";
import { z } from "zod";
import { HttpError } from "../../shared/http/http-error.js";
import { requireAuth } from "../auth/require-auth.js";
import {
  getUserActivity,
  getOrCreateUserProfile,
  getUserRewards,
  updateUserProfile,
} from "./user-profile.service.js";

export const userRouter = Router();
const updateProfileSchema = z.object({
  displayName: z.string().trim().min(2).max(60).optional(),
  photoURL: z
    .string()
    .trim()
    .refine(
      (value) =>
        value.startsWith("https://") ||
        /^\/assets\/Mascots\/mas([1-9]|10)\.svg$/.test(value),
      "Please choose a valid profile photo.",
    )
    .optional(),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(24)
    .regex(/^[a-z0-9_]+$/, "Username can use letters, numbers, and _.")
    .optional(),
});

userRouter.get("/me", requireAuth, async (request, response, next) => {
  try {
    const profile = await getOrCreateUserProfile(request.user!);

    response.status(200).json({
      profile,
    });
  } catch (error) {
    next(error);
  }
});

userRouter.patch("/me", requireAuth, async (request, response, next) => {
  try {
    const parsedInput = updateProfileSchema.safeParse(request.body);
    if (!parsedInput.success) {
      throw new HttpError(400, "Please check your profile details.");
    }

    const input = parsedInput.data;
    const profile = await updateUserProfile(request.user!, input);

    response.status(200).json({
      profile,
    });
  } catch (error) {
    next(error);
  }
});

userRouter.get("/rewards", requireAuth, async (request, response, next) => {
  try {
    const rewards = await getUserRewards(request.user!);

    response.status(200).json({
      rewards,
    });
  } catch (error) {
    next(error);
  }
});

userRouter.get("/activity", requireAuth, async (request, response, next) => {
  try {
    const activity = await getUserActivity(request.user!);

    response.status(200).json({
      activity,
    });
  } catch (error) {
    next(error);
  }
});
