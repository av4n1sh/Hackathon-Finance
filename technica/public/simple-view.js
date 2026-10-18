/* A small front door and one clear next activity. Advanced adventure views stay optional. */
(function (root) {
  const F = root.HarborFestival;
  const sequence = ["cash", "workshop", "route"].map((id) =>
    F.spots.find((spot) => spot.id === id),
  );
  const games = {
    workshop: {
      name: "Lantern lab",
      skill: "Compare full prices",
      description:
        "Build a glowing lantern, one choice at a time. Can your creation fit a $20 fund?",
    },
    cash: {
      name: "Pocket-money pop-up",
      skill: "Practice with cash",
      description:
        "A little stall. Three friendly visitors. Tap notes to make their change, then see them on their way.",
    },
    route: {
      name: "Special delivery",
      skill: "Balance time and cost",
      description:
        "A crate of lanterns needs you. Pick the bridge or the coast and see what your choice changes.",
    },
  };
  function lantern(lit) {
    return `<svg viewBox="0 0 80 100" aria-hidden="true" fill="none"><path d="M27 24V15a13 13 0 0 1 26 0v9" stroke="#9b8454" stroke-width="5"/><rect x="16" y="24" width="48" height="61" rx="10" fill="${lit ? "#f9e5a3" : "#e1e7d2"}" stroke="#8d8059" stroke-width="5"/><path d="M12 87h56M22 32v43m36-43v43" stroke="#8d8059" stroke-width="5" stroke-linecap="round"/><path d="M40 41c-2 12-10 13-10 24a10 10 0 0 0 20 0c0-10-8-15-10-24Z" fill="${lit ? "#e3ad48" : "#b6c4a0"}"/></svg>`;
  }
  function home(saved) {
    const done = F.completed(saved.festival),
      next = sequence.find((s) => !done.includes(s.id)),
      resume = saved.started;
    return `<div class="home-screen"><section class="home-hero"><div><span class="eyebrow">Harbor Academy · Harborbound</span><h1>Everyday money.<br>A little adventure.</h1><p>Practice money choices through three small games. Build a lantern, make change, and find a delivery route.</p><div class="actions">${resume ? '<a class="button" href="#play">Continue playing →</a>' : '<button data-action="quick-start">Start playing →</button>'}<a class="text-button" href="#learn">Explore a money question</a></div><p class="home-reassurance">No account needed · Fictional money · Your pace</p></div><img src="assets/adventure.svg" alt="A useful everyday bag beside a winding path through a green landscape." width="600" height="440"></section>${resume ? `<section class="home-resume"><div><span class="eyebrow">Pick up where you left off</span><h2>${saved.activeFestival ? games[saved.activeFestival].name : next ? games[next.id].name : "Your harbor is glowing"}</h2><p>${done.length} of 3 festival activities complete. Your progress is saved in this browser.</p></div><a href="#play" class="button secondary">${saved.activeFestival ? "Resume game" : "Go to Play"} →</a></section>` : ""}<ol class="home-how"><li><span aria-hidden="true">1</span><div><strong>Choose a small game</strong><p>One clear task to start with.</p></div></li><li><span aria-hidden="true">2</span><div><strong>Try a money choice</strong><p>See what changes. Try again anytime.</p></div></li><li><span aria-hidden="true">3</span><div><strong>Light up your harbor</strong><p>A little progress with each activity.</p></div></li></ol></div>`;
  }
  function play(saved) {
    const done = F.completed(saved.festival),
      next = sequence.find((s) => !done.includes(s.id)),
      focus = next || sequence[0],
      game = games[focus.id];
    return `<section class="simple-play"><div class="simple-play-intro"><span class="eyebrow">Harborbound · Play</span><h1>One small game at a time.</h1><p>Try a choice, see what happens, and learn as you go.</p></div><div class="simple-lights" aria-label="${done.length} of 3 festival activities complete"><div aria-hidden="true">${F.spots.map((s) => `<span class="${done.includes(s.id) ? "lit" : ""}">${lantern(done.includes(s.id))}</span>`).join("")}</div><p><strong>${done.length} of 3 lanterns lit</strong>${done.length === 3 ? " · You brought the festival to life." : ""}</p></div><section class="next-game-card"><div><span class="tag">${next ? "Your next activity" : "Try another approach"}</span><h2>${game.name}</h2><p>${game.description}</p><span class="next-game-skill">You’ll practice: ${game.skill.toLowerCase()}.</span><button data-open-festival="${focus.id}">${saved.activeFestival === focus.id ? "Resume this game" : next ? "Play this game" : "Play again"} <span aria-hidden="true">→</span></button></div><div class="next-game-art" aria-hidden="true">${root.HarborMiniGames.cover(focus.id)}</div></section><details class="choose-game"><summary>Choose another game</summary><div>${F.spots.map((s) => `<button class="game-row" data-open-festival="${s.id}"><span><strong>${games[s.id].name}</strong><small>${games[s.id].skill}</small></span><span>${done.includes(s.id) ? "Completed · Replay" : "Play"} →</span></button>`).join("")}</div></details><details class="explore-more"><summary>Want to explore more?</summary><p>The harbor adventure and extra options are here when you want them.</p><div class="extra-links"><a href="#play/world">Explore the harbor <span aria-hidden="true">↗</span></a><a href="#journal">See progress and collected items <span aria-hidden="true">↗</span></a><a href="#play/setup">Customize your traveler <span aria-hidden="true">↗</span></a></div></details></section>`;
  }
  root.HarborSimple = { home, play };
})(window);
