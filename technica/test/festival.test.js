"use strict";
const test = require("node:test"),
  assert = require("node:assert/strict"),
  F = require("../public/festival"),
  R = require("../public/rpg"),
  G = require("../public/game");
const profile = (f) => ({
  festival: f,
  rpg: R.initial(),
  mastered: [],
  explored: [],
  missionStamps: [],
  sideCompleted: [],
});
test("workshop computes all repairs and delivery fees and accepts five distinct workable plans", () => {
  let valid = 0,
    invalid = 0;
  for (const lens of F.parts.lens)
    for (const mount of F.parts.mount)
      for (const delivery of F.parts.delivery) {
        let f = F.initial();
        for (const [category, id] of [
          ["lens", lens.id],
          ["mount", mount.id],
          ["delivery", delivery.id],
        ])
          f = F.act(f, "part", `${category}:${id}`);
        const receipt = F.repairStatus(f.parts);
        assert.equal(
          receipt.total,
          lens.cents + (lens.repair || 0) + mount.cents + delivery.cents,
        );
        if (receipt.total <= 2000) {
          f = F.act(f, "submit-workshop");
          assert.ok(F.completed(f).includes("workshop"));
          valid++;
        } else {
          assert.throws(() => F.act(f, "submit-workshop"), /above the \$20/);
          invalid++;
        }
        assert.equal(G.snapshot(G.initial()).available, 8000);
      }
  assert.equal(valid, 5);
  assert.equal(invalid, 3);
  assert.throws(() => F.act(F.initial(), "submit-workshop"));
});
test("cash drawer accepts different exact change combinations and rejects incorrect or unsupported notes", () => {
  for (const coins of [
    [500, 200, 100],
    [200, 200, 200, 200],
    Array(8).fill(100),
  ]) {
    let f = F.initial();
    for (const c of coins) f = F.act(f, "coin", c);
    assert.equal(F.cashStatus(f.coins).total, 800);
    f = F.act(f, "submit-cash");
    assert.equal(R.progress(profile(f)).xp, 30);
    const proof = f.solutions.cash;
    f = F.act(f, "clear-cash");
    assert.throws(() => F.act(f, "submit-cash"));
    for (const c of [500, 200, 100]) f = F.act(f, "coin", c);
    f = F.act(f, "submit-cash");
    assert.deepEqual(f.solutions.cash, proof);
    assert.equal(R.progress(profile(f)).xp, 30);
  }
  assert.throws(() => F.act(F.initial(), "coin", -100));
  assert.throws(() => F.act(F.initial(), "coin", 1000));
});
test("delivery supports a shorter paid route and a longer free detour with collision and a reusable bridge pass", () => {
  const routes = [
    { moves: ["up", "right", "right", "right", "right", "down"], cost: 200 },
    {
      moves: ["down", "down", "right", "right", "right", "right", "up", "up"],
      cost: 0,
    },
  ];
  for (const route of routes) {
    let f = F.initial();
    assert.throws(() => F.act(f, "route", "right"), /blocked/);
    for (const d of route.moves) f = F.act(f, "route", d);
    const result = F.routeStatus(f.moves);
    assert.ok(result.complete);
    assert.equal(result.cost, route.cost);
    assert.equal(result.steps, route.moves.length);
    assert.ok(f.solutions.route);
    assert.equal(R.progress(profile(f)).xp, 30);
    const proof = f.solutions.route;
    f = F.act(f, "reset-route");
    for (const d of routes[0].moves) f = F.act(f, "route", d);
    assert.deepEqual(f.solutions.route, proof);
  }
  assert.equal(
    F.routeStatus(["up", "right", "right", "left", "right"]).cost,
    200,
  );
});
test("postcards are reachable, unique discoveries and unlock a cosmetic companion without changing funds", () => {
  let f = F.initial(),
    character = R.initial();
  assert.throws(() => F.act(f, "companion", "fox"));
  for (const card of F.postcards) {
    character = F.travel(character, card);
    f = F.collect(f, character, card.id);
    const before = R.progress(profile(f)).xp;
    f = F.collect(f, character, card.id);
    assert.equal(R.progress(profile(f)).xp, before);
  }
  assert.equal(f.postcards.length, 5);
  assert.equal(R.progress(profile(f)).xp, 25);
  f = F.act(f, "companion", "fox");
  assert.equal(f.companion, "fox");
  assert.equal(G.snapshot(G.initial()).available, 8000);
  assert.throws(() => F.collect(F.initial(), R.initial(), "shore"));
  const welcome = F.postcards[0];
  assert.equal(F.collectAt(F.initial(), welcome).postcards[0], "welcome");
});
test("festival restore replays evidence, preserves prior wins, and rejects corrupt solutions", () => {
  let f = F.initial();
  for (const part of ["lens:reclaimed", "mount:salvaged", "delivery:delivered"])
    f = F.act(f, "part", part);
  f = F.act(f, "submit-workshop");
  for (const coin of [500, 200, 100]) f = F.act(f, "coin", coin);
  f = F.act(f, "submit-cash");
  for (const d of ["up", "right", "right", "right", "right", "down"])
    f = F.act(f, "route", d);
  assert.deepEqual(F.restore(JSON.parse(JSON.stringify(f))), f);
  assert.deepEqual(F.restore(), F.initial());
  assert.throws(() => F.restore({ ...f, solutions: { cash: [500] } }));
  assert.throws(() => F.restore({ ...f, solutions: { route: ["up"] } }));
  assert.throws(() =>
    F.restore({
      ...f,
      solutions: {
        workshop: { lens: "new", mount: "fitted", delivery: "delivered" },
      },
    }),
  );
  assert.throws(() => F.restore({ ...f, companion: "fox" }));
  assert.throws(() => F.restore({ ...f, postcards: ["fake"] }));
  const p = R.progress(profile(f));
  assert.equal(p.xp, 90);
  assert.ok(p.inventory.some((i) => i.id === "festival-pin"));
  assert.equal(p.equipped.id, "notebook");
});

