import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { createReadStream, existsSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import router from "./routes";
import { logger } from "./lib/logger";

const DASHBOARD_DIST = join(
  fileURLToPath(import.meta.url),
  "..",
  "..",
  "..",
  "lm-studio-dashboard",
  "dist",
  "public",
);

const MIME_TYPES: Record<string, string> = {
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

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

app.use(express.static(DASHBOARD_DIST, { index: "index.html" }));

app.get("/{*splat}", (req, res) => {
  const indexPath = join(DASHBOARD_DIST, "index.html");
  if (existsSync(indexPath)) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    createReadStream(indexPath).pipe(res);
  } else {
    res.status(503).send("Dashboard not built yet. Run: pnpm --filter @workspace/lm-studio-dashboard run build");
  }
});

export default app;
