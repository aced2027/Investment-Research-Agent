import { createServer } from "http";
import { readFile } from "fs/promises";
import { join, extname } from "path";

const PORT = 3000;
const PROJECT_DIR = "/home/z/my-project";
const STATIC = join(PROJECT_DIR, ".next/static");

const MIME = {
  ".html":"text/html;charset=utf-8",".js":"application/javascript;charset=utf-8",
  ".css":"text/css;charset=utf-8",".json":"application/json;charset=utf-8",
  ".woff2":"font/woff2",".svg":"image/svg+xml",".png":"image/png",".ico":"image/x-icon",
};

let cachedHtml = null;
async function getHtml() {
  if (!cachedHtml) {
    cachedHtml = await readFile(join(PROJECT_DIR, ".next", "server", "app", "index.html"), "utf-8");
  }
  return cachedHtml;
}

async function serveStatic(filePath, res) {
  try {
    const data = await readFile(filePath);
    res.writeHead(200, { "Content-Type": (MIME[extname(filePath)] || "application/octet-stream"), "Cache-Control": "public, max-age=31536000, immutable" });
    res.end(data);
  } catch { res.writeHead(404); res.end("Not Found"); }
}

async function handleApi(req, res) {
  const url = new URL(req.url, "http://l:" + PORT);
  const path = url.pathname;
  const FINNHUB = "https://finnhub.io/api/v1";
  const KEY = process.env.FINNHUB_API_KEY || "";
  const p = new URLSearchParams(url.searchParams);
  p.set("token", KEY);
  
  const routes = {
    "/api/news": "/news", "/api/company-news": "/company-news",
    "/api/quote": "/quote", "/api/candle": "/stock/candle",
    "/api/profile": "/stock/profile2", "/api/recommendation": "/stock/recommendation",
    "/api/earnings": "/calendar/earnings", "/api/insider-sentiment": "/stock/insider-sentiment",
  };
  
  if (routes[path]) {
    try {
      const fr = await fetch(FINNHUB + routes[path] + "?" + p);
      const ct = fr.headers.get("content-type") || "";
      if (!ct.includes("json")) {
        res.writeHead(200, {"Content-Type":"application/json"});
        return res.end(JSON.stringify({error:"Invalid API key",status:fr.status}));
      }
      const data = await fr.json();
      res.writeHead(200, {"Content-Type":"application/json"});
      return res.end(JSON.stringify(data));
    } catch(e) {
      res.writeHead(500, {"Content-Type":"application/json"});
      return res.end(JSON.stringify({error:e.message,status:500}));
    }
  }
  
  if (path === "/api/summarize" && req.method === "POST") {
    let body = "";
    for await (const c of req) body += c;
    try {
      const ZAI = (await import("z-ai-web-dev-sdk")).default;
      const zai = await ZAI.create();
      const { articles } = JSON.parse(body);
      const prompt = "Analyze these news:\n" + articles.map((a,i)=> i+1+". "+a.headline+" - "+a.summary).join("\n") + "\n\nProvide bullish/bearish signals and outlook.";
      const r = await zai.chat.completions.create({model:"default",messages:[{role:"user",content:prompt}],temperature:0.3});
      res.writeHead(200, {"Content-Type":"application/json"});
      return res.end(JSON.stringify({analysis:r?.choices?.[0]?.message?.content||"Analysis unavailable",sentiment:"Neutral"}));
    } catch(e) {
      res.writeHead(500, {"Content-Type":"application/json"});
      return res.end(JSON.stringify({error:e.message,status:500}));
    }
  }
  
  res.writeHead(404, {"Content-Type":"application/json"});
  res.end(JSON.stringify({error:"Not found",status:404}));
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://l:" + PORT);
    if (url.pathname.startsWith("/api/")) { await handleApi(req, res); return; }
    if (url.pathname.startsWith("/_next/static/")) {
      await serveStatic(join(STATIC, url.pathname.replace("/_next/static/","")), res);
      return;
    }
    // All other routes -> serve the pre-rendered SPA HTML
    const html = await getHtml();
    res.writeHead(200, {"Content-Type":"text/html;charset=utf-8"});
    res.end(html);
  } catch(e) {
    if (!res.headersSent) { res.writeHead(500); res.end("Error"); }
  }
});

server.listen(PORT, "::", () => console.log("> Static server ready on [::]:" + PORT));
