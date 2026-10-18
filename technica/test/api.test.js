"use strict";
const test = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  os = require("node:os"),
  path = require("node:path");
const { createApp } = require("../server"),
  cases = require("../public/cases"),
  { lessons } = require("../public/content");
const nativeFetch = global.fetch;
const providers = require("../lib/providers");
function clearKeys() {
  for (const k of [
    "GEMINI_API_KEY",
    "CAPITAL_ONE_API_KEY",
    "CAPITAL_ONE_PRODUCT",
    "GEMINI_MODEL",
  ])
    delete process.env[k];
}
async function fixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "harbor-test-")),
    server = createApp({ dataDirectory: dir });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const url = "http://127.0.0.1:" + server.address().port;
  async function client(cookie = "") {
    return async (route, body, method) => {
      const r = await nativeFetch(url + route, {
        method: method || (body === undefined ? "GET" : "POST"),
        headers: {
          ...(cookie ? { cookie } : {}),
          ...(body === undefined ? {} : { "content-type": "application/json" }),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      const set = r.headers.get("set-cookie");
      if (set) cookie = set.split(";")[0];
      let data;
      try {
        data = await r.json();
      } catch {
        data = null;
      }
      return { r, data, cookie };
    };
  }
  return {
    url,
    directory: dir,
    server,
    client,
    async close() {
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
      assert.equal(path.dirname(dir), os.tmpdir());
      assert.ok(path.basename(dir).startsWith("harbor-test-"));
      fs.rmSync(dir, { recursive: true, force: true });
    },
  };
}
test("API: full mission and investigation journey, no XP farming, guest separation, persistence, validation and deletion", async () => {
  clearKeys();
  const f = await fixture();
  try {
    const a = await f.client(),
      b = await f.client();
    const first = await a("/api/state");
    assert.match(first.cookie, /harbor_session=[a-f0-9]{64}/);
    assert.equal(first.data.xp, 0);
    assert.equal(first.data.apiVersion, 3);
    assert.match(first.data.providerDetails.gemini.message, /empty/);
    const missing = await a("/api/integrations/check", { provider: "gemini" });
    assert.equal(missing.data.source, "demo");
    assert.match(
      missing.data.state.providerDetails.gemini.message,
      /not configured/,
    );
    assert.ok(missing.data.state.providerDetails.gemini.checkedAt);
    const gate = await a("/api/integrations/check", { provider: "capitalOne" });
    assert.equal(gate.data.source, "unavailable");
    assert.match(
      gate.data.state.providerDetails.capitalOne.message,
      /unconfirmed/,
    );
    assert.equal(
      (await a("/api/integrations/check", { provider: "unknown" })).r.status,
      400,
    );
    assert.equal((await a("/api/coach/debrief", {})).r.status, 400);
    assert.equal((await a("/api/nope", {})).r.status, 404);
    assert.equal((await a("/api/tutor", { text: 123 })).r.status, 400);
    assert.equal(
      (await a("/api/lesson/complete", { id: "final", answer: 1, check: 1 })).r
        .status,
      403,
    );
    for (const l of lessons) {
      const d = await a("/api/lesson/complete", {
        id: l.id,
        answer: l.answer,
        check: l.correct,
      });
      assert.equal(d.data.correct, true);
      assert.equal(d.data.awarded, 50);
      assert.equal(d.data.questionFeedback.length, 2);
      assert.ok(
        d.data.questionFeedback.every(
          (f) => f.correct && typeof f.explanation === "string",
        ),
      );
    }
    assert.equal(
      (await a("/api/lesson/complete", { id: "etf", answer: 0, check: 1 })).data
        .awarded,
      0,
    );
    for (const c of cases) {
      const body = {
        caseId: c.id,
        tags: Object.fromEntries(c.evidence.map((e) => [e.id, e.truth])),
        action: "x2",
        reason: "r2",
      };
      const first = await a("/api/coach/debrief", body);
      assert.equal(first.data.score.total, 100);
      assert.equal(first.data.awarded, 100);
      assert.equal(first.data.actionFeedback.choices.length, 3);
      assert.equal(first.data.actionFeedback.selectedId, "x2");
      assert.equal(first.data.actionFeedback.unknown, c.unknown);
      assert.equal((await a("/api/coach/debrief", body)).data.awarded, 0);
    }
    assert.equal((await a("/api/state")).data.xp, 900);
    assert.equal((await b("/api/state")).data.xp, 0);
    const resumed = await f.client(first.cookie);
    assert.equal((await resumed("/api/state")).data.xp, 900);
    const tutor = await a("/api/tutor", {
      text: "What is an ETF?",
      topic: "etf",
    });
    assert.equal(tutor.data.source, "demo");
    assert.equal(tutor.data.sources[0].id, "etf");
    const check = await a("/api/check-message", {
      text: "An unverified message",
      reviewed: true,
    });
    assert.equal(check.data.source, "demo");
    assert.match(check.data.summary, /no AI analysis/);
    assert.equal((await a("/api/check-message", { text: "hi" })).r.status, 400);
    assert.equal(
      (await a("/api/audio/narrate", { text: "A lesson." })).r.status,
      404,
    );
    const preferences = await a("/api/preferences", {
      depth: "detail",
    });
    assert.equal(preferences.data.state.preferences.depth, "detail");
    const del = await a("/api/progress/review", undefined, "DELETE");
    assert.equal(del.data.state.xp, 900);
    assert.deepEqual(del.data.state.review, []);
    assert.equal(
      (
        await nativeFetch(f.url + "/api/state", {
          headers: { origin: "https://other.example" },
        })
      ).status,
      403,
    );
    assert.equal(
      (await nativeFetch(f.url + "/assets/mark.svg?cache=1")).headers.get(
        "content-type",
      ),
      "image/svg+xml",
    );
    assert.equal((await nativeFetch(f.url + "/assets/coast.jpg")).status, 200);
    assert.equal(
      (await nativeFetch(f.url + "/%2e%2e%2fserver.js")).status,
      403,
    );
    assert.equal(
      (
        await nativeFetch(f.url + "/api/tutor", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: "{broken",
        })
      ).status,
      400,
    );
    assert.equal(
      (
        await nativeFetch(f.url + "/api/tutor", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ text: "x".repeat(18000) }),
        })
      ).status,
      413,
    );
  } finally {
    await f.close();
  }
});
test("Concurrent repeats serialize, browser snapshot restores progress after a server restart, and rate limits return 429", async () => {
  clearKeys();
  const f = await fixture();
  let restarted;
  try {
    const a = await f.client();
    const guest = await a("/api/state");
    const body = { id: "etf", answer: 0, check: 1 };
    const responses = await Promise.all([
      a("/api/lesson/complete", body),
      a("/api/lesson/complete", body),
    ]);
    assert.deepEqual(
      responses.map((r) => r.data.awarded).sort((a, b) => a - b),
      [0, 50],
    );
    // Temporary session state supports concurrent scoring; the browser owns persistence.
    const resumed = await f.client(guest.cookie);
    assert.equal((await resumed("/api/state")).data.xp, 50);
    for (let i = 0; i < 116; i++) await resumed("/api/state");
    assert.equal((await resumed("/api/state")).r.status, 429);
    const snapshot = {
      done: {},
      lessons: { etf: true },
      review: [],
      preferences: { depth: "beginner" },
    };
    f.server.closeAllConnections();
    await new Promise((resolve) => f.server.close(resolve));
    restarted = createApp({ dataDirectory: f.directory });
    await new Promise((resolve) => restarted.listen(0, "127.0.0.1", resolve));
    const response = await nativeFetch(
      "http://127.0.0.1:" + restarted.address().port + "/api/state",
      {
        method: "POST",
        headers: { cookie: guest.cookie, "content-type": "application/json" },
        body: JSON.stringify({ progress: snapshot }),
      },
    );
    assert.equal((await response.json()).xp, 50);
  } finally {
    if (restarted) {
      restarted.closeAllConnections();
      await new Promise((resolve) => restarted.close(resolve));
    }
    await f.close();
  }
});

