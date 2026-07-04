import { createServer } from "http";
import { readFileSync, existsSync } from "fs";
import { join, extname } from "path";

process.on('unhandledRejection', (r) => console.error('UR:', r?.message || r));
process.on('uncaughtException', (e) => console.error('UE:', e.message));

const PORT = 3000;
const DIR = "/home/z/my-project";
const BUILD = join(DIR, ".next");

// Load Next.js
let handle;
try {
  const next = (await import("next")).default;
  const app = next({ dev: false, hostname: "0.0.0.0", port: PORT, dir: DIR });
  handle = app.getRequestHandler();
  await app.prepare();
  console.log("Next.js prepared");
} catch (e) {
  console.error("Next.js init error:", e.message);
  process.exit(1);
}

const MIME = {
  ".html": "text/html;charset=utf-8",
  ".js": "application/javascript;charset=utf-8",
  ".css": "text/css;charset=utf-8",
  ".json": "application/json;charset=utf-8",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  try {
    await handle(req, res);
  } catch (err) {
    console.error("Handle error:", url.pathname, err.message);
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Error: " + err.message);
    }
  }
});

server.on("error", (err) => console.error("Server error:", err.message));
server.keepAliveTimeout = 65000;
server.headersTimeout = 60000;
server.requestTimeout = 120000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`> Server ready on http://0.0.0.0:${PORT}`);
});
