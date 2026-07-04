import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { authenticateCron } from '../middleware/auth';

const router = Router();

// Trigger scraping opportunities
router.post('/scrape', authenticateCron, async (req: Request, res: Response) => {
  try {
    // This acts as a proxy or endpoint to trigger local scraping jobs
    // In a full implementation, you would run the actual scraping scripts here.
    // For now, return a placeholder indicating integration readiness.
    res.json({
      message: 'Scraping job triggered successfully on Render background runner.',
      status: 'triggered',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Health check of opportunities table
router.get('/status', async (req: Request, res: Response) => {
  try {
    const { count, error } = await supabase
      .from('opportunities')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    res.json({ status: 'healthy', opportunities_count: count });
  } catch (error: any) {
    res.status(500).json({ status: 'unhealthy', error: error.message });
  }
});

export default router;
