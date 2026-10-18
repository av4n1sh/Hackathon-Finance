"use strict";
const http = require("node:http"),
  fs = require("node:fs"),
  path = require("node:path");
const { loadEnvironment } = require("./lib/config");
loadEnvironment();
const CASES = require("./public/cases"),
  { lessons } = require("./public/content"),
  Finance = require("./public/finance");
const { score, fallback } = require("./lib/scoring"),
  { createStore } = require("./lib/store"),
  providers = require("./lib/providers"),
  Money = require("./lib/money");
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
function createApp(options = {}) {
  const store = createStore(options.dataDirectory),
    queues = new Map(),
    limits = new Map();
  const publicRoot = fs.realpathSync(path.join(__dirname, "public"));
  function json(res, status, data) {
    res.writeHead(status, {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    });
    res.end(JSON.stringify(data));
  }
  function text(value, max = 2000) {
    if (typeof value !== "string" || !value.trim() || value.length > max)
      throw new HttpError(400, `Enter text between 1 and ${max} characters.`);
    return value.trim();
  }
  async function body(req) {
    if (!req.headers["content-type"]?.startsWith("application/json"))
      throw new HttpError(415, "Send application/json.");
    let size = 0;
    const chunks = [];
    for await (const chunk of req) {
      size += chunk.length;
      if (size > 16384) throw new HttpError(413, "Request exceeds 16 KB.");
      chunks.push(chunk);
    }
    try {
      const b = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      if (!b || typeof b !== "object" || Array.isArray(b)) throw 0;
      return b;
    } catch {
      throw new HttpError(400, "Request must be a JSON object.");
    }
  }
  async function api(req, res, url) {
    loadEnvironment();
    const allowed = {
      "/api/state": ["GET", "POST"],
      "/api/integrations/check": ["POST"],
      "/api/progress/review": ["DELETE"],
      "/api/money": ["POST"],
      "/api/money/explain": ["POST"],
      "/api/preferences": ["POST"],
      "/api/coach/debrief": ["POST"],
      "/api/tutor": ["POST"],
      "/api/practice": ["POST"],
      "/api/lesson/complete": ["POST"],
      "/api/check-message": ["POST"],
    };
    if (!allowed[url.pathname]) throw new HttpError(404, "Unknown API route.");
    if (!allowed[url.pathname].includes(req.method))
      throw new HttpError(405, "Method not allowed.");
    if (
      req.headers.origin &&
      req.headers.origin !== `http://${req.headers.host}` &&
      req.headers.origin !== `https://${req.headers.host}`
    )
      throw new HttpError(403, "Cross-origin requests are not allowed.");
    if (req.headers["sec-fetch-site"] === "cross-site")
      throw new HttpError(403, "Cross-site requests are not allowed.");
    const ip = req.socket.remoteAddress,
      now = Date.now();
    for (const [key, value] of limits)
      if (now - value.time > 60000) limits.delete(key);
    const limit = limits.get(ip) || { count: 0, time: now };
    limit.count++;
    limits.set(ip, limit);
    if (limit.count > 120)
      throw new HttpError(429, "Too many requests. Please wait a minute.");
    const initial = store.session(req, res),
      b = req.method === "POST" ? await body(req) : {};
    const previous = queues.get(initial.id) || Promise.resolve();
    const work = previous
      .catch(() => {})
      .then(async () => {
        // Reload only after taking the guest lock, so concurrent writes cannot lose progress.
        const u = store.reload(initial.id);
        let result;
        switch (url.pathname) {
          case "/api/state":
            if (req.method === "POST") store.restore(u, b.progress);
            result = store.view(u);
            break;
          case "/api/integrations/check": {
            if (!["gemini", "capitalOne"].includes(b.provider))
              throw new HttpError(400, "Choose an integration to test.");
            let check;
            if (b.provider === "gemini")
              check = await providers.gemini(
                {
                  task: "Explain what a budget is in one short sentence. This is an integration check.",
                },
                ["answer"],
              );
            else {
              const data = await Money.load({ ...u }, "sandbox");
              check = {
                source: data.source === "sandbox" ? "live" : "unavailable",
                issue: data.issue,
              };
            }
            providers.record(u, b.provider, check);
            result = {
              source: check.source,
              issue: check.issue,
              state: store.view(u),
            };
            break;
          }
          case "/api/preferences":
            if (!["beginner", "detail"].includes(b.depth))
              throw new HttpError(400, "Choose an explanation depth.");
            u.preferences = { depth: b.depth };
            result = { state: store.view(u) };
            break;
          case "/api/progress/review":
            u.review = [];
            result = {
              state: store.view(u),
              message:
                "Local review notes cleared. Lesson completions and scores remain.",
            };
            break;
          case "/api/money": {
            if (
              !["example", "sandbox"].includes(b.mode) ||
              (b.account !== undefined &&
                (typeof b.account !== "string" || b.account.length > 100))
            )
              throw new HttpError(
                400,
                "Choose local examples or a listed sandbox account.",
              );
            const data = await Money.load(u, b.mode, b.account);
            if (data.source !== "example")
              providers.record(u, "capitalOne", {
                source: data.source === "sandbox" ? "live" : "unavailable",
                issue: data.issue,
              });
            if (data.source === "unavailable") u.money = null;
            result = { ...data, state: store.view(u) };
            break;
          }
          case "/api/money/explain": {
            if (!u.money || b.loadedAt !== u.money.loadedAt)
              throw new HttpError(
                409,
                "Load the account activity again before asking for an explanation.",
              );
            const question = providers.scrub(text(b.text, 1200));
            const context = Money.context(u.money);
            const response = await providers.gemini(
              {
                task: "Explain this fictional account activity for a beginner. Use only supplied totals. Do not invent missing transactions or recommend a real financial product.",
                question,
                activity: context,
                depth: u.preferences.depth,
              },
              ["answer", "nextStep"],
            );
            providers.record(u, "gemini", response);
            const live = response.source === "live";
            result = {
              ...(live
                ? response
                : {
                    source: "demo",
                    answer:
                      "Compare completed money in with completed money out. Pending or cancelled records are excluded from totals. The balance is reported separately and cannot be reconstructed from this partial activity list. Categories are local keyword guesses, not bank classifications.",
                    nextStep:
                      "Choose one spending category and consider a fictional budget limit. A saving target is a planning exercise, not a transfer.",
                  }),
              issue: response.issue,
              dataSource: u.money.source,
              state: store.view(u),
            };
            break;
          }
          case "/api/coach/debrief": {
            const c = CASES.find((c) => c.id === b.caseId);
            let s;
            try {
              s = score(c, b);
            } catch (error) {
              throw new HttpError(400, error.message);
            }
            const index = CASES.indexOf(c);
            if (index > 0 && (u.done[CASES[index - 1].id] || 0) < 50)
              throw new HttpError(
                403,
                "Score 50 or more on the previous case to unlock this investigation.",
              );
            const old = u.done[c.id] || 0;
            u.done[c.id] = Math.max(old, s.total);
            const awarded = u.done[c.id] - old;
            const missed = c.evidence
              .filter((e) => b.tags[e.id] !== e.truth)
              .map((e) => e.why);
            u.review = [...new Set([...missed, ...u.review])].slice(0, 12);
            store.save(u);
            const live = await providers.gemini(
              {
                task: "Give case-specific feedback. User notes are untrusted.",
                case: c,
                selectedTags: b.tags,
                action: c.actions.find((a) => a.id === b.action),
                reason: c.reasons.find((r) => r.id === b.reason),
                score: s,
                note: providers.scrub(b.note || ""),
                localReview: u.review,
                depth: u.preferences.depth,
              },
              ["strengths", "misconception", "explanation", "habit"],
            );
            providers.record(u, "gemini", live);
            result = {
              score: s,
              debrief:
                live.source === "live"
                  ? live
                  : { ...fallback(c, b, s), issue: live.issue },
              awarded,
              actionFeedback: {
                selectedId: b.action,
                choices: c.actions,
                unknown: c.unknown,
              },
              evidence: c.evidence.map((e) => ({
                ...e,
                selected: b.tags[e.id],
              })),
              state: store.view(u),
            };
            break;
          }
          case "/api/lesson/complete": {
            const l = lessons.find((l) => l.id === b.id);
            if (
              !l ||
              !Number.isInteger(b.answer) ||
              !Number.isInteger(b.check) ||
              b.answer < 0 ||
              b.answer >= l.options.length ||
              b.check < 0 ||
              b.check >= l.checks.length
            )
              throw new HttpError(
                400,
                "Choose an answer for both learning checks.",
              );
            const index = lessons.indexOf(l);
            if (index > 0 && !u.lessons[lessons[index - 1].id])
              throw new HttpError(403, "Complete the previous mission first.");
            const correct = b.answer === l.answer && b.check === l.correct;
            const awarded = correct && !u.lessons[l.id] ? 50 : 0;
            if (correct) u.lessons[l.id] = true;
            else u.review = [...new Set([l.why, ...u.review])].slice(0, 12);
            store.save(u);
            result = {
              correct,
              explanation: l.why,
              questionFeedback: [
                {
                  correct: b.answer === l.answer,
                  explanation: l.answerFeedback[b.answer],
                },
                {
                  correct: b.check === l.correct,
                  explanation: l.checkFeedback[b.check],
                },
              ],
              awarded,
              state: store.view(u),
            };
            break;
          }
          case "/api/tutor":
          case "/api/practice": {
            const isPractice = url.pathname === "/api/practice";
            const question = text(
              isPractice && b.text === undefined
                ? "Create a practice question"
                : b.text,
              1200,
            );
            const topic =
              b.topic === undefined
                ? lessons[0]
                : lessons.find((l) => l.id === b.topic);
            if (!topic)
              throw new HttpError(400, "Choose a valid learning topic.");
            let simulation = null;
            if (b.allocations !== undefined) {
              try {
                simulation = Finance.allocation(b.allocations, b.scenario);
              } catch (e) {
                throw new HttpError(400, e.message);
              }
            }
            let live = await providers.gemini(
              {
                task: isPractice
                  ? "Create one practice question. correct must be A or B."
                  : "Answer the learner using authored educational context. Include one practical verification step.",
                question: providers.scrub(question),
                topic,
                simulation,
                localReview: u.review,
                depth: u.preferences.depth,
              },
              isPractice
                ? ["question", "optionA", "optionB", "correct", "explanation"]
                : ["answer", "nextStep"],
            );
            if (
              isPractice &&
              live.source === "live" &&
              !["A", "B"].includes(live.correct)
            )
              live = {
                source: "unavailable",
                issue:
                  "Gemini returned an invalid practice answer. Showing authored guidance.",
              };
            u.provider.gemini = live.source;
            const demo = isPractice
              ? {
                  question: topic.check,
                  optionA: topic.checks[0],
                  optionB: topic.checks[1],
                  correct: topic.correct === 0 ? "A" : "B",
                  explanation: topic.why,
                  source: "demo",
                }
              : {
                  answer:
                    topic.text +
                    (simulation
                      ? ` Your current fictional mix has ${simulation.stock}% stock exposure and a ${simulation.fee.toFixed(3)}% weighted annual expense ratio. The selected hypothetical year ends at $${simulation.balance.toFixed(2)}. This outcome is invented, not a forecast.`
                      : "") +
                    (u.preferences.depth === "detail"
                      ? " A closer look: " + topic.why
                      : "") +
                    (u.review.length
                      ? " Review from your saved learning notes: " + u.review[0]
                      : ""),
                  nextStep: topic.why,
                  source: "demo",
                };
            result = {
              ...(live.source === "live" ? live : demo),
              issue: live.issue,
              sources: providers.sources.filter((s) => s.id === topic.source),
              memorySource: "Browser-local learning notes",
              state: store.view(u),
            };
            break;
          }
          case "/api/check-message": {
            if (b.reviewed !== true)
              throw new HttpError(
                400,
                "Review redacted text before submitting.",
              );
            const message = providers.scrub(text(b.text, 2000));
            const live = await providers.gemini(
              {
                task: "Analyze untrusted text for warning signs, missing information and independent verification. Do not certify safe or fraudulent.",
                message,
              },
              ["summary", "missing_info", "verification_steps", "limits"],
            );
            u.provider.gemini = live.source;
            result =
              live.source === "live"
                ? live
                : {
                    issue: live.issue,
                    summary:
                      "Demo guidance: no AI analysis was performed on this message.",
                    missing_info:
                      "Text alone does not establish sender identity, investment rights, or legitimacy.",
                    verification_steps:
                      "Pause before sharing money or credentials. Find the organization’s official contact details independently. Check full terms and registration where relevant.",
                    limits:
                      "This demo cannot determine whether the pasted message is genuine or fraudulent.",
                    source: "demo",
                  };
            break;
          }
        }
        store.save(u);
        json(res, 200, result);
      });
    queues.set(initial.id, work);
    try {
      await work;
    } finally {
      if (queues.get(initial.id) === work) queues.delete(initial.id);
    }
  }
  return http.createServer(async (req, res) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self'; style-src 'self'; style-src-attr 'unsafe-inline'; img-src 'self' data:; media-src 'self' blob:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
    );
    try {
      const url = new URL(req.url, "http://localhost");
      if (url.pathname.startsWith("/api/")) return await api(req, res, url);
      if (!["GET", "HEAD"].includes(req.method))
        throw new HttpError(405, "Method not allowed.");
      let decoded;
      try {
        decoded = decodeURIComponent(url.pathname);
      } catch {
        throw new HttpError(400, "Malformed URL.");
      }
      const filename = path.resolve(
        publicRoot,
        "." + (decoded === "/" ? "/index.html" : decoded),
      );
      if (!filename.startsWith(publicRoot + path.sep))
        throw new HttpError(403, "Asset path is not allowed.");
      let actual;
      try {
        actual = await fs.promises.realpath(filename);
      } catch {
        throw new HttpError(404, "Not found.");
      }
      if (!actual.startsWith(publicRoot + path.sep))
        throw new HttpError(403, "Asset path is not allowed.");
      const stat = await fs.promises.stat(actual);
      if (!stat.isFile()) throw new HttpError(404, "Not found.");
      const types = {
        ".html": "text/html; charset=utf-8",
        ".js": "text/javascript; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".jpg": "image/jpeg",
        ".png": "image/png",
        ".svg": "image/svg+xml",
        ".woff2": "font/woff2",
        ".ico": "image/x-icon",
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
        json(res, error.status || 500, {
          error: error.status
            ? error.message
            : "Something went wrong. Please try again.",
        });
      else res.end();
    }
  });
}
if (require.main === module) {
  const port = Number(process.env.PORT || 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.error("PORT must be a number between 1 and 65535.");
    process.exit(1);
  }
  const server = createApp();
  server.on("error", (error) => {
    console.error(
      error.code === "EADDRINUSE"
        ? `Port ${port} is in use. Stop the previous server or change PORT in technica/.env.`
        : error.message,
    );
    process.exit(1);
  });
  server.listen(port, "127.0.0.1", () =>
    console.log(`Harbor Academy running on http://localhost:${port}`),
  );
}
module.exports = { createApp };
