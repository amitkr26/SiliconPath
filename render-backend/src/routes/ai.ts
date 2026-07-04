import { Router, Request, Response } from 'express';
import { authenticateCron } from '../middleware/auth';

const router = Router();

router.post('/summarize-batch', authenticateCron, async (req: Request, res: Response) => {
  try {
    res.json({
      message: 'Batch AI summarization triggered on Render background runner.',
      status: 'triggered',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
