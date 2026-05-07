import { Router } from "express";
import { authRouter } from "../modules/auth/auth.routes.js";
import { communityRouter } from "../modules/community/community.routes.js";
import { focusRouter } from "../modules/focus/focus.routes.js";
import { missionRouter } from "../modules/missions/mission.routes.js";
import { userRouter } from "../modules/users/user.routes.js";
import { healthRouter } from "./health.routes.js";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/community", communityRouter);
apiRouter.use("/focus", focusRouter);
apiRouter.use("/health", healthRouter);
apiRouter.use("/missions", missionRouter);
apiRouter.use("/users", userRouter);
