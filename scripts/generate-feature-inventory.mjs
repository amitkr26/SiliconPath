import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appDir = path.resolve(__dirname, "../frontend/src/app");

function scanRoutes(dir, baseRoute = "") {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const routes = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const nextBase = baseRoute ? `${baseRoute}/${entry.name}` : `/${entry.name}`;
      routes.push(...scanRoutes(fullPath, nextBase));
    } else if (entry.name === "page.tsx" || entry.name === "page.jsx") {
      routes.push(baseRoute || "/");
    }
  }
  return routes;
}

const allRoutes = scanRoutes(appDir);
console.log("Discovered routes count:", allRoutes.length);
console.log(allRoutes);
