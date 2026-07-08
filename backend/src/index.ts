import express from "express";
import cors from "cors";
import { logger } from "./lib/logger.js";
import healthRouter from "./routes/health.js";
import scrapeRouter from "./routes/scrape-trigger.js";
import { startScheduler } from "./cron/scheduler.js";

const app = express();
const PORT = parseInt(process.env.PORT || "3001", 10);

app.use(cors());
app.use(express.json());

app.use(healthRouter);
app.use(scrapeRouter);

app.get("/", (_req, res) => {
  res.json({
    service: "siliconpath-backend",
    version: "1.0.0",
    status: "running",
  });
});

app.listen(PORT, () => {
  logger.info(`[Server] SiliconPath Backend running on port ${PORT}`);
  startScheduler();
});
