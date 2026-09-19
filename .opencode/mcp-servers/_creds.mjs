// Shared credential lookup for MCP servers.
// Single source of truth: siliconpath-credentials.txt (gitignored, workspace
// root) + .env.local. No secrets are duplicated into new files.

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

export function workspaceRoot() {
  return ROOT;
}

export function readCredentialsFile() {
  const file = resolve(ROOT, "siliconpath-credentials.txt");
  if (!existsSync(file)) return {};
  const text = readFileSync(file, "utf8");
  const conns = [...text.matchAll(/Connection String - (\S+)/g)].map((m) => m[1]);
  // Vercel section, not the first "Access Token" (Cloudflare's cfat_ comes earlier).
  const vercel = text.match(/Vercel[^\n]*\n\s*Access Token: (\S+)/);
  return {
    NEON_1_DATABASE_URL: conns[0],
    NEON_2_DATABASE_URL: conns[1],
    VERCEL_TOKEN: vercel?.[1],
  };
}

export function readEnvLocal(keys) {
  const file = resolve(ROOT, ".env.local");
  if (!existsSync(file)) return {};
  const out = {};
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_0-9]+)=(.*)$/);
    if (m && keys.includes(m[1])) out[m[1]] = m[2].trim();
  }
  return out;
}
