"use strict";
const test = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  { JSDOM, VirtualConsole } = require("jsdom");
const C = require("../public/content"),
  W = require("../public/world");
const directory = path.join(__dirname, "../public"),
  tick = () => new Promise((r) => setTimeout(r, 15));
function fixture({ seed, blocked = false, fetcher } = {}) {
  const errors = [],
    vc = new VirtualConsole();
  vc.on("jsdomError", (e) => errors.push(e.message));
  const dom = new JSDOM(
      fs.readFileSync(path.join(directory, "index.html"), "utf8"),
      {
        url: "http://localhost:3000/#play",
        runScripts: "outside-only",
        pretendToBeVisual: true,
        virtualConsole: vc,
      },
    ),
    w = dom.window;
  w.scrollTo = () => {};
  w.HTMLElement.prototype.scrollIntoView = () => {};
  w.fetch =
    fetcher ||
    (async () => ({
      ok: true,
      json: async () => ({ source: "authored", explanation: "A field note." }),
    }));
  if (seed) w.localStorage.setItem("harbor-adventure-v1", seed);
  if (blocked)
    Object.defineProperty(w, "localStorage", {
      get() {
        throw Error("Blocked");
      },
    });
  for (const file of [
    "content.js",
    "game.js",
    "play.js",
    "world.js",
    "rpg.js",
    "rpg-view.js",
    "learn-view.js",
    "app.js",
  ])
    w.eval(fs.readFileSync(path.join(directory, file), "utf8"));
  const click = (selector) => {
    const e = w.document.querySelector(selector);
    assert.ok(e, `Missing ${selector}`);
    e.click();
    return e;
  };
  const go = async (hash) => {
    w.location.hash = hash;
    await tick();
  };
  const submit = () =>
    w.document
      .querySelector("#start-form")
      .dispatchEvent(
        new w.Event("submit", { bubbles: true, cancelable: true }),
      );
  const data = () => JSON.parse(w.localStorage.getItem("harbor-adventure-v1"));
  const start = async () => {
    await go("#play/setup");
    submit();
    await tick();
  };
  return { dom, w, errors, click, go, submit, start, data };
}
test("RPG entry creates a traveler and replaces Community with the Quest Journal", async (t) => {
  const f = fixture();
  t.after(() => f.dom.window.close());
  assert.match(f.w.document.querySelector("main").textContent, /Harborbound/);
  assert.deepEqual(
    [...f.w.document.querySelectorAll("nav a")].map((a) => a.textContent),
    ["Play", "Learn", "Quest Journal"],
  );
  await f.go("#play/setup");
  f.w.document.querySelector("[name=name]").value = "<b>Ari</b>";
  f.w.document.querySelector("[value=keeper]").checked = true;
  f.submit();
  await tick();
  assert.ok(f.w.document.querySelector(".rpg-map"));
  assert.equal(f.w.document.querySelectorAll(".world-tile").length, 176);
  assert.equal(f.data().rpg.role, "keeper");
  assert.equal(
    f.w.document.querySelector(".character-hud h2").textContent,
    "<b>Ari</b>",
  );
  assert.equal(f.w.document.querySelectorAll(".character-hud h2 b").length, 0);
  assert.deepEqual(f.errors, []);
});
test("keyboard and touch movement update the player, respect collision, and E talks", async (t) => {
  const f = fixture();
  t.after(() => f.dom.window.close());
  await f.start();
  const world = f.w.document.querySelector("#harbor-world");
  world.focus();
  world.dispatchEvent(
    new f.w.KeyboardEvent("keydown", {
      key: "e",
      bubbles: true,
      cancelable: true,
    }),
  );
  assert.equal(f.data().talking, "sol");
  f.click("[data-action=close-talk]");
  const pawn = f.w.document.querySelector("#world-player");
  f.w.document.querySelector("#harbor-world").dispatchEvent(
    new f.w.KeyboardEvent("keydown", {
      key: "ArrowUp",
      bubbles: true,
      cancelable: true,
    }),
  );
  assert.equal(f.data().rpg.y, 7);
  assert.equal(f.w.document.querySelector("#world-player"), pawn);
  assert.equal(pawn.style.top, `${(7 / 11) * 100}%`);
  f.click("[data-move=down]");
  assert.equal(f.data().rpg.y, 8);
  f.click("[data-move=left]");
  assert.equal(f.data().rpg.x, 4);
  assert.deepEqual(f.errors, []);
});
test("all five NPC quests complete, unlock equipment, and persist the ending", async (t) => {
  const f = fixture();
  t.after(() => f.dom.window.close());
  await f.start();
  for (let i = 0; i < 5; i++) {
    f.click(`[data-travel=${W.npcs.find((n) => n.step === i).id}]`);
    f.click('[data-choice="0"]');
    f.click(`[data-reason="${C.steps[i].reflection.correct}"]`);
    f.click("[data-action=next]");
  }
  assert.equal(f.data().game.answers.length, 5);
  assert.match(
    f.w.document.querySelector(".quest-tracker").textContent,
    /Main journey complete/,
  );
  assert.match(f.w.document.querySelector(".wallet").textContent, /\$6.00/);
  await f.go("#journal");
  assert.equal(
    f.w.document.querySelectorAll(".inventory-item.unlocked").length,
    6,
  );
  assert.equal(f.w.document.querySelectorAll(".quest-done").length, 5);
  const second = fixture({
    seed: f.w.localStorage.getItem("harbor-adventure-v1"),
  });
  t.after(() => second.dom.window.close());
  assert.equal(second.w.document.querySelectorAll(".rpg-map").length, 1);
  assert.equal(second.data().game.answers.length, 5);
  assert.deepEqual(f.errors, []);
  assert.deepEqual(second.errors, []);
});
test("future characters cannot skip chapters; field notes return to a pending decision", async (t) => {
  const f = fixture();
  t.after(() => f.dom.window.close());
  await f.start();
  f.click("[data-travel=tavi]");
  assert.equal(f.w.document.querySelector("[data-choice]"), null);
  assert.match(
    f.w.document.querySelector(".npc-dialog").textContent,
    /finish your current quest/,
  );
  f.click("[data-travel=mara]");
  f.click('[data-choice="1"]');
  await f.go("#learn/plan");
  f.click('[data-lesson=plan][data-answer="0"]');
  await f.go("#play/world");
  assert.match(f.w.document.querySelector(".feedback").textContent, /\$68.00/);
  assert.equal(f.data().game.pending.choice, 1);
  f.click("[data-action=retry]");
  assert.match(f.w.document.querySelector(".wallet").textContent, /\$80.00/);
  assert.deepEqual(f.errors, []);
});
test("side quests, equipment, and XP remain unique when replayed", async (t) => {
  const f = fixture();
  t.after(() => f.dom.window.close());
  await f.start();
  f.click("[data-travel=pip]");
  for (const id of ["bread", "ride", "repair"])
    f.click(`[data-side=ledger][data-item=${id}]`);
  assert.match(
    f.w.document.querySelector(".quest-reward").textContent,
    /40 XP/,
  );
  const xp = f.w.HarborRPG.progress(f.data()).xp;
  f.click("[data-side=ledger][data-item=repair]");
  f.click("[data-side=ledger][data-item=repair]");
  assert.equal(f.w.HarborRPG.progress(f.data()).xp, xp);
  f.click("[data-travel=fern]");
  for (const id of ["refill", "cart"])
    f.click(`[data-side=garden][data-item=${id}]`);
  assert.equal(f.data().sideCompleted.length, 2);
  assert.equal(f.w.HarborGame.snapshot(f.data().game).available, 8000);
  await f.go("#journal");
  f.click("[data-equip=pouch]");
  assert.match(
    f.w.document.querySelector("[data-equip=pouch]").textContent,
    /Equipped/,
  );
  f.click("[data-track=mara]");
  await tick();
  assert.match(
    f.w.document.querySelector(".equipped-tool").textContent,
    /Receipt pouch/,
  );
  assert.deepEqual(f.errors, []);
});
test("activity stamps, XP, and learned tools survive journal replay", async (t) => {
  const f = fixture();
  t.after(() => f.dom.window.close());
  await f.start();
  f.click("[data-travel=mara]");
  for (let j = 0; j < 6; j++) f.click('[data-mission=plan][data-move="1000"]');
  assert.deepEqual(f.data().missionStamps, ["plan"]);
  f.click('[data-choice="0"]');
  f.click('[data-reason="0"]');
  f.click("[data-action=next]");
  const xp = f.w.HarborRPG.progress(f.data()).xp;
  await f.go("#journal");
  f.click('[data-revisit="0"]');
  await tick();
  assert.equal(f.data().game.answers.length, 0);
  assert.equal(f.w.HarborRPG.progress(f.data()).xp, xp);
  assert.ok(
    f.w.HarborRPG.progress(f.data()).inventory.some((i) => i.id === "compass"),
  );
  assert.deepEqual(f.errors, []);
});
test("legacy saves migrate, old community links go to Journal, and bad character data preserves story", async (t) => {
  const old = {
    game: {
      version: 1,
      goal: "bag",
      answers: [{ choice: 0, reason: 0 }],
      pending: null,
    },
    started: true,
    mastered: ["Thoughtful planner"],
    learned: [],
    missionStamps: [],
    explored: ["0:0"],
  };
  const f = fixture({ seed: JSON.stringify(old) });
  t.after(() => f.dom.window.close());
  assert.ok(f.w.document.querySelector("#harbor-world"));
  await f.go("#community");
  assert.equal(f.w.location.hash, "#journal");
  assert.ok(f.w.document.querySelector(".inventory"));
  assert.equal(f.w.document.querySelector("#contribution-form"), null);
  const bad = fixture({
    seed: JSON.stringify({ ...old, rpg: { version: 1, x: 0, y: 0 } }),
  });
  t.after(() => bad.dom.window.close());
  assert.equal(bad.w.document.querySelector("#storage-message").hidden, false);
  assert.match(
    bad.w.document.querySelector(".quest-tracker").textContent,
    /The trip changes/,
  );
  assert.deepEqual(f.errors, []);
});
test("blocked storage permits play and late AI cannot replace the world", async (t) => {
  const f = fixture({ blocked: true });
  t.after(() => f.dom.window.close());
  await f.start();
  f.click("[data-travel=mara]");
  assert.ok(f.w.document.querySelector(".npc-dialog"));
  assert.equal(f.w.document.querySelector("#storage-message").hidden, false);
  let resolve;
  const other = fixture({ fetcher: () => new Promise((r) => (resolve = r)) });
  t.after(() => other.dom.window.close());
  await other.start();
  await other.go("#learn/fees");
  other.click("[data-explain=fees]");
  await other.go("#play/world");
  resolve({
    ok: true,
    json: async () => ({ source: "ai", explanation: "Late response" }),
  });
  await tick();
  assert.ok(
    !other.w.document
      .querySelector("main")
      .textContent.includes("Late response"),
  );
  assert.ok(other.w.document.querySelector("#harbor-world"));
  assert.deepEqual(f.errors, []);
  assert.deepEqual(other.errors, []);
});
