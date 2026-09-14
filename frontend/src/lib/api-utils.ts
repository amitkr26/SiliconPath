import { NextResponse } from "next/server";
import { logger } from "./logger";

export function apiError(error: unknown, context: string, status = 500) {
  const msg = error instanceof Error
    ? error.message
    : (typeof error === "object" && error !== null && "message" in error)
      ? String((error as { message: unknown }).message)
      : String(error);
  logger.error(`api_error:${context}`, { error: msg });
  return NextResponse.json(
    { error: process.env.NODE_ENV === "development" ? msg : "An unexpected error occurred" },
    { status },
  );
}
