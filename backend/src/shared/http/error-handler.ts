import type { ErrorRequestHandler } from "express";
import { env } from "../../config/env.js";

export const errorHandler: ErrorRequestHandler = (
  error,
  _request,
  response,
  _next,
) => {
  const statusCode =
    typeof error?.statusCode === "number" ? error.statusCode : 500;

  response.status(statusCode).json({
    error: {
      code: statusCode,
      message:
        env.NODE_ENV === "production" && statusCode === 500
          ? "Internal server error"
          : error?.message || "Unexpected server error",
    },
  });
};
