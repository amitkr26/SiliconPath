import express from "express";
import cors from "cors";
import { logger } from "./lib/logger.js";
import healthRouter from "./routes/health.js";
import scrapeRouter from "./routes/scrape-trigger.js";
import { startScheduler } from "./cron/scheduler.js";
import { getMetricsPrometheusFormat } from "./lib/metrics.js";

const app = express();
const PORT = parseInt(process.env.PORT || "3001", 10);

// ── Environment validation ─────────────────────────────────────────────────
const REQUIRED_VARS = ["SCRAPER_SECRET"] as const;
const MISSING = REQUIRED_VARS.filter((v) => !process.env[v]);
if (MISSING.length > 0) {
  logger.warn(`[Config] Missing env vars: ${MISSING.join(", ")} (POST /scrape/* will be locked)`);
}

// ── CORS ────────────────────────────────────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((s) => s.trim())
  : ["http://localhost:3000", "http://localhost:5173", "https://siliconpath.vercel.app"];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(null, false);
  },
  credentials: true,
}));

app.use(express.json({ limit: "1mb" }));

// ── Rate limiter (simple in-memory token bucket) ──────────────────────────
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = +process.env.RATE_LIMIT_MAX! || 120; // 120 req/min per IP
const buckets = new Map<string, { tokens: number; resetAt: number }>();

function rateLimit(_req: express.Request, res: express.Response, next: express.NextFunction) {
  const ip = _req.ip ?? _req.socket.remoteAddress ?? "unknown";
  const now = Date.now();
  let bucket = buckets.get(ip);
  if (!bucket || now > bucket.resetAt) {
    bucket = { tokens: RATE_MAX, resetAt: now + RATE_WINDOW_MS };
    buckets.set(ip, bucket);
  }
  if (bucket.tokens <= 0) {
    res.status(429).json({ error: "Too many requests", retry_after_ms: bucket.resetAt - now });
    return;
  }
  bucket.tokens--;
  next();
}

app.use(rateLimit);

// ── Metrics ────────────────────────────────────────────────────────────────
app.get("/metrics", (_req, res) => {
  res.set("Content-Type", "text/plain; version=0.0.4");
  res.send(getMetricsPrometheusFormat());
});

// ── Routes ──────────────────────────────────────────────────────────────────
app.use(healthRouter);
app.use(scrapeRouter);

app.get("/", (_req, res) => {
  res.json({
    service: "siliconpath-backend",
    version: "1.0.0",
    status: "running",
  });
});

// ── Start ──────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(`[Server] SiliconPath Backend running on port ${PORT}`);
  startScheduler();
});

export default app;
