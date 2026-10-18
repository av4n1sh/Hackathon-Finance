"use strict";
(() => {
  const C = window.HarborContent,
    G = window.HarborGame,
    W = window.HarborWorld,
    R = window.HarborRPG,
    V = window.HarborRPGView;
  const main = document.querySelector("#main"),
    KEY = "harbor-adventure-v1";
  const esc = (value) =>
    String(value).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const fresh = () => ({
    game: G.initial(),
    rpg: R.initial(),
    started: false,
    learned: [],
    mastered: [],
    completedGoals: [],
    missionStamps: [],
    explored: [],
    sideCompleted: [],
    talking: null,
  });
  let saved = fresh(),
    previousTab = "play",
    rewardMessage = null;
  function warn(message) {
    const el = document.querySelector("#storage-message");
    el.hidden = false;
    el.textContent = message;
  }
  function character(raw) {
    try {
      return R.restore(raw);
    } catch {
      warn(
        "Your character position could not be restored. Your story and collected learning progress are still here.",
      );
      return R.initial();
    }
  }
  const filter = (values, test) => [
    ...new Set((Array.isArray(values) ? values : []).filter(test)),
  ];
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "null");
    if (raw) {
      saved = {
        ...fresh(),
        game: G.restore(raw.game),
        rpg: character(raw.rpg),
        started: raw.started === true,
        learned: filter(raw.learned, (id) =>
          C.lessons.some((l) => l.id === id),
        ),
        mastered: filter(raw.mastered, (id) =>
          C.steps.some((s) => s.skill === id),
        ),
        completedGoals: filter(raw.completedGoals, (id) =>
          C.goals.some((g) => g.id === id),
        ),
        missionStamps: filter(raw.missionStamps, (id) =>
          C.missions.some((m) => m.id === id),
        ),
        explored: filter(raw.explored, (key) =>
          C.steps.some((s, i) => s.choices.some((c, j) => key === `${i}:${j}`)),
        ),
        sideCompleted: filter(raw.sideCompleted, (id) =>
          W.sideQuests.some((q) => q.id === id),
        ),
      };
      if (R.nearby(saved.rpg).some((n) => n.id === raw.talking))
        saved.talking = raw.talking;
    }
  } catch {
    warn(
      "Saved progress could not be loaded. You can still play. Browser storage may be blocked.",
    );
  }
  function collect() {
    saved.mastered = [
      ...new Set([...saved.mastered, ...G.snapshot(saved.game).badges]),
    ];
    saved.missionStamps = [
      ...new Set([
        ...saved.missionStamps,
        ...G.missionStatus(saved.game)
          .filter((m) => m.complete)
          .map((m) => m.id),
      ]),
    ];
    saved.explored = [
      ...new Set([
        ...saved.explored,
        ...saved.game.answers.map((a, i) => `${i}:${a.choice}`),
      ]),
    ];
    saved.sideCompleted = [
      ...new Set([
        ...saved.sideCompleted,
        ...W.sideQuests
          .filter((q) => R.sideStatus(saved.rpg, q.id).complete)
          .map((q) => q.id),
      ]),
    ];
  }
  collect();
  let lastProgress = R.progress(saved);
  function progressPanel() {
    const p = R.progress(saved);
    document.querySelector("#progress-content").innerHTML =
      `<h2>${esc(saved.rpg.name)}</h2><p><strong>Level ${p.level} · ${p.xp} learning XP</strong><br>${saved.game.answers.length}/5 chapters · ${p.sides.length}/2 side quests</p><a class="button secondary" href="#journal">Open Quest Journal</a><p class="hint">Saved in this browser. No account, streaks, or wealth ranking.</p><details><summary>Reset local adventure</summary><p>This clears your character, story, and collected learning progress.</p><button class="secondary" data-action="clear">Clear local progress</button></details>`;
  }
  function save() {
    collect();
    const p = R.progress(saved),
      gain = p.xp - lastProgress.xp,
      newItems = p.inventory.filter(
        (item) => !lastProgress.inventory.some((old) => old.id === item.id),
      );
    if (gain > 0)
      rewardMessage = `+${gain} learning XP${p.level > lastProgress.level ? ` · Level ${p.level}!` : ""}${newItems.length ? ` · Discovered ${newItems.map((i) => i.name).join(", ")}` : ""}`;
    lastProgress = p;
    try {
      localStorage.setItem(KEY, JSON.stringify(saved));
    } catch {
      warn(
        "Browser storage is unavailable. Keep this tab open; refreshing may lose your adventure.",
      );
    }
    progressPanel();
  }
  function announce(message) {
    document.querySelector("#announcement").textContent = message;
  }
  function setup() {
    return `<section class="character-creator"><a class="text-button" href="#play">← Back to Tidehaven</a><span class="eyebrow">Harborbound · Create your traveler</span><h1>Every adventure<br>starts with you.</h1><form id="start-form"><div class="creator-grid"><section><label for="traveler-name">What should we call you?</label><input id="traveler-name" name="name" maxlength="20" value="${esc(saved.rpg.name)}" autocomplete="off"><p class="hint">A nickname is enough. No real name is needed.</p><fieldset class="role-selector"><legend>Choose your role</legend><p class="hint">All roles can explore every place and complete every quest.</p><div class="role-options">${W.roles.map((r, i) => `<label class="role-card"><input type="radio" name="role" value="${r.id}" ${i === 0 ? "checked" : ""}><span class="role-sprite">${V.sprite(r.color, true)}</span><strong>${r.name}</strong><span>${r.detail}</span></label>`).join("")}</div></fieldset></section><section><fieldset class="goal-selector"><legend>Your first quest: a useful purchase</legend><div class="goal-options">${C.goals.map((g, i) => `<label class="goal-option"><input type="radio" name="goal" value="${g.id}" ${i === 0 ? "checked" : ""}><strong>${g.name}</strong><span>${g.description}</span><span>Fictional goal price: $${(g.price / 100).toFixed(0)}</span></label>`).join("")}</div></fieldset><div class="notice"><strong>Your starting pack</strong><p>$140 in fictional money: $60 protected for essentials, $80 for your main quest decisions. A notebook and a harbor full of people to meet.</p><p class="small">Optional side quests use separate practice funds. No bank account, payment, timer, or real money is involved.</p></div></section></div><p class="hint">${saved.started ? "A new journey replaces your current story. Collected skills, equipment, and side-quest achievements stay with you." : "Your character and story save in this browser. You can leave a quest to read a field note and return."}</p><button>Enter Tidehaven <span aria-hidden="true">→</span></button></form></section>`;
  }
  function render(focus = true, animate = true) {
    let [requested, sub] = location.hash.slice(1).split("/");
    if (requested === "community") {
      requested = "journal";
      history.replaceState(null, "", "#journal");
    }
    const tab = ["play", "learn", "journal"].includes(requested)
        ? requested
        : "play",
      order = ["play", "learn", "journal"];
    main.classList.remove("route-in", "route-back");
    main.innerHTML =
      tab === "learn"
        ? window.HarborLearn(saved, sub)
        : tab === "journal"
          ? V.journal(saved)
          : sub === "setup"
            ? setup()
            : saved.started
              ? V.world(saved, saved.talking)
              : V.title(saved);
    if (rewardMessage)
      main.insertAdjacentHTML(
        "beforeend",
        `<div class="reward-toast" role="status"><span class="reward-star" aria-hidden="true">✦</span><span>${esc(rewardMessage)}</span><button class="text-button" data-action="dismiss-reward" aria-label="Dismiss reward notification">Got it</button></div>`,
      );
    if (animate) {
      void main.offsetWidth;
      main.classList.add(
        order.indexOf(tab) < order.indexOf(previousTab)
          ? "route-back"
          : "route-in",
      );
    }
    previousTab = tab;
    document.querySelectorAll("nav a").forEach((a) => {
      if (a.hash === "#" + tab) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    document.querySelector(".progress-panel").open = false;
    progressPanel();
    if (focus) {
      main.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: "instant" });
    }
    document.title = `${tab === "play" ? "Harborbound" : tab === "journal" ? "Quest Journal" : "Learn"} · Harbor Academy`;
  }
  function focusWorld() {
    document.querySelector("#harbor-world")?.focus();
  }
  function updateWorld() {
    const player = document.querySelector("#world-player");
    if (!player) return;
    player.style.left = `${(saved.rpg.x / W.width) * 100}%`;
    player.style.top = `${(saved.rpg.y / W.height) * 100}%`;
    document.querySelector("#world-position").textContent =
      `Position ${saved.rpg.x + 1}, ${saved.rpg.y + 1} · ${R.nearby(saved.rpg).length ? "Someone is nearby. Press E to talk." : "Walk beside someone to talk."}`;
    document.querySelector("#nearby-actions").innerHTML = V.nearby(saved);
    document.querySelector(".npc-dialog")?.remove();
    document.querySelector(".reward-toast")?.remove();
  }
  function walk(dx, dy) {
    rewardMessage = null;
    const moved = R.move(saved.rpg, dx, dy);
    if (moved === saved.rpg) {
      announce("The path is blocked. Try another direction.");
      return;
    }
    saved.rpg = moved;
    saved.talking = null;
    save();
    updateWorld();
    announce(
      R.nearby(saved.rpg)
        .map((n) => `${n.name} is nearby. Press E to talk.`)
        .join(" ") || `Position ${saved.rpg.x + 1}, ${saved.rpg.y + 1}.`,
    );
  }
  function talk(id) {
    saved.rpg = R.talk(saved.rpg, id);
    saved.talking = id;
    save();
    render(false, false);
    const heading = document.querySelector("#dialog-title");
    heading?.setAttribute("tabindex", "-1");
    heading?.focus({ preventScroll: true });
    heading?.scrollIntoView({ block: "nearest" });
    announce(`Speaking with ${W.npcs.find((n) => n.id === id).name}.`);
  }
  function travel(id) {
    if (!saved.started) {
      location.hash = "#play/setup";
      return;
    }
    saved.rpg = R.travel(saved.rpg, id);
    saved.rpg = R.talk(saved.rpg, id);
    saved.talking = id;
    save();
    const changedTab = !location.hash.startsWith("#play");
    if (changedTab) history.pushState(null, "", "#play/world");
    render(false, changedTab);
    const heading = document.querySelector("#dialog-title");
    heading?.setAttribute("tabindex", "-1");
    heading?.focus({ preventScroll: true });
    heading?.scrollIntoView({ block: "nearest" });
    announce(`Arrived at ${W.npcs.find((n) => n.id === id).place}.`);
  }
  document.addEventListener("keydown", (event) => {
    if (!event.target.closest("#harbor-world,.dpad") || !saved.started) return;
    const directions = {
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      w: [0, -1],
      s: [0, 1],
      a: [-1, 0],
      d: [1, 0],
    };
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (directions[key]) {
      event.preventDefault();
      walk(...directions[key]);
    } else if (key === "e") {
      event.preventDefault();
      const npc = R.nearby(saved.rpg)[0];
      if (npc) talk(npc.id);
      else announce("Walk beside a character to start a conversation.");
    }
  });
  document.addEventListener("click", async (event) => {
    const tile = event.target.closest("[data-tile-x]");
    if (tile && saved.started) {
      const x = Number(tile.dataset.tileX),
        y = Number(tile.dataset.tileY),
        route = R.path(saved.rpg, x, y);
      if (route) {
        const end = route.at(-1);
        if (end) {
          saved.rpg = { ...saved.rpg, ...end };
          saved.talking = null;
          save();
          updateWorld();
        }
        focusWorld();
      } else announce("That tile is blocked. Try a path nearby.");
      return;
    }
    const button = event.target.closest("button");
    if (!button) return;
    rewardMessage = null;
    try {
      if (button.dataset.move && !button.dataset.mission) {
        walk(
          ...{ up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[
            button.dataset.move
          ],
        );
        return;
      }
      if (button.dataset.travel || button.dataset.track) {
        travel(button.dataset.travel || button.dataset.track);
        return;
      }
      if (button.dataset.talk) {
        talk(button.dataset.talk);
        return;
      }
      if (button.dataset.equip) {
        saved.rpg = R.equip(saved, button.dataset.equip);
        save();
        render(false, false);
        main
          .querySelector(`[data-equip="${button.dataset.equip}"]`)
          ?.focus({ preventScroll: true });
        announce(`${R.progress(saved).equipped.name} equipped.`);
        return;
      }
      if (button.dataset.side) {
        saved.rpg = R.playSide(
          saved.rpg,
          button.dataset.side,
          button.dataset.item,
        );
        save();
        render(false, false);
        main
          .querySelector(
            `[data-side="${button.dataset.side}"][data-item="${button.dataset.item}"]`,
          )
          ?.focus({ preventScroll: true });
        return;
      }
      if (button.dataset.mission) {
        saved.game = G.interact(
          saved.game,
          button.dataset.mission,
          button.hasAttribute("data-move")
            ? Number(button.dataset.move)
            : button.dataset.item,
        );
        save();
        render(false, false);
        main
          .querySelector(
            `[data-mission="${button.dataset.mission}"][${button.hasAttribute("data-move") ? `data-move="${button.dataset.move}"` : `data-item="${button.dataset.item}"`}]`,
          )
          ?.focus({ preventScroll: true });
        return;
      }
      if (button.hasAttribute("data-choice")) {
        saved.game = G.choose(saved.game, Number(button.dataset.choice));
        save();
        render(false, false);
        const consequence = main.querySelector(".npc-dialog .feedback");
        consequence?.setAttribute("tabindex", "-1");
        consequence?.focus();
        announce(
          C.steps[saved.game.answers.length].choices[saved.game.pending.choice]
            .effect,
        );
        return;
      }
      if (button.hasAttribute("data-reason")) {
        saved.game = G.reflect(saved.game, Number(button.dataset.reason));
        save();
        render(false, false);
        main
          .querySelector(`[data-reason="${button.dataset.reason}"]`)
          ?.focus({ preventScroll: true });
        return;
      }
      if (button.hasAttribute("data-revisit")) {
        const i = Number(button.dataset.revisit);
        saved.game = G.rewind(saved.game, i);
        save();
        travel(W.npcs.find((n) => n.step === i).id);
        return;
      }
      if (button.dataset.action === "next") {
        saved.game = G.next(saved.game);
        if (G.snapshot(saved.game).complete)
          saved.completedGoals = [
            ...new Set([...saved.completedGoals, saved.game.goal]),
          ];
        save();
        render(false, false);
        announce(
          "Chapter complete. Your next objective is in the quest tracker.",
        );
        return;
      }
      if (button.dataset.action === "retry") {
        saved.game.pending = null;
        save();
        render(false, false);
        return;
      }
      if (button.dataset.action === "close-talk") {
        saved.talking = null;
        save();
        render(false, false);
        focusWorld();
        return;
      }
      if (button.dataset.action === "dismiss-reward") {
        button.closest(".reward-toast").remove();
        main.focus({ preventScroll: true });
        return;
      }
      if (button.dataset.action === "clear") {
        saved = fresh();
        lastProgress = R.progress(saved);
        save();
        location.hash = "#play";
        render();
        return;
      }
      if (button.dataset.lesson) {
        const lesson = C.lessons.find((l) => l.id === button.dataset.lesson),
          correct = Number(button.dataset.answer) === lesson.answer;
        document.querySelector("#lesson-feedback").innerHTML =
          `<div class="feedback"><strong>${correct ? "You made the connection." : "Look at the trade-off."}</strong><p>${lesson.feedback}</p>${correct ? "" : "<p>You can try the other answer.</p>"}</div>`;
        if (correct) {
          saved.learned = [...new Set([...saved.learned, lesson.id])];
          save();
        }
        return;
      }
      if (button.dataset.explain) {
        const target = main.querySelector(".ai-result");
        button.disabled = true;
        target.textContent = "Preparing a field note…";
        try {
          const response = await fetch("/api/explain", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              lesson: button.dataset.explain,
              game: saved.game,
            }),
          });
          if (!response.ok) throw new Error("Unavailable");
          const data = await response.json();
          if (target.isConnected)
            target.innerHTML = `<span class="tag">${data.source === "ai" ? "Optional AI rephrasing" : "Authored field note"}</span><p class="small muted">${data.issue ? esc(data.issue) : "AI can make mistakes. Check against the lesson and its source."}</p><p>${esc(data.explanation)}</p>`;
        } catch {
          if (target.isConnected)
            target.textContent = C.lessons.find(
              (l) => l.id === button.dataset.explain,
            ).intro;
        } finally {
          if (button.isConnected) button.disabled = false;
        }
      }
    } catch (error) {
      announce(error.message);
    }
  });
  document.addEventListener("submit", (event) => {
    if (event.target.id !== "start-form") return;
    event.preventDefault();
    const data = new FormData(event.target),
      old = saved.rpg;
    saved.game = G.initial(data.get("goal"));
    saved.rpg = {
      ...R.initial(data.get("name"), data.get("role")),
      talked: old.talked,
      side: old.side,
      equipped: old.equipped,
    };
    saved.started = true;
    saved.talking = null;
    rewardMessage = null;
    save();
    location.hash = "#play/world";
  });
  window.addEventListener("hashchange", () => render());
  render(false);
})();
