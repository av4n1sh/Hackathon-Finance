"use strict";
const test = require("node:test"),
  assert = require("node:assert/strict");
const fs = require("node:fs"),
  path = require("node:path");
const { JSDOM, VirtualConsole } = require("jsdom");
const C = require("../public/content");
const directory = path.join(__dirname, "../public");
const tick = () => new Promise((resolve) => setTimeout(resolve, 15));
function fixture({ seed, fetcher, storageBlocked = false } = {}) {
  const errors = [],
    console = new VirtualConsole();
  console.on("jsdomError", (e) => errors.push(e.message));
  const dom = new JSDOM(
    fs.readFileSync(path.join(directory, "index.html"), "utf8"),
    {
      url: "http://localhost:3000/#play",
      runScripts: "outside-only",
      pretendToBeVisual: true,
      virtualConsole: console,
    },
  );
  const w = dom.window;
  w.scrollTo = () => {};
  w.HTMLElement.prototype.scrollIntoView = () => {};
  w.fetch =
    fetcher ||
    (async () => ({ ok: true, json: async () => ({ contributions: [] }) }));
  if (seed) w.localStorage.setItem("harbor-adventure-v1", seed);
  if (storageBlocked)
    Object.defineProperty(w, "localStorage", {
      get() {
        throw new Error("Blocked");
      },
    });
  for (const file of ["content.js", "game.js", "app.js"])
    w.eval(fs.readFileSync(path.join(directory, file), "utf8"));
  const click = (selector) => {
    const el = w.document.querySelector(selector);
    assert.ok(el, `Missing ${selector}`);
    el.click();
    return el;
  };
  const go = async (hash) => {
    w.location.hash = hash;
    await tick();
  };
  const submit = (form) =>
    w.document
      .querySelector(form)
      .dispatchEvent(
        new w.Event("submit", { bubbles: true, cancelable: true }),
      );
  return { dom, w, errors, click, go, submit };
}
test("first visitor starts as guest, completes a connected story, earns badges and restores progress", async (t) => {
  const f = fixture();
  t.after(() => f.dom.window.close());
  assert.equal(f.w.document.querySelectorAll("nav a").length, 3);
  assert.match(
    f.w.document.querySelector("main").textContent,
    /Practice everyday money choices/,
  );
  await f.go("#play/setup");
  f.submit("#start-form");
  await tick();
  for (let i = 0; i < 5; i++) {
    f.click('[data-choice="0"]');
    f.click(`[data-reason="${C.steps[i].reflection.correct}"]`);
    f.click('[data-action="next"]');
  }
  assert.match(f.w.document.querySelector("main").textContent, /Week complete/);
  assert.match(f.w.document.querySelector("main").textContent, /\$6.00/);
  assert.equal(f.w.document.querySelectorAll(".decision .badge").length, 5);
  const seed = f.w.localStorage.getItem("harbor-adventure-v1");
  const second = fixture({ seed });
  t.after(() => second.dom.window.close());
  await second.go("#play/story");
  assert.match(
    second.w.document.querySelector("main").textContent,
    /Week complete/,
  );
  assert.deepEqual(f.errors, []);
  assert.deepEqual(second.errors, []);
});
test("lesson navigation preserves the pending consequence and retries undo exact costs", async (t) => {
  const f = fixture();
  t.after(() => f.dom.window.close());
  await f.go("#play/setup");
  f.submit("#start-form");
  await tick();
  f.click('[data-choice="1"]');
  const before = f.w.localStorage.getItem("harbor-adventure-v1");
  await f.go("#learn/plan");
  f.click('[data-lesson="plan"][data-answer="0"]');
  await f.go("#play/story");
  assert.match(f.w.document.querySelector(".feedback").textContent, /\$68.00/);
  assert.equal(
    JSON.parse(f.w.localStorage.getItem("harbor-adventure-v1")).game.pending
      .choice,
    JSON.parse(before).game.pending.choice,
  );
  f.click('[data-action="retry"]');
  assert.match(f.w.document.querySelector(".budget").textContent, /\$80.00/);
  assert.equal(
    f.w.document.querySelector("nav a[aria-current=page]").textContent,
    "Play",
  );
  assert.deepEqual(f.errors, []);
});
test("navigation has directional motion, focus, text budgets, labels, and reduced-motion CSS", async (t) => {
  const f = fixture();
  t.after(() => f.dom.window.close());
  await f.go("#community");
  assert.ok(f.w.document.querySelector("main").classList.contains("route-in"));
  await f.go("#learn");
  assert.ok(
    f.w.document.querySelector("main").classList.contains("route-back"),
  );
  assert.equal(f.w.document.activeElement.id, "main");
  await f.go("#community");
  for (const el of f.w.document.querySelectorAll("textarea,input"))
    assert.ok(el.labels.length);
  const css = fs.readFileSync(path.join(directory, "styles.css"), "utf8");
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /focus-visible/);
  assert.match(css, /max-width:\s*650px/);
});
test("community sends consent, retains drafts across tabs, displays receipt, and escapes public content", async (t) => {
  const calls = [];
  const f = fixture({
    fetcher: async (url, options) => {
      calls.push({ url, options });
      return {
        ok: true,
        json: async () =>
          options
            ? { id: "test-id", removalCode: "test-removal" }
            : {
                contributions: [
                  {
                    title: "<img src=x>",
                    situation: "<script>bad</script>",
                    explanation: "Reviewed",
                    improvement: "An example",
                    credit: "<b>nickname</b>",
                  },
                ],
              },
      };
    },
  });
  t.after(() => f.dom.window.close());
  await f.go("#community");
  for (const name of ["situation", "difficulty", "understanding"]) {
    const el = f.w.document.querySelector(`[name=${name}]`);
    el.value = "A fictional situation";
    el.dispatchEvent(new f.w.Event("input", { bubbles: true }));
  }
  f.w.document.querySelector("[name=adaptPermission]").checked = true;
  f.w.document
    .querySelector("[name=adaptPermission]")
    .dispatchEvent(new f.w.Event("input", { bubbles: true }));
  await f.go("#learn");
  await f.go("#community");
  assert.equal(
    f.w.document.querySelector("[name=situation]").value,
    "A fictional situation",
  );
  assert.equal(
    f.w.document.querySelectorAll(
      "#public-contributions img,#public-contributions script",
    ).length,
    0,
  );
  f.submit("#contribution-form");
  await tick();
  assert.match(
    f.w.document.querySelector(".receipt").textContent,
    /test-removal/,
  );
  const posted = JSON.parse(
    calls.find((c) => c.options?.method === "POST").options.body,
  );
  assert.equal(posted.adaptPermission, true);
  assert.equal(posted.publishPermission, false);
  assert.ok(
    !f.w.localStorage.getItem("harbor-adventure-v1")?.includes("test-removal"),
  );
  assert.deepEqual(f.errors, []);
});
test("failed submissions keep the entered text and blocked storage does not prevent play", async (t) => {
  const f = fixture({
    storageBlocked: true,
    fetcher: async () => {
      throw new Error("Offline");
    },
  });
  t.after(() => f.dom.window.close());
  assert.equal(f.w.document.querySelector("#storage-message").hidden, false);
  await f.go("#play/setup");
  f.submit("#start-form");
  await tick();
  f.click('[data-choice="0"]');
  await f.go("#community");
  f.w.document.querySelector("[name=situation]").value = "Keep this draft";
  f.submit("#contribution-form");
  await tick();
  assert.equal(
    f.w.document.querySelector("[name=situation]").value,
    "Keep this draft",
  );
  assert.match(
    f.w.document.querySelector(".form-status").textContent,
    /entries are still here/,
  );
  assert.deepEqual(f.errors, []);
});

