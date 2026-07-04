import { createServer } from "http";
import next from "next";

// Prevent unhandled rejections from crashing
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason?.message || reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message, err.stack);
});

const port = parseInt(process.env.PORT || "3000", 10);
const app = next({ dev: false, dir: "/home/z/my-project" });
const handle = app.getRequestHandler();

await app.prepare();

// Create server that listens on :: (dual-stack IPv4+IPv6)
const server = createServer(async (req, res) => {
  try {
    await handle(req, res);
  } catch (err) {
    console.error("Request error:", err.message);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.end("Internal Server Error");
    }
  }
});

server.on("error", (err) => {
  console.error("Server error:", err.message);
});

server.listen(port, "::", () => {
  console.log(`> Dual-stack server ready on http://[::]:${port}`);
});