test("the visitor queue uses each order's real change, persists mid-round, and awards cash XP once", () => {
  let f = F.initial();
  assert.throws(() => F.act(f, "next-customer"), /Serve this visitor/);
  for (const [round, notes] of [
    [0, [500, 200, 100]],
    [1, [200, 200]],
    [2, [500, 500, 200, 200]],
  ]) {
    const order = F.cashOrders[round],
      status = F.cashStatus([], round);
    assert.equal(status.due, order.received - order.quantity * order.price);
    if (round === 0)
      assert.throws(() => F.act(f, "submit-cash"), /Add \$8.00 more/);
    for (const note of notes) f = F.act(f, "coin", note);
    const checkpoint = F.restore(JSON.parse(JSON.stringify(f)));
    assert.equal(checkpoint.cashRound, round);
    assert.deepEqual(checkpoint.coins, notes);
    f = F.act(checkpoint, "submit-cash");
    assert.deepEqual(f.cashReceipts[order.id], notes);
    assert.equal(R.progress(profile(f)).xp, 30);
    if (round < 2) f = F.act(f, "next-customer");
  }
  assert.equal(Object.keys(f.cashReceipts).length, 3);
  assert.throws(() => F.act(f, "next-customer"));
  f = F.act(f, "restart-cash");
  assert.equal(f.cashRound, 0);
  assert.deepEqual(f.coins, []);
  assert.deepEqual(f.cashReceipts, {});
  assert.equal(R.progress(profile(f)).xp, 30);
  f = F.act(f, "coin", 500);
  f = F.act(f, "coin", 500);
  assert.throws(() => F.act(f, "submit-cash"), /Take back \$2.00/);
});

test("guided builds and one-tap deliveries can be replayed without repeating rewards", () => {
  let f = F.initial();
  for (const [i, part] of [
    "lens:reclaimed",
    "mount:salvaged",
    "delivery:delivered",
  ].entries()) {
    f = F.act(f, "part", part);
    assert.equal(f.buildStep, Math.min(i + 1, 2));
  }
  f = F.act(f, "submit-workshop");
  assert.equal(f.workshopBuilt, true);
  const proof = f.solutions.workshop;
  f = F.act(f, "reset-workshop");
  assert.equal(f.workshopBuilt, false);
  assert.deepEqual(f.solutions.workshop, proof);
  assert.equal(R.progress(profile(f)).xp, 30);
  for (const path of ["coast", "bridge"]) {
    f = F.act(f, "choose-route", path);
    const status = F.routeStatus(f.moves);
    assert.equal(status.complete, true);
    assert.equal(status.cost, path === "coast" ? 0 : 200);
    f = F.act(f, "route-reason", 1);
    assert.equal(f.routeReason, 1);
    f = F.act(f, "route-reason", 0);
    assert.deepEqual(F.restore(JSON.parse(JSON.stringify(f))), f);
    assert.equal(R.progress(profile(f)).xp, 60);
    f = F.act(f, "next-delivery");
    assert.equal(f.routeReason, null);
    assert.deepEqual(f.moves, []);
  }
  assert.equal(f.deliveryJob, 2);
  assert.throws(() => F.act(f, "route-reason", 0), /Deliver the crate first/);
  assert.throws(() => F.act(f, "choose-route", "teleport"));
});

test("old festival saves migrate their proofs and corrupt round or receipt data is rejected", () => {
  let f = F.initial();
  for (const note of [500, 200, 100]) f = F.act(f, "coin", note);
  f = F.act(f, "submit-cash");
  const old = JSON.parse(JSON.stringify(f));
  for (const key of [
    "buildStep",
    "workshopBuilt",
    "cashRound",
    "cashReceipts",
    "deliveryJob",
    "routeReason",
  ])
    delete old[key];
  const restored = F.restore(old);
  assert.deepEqual(restored.cashReceipts.tickets, [500, 200, 100]);
  assert.deepEqual(restored.solutions, f.solutions);
  assert.equal(R.progress(profile(restored)).xp, 30);
  for (const patch of [
    { cashRound: 3 },
    { cashRound: 2 },
    { cashReceipts: { tickets: [500] } },
    { cashReceipts: { fake: [500, 200, 100] } },
    { buildStep: -1 },
    { workshopBuilt: true },
    { deliveryJob: 99 },
    { routeReason: 0 },
  ])
    assert.throws(() => F.restore({ ...f, ...patch }));
});
