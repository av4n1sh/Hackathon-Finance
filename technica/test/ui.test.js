"use strict";
const test = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  os = require("node:os");
const { JSDOM, CookieJar, VirtualConsole } = require("jsdom"),
  { createApp } = require("../server"),
  CASES = require("../public/cases");
async function until(check, label) {
  for (let i = 0; i < 100; i++) {
    if (check()) return;
    await new Promise((r) => setTimeout(r, 20));
  }
  throw new Error("Timed out: " + label);
}
test("DOM journey: navigation, saved lesson, investigation, replay, valid/invalid allocations, chart table, token ledger, redaction, tutor and persistence", async () => {
  for (const k of [
    "GEMINI_API_KEY",
    "CAPITAL_ONE_API_KEY",
    "CAPITAL_ONE_PRODUCT",
  ])
    delete process.env[k];
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "harbor-ui-")),
    server = createApp({ dataDirectory: dir });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const url = "http://127.0.0.1:" + server.address().port,
    jar = new CookieJar(),
    errors = [],
    savedStorage = new Map();
  async function open() {
    const vc = new VirtualConsole();
    vc.on("jsdomError", (e) => errors.push(e.message));
    return JSDOM.fromURL(url, {
      cookieJar: jar,
      runScripts: "dangerously",
      resources: "usable",
      pretendToBeVisual: true,
      virtualConsole: vc,
      beforeParse(w) {
        for (const [key, value] of savedStorage)
          w.localStorage.setItem(key, value);
        w.__motion = { reduced: false, calls: [], cancels: 0 };
        w.__releases = [];
        w.__holdRoute = "";
        w.matchMedia = () => ({
          get matches() {
            return w.__motion.reduced;
          },
          addEventListener() {},
        });
        w.HTMLElement.prototype.animate = function (frames, options) {
          w.__motion.calls.push({ frames, options });
          return {
            cancel() {
              w.__motion.cancels++;
            },
          };
        };
        w.scrollTo = () => {};
        w.confirm = () => true;
        w.HTMLDialogElement.prototype.showModal = function () {
          this.open = true;
        };
        w.HTMLDialogElement.prototype.close = function () {
          this.open = false;
          this.dispatchEvent(new w.Event("close"));
        };
        w.fetch = async (route, options = {}) => {
          const absolute = new URL(route, url).href,
            cookie = await jar.getCookieString(absolute);
          const r = await fetch(absolute, {
            ...options,
            headers: { ...options.headers, ...(cookie ? { cookie } : {}) },
          });
          const set = r.headers.get("set-cookie");
          if (set) await jar.setCookie(set, absolute);
          if (w.__holdRoute === route)
            await new Promise((resolve) => w.__releases.push(resolve));
          return r;
        };
      },
    });
  }
  let dom;
  try {
    dom = await open();
    let w = dom.window,
      doc = w.document;
    const $ = (s) => doc.querySelector(s);
    const change = (el, value) => {
      el.value = value;
      el.dispatchEvent(new w.Event("input", { bubbles: true }));
      el.dispatchEvent(new w.Event("change", { bubbles: true }));
    };
    const submit = (form) =>
      form.dispatchEvent(
        new w.Event("submit", { bubbles: true, cancelable: true }),
      );
    const go = async (hash, selector) => {
      w.location.hash = hash;
      await until(
        () => $(selector) && $("#main").dataset.view === "#" + hash,
        hash,
      );
      assertTypography();
    };
    function assertTypography() {
      for (const el of $$("#main h1,#main h2"))
        assert.equal(
          w.getComputedStyle(el).fontFamily,
          el.tagName === "H2" && el.closest(".workspace")
            ? "var(--sans)"
            : "var(--serif)",
        );
      for (const el of $$(
        "#main h3,button,input,select,textarea,.data-value,.metric strong,.chart text",
      ))
        assert.equal(w.getComputedStyle(el).fontFamily, "var(--sans)");
    }
    await until(() => $(".hero"), "landing");
    assert.match(doc.body.textContent, /A safer harbor/);
    assert.equal($$(".site-header nav a").length, 6);
    $("#menu-toggle").click();
    assert.equal($("#menu-toggle").getAttribute("aria-expanded"), "true");
    $("#menu-toggle").dispatchEvent(
      new w.KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    assert.equal($("#menu-toggle").getAttribute("aria-expanded"), "false");
    assert.equal(doc.activeElement, $("#menu-toggle"));
    $("#menu-toggle").click();
    assertTypography();
    function $$(s) {
      return [...doc.querySelectorAll(s)];
    }
    await go("learn", ".mission-list");
    assert.equal($("#menu-toggle").getAttribute("aria-expanded"), "false");
    assert.match($(".next-mission").textContent, /A basket/);
    w.location.hash = "lesson/fees";
    await until(
      () => w.location.hash === "#learn" && $(".mission-list"),
      "locked lesson redirect",
    );
    $(".skip").click();
    assert.equal(doc.activeElement, $("#main"));
    assert.equal(w.location.hash, "#learn");
    assert.equal(
      w
        .getComputedStyle(doc.documentElement)
        .getPropertyValue("--font-heading")
        .trim(),
      "Georgia, serif",
    );
    await go("lesson/etf", "#lesson-form");
    $('[data-lesson-section="2"]').click();
    assert.equal(doc.activeElement, $("#lesson-questions"));
    assert.equal(w.location.hash, "#lesson/etf");
    $('[name=answer][value="0"]').checked = true;
    $('[name=check][value="1"]').checked = true;
    assert.equal($("#lesson-form").checkValidity(), true);
    submit($("#lesson-form"));
    await until(
      () => $("#lesson-feedback").textContent.includes("Well reasoned"),
      "lesson submit",
    );
    assert.match($("#nav-xp").textContent, /50 XP/);
    assert.match($(".lesson-completed-count").textContent, /1 of 6/);
    assert.equal($(".lesson-completion-progress").value, 1);
    await go("lesson/fees", "#lesson-form");
    await until(
      () => $("h1").textContent.includes("quiet cost"),
      "unlocked lesson renders its own content",
    );
    assert.match($(".lesson-content").textContent, /Translate a percentage/);
    await go("lesson/etf", "#lesson-form");
    assert.ok($(".lesson-content").textContent.includes("exchange-traded"));
    await go("case/A", "#case-form");
    const c = CASES[0];
    assert.equal($("#case-submit").disabled, true);
    assert.equal($("#case-progress").value, 0);
    $("#next-artifact").click();
    assert.equal(doc.activeElement.name, c.evidence[0].id);
    for (const e of c.evidence)
      $(`[name="${e.id}"][value="${e.truth}"]`).click();
    $('[name=action][value="x2"]').click();
    $('[name=reason][value="r2"]').click();
    assert.equal($("#case-progress").value, c.evidence.length + 2);
    assert.equal($("#case-submit").disabled, false);
    assert.equal($("#next-artifact").disabled, true);
    change($("#case-note"), "Check the seller independently.");
    await go("etf", "#fee-years");
    change($("#fee-years"), "7");
    change($("#fee-contribution"), "1200");
    await go("case/A", "#case-form");
    assert.equal($("#case-note").value, "Check the seller independently.");
    assert.equal($('[name=action][value="x2"]').checked, true);
    assert.equal($("#case-form").checkValidity(), true);
    submit($("#case-form"));
    await until(() => $(".result-score"), "investigation debrief");
    assertTypography();
    assert.match($(".result-score").textContent, /100/);
    assert.match($("#nav-xp").textContent, /150 XP/);
    $("#replay").click();
    await until(() => $("#case-form"), "replay");
    for (const e of c.evidence)
      $(`[name="${e.id}"][value="${e.truth}"]`).checked = true;
    $('[name=action][value="x2"]').checked = true;
    $('[name=reason][value="r2"]').checked = true;
    submit($("#case-form"));
    await until(() => $(".result-score"), "replay debrief");
    assert.match(doc.body.textContent, /\+0 XP saved/);
    await go("etf", "#allocation-result");
    assert.equal($("#fee-years").value, "7");
    assert.equal($("#fee-contribution").value, "1200");
    assert.ok($(".chart title").textContent.includes("Hypothetical"));
    assert.equal($$("#fee-results tbody tr").length, 8);
    change($(".allocation-number"), "44");
    assert.match($("#allocation-result").textContent, /must total 100/);
    change($(".allocation-number"), "45");
    assert.match($("#allocation-result").textContent, /0.169%/);
    change($("#scenario"), "downturn");
    assert.match($("#scenario-result").textContent, /loses value/);
    $("#snapshot-save").click();
    assert.match($("#snapshots").textContent, /Saved mix/);
    $("#allocation-equal").click();
    assert.deepEqual(
      $$(".allocation-number").map((el) => el.value),
      ["25", "25", "25", "25"],
    );
    $("#snapshot-save").click();
    assert.equal($$("#snapshots tbody tr").length, 2);
    change($(".allocation-number"), "35");
    $("#allocation-balance").click();
    assert.equal($$(".allocation-number")[1].value, "15");
    change($(".allocation-number"), "80");
    $("#allocation-balance").click();
    assert.match($("#allocation-help").textContent, /Reduce|reduce/);
    $('[data-load="1"]').click();
    assert.equal($(".allocation-number").value, "45");
    assert.equal($("#scenario").value, "downturn");
    change($("#fee-years"), "1");
    change($("#fee-contribution"), "1000");
    assert.equal($$("#fee-results tbody tr").length, 2);
    await go("tokens", "#issue-tokens");
    $("#issue-tokens").click();
    assert.match($("#token-ledger").textContent, /100/);
    submit($("#transfer-form"));
    assert.match($("#token-ledger").textContent, /90 units/);
    assert.match($("#token-ledger").textContent, /10 units/);
    $("#fail-transfer").click();
    assert.match($("#transfer-feedback").textContent, /Insufficient/);
    await go("vault", "#redact-form");
    assert.equal($$(".vault-term").length, 14);
    change($("#vault-category"), "messages");
    assert.equal($$(".vault-term").length, 3);
    $("#vault-topic-phishing summary").click();
    assert.equal($("#vault-topic-phishing").open, true);
    assert.deepEqual(
      $$("#vault-topic-phishing dt").map((n) => n.textContent),
      [
        "What it means",
        "Why it matters",
        "Fictional example",
        "What to check",
        "Common misconception",
      ],
    );
    assert.match(
      $("#vault-topic-phishing .vault-references a").href,
      /consumer.ftc.gov/,
    );
    change($("#vault-search"), "seed phrase");
    assert.ok($("#vault-empty-clear"));
    assert.match($("#vault-count").textContent, /0 topics/);
    $("#vault-empty-clear").click();
    assert.equal($$(".vault-term").length, 14);
    assert.equal(doc.activeElement, $("#vault-search"));
    change($("#vault-category"), "digital");
    change($("#vault-search"), "SEED phrase");
    assert.equal($$(".vault-term").length, 1);
    assert.ok($("#vault-topic-private-keys"));
    await go("vault/expenses", "#vault-topic-expenses[open]");
    assert.equal(doc.activeElement, $("#vault-topic-expenses summary"));
    $("#vault-topic-expenses .vault-related a").click();
    await until(() => $("#vault-topic-etfs[open]"), "related concept link");
    assert.ok(
      $("#vault-topic-etfs .vault-practice a").href.endsWith("#investigations"),
    );
    for (const el of $$("button,input,select,textarea"))
      assert.equal(w.getComputedStyle(el).fontFamily, "var(--sans)");
    assert.equal(w.getComputedStyle($("h1")).fontFamily, "var(--serif)");
    assert.equal(
      w.getComputedStyle($("#vault-topic-etfs h2")).fontFamily,
      "var(--sans)",
    );
    change(
      $("#raw-message"),
      "Contact fictional@example.com. password: secret",
    );
    submit($("#redact-form"));
    assert.match($("#review-message").value, /\[email\]/);
    assert.ok(!$("#review-message").value.includes("secret"));
    $("#reviewed").checked = true;
    submit($("#message-form"));
    await until(
      () => $("#message-result").textContent.includes("no AI analysis"),
      "message demo",
    );
    $("#guide-open").click();
    change($("#guide-question"), "What are fees?");
    change($("#guide-topic"), "fees");
    submit($("#guide-form"));
    await until(
      () => $("#guide-answer").textContent.includes("Authored explanation"),
      "tutor demo",
    );
    assert.match($("#guide-answer").textContent, /not a generated answer/);
    $("#practice-button").click();
    await until(() => $('[data-answer="B"]'), "practice");
    $('[data-answer="B"]').click();
    assert.match($("#practice-feedback").textContent, /right/);
    $("#guide-close").click();
    await go("progress", "#preferences-form");
    assert.match(doc.body.textContent, /Saved in this browser/);
    $('[data-check-provider="gemini"]').click();
    await until(
      () => !$("#services").hasAttribute("aria-busy"),
      "Gemini connection diagnostic",
    );
    assert.match($("#services").textContent, /Gemini is not configured/);
    assert.equal(doc.activeElement, $('[data-check-provider="gemini"]'));
    $('[data-check-provider="capitalOne"]').click();
    await until(
      () => !$("#services").hasAttribute("aria-busy"),
      "Nessie connection diagnostic",
    );
    assert.match($("#services").textContent, /product is unconfirmed/);
    assert.equal($("#cloud-memory"), null);
    assert.equal($(".audio-create"), null);
    assert.match(doc.body.textContent, /150/);
    // Keep local work across tabs, and reject responses from an earlier visit.
    assert.ok(w.__motion.calls.every((c) => c.options.duration === 230));
    assert.ok(w.__motion.calls.every((c) => c.options.fill === "both"));
    const motionCount = w.__motion.calls.length;
    w.__motion.reduced = true;
    await go("tokens", "#transfer-form");
    assert.equal(w.__motion.calls.length, motionCount);
    assert.match($("#token-ledger").textContent, /90 units/);
    w.__motion.reduced = false;
    await go("lesson/etf", "#lesson-form");
    assert.ok($(".lesson-more"));
    assert.ok($(".worked-example"));
    w.__holdRoute = "/api/lesson/complete";
    $('[name=answer][value="1"]').checked = true;
    $('[name=check][value="0"]').checked = true;
    submit($("#lesson-form"));
    await until(() => w.__releases.length === 1, "delayed lesson response");
    await go("etf", "#fee-years");
    await go("lesson/etf", "#lesson-form");
    w.__holdRoute = "";
    w.__releases.shift()();
    await until(
      () => !$("#lesson-form button").disabled,
      "old request settled",
    );
    assert.match($("#lesson-feedback").textContent, /Well reasoned/);
    submit($("#lesson-form"));
    await until(
      () => $("#lesson-feedback").textContent.includes("Review the reasoning"),
      "wrong-answer feedback",
    );
    assert.equal($$(".answer-feedback li").length, 2);
    assert.match($("#lesson-feedback").textContent, /bank deposit/);
    $('[name=answer][value="0"]').checked = true;
    $('[name=check][value="1"]').checked = true;
    submit($("#lesson-form"));
    await until(
      () => $("#lesson-feedback").textContent.includes("Well reasoned"),
      "retry correct",
    );
    assert.match($("#nav-xp").textContent, /150 XP/);
    // Direction comes from tab order. Outgoing copies are inert and contain no IDs.
    await go("learn", ".mission-list");
    let start = w.__motion.calls.length;
    await go("etf", "#fee-years");
    assert.ok(
      w.__motion.calls
        .slice(start)
        .some((c) => c.frames[0].transform === "translateX(24px)"),
    );
    assert.equal($(".view-outgoing").getAttribute("aria-hidden"), "true");
    assert.ok($(".view-outgoing").hasAttribute("inert"));
    assert.equal($$(".view-outgoing [id]").length, 0);
    assert.ok(
      $$(".view-outgoing input,.view-outgoing button").every(
        (el) => el.disabled,
      ),
    );
    start = w.__motion.calls.length;
    await go("learn", ".mission-list");
    assert.ok(
      w.__motion.calls
        .slice(start)
        .some((c) => c.frames[0].transform === "translateX(-24px)"),
    );
    assert.ok(w.__motion.cancels > 0);
    await go("money", "#money-example");
    $("#money-sandbox").click();
    await until(
      () => $("#money-status").textContent.includes("unconfirmed"),
      "unconfirmed product",
    );
    $("#money-example").click();
    await until(() => $("#money-check"), "local money example");
    assert.match($("#money-status").textContent, /Capital One was not called/);
    assert.match($("#money-content").textContent, /\$108.00/);
    change($("#money-largest"), "Food");
    submit($("#money-check"));
    assert.match($("#money-check-result").textContent, /Correct/);
    change($("#money-budget"), "100");
    assert.match($("#money-budget-result").textContent, /\$8.00 over/);
    change($("#money-question"), "Why is the balance different?");
    submit($("#money-ask"));
    await until(
      () => $("#money-answer").textContent.includes("Authored fallback"),
      "money explanation fallback",
    );
    await go("etf", "#fee-years");
    await go("money", "#money-example");
    assert.equal($("#money-budget").value, "100");
    assert.equal($("#money-question").value, "Why is the balance different?");
    await go("learn", ".mission-list");
    w.__holdRoute = "/api/tutor";
    $("#guide-open").click();
    change($("#guide-question"), "Explain this example");
    submit($("#guide-form"));
    await until(() => w.__releases.length === 1, "delayed tutor");
    $("#guide-close").click();
    await go("tokens", "#transfer-form");
    w.__holdRoute = "";
    w.__releases.shift()();
    await new Promise((r) => setTimeout(r, 30));
    assert.match($("#guide-answer").textContent, /Section changed/);
    assert.equal($("#guide-question").value, "Explain this example");
    assert.equal($("#guide-form button").disabled, false);
    // A rapid sequence leaves exactly the requested section and active indicator.
    for (const name of ["learn", "progress", "vault", "etf"]) {
      w.location.hash = name;
      await new Promise((r) => setTimeout(r, 0));
    }
    await until(() => $("#fee-years"), "rapid navigation destination");
    assert.equal($$(".site-header nav .active").length, 1);
    assert.equal($(".site-header nav .active").hash, "#etf");
    assert.equal($$("#main > .wrap").length, 1);
    await until(() => !$(".view-outgoing"), "transition cleanup");
    assert.equal($("#main").style.height, "");
    for (let i = 0; i < w.localStorage.length; i++) {
      const key = w.localStorage.key(i);
      savedStorage.set(key, w.localStorage.getItem(key));
    }
    dom.window.close();
    dom = await open();
    w = dom.window;
    doc = w.document;
    await until(() => $(".hero"), "reload landing");
    assert.match($("#nav-xp").textContent, /150 XP/);
    await go("etf", "#fee-years");
    assert.equal($("#fee-years").value, "1");
    assert.equal($("#fee-contribution").value, "1000");
    assert.equal($$("#snapshots tbody tr").length, 2);
    assert.equal(errors.length, 0, errors.join("\n"));
  } finally {
    dom?.window.close();
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
    assert.equal(path.dirname(dir), os.tmpdir());
    assert.ok(path.basename(dir).startsWith("harbor-ui-"));
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
