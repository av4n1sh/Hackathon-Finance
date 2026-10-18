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
        url: "http://localhost:3000/",
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
    "festival.js",
    "rpg-view.js",
    "mini-games-view.js",
    "festival-view.js",
    "learn-view.js",
    "simple-view.js",
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
test("Learn topics expand and collapse, open practice, and retain completed progress", async (t) => {
  const f = fixture();
  t.after(() => f.dom.window.close());
  const style = f.w.document.createElement("style");
  style.textContent = fs.readFileSync(
    path.join(directory, "styles.css"),
    "utf8",
  );
  f.w.document.head.append(style);
  await f.go("#learn");
  const doc = f.w.document,
    card = doc.querySelector(".lesson-card"),
    before = f.w.localStorage.getItem("harbor-adventure-v1");
  assert.equal(doc.querySelectorAll(".lesson-card").length, C.lessons.length);
  assert.equal(card.open, false);
  assert.equal(
    f.w.getComputedStyle(card.querySelector(".when-open")).display,
    "none",
  );
  f.click(".lesson-card > summary");
  assert.equal(card.open, true);
  assert.equal(
    f.w.getComputedStyle(card.querySelector(".when-closed")).display,
    "none",
  );
  assert.match(card.querySelector(".lesson-card-content").textContent, /\$140/);
  f.click(".lesson-card > summary");
  assert.equal(card.open, false);
  assert.equal(f.w.localStorage.getItem("harbor-adventure-v1"), before);
  f.click(".lesson-card > summary");
  const navigated = new Promise((resolve) =>
    f.w.addEventListener("hashchange", resolve, { once: true }),
  );
  f.click('.lesson-card a[href="#learn/plan"]');
  await navigated;
  assert.equal(f.w.location.hash, "#learn/plan");
  const detail = doc.querySelector(".learn-disclosure");
  assert.equal(detail.open, false);
  f.click(".learn-disclosure > summary");
  assert.equal(detail.open, true);
  assert.match(
    detail.querySelector(".learn-detail-content").textContent,
    /resource gap/,
  );
  f.click(".learn-disclosure > summary");
  assert.equal(detail.open, false);
  f.click('[data-lesson="plan"][data-answer="1"]');
  assert.match(
    doc.querySelector("#lesson-feedback").textContent,
    /try the other answer/,
  );
  f.click('[data-lesson="plan"][data-answer="0"]');
  assert.ok(f.data().learned.includes("plan"));
  await f.go("#learn");
  assert.match(
    doc.querySelector(".learn-progress").textContent,
    /1 of 6 practiced/,
  );
  assert.match(
    doc.querySelector(".lesson-card .lesson-complete").textContent,
    /Practiced/,
  );
  assert.deepEqual(f.errors, []);
});

