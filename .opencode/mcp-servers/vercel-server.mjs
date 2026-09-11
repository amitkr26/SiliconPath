// Vercel MCP server: deploy, list deployments, fetch logs, list env vars.
// Uses the Vercel CLI with the token from siliconpath-credentials.txt.

import { spawn } from "node:child_process";
import path from "node:path";
import { startMcpServer } from "./_rpc.mjs";
import { readCredentialsFile, workspaceRoot } from "./_creds.mjs";

const TOKEN = process.env.VERCEL_TOKEN || readCredentialsFile().VERCEL_TOKEN;
if (!TOKEN) {
  console.error("vercel MCP: no VERCEL_TOKEN found (siliconpath-credentials.txt)");
  process.exit(1);
}

function runVercel(args, { timeoutMs = 300000 } = {}) {
  return new Promise((resolve, reject) => {
    const npmBin = process.platform === "win32"
      ? process.env.APPDATA + "\\npm"
      : process.env.HOME + "/.npm-global/bin";
    const env = { ...process.env, VERCEL_TOKEN: TOKEN, PATH: npmBin + path.delimiter + process.env.PATH };

    const isWin = process.platform === "win32";
    const cmd = isWin ? "cmd.exe" : "vercel";
    const spawnArgs = isWin ? ["/c", "vercel", ...args] : args;

    const child = spawn(cmd, spawnArgs, {
      cwd: workspaceRoot(),
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let out = "";
    let err = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`vercel CLI timed out after ${timeoutMs}ms: ${out} ${err}`));
    }, timeoutMs);
    child.stdout.on("data", (d) => (out += d.toString()));
    child.stderr.on("data", (d) => (err += d.toString()));
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve(out + err);
      else reject(new Error(`vercel CLI exited ${code}: ${out + err}`));
    });
    child.on("error", (e) => {
      clearTimeout(timer);
      reject(e);
    });
  });
}

const clean = (s) => s.replace(/\r/g, "\n").split("\n").map((l) => l.trim()).filter(Boolean).join("\n");

startMcpServer({
  name: "vercel",
  version: "1.0.0",
  tools: [
    {
      name: "vercel_deploy",
      description: "Deploy to Vercel. prod=true for production. Returns the deployment URL.",
      inputSchema: {
        type: "object",
        properties: {
          prod: { type: "boolean", default: true },
          dir: { type: "string", description: "Directory to deploy (default: frontend)" },
        },
      },
      handler: async ({ prod = true, dir = "frontend" }) => {
        const args = ["deploy", dir];
        if (prod) args.push("--prod");
        args.push("--yes");
        return clean(await runVercel(args, { timeoutMs: 420000 }));
      },
    },
    {
      name: "vercel_deployments",
      description: "List recent deployments (last N, default 10).",
      inputSchema: {
        type: "object",
        properties: { limit: { type: "number", default: 10 } },
      },
      handler: async ({ limit = 10 }) => clean(await runVercel(["ls", `--limit=${limit}`])),
    },
    {
      name: "vercel_logs",
      description: "Runtime logs for a deployment: vercel_logs({url, query?})",
      inputSchema: {
        type: "object",
        properties: {
          url: { type: "string", description: "Deployment URL, e.g. https://berojgardegreewala.vercel.app" },
          query: { type: "string", description: "Log filter query" },
        },
        required: ["url"],
      },
      handler: async ({ url, query }) => clean(await runVercel(["logs", url, ...(query ? [query] : [])])),
    },
    {
      name: "vercel_env",
      description: "List env vars for the project (optionally one var name).",
      inputSchema: {
        type: "object",
        properties: { name: { type: "string", description: "Env var name (optional)" } },
      },
      handler: async ({ name }) => clean(await runVercel(["env", "ls", ...(name ? [name] : [])])),
    },
  ],
});