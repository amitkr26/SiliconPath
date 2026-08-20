import { runNewsSync } from "./run-news-sync.js";

// CLI entry for the scraper worker. Invoked by the deployment cron job, e.g.:
//   node --import tsx dist/index.js news
// Exit code: 0 when at least one feed succeeded, 1 when every feed failed
// (or the DB write failed), 2 for unknown commands.

async function main(): Promise<void> {
  const [, , command] = process.argv;
  if (command === "news") {
    const summary = await runNewsSync();
    const code = summary.sources.length > 0 && summary.total_failed >= summary.sources.length ? 1 : 0;
    // Batch CLI: force-exit after flushing so keep-alive sockets from
    // aborted feed bodies can't hold the event loop open and turn a
    // successful cron run into a timeout (exit code is the contract).
    process.stdout.write(JSON.stringify(summary, null, 2) + "\n", () => process.exit(code));
    return;
  }
  process.stderr.write("usage: node dist/index.js news\n", () => process.exit(2));
}

main().catch((err: unknown) => {
  process.stderr.write(`[worker] fatal: ${err instanceof Error ? err.message : String(err)}\n`, () => process.exit(1));
});