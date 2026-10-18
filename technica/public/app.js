"use strict";
const main = document.getElementById("main");
let viewVersion = 0,
  requestSerial = 0,
  appliedSerial = 0,
  guideRequestVersion = 0;
let activeHash = "",
  pendingGuide = false;
const viewCache = new Map(),
  controlCache = new Map();
document.querySelector(".skip").addEventListener("click", (event) => {
  event.preventDefault();
  main.focus();
  main.scrollIntoView?.({ block: "start" });
});
const $ = (s, r = document) => r.querySelector(s),
  $$ = (s, r = document) => [...r.querySelectorAll(s)];
function closeNavigation() {
  $("#menu-toggle").setAttribute("aria-expanded", "false");
  $("#main-navigation").classList.remove("is-open");
}
$("#menu-toggle").onclick = () => {
  const open = $("#menu-toggle").getAttribute("aria-expanded") !== "true";
  $("#menu-toggle").setAttribute("aria-expanded", String(open));
  $("#main-navigation").classList.toggle("is-open", open);
};
$(".site-header").addEventListener("keydown", (event) => {
  if (
    event.key === "Escape" &&
    $("#menu-toggle").getAttribute("aria-expanded") === "true"
  ) {
    closeNavigation();
    $("#menu-toggle").focus();
  }
});
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const money = (n) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
const pct = (n) => (n * 100).toFixed(2) + "%";
const TAGS = {
  w: "Potential warning sign",
  v: "Needs verification",
  u: "Not enough information",
};
const state = {
  user: null,
  route: "home",
  topic: "etf",
  allocations: [45, 25, 20, 10],
  scenario: "steady",
  ledger: { Maya: 100, Jordan: 0 },
  issued: false,
  log: [],
  snapshots: [],
};
const draft = {
  get(k, f) {
    try {
      return JSON.parse(localStorage.getItem("harbor-v2-" + k)) ?? f;
    } catch {
      return f;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem("harbor-v2-" + k, JSON.stringify(v));
    } catch {
      toast(
        "Browser storage is unavailable. Progress may be lost when this page closes.",
      );
    }
  },
};
state.allocations = draft.get("allocation", [45, 25, 20, 10]);
if (
  !Array.isArray(state.allocations) ||
  state.allocations.length !== 4 ||
  state.allocations.some((v) => !Number.isFinite(v) || v < 0 || v > 100)
)
  state.allocations = [45, 25, 20, 10];
state.snapshots = draft.get("snapshots", []);
if (!Array.isArray(state.snapshots)) state.snapshots = [];
state.snapshots = state.snapshots
  .filter(
    (s) =>
      s &&
      Array.isArray(s.values) &&
      s.values.length === 4 &&
      s.values.every(Number.isFinite) &&
      Object.hasOwn(Finance.scenarios, s.scenario) &&
      Number.isFinite(s.fee) &&
      Number.isFinite(s.balance),
  )
  .slice(0, 3);
