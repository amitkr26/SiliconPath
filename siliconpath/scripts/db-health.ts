/**
 * Standalone DB health check. Run with: npm run db:health
 * Exits non-zero if any configured DB reports an error, so CI can gate on it.
 */
import { checkDbHealth } from "../src/lib/db/index.js";

async function main() {
  const health = await checkDbHealth();
  // eslint-disable-next-line no-console
  console.table(health);
  const failed = Object.values(health).filter((s) => s === "error");
  if (failed.length > 0) {
    // eslint-disable-next-line no-console
    console.error(`\n${failed.length} database(s) reported an error.`);
    process.exit(1);
  }
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
