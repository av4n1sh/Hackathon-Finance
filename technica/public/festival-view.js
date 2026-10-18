(function (root) {
  const F = root.HarborFestival,
    G = root.HarborGame;
  const money = (c) => "$" + (c / 100).toFixed(2);
  const companionArt = (kind) =>
    kind === "fox"
      ? '<svg viewBox="0 0 32 24" aria-hidden="true"><path fill="#bb6538" d="M5 12 1 5l10 3 8-1 5 5 6-2-3 10H9z"/><path fill="#e09b55" d="m6 10 1-8 7 7 5-5 3 8-8 6z"/><path fill="#fff0cf" d="m7 13 7 4 8-4-3 8H11zM27 13l4-3-1 7z"/><path fill="#273d30" d="M10 11h2v2h-2zm7 0h2v2h-2zm-4 5h3v2h-3z"/></svg>'
      : '<svg viewBox="0 0 32 24" aria-hidden="true"><path fill="#f6edcf" d="M8 12c1-8 13-10 15-2l6 3-6 2c-3 8-14 7-18 2L1 11z"/><path fill="#9fb3a5" d="m8 12 10-2-4 8z"/><path fill="#e2af51" d="m23 10 8 3-8 2zM12 20h2v4h-2zm5-1h2v5h-2z"/><path fill="#243f32" d="M21 9h2v2h-2z"/></svg>';
  function props(saved) {
    const f = saved.festival,
      done = F.completed(f);
    return `<div class="festival-props" id="festival-props">${F.spots.map((s) => `<button class="festival-spot ${done.includes(s.id) ? "is-lit" : ""}" data-open-festival="${s.id}" style="left:${(s.x / 16) * 100}%;top:${(s.y / 11) * 100}%" aria-label="Visit ${s.name}${done.includes(s.id) ? ", lantern restored" : ""}"><span class="lantern-art" aria-hidden="true"><i></i></span><span class="spot-label">${s.name}</span></button>`).join("")}${F.postcards
      .filter((c) => !f.postcards.includes(c.id))
      .map(
        (c) =>
          `<button class="hidden-postcard" data-postcard="${c.id}" style="left:${(c.x / 16) * 100}%;top:${(c.y / 11) * 100}%" aria-label="Collect postcard: ${c.title}"><span aria-hidden="true">✉</span></button>`,
      )
      .join(
        "",
      )}<div class="festival-bunting" aria-hidden="true">${Array.from({ length: 9 }, (_, i) => `<i class="flag-${i % 3}"></i>`).join("")}</div>${done.includes("workshop") ? '<div class="cottage-glow" aria-hidden="true"></div>' : ""}${done.includes("cash") ? '<div class="market-glow" aria-hidden="true"></div>' : ""}${done.includes("route") ? '<div class="pier-glow" aria-hidden="true"></div>' : ""}${f.companion !== "none" ? `<div id="travel-companion" class="travel-companion ${f.companion}" style="left:${(saved.rpg.x / 16) * 100}%;top:${(saved.rpg.y / 11) * 100}%" aria-hidden="true">${companionArt(f.companion)}</div>` : ""}</div>`;
  }
  function tracker(saved) {
    const f = saved.festival,
      done = F.completed(f);
    return `<section class="festival-tracker"><div class="festival-kicker"><span>Lanternwake festival</span><span>${done.length}/3 lights</span></div><h2>${done.length === 3 ? "You brought the harbor to life." : "Three little lights. One big night."}</h2><p>${done.length === 3 ? "The lanterns are lit. Try a different route, finish your money story, or look for the remaining postcards." : "The harbor’s festival lanterns need a little help. Build, trade, and explore to light them one by one."}</p><div class="festival-objectives">${F.spots.map((s) => `<button data-open-festival="${s.id}" class="${done.includes(s.id) ? "objective-done" : ""}"><span aria-hidden="true">${done.includes(s.id) ? "✓" : s.icon}</span><span><strong>${s.name}</strong><small>${s.description}</small></span><span aria-hidden="true">→</span></button>`).join("")}</div><div class="postcard-progress"><span>✉ ${f.postcards.length}/5 hidden postcards</span><span>${f.postcards.length >= 3 ? "Fox companion unlocked" : "Find 3 to befriend a fox"}</span></div><details class="companion-settings"><summary>Your traveling companion</summary><div class="actions">${["gull", "fox", "none"].map((kind) => `<button class="secondary" data-companion="${kind}" aria-pressed="${f.companion === kind}" ${kind === "fox" && f.postcards.length < 3 ? "disabled" : ""}>${kind === "gull" ? "Harbor gull" : kind === "fox" ? "Little fox" : "Travel solo"}</button>`).join("")}</div></details></section>`;
  }
  function dialog(saved, id) {
    const f = saved.festival,
      spot = F.spots.find((s) => s.id === id);
    if (!spot) return "";
    let body = "";
    const solved = F.completed(f).includes(id);
    if (id === "workshop") {
      const plan = F.repairStatus(f.parts);
      body = `<p>Make a working lantern within a <strong>$20 workshop fund</strong>. Mix parts and compare the extra work, repair charge, and delivery.</p><div class="workshop-grid"><div>${Object.entries(
        F.parts,
      )
        .map(
          ([category, items]) =>
            `<fieldset class="part-group"><legend>${{ lens: "1. Choose a lens", mount: "2. Choose a frame", delivery: "3. Choose how to get it" }[category]}</legend>${items.map((item) => `<button data-festival-action="part" data-value="${category}:${item.id}" aria-pressed="${f.parts[category] === item.id}"><strong>${item.name}</strong><span>${item.note}</span></button>`).join("")}</fieldset>`,
        )
        .join(
          "",
        )}</div><aside class="build-preview"><div class="crafted-lantern ${plan.ready ? "assembled" : ""}" aria-hidden="true"><div class="craft-handle"></div><div class="craft-frame"><i></i></div><div class="craft-base"></div></div><h3>Your parts receipt</h3>${plan.lines.length ? plan.lines.map((l) => `<div class="build-line"><span>${l.name}</span><strong>${money(l.cents)}</strong></div>`).join("") : "<p>Pick a part to start building.</p>"}<div class="build-total ${plan.total > 2000 ? "over-budget" : ""}"><span>Total</span><strong>${money(plan.total)} / $20</strong></div><p class="hint">${plan.total > 2000 ? "Over the workshop fund. Swap a part or compare collection and delivery." : plan.valid ? "This lantern fits the fund. Both cost and practical access matter." : "Choose one option in each group."}</p><button data-festival-action="submit-workshop" ${plan.ready ? "" : "disabled"}>Build & light the lantern ✦</button></aside></div>`;
    } else if (id === "cash") {
      const cash = F.cashStatus(f.coins);
      body = `<p>A visitor buys <strong>3 festival tickets at $4 each</strong> and hands you <strong>$20</strong>. Build their change from the drawer. No hurry, and no money leaves your story wallet.</p><div class="ticket-counter"><div class="festival-tickets" aria-label="Three tickets, four dollars each">${Array.from({ length: 3 }, () => '<span class="festival-ticket">Lanternwake<br><strong>$4</strong><small>Admit one</small></span>').join("")}</div><div class="counter-math"><span>Ticket sale <strong>${money(cash.sale)}</strong></span><span>Visitor paid <strong>${money(cash.received)}</strong></span></div><h3>Tap notes to put them in the change tray</h3><div class="cash-drawer">${[500, 200, 100].map((n) => `<button data-festival-action="coin" data-value="${n}" aria-label="Add ${n / 100} dollars to the change tray"><span>$${n / 100}</span><small>Add to tray</small></button>`).join("")}</div><div class="change-tray" aria-label="Change selected">${f.coins.length ? f.coins.map((c) => `<span class="tray-note">$${c / 100}</span>`).join("") : "<p>The change tray is empty.</p>"}</div><div class="build-total"><span>Change in tray</span><strong>${money(cash.total)}</strong></div><div class="actions"><button data-festival-action="submit-cash">Hand over the change →</button><button class="secondary" data-festival-action="undo-cash" ${f.coins.length ? "" : "disabled"}>Undo last note</button><button class="text-button" data-festival-action="clear-cash">Clear tray</button></div><details class="optional"><summary>A little help with the till</summary><p>The tickets total $12. Subtract the sale from the $20 received. The visitor should receive $8; many combinations of notes work.</p></details></div>`;
    } else {
      const r = F.routeStatus(f.moves);
      body = `<p>Deliver the lantern crate to the stage. The short bridge costs <strong>$2 for a pass</strong>; the longer path is free. Both routes avoid the closed stairs. You have a separate $2 delivery fund and no time limit.</p><div class="delivery-layout"><div class="delivery-board" aria-label="Delivery route puzzle"><div class="delivery-grid">${F.routeRows.flatMap((row, y) => Array.from(row).map((tile, x) => `<div class="delivery-tile ${tile === "#" ? "closed" : tile === "$" ? "toll" : "open"} ${x === F.routeGoal.x && y === F.routeGoal.y ? "stage" : ""}">${x === F.routeGoal.x && y === F.routeGoal.y ? "<span>⚑<small>Stage</small></span>" : tile === "#" ? '<span aria-hidden="true">×</span>' : tile === "$" ? "<span>$2<small>Bridge</small></span>" : ""}</div>`)).join("")}</div><div class="delivery-player" style="left:${(r.x / 5) * 100}%;top:${(r.y / 4) * 100}%" aria-hidden="true">▣</div></div><aside><h3>Lantern delivery</h3><p id="delivery-position">Crate position: column ${r.x + 1}, row ${r.y + 1}. Stage: column 5, row 2.</p><dl class="delivery-stats"><div><dt>Steps taken</dt><dd>${r.steps}</dd></div><div><dt>Route cost</dt><dd>${money(r.cost)}</dd></div><div><dt>Fund remaining</dt><dd>${money(200 - r.cost)}</dd></div></dl><div class="dpad delivery-pad" aria-label="Crate movement">${[
        ["up", "↑", "north"],
        ["left", "←", "west"],
        ["down", "↓", "south"],
        ["right", "→", "east"],
      ]
        .map(
          ([d, arrow, label]) =>
            `<button data-festival-action="route" data-value="${d}" aria-label="Move crate ${label}" ${r.complete ? "disabled" : ""}>${arrow}</button>`,
        )
        .join(
          "",
        )}</div><button class="text-button" data-festival-action="reset-route">Reset this delivery</button><p class="hint">Use the buttons, or focus the route board and use arrow keys. Closed cells block the crate. A bridge pass is paid once per attempt.</p></aside></div>`;
    }
    const summary =
      id === "workshop"
        ? "A full-price comparison brought this lantern back. Reclaimed and new parts can both make a workable plan."
        : id === "cash"
          ? "Three $4 tickets make $12. Returning $8 accounts for the visitor’s $20. Your cash-handling practice lit the market."
          : `The crate reached the stage. Your first route cost ${money(F.routeStatus(f.solutions.route || f.moves).cost)}. The longer free path and the shorter paid bridge both work.`;
    return `<dialog id="festival-dialog" class="festival-dialog" aria-labelledby="festival-dialog-title"><header class="challenge-head"><div><span class="eyebrow">Lanternwake · ${spot.name}</span><h2 id="festival-dialog-title">${spot.title}</h2></div><button class="secondary" data-action="close-festival" aria-label="Close festival challenge">×</button></header><div class="challenge-body">${solved ? `<div class="festival-success" role="status"><span aria-hidden="true">✦</span><div><strong>Lantern lit · 30 XP earned once</strong><p>${summary}</p><p>${spot.light}</p></div></div>` : ""}${body}<p id="challenge-feedback" role="status" class="challenge-feedback"></p><p class="challenge-funds">Festival practice funds are separate from your main quest wallet. You can try again without losing progress.</p></div></dialog>`;
  }
  function journal(saved) {
    const f = saved.festival,
      done = F.completed(f);
    return `<section class="festival-journal"><span class="eyebrow">The harbor is changing because of you</span><h2>Lanternwake: ${done.length} of 3 lanterns lit</h2><div class="festival-journal-cards">${F.spots.map((s) => `<article><span class="journal-lantern ${done.includes(s.id) ? "is-lit" : ""}" aria-hidden="true">✦</span><h3>${s.name}</h3><p>${done.includes(s.id) ? s.light : s.description}</p><button class="secondary" data-open-festival="${s.id}">${done.includes(s.id) ? "Try another approach" : "Play this challenge"} →</button></article>`).join("")}</div><details class="postcard-album"><summary>Postcard album · ${f.postcards.length}/5 discoveries</summary><div>${F.postcards.map((c) => `<article><h3>${f.postcards.includes(c.id) ? c.title : "An undiscovered postcard"}</h3><p>${f.postcards.includes(c.id) ? c.note : "Look for the little envelopes around Tidehaven."}</p></article>`).join("")}</div></details></section>`;
  }
  function attach(saved) {
    const map = document.querySelector(".rpg-map");
    if (!map) return;
    map.classList.add(
      "lanternwake-map",
      `festival-phase-${F.completed(saved.festival).length}`,
    );
    map.insertAdjacentHTML("beforeend", props(saved));
    const sidebar = document.querySelector(".rpg-sidebar");
    if (sidebar) {
      sidebar.insertAdjacentHTML("afterbegin", tracker(saved));
      const trackerEl = sidebar.querySelector(".quest-tracker");
      if (trackerEl) {
        const details = document.createElement("details");
        details.className = "story-track";
        details.innerHTML =
          "<summary>Your everyday money story · " +
          saved.game.answers.length +
          "/5 chapters</summary>";
        trackerEl.before(details);
        details.append(trackerEl);
        if (saved.talking) details.open = true;
      }
      sidebar.querySelector(".camp-note")?.remove();
    }
    const heading = document.querySelector(".rpg-page-head h1");
    if (heading)
      heading.textContent =
        F.completed(saved.festival).length === 3
          ? "You lit up Tidehaven."
          : "Bring Lanternwake to life.";
    const answers = saved.game.answers;
    if (answers.length) {
      const clues = [
        answers.length > 0
          ? `Your week: ${answers[0].choice === 0 ? "the subscription is paused" : "there is room for something you enjoy"}`
          : "",
        answers.length > 1
          ? `Care visit: ${answers[1].choice === 0 ? "a shuttle trip today" : "a shared ride tomorrow"}`
          : "",
        answers.length > 3
          ? `Delivery message: ${answers[3].choice === 1 ? "the gift-card loss is recorded; you can reconsider" : "independently checked"}`
          : "",
      ].filter(Boolean);
      map.insertAdjacentHTML(
        "afterend",
        `<div class="town-memory" aria-label="How your story choices changed this visit">${clues.map((t) => `<span>${t}</span>`).join("")}</div>`,
      );
    }
  }
  function sync(saved) {
    const propsEl = document.querySelector("#festival-props");
    if (propsEl) propsEl.outerHTML = props(saved);
    const trackerEl = document.querySelector(".festival-tracker");
    if (trackerEl) trackerEl.outerHTML = tracker(saved);
  }
  root.HarborFestivalView = { props, tracker, dialog, journal, attach, sync };
})(window);
