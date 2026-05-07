import { Router } from "express";
import { requireAuth } from "./require-auth.js";

export const authRouter = Router();

authRouter.get("/me", requireAuth, (request, response) => {
  response.status(200).json({
    user: request.user,
  });
});