test("reviewer UI supports review, draft, permission checks, publication, and locking", async (t) => {
  const errors = [],
    virtualConsole = new VirtualConsole();
  virtualConsole.on("jsdomError", (e) => errors.push(e.message));
  const dom = new JSDOM(
    fs.readFileSync(path.join(directory, "review.html"), "utf8"),
    {
      url: "http://localhost:3000/review.html",
      runScripts: "outside-only",
      virtualConsole,
    },
  );
  t.after(() => dom.window.close());
  const w = dom.window,
    calls = [];
  const row = {
    id: "test-id",
    status: "submitted",
    situation: "<script>unsafe</script>",
    difficulty: "Timing",
    understanding: "Compare",
    suggestion: "",
    credit: "",
    publishPermission: true,
  };
  w.fetch = async (url, options) => {
    calls.push({ url, options });
    if (options.method === "POST") {
      const body = JSON.parse(options.body);
      if (body.action === "review") row.status = "reviewed";
      if (body.action === "draft") {
        row.status = "drafted";
        row.draft = body;
      }
      if (body.action === "publish") {
        if (!body.sourcesChecked)
          return {
            ok: false,
            json: async () => ({ error: "Check sources before publishing." }),
          };
        row.status = "published";
      }
      return { ok: true, json: async () => ({ status: row.status }) };
    }
    return { ok: true, json: async () => ({ contributions: [row] }) };
  };
  w.eval(fs.readFileSync(path.join(directory, "review.js"), "utf8"));
  const submit = (selector) =>
    w.document
      .querySelector(selector)
      .dispatchEvent(
        new w.Event("submit", { bubbles: true, cancelable: true }),
      );
  w.document.querySelector("#reviewer-key").value = "test-secret";
  submit("#review-login");
  await tick();
  assert.equal(w.document.querySelector("#reviewer-key").value, "");
  assert.equal(w.document.querySelectorAll("#review-queue script").length, 0);
  w.document.querySelector("[data-action=review]").click();
  await tick();
  for (const name of ["title", "situation", "explanation", "improvement"])
    w.document.querySelector(`[name=${name}]`).value =
      "Reviewed learning example";
  submit(".draft-form");
  await tick();
  w.document.querySelector("[data-action=publish]").click();
  await tick();
  assert.match(
    w.document.querySelector(".item-status").textContent,
    /Check sources/,
  );
  w.document.querySelector(".sources-checked").checked = true;
  w.document.querySelector("[data-action=publish]").click();
  await tick();
  assert.equal(
    w.document.querySelector(".review-status").textContent,
    "published",
  );
  assert.ok(
    calls.every(
      (c) => c.options.headers.authorization === "Bearer test-secret",
    ),
  );
  assert.equal(w.localStorage.length, 0);
  w.document.querySelector("#logout").click();
  assert.equal(w.document.querySelector("#review-queue").textContent, "");
  assert.equal(w.document.querySelector("#review-login").hidden, false);
  assert.deepEqual(errors, []);
});

test("optional AI errors retain authored help and late responses cannot replace another tab", async (t) => {
  let resolveResponse;
  const f = fixture({
    fetcher: () =>
      new Promise((resolve) => {
        resolveResponse = resolve;
      }),
  });
  t.after(() => f.dom.window.close());
  await f.go("#learn/fees");
  f.click("[data-explain=fees]");
  await f.go("#play");
  resolveResponse({
    ok: true,
    json: async () => ({ source: "ai", explanation: "Late response" }),
  });
  await tick();
  assert.ok(
    !f.w.document.querySelector("main").textContent.includes("Late response"),
  );
  assert.match(
    f.w.document.querySelector("main").textContent,
    /Everyday choices/,
  );
  assert.deepEqual(f.errors, []);
});