test("Nessie read-only contract, product gate, normalized data, Gemini aggregate context and failure states", async () => {
  clearKeys();
  const f = await fixture(),
    a = await f.client();
  let requests = [],
    payloads = [],
    status = 200,
    malformed = false,
    empty = false,
    timeout = false;
  global.fetch = async (url, options = {}) => {
    const target = new URL(url);
    requests.push({
      host: target.host,
      path: target.pathname,
      method: options.method,
    });
    if (timeout) throw new DOMException("Timed out", "TimeoutError");
    if (status !== 200)
      return Response.json({ error: "never exposed" }, { status });
    if (target.host === "prod-api.nessieisreal.com") {
      assert.equal(target.protocol, "https:");
      assert.equal(target.searchParams.get("key"), "capital-test");
      assert.equal(options.method, "GET");
      assert.equal(options.redirect, "error");
      assert.ok(options.signal);
      if (target.pathname === "/accounts")
        return Response.json(
          empty
            ? []
            : [
                {
                  _id: "a".repeat(24),
                  type: "Checking",
                  balance: 500,
                  nickname: "unnecessary name",
                  customer_id: "private-customer",
                  account_number: "1234567812345678",
                },
              ],
        );
      if (target.pathname.endsWith("/deposits"))
        return Response.json([
          {
            amount: 200,
            status: "completed",
            transaction_date: "2026-10-01",
            description: "private payroll details",
          },
        ]);
      if (target.pathname.endsWith("/withdrawals"))
        return Response.json([
          {
            amount: 25.25,
            status: "completed",
            transaction_date: "2026-10-02",
            description: "grocery private details",
          },
          {
            amount: 99,
            status: "pending",
            transaction_date: "2026-10-03",
            description: "bus",
          },
        ]);
      throw new Error("Undocumented endpoint");
    }
    assert.equal(target.host, "generativelanguage.googleapis.com");
    assert.match(target.pathname, /gemini-3.8-flash:generateContent$/);
    assert.equal(target.search, "");
    assert.equal(options.headers["x-goog-api-key"], "gemini-test");
    const payload = JSON.parse(options.body);
    payloads.push(JSON.parse(payload.contents[0].parts[0].text));
    assert.equal(payload.generationConfig.responseMimeType, "application/json");
    assert.equal(
      payload.generationConfig.responseJsonSchema.additionalProperties,
      false,
    );
    const fields = payload.generationConfig.responseJsonSchema.required;
    return Response.json({
      candidates: [
        {
          finishReason: "STOP",
          content: {
            parts: [
              {
                text: JSON.stringify(
                  malformed
                    ? { answer: 42 }
                    : Object.fromEntries(
                        fields.map((k) => [
                          k,
                          k === "correct"
                            ? "A"
                            : "A bounded educational explanation.",
                        ]),
                      ),
                ),
              },
            ],
          },
        },
      ],
    });
  };
  try {
    process.env.CAPITAL_ONE_API_KEY = "  capital-test  ";
    let data = (await a("/api/money", { mode: "sandbox" })).data;
    assert.equal(data.source, "unavailable");
    assert.match(data.issue, /unconfirmed/);
    assert.equal(requests.length, 0);
    process.env.CAPITAL_ONE_PRODUCT = "nessie";
    assert.equal(
      (await a("/api/state")).data.provider.capitalOne,
      "unavailable",
    );
    data = (await a("/api/money", { mode: "sandbox" })).data;
    assert.equal(data.source, "sandbox");
    assert.equal(data.state.provider.capitalOne, "live");
    assert.equal(data.summary.incoming, 200);
    assert.equal(data.summary.outgoing, 25.25);
    assert.equal(data.summary.net, 174.75);
    assert.equal(data.summary.excluded, 1);
    assert.deepEqual(
      requests.map((r) => r.path),
      [
        "/accounts",
        "/accounts/" + "a".repeat(24) + "/deposits",
        "/accounts/" + "a".repeat(24) + "/withdrawals",
      ],
    );
    assert.ok(!JSON.stringify(data).includes("private-customer"));
    assert.ok(!JSON.stringify(data).includes("1234567812345678"));
    assert.ok(!JSON.stringify(data).includes("capital-test"));
    process.env.GEMINI_API_KEY = " gemini-test ";
    const explained = (
      await a("/api/money/explain", {
        text: "Explain these totals",
        loadedAt: data.loadedAt,
      })
    ).data;
    assert.equal(explained.source, "live");
    const context = payloads.at(-1).activity;
    assert.equal(context.net, 174.75);
    assert.equal(context.outgoing, 25.25);
    assert.equal(context.balance, 500);
    assert.ok(!JSON.stringify(context).includes("private"));
    assert.ok(!JSON.stringify(context).includes("a".repeat(24)));
    assert.equal(
      (await a("/api/money/explain", { text: "Old snapshot", loadedAt: "old" }))
        .r.status,
      409,
    );
    const c = cases[0];
    await a("/api/coach/debrief", {
      caseId: "A",
      tags: Object.fromEntries(c.evidence.map((e) => [e.id, e.truth])),
      action: "x2",
      reason: "r2",
    });
    assert.equal(payloads.at(-1).case.id, "A");
    assert.equal(payloads.at(-1).score.total, 100);
    await a("/api/tutor", {
      text: "What does diversification mean?",
      topic: "etf",
    });
    assert.equal(payloads.at(-1).topic.id, "etf");
    malformed = true;
    let fallback = (await a("/api/tutor", { text: "Explain", topic: "etf" }))
      .data;
    assert.equal(fallback.source, "demo");
    assert.equal(fallback.state.provider.gemini, "unavailable");
    malformed = false;
    for (const code of [401, 403, 429, 500]) {
      status = code;
      const failed = (await a("/api/money", { mode: "sandbox" })).data;
      assert.equal(failed.source, "unavailable");
      assert.equal(failed.state.provider.capitalOne, "unavailable");
      assert.ok(!JSON.stringify(failed).includes("capital-test"));
      fallback = (await a("/api/tutor", { text: "Explain", topic: "etf" }))
        .data;
      assert.equal(fallback.source, "demo");
      assert.match(
        fallback.issue,
        code === 429
          ? /rate limit/
          : code === 401 || code === 403
            ? /rejected/
            : /unavailable/,
      );
    }
    status = 200;
    timeout = true;
    assert.match(
      (await a("/api/money", { mode: "sandbox" })).data.issue,
      /timed out/,
    );
    timeout = false;
    empty = true;
    data = (await a("/api/money", { mode: "sandbox" })).data;
    assert.equal(data.source, "sandbox");
    assert.equal(data.account, null);
    const before = requests.length;
    data = (await a("/api/money", { mode: "example" })).data;
    assert.equal(requests.length, before);
    assert.equal(data.source, "example");
    assert.equal(data.summary.net, 292);
    assert.equal((await a("/api/user/sync", {})).r.status, 404);
    assert.equal((await a("/api/memory")).r.status, 404);
  } finally {
    global.fetch = nativeFetch;
    clearKeys();
    await f.close();
  }
});

test("Legacy lesson progress imports without new disk writes; snapshots validate fields", async () => {
  clearKeys();
  const f = await fixture();
  try {
    const token = "c".repeat(64),
      crypto = require("node:crypto");
    fs.writeFileSync(
      path.join(
        f.directory,
        crypto.createHash("sha256").update(token).digest("hex") + ".json",
      ),
      JSON.stringify({
        id: token,
        done: { A: 80 },
        lessons: { etf: true },
        review: ["Review a clue"],
        preferences: { depth: "detail" },
      }),
    );
    const a = await f.client("harbor_session=" + token);
    const imported = (await a("/api/state")).data;
    assert.equal(imported.xp, 130);
    assert.equal(imported.preferences.depth, "detail");
    const restored = (
      await a("/api/state", {
        progress: {
          ...imported,
          done: { A: 80, B: 999 },
          lessons: { etf: true, unknown: true },
          provider: { gemini: "live" },
        },
      })
    ).data;
    assert.equal(restored.xp, 130);
    assert.equal(restored.provider.gemini, "not-tested");
    assert.equal(fs.readdirSync(f.directory).length, 1);
  } finally {
    await f.close();
  }
});
