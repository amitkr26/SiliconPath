import { runNewsSync } from "./run-news-sync.js";

// CLI entry for the scraper worker. Invoked by the deployment cron job, e.g.:
//   node --import tsx dist/index.js news
// Exit code: 0 when at least one feed succeeded, 1 when every feed failed
// (or the DB write failed), 2 for unknown commands.

async function main(): Promise<void> {
  const [, , command] = process.argv;
  if (command === "news") {
    const summary = await runNewsSync();
    console.log(JSON.stringify(summary, null, 2));
    process.exitCode = summary.sources.length > 0 && summary.total_failed >= summary.sources.length ? 1 : 0;
    return;
  }
  console.error("usage: node dist/index.js news");
  process.exitCode = 2;
}

main().catch((err: unknown) => {
  console.error("[worker] fatal:", err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});