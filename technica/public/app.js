"use strict";
(() => {
  const C = window.HarborContent,
    G = window.HarborGame,
    W = window.HarborWorld,
    R = window.HarborRPG,
    V = window.HarborRPGView,
    F = window.HarborFestival,
    FV = window.HarborFestivalView,
    S = window.HarborSimple;
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
    festival: F.initial(),
    activeFestival: null,
    festivalReturn: "#play",
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
    previousTab = "home",
    rewardMessage = null,
    discovery = null;
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
  function festivalSave(raw) {
    try {
      return F.restore(raw);
    } catch {
      warn(
        "Your festival challenge could not be restored. Your main story, character, and earlier learning progress are still here.",
      );
      return F.initial();
    }
  }
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "null");
    if (raw) {
      saved = {
        ...fresh(),
        game: G.restore(raw.game),
        rpg: character(raw.rpg),
        festival: festivalSave(raw.festival),
        activeFestival: F.spots.some((s) => s.id === raw.activeFestival)
          ? raw.activeFestival
          : null,
        festivalReturn: [
          "#play",
          "#play/world",
          "#play/story",
          "#home",
          "#journal",
        ].includes(raw.festivalReturn)
          ? raw.festivalReturn
          : "#play",
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
      `<h2>Your progress</h2><p><strong>${F.completed(saved.festival).length} of 3 lanterns lit</strong><br>Saved in this browser.</p><a class="button secondary" href="#journal">View progress and items</a><details><summary>Adventure details</summary><p>Level ${p.level} · ${p.xp} learning XP<br>${saved.game.answers.length}/5 story chapters · ${p.sides.length}/2 side quests</p></details><details><summary>Reset local adventure</summary><p>This clears your character, story, and collected learning progress.</p><button class="secondary" data-action="clear">Clear local progress</button></details>`;
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
    const tab = ["home", "play", "learn", "journal"].includes(requested)
        ? requested
        : "home",
      order = ["home", "play", "learn", "journal"],
      isWorld = tab === "play" && ["world", "story"].includes(sub);
    if (isWorld && !saved.started) {
      saved.started = true;
      save();
    }
    main.classList.remove("route-in", "route-back");
    main.innerHTML =
      tab === "home"
        ? S.home(saved)
        : tab === "learn"
          ? window.HarborLearn(saved, sub)
          : tab === "journal"
            ? V.journal(saved)
            : sub === "setup"
              ? setup()
              : isWorld && saved.started
                ? V.world(saved, saved.talking)
                : S.play(saved);
    if (isWorld && saved.started) FV.attach(saved);
    if (tab === "journal")
      main
        .querySelector(".character-hud")
        .insertAdjacentHTML("afterend", FV.journal(saved));
    if (tab === "play" && rewardMessage && !discovery)
      main.insertAdjacentHTML(
        "beforeend",
        `<div class="reward-toast" role="status"><span class="reward-star" aria-hidden="true">✦</span><span>${esc(rewardMessage)}</span><button class="text-button" data-action="dismiss-reward" aria-label="Dismiss reward notification">Got it</button></div>`,
      );
    if (isWorld && discovery)
      main.insertAdjacentHTML(
        "beforeend",
        `<aside class="discovery-pop" role="status"><span>✉ Postcard found · +5 XP once</span><h3>${esc(discovery.title)}</h3><p>${esc(discovery.note)}</p>${saved.festival.postcards.length === 3 ? "<strong>A little fox wants to travel with you. Choose it in your companion settings.</strong>" : ""}<button class="text-button" data-action="close-discovery">Keep exploring →</button></aside>`,
      );
    if (
      tab === "play" &&
      sub !== "setup" &&
      saved.started &&
      saved.activeFestival
    ) {
      main.insertAdjacentHTML(
        "beforeend",
        FV.dialog(saved, saved.activeFestival),
      );
      const dialog = document.querySelector("#festival-dialog");
      dialog.querySelector(".delivery-board")?.setAttribute("tabindex", "0");
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
      dialog.addEventListener("cancel", (event) => {
        event.preventDefault();
        closeFestival();
      });
    }
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
    document.title = `${tab === "home" ? "Home" : tab === "play" ? "Play" : tab === "journal" ? "Quest Journal" : "Learn"} · Harbor Academy`;
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
    FV.sync(saved);
  }
  function collectAtPlayer() {
    const before = saved.festival;
    const next = F.collectAt(before, saved.rpg);
    if (next !== before) {
      const id = next.postcards.find((id) => !before.postcards.includes(id));
      discovery = F.postcards.find((c) => c.id === id);
      saved.festival = next;
      return true;
    }
    return false;
  }
  function openFestival(id) {
    const spot = F.spots.find((s) => s.id === id);
    if (!spot) return;
    saved.festivalReturn = [
      "#play/world",
      "#play/story",
      "#journal",
      "#home",
    ].includes(location.hash)
      ? location.hash
      : "#play";
    saved.started = true;
    if (["#play/world", "#play/story"].includes(location.hash))
      saved.rpg = F.travel(saved.rpg, spot);
    saved.activeFestival = id;
    saved.talking = null;
    discovery = null;
    save();
    if (!location.hash.startsWith("#play"))
      history.pushState(null, "", "#play");
    render(false, false);
  }
  function closeFestival() {
    saved.activeFestival = null;
    rewardMessage = null;
    save();
    if (location.hash !== saved.festivalReturn)
      history.replaceState(null, "", saved.festivalReturn);
    render(false, false);
    if (["#play/world", "#play/story"].includes(location.hash)) focusWorld();
    else {
      const target = document.querySelector(".next-game-card button") || main;
      target.focus({ preventScroll: true });
    }
  }
  function festivalAction(action, value, selector) {
    rewardMessage = null;
    try {
      saved.festival = F.act(saved.festival, action, value);
      save();
      render(false, false);
      if (selector)
        main.querySelector(selector)?.focus({ preventScroll: true });
    } catch (error) {
      const feedback = document.querySelector("#challenge-feedback");
      if (feedback) {
        feedback.textContent = error.message;
        feedback.classList.add("has-feedback");
      }
      announce(error.message);
    }
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
    const found = collectAtPlayer();
    save();
    if (found) {
      render(false, false);
      focusWorld();
    } else updateWorld();
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
    if (document.querySelector("#festival-dialog[open]")) {
      if (event.target.closest(".delivery-board,.delivery-pad")) {
        const direction = {
          ArrowUp: "up",
          ArrowDown: "down",
          ArrowLeft: "left",
          ArrowRight: "right",
        }[event.key];
        if (direction) {
          event.preventDefault();
          festivalAction("route", direction, ".delivery-board");
        }
      }
      return;
    }
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
      else {
        const spot = F.spots.find(
          (s) => Math.abs(s.x - saved.rpg.x) + Math.abs(s.y - saved.rpg.y) <= 1,
        );
        if (spot) openFestival(spot.id);
        else announce("Walk beside a character or lantern marker to interact.");
      }
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
          const found = collectAtPlayer();
          save();
          if (found) render(false, false);
          else updateWorld();
        }
        focusWorld();
      } else announce("That tile is blocked. Try a path nearby.");
      return;
    }
    const button = event.target.closest("button");
    if (!button) return;
    rewardMessage = null;
    try {
      if (button.dataset.openFestival) {
        openFestival(button.dataset.openFestival);
        return;
      }
      if (button.dataset.festivalAction) {
        const action = button.dataset.festivalAction,
          value =
            action === "coin"
              ? Number(button.dataset.value)
              : button.dataset.value;
        festivalAction(
          action,
          value,
          `[data-festival-action="${action}"]${button.dataset.value ? `[data-value="${button.dataset.value}"]` : ""}`,
        );
        return;
      }
      if (button.dataset.postcard) {
        const card = F.postcards.find((c) => c.id === button.dataset.postcard);
        const freshCard = !saved.festival.postcards.includes(card.id);
        saved.rpg = F.travel(saved.rpg, card);
        saved.festival = F.collect(saved.festival, saved.rpg, card.id);
        saved.talking = null;
        discovery = freshCard ? card : null;
        save();
        render(false, false);
        return;
      }
      if (button.dataset.companion) {
        saved.festival = F.act(
          saved.festival,
          "companion",
          button.dataset.companion,
        );
        save();
        render(false, false);
        main
          .querySelector(`[data-companion="${button.dataset.companion}"]`)
          ?.focus({ preventScroll: true });
        announce("Traveling companion updated.");
        return;
      }
      if (button.dataset.action === "close-festival") {
        closeFestival();
        return;
      }
      if (button.dataset.action === "close-discovery") {
        discovery = null;
        render(false, false);
        focusWorld();
        return;
      }
      if (button.dataset.action === "quick-start") {
        saved.started = true;
        saved.talking = null;
        save();
        location.hash = "#play";
        return;
      }
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
        location.hash = "#home";
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
    saved.activeFestival = null;
    rewardMessage = null;
    save();
    location.hash = "#play/world";
  });
  window.addEventListener("hashchange", () => render());
  render(false);
})();
