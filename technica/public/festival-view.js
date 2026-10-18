(function (root) {
  const F = root.HarborFestival;
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
  root.HarborFestivalView = {
    props,
    tracker,
    dialog: root.HarborMiniGames.dialog,
    journal,
    attach,
    sync,
  };
})(window);
