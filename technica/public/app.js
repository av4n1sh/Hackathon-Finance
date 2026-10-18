"use strict";
(() => {
  const C = window.HarborContent,
    G = window.HarborGame;
  const main = document.querySelector("#main");
  const escape = (value) =>
    String(value).replace(
      /[&<>"']/g,
      (char) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[char],
    );
  const money = (value) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(value / 100);
  const KEY = "harbor-adventure-v1";
  let saved = {
    game: G.initial(),
    started: false,
    learned: [],
    mastered: [],
    completedGoals: [],
  };
  let draft = {},
    receipt = null,
    previousTab = "play";
  const warnStorage = (message) => {
    const el = document.querySelector("#storage-message");
    el.hidden = false;
    el.textContent = message;
  };
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "null");
    if (raw)
      saved = {
        game: G.restore(raw.game),
        started: raw.started === true,
        learned: (Array.isArray(raw.learned) ? raw.learned : []).filter((id) =>
          C.lessons.some((l) => l.id === id),
        ),
        mastered: (Array.isArray(raw.mastered) ? raw.mastered : []).filter(
          (s) => C.steps.some((step) => step.skill === s),
        ),
        completedGoals: (Array.isArray(raw.completedGoals)
          ? raw.completedGoals
          : []
        ).filter((id) => C.goals.some((g) => g.id === id)),
      };
  } catch {
    warnStorage(
      "Saved progress could not be loaded. You can still play. New progress may be lost if browser storage is blocked.",
    );
  }
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(saved));
    } catch {
      warnStorage(
        "This browser cannot save progress. Keep this tab open to continue; refreshing may lose your work.",
      );
    }
    progress();
  }
  function progress() {
    const skills = [
      ...new Set([...saved.mastered, ...G.snapshot(saved.game).badges]),
    ];
    document.querySelector("#progress-content").innerHTML =
      `<h2>Your learning, at your pace</h2><p>${saved.game.answers.length} of 5 story decisions completed<br>${saved.learned.length} of ${C.lessons.length} lesson checks practiced</p>${skills.length ? `<ul>${skills.map((s) => `<li>${escape(s)}</li>`).join("")}</ul>` : "<p>Skill badges appear when you explain a trade-off in the story.</p>"}<p class="small muted">Saved in this browser on this site. No account or streaks.</p><details><summary>Reset local progress</summary><p>This clears this game’s saved learning progress.</p><button class="secondary" data-action="clear">Clear my progress</button></details>`;
  }
  function announce(value) {
    document.querySelector("#announcement").textContent = value;
  }
  async function request(url, body) {
    const response = await fetch(
      url,
      body === undefined
        ? { cache: "no-store" }
        : {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(body),
          },
    );
    const value = await response.json();
    if (!response.ok) throw new Error(value.error || "Please try again.");
    return value;
  }
  const badgeList = (badges) =>
    badges
      .map(
        (b) =>
          `<span class="badge"><span aria-hidden="true">✦</span> ${escape(b)}</span>`,
      )
      .join("");
  function home() {
    const resume = saved.started;
    return `<section class="hero"><div class="hero-copy"><span class="eyebrow">A little practice goes a long way</span><h1>Everyday choices.<br>New possibilities.</h1><p>Practice everyday money choices. Learn as you play.</p><p class="muted">A short adventure, a few real-life decisions, and room to try again. Start wherever you are.</p><div class="actions"><a class="button" href="${resume ? "#play/story" : "#play/setup"}">${resume ? (G.snapshot(saved.game).complete ? "See your adventure" : "Continue your adventure") : "Let’s play"} <span aria-hidden="true">→</span></a><a class="text-button" href="#learn">Explore a money question</a></div><div class="under-hero"><span>No account needed</span><span>3–5 minutes</span><span>Fictional money</span></div></div><img class="hero-image" src="assets/adventure.svg" width="600" height="440" alt="An everyday bag at the end of a winding path, with room to take a different route."></section><section class="story-preview"><div class="section-head"><h2>Your Money Adventure</h2><span class="tag">One week. Your choices.</span></div><div class="preview-grid"><div class="story-card"><span class="story-number" aria-hidden="true">01</span><div><h3>A small goal, a changing week</h3><p>Plan for a useful purchase. Then life happens: a renewal, a changed trip, a hidden fee. What will you do?</p></div></div><aside class="community-teaser"><h3>What should we practice next?</h3><p>Your perspective can help shape a future learning situation.</p><a href="#community">Suggest a money situation <span aria-hidden="true">↗</span></a></aside></div></section>`;
  }
  function setup() {
    return `<section class="setup"><a href="#play" class="text-button">← Back to Play</a><div class="page-intro"><span class="eyebrow">Your Money Adventure · 3–5 minutes</span><h1>A small goal,<br>a changing week.</h1><p>You’ve received money from occasional work. Choose a useful purchase, then navigate five connected decisions across a fictional week.</p></div><form id="start-form"><fieldset style="border:0;padding:0;margin:0"><legend><h2 style="font-size:1.4rem">What will you plan for?</h2></legend><div class="goal-options">${C.goals.map((g, i) => `<label class="goal-option"><input type="radio" name="goal" value="${g.id}" ${i === 0 ? "checked" : ""}><strong>${g.name}</strong><span class="muted">${g.description}</span><span>Goal price: ${money(g.price)}</span></label>`).join("")}</div></fieldset><div class="notice"><strong>Your simulated starting money: $140</strong><p>$60 is already set aside for food, shared household costs, and caregiving. You decide how to use the remaining <strong>$80</strong>. These amounts are invented for practice.</p><p class="small">There’s no single perfect path. Compare costs, access, and what matters to you. Nothing here moves real money.</p></div><p class="hint">${saved.started ? "Starting again replaces the current story. Earned badges and lesson progress stay saved." : "Your story saves in this browser. You can visit Learn and come back anytime."}</p><button type="submit">Start my week <span aria-hidden="true">→</span></button></form></section>`;
  }
  function budget(state) {
    const s = G.snapshot(state);
    const bought = s.complete && state.answers[4].choice !== 2;
    const percentage = bought
      ? 100
      : Math.min(100, Math.round((s.available / s.goal.price) * 100));
    return `<aside class="budget" aria-label="Simulated budget"><div class="budget-main"><h2>Flexible money left</h2><div class="amount">${money(s.available)}</div><p>Simulated US dollars</p></div><div class="budget-breakdown"><hr><dl><div><dt>Started with</dt><dd>$140</dd></div><div><dt>Essentials set aside</dt><dd>$60</dd></div><div><dt>Story spending</dt><dd>${money(s.spent)}</dd></div></dl></div><div class="budget-goal"><hr><p class="goal-name">Your goal: ${s.goal.item}</p><label class="sr-only" for="goal-progress">${bought ? "Purchase goal met" : "Money available toward goal price"}</label><progress id="goal-progress" max="100" value="${percentage}">${percentage}%</progress><p class="goal-price">${bought ? "You found an option that meets the need." : `${money(s.available)} available · ${money(s.goal.price)} durable option`}</p><p>${s.complete ? "Your learning matters more than the amount left." : "Earlier choices change what’s available next."}</p></div></aside>`;
  }
  function ending() {
    const s = G.snapshot(saved.game),
      last = saved.game.answers[4];
    return `<div class="journey-heading"><div><span class="eyebrow">Your Money Adventure</span><h1>You made a plan. And adapted it.</h1></div><span class="tag">Week complete</span></div><div class="journey-layout"><section class="decision"><div class="end-icon" aria-hidden="true">✦</div><h2>A week of possibilities</h2><p>${last.choice === 2 ? `You chose to wait on the ${s.goal.item} and keep a buffer.` : `You found a ${s.goal.item} that meets the practical need.`} You have ${money(s.available)} in flexible money left, with $60 still set aside for essentials.</p><p>Planning, comparing, and checking are skills you can carry into the next decision. There’s no wealth score here.</p><h3>Your route through the week</h3><table class="summary-table"><caption class="sr-only">Decisions and simulated costs</caption><thead><tr><th scope="col">Decision</th><th scope="col">Cost</th></tr></thead><tbody>${saved.game.answers.map((a, i) => `<tr><td>${escape(C.steps[i].choices[a.choice].title)}</td><td>${money(G.cost(saved.game, i, a.choice))}</td></tr>`).join("")}</tbody></table><h3>Skills you demonstrated</h3>${s.badges.length ? badgeList(s.badges) : "<p>You explored a complete story. Replay and revisit the trade-off reflections to earn skill badges.</p>"}<p class="hint">Badges recognize explaining a trade-off, regardless of how much money remains. You can retry any reflection.</p><div class="actions"><a class="button" href="#play/setup">Try another path ↻</a><button class="secondary" data-action="back">Revisit the last decision</button></div><p style="margin-top:22px"><a href="#community">Help shape the next adventure →</a></p></section>${budget(saved.game)}</div>`;
  }
  function story() {
    if (!saved.started) return setup();
    const state = saved.game,
      s = G.snapshot(state);
    if (s.complete) return ending();
    const index = state.answers.length,
      step = C.steps[index],
      pending = state.pending;
    let body;
    if (!pending) {
      body = `<p>${step.text}</p><div class="choices">${step.choices
        .map((c, i) => {
          const affordable = G.cost(state, index, i) <= s.available;
          return `<button class="choice" data-choice="${i}" ${affordable ? "" : "disabled"}><span><strong>${c.title}</strong><small>${c.cost === "goal" ? `${money(s.goal.price)} · ` : ""}${c.note}${affordable ? "" : ` Not available: needs ${money(G.cost(state, index, i))}; you have ${money(s.available)}.`}</small></span><span class="arrow" aria-hidden="true">↗</span></button>`;
        })
        .join("")}</div>`;
    } else {
      const c = step.choices[pending.choice],
        r = step.reflection;
      body = `<p class="muted">You chose: <strong>${c.title}</strong></p><div class="feedback"><h3>Here’s what changed</h3><p>${c.effect}</p><p><strong>${money(G.cost(state, index, pending.choice))} spent · ${money(s.available)} flexible money left.</strong></p></div><div class="reflection"><fieldset><legend>${r.question}</legend>${r.options.map((o, i) => `<button data-reason="${i}" aria-pressed="${pending.reason === i}">${o}</button>`).join("")}</fieldset>${pending.reason !== null ? `<div class="reflection-result" role="status"><p>${r.feedback}</p>${pending.reason === r.correct ? `<span class="badge">✦ ${step.skill} earned</span>` : '<p class="small">Take another look. You can change your reflection or continue learning; no money is taken away.</p>'}</div>` : '<p class="hint">Name the trade-off before moving on. You can try again.</p>'}</div><div class="actions" style="margin-top:18px"><button data-action="next" ${pending.reason === null ? "disabled" : ""}>${index === 4 ? "See my week" : "Next day"} →</button><button class="secondary" data-action="retry">Try the other choice</button></div>`;
    }
    return `<div class="journey-heading"><div><span class="eyebrow">Your Money Adventure</span><h1>A small goal, a changing week</h1></div><span class="tag">Fictional funds</span></div><div class="journey-layout"><section class="decision"><div class="chapter-label"><span>${step.scene}</span><span>${index + 1} of 5</span></div><ol class="story-route" aria-label="Story progress">${C.steps.map((st, i) => `<li class="${i < index ? "done" : i === index ? "current" : ""}" ${i === index ? 'aria-current="step"' : ""}><span class="sr-only">${st.scene}: ${i < index ? "completed" : i === index ? "current" : "upcoming"}</span></li>`).join("")}</ol><h2>${step.title}</h2>${body}<div class="actions" style="margin-top:22px"><a class="text-button" href="#learn/${step.lesson}">Help me think this through ↗</a>${index ? '<button class="text-button" data-action="back">← Previous day</button>' : ""}</div></section>${budget(state)}</div>`;
  }
  function learn(id) {
    const lesson = C.lessons.find((l) => l.id === id);
    if (!lesson)
      return `<section class="page-intro"><span class="eyebrow">A helpful companion</span><h1>A question is a<br>good place to start.</h1><p>Short explanations for everyday choices. Explore on your own, or drop in during your adventure.</p>${saved.started ? '<a class="button secondary" href="#play/story">Return to my adventure →</a>' : ""}</section><div class="lesson-list">${C.lessons.map((l) => `<a class="lesson-row" href="#learn/${l.id}"><span class="number">${l.icon}</span><div><h2>${l.title}</h2><p>${l.intro.split(". ")[0]}.</p></div><span aria-hidden="true">${saved.learned.includes(l.id) ? "✓" : "↗"}</span></a>`).join("")}</div>`;
    const source = C.sources[lesson.source];
    return `<article class="lesson"><a class="text-button" href="#learn">← All money questions</a><span class="eyebrow" style="margin-top:24px">Learn · At your pace</span><h1>${lesson.title}</h1><p>${lesson.intro}</p><section class="example"><h2>A real-life example, with fictional amounts</h2><p>${lesson.example}</p></section><details class="optional"><summary>A little more detail</summary><p>${lesson.detail}</p></details><section class="practice"><h2>Try it in this situation</h2><p>${lesson.question}</p><div class="choices">${lesson.choices.map((choice, i) => `<button class="choice" data-lesson="${lesson.id}" data-answer="${i}">${choice}<span aria-hidden="true">↗</span></button>`).join("")}</div><div id="lesson-feedback" role="status"></div></section><p class="source">Supporting source: <a href="${source.url}" target="_blank" rel="noreferrer">${source.title} ↗</a><br>Checked October 17, 2026. Examples and practice questions are authored for Harbor.</p><div class="notice"><strong>Practice this in the story</strong><p>Day ${lesson.step + 1}: ${C.steps[lesson.step].title}.</p><a href="${saved.started ? "#play/story" : "#play/setup"}">${saved.started ? "Return to your saved decision" : "Start Your Money Adventure"} →</a></div><section style="margin-top:28px"><h2 style="font-size:1.25rem">Want a simpler explanation?</h2><p class="small muted">Optional AI rephrases this lesson. The game works without it. Only lesson content and fictional story context are sent; community suggestions are never sent.</p><button class="secondary" data-explain="${lesson.id}">Explain more simply</button><div class="ai-result" aria-live="polite"></div></section></article>`;
  }
  function community() {
    return `<section class="page-intro"><span class="eyebrow">Built with room for your perspective</span><h1>What should we<br>practice next?</h1><p>An everyday money decision can look different for each of us. Help shape a future learning situation.</p></section><div class="community-layout"><section id="contribute"><h2 style="font-size:1.5rem">Suggest a money situation</h2>${
      receipt
        ? receiptHTML()
        : `<form class="contribution-form" id="contribution-form"><p class="hint" id="privacy-note">Leave out names, account details, contact information, and private financial information. You do not need to tell us your identity, income, or background.</p>${[
            ["situation", "What everyday money decision should we cover?"],
            ["difficulty", "What makes it difficult?"],
            ["understanding", "What would you want someone to understand?"],
            [
              "suggestion",
              "Optional: an explanation, language improvement, or accessibility concern",
            ],
          ]
            .map(
              ([name, label]) =>
                `<div class="field"><label for="${name}">${label}</label><textarea id="${name}" name="${name}" maxlength="1200" rows="3" ${name !== "suggestion" ? "required" : ""} aria-describedby="privacy-note">${escape(draft[name] || "")}</textarea></div>`,
            )
            .join(
              "",
            )}<div class="field"><label for="credit">Optional public credit</label><p class="hint">Use a nickname or leave blank for “Anonymous contributor.” Avoid a real name or contact details.</p><input id="credit" name="credit" maxlength="60" value="${escape(draft.credit || "")}" autocomplete="off"></div><label class="check"><input type="checkbox" name="adaptPermission" required ${draft.adaptPermission ? "checked" : ""}><span>I give Harbor Academy permission to store, review, and adapt this suggestion into learning content. <strong>Required to submit.</strong></span></label><label class="check"><input type="checkbox" name="publishPermission" ${draft.publishPermission ? "checked" : ""}><span>I also give permission to publish a reviewed adaptation and my chosen credit. Optional; leave unchecked to keep it private.</span></label><p class="hint">Your original suggestion stays private. Reviewers may edit for clarity, privacy, accessibility, and accuracy. Publication is never automatic. You can remove your contribution using your receipt.</p><button type="submit">Send for review <span aria-hidden="true">→</span></button><div class="form-status" role="status"></div></form>`
    }</section><aside class="community-sidebar"><section><h2>Your suggestion has a path</h2><ol class="workflow"><li><strong>Submit</strong>Stored privately on this project’s server.</li><li><strong>Review</strong>A reviewer checks privacy and suitability.</li><li><strong>Shape together</strong>Reviewers edit an explanation and record what it improves.</li><li><strong>Publish with permission</strong>Only reviewed adaptations with your permission appear here.</li></ol></section><section class="notice"><h2>Everyday experience matters</h2><p>Cash payments, changing income, shared costs, caring for someone, or a service that is hard to access: what should an activity help people understand?</p><p class="small">These are team-written prompts, not submitted community stories. We do not claim to represent a community.</p></section><section><h2>Change your mind?</h2><p>Use your contribution receipt to remove the original and any published adaptation from this site.</p><details class="optional"><summary>Remove a contribution</summary><form id="removal-form"><div class="field"><label for="removal-id">Contribution ID</label><input id="removal-id" name="id" required maxlength="80" autocomplete="off"></div><div class="field"><label for="removal-code">Removal code</label><input id="removal-code" name="removalCode" required maxlength="100" autocomplete="off"></div><button class="secondary">Remove my contribution</button><div role="status" class="form-status"></div></form></details></section></aside></div><section style="margin-top:48px"><div class="section-head"><h2>Community learning notes</h2><span class="tag">Reviewed & shared with permission</span></div><div id="public-contributions" aria-live="polite"><p>Loading reviewed contributions…</p></div></section>`;
  }
  function receiptHTML() {
    return `<div class="receipt" role="status"><h2>Your suggestion is saved privately.</h2><p>It is waiting for review. Thank you for helping shape what we teach.</p><p><strong>Save this receipt somewhere private.</strong> It is your way to remove the contribution. We do not collect an email address to recover it.</p><p>Contribution ID:<br><code>${escape(receipt.id)}</code></p><p>Removal code:<br><code>${escape(receipt.removalCode)}</code></p><p class="small">This receipt stays here while this tab is open. It is not saved in browser storage.</p><button class="secondary" data-action="receipt-download">Download receipt</button><button class="text-button" data-action="new-suggestion">I saved my receipt · Suggest another</button></div>`;
  }
  async function loadContributions() {
    const target = document.querySelector("#public-contributions");
    if (!target) return;
    try {
      const result = await request("/api/community");
      if (!target.isConnected) return;
      target.innerHTML = result.contributions.length
        ? result.contributions
            .map(
              (c) =>
                `<article class="public-contribution"><span class="tag">Community learning note</span><h3>${escape(c.title)}</h3><p>${escape(c.situation)}</p><p>${escape(c.explanation)}</p><p><strong>What this adds:</strong> ${escape(c.improvement)}</p><p class="small muted">Shared with permission · Credit: ${escape(c.credit)}</p></article>`,
            )
            .join("")
        : '<div class="empty"><h3>The next perspective could be yours.</h3><p>No community contributions have been published yet. Suggestions stay private until they are reviewed and adapted with permission.</p></div>';
    } catch {
      if (target.isConnected)
        target.innerHTML =
          '<p class="error">Reviewed contributions could not load. <button class="text-button" data-action="load-contributions">Try again</button></p>';
    }
  }
  function render(focus = true) {
    const [requested, sub] = location.hash.slice(1).split("/");
    const tab = ["play", "learn", "community"].includes(requested)
      ? requested
      : "play";
    const order = ["play", "learn", "community"];
    main.classList.remove("route-in", "route-back");
    main.innerHTML =
      tab === "learn"
        ? learn(sub)
        : tab === "community"
          ? community()
          : sub === "setup"
            ? setup()
            : sub === "story"
              ? story()
              : home();
    void main.offsetWidth;
    main.classList.add(
      order.indexOf(tab) < order.indexOf(previousTab)
        ? "route-back"
        : "route-in",
    );
    previousTab = tab;
    document.querySelectorAll("nav a").forEach((a) => {
      if (a.hash === "#" + tab) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    document.querySelector(".progress-panel").open = false;
    progress();
    if (focus) {
      main.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: "instant" });
    }
    if (tab === "community") loadContributions();
    document.title = `${tab === "play" ? "Play" : tab === "learn" ? "Learn" : "Community"} · Harbor Academy`;
  }
  document.addEventListener("input", (event) => {
    if (event.target.closest("#contribution-form"))
      draft[event.target.name] =
        event.target.type === "checkbox"
          ? event.target.checked
          : event.target.value;
  });
  document.addEventListener("click", async (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    try {
      if (button.hasAttribute("data-choice")) {
        saved.game = G.choose(saved.game, Number(button.dataset.choice));
        save();
        render();
        announce(
          C.steps[saved.game.answers.length].choices[saved.game.pending.choice]
            .effect,
        );
      }
      if (button.hasAttribute("data-reason")) {
        saved.game = G.reflect(saved.game, Number(button.dataset.reason));
        save();
        render(false);
        const selected = main.querySelector(
          `[data-reason="${button.dataset.reason}"]`,
        );
        selected?.focus();
      }
      if (button.dataset.action === "next") {
        saved.game = G.next(saved.game);
        if (G.snapshot(saved.game).complete) {
          saved.mastered = [
            ...new Set([...saved.mastered, ...G.snapshot(saved.game).badges]),
          ];
          saved.completedGoals = [
            ...new Set([...saved.completedGoals, saved.game.goal]),
          ];
        }
        save();
        render();
      }
      if (button.dataset.action === "retry") {
        saved.game.pending = null;
        save();
        render();
      }
      if (button.dataset.action === "back") {
        saved.game.answers.pop();
        saved.game.pending = null;
        save();
        render();
      }
      if (button.dataset.action === "clear") {
        saved = {
          game: G.initial(),
          started: false,
          learned: [],
          mastered: [],
          completedGoals: [],
        };
        save();
        location.hash = "#play";
        render();
        announce("Local progress cleared.");
      }
      if (button.dataset.action === "new-suggestion") {
        receipt = null;
        render();
      }
      if (button.dataset.action === "load-contributions") loadContributions();
      if (button.dataset.action === "receipt-download") {
        const blob = new Blob(
          [
            `Harbor Academy contribution receipt\nContribution ID: ${receipt.id}\nRemoval code: ${receipt.removalCode}\nUse Community > Remove a contribution on the same Harbor Academy server. Keep this receipt private.\n`,
          ],
          { type: "text/plain" },
        );
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "harbor-contribution-receipt.txt";
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
      if (button.dataset.lesson) {
        const lesson = C.lessons.find((l) => l.id === button.dataset.lesson),
          correct = Number(button.dataset.answer) === lesson.answer;
        const target = document.querySelector("#lesson-feedback");
        target.innerHTML = `<div class="feedback"><strong>${correct ? "You’ve made the connection." : "Let’s look at the trade-off."}</strong><p>${lesson.feedback}</p>${correct ? "" : "<p>You can try the other answer.</p>"}</div>`;
        if (correct) {
          saved.learned = [...new Set([...saved.learned, lesson.id])];
          save();
        }
      }
      if (button.dataset.explain) {
        const target = main.querySelector(".ai-result");
        button.disabled = true;
        target.textContent = "Preparing an explanation…";
        try {
          const result = await request("/api/explain", {
            lesson: button.dataset.explain,
            game: saved.started ? saved.game : undefined,
          });
          if (target.isConnected)
            target.innerHTML = `<span class="tag">${result.source === "ai" ? "Optional AI rephrasing" : "Authored explanation"}</span>${result.issue ? `<p class="small muted">${escape(result.issue)}</p>` : '<p class="small muted">AI can make mistakes. Check against the lesson and its source.</p>'}<p>${escape(result.explanation)}</p>`;
        } catch {
          if (target.isConnected) {
            const l = C.lessons.find((l) => l.id === button.dataset.explain);
            target.innerHTML = `<p class="small">The optional guide is unavailable. Here is the authored explanation.</p><p>${escape(l.intro)}</p>`;
          }
        } finally {
          if (button.isConnected) button.disabled = false;
        }
      }
    } catch (e) {
      announce(e.message);
    }
  });
  document.addEventListener("submit", async (event) => {
    const form = event.target;
    if (form.id === "start-form") {
      event.preventDefault();
      saved.game = G.initial(new FormData(form).get("goal"));
      saved.started = true;
      save();
      location.hash = "#play/story";
      return;
    }
    if (!["contribution-form", "removal-form"].includes(form.id)) return;
    event.preventDefault();
    const button = form.querySelector("button[type=submit],button:not([type])"),
      target = form.querySelector(".form-status");
    button.disabled = true;
    target.textContent =
      form.id === "contribution-form"
        ? "Saving your private suggestion…"
        : "Removing your contribution…";
    try {
      const data = Object.fromEntries(new FormData(form));
      if (form.id === "contribution-form") {
        data.adaptPermission = data.adaptPermission === "on";
        data.publishPermission = data.publishPermission === "on";
        receipt = await request("/api/community", data);
        draft = {};
        if (form.isConnected) {
          render();
          document
            .querySelector("#contribute")
            .scrollIntoView({ block: "start" });
        }
      } else {
        await request("/api/community/remove", data);
        if (target.isConnected) {
          target.textContent =
            "Removed from this site, including any published adaptation.";
          form.reset();
          loadContributions();
        }
      }
    } catch (e) {
      if (target.isConnected) {
        target.classList.add("error");
        target.textContent = `${e.message} Your entries are still here.`;
      }
    } finally {
      if (button.isConnected) button.disabled = false;
    }
  });
  window.addEventListener("hashchange", () => render());
  render(false);
})();
