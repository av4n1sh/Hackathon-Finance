"use strict";
const test = require("node:test"),
  assert = require("node:assert/strict");
const fs = require("node:fs/promises"),
  os = require("node:os"),
  path = require("node:path");
const { once } = require("node:events");
const { createApp } = require("../server");
const { explain } = require("../lib/guide");
const KEY = "test-only-reviewer-secret-at-least-24";
const suggestion = {
  situation: "Paying a shared cash bill",
  difficulty: "Income arrives on different days",
  understanding: "Compare timing without blaming anyone",
  suggestion: "",
  adaptPermission: true,
  publishPermission: true,
  credit: "Test nickname",
};
async function fixture(t, options = {}) {
  const directory = await fs.mkdtemp(
    path.join(os.tmpdir(), "harbor-adventure-"),
  );
  const server = createApp({
    dataDirectory: directory,
    reviewerKey: KEY,
    ...options,
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(async () => {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    await fs.rm(directory, { recursive: true, force: true });
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = async (route, data, reviewer = false, extra = {}) => {
    const response = await fetch(base + route, {
      method: data === undefined ? "GET" : "POST",
      headers: {
        ...(data === undefined ? {} : { "content-type": "application/json" }),
        ...(reviewer ? { authorization: `Bearer ${KEY}` } : {}),
        ...extra,
      },
      ...(data === undefined ? {} : { body: JSON.stringify(data) }),
    });
    return { status: response.status, data: await response.json() };
  };
  return { server, directory, base, call };
}
test("private submission survives a new server, follows moderation stages, publishes escaped data and can be removed", async (t) => {
  const { call, directory } = await fixture(t);
  const submitted = await call("/api/community", suggestion);
  assert.equal(submitted.status, 201);
  const { id, removalCode } = submitted.data;
  assert.deepEqual((await call("/api/community")).data.contributions, []);
  const disk = await fs.readFile(
    path.join(directory, "contributions.json"),
    "utf8",
  );
  assert.ok(!disk.includes(removalCode));
  const restarted = createApp({ dataDirectory: directory, reviewerKey: KEY });
  restarted.listen(0, "127.0.0.1");
  await once(restarted, "listening");
  t.after(() => {
    restarted.closeAllConnections();
    restarted.close();
  });
  const read = await fetch(
    `http://127.0.0.1:${restarted.address().port}/api/review`,
    { headers: { authorization: `Bearer ${KEY}` } },
  );
  const records = await read.json();
  assert.equal(records.contributions.length, 1);
  assert.equal(records.contributions[0].removalHash, undefined);
  assert.equal(
    (
      await call(
        `/api/review/${id}`,
        { action: "publish", sourcesChecked: true },
        true,
      )
    ).status,
    409,
  );
  assert.equal(
    (await call(`/api/review/${id}`, { action: "review" }, true)).status,
    200,
  );
  assert.equal(
    (
      await call(
        `/api/review/${id}`,
        {
          action: "draft",
          title: "Cash timing",
          situation: "A fictional shared bill",
          explanation: "Compare due dates.",
          improvement: "Adds a cash-payment perspective.",
        },
        true,
      )
    ).status,
    200,
  );
  assert.equal(
    (await call(`/api/review/${id}`, { action: "publish" }, true)).status,
    400,
  );
  assert.equal(
    (
      await call(
        `/api/review/${id}`,
        { action: "publish", sourcesChecked: true },
        true,
      )
    ).status,
    200,
  );
  const published = (await call("/api/community")).data.contributions[0];
  assert.equal(published.improvement, "Adds a cash-payment perspective.");
  assert.equal(published.difficulty, undefined);
  assert.equal(published.removalHash, undefined);
  assert.equal(
    (await call(`/api/review/${id}`, { action: "unpublish" }, true)).status,
    200,
  );
  assert.deepEqual((await call("/api/community")).data.contributions, []);
  await call(
    `/api/review/${id}`,
    { action: "publish", sourcesChecked: true },
    true,
  );
  assert.equal(
    (await call("/api/community/remove", { id, removalCode: "wrong" })).status,
    404,
  );
  assert.equal(
    (await call("/api/community/remove", { id, removalCode })).status,
    200,
  );
  assert.deepEqual((await call("/api/community")).data.contributions, []);
  assert.deepEqual(
    (await call("/api/review", undefined, true)).data.contributions,
    [],
  );
});
test("reviewer access is enforced server-side and missing configuration fails closed", async (t) => {
  const { call } = await fixture(t);
  assert.equal((await call("/api/review")).status, 401);
  assert.equal(
    (
      await call("/api/review", undefined, false, {
        authorization: "Bearer wrong",
      })
    ).status,
    401,
  );
  assert.equal(
    (await call("/api/review/fake", { action: "review" })).status,
    401,
  );
  const unconfigured = await fixture(t, { reviewerKey: "" });
  assert.equal(
    (await unconfigured.call("/api/review", undefined, true)).status,
    503,
  );
});
test("adaptation consent is required and private-only contributions cannot be published", async (t) => {
  const { call } = await fixture(t);
  assert.equal(
    (await call("/api/community", { ...suggestion, adaptPermission: false }))
      .status,
    400,
  );
  assert.equal(
    (await call("/api/community", { ...suggestion, situation: " " })).status,
    400,
  );
  assert.equal(
    (await call("/api/community", { ...suggestion, credit: "x".repeat(61) }))
      .status,
    400,
  );
  const {
    data: { id },
  } = await call("/api/community", {
    ...suggestion,
    publishPermission: false,
    credit: "",
  });
  await call(`/api/review/${id}`, { action: "review" }, true);
  await call(
    `/api/review/${id}`,
    {
      action: "draft",
      title: "Private",
      situation: "Example",
      explanation: "Example",
      improvement: "Example",
    },
    true,
  );
  assert.equal(
    (
      await call(
        `/api/review/${id}`,
        { action: "publish", sourcesChecked: true },
        true,
      )
    ).status,
    409,
  );
});
test("concurrent submissions retain every record and storage errors report failure", async (t) => {
  const { call, directory } = await fixture(t);
  const results = await Promise.all(
    Array.from({ length: 8 }, () => call("/api/community", suggestion)),
  );
  assert.ok(results.every((r) => r.status === 201));
  assert.equal(
    (await call("/api/review", undefined, true)).data.contributions.length,
    8,
  );
  await fs.writeFile(path.join(directory, "contributions.json"), "not json");
  assert.equal((await call("/api/community", suggestion)).status, 500);
});
test("request limits, cross-origin checks, removed routes, and static security headers work", async (t) => {
  const { call, base } = await fixture(t);
  assert.equal(
    (
      await call("/api/community", suggestion, false, {
        origin: "https://unrelated.example",
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await call("/api/community", suggestion, false, {
        "sec-fetch-site": "cross-site",
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await call("/api/community", {
        ...suggestion,
        situation: "x".repeat(17000),
      })
    ).status,
    413,
  );
  for (const route of ["/api/money", "/api/state", "/api/tutor"])
    assert.equal((await call(route)).status, 404);
  const home = await fetch(base);
  assert.equal(home.status, 200);
  assert.match(
    home.headers.get("content-security-policy"),
    /frame-ancestors 'none'/,
  );
  assert.equal((await fetch(base + "/cases.js")).status, 404);
  assert.equal((await fetch(base + "/%ZZ")).status, 400);
  assert.equal((await fetch(base + "/.env")).status, 404);
  const results = [];
  for (let i = 0; i < 102; i++)
    results.push((await call("/api/community")).status);
  assert.ok(results.includes(429));
});
test("optional guide needs no key and failure never changes the game", async () => {
  const originalKey = process.env.GEMINI_API_KEY,
    originalModel = process.env.GEMINI_MODEL,
    originalFetch = global.fetch;
  try {
    process.env.GEMINI_API_KEY = "";
    process.env.GEMINI_MODEL = "";
    let result = await explain({ lesson: "fees" });
    assert.equal(result.source, "authored");
    assert.match(result.explanation, /\$15/);
    process.env.GEMINI_API_KEY = "test-key";
    process.env.GEMINI_MODEL = "gemini-test";
    global.fetch = async () => {
      throw new Error("offline");
    };
    result = await explain({ lesson: "fees" });
    assert.equal(result.source, "authored");
    global.fetch = async () =>
      new Response(
        JSON.stringify({
          candidates: [
            {
              finishReason: "STOP",
              content: { parts: [{ text: "Compare the whole price." }] },
            },
          ],
        }),
        { status: 200 },
      );
    result = await explain({ lesson: "fees" });
    assert.equal(result.source, "ai");
    global.fetch = async () =>
      new Response(
        JSON.stringify({
          candidates: [
            {
              finishReason: "MAX_TOKENS",
              content: { parts: [{ text: "cut off" }] },
            },
          ],
        }),
        { status: 200 },
      );
    assert.equal((await explain({ lesson: "fees" })).source, "authored");
    await assert.rejects(explain({ lesson: "fees", game: { version: 99 } }));
  } finally {
    global.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalKey;
    if (originalModel === undefined) delete process.env.GEMINI_MODEL;
    else process.env.GEMINI_MODEL = originalModel;
  }
});
