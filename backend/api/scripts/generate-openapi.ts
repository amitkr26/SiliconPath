import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { generateOpenAPISpec } from "../src/openapi/index.js";

// Regenerates openapi.json from the zod-driven spec in src/openapi.
// Run: npm run openapi --workspace @berojgardegreewala/api

const out = join(dirname(fileURLToPath(import.meta.url)), "..", "openapi.json");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(generateOpenAPISpec(), null, 2) + "\n");
// eslint-disable-next-line no-console
console.log(`openapi.json written: ${out}`);