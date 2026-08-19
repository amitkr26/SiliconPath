import { writeFileSync } from "fs";
import { join } from "path";
import { generateOpenAPISpec } from "../src/openapi/index.js";

const spec = generateOpenAPISpec();
const outPath = join(import.meta.dirname, "..", "openapi.json");
writeFileSync(outPath, JSON.stringify(spec, null, 2));
console.log(`OpenAPI spec written to ${outPath}`);
