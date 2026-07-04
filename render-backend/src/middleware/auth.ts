import { Request, Response, NextFunction } from 'express';

export function authenticateCron(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return res.status(500).json({ error: 'Cron secret is not configured on the backend server' });
  }

  if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized: Invalid cron auth token' });
  }

  next();
}
