import { generateOpenAPISpec } from "../src/openapi";
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const spec = generateOpenAPISpec();
const outPath = join(__dirname, "..", "openapi.json");
writeFileSync(outPath, JSON.stringify(spec, null, 2));
console.log(`OpenAPI spec written to ${outPath}`);
