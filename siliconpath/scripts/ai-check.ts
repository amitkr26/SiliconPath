/**
 * AI provider key check. Run with: npx tsx scripts/ai-check.ts
 * Exercises each configured provider with a trivial prompt so a missing/expired
 * key is caught here (or in CI), not by a user-facing failure. Exits non-zero if
 * a configured provider errors.
 */
import { assertProviderKeys } from "../src/lib/ai/providers.js";

async function main() {
  const status = await assertProviderKeys();
  // eslint-disable-next-line no-console
  console.table(status);
  const configured = Object.entries(status).filter(([, s]) => s !== "not_configured");
  if (configured.length === 0) {
    // eslint-disable-next-line no-console
    console.error("No AI providers configured. Set at least one API key.");
    process.exit(1);
  }
  const errored = configured.filter(([, s]) => s.startsWith("error"));
  if (errored.length > 0) process.exit(1);
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
