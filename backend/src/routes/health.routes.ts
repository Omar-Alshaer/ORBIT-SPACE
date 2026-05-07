import { Router } from "express";
import { z } from "zod";
import { getHealthSummary, saveHealthCheckIn } from "../modules/health/health.service.js";
import { requireAuth } from "../modules/auth/require-auth.js";
import { HttpError } from "../shared/http/http-error.js";

export const healthRouter = Router();
const saveHealthCheckInSchema = z.object({
  movementMinutes: z.number().int().min(0).max(240),
  note: z.string().trim().max(160).optional(),
  sleepHours: z.number().min(0).max(16),
  waterCups: z.number().int().min(0).max(20),
});

healthRouter.get("/", (_request, response) => {
  response.status(200).json({
    ok: true,
    service: "orbit-api",
    timestamp: new Date().toISOString(),
  });
});

healthRouter.get("/summary", requireAuth, async (request, response, next) => {
  try {
    const summary = await getHealthSummary(request.user!);

    response.status(200).json({ summary });
  } catch (error) {
    next(error);
  }
});

healthRouter.put("/today", requireAuth, async (request, response, next) => {
  try {
    const parsedInput = saveHealthCheckInSchema.safeParse(request.body);
    if (!parsedInput.success) {
      throw new HttpError(400, "Please check your health check-in.");
    }

    const summary = await saveHealthCheckIn(request.user!, parsedInput.data);

    response.status(200).json({ summary });
  } catch (error) {
    next(error);
  }
});
