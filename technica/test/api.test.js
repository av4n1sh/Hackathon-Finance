"use strict";
const test = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs/promises"),
  os = require("node:os"),
  path = require("node:path"),
  crypto = require("node:crypto");
const { once } = require("node:events"),
  { createApp } = require("../server");
async function fixture(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "harbor-rpg-")),
    server = createApp({ dataDirectory: directory });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(async () => {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    await fs.rm(directory, { recursive: true, force: true });
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = async (route, data, headers = {}) => {
    const response = await fetch(base + route, {
      method: data === undefined ? "GET" : "POST",
      headers: {
        ...(data === undefined ? {} : { "content-type": "application/json" }),
        ...headers,
      },
      ...(data === undefined ? {} : { body: JSON.stringify(data) }),
    });
    return { status: response.status, data: await response.json() };
  };
  return { directory, base, call };
}
test("retired submission and reviewer surfaces are absent; RPG scripts and styles serve", async (t) => {
  const { call, base } = await fixture(t);
  for (const route of [
    "/api/community",
    "/api/review",
    "/api/review/fake",
    "/api/money",
  ]) {
    assert.equal((await call(route)).status, 404);
    assert.equal((await call(route, {})).status, 404);
  }
  for (const route of ["/review.html", "/review.js"])
    assert.equal((await fetch(base + route)).status, 404);
  for (const route of [
    "/world.js",
    "/rpg.js",
    "/rpg-view.js",
    "/learn-view.js",
    "/rpg.css",
    "/festival.js",
    "/festival-view.js",
    "/mini-games-view.js",
    "/festival.css",
    "/simple-view.js",
    "/remove.html",
  ])
    assert.equal((await fetch(base + route)).status, 200);
  const home = await fetch(base);
  assert.match(
    home.headers.get("content-security-policy"),
    /frame-ancestors 'none'/,
  );
  assert.equal((await fetch(base + "/.env")).status, 404);
  assert.equal((await fetch(base + "/%ZZ")).status, 400);
});
test("legacy receipts can remove private originals without exposing or erasing other records", async (t) => {
  const { directory, call } = await fixture(t),
    code = "test-removal-code",
    hash = crypto.createHash("sha256").update(code).digest("hex"),
    file = path.join(directory, "contributions.json");
  await fs.writeFile(
    file,
    JSON.stringify({
      version: 1,
      rows: [
        { id: "one", removalHash: hash, situation: "Private original" },
        { id: "two", removalHash: "other" },
      ],
    }),
  );
  assert.equal(
    (await call("/api/community/remove", { id: "one", removalCode: "wrong" }))
      .status,
    404,
  );
  assert.equal(
    (await call("/api/community/remove", { id: "one", removalCode: code }))
      .status,
    200,
  );
  assert.deepEqual(JSON.parse(await fs.readFile(file, "utf8")).rows, [
    { id: "two", removalHash: "other" },
  ]);
  assert.equal((await call("/api/community")).status, 404);
});
test("same-origin, body limits, storage failures and request limits still apply", async (t) => {
  const { call, directory } = await fixture(t);
  assert.equal(
    (
      await call(
        "/api/explain",
        { lesson: "fees" },
        { origin: "https://other.example" },
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await call(
        "/api/explain",
        { lesson: "fees" },
        { "sec-fetch-site": "cross-site" },
      )
    ).status,
    403,
  );
  assert.equal(
    (await call("/api/explain", { lesson: "x".repeat(17000) })).status,
    413,
  );
  assert.equal((await call("/api/explain", { lesson: "unknown" })).status, 400);
  await fs.writeFile(path.join(directory, "contributions.json"), "bad json");
  assert.equal(
    (await call("/api/community/remove", { id: "x", removalCode: "y" })).status,
    500,
  );
  let limited = false;
  for (let i = 0; i < 102; i++)
    if ((await call("/api/unknown")).status === 429) limited = true;
  assert.ok(limited);
});
