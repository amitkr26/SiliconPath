import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { authenticateCron } from '../middleware/auth';

const router = Router();

router.post('/scrape', authenticateCron, async (req: Request, res: Response) => {
  try {
    res.json({
      message: 'News scraping job triggered on Render background runner.',
      status: 'triggered',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/status', async (req: Request, res: Response) => {
  try {
    const { count, error } = await supabase
      .from('news_articles')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    res.json({ status: 'healthy', news_count: count });
  } catch (error: any) {
    res.status(500).json({ status: 'unhealthy', error: error.message });
  }
});

export default router;
