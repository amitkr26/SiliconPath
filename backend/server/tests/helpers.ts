import { test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import type { Express } from "express";
import { createApp } from "../src/app.js";
import { loadEnv } from "../src/config/env.js";
import { fakeSupabase } from "./fake.js";
import type { Deps } from "../src/types.js";

// Spin an app on an ephemeral port so tests can hit it with real HTTP.
export async function withServer(app: Express, fn: (base: string) => Promise<void>) {
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  try {
    await fn(base);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

// Shared test app: no credentials required anywhere (clients are fakes).
export function testApp(dataByTable: Record<string, unknown> = {}, authUser?: { id?: string; role?: string }): Express {
  const deps: Deps = {
    env: loadEnv(),
    supabase: fakeSupabase(dataByTable, authUser),
    supabaseAdmin: fakeSupabase(dataByTable, authUser),
    supabase2Admin: fakeSupabase(dataByTable, authUser),
  };
  return createApp(deps);
}

export { test, assert };