test("RPG entry creates a traveler and replaces Community with the Quest Journal", async (t) => {
  const f = fixture();
  t.after(() => f.dom.window.close());
  assert.match(f.w.document.querySelector("main").textContent, /Harborbound/);
  assert.deepEqual(
    [...f.w.document.querySelectorAll("nav a")].map((a) => a.textContent),
    ["Home", "Play", "Learn"],
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
  await second.go("#play/world");
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
  assert.ok(f.w.document.querySelector(".home-screen"));
  await f.go("#play/world");
  assert.ok(f.w.document.querySelector("#harbor-world"));
  await f.go("#community");
  assert.equal(f.w.location.hash, "#journal");
  assert.ok(f.w.document.querySelector(".inventory"));
  assert.equal(f.w.document.querySelector("#contribution-form"), null);
  const bad = fixture({
    seed: JSON.stringify({ ...old, rpg: { version: 1, x: 0, y: 0 } }),
  });
  t.after(() => bad.dom.window.close());
  await bad.go("#play/world");
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

test("quick-start festival completes all three challenges, lights the world, and persists unique rewards", async (t) => {
  const f = fixture();
  t.after(() => f.dom.window.close());
  f.click("[data-action=quick-start]");
  await tick();
  assert.ok(f.w.document.querySelector(".simple-play"));
  await f.go("#play/world");
  assert.equal(f.data().started, true);
  const walletBefore = f.w.HarborGame.snapshot(f.data().game).available;
  f.click("[data-open-festival=workshop]");
  assert.ok(f.w.document.querySelector("#festival-dialog[open]"));
  for (const part of ["lens:new", "mount:fitted", "delivery:delivered"])
    f.click(`[data-festival-action=part][data-value="${part}"]`);
  f.click("[data-festival-action=submit-workshop]");
  assert.match(
    f.w.document.querySelector("#challenge-feedback").textContent,
    /above the \$20/,
  );
  assert.equal(f.data().festival.solutions.workshop, undefined);
  f.click('[data-festival-action=build-step][data-value="0"]');
  for (const part of ["lens:reclaimed", "mount:salvaged"])
    f.click(`[data-festival-action=part][data-value="${part}"]`);
  f.click("[data-festival-action=submit-workshop]");
  f.click("[data-action=close-festival]");
  assert.ok(f.w.document.querySelector(".festival-phase-1"));
  assert.equal(
    f.w.document.querySelectorAll(".festival-spot.is-lit").length,
    1,
  );
  f.click("[data-open-festival=cash]");
  for (const coin of [500, 200, 100])
    f.click(`[data-festival-action=coin][data-value="${coin}"]`);
  f.click("[data-festival-action=submit-cash]");
  f.click("[data-action=close-festival]");
  f.click("[data-open-festival=route]");
  f.click(".manual-delivery > summary");
  const position = { x: f.data().rpg.x, y: f.data().rpg.y };
  for (const key of [
    "ArrowUp",
    "ArrowRight",
    "ArrowRight",
    "ArrowRight",
    "ArrowRight",
    "ArrowDown",
  ])
    f.w.document.querySelector(".delivery-board").dispatchEvent(
      new f.w.KeyboardEvent("keydown", {
        key,
        bubbles: true,
        cancelable: true,
      }),
    );
  assert.equal(f.w.document.querySelector(".manual-delivery").open, true);
  assert.deepEqual({ x: f.data().rpg.x, y: f.data().rpg.y }, position);
  assert.ok(f.data().festival.solutions.route);
  f.click("[data-action=close-festival]");
  assert.ok(f.w.document.querySelector(".festival-phase-3"));
  assert.equal(
    f.w.document.querySelectorAll(".festival-spot.is-lit").length,
    3,
  );
  assert.equal(f.w.HarborGame.snapshot(f.data().game).available, walletBefore);
  assert.equal(f.w.HarborRPG.progress(f.data()).xp, 90);
  await f.go("#journal");
  assert.match(
    f.w.document.querySelector(".festival-journal").textContent,
    /3 of 3 lanterns lit/,
  );
  assert.ok(f.w.document.querySelector("[data-equip=festival-pin]"));
  const second = fixture({
    seed: f.w.localStorage.getItem("harbor-adventure-v1"),
  });
  t.after(() => second.dom.window.close());
  await second.go("#play/world");
  assert.ok(second.w.document.querySelector(".festival-phase-3"));
  second.click("[data-open-festival=cash]");
  second.click("[data-festival-action=clear-cash]");
  for (const coin of [500, 200, 100])
    second.click(`[data-festival-action=coin][data-value="${coin}"]`);
  assert.equal(second.w.HarborRPG.progress(second.data()).xp, 90);
  second.w.document
    .querySelector("#festival-dialog")
    .dispatchEvent(new second.w.Event("cancel", { cancelable: true }));
  assert.equal(second.data().activeFestival, null);
  assert.deepEqual(f.errors, []);
  assert.deepEqual(second.errors, []);
});

test("pop-up customers give useful retry feedback and retain a partly served queue after refresh", async (t) => {
  const f = fixture();
  t.after(() => f.dom.window.close());
  await f.go("#play");
  f.click("[data-open-festival=cash]");
  f.click('[data-festival-action=coin][data-value="500"]');
  f.click("[data-festival-action=submit-cash]");
  assert.match(
    f.w.document.querySelector("#challenge-feedback").textContent,
    /Add \$3.00 more/,
  );
  assert.equal(f.data().festival.solutions.cash, undefined);
  for (const note of [200, 100])
    f.click(`[data-festival-action=coin][data-value="${note}"]`);
  f.click("[data-festival-action=submit-cash]");
  assert.match(
    f.w.document.querySelector(".game-win").textContent,
    /Pip’s order is ready/,
  );
  assert.equal(
    f.w.document.activeElement,
    f.w.document.querySelector(".game-win h3"),
  );
  f.click("[data-festival-action=next-customer]");
  assert.match(
    f.w.document.querySelector(".game-brief").textContent,
    /Mina · Visitor 2 of 3/,
  );
  assert.match(
    f.w.document.querySelector(".counter-math").textContent,
    /\$6.00/,
  );
  f.click('[data-festival-action=coin][data-value="200"]');
  const reloaded = fixture({
    seed: f.w.localStorage.getItem("harbor-adventure-v1"),
  });
  t.after(() => reloaded.dom.window.close());
  await reloaded.go("#play");
  assert.match(
    reloaded.w.document.querySelector(".game-brief").textContent,
    /Mina/,
  );
  assert.match(
    reloaded.w.document.querySelector(".change-tray").textContent,
    /\$2/,
  );
  reloaded.click('[data-festival-action=coin][data-value="200"]');
  reloaded.click("[data-festival-action=submit-cash]");
  reloaded.click("[data-festival-action=next-customer]");
  for (const note of [500, 500, 200, 200])
    reloaded.click(`[data-festival-action=coin][data-value="${note}"]`);
  reloaded.click("[data-festival-action=submit-cash]");
  assert.match(
    reloaded.w.document.querySelector(".game-win").textContent,
    /Tavi’s order is ready/,
  );
  assert.match(
    reloaded.w.document.querySelector(".cash-equation").textContent,
    /\$14.00/,
  );
  assert.equal(reloaded.w.HarborRPG.progress(reloaded.data()).xp, 30);
  assert.deepEqual(f.errors, []);
  assert.deepEqual(reloaded.errors, []);
});

test("guided lantern choices and quick delivery briefs teach trade-offs while retaining the launch page", async (t) => {
  const f = fixture();
  t.after(() => f.dom.window.close());
  await f.go("#journal");
  f.click("[data-open-festival=workshop]");
  assert.equal(
    f.w.document.querySelectorAll("[data-festival-action=part]").length,
    2,
  );
  for (const part of ["lens:reclaimed", "mount:salvaged", "delivery:delivered"])
    f.click(`[data-festival-action=part][data-value="${part}"]`);
  assert.match(
    f.w.document.querySelector(".build-preview").textContent,
    /Lens repair\$3.00/,
  );
  assert.match(
    f.w.document.querySelector(".build-preview .hint").textContent,
    /\$1.00 left/,
  );
  f.click("[data-festival-action=submit-workshop]");
  assert.match(
    f.w.document.querySelector(".game-win").textContent,
    /include repairs and delivery/,
  );
  f.click(".game-win [data-open-festival=route]");
  assert.equal(f.data().festivalReturn, "#journal");
  f.click('[data-festival-action=choose-route][data-value="coast"]');
  assert.match(
    f.w.document.querySelector(".route-result").textContent,
    /8 steps · \$0.00 spent · \$2.00 left/,
  );
  f.click('[data-festival-action=route-reason][data-value="1"]');
  assert.match(
    f.w.document.querySelector(".route-reflection .game-tip").textContent,
    /Try comparing again/,
  );
  f.click('[data-festival-action=route-reason][data-value="0"]');
  assert.match(
    f.w.document.querySelector(".route-reflection .game-tip").textContent,
    /Exactly/,
  );
  f.click("[data-festival-action=next-delivery]");
  assert.match(
    f.w.document.querySelector(".game-brief").textContent,
    /opening bell/,
  );
  f.click('[data-festival-action=choose-route][data-value="bridge"]');
  assert.match(
    f.w.document.querySelector(".route-result").textContent,
    /6 steps · \$2.00 spent · \$0.00 left/,
  );
  assert.equal(f.w.HarborRPG.progress(f.data()).xp, 60);
  f.click("[data-action=close-festival]");
  assert.equal(f.w.location.hash, "#journal");
  assert.deepEqual(f.errors, []);
});

test("postcard exploration unlocks the fox and companion positions follow walking", async (t) => {
  const f = fixture();
  t.after(() => f.dom.window.close());
  await f.start();
  for (const id of ["welcome", "grove", "market"])
    f.click(`[data-postcard=${id}]`);
  assert.equal(f.data().festival.postcards.length, 3);
  assert.equal(f.w.document.querySelectorAll(".hidden-postcard").length, 2);
  assert.equal(
    f.w.document.querySelector("[data-companion=fox]").disabled,
    false,
  );
  f.click("[data-companion=fox]");
  assert.ok(f.w.document.querySelector(".travel-companion.fox"));
  f.click("[data-move=left]");
  assert.equal(
    f.w.document.querySelector("#travel-companion").style.left,
    f.w.document.querySelector("#world-player").style.left,
  );
  assert.equal(f.w.HarborRPG.progress(f.data()).xp, 15);
  await f.go("#journal");
  assert.match(
    f.w.document.querySelector(".postcard-album").textContent,
    /A pocket-sized adventure/,
  );
  assert.deepEqual(f.errors, []);
});

test("Home is the default for new and returning players and remains separate from Play", async (t) => {
  const f = fixture();
  t.after(() => f.dom.window.close());
  assert.ok(f.w.document.querySelector(".home-screen"));
  assert.equal(f.w.document.querySelector(".rpg-map"), null);
  assert.equal(f.w.document.querySelector("#festival-dialog"), null);
  assert.equal(
    f.w.document.querySelector("nav [aria-current=page]").textContent,
    "Home",
  );
  f.click("[data-action=quick-start]");
  await tick();
  assert.ok(f.w.document.querySelector(".simple-play"));
  assert.equal(f.w.location.hash, "#play");
  assert.equal(f.w.document.querySelector(".rpg-map"), null);
  const seed = f.w.localStorage.getItem("harbor-adventure-v1"),
    second = fixture({ seed });
  t.after(() => second.dom.window.close());
  assert.ok(second.w.document.querySelector(".home-resume"));
  assert.equal(second.w.document.querySelector(".rpg-map"), null);
  await f.go("#learn");
  await f.go("#home");
  assert.ok(f.w.document.querySelector(".home-screen"));
  assert.equal(f.w.localStorage.getItem("harbor-adventure-v1"), seed);
  assert.deepEqual(f.errors, []);
  assert.deepEqual(second.errors, []);
});

test("simple Play recommends one activity, advances after completion, and returns to the hub", async (t) => {
  const f = fixture();
  t.after(() => f.dom.window.close());
  await f.go("#play");
  assert.match(
    f.w.document.querySelector(".next-game-card h2").textContent,
    /Pocket-money pop-up/,
  );
  assert.equal(f.w.document.querySelector(".choose-game").open, false);
  assert.equal(f.w.document.querySelector(".explore-more").open, false);
  f.click(".next-game-card button");
  const before = { x: f.data().rpg.x, y: f.data().rpg.y };
  for (const coin of [500, 200, 100])
    f.click(`[data-festival-action=coin][data-value="${coin}"]`);
  f.click("[data-festival-action=submit-cash]");
  f.click("[data-action=close-festival]");
  assert.equal(f.w.location.hash, "#play");
  assert.equal(f.w.document.querySelector(".rpg-map"), null);
  assert.match(
    f.w.document.querySelector(".next-game-card h2").textContent,
    /Lantern lab/,
  );
  assert.match(
    f.w.document.querySelector(".simple-lights").textContent,
    /1 of 3/,
  );
  assert.equal(
    f.w.document.activeElement,
    f.w.document.querySelector(".next-game-card button"),
  );
  assert.deepEqual({ x: f.data().rpg.x, y: f.data().rpg.y }, before);
  await f.go("#journal");
  f.click("[data-open-festival=workshop]");
  f.click("[data-action=close-festival]");
  assert.equal(f.w.location.hash, "#journal");
  assert.ok(f.w.document.querySelector(".inventory"));
  assert.deepEqual(f.errors, []);
});

test("a saved open game stays out of Home and resumes from Play with its inputs intact", async (t) => {
  const f = fixture();
  t.after(() => f.dom.window.close());
  await f.go("#play");
  f.click(".next-game-card button");
  f.click('[data-festival-action=coin][data-value="500"]');
  const second = fixture({
    seed: f.w.localStorage.getItem("harbor-adventure-v1"),
  });
  t.after(() => second.dom.window.close());
  assert.ok(second.w.document.querySelector(".home-screen"));
  assert.equal(second.w.document.querySelector("#festival-dialog"), null);
  assert.match(
    second.w.document.querySelector(".home-resume").textContent,
    /Pocket-money pop-up/,
  );
  await second.go("#play");
  assert.ok(second.w.document.querySelector("#festival-dialog[open]"));
  assert.match(
    second.w.document.querySelector(".change-tray").textContent,
    /\$5/,
  );
  second.click("[data-action=close-festival]");
  assert.ok(second.w.document.querySelector(".simple-play"));
  assert.deepEqual(second.data().festival.coins, [500]);
  assert.deepEqual(second.errors, []);
});
