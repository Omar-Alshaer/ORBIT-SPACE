import { Router } from "express";
import { z } from "zod";
import { HttpError } from "../../shared/http/http-error.js";
import { requireAuth } from "../auth/require-auth.js";
import { completeFocusSession, getFocusSummary } from "./focus.service.js";

export const focusRouter = Router();

const completeFocusSessionSchema = z.object({
  hp: z.number().int().min(1).max(200),
  minutes: z.number().int().min(1).max(180),
  note: z.string().trim().max(160).optional(),
  planId: z.string().trim().min(2).max(40),
  planName: z.string().trim().min(2).max(60),
});

focusRouter.get("/summary", requireAuth, async (request, response, next) => {
  try {
    const summary = await getFocusSummary(request.user!);

    response.status(200).json({ summary });
  } catch (error) {
    next(error);
  }
});

focusRouter.post("/sessions", requireAuth, async (request, response, next) => {
  try {
    const parsedInput = completeFocusSessionSchema.safeParse(request.body);
    if (!parsedInput.success) {
      throw new HttpError(400, "Please check your focus session.");
    }

    const payload = await completeFocusSession(request.user!, parsedInput.data);

    response.status(201).json(payload);
  } catch (error) {
    next(error);
  }
});
