"use strict";
const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");
const fail = (status, message) => Object.assign(new Error(message), { status });
const hash = (value) => crypto.createHash("sha256").update(value).digest("hex");
function text(value, label, max = 1200, required = true) {
  if (
    typeof value !== "string" ||
    value.length > max ||
    (required && !value.trim())
  )
    throw fail(
      400,
      `${label}: enter ${required ? "1" : "0"}–${max} characters.`,
    );
  return value.trim();
}
function publicView(row) {
  return {
    id: row.id,
    title: row.draft.title,
    situation: row.draft.situation,
    explanation: row.draft.explanation,
    improvement: row.draft.improvement,
    credit: row.credit || "Anonymous contributor",
    publishedAt: row.publishedAt,
  };
}
function createCommunity(directory) {
  const file = path.join(directory, "contributions.json");
  let queue = Promise.resolve();
  async function read() {
    try {
      const value = JSON.parse(await fs.readFile(file, "utf8"));
      if (value.version !== 1 || !Array.isArray(value.rows))
        throw new Error("Invalid contribution storage");
      return value.rows;
    } catch (e) {
      if (e.code === "ENOENT") return [];
      throw e;
    }
  }
  function change(fn) {
    const work = queue.then(async () => {
      const rows = await read();
      const result = fn(rows);
      await fs.mkdir(directory, { recursive: true, mode: 0o700 });
      const temporary = `${file}.${crypto.randomUUID()}.tmp`;
      try {
        await fs.writeFile(
          temporary,
          JSON.stringify({ version: 1, rows }, null, 2),
          { mode: 0o600 },
        );
        await fs.rename(temporary, file);
      } finally {
        await fs.rm(temporary, { force: true });
      }
      return result;
    });
    queue = work.catch(() => {});
    return work;
  }
  return {
    async published() {
      await queue;
      return (await read())
        .filter((r) => r.status === "published")
        .map(publicView);
    },
    async list() {
      await queue;
      return (await read()).map(({ removalHash, ...row }) => row);
    },
    submit(body) {
      const row = {
        id: crypto.randomUUID(),
        situation: text(body.situation, "Money decision"),
        difficulty: text(body.difficulty, "What makes it difficult"),
        understanding: text(
          body.understanding,
          "What should someone understand",
        ),
        suggestion: text(
          body.suggestion || "",
          "Optional suggestion",
          1200,
          false,
        ),
        credit: text(body.credit || "", "Public credit", 60, false),
        adaptPermission: body.adaptPermission === true,
        publishPermission: body.publishPermission === true,
        status: "submitted",
        createdAt: new Date().toISOString(),
      };
      if (!row.adaptPermission)
        throw fail(400, "Permission to review and adapt is required.");
      const removalCode = crypto.randomBytes(24).toString("base64url");
      row.removalHash = hash(removalCode);
      return change((rows) => {
        if (rows.length >= 1000)
          throw fail(503, "The review queue is full. Please try another time.");
        rows.push(row);
        return { id: row.id, removalCode, status: row.status };
      });
    },
    remove(body) {
      if (
        typeof body.id !== "string" ||
        typeof body.removalCode !== "string" ||
        body.removalCode.length > 100
      )
        throw fail(400, "Enter your contribution ID and removal code.");
      return change((rows) => {
        const index = rows.findIndex(
          (r) => r.id === body.id && r.removalHash === hash(body.removalCode),
        );
        if (index < 0)
          throw fail(
            404,
            "The receipt did not match a contribution. Check both fields.",
          );
        rows.splice(index, 1);
        return { removed: true };
      });
    },
    moderate(id, body) {
      return change((rows) => {
        const row = rows.find((r) => r.id === id);
        if (!row) throw fail(404, "Contribution not found.");
        if (body.action === "review" && row.status === "submitted")
          row.status = "reviewed";
        else if (
          body.action === "draft" &&
          ["reviewed", "drafted"].includes(row.status)
        ) {
          row.draft = Object.fromEntries(
            ["title", "situation", "explanation", "improvement"].map((key) => [
              key,
              text(body[key], key, key === "title" ? 100 : 1600),
            ]),
          );
          row.status = "drafted";
        } else if (body.action === "publish" && row.status === "drafted") {
          if (!row.publishPermission || !row.adaptPermission)
            throw fail(
              409,
              "This contributor has not given permission for publication.",
            );
          if (body.sourcesChecked !== true)
            throw fail(
              400,
              "Review financial claims, sources, and privacy before publishing.",
            );
          row.status = "published";
          row.publishedAt = new Date().toISOString();
        } else if (body.action === "unpublish" && row.status === "published")
          row.status = "drafted";
        else if (body.action === "reject" && row.status !== "published")
          row.status = "rejected";
        else
          throw fail(409, "This action does not follow the review workflow.");
        row.updatedAt = new Date().toISOString();
        return { id, status: row.status };
      });
    },
  };
}
module.exports = { createCommunity, fail, text };
