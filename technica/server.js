"use strict";
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { loadEnvironment } = require("./lib/config");
const { createCommunity, fail } = require("./lib/community");
const { explain } = require("./lib/guide");
loadEnvironment();
function createApp(options = {}) {
  const community = createCommunity(
    options.dataDirectory || path.join(__dirname, "data"),
  );
  const publicRoot = fs.realpathSync(path.join(__dirname, "public"));
  const limits = new Map();
  const send = (res, status, value) => {
    res.writeHead(status, {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    });
    res.end(JSON.stringify(value));
  };
  async function body(req) {
    if (!req.headers["content-type"]?.startsWith("application/json"))
      throw fail(415, "Send application/json.");
    let size = 0;
    const chunks = [];
    for await (const chunk of req) {
      size += chunk.length;
      if (size > 16000) throw fail(413, "Request is too large.");
      chunks.push(chunk);
    }
    try {
      const data = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      if (!data || typeof data !== "object" || Array.isArray(data)) throw 0;
      return data;
    } catch {
      throw fail(400, "Send a JSON object.");
    }
  }
  function authorize(req) {
    const secret = options.reviewerKey ?? process.env.REVIEWER_KEY;
    if (!secret || secret.length < 24)
      throw fail(
        503,
        "Reviewer access is not configured. Set a REVIEWER_KEY of at least 24 characters on the server.",
      );
    const supplied = req.headers.authorization || "";
    const digest = (value) =>
      crypto.createHash("sha256").update(value).digest();
    if (!crypto.timingSafeEqual(digest(supplied), digest(`Bearer ${secret}`)))
      throw fail(401, "Reviewer key not accepted.");
  }
  return http.createServer(async (req, res) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self'; style-src 'self'; style-src-attr 'unsafe-inline'; img-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
    );
    try {
      const url = new URL(req.url, "http://localhost");
      if (url.pathname.startsWith("/api/")) {
        loadEnvironment();
        const now = Date.now();
        for (const [key, value] of limits)
          if (value.until < now) limits.delete(key);
        const ip = req.socket.remoteAddress;
        const limited = limits.get(ip) || { count: 0, until: now + 60000 };
        limited.count++;
        limits.set(ip, limited);
        if (limited.count > 100) {
          res.setHeader("Retry-After", "60");
          throw fail(429, "Please wait a minute before trying again.");
        }
        if (
          (req.headers.origin &&
            req.headers.origin !== `http://${req.headers.host}` &&
            req.headers.origin !== `https://${req.headers.host}`) ||
          req.headers["sec-fetch-site"] === "cross-site"
        )
          throw fail(403, "Use this site to send a request.");
        const route = url.pathname;
        const isReviewer =
          route === "/api/review" || route.startsWith("/api/review/");
        if (isReviewer) authorize(req);
        if (route === "/api/community" && req.method === "GET")
          return send(res, 200, { contributions: await community.published() });
        if (route === "/api/community" && req.method === "POST")
          return send(res, 201, await community.submit(await body(req)));
        if (route === "/api/community/remove" && req.method === "POST")
          return send(res, 200, await community.remove(await body(req)));
        if (route === "/api/review" && req.method === "GET")
          return send(res, 200, { contributions: await community.list() });
        if (/^\/api\/review\/[\w-]+$/.test(route) && req.method === "POST")
          return send(
            res,
            200,
            await community.moderate(route.split("/").pop(), await body(req)),
          );
        if (route === "/api/explain" && req.method === "POST")
          return send(res, 200, await explain(await body(req)));
        throw fail(404, "This route is not available.");
      }
      if (!["GET", "HEAD"].includes(req.method))
        throw fail(405, "Method not allowed.");
      let decoded;
      try {
        decoded = decodeURIComponent(url.pathname);
      } catch {
        throw fail(400, "Malformed URL.");
      }
      const filename = path.resolve(
        publicRoot,
        "." + (decoded === "/" ? "/index.html" : decoded),
      );
      if (!filename.startsWith(publicRoot + path.sep))
        throw fail(403, "Path is not allowed.");
      let actual;
      try {
        actual = await fs.promises.realpath(filename);
      } catch {
        throw fail(404, "Not found.");
      }
      if (!actual.startsWith(publicRoot + path.sep))
        throw fail(403, "Path is not allowed.");
      const stat = await fs.promises.stat(actual);
      if (!stat.isFile()) throw fail(404, "Not found.");
      const types = {
        ".html": "text/html; charset=utf-8",
        ".js": "text/javascript; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".svg": "image/svg+xml",
        ".jpg": "image/jpeg",
      };
      res.writeHead(200, {
        "content-type":
          types[path.extname(actual)] || "application/octet-stream",
        "content-length": stat.size,
        "cache-control": "no-cache",
      });
      if (req.method === "HEAD") return res.end();
      fs.createReadStream(actual)
        .on("error", () => res.destroy())
        .pipe(res);
    } catch (error) {
      if (!res.headersSent)
        send(res, error.status || 500, {
          error: error.status
            ? error.message
            : "Unable to save or load right now. Please try again.",
        });
      else res.end();
    }
  });
}
if (require.main === module) {
  const port = Number(process.env.PORT || 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.error("PORT must be between 1 and 65535.");
    process.exit(1);
  }
  const server = createApp();
  server.on("error", (e) => {
    console.error(
      e.code === "EADDRINUSE"
        ? `Port ${port} is in use. Stop the previous server or change PORT.`
        : "Server could not start.",
    );
    process.exit(1);
  });
  server.listen(port, "127.0.0.1", () =>
    console.log(`Harbor Academy running on http://localhost:${port}`),
  );
}
module.exports = { createApp };
