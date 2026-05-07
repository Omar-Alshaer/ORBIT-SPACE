import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { requireAuth } from "../auth/require-auth.js";
import {
  completeDailyMission,
  getDailyMissions,
  uploadMissionProof,
} from "./mission.service.js";

export const missionRouter = Router();
const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  storage: multer.memoryStorage(),
});

const completeMissionParamsSchema = z.object({
  missionId: z.string().min(1),
});

missionRouter.get("/daily", requireAuth, async (request, response, next) => {
  try {
    const summary = await getDailyMissions(request.user!);

    response.status(200).json({
      summary,
    });
  } catch (error) {
    next(error);
  }
});

missionRouter.post(
  "/daily/:missionId/complete",
  requireAuth,
  async (request, response, next) => {
    try {
      const { missionId } = completeMissionParamsSchema.parse(request.params);
      const payload = await completeDailyMission(request.user!, missionId);

      response.status(200).json(payload);
    } catch (error) {
      next(error);
    }
  },
);

missionRouter.post(
  "/daily/:missionId/proof",
  requireAuth,
  upload.single("proof"),
  async (request, response, next) => {
    try {
      const { missionId } = completeMissionParamsSchema.parse(request.params);

      if (!request.file) {
        response.status(400).json({
          error: {
            code: 400,
            message: "Proof image is required.",
          },
        });
        return;
      }

      const payload = await uploadMissionProof({
        file: request.file,
        missionId,
        note: typeof request.body.note === "string" ? request.body.note : "",
        user: request.user!,
      });

      response.status(200).json(payload);
    } catch (error) {
      next(error);
    }
  },
);
