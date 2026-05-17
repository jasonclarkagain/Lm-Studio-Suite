import { createServer } from "http";
import { readFile, stat } from "fs/promises";
import { join, extname } from "path";
import { fileURLToPath } from "url";

const PORT = Number(process.env.PORT) || 8082;
const BASE_PATH = (process.env.BASE_PATH || "/").replace(/\/$/, "");
const ROOT = join(fileURLToPath(import.meta.url), "..", "dist", "public");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".txt": "text/plain",
};

const server = createServer(async (req, res) => {
  try {
    let urlPath = req.url.split("?")[0];

    if (BASE_PATH && urlPath.startsWith(BASE_PATH)) {
      urlPath = urlPath.slice(BASE_PATH.length) || "/";
    }

    if (!urlPath.startsWith("/")) urlPath = "/" + urlPath;

    let filePath = join(ROOT, urlPath);

    try {
      const s = await stat(filePath);
      if (s.isDirectory()) filePath = join(filePath, "index.html");
    } catch {
      filePath = join(ROOT, "index.html");
    }

    try {
      await stat(filePath);
    } catch {
      filePath = join(ROOT, "index.html");
    }

    const content = await readFile(filePath);
    const mime = MIME[extname(filePath)] || "application/octet-stream";
    res.writeHead(200, {
      "Content-Type": mime,
      "Cache-Control": "no-cache",
    });
    res.end(content);
  } catch (err) {
    res.writeHead(500);
    res.end("Server error: " + err.message);
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`LM Studio Dashboard serving at http://localhost:${PORT}${BASE_PATH || "/"}`);
});
