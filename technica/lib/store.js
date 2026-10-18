"use strict";
const fs = require("node:fs"),
  path = require("node:path"),
  crypto = require("node:crypto");
const cases = require("../public/cases"),
  { lessons } = require("../public/content");
function progressSnapshot(value = {}) {
  return {
    done: Object.fromEntries(
      cases
        .filter(
          (c) =>
            Number.isInteger(value?.done?.[c.id]) &&
            value.done[c.id] >= 0 &&
            value.done[c.id] <= 100,
        )
        .map((c) => [c.id, value.done[c.id]]),
    ),
    lessons: Object.fromEntries(
      lessons
        .filter((l) => value?.lessons?.[l.id] === true)
        .map((l) => [l.id, true]),
    ),
    review: Array.isArray(value?.review)
      ? value.review
          .filter((v) => typeof v === "string" && v.length <= 1000)
          .slice(0, 12)
      : [],
    preferences: {
      depth: value?.preferences?.depth === "detail" ? "detail" : "beginner",
    },
  };
}
function createStore(directory = path.join(__dirname, "..", "data")) {
  // Only read old disk files to import progress. New persistent storage belongs to the browser.
  const sessions = new Map();
  function save(u) {
    sessions.set(u.id, u);
  }
  function session(req, res) {
    const token = /(?:^|;\s*)harbor_session=([a-f0-9]{64})(?:;|$)/.exec(
      req.headers.cookie || "",
    )?.[1];
    if (token && sessions.has(token)) return sessions.get(token);
    const id = token || crypto.randomBytes(32).toString("hex");
    let legacy = {};
    if (token)
      try {
        legacy = JSON.parse(
          fs.readFileSync(
            path.join(
              directory,
              crypto.createHash("sha256").update(token).digest("hex") + ".json",
            ),
            "utf8",
          ),
        );
      } catch {}
    const u = {
      id,
      ...progressSnapshot(legacy),
      provider: { gemini: "not-tested", capitalOne: "not-tested" },
    };
    save(u);
    if (!token)
      res.setHeader(
        "Set-Cookie",
        `harbor_session=${id}; HttpOnly; SameSite=Strict; Path=/; Max-Age=2592000${process.env.COOKIE_SECURE === "true" ? "; Secure" : ""}`,
      );
    return u;
  }
  function view(u) {
    return {
      ...progressSnapshot(u),
      provider: u.provider,
      apiVersion: 3,
      providerDetails: require("./providers").diagnostics(u),
      xp:
        Object.values(u.done).reduce((a, b) => a + b, 0) +
        Object.keys(u.lessons).length * 50,
    };
  }
  function restore(u, snapshot) {
    Object.assign(u, progressSnapshot(snapshot));
  }
  return { session, save, view, restore, reload: (id) => sessions.get(id) };
}
module.exports = { createStore, progressSnapshot };
