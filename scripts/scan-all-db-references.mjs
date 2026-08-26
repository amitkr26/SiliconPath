import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaMap = JSON.parse(fs.readFileSync(path.resolve(__dirname, "live-schema-map.json"), "utf8"));

const SRC_DIRS = [
  path.resolve(__dirname, "../frontend/src"),
  path.resolve(__dirname, "../backend"),
  path.resolve(__dirname, "../packages"),
  path.resolve(__dirname, "../scripts"),
];

function getAllFiles(dir, exts = [".ts", ".tsx", ".js", ".mjs"]) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.resolve(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (!file.includes("node_modules") && !file.includes(".next") && !file.includes("coverage")) {
        results = results.concat(getAllFiles(fullPath, exts));
      }
    } else {
      if (exts.includes(path.extname(file))) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

const allFiles = SRC_DIRS.flatMap((dir) => getAllFiles(dir));

console.log(`Scanning ${allFiles.length} source files against ${Object.keys(schemaMap).length} live tables...\n`);

const tableMismatches = [];
const columnMismatches = [];
const matchedQueries = [];

// Regular expressions to capture .from("table") blocks and their chained methods
const fromRegex = /\.from\(\s*["'`]?([a-zA-Z0-9_-]+)["'`]?\s*\)/g;

for (const filePath of allFiles) {
  const content = fs.readFileSync(filePath, "utf8");
  const relPath = path.relative(path.resolve(__dirname, ".."), filePath);

  let match;
  while ((match = fromRegex.exec(content)) !== null) {
    const tableName = match[1];
    const startIndex = match.index;

    // Check table existence
    if (!schemaMap[tableName]) {
      // Ignore dynamic variable names or string concatenation artifacts
      if (!["table", "tableName", "tbl", "entity", "name"].includes(tableName)) {
        tableMismatches.push({
          file: relPath,
          table: tableName,
          line: content.substring(0, startIndex).split("\n").length,
        });
      }
      continue;
    }

    const tableCols = new Set(schemaMap[tableName].columns);

    // Extract slice of method chain (e.g. next 500 characters or until semicolon/end of statement)
    const chainSnippet = content.substring(startIndex, startIndex + 600);

    // 1. Check .select("col1, col2, ...")
    const selectMatch = /\.select\(\s*["'`]([^"'`]+)["'`]/g.exec(chainSnippet);
    if (selectMatch) {
      const selectStr = selectMatch[1];
      // Clean joins, count, head, aliases (e.g. "count, head: true", "author:user_profiles(*)")
      const rawCols = selectStr.split(",").map((c) => c.trim()).filter(Boolean);
      for (const rawCol of rawCols) {
        if (rawCol === "*" || rawCol.includes("(") || rawCol.includes(":") || rawCol.includes("!")) continue;
        const colName = rawCol.trim();
        if (colName && !tableCols.has(colName)) {
          columnMismatches.push({
            file: relPath,
            table: tableName,
            column: colName,
            operation: "select",
            line: content.substring(0, startIndex).split("\n").length,
          });
        }
      }
    }

    // 2. Check .eq("col", ...), .neq("col", ...), .order("col"), .ilike("col", ...)
    const filterRegex = /\.(eq|neq|order|ilike|like|gt|gte|lt|lte|in)\(\s*["'`]([a-zA-Z0-9_-]+)["'`]/g;
    let filterMatch;
    while ((filterMatch = filterRegex.exec(chainSnippet)) !== null) {
      const op = filterMatch[1];
      const colName = filterMatch[2];
      if (colName && !tableCols.has(colName) && !["foreignTable", "ascending", "nullsFirst"].includes(colName)) {
        columnMismatches.push({
          file: relPath,
          table: tableName,
          column: colName,
          operation: op,
          line: content.substring(0, startIndex).split("\n").length,
        });
      }
    }

    matchedQueries.push({
      file: relPath,
      table: tableName,
    });
  }
}

console.log("================================================================================");
console.log("   TABLE EXISTENCE AUDIT RESULTS                                                ");
console.log("================================================================================");
if (tableMismatches.length === 0) {
  console.log("✅ Zero non-existent table references found.\n");
} else {
  console.log(`❌ Found ${tableMismatches.length} non-existent table references:`);
  console.table(tableMismatches);
}

console.log("================================================================================");
console.log("   COLUMN EXISTENCE AUDIT RESULTS                                               ");
console.log("================================================================================");
if (columnMismatches.length === 0) {
  console.log("✅ Zero non-existent column references found.\n");
} else {
  console.log(`⚠️ Found ${columnMismatches.length} potential non-existent column references:`);
  console.table(columnMismatches);
}

fs.writeFileSync(
  path.resolve(__dirname, "static-schema-scan-results.json"),
  JSON.stringify({ tableMismatches, columnMismatches, totalMatchedQueries: matchedQueries.length }, null, 2)
);
