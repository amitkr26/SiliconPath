import { Router } from "express";

export function healthRouter(): Router {
  const r = Router();

  // Render uses this for deployment health checks — no auth, no DB required.
  r.get("/", (_req, res) => {
    res.json({ status: "ok" });
  });

  return r;
}