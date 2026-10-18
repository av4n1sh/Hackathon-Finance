"use strict";
const test = require("node:test"),
  assert = require("node:assert/strict");
const W = require("../public/world"),
  R = require("../public/rpg"),
  G = require("../public/game");
const saved = () => ({
  rpg: R.initial(),
  game: G.initial(),
  mastered: [],
  missionStamps: [],
  explored: [],
  sideCompleted: [],
});
test("world dimensions, collision, shortest paths, and all characters are reachable", () => {
  assert.equal(W.rows.length, W.height);
  assert.ok(W.rows.every((row) => row.length === W.width));
  const state = R.initial();
  assert.ok(R.walkable(state.x, state.y));
  assert.equal(R.move(state, -1, 0), state); // Sol occupies the tile to the west.
  assert.equal(R.move({ ...state, x: 1, y: 1 }, -1, 0).x, 1); // Tree collision.
  assert.equal(R.path(state, 0, 0), null);
  assert.equal(R.path(state, 99, 99), null);
  assert.throws(() => R.move(state, 2, 0));
  for (const npc of W.npcs) {
    const arrived = R.travel(state, npc.id);
    assert.ok(R.nearby(arrived).some((n) => n.id === npc.id));
    assert.ok(R.talk(arrived, npc.id).talked.includes(npc.id));
  }
  assert.throws(() => R.talk(state, "mara"));
  assert.throws(() => R.travel(state, "missing"));
  const path = R.path(state, 4, 7);
  assert.equal(path.length, 1);
});
test("side quests have deterministic funds and multiple workable garden plans", () => {
  let state = R.travel(R.initial(), "pip");
  for (const receipt of W.receipts)
    state = R.playSide(state, "ledger", receipt.id);
  assert.deepEqual(R.sideStatus(state, "ledger"), {
    complete: true,
    total: 1500,
  });
  state = R.travel(state, "fern");
  state = R.playSide(state, "garden", "refill");
  assert.equal(R.sideStatus(state, "garden").complete, false);
  state = R.playSide(state, "garden", "cart");
  assert.deepEqual(R.sideStatus(state, "garden"), {
    complete: true,
    total: 1000,
  });
  state = R.playSide(state, "garden", "sealed");
  assert.equal(R.sideStatus(state, "garden").complete, false);
  state = R.playSide(state, "garden", "refill");
  assert.deepEqual(R.sideStatus(state, "garden"), {
    complete: true,
    total: 1500,
  });
  assert.equal(G.snapshot(G.initial()).available, 8000);
  assert.throws(() => R.playSide(state, "garden", "free-money"));
  assert.throws(() => R.playSide(R.initial(), "garden", "cart"));
});
test("XP, equipment, and level rewards are unique across repeated conversations and decisions", () => {
  const s = saved();
  s.rpg = R.talk(R.travel(s.rpg, "mara"), "mara");
  const once = R.progress(s).xp;
  s.rpg = R.talk(s.rpg, "mara");
  assert.equal(R.progress(s).xp, once);
  s.explored = ["0:0", "0:1", "0:0"];
  assert.equal(R.progress(s).xp, 25);
  assert.ok(R.progress(s).inventory.some((i) => i.id === "compass"));
  assert.throws(() => R.equip(s, "lantern"));
  s.rpg = R.equip(s, "compass");
  assert.equal(R.progress(s).equipped.id, "compass");
  s.sideCompleted = ["ledger", "ledger"];
  assert.equal(R.progress(s).sides.length, 1);
  assert.ok(R.progress(s).inventory.some((i) => i.id === "pouch"));
});
test("character restoration validates positions, roles, side selections and falls back from locked equipment", () => {
  const state = R.talk(R.travel(R.initial("Ari", "keeper"), "mara"), "mara");
  assert.deepEqual(R.restore(JSON.parse(JSON.stringify(state))), state);
  assert.equal(R.restore().role, "wayfinder");
  assert.throws(() => R.restore({ ...state, x: 0, y: 0 }));
  assert.throws(() => R.restore({ ...state, role: "admin" }));
  assert.throws(() => R.restore({ ...state, talked: ["fake"] }));
  assert.throws(() => R.restore({ ...state, side: { garden: ["fake"] } }));
  const s = saved();
  s.rpg = R.restore({ ...state, equipped: "lantern" });
  assert.equal(R.progress(s).equipped.id, "notebook");
});
