"use strict";
const test = require("node:test"),
  assert = require("node:assert/strict");
const F = require("../public/finance"),
  { score } = require("../lib/scoring"),
  cases = require("../public/cases");
const Vault = require("../public/vault");
const { lessons } = require("../public/content");
test("Environment parsing keeps blank keys empty and supports quoted or spaced values", () => {
  const { parseEnvironment } = require("../lib/config");
  const parsed = parseEnvironment(
    'GEMINI_API_KEY=\n# optional configuration\nCAPITAL_ONE_API_KEY = "  fake-test-value  "\nexport CAPITAL_ONE_PRODUCT = nessie # confirmed sandbox\nPORT = 3000\n',
  );
  assert.equal(parsed.GEMINI_API_KEY, "");
  assert.equal(parsed.CAPITAL_ONE_API_KEY, "fake-test-value");
  assert.equal(parsed.CAPITAL_ONE_PRODUCT, "nessie");
  assert.equal(parsed.PORT, "3000");
});
test("Expanded lessons supply sectioned teaching, worked examples, optional detail and feedback for every answer", () => {
  for (const l of lessons) {
    assert.ok(l.sections.length >= 2);
    assert.ok(l.sections.every((s) => s.title && s.text.length > 50));
    assert.match(l.example.title, /fictional/i);
    assert.ok(l.misunderstanding && l.more && l.takeaway && l.next);
    assert.equal(l.answerFeedback.length, l.options.length);
    assert.equal(l.checkFeedback.length, l.checks.length);
    assert.ok(l.answerFeedback.every((s) => s.length > 40));
    assert.ok(l.checkFeedback.every((s) => s.length > 40));
    assert.match(l.time, /min/);
  }
});
test("Case decisions stay correctly scored when reordered and strongest choices vary in position", () => {
  const positions = new Set();
  for (const c of cases) {
    assert.equal(c.actions.length, 3);
    assert.equal(new Set(c.actions.map((a) => a.id)).size, 3);
    assert.ok(c.actions.every((a) => a.cons.length > 80));
    assert.ok(c.unknown.length > 50);
    positions.add(c.actions.findIndex((a) => a.pts === 40));
    const body = {
      tags: Object.fromEntries(c.evidence.map((e) => [e.id, e.truth])),
      action: "x2",
      reason: "r2",
    };
    assert.equal(
      score(
        {
          ...c,
          actions: [...c.actions].reverse(),
          reasons: [...c.reasons].reverse(),
        },
        body,
      ).total,
      100,
    );
  }
  assert.equal(positions.size, 3);
});
test("Vault topics have complete learning fields and valid source, related-topic, and investigation links", () => {
  assert.equal(Vault.topics.length, 14);
  const ids = new Set(Vault.topics.map((t) => t.id));
  assert.equal(ids.size, Vault.topics.length);
  for (const t of Vault.topics) {
    assert.ok(t.title.length > 0);
    for (const field of ["meaning", "why", "example", "misconception"])
      assert.ok(
        typeof t[field] === "string" && t[field].length > 15,
        `${t.id}: ${field}`,
      );
    assert.ok(t.checks.length >= 2);
    assert.match(t.example, /fictional/i);
    assert.ok(Vault.categories.some((c) => c.id === t.category));
    for (const id of t.related)
      assert.ok(ids.has(id), `${t.id}: related ${id}`);
    for (const id of t.cases) assert.ok(cases.some((c) => c.id === id));
    for (const id of t.sources) {
      const source = Vault.sources[id];
      assert.ok(source);
      const url = new URL(source.url);
      assert.equal(url.protocol, "https:");
      assert.ok(
        [
          "www.investor.gov",
          "www.sec.gov",
          "consumer.ftc.gov",
          "www.ftc.gov",
          "www.finra.org",
        ].includes(url.hostname),
      );
    }
  }
});
test("Vault search combines categories and normalized search terms across checks, examples and keywords", () => {
  assert.equal(Vault.search().length, 14);
  assert.equal(Vault.search("", "messages").length, 3);
  assert.deepEqual(
    Vault.search("  SEED   phrase  ", "digital").map((t) => t.id),
    ["private-keys"],
  );
  assert.equal(Vault.search("seed phrase", "messages").length, 0);
  assert.ok(
    Vault.search("temporary waiver", "funds").some((t) => t.id === "expenses"),
  );
  assert.equal(Vault.search("nonexistentterm123").length, 0);
});
test("Every authored case can score 100, including a correctly tagged warning-heavy bank case", () => {
  for (const c of cases) {
    const result = score(c, {
      tags: Object.fromEntries(c.evidence.map((e) => [e.id, e.truth])),
      action: "x2",
      reason: "r2",
    });
    assert.equal(result.total, 100);
    assert.equal(result.shotgun, false);
  }
});
test("Scoring rejects incomplete, extra, invalid tags and invalid choices; shotgun penalty is bounded", () => {
  const c = cases[0];
  for (const body of [
    {},
    { tags: {} },
    {
      tags: Object.fromEntries(c.evidence.map((e) => [e.id, "invalid"])),
      action: "x2",
      reason: "r2",
    },
  ])
    assert.throws(() => score(c, body));
  const tags = Object.fromEntries(c.evidence.map((e) => [e.id, "w"]));
  const r = score(c, { tags, action: "x1", reason: "r1" });
  assert.equal(r.shotgun, true);
  assert.equal(r.ev, 14);
  assert.equal(r.total, 14);
  assert.throws(() =>
    score(c, { tags: { ...tags, extra: "w" }, action: "x2", reason: "r2" }),
  );
  assert.throws(() => score(c, { tags, action: "bogus", reason: "r2" }));
});
test("Allocations validate totals and calculate weighted cost, returns and a loss scenario", () => {
  assert.throws(() => F.allocation([100, 1, 0, 0]));
  assert.throws(() => F.allocation([NaN, 0, 0, 100]));
  assert.throws(() => F.allocation([-1, 1, 0, 100]));
  const result = F.allocation([100, 0, 0, 0], "downturn");
  assert.equal(result.fee, 0.04);
  assert.equal(result.annualExpense, 4);
  assert.equal(result.balance, 7500 * 0.9996);
  const mixed = F.allocation([25, 25, 25, 25]);
  assert.ok(Math.abs(mixed.fee - 0.2975) < 1e-12);
});
test("Fee model uses post-growth expense deduction and year-end contributions", () => {
  const one = F.project({ years: 1, rate: 5, fee: 1, contribution: 1000 });
  assert.equal(one.balance, 11395);
  assert.equal(one.paid, 105);
  assert.equal(one.opportunityCost, 0);
  const two = F.project({ years: 2, rate: 5, fee: 1, contribution: 1000 });
  assert.ok(Math.abs(two.balance - (11395 * 1.05 * 0.99 + 1000)) < 1e-8);
  for (const rate of [-20, 0, 5]) {
    const a = F.project({ rate, fee: 0 }),
      b = F.project({ rate, fee: 1 });
    assert.ok(a.balance > b.balance);
    assert.ok(
      Math.abs(b.paid + b.opportunityCost - (b.noFee - b.balance)) < 1e-8,
    );
  }
  assert.throws(() => F.project({ years: 2.5 }));
  assert.throws(() => F.project({ fee: 6 }));
  assert.throws(() => F.project({ rate: NaN }));
});
test("Transfers conserve supply and never mutate the source ledger on success or failure", () => {
  const original = { Maya: 1000, Jordan: 0, Sam: 0 };
  assert.deepEqual(F.transfer(original, "Maya", "Jordan", 125), {
    Maya: 875,
    Jordan: 125,
    Sam: 0,
  });
  assert.equal(original.Maya, 1000);
  for (const n of [-1, 0, 1.5, 1001, NaN])
    assert.throws(() => F.transfer(original, "Maya", "Jordan", n));
  assert.throws(() => F.transfer(original, "Sam", "Maya", 1));
  assert.throws(() => F.transfer(original, "Maya", "Maya", 1));
});
