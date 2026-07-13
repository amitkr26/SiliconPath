import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { unauthorized, forbidden } from "./responses";

export interface AuthUser {
  id: string;
  email: string;
  role?: string;
}

export async function getUser(request: NextRequest): Promise<AuthUser | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return null;

  return {
    id: user.id,
    email: user.email || "",
    role: user.role,
  };
}

export async function requireAuth(request: NextRequest): Promise<AuthUser> {
  const user = await getUser(request);
  if (!user) throw unauthorized();
  return user;
}

export async function requireAdmin(request: NextRequest): Promise<AuthUser> {
  const user = await requireAuth(request);
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) throw forbidden("Admin not configured");

  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw forbidden("Admin token required");
  }

  const token = authHeader.slice(7);
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    if (!decoded.startsWith("admin:") || decoded.slice(6) !== adminPassword) {
      throw forbidden("Invalid admin token");
    }
  } catch {
    throw forbidden("Invalid admin token");
  }

  return { ...user, role: "admin" };
}

export async function requireCron(request: NextRequest): Promise<void> {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) throw forbidden("Cron not configured");

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    throw forbidden("Invalid cron secret");
  }
}

export function withAuth<T extends unknown[]>(
  handler: (request: NextRequest, user: AuthUser, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T) => {
    try {
      const user = await requireAuth(request);
      return handler(request, user, ...args);
    } catch (e) {
      if (e instanceof NextResponse) return e;
      throw e;
    }
  };
}

export function withAdmin<T extends unknown[]>(
  handler: (request: NextRequest, user: AuthUser, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T) => {
    try {
      const user = await requireAdmin(request);
      return handler(request, user, ...args);
    } catch (e) {
      if (e instanceof NextResponse) return e;
      throw e;
    }
  };
}

export function withCron<T extends unknown[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T) => {
    try {
      await requireCron(request);
      return handler(request, ...args);
    } catch (e) {
      if (e instanceof NextResponse) return e;
      throw e;
    }
  };
}