let toastTimer;
function toast(message) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 4500);
}
function status(mode, label = mode) {
  return `<span class="status ${["live", "demo", "unavailable"].includes(mode) ? mode : "demo"}">${esc(label)}</span>`;
}
function updateUser(u) {
  if (u) {
    state.user = u;
    draft.set("progress", {
      done: u.done,
      lessons: u.lessons,
      review: u.review,
      preferences: u.preferences,
    });
  }
  $("#nav-xp").textContent = state.user
    ? `${state.user.xp} XP · My progress`
    : "My progress";
}
async function api(url, body, method) {
  const serial = ++requestSerial;
  const r = await fetch(url, {
    method: method || (body === undefined ? "GET" : "POST"),
    credentials: "same-origin",
    headers: body === undefined ? {} : { "content-type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  let data;
  try {
    data = await r.json();
  } catch {
    throw new Error(
      "Unreadable server response. Restart the server and retry.",
    );
  }
  if (!r.ok) throw new Error(data.error || "Request failed. Please retry.");
  if (data.state && serial >= appliedSerial) {
    appliedSerial = serial;
    updateUser(data.state);
  }
  return data;
}
function on(s, event, fn, root = main) {
  const el = $(s, root);
  if (el) el.addEventListener(event, fn);
}
function feedback(el, message, kind = "success") {
  if (el) el.innerHTML = `<div class="callout ${kind}">${esc(message)}</div>`;
}
function nextLesson() {
  return (
    Content.lessons.find((l) => !state.user?.lessons[l.id]) ||
    Content.lessons[0]
  );
}
function sourceLinks(ids) {
  return `<div class="source-links">Educational reading · reference collection${Content.sources
    .filter((s) => ids.includes(s.id))
    .map(
      (s) =>
        `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)} ↗</a>`,
    )
    .join("")}</div>`;
}
function page(
  title,
  label,
  description,
  body,
  meta = "Educational simulations only. No real transactions.",
) {
  main.innerHTML = `<div class="wrap workspace"><div class="page-top"><span class="eyebrow">${label}</span><h1>${title}</h1><p>${description}</p></div><div class="page-meta"><span>${meta}</span><span>HARBOR ACADEMY / LEARNING BY DOING</span></div>${body}</div>`;
  normalizeLabels(main);
}
function normalizeLabels(root) {
  $$(
    ".eyebrow,.edition span,.artifact-header span,.hero-caption,.page-meta span",
    root,
  ).forEach((el) => {
    const text = el.textContent;
    if (text !== text.toUpperCase()) return;
    el.textContent = text
      .toLowerCase()
      .replace(/(^|[/.]\s*)([a-z])/g, (m, p, c) => p + c.toUpperCase())
      .replace(/\betf\b/g, "ETF")
      .replace(/\bai\b/g, "AI")
      .replace(/\bxp\b/g, "XP")
      .replace(/Harbor academy/, "Harbor Academy");
  });
}
function home() {
  main.innerHTML = `<div class="wrap landing-top"><div class="edition"><span>FINANCIAL CONFIDENCE STARTS HERE</span><span>DARE TO DIVE / VOL. 01</span></div><div class="masthead"><h1>A safer harbor for<br>your <span>financial future.</span></h1><div class="masthead-copy"><p>Investigate scams, explore investing, and learn by doing—without risking real money.</p><a href="#learn" class="small-link">See the learning path <span>↗</span></a></div></div>
<section class="hero" aria-label="Ocean sunset and your invitation to learn"><div class="hero-card"><span class="eyebrow">PRACTICE WITH SIMULATED MONEY</span><h2>Learn what to check<br>before you invest.</h2><p>Work through short lessons, compare fictional funds, and examine offers without putting money at risk.</p><a href="#lesson/${nextLesson().id}" class="button">Continue lesson <span>↗</span></a><a href="#etf" class="hero-secondary">Compare funds in the ETF Lab →</a></div><span class="hero-caption">HARBOR ACADEMY / FINANCIAL LEARNING</span></section>
<form class="ask-strip" id="home-question"><div class="ask-label"><div><h3>Ask about a financial concept.</h3><p>Your finance guide, at your pace. ${status("demo", "Demo available")}</p></div></div><div class="ask-field"><input id="home-ask" aria-label="Ask your finance guide" placeholder="What is an ETF, actually?" maxlength="1200" required><button aria-label="Ask Harbor Guide" type="submit">↗</button></div></form>
<section><div class="section-heading"><div><span class="eyebrow">THREE WAYS TO PRACTICE</span><h2>Choose what to explore.</h2></div><p>Read evidence, test assumptions, or examine how ownership records work.</p></div><div class="topic-grid"><a href="#investigations" class="topic-card"><span class="arrow">↗</span><span class="eyebrow">01 / INVESTIGATE</span><h3>Review the evidence</h3><p>Spot the pressure, examine the evidence, and learn when to pause.</p></a><a href="#etf" class="topic-card"><span class="arrow">↗</span><span class="eyebrow">02 / EXPERIMENT</span><h3>Compare funds and fees</h3><p>Build a fictional portfolio. Discover what fees and diversification really do.</p></a><a href="#tokens" class="topic-card"><span class="arrow">↗</span><span class="eyebrow">03 / LOOK DEEPER</span><h3>Understand tokenized rights</h3><p>Explore tokenized ownership, one digital unit—and one good question—at a time.</p></a></div></section>
<section class="story"><div><span class="eyebrow">WHY WE BUILT HARBOR</span><h2>Practice before the<br>decision is real.</h2><p>From “guaranteed” returns to the fine print on fund fees, beginners face big decisions with little room to practice. Here, mistakes are part of learning.</p></div><ol class="steps"><li><span>01</span><div><strong>Choose a small challenge</strong><p>One clear idea. A few minutes. Start where you are.</p></div></li><li><span>02</span><div><strong>Try, question, and make a decision</strong><p>Use fictional evidence and simulated money.</p></div></li><li><span>03</span><div><strong>Understand the why</strong><p>Get feedback grounded in the choices you actually made.</p></div></li><li><span>04</span><div><strong>Carry your learning forward</strong><p>Save progress, revisit tricky ideas, and unlock your next mission.</p></div></li></ol></section><section class="bottom-callout"><span class="eyebrow light">YOUR LEARNING PATH</span><h2>Start with one lesson.</h2><a href="#learn" class="button">Browse lessons <span>↗</span></a><p class="note light-note">Free to explore as a guest. No financial details required.</p></section></div>`;
  on("#home-question", "submit", (e) => {
    e.preventDefault();
    openGuide($("#home-ask").value, true);
  });
}
function badges() {
  return `<div class="badges"><span class="badge ${state.user.xp > 0 ? "earned" : ""}">First discovery ${state.user.xp > 0 ? "✓" : ""}</span><span class="badge ${Object.values(state.user.done).includes(100) ? "earned" : ""}">Clear-eyed investigator ${Object.values(state.user.done).includes(100) ? "✓" : ""}</span><span class="badge ${Object.keys(state.user.lessons).length === 6 ? "earned" : ""}">Confident navigator ${Object.keys(state.user.lessons).length === 6 ? "✓" : ""}</span></div>`;
}
function learn() {
  const next = nextLesson(),
    count = Object.keys(state.user.lessons).length;
  page(
    "Your learning path",
    "YOUR LEARNING HARBOR",
    "Six lessons on funds, costs, warning signs, and digital ownership. Completion and review notes are saved as you go.",
    `<div class="metrics"><div class="metric"><strong>${count}<small>/6</small></strong><span>Missions completed</span></div><div class="metric"><strong>${state.user.xp}</strong><span>XP earned through learning</span></div><div class="metric"><strong>${Object.keys(state.user.done).length}<small>/6</small></strong><span>Investigations attempted</span></div></div><div class="grid-two"><div class="next-mission"><span class="eyebrow light">${count === 6 ? "KEEP YOUR SKILLS FRESH" : "YOUR RECOMMENDED NEXT MISSION"}</span><h2>${esc(next.title)}</h2><p>${esc(next.objective)}</p><a class="button" href="#lesson/${next.id}">${draft.get("lesson-" + next.id, null) ? "Resume" : "Begin"} mission <span>↗</span></a></div><aside class="panel"><span class="eyebrow">PROGRESS</span><h3>How XP works</h3><p class="note">50 XP per completed mission. Investigation XP is your best score—replays only award an improvement.</p>${badges()}<a class="text-button" href="#progress">View your local progress →</a></aside></div><div class="mission-list">${Content.lessons
      .map((l, i) => {
        const locked = i > 0 && !state.user.lessons[Content.lessons[i - 1].id],
          done = state.user.lessons[l.id];
        return `<article class="mission-row ${locked ? "locked" : ""}"><span class="number">0${i + 1}</span><div><span class="eyebrow">${esc(l.topic)} / ${l.time}</span><h3>${esc(l.title)}</h3><p>${esc(l.objective)}</p></div><div class="row-detail">${locked ? "Complete the previous mission" : `<a href="#lesson/${l.id}" class="button secondary small">${done ? "Revisit ✓" : draft.get("lesson-" + l.id, null) ? "Resume →" : "Begin →"}</a>`}</div></article>`;
      })
      .join("")}</div>`,
  );
}
function choices(name, items, selected, legend) {
  return `<fieldset class="checks"><legend>${legend || "Choose your answer"}</legend>${items.map((t, i) => `<label class="option"><input type="radio" name="${name}" value="${i}" ${String(selected) === String(i) ? "checked" : ""} required><span>${esc(t)}</span></label>`).join("")}</fieldset>`;
}
function caseChoices(name, items, selected, legend) {
  return `<fieldset class="checks"><legend>${esc(legend)}</legend>${items.map((item) => `<label class="option"><input type="radio" name="${name}" value="${item.id}" ${selected === item.id ? "checked" : ""} required><span>${esc(item.text)}</span></label>`).join("")}</fieldset>`;
}
function lesson(id) {
  return renderLesson(id);
}
function investigations() {
  page(
    "Review financial claims.",
    "SCAM DETECTIVE",
    "Investigate fictional offers and messages. Separate warning signs from missing information. Then decide what to do.",
    `<div class="callout warning"><strong>Three labels, three different ideas.</strong> A warning sign suggests caution. Needs verification means there is a checkable claim. Not enough information means that clue alone tells you little. None certifies fraud or safety.</div><div class="case-list field">${CASES.map(
      (c, i) => {
        const locked = i > 0 && (state.user.done[CASES[i - 1].id] || 0) < 50;
        return `<article class="case-card"><div class="case-index"><span>CASE FILE / 0${i + 1}</span>${status("demo", "Fictional scenario")}</div><h2>${esc(c.title)}</h2><p>${esc(c.brief)}</p><span class="eyebrow">${esc(c.skill)}</span>${locked ? `<p class="field-note">Score 50+ on case ${CASES[i - 1].id} to unlock.</p>` : `<a class="button secondary" href="#case/${c.id}">${state.user.done[c.id] !== undefined ? "Reopen · Best " + state.user.done[c.id] + "/100" : "Open case file"} ↗</a>`}</article>`;
      },
    ).join("")}</div>`,
  );
}
function investigation(id) {
  const c = CASES.find((c) => c.id === id);
  if (!c) return notFound();
  const i = CASES.indexOf(c);
  if (i > 0 && (state.user.done[CASES[i - 1].id] || 0) < 50) {
    toast("Score 50+ on the previous investigation first.");
    location.hash = "investigations";
    return;
  }
  state.topic =
    id === "D"
      ? "fees"
      : id === "E"
        ? "diversification"
        : id === "F"
          ? "tokenization"
          : "manipulation";
  const saved = draft.get("case-" + id, {});
  page(
    esc(c.title),
    `INVESTIGATION ${id} / FICTIONAL SCENARIO`,
    esc(c.brief),
    `<form id="case-form"><div class="investigation-layout"><div><span class="eyebrow field">01 / EXAMINE THE EVIDENCE</span>${c.evidence
      .map(
        (e, index) =>
          `<fieldset class="evidence"><legend class="eyebrow">ARTIFACT 0${index + 1}</legend><div class="artifact-header"><span>${esc(e.src)}</span><span>Fictional evidence</span></div><div class="artifact-text">${esc(e.text)}</div><div class="tag-choices">${Object.entries(
            TAGS,
          )
            .map(
              ([key, text]) =>
                `<label><input type="radio" name="${e.id}" value="${key}" ${saved[e.id] === key ? "checked" : ""} required>${text}</label>`,
            )
            .join("")}</div></fieldset>`,
      )
      .join(
        "",
      )}</div><aside class="panel"><span class="eyebrow">02 / MAKE A DECISION</span><h2>What would you do?</h2>${caseChoices(
      "action",
      c.actions,
      saved.action,
      "Choose a response",
    )}<span class="eyebrow">03 / EXPLAIN YOUR THINKING</span>${caseChoices(
      "reason",
      c.reasons,
      saved.reason,
      "Choose your reasoning",
    )}<label for="case-note">Your reasoning (optional)</label><textarea id="case-note" name="note" maxlength="1000" rows="3" placeholder="I would verify…">${esc(saved.note || "")}</textarea><p class="note">When Gemini is live, these notes are sent for feedback. Do not include private information.</p><button type="submit" class="button" id="case-submit">Submit investigation ↗</button><p class="note">All artifacts and both choices are required. Score 50+ to unlock the next case.</p><div id="case-error" aria-live="polite"></div>${id === "D" || id === "E" ? '<a class="text-button" href="#etf">Examine the claim in ETF Lab →</a>' : id === "F" ? '<a class="text-button" href="#tokens">Explore the token ledger →</a>' : ""}</aside></div></form>`,
    '<a class="top-back" href="#investigations">← All investigations</a>',
  );
  const form = $("#case-form"),
    errorTarget = $("#case-error");
  const checkpoint = document.createElement("div");
  checkpoint.className = "case-checkpoint";
  checkpoint.innerHTML = `<div><strong>Investigation checklist</strong><p id="case-checkpoint-text" aria-live="polite"></p><progress id="case-progress" max="${c.evidence.length + 2}" value="0" aria-label="Required investigation choices completed"></progress></div><button class="button secondary small" type="button" id="next-artifact">Next unanswered artifact</button>`;
  form.prepend(checkpoint);
  $$(".evidence", form).forEach(
    (el, i) => (el.id = "artifact-" + c.evidence[i].id),
  );
  function updateCaseProgress() {
    const values = read(),
      tagged = c.evidence.filter((e) => values[e.id]).length,
      count =
        tagged +
        Number(Boolean(values.action)) +
        Number(Boolean(values.reason));
    $("#case-checkpoint-text", form).textContent =
      `${tagged}/${c.evidence.length} artifacts classified · Response ${values.action ? "selected" : "needed"} · Reason ${values.reason ? "selected" : "needed"}`;
    $("#case-progress", form).value = count;
    $("#case-submit", form).disabled =
      count !== c.evidence.length + 2 ||
      form.getAttribute("aria-busy") === "true";
    $("#next-artifact", form).disabled = tagged === c.evidence.length;
  }
  $("#next-artifact", form).onclick = () => {
    const missing = c.evidence.find((e) => !read()[e.id]);
    if (missing) {
      const el = $("#artifact-" + missing.id, form);
      $("input", el).focus({ preventScroll: true });
      el.scrollIntoView?.({ block: "center", behavior: "instant" });
    }
  };
  function read() {
    return Object.fromEntries(new FormData(form));
  }
  on("#case-form", "input", () => {
    draft.set("case-" + id, read());
    updateCaseProgress();
  });
  updateCaseProgress();
  on("#case-form", "submit", async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const epoch = viewVersion;
    const b = read(),
      btn = $("#case-submit");
    btn.disabled = true;
    form.setAttribute("aria-busy", "true");
    btn.textContent = "Preparing your feedback…";
    try {
      const d = await api("/api/coach/debrief", {
        caseId: id,
        tags: Object.fromEntries(c.evidence.map((e) => [e.id, b[e.id]])),
        action: b.action,
        reason: b.reason,
        note: b.note,
      });
      if (
        epoch === viewVersion &&
        form.isConnected &&
        location.hash === "#case/" + id
      )
        caseResult(c, d);
    } catch (error) {
      if (epoch === viewVersion) feedback(errorTarget, error.message, "error");
    } finally {
      form.removeAttribute("aria-busy");
      updateCaseProgress();
      btn.textContent = "Submit investigation ↗";
    }
  });
}
function caseResult(c, d) {
  const s = d.score,
    b = d.debrief,
    next = CASES[CASES.indexOf(c) + 1];
  page(
    "Your investigation results",
    "INVESTIGATION DEBRIEF",
    `Case ${c.id}: ${c.title}`,
    `<div class="grid-two"><div class="panel"><span class="eyebrow">YOUR INVESTIGATION SCORE</span><div class="result-score">${s.total}<small>/100</small></div><div class="score-parts"><span>Evidence ${s.ev}/40</span><span>Decision ${s.ver}/40</span><span>Reasoning ${s.unc}/20</span></div><p class="note">+${d.awarded} XP saved. Replays award only improvement.${s.shotgun ? " A 10-point penalty applied for marking most clues as warnings, including a non-warning." : ""}</p><div class="callout warning"><strong>Fictional consequence</strong><p>${esc(s.consequence)}</p></div><h2 class="field">The evidence, explained.</h2>${d.evidence.map((e) => `<div class="result-evidence"><span class="eyebrow">${esc(e.src)}</span><b>${esc(e.text)}</b><p class="${e.selected === e.truth ? "" : "tag-wrong"}">Your tag: ${TAGS[e.selected]} · Authored key: ${TAGS[e.truth]}</p><p>${esc(e.why)}</p></div>`).join("")}</div><aside class="panel"><span class="eyebrow">YOUR COACH’S NOTES</span><h2>Feedback and verification habit</h2>${status(b.source, b.source === "live" ? "Live · Gemini" : "Demo · Authored feedback")}${b.issue ? `<p class="note">${esc(b.issue)}</p>` : ""}<div><p class="field"><strong>What you noticed</strong><br>${esc(b.strengths)}</p><p><strong>A closer look</strong><br>${esc(b.misconception)}</p><p>${esc(b.explanation)}</p><div class="callout">${esc(b.habit)}</div></div><div class="button-row field"><a href="#case/${c.id}" id="replay" class="button secondary small">Replay case</a>${next && s.total >= 50 ? `<a href="#case/${next.id}" class="button small">Next case →</a>` : ""}</div><a href="#learn" class="text-button">Continue your learning path →</a></aside></div>`,
  );
  on("#replay", "click", (e) => {
    e.preventDefault();
    investigation(c.id);
  });
  const actionReview = document.createElement("section");
  actionReview.className = "panel field";
  actionReview.innerHTML = `<h2>Compare the three responses</h2>${d.actionFeedback.choices.map((a) => `<section class="action-review"><h3>${esc(a.text)}${a.id === d.actionFeedback.selectedId ? " · Your choice" : ""}</h3><p><strong>${a.pts === 40 ? "Strongest supported response" : a.pts > 0 ? "Partial protection" : "Leaves important risks unresolved"}</strong> · ${a.pts}/40 decision points</p><p>${esc(a.cons)}</p></section>`).join("")}<div class="callout"><h3>What remains unknown</h3><p>${esc(d.actionFeedback.unknown)}</p></div>`;
  $(".grid-two > .panel").appendChild(actionReview);
  toast(`Investigation saved · +${d.awarded} XP`);
}
function etf() {
  state.topic = "fees";
  page(
    "Compare funds and fees.",
    "ETF LEARNING LAB",
    "Explore a fictional $10,000 portfolio. Change the mix, question the costs, and see what the labels leave out.",
    `
<div class="callout warning"><strong>Invented funds. Hypothetical returns.</strong> These are learning tools, not forecasts or investment recommendations. Diversification does not guarantee protection from loss.</div>
<div class="lab-layout field"><section class="panel"><span class="eyebrow">01 / BUILD YOUR MIX</span><h2>Choose your allocation</h2><p class="note">Allocation is a percentage of your fictional $10,000. Use sliders or enter a value. Total must equal 100%.</p>${Finance.funds.map((f, i) => `<div class="fund-control"><div class="fund-title"><strong><span class="swatch ${f.id}"></span>${esc(f.name)}</strong><label><span class="sr-only">${esc(f.name)} allocation</span><input type="number" class="allocation-number" data-index="${i}" value="${state.allocations[i]}" min="0" max="100" step="1" aria-label="${esc(f.name)} percentage">%</label></div><span class="fund-meta">${f.type} · ${f.strategy} · ${f.fee.toFixed(2)}% annual expense</span><p>${esc(f.exposure)}</p><input type="range" class="allocation-range" data-index="${i}" min="0" max="100" step="1" value="${state.allocations[i]}" aria-label="${esc(f.name)} allocation slider"></div>`).join("")}<div class="allocation-total" id="allocation-total"></div><div class="button-row"><button class="button secondary small" id="allocation-reset">Reset mix</button><button class="button small" id="snapshot-save">Save experiment</button></div><div id="snapshots"></div></section>
<section class="panel"><span class="eyebrow">02 / LOOK AT THE EXPOSURES</span><h2>Portfolio costs and exposure</h2><div id="allocation-result" aria-live="polite"></div><div class="field"><label for="scenario">Explore a one-year market scenario</label><select id="scenario">${Object.entries(
      Finance.scenarios,
    )
      .map(
        ([key, s]) =>
          `<option value="${key}" ${state.scenario === key ? "selected" : ""}>${s.label}</option>`,
      )
      .join(
        "",
      )}</select><p class="field-note">Fixed invented shocks, not probabilities. No contributions or rebalancing during this year.</p></div><div id="scenario-result"></div><details><summary>Scenario assumptions & calculation</summary><div class="table-wrap"><table><caption>Invented gross one-year returns</caption><thead><tr><th>Fund</th>${Object.values(
      Finance.scenarios,
    )
      .map((s) => `<th>${s.label}</th>`)
      .join("")}</tr></thead><tbody>${Finance.funds
      .map(
        (f, i) =>
          `<tr><td>${f.name}</td>${Object.values(Finance.scenarios)
            .map((s) => `<td>${pct(s.returns[i])}</td>`)
            .join("")}</tr>`,
      )
      .join(
        "",
      )}</tbody></table></div><p>Weighted gross return = Σ(allocation × invented fund return). Ending balance = $10,000 × (1 + weighted gross return) × (1 − weighted expense ratio). This simplified annual deduction differs from real funds’ daily accrual. No taxes, spreads, transaction costs, or cash drag.</p></details><button class="text-button field" id="etf-guide">Ask your guide about this mix →</button></section></div>
<section class="panel fee-section"><div class="section-heading"><div><span class="eyebrow">03 / LET TIME REVEAL THE COST</span><h2>Compare fees over time</h2></div><p>Compare two expense ratios using the same invented gross return and contribution timing.</p></div><div class="fee-inputs"><div><label for="fee-years">Years (1–50)</label><input id="fee-years" type="number" value="20" min="1" max="50" step="1"></div><div><label for="fee-return">Hypothetical annual return (%)</label><input id="fee-return" type="number" value="5" min="-90" max="30" step="0.5"></div><div><label for="fee-low">Fund A expense ratio (%)</label><input id="fee-low" type="number" value="0.04" min="0" max="5" step="0.01"></div><div><label for="fee-high">Fund B expense ratio (%)</label><input id="fee-high" type="number" value="0.85" min="0" max="5" step="0.01"></div></div><div class="field"><label for="fee-contribution">Annual contribution, at year end ($)</label><input id="fee-contribution" type="number" value="0" min="0" max="1000000" step="100"></div><div id="fee-results" aria-live="polite"></div><details><summary>How the math works</summary><p>Starting balance: $10,000. Each year: grow the opening balance by the chosen gross return, deduct the expense ratio from that grown balance, then add the contribution at year end. Contributions receive no growth or fees until the next year. Net balance = opening balance × (1 + r) × (1 − f) + contribution. The same return repeats each year solely for illustration.</p><p>Cumulative fees are the sum of annual deductions. Hypothetical opportunity cost = no-fee ending balance − net balance − cumulative fees. In negative-return scenarios it can be negative: fees would otherwise have remained exposed to losses. No inflation, taxes, transaction costs, spread, withdrawals, or real market path.</p></details><div class="field">${sourceLinks(["fees", "diversification"])}</div><a href="#lesson/fees" class="text-button">Put your understanding to the test →</a></section>`,
  );
  function sync(i, value) {
    state.allocations[i] = value;
    draft.set("allocation", state.allocations);
    $$(`[data-index="${i}"]`).forEach((el) => {
      if (el !== document.activeElement) el.value = value;
    });
    drawAllocation();
  }
  $$(".allocation-number,.allocation-range").forEach(
    (el) =>
      (el.oninput = () =>
        sync(
          Number(el.dataset.index),
          el.value === "" ? NaN : Number(el.value),
        )),
  );
  on("#allocation-reset", "click", () => {
    state.allocations = [45, 25, 20, 10];
    draft.set("allocation", state.allocations);
    etf();
  });
  const allocationTools = document.createElement("div");
  allocationTools.className = "allocation-tools";
  allocationTools.innerHTML =
    '<p class="note">Quick experiments, not recommended portfolios.</p><div class="button-row"><button class="button secondary small" id="allocation-equal">Try equal weights</button><button class="button secondary small" id="allocation-balance">Adjust bonds to total 100%</button></div><p class="note" id="allocation-help" role="status"></p>';
  $("#allocation-total").after(allocationTools);
  $("#allocation-equal").onclick = () => {
    state.allocations = [25, 25, 25, 25];
    draft.set("allocation", state.allocations);
    $$(".allocation-number,.allocation-range").forEach((el) => (el.value = 25));
    drawAllocation();
    $("#allocation-help").textContent =
      "Each fictional fund now holds 25% of the example portfolio.";
  };
  $("#allocation-balance").onclick = () => {
    const other = state.allocations.filter((v, i) => i !== 1);
    const total = other.reduce((a, b) => a + b, 0);
    if (
      other.some((v) => !Number.isFinite(v) || v < 0 || v > 100) ||
      total > 100
    ) {
      $("#allocation-help").textContent =
        "Reduce or correct the other three allocations first; together they must not exceed 100%.";
      return;
    }
    const remainder = Number((100 - total).toFixed(8));
    sync(1, remainder);
    $("#allocation-help").textContent =
      `Bonds now hold ${remainder}%. The complete mix totals 100%.`;
  };
  on("#scenario", "change", (e) => {
    state.scenario = e.target.value;
    drawAllocation();
  });
  on("#snapshot-save", "click", () => {
    try {
      const r = Finance.allocation(state.allocations, state.scenario);
      state.snapshots = [
        {
          values: [...state.allocations],
          scenario: state.scenario,
          fee: r.fee,
          balance: r.balance,
        },
        ...state.snapshots,
      ].slice(0, 3);
      draft.set("snapshots", state.snapshots);
      drawSnapshots();
      toast("Experiment saved in this browser.");
    } catch (e) {
      toast(e.message);
    }
  });
  on("#etf-guide", "click", () =>
    openGuide(
      "Explain the concentration and costs in my current fictional portfolio.",
      true,
    ),
  );
  const feeInputs = $$(
    "#fee-years,#fee-return,#fee-low,#fee-high,#fee-contribution",
  );
  const savedFees = draft.get("fee-assumptions", {});
  feeInputs.forEach((el) => {
    if (typeof savedFees[el.id] === "string") el.value = savedFees[el.id];
    el.oninput = () => {
      draft.set(
        "fee-assumptions",
        Object.fromEntries(feeInputs.map((input) => [input.id, input.value])),
      );
      drawFees();
    };
  });
  drawAllocation();
  drawFees();
  drawSnapshots();
}
function drawSnapshots() {
  const el = $("#snapshots");
  el.innerHTML = state.snapshots.length
    ? `<section class="experiment-comparison"><h3>Compare saved experiments</h3><p class="note">The mix column lists broad-market / bonds / international / technology percentages. Compare outcomes under the same scenario; different shocks cannot rank the mixes.</p><div class="table-wrap"><table><caption>Saved in this browser · fictional $10,000 starting balance</caption><thead><tr><th>Experiment</th><th>Mix (%)</th><th>Scenario</th><th>Annual expense at $10,000</th><th>Hypothetical ending balance</th><th>Restore</th></tr></thead><tbody>${state.snapshots.map((s, i) => `<tr><td>Saved mix ${i + 1}</td><td>${s.values.map(esc).join(" / ")}</td><td>${esc(Finance.scenarios[s.scenario]?.label)}</td><td>${money((10000 * s.fee) / 100)} (${Number(s.fee).toFixed(3)}%)</td><td>${money(s.balance)}</td><td><button class="text-button" data-load="${i}" aria-label="Restore saved mix ${i + 1}">Restore</button></td></tr>`).join("")}</tbody></table></div></section>`
    : '<p class="note">Save up to three valid mixes to compare their costs and scenario outcomes here.</p>';
  $$("[data-load]", el).forEach(
    (btn) =>
      (btn.onclick = () => {
        const s = state.snapshots[Number(btn.dataset.load)];
        state.allocations = [...s.values];
        state.scenario = s.scenario;
        draft.set("allocation", state.allocations);
        etf();
      }),
  );
}
function drawAllocation() {
  const total = state.allocations.reduce((a, b) => a + b, 0),
    el = $("#allocation-total");
  el.classList.toggle("invalid", total !== 100);
  el.innerHTML = `<span>Total allocation</span><span>${Number.isFinite(total) ? total : "—"}% / 100%</span>`;
  try {
    const r = Finance.allocation(state.allocations, state.scenario);
    $("#allocation-result").innerHTML =
      `<div class="allocation-bars" role="img" aria-label="${esc(Finance.funds.map((f, i) => f.name + " " + state.allocations[i] + "%").join(", "))}">${state.allocations.map((v, i) => `<span class="bar-${Finance.funds[i].id}" style="width:${v}%"></span>`).join("")}</div><div class="bar-legend">${Finance.funds.map((f, i) => `<span><span class="swatch ${f.id}"></span>${f.type} ${state.allocations[i]}%</span>`).join("")}</div><div class="result-stats field"><div><div class="data-value">${r.fee.toFixed(3)}%</div><div class="data-label">Weighted annual expense ratio</div></div><div><div class="data-value">${money(r.annualExpense)}</div><div class="data-label">Annual cost at a constant $10,000</div></div></div><div class="callout">${r.stock}% stock exposure. ${r.concentration >= 70 ? "One fund holds at least 70% of this mix. Examine concentration." : "The mix spreads exposure, but can still lose value."} Broad-market and sector funds may overlap.</div>`;
    $("#scenario-result").innerHTML =
      `<span class="eyebrow">HYPOTHETICAL YEAR-END BALANCE</span><div class="data-value">${money(r.balance)}</div><p class="note">Gross scenario return: ${pct(r.grossReturn)} · Simplified expense deduction: ${money(r.scenarioFee)}. ${r.balance < 10000 ? "This example loses value despite multiple exposures." : "This invented outcome is not an expected return."}</p>`;
  } catch (e) {
    $("#allocation-result").innerHTML =
      `<div class="callout error">${esc(e.message)} Adjust the mix to see valid results.</div>`;
    $("#scenario-result").innerHTML = "";
  }
}
function drawFees() {
  const target = $("#fee-results");
  try {
    const get = (id) => {
      const el = $(id);
      if (el.value.trim() === "") throw new Error("Enter all assumptions.");
      return Number(el.value);
    };
    const args = {
        years: get("#fee-years"),
        rate: get("#fee-return"),
        contribution: get("#fee-contribution"),
      },
      a = Finance.project({ ...args, fee: get("#fee-low") }),
      b = Finance.project({ ...args, fee: get("#fee-high") });
    const max =
      Math.max(
        a.noFee,
        ...a.rows.map((r) => r.balance),
        ...b.rows.map((r) => r.balance),
        10000,
      ) * 1.1;
    const plot = (rows) =>
      rows
        .map(
          (r, i) =>
            (i ? "L" : "M") +
            (65 + (r.year / args.years) * 620).toFixed(1) +
            "," +
            (240 - (r.balance / max) * 200).toFixed(1),
        )
        .join(" ");
    target.innerHTML = `<div class="result-stats field"><div><span class="eyebrow">FUND A / FOREST LINE</span><div class="data-value">${money(a.balance)}</div><p class="note">Ending balance · ${money(a.paid)} cumulative expenses</p></div><div><span class="eyebrow">FUND B / GOLD LINE</span><div class="data-value">${money(b.balance)}</div><p class="note">Ending balance · ${money(b.paid)} cumulative expenses</p></div></div><svg class="chart" viewBox="0 0 720 280" role="img" aria-labelledby="fee-chart-title"><title id="fee-chart-title">Hypothetical balances over ${args.years} years. A ends at ${money(a.balance)}, B at ${money(b.balance)}. Full data in table below.</title>${[0, 0.5, 1].map((v) => `<line class="grid" x1="65" y1="${240 - v * 200}" x2="685" y2="${240 - v * 200}"/><text x="0" y="${244 - v * 200}">${money(max * v)}</text>`).join("")}<path class="line-low" d="${plot(a.rows)}"/><path class="line-high" d="${plot(b.rows)}"/><text x="65" y="265">Year 0</text><text x="620" y="265">Year ${args.years}</text></svg><p class="note">Ending balance difference (A − B): <strong>${money(a.balance - b.balance)}</strong>. For A: ${money(a.paid)} fees paid + ${money(a.opportunityCost)} hypothetical foregone growth = ${money(a.noFee - a.balance)} total difference versus no fee. For B: ${money(b.paid)} + ${money(b.opportunityCost)} = ${money(b.noFee - b.balance)}.</p><details><summary>Accessible year-by-year data</summary><div class="table-wrap"><table><caption>Hypothetical balances and cumulative expenses, rounded for display</caption><thead><tr><th>Year</th><th>A balance</th><th>B balance</th><th>A expenses</th><th>B expenses</th><th>No-fee balance</th></tr></thead><tbody>${a.rows.map((r, i) => `<tr><td>${r.year}</td><td>${money(r.balance)}</td><td>${money(b.rows[i].balance)}</td><td>${money(r.paid)}</td><td>${money(b.rows[i].paid)}</td><td>${money(r.noFee)}</td></tr>`).join("")}</tbody></table></div></details>`;
  } catch (e) {
    feedback(target, e.message, "error");
  }
}
function tokens() {
  return renderTokens();
}
function vault(topicId) {
  page(
    "Financial concepts, explained.",
    "SAFETY VAULT",
    "Understand the terms, examine a fictional example, and find specific questions to ask before making a decision.",
    `<div class="field"><label for="vault-search">Find a concept</label><input type="search" id="vault-search" placeholder="Try fees, custody, or verification…"></div><div class="vault-grid" id="glossary"></div><section class="panel field"><span class="eyebrow">MESSAGE REVIEW</span><h2>Review a message</h2><p class="note">Best-effort redaction can miss sensitive information. Use a fictional example where possible. We never open links in your message or save raw messages to local progress notes.</p><form id="redact-form"><label for="raw-message">Original message (not sent at this step)</label><textarea id="raw-message" rows="4" maxlength="2000" required placeholder="Paste a fictional message here…"></textarea><button class="button secondary field" type="submit">Prepare a redacted preview →</button></form><form id="message-form" hidden><label for="review-message">Review and edit before sending</label><textarea id="review-message" rows="5" maxlength="2000" required></textarea><p class="note">If configured, Gemini (Google) receives only this reviewed text. No provider call occurs in Demo mode. Redaction is not a privacy guarantee.</p><label class="check-inline"><input type="checkbox" id="reviewed" required><span>I removed private details and want to submit this reviewed text.</span></label><button type="submit" class="button field">Analyze reviewed message ↗</button></form><div id="message-result" aria-live="polite"></div></section><section class="panel field"><h2>Educational sources</h2><div class="source-links">Reference pages used for the Vault. Each topic links its supporting reading.${Object.values(
      Vault.sources,
    )
      .map(
        (s) =>
          `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)} ↗</a>`,
      )
      .join("")}</div></section>`,
  );
  const filters = document.createElement("div");
  filters.className = "vault-filters";
  filters.innerHTML = `<div><label for="vault-category">Browse by topic</label><select id="vault-category">${Vault.categories.map((c) => `<option value="${c.id}">${esc(c.title)}</option>`).join("")}</select></div><p id="vault-count" role="status" aria-live="polite"></p><button class="text-button" id="vault-clear" type="button">Clear filters</button>`;
  $("#glossary").before(filters);
  $("#glossary").className = "vault-index";
  $("#glossary").setAttribute("aria-label", "Financial reference topics");
  const savedFilters = state.vaultFilters || { query: "", category: "all" };
  $("#vault-search").value = topicId ? "" : savedFilters.query;
  $("#vault-category").value = topicId ? "all" : savedFilters.category;
  function draw() {
    const query = $("#vault-search").value,
      category = $("#vault-category").value;
    state.vaultFilters = { query, category };
    const rows = Vault.search(query, category);
    $("#vault-count").textContent =
      `${rows.length} ${rows.length === 1 ? "topic" : "topics"}${query.trim() ? " matching “" + query.trim() + "”" : ""}`;
    $("#glossary").innerHTML = rows.length
      ? rows
          .map((t) => {
            const group = Vault.categories.find((c) => c.id === t.category);
            return `<details class="vault-term" id="vault-topic-${t.id}"><summary><span class="vault-topic-category">${esc(group.title)}</span><h2>${esc(t.title)}</h2><p>${esc(t.meaning)}</p><span class="vault-expand">Read checks and examples</span></summary><div class="vault-detail"><dl><div><dt>What it means</dt><dd>${esc(t.meaning)}</dd></div><div><dt>Why it matters</dt><dd>${esc(t.why)}</dd></div><div><dt>Fictional example</dt><dd>${esc(t.example)}</dd></div><div><dt>What to check</dt><dd><ul>${t.checks.map((c) => `<li>${esc(c)}</li>`).join("")}</ul></dd></div><div><dt>Common misconception</dt><dd>${esc(t.misconception)}</dd></div></dl><div class="vault-references"><h3>Supporting reading</h3>${t.sources.map((id) => `<a href="${esc(Vault.sources[id].url)}" target="_blank" rel="noopener noreferrer">${esc(Vault.sources[id].title)} ↗</a>`).join("")}</div><div class="vault-related"><h3>Related concepts</h3>${t.related.map((id) => `<a href="#vault/${id}">${esc(Vault.topics.find((t) => t.id === id).title)}</a>`).join("")}</div><div class="vault-practice"><h3>Put it into practice</h3>${t.cases
              .map((id) => {
                const c = CASES.find((c) => c.id === id),
                  i = CASES.indexOf(c),
                  locked =
                    i > 0 && (state.user.done[CASES[i - 1].id] || 0) < 50;
                return `<a href="${locked ? "#investigations" : "#case/" + id}">Case ${id}: ${esc(c.title)}${locked ? " · View unlock requirements" : ""}</a>`;
              })
              .join(
                "",
              )}${t.lab ? `<a href="#${t.lab}">${t.lab === "etf" ? "Compare funds and fees" : "Try the ownership ledger"} →</a>` : ""}</div><a class="text-button" href="#vault/${t.id}">Link to this topic</a></div></details>`;
          })
          .join("")
      : `<div class="vault-empty"><h2>No topics match these filters.</h2><p>Try one word such as “fees,” “phishing,” or “keys,” or select a different category. Search includes definitions, examples, and verification checks.</p><button class="button secondary" id="vault-empty-clear">Show all topics</button></div>`;
    on("#vault-empty-clear", "click", clear);
  }
  function clear() {
    $("#vault-search").value = "";
    $("#vault-category").value = "all";
    draw();
    $("#vault-search").focus();
  }
  draw();
  on("#vault-search", "input", draw);
  on("#vault-category", "change", draw);
  on("#vault-clear", "click", clear);
  if (topicId) {
    const selected = Vault.topics.find((t) => t.id === topicId);
    if (selected) {
      const topic = $("#vault-topic-" + selected.id);
      topic.open = true;
    } else
      toast("That topic was not found. Browse or search the reference below.");
  }
  on("#redact-form", "submit", (e) => {
    e.preventDefault();
    $("#review-message").value = $("#raw-message")
      .value.replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, "[email]")
      .replace(/\+?\d[\d\s().-]{8,}\d/g, "[number]")
      .replace(
        /(?:password|seed phrase|private key)\s*[:=]\s*[^\n]+/gi,
        "[credential removed]",
      );
    $("#message-form").hidden = false;
    $("#reviewed").checked = false;
    $("#review-message").focus();
  });
  on("#message-form", "submit", async (e) => {
    e.preventDefault();
    const epoch = viewVersion;
    const btn = $("button[type=submit]", e.currentTarget);
    btn.disabled = true;
    try {
      const d = await api("/api/check-message", {
        text: $("#review-message").value,
        reviewed: $("#reviewed").checked,
      });
      if (epoch !== viewVersion) return;
      $("#message-result").innerHTML =
        `<div class="panel field">${status(d.source, d.source === "live" ? "Live · Gemini" : "Demo · General guidance")}${d.issue ? `<p class="note">${esc(d.issue)}</p>` : ""}<h3 class="field">What the text can tell us</h3><p>${esc(d.summary)}</p><h3>What is still missing</h3><p>${esc(d.missing_info)}</p><h3>How to verify</h3><p>${esc(d.verification_steps)}</p><div class="callout warning">${esc(d.limits)}</div></div>`;
    } catch (e) {
      feedback($("#message-result"), e.message, "error");
    } finally {
      btn.disabled = false;
    }
  });
}
function services() {
  return [
    ["gemini", "Gemini", "Written tutoring and feedback"],
    [
      "capitalOne",
      "Capital One Nessie",
      "Read-only synthetic account activity",
    ],
  ]
    .map(([id, name, description]) => {
      const mode = state.user.provider[id],
        details = state.user.providerDetails?.[id];
      const label =
        mode === "live"
          ? "Last request succeeded"
          : mode === "not-tested"
            ? "Not tested"
            : mode === "demo"
              ? "Authored fallback"
              : "Unavailable";
      return (
        '<div class="service-row"><div class="service-description"><h3>' +
        name +
        "</h3><p>" +
        description +
        '</p><p class="note service-diagnostic" role="status">' +
        esc(
          details?.message || "Use Test connection to get the current result.",
        ) +
        "</p>" +
        (details?.checkedAt
          ? '<p class="note">Last checked: ' +
            esc(new Date(details.checkedAt).toLocaleString()) +
            "</p>"
          : "") +
        '</div><div class="service-controls">' +
        status(mode, label) +
        '<button class="button secondary small" type="button" data-check-provider="' +
        id +
        '">Test connection<span class="sr-only"> for ' +
        name +
        "</span></button></div></div>"
      );
    })
    .join("");
}
function progress() {
  const epoch = viewVersion;
  page(
    "Your local progress",
    "Progress",
    "Practice, revisit, and build your financial confidence.",
    '<div class="metrics"><div class="metric"><strong>' +
      state.user.xp +
      '</strong><span>Total XP</span></div><div class="metric"><strong>' +
      Object.keys(state.user.lessons).length +
      '/6</strong><span>Completed lessons</span></div></div><div class="grid-equal"><section class="panel"><h2>Scores and review notes</h2>' +
      badges() +
      '<div class="table-wrap"><table><caption>Best investigation scores</caption><thead><tr><th>Case</th><th>Best score</th></tr></thead><tbody>' +
      CASES.map(
        (c) =>
          "<tr><td>" +
          esc(c.title) +
          "</td><td>" +
          (state.user.done[c.id] ?? "Not attempted") +
          "</td></tr>",
      ).join("") +
      '</tbody></table></div><h3 class="field">Topics to revisit</h3><ul>' +
      (state.user.review.length
        ? state.user.review.map((r) => "<li>" + esc(r) + "</li>").join("")
        : "<li>No review notes yet.</li>") +
      '</ul></section><section class="panel"><h2>Saved in this browser</h2><p>Your lessons, scores, review notes, preferences, and drafts are saved in this browser on this site. There is no account or cross-device sync. Clearing browser storage removes them. Existing progress from this browser can be imported from the previous local prototype.</p><p class="note">The server holds a temporary session to check answers. It does not write new progress files. This editable local prototype is not a competitive leaderboard.</p><form id="preferences-form"><label for="explanation-depth">Explanation depth</label><select id="explanation-depth"><option value="beginner">Start with the basics</option><option value="detail">Give me more detail</option></select><button class="button secondary field" type="submit">Save preferences</button></form><div id="preferences-result" class="feedback" aria-live="polite"></div><button id="review-clear" class="text-button field" type="button">Clear review notes (keep scores)</button></section></div><section class="panel field"><h2>Integration status</h2><div id="services">' +
      services() +
      '</div><p class="note">A key alone never means connected. Status reflects requests made during the current server session. Local examples do not test Capital One.</p><a class="text-button" href="#money">Open Money Practice</a></section>',
  );
  on("#services", "click", async (event) => {
    const button = event.target.closest("[data-check-provider]");
    if (!button) return;
    const id = button.dataset.checkProvider;
    const container = $("#services");
    container.setAttribute("aria-busy", "true");
    $$("[data-check-provider]", container).forEach((b) => (b.disabled = true));
    button.textContent = "Testing...";
    try {
      await api("/api/integrations/check", { provider: id });
      if (epoch === viewVersion) container.innerHTML = services();
    } catch (error) {
      if (epoch === viewVersion) {
        container.innerHTML = services();
        toast(error.message);
      }
    } finally {
      container.removeAttribute("aria-busy");
      if (epoch === viewVersion)
        $('[data-check-provider="' + id + '"]', container)?.focus({
          preventScroll: true,
        });
    }
  });
  $("#explanation-depth").value = state.user.preferences.depth;
  on("#preferences-form", "submit", async (e) => {
    e.preventDefault();
    const btn = $("button", e.currentTarget);
    btn.disabled = true;
    try {
      await api("/api/preferences", { depth: $("#explanation-depth").value });
      if (epoch === viewVersion)
        feedback(
          $("#preferences-result"),
          "Preferences saved in this browser.",
        );
    } catch (error) {
      if (epoch === viewVersion)
        feedback($("#preferences-result"), error.message, "error");
    } finally {
      btn.disabled = false;
    }
  });
  on("#review-clear", "click", async () => {
    try {
      await api("/api/progress/review", undefined, "DELETE");
      if (epoch === viewVersion) progress();
    } catch (error) {
      if (epoch === viewVersion)
        feedback($("#preferences-result"), error.message, "error");
    }
  });
}
function notFound() {
  page(
    "This page drifted out of view.",
    "PAGE NOT FOUND",
    "Return to your learning harbor.",
    '<a href="#home" class="button">Back home →</a>',
  );
}
function openGuide(question = "", submit = false) {
  const dialog = $("#guide-panel");
  $("#guide-topic").value = state.topic;
  $("#guide-open").setAttribute("aria-expanded", "true");
  if (!dialog.open) dialog.showModal();
  if (question) $("#guide-question").value = question;
  $("#guide-question").focus();
  if (submit) $("#guide-form").requestSubmit();
}
$("#guide-topic").innerHTML = Content.lessons
  .map((l) => `<option value="${l.id}">${esc(l.topic)}</option>`)
  .join("");
$("#guide-open").onclick = () => openGuide();
$("#guide-close").onclick = () => $("#guide-panel").close();
$("#guide-panel").addEventListener("close", () =>
  $("#guide-open").setAttribute("aria-expanded", "false"),
);
$("#guide-form").onsubmit = async (e) => {
  e.preventDefault();
  const request = ++guideRequestVersion;
  pendingGuide = true;
  $("#practice-button").disabled = true;
  const btn = $("button", e.currentTarget),
    target = $("#guide-answer");
  btn.disabled = true;
  target.textContent = "Finding a clearer explanation…";
  const body = {
    text: $("#guide-question").value,
    topic: $("#guide-topic").value,
  };
  if (state.route === "etf") {
    body.allocations = state.allocations;
    body.scenario = state.scenario;
  }
  try {
    const d = await api(
      state.route === "money" ? "/api/money/explain" : "/api/tutor",
      state.route === "money"
        ? { text: body.text, loadedAt: state.moneyData?.loadedAt }
        : body,
    );
    d.sources ||= [];
    d.memorySource ||= "Displayed fictional account totals";
    if (request !== guideRequestVersion) return;
    target.innerHTML = `${status(d.source, d.source === "live" ? "Live · Gemini" : "Demo · Authored explanation")}<p>${esc(d.answer)}</p><div class="callout">${esc(d.nextStep)}</div><p class="note">Learning context: ${esc(d.memorySource)}. ${d.source === "demo" ? "This is topic guidance, not a generated answer to your exact question." : ""}</p>${d.issue ? `<p class="note">${esc(d.issue)}</p>` : ""}${sourceLinks(d.sources.map((s) => s.id))}`;
  } catch (e) {
    if (request === guideRequestVersion) feedback(target, e.message, "error");
  } finally {
    if (request === guideRequestVersion) {
      pendingGuide = false;
      btn.disabled = false;
      $("#practice-button").disabled = false;
    }
  }
};
$("#practice-button").onclick = async () => {
  const request = ++guideRequestVersion;
  pendingGuide = true;
  $("#guide-form button").disabled = true;
  const btn = $("#practice-button"),
    target = $("#practice-result");
  btn.disabled = true;
  target.textContent = "Preparing a question…";
  try {
    const d = await api("/api/practice", { topic: $("#guide-topic").value });
    if (request !== guideRequestVersion) return;
    target.innerHTML = `${status(d.source)}${d.issue ? `<p class="note">${esc(d.issue)}</p>` : ""}<p class="field">${esc(d.question)}</p><div class="practice-options"><button data-answer="A">${esc(d.optionA)}</button><button data-answer="B">${esc(d.optionB)}</button></div><p class="note" id="practice-feedback"></p>`;
    $$("[data-answer]", target).forEach(
      (b) =>
        (b.onclick = () => {
          $$("[data-answer]", target).forEach((x) =>
            x.classList.toggle("selected", x === b),
          );
          $("#practice-feedback").textContent =
            (b.dataset.answer === d.correct
              ? "That’s right. "
              : "Try a different perspective. ") + d.explanation;
        }),
    );
  } catch (e) {
    if (request === guideRequestVersion) target.textContent = e.message;
  } finally {
    if (request === guideRequestVersion) {
      pendingGuide = false;
      btn.disabled = false;
      $("#guide-form button").disabled = false;
    }
  }
};
function saveView() {
  if (!activeHash) return;
  const [name, id] = activeHash.slice(1).split("/");
  if (["learn", "investigations", "progress"].includes(name)) {
    controlCache.set(
      activeHash,
      $$("input,select,textarea", main)
        .filter((el) => el.id)
        .map((el) => ({ id: el.id, value: el.value, checked: el.checked })),
    );
    return;
  }
  const valid =
    (name === "lesson" && Content.lessons.some((l) => l.id === id)) ||
    (name === "case" && CASES.some((c) => c.id === id)) ||
    (name === "vault" && (!id || Vault.topics.some((t) => t.id === id))) ||
    (["home", "etf", "tokens"].includes(name) && !id);
  if (!valid) return;
  viewCache.set(activeHash, {
    nodes: [...main.childNodes],
    scroll: window.scrollY,
    topic: state.topic,
  });
  while (viewCache.size > 40) {
    const oldest = viewCache.keys().next().value;
    viewCache.delete(oldest);
  }
}
function updateNavigation(name) {
  const section =
    name === "lesson" ? "learn" : name === "case" ? "investigations" : name;
  $$(".site-header nav a").forEach((a) => {
    const selected = a.hash === "#" + section;
    a.classList.toggle("active", selected);
    if (selected) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
}
let transitionAnimations = [],
  transitionGhost = null,
  transitionTimer = null;
const tabOrder = [
  "home",
  "learn",
  "investigations",
  "etf",
  "money",
  "tokens",
  "vault",
  "progress",
];
const sectionOf = (name) =>
  name === "lesson" ? "learn" : name === "case" ? "investigations" : name;
function finishTransition() {
  clearTimeout(transitionTimer);
  transitionAnimations.forEach((animation) => animation.cancel());
  transitionAnimations = [];
  transitionGhost?.remove();
  transitionGhost = null;
  main.style.removeProperty("height");
}
function snapshotView() {
  const wrapper = main.firstElementChild;
  if (
    !wrapper ||
    !main.animate ||
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  )
    return null;
  const ghost = document.createElement("div");
  ghost.className = "view-outgoing";
  ghost.inert = true;
  ghost.setAttribute("inert", "");
  ghost.setAttribute("aria-hidden", "true");
  ghost.appendChild(wrapper.cloneNode(true));
  ghost.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
  ghost
    .querySelectorAll("input,button,select,textarea")
    .forEach((el) => (el.disabled = true));
  ghost.querySelectorAll("a,[tabindex]").forEach((el) => (el.tabIndex = -1));
  return ghost;
}
function animateView(ghost, oldHeight, direction) {
  if (!ghost) return;
  const incoming = main.firstElementChild,
    newHeight = main.getBoundingClientRect().height;
  transitionGhost = ghost;
  main.appendChild(ghost);
  const options = {
    duration: 230,
    easing: "cubic-bezier(.22,.61,.36,1)",
    fill: "both",
  };
  transitionAnimations = [
    incoming.animate(
      [
        { transform: "translateX(" + direction * 24 + "px)", opacity: 0 },
        { transform: "translateX(0)", opacity: 1 },
      ],
      options,
    ),
    ghost.animate(
      [
        { transform: "translateX(0)", opacity: 1 },
        { transform: "translateX(" + -direction * 18 + "px)", opacity: 0 },
      ],
      options,
    ),
  ];
  if (oldHeight && newHeight) {
    main.style.height = newHeight + "px";
    transitionAnimations.push(
      main.animate(
        [{ height: oldHeight + "px" }, { height: newHeight + "px" }],
        options,
      ),
    );
  }
  // Timeout also covers engines without Animation.finished; a newer navigation cancels it.
  transitionTimer = setTimeout(finishTransition, 240);
}
async function route() {
  closeNavigation();
  finishTransition();
  const oldSection = sectionOf(state.route),
    oldHeight = main.getBoundingClientRect().height;
  const ghost = activeHash ? snapshotView() : null;
  const epoch = ++viewVersion;
  const [name = "home", id] = location.hash.slice(1).split("/");
  updateNavigation(name);
  saveView();
  if (pendingGuide) {
    guideRequestVersion++;
    pendingGuide = false;
    $("#guide-answer").textContent =
      "Section changed. Your question is still here; ask again to use the current learning context.";
    $("#guide-form button").disabled = false;
    $("#practice-button").disabled = false;
  }
  state.route = name || "home";
  activeHash = location.hash || "#home";
  const cached = viewCache.get(activeHash);
  if (cached) {
    main.replaceChildren(...cached.nodes);
    state.topic = cached.topic;
  } else {
    const render =
      {
        home,
        learn,
        investigations,
        etf,
        money: renderMoney,
        tokens,
        vault: () => vault(id),
        progress,
        lesson: () => lesson(id),
        case: () => investigation(id),
      }[state.route] || notFound;
    const result = render();
    // A locked lesson/case redirects. Do not cache the previous screen under its URL.
    if ((location.hash || "#home") !== activeHash) {
      activeHash = "";
      return;
    }
    if (result?.catch)
      result.catch((error) => {
        if (epoch === viewVersion) toast(error.message);
      });
    for (const field of controlCache.get(activeHash) || []) {
      const el = document.getElementById(field.id);
      if (el && main.contains(el)) {
        el.value = field.value;
        if (el.type === "checkbox" || el.type === "radio")
          el.checked = field.checked;
      }
    }
  }
  main.dataset.view = activeHash;
  animateView(
    ghost,
    oldHeight,
    tabOrder.indexOf(sectionOf(state.route)) < tabOrder.indexOf(oldSection)
      ? -1
      : 1,
  );
  normalizeLabels(main);
  window.scrollTo({ top: cached?.scroll || 0, behavior: "instant" });
  main.focus({ preventScroll: true });
  if (name === "vault" && id) {
    const selected = Vault.topics.find((t) => t.id === id);
    if (selected) {
      const summary = $("#vault-topic-" + selected.id + " summary");
      summary.focus({ preventScroll: true });
      summary.scrollIntoView?.({ block: "start" });
    }
  }
  document.title =
    (state.route === "home"
      ? "A safer financial future"
      : state.route === "etf"
        ? "ETF Lab"
        : state.route === "tokens"
          ? "Tokenization Lab"
          : state.route.charAt(0).toUpperCase() + state.route.slice(1)) +
    " / Harbor Academy";
}
$$(".site-header nav a").forEach((a) =>
  a.addEventListener("click", () => updateNavigation(a.hash.slice(1))),
);
window
  .matchMedia?.("(prefers-reduced-motion: reduce)")
  .addEventListener?.("change", (event) => {
    if (event.matches) finishTransition();
  });
(async () => {
  try {
    const localProgress = draft.get("progress", null);
    const initialState = await api(
      "/api/state",
      localProgress ? { progress: localProgress } : undefined,
    );
    if (initialState.apiVersion !== 3)
      throw new Error(
        "An older Harbor server is running. Stop it and restart with npm.cmd start from this workspace, then refresh.",
      );
    updateUser(initialState);
    window.addEventListener("hashchange", () =>
      route().catch((e) => toast(e.message)),
    );
    await route();
  } catch (e) {
    main.innerHTML = `<div class="wrap page-top"><h1>Let’s get your harbor running.</h1><p>${esc(e.message)}</p><p>Keep the Node server running and open http://localhost:3000.</p><button id="retry-start" class="button">Try again</button></div>`;
    $("#retry-start").onclick = () => location.reload();
  }
})();
