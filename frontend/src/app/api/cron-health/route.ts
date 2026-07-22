import { NextResponse } from 'next/server';
import { supabaseAdmin, isConfigured } from '@/lib/supabase';
import { serverError } from "@berojgardegreewala/api";

export async function GET() {
  if (!isConfigured) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 });
  }

  try {
    // A simple health check could verify if the latest news article was 
    // scraped within the last 48 hours. If not, it means the cron job 
    // is failing to insert new news, and we should alert.
    
    const { data: latestNews, error } = await supabaseAdmin
      .from('news_articles')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    let isHealthy = true;
    let message = "All cron jobs appear healthy.";

    if (latestNews) {
      const lastRunDate = new Date(latestNews.created_at);
      const now = new Date();
      const diffHours = (now.getTime() - lastRunDate.getTime()) / (1000 * 60 * 60);
      
      // If no news has been scraped in 48 hours, something might be wrong with the cron
      if (diffHours > 48) {
        isHealthy = false;
        message = `Warning: The last news article was scraped ${diffHours.toFixed(1)} hours ago.`;
      }
    } else {
      isHealthy = false;
      message = "Warning: No news articles found in the database.";
    }

    // You can add more checks here (e.g. replica sync timestamps) if available in DB.

    if (!isHealthy) {
      // Return 500 so Cloud Monitoring detects this as an error and fires an alert.
      return NextResponse.json({ error: message, healthy: false }, { status: 500 });
    }

    return NextResponse.json({ success: true, message, healthy: true });

  } catch (error) {
    console.error("Cron health check error:", error);
    return serverError(error instanceof Error ? error.message : "Unknown error");
  }
}
