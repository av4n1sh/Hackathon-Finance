(function (root) {
  const W = root.HarborWorld,
    R = root.HarborRPG,
    G = root.HarborGame,
    C = root.HarborContent,
    P = root.HarborPlay;
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
  const money = (c) => "$" + (c / 100).toFixed(2);
  function sprite(color = "#dfb167", player = false) {
    return `<svg viewBox="0 0 24 32" shape-rendering="crispEdges" aria-hidden="true"><ellipse cx="12" cy="30" rx="9" ry="2" fill="#163c3455"/><path fill="#283b36" d="M6 25h5v5H6zm7 0h5v5h-5z"/><path fill="${color}" d="M6 14h12v12H6zM3 16h3v8H3zm15 0h3v8h-3z"/><path fill="#e7bf98" d="M7 5h10v10H7zM3 22h3v3H3zm15 0h3v3h-3z"/><path fill="#443a32" d="M6 4h12v4H6zM5 7h3v6H5zm4-4h8v3H9z"/><path fill="#29392f" d="M9 10h2v2H9zm5 0h2v2h-2z"/>${player ? '<path fill="#f5e8bb" d="M4 2h16v3H4zM8 0h9v3H8zM14 17h4v7h-4z"/>' : '<path fill="#fff2d0" d="M11 15h2v4h-2z"/>'}</svg>`;
  }
  function itemIcon(id) {
    const map = {
      book: "▤",
      compass: "✥",
      boots: "♧",
      lens: "⌕",
      lantern: "◈",
      tools: "⚒",
      receipt: "▧",
      leaf: "❧",
    };
    return `<span class="gear-icon" aria-hidden="true">${map[id] || "✦"}</span>`;
  }
  function map(saved) {
    const s = saved.rpg,
      role = W.roles.find((r) => r.id === s.role),
      active = Math.min(saved.game.answers.length, 4);
    return `<div class="world-frame"><div class="world-topline"><span><span class="world-dot"></span> Tidehaven · ${saved.game.answers.length === 5 ? "After the journey" : `Chapter ${active + 1} of 5`}</span><span>Explore at your pace</span></div><div class="rpg-map" id="harbor-world" tabindex="0" role="group" aria-label="Explorable harbor. Arrow keys or W A S D to move. E to speak to a nearby character. You can also use the direction buttons or travel menu." aria-describedby="world-position"><div class="tile-grid" aria-hidden="true">${W.rows.flatMap((row, y) => Array.from(row).map((tile, x) => `<div class="world-tile ${{ T: "tree", B: "building", "~": "water", "=": "road", ",": "sand", ":": "pier", "#": "rock" }[tile] || "grass"}" data-tile-x="${x}" data-tile-y="${y}"><span></span></div>`)).join("")}</div><div class="world-decoration cloud-one" aria-hidden="true"></div><div class="world-decoration cloud-two" aria-hidden="true"></div>${W.npcs
      .map((n) => {
        const main = Number.isInteger(n.step),
          complete = main
            ? saved.game.answers.length > n.step
            : R.progress(saved).sides.includes(n.side),
          current = main
            ? n.step === active && saved.game.answers.length < 5
            : n.side && !complete;
        return `<button class="world-npc ${current ? "quest-ready" : ""}" style="left:${(n.x / W.width) * 100}%;top:${(n.y / W.height) * 100}%" data-travel="${n.id}" aria-label="Travel to ${n.name}, ${n.place}${current ? ", quest available" : ""}"><span class="quest-mark" aria-hidden="true">${complete ? "✓" : current ? "!" : "…"}</span>${sprite(n.color)}<span class="npc-name">${n.name}</span></button>`;
      })
      .join(
        "",
      )}<div class="rpg-character" id="world-player" style="left:${(s.x / W.width) * 100}%;top:${(s.y / W.height) * 100}%" aria-hidden="true">${sprite(role.color, true)}<span class="player-name">${esc(s.name)}</span></div><span class="world-location-label label-grove" aria-hidden="true">Whispering grove</span><span class="world-location-label label-harbor" aria-hidden="true">Tidehaven</span></div><div class="world-controls"><div><p id="world-position" class="small">Position ${s.x + 1}, ${s.y + 1} · ${R.nearby(s).length ? "Someone is nearby." : "Walk beside someone to talk."}</p><p class="hint">Arrow keys / WASD to walk · E to talk · Click a character to travel</p></div><div class="dpad" aria-label="Movement controls"><button data-move="up" aria-label="Move north">↑</button><button data-move="left" aria-label="Move west">←</button><button data-move="down" aria-label="Move south">↓</button><button data-move="right" aria-label="Move east">→</button></div></div><div class="nearby-actions" id="nearby-actions">${nearby(saved)}</div><details class="travel-menu"><summary>Travel to a character</summary><div class="travel-list">${W.npcs.map((n) => `<button class="secondary" data-travel="${n.id}">${n.name}<span>${n.place}</span></button>`).join("")}</div></details></div>`;
  }
  function nearby(saved) {
    return (
      R.nearby(saved.rpg)
        .map(
          (n) =>
            `<button data-talk="${n.id}">Talk to ${n.name} <span aria-hidden="true">↵</span></button>`,
        )
        .join("") ||
      '<p class="hint">Explore the paths or choose a destination from the travel menu.</p>'
    );
  }
  function stats(saved) {
    const p = R.progress(saved),
      s = G.snapshot(saved.game),
      role = W.roles.find((r) => r.id === saved.rpg.role);
    return `<section class="character-hud"><div class="character-portrait">${sprite(role.color, true)}</div><div><h2>${esc(saved.rpg.name)}</h2><span>Level ${p.level} ${role.name}</span><label class="sr-only" for="hero-xp">Experience toward the next level</label><progress id="hero-xp" max="100" value="${p.levelXP}"></progress><span class="small">${p.xp} learning XP · ${p.next ? `${p.next} to next level` : "Highest level reached"}</span></div><div class="wallet"><span>Quest wallet</span><strong>${money(s.available)}</strong><span>Fictional USD · $60 essentials protected</span></div></section>`;
  }
  function tracker(saved) {
    const p = R.progress(saved),
      i = saved.game.answers.length,
      npc = W.npcs.find((n) => n.step === i);
    return `<section class="quest-tracker"><span class="eyebrow">${npc ? "Tracked main quest" : "Main journey complete"}</span><h2>${npc ? C.steps[i].title : "A harbor of possibilities"}</h2><p>${npc ? `Speak with ${npc.name} at ${npc.place}.` : "Visit the Journal to review your decisions, collect side-quest rewards, or replay a different path."}</p>${npc ? `<button data-travel="${npc.id}">Travel to ${npc.name} →</button>` : '<a class="button" href="#journal">Open Quest Journal →</a>'}<div class="tracker-counts"><span>${i}/5 chapters</span><span>${p.sides.length}/2 side quests</span></div><div class="equipped-tool">${itemIcon(p.equipped.icon)}<div><span class="small muted">Equipped learning tool</span><strong>${p.equipped.name}</strong><a href="#learn/${p.equipped.lesson}">Use tool · Open its field note ↗</a></div></div></section>`;
  }
  function dialog(saved, id) {
    const n = W.npcs.find((n) => n.id === id);
    if (!n) return "";
    let body = `<p>${n.greeting}</p>`;
    if (Number.isInteger(n.step)) {
      const i = saved.game.answers.length,
        step = C.steps[n.step];
      if (n.step > i) {
        const guide = W.npcs.find((n) => n.step === i);
        body += `<div class="quest-notice">First, finish your current quest with ${guide.name}. You can still explore the harbor and take side quests.</div><button data-travel="${guide.id}">Find ${guide.name} →</button>`;
      } else if (n.step < i) {
        body += `<div class="quest-notice"><strong>Chapter complete</strong><p>${step.choices[saved.game.answers[n.step].choice].effect}</p></div><button class="secondary" data-revisit="${n.step}">Replay from this chapter</button>`;
      } else {
        const state = saved.game,
          pending = state.pending;
        body += `<span class="quest-label">Main quest ${i + 1} · ${step.skill}</span><h3>${step.title}</h3><p>${step.text}</p>${P.activity(state)}`;
        if (!pending) {
          body += `<div class="choices">${step.choices
            .map((c, j) => {
              const cost = G.cost(state, i, j),
                ok = cost <= G.snapshot(state).available;
              return `<button class="choice" data-choice="${j}" ${ok ? "" : "disabled"}><span><strong>${c.title}</strong><small>${c.cost === "goal" ? money(cost) + " · " : ""}${c.note}${ok ? "" : ` Needs ${money(cost)}; your wallet has ${money(G.snapshot(state).available)}.`}</small></span><span aria-hidden="true">→</span></button>`;
            })
            .join("")}</div>`;
        } else {
          const r = step.reflection;
          body += `<div class="feedback"><strong>${step.choices[pending.choice].title}</strong><p>${step.choices[pending.choice].effect}</p><p>${money(G.cost(state, i, pending.choice))} spent · ${money(G.snapshot(state).available)} in the quest wallet.</p></div><fieldset class="rpg-reflection"><legend>${r.question}</legend>${r.options.map((o, j) => `<button class="secondary" data-reason="${j}" aria-pressed="${pending.reason === j}">${o}</button>`).join("")}</fieldset>${pending.reason !== null ? `<div class="feedback" role="status"><p>${r.feedback}</p>${pending.reason === r.correct ? `<strong>✦ ${step.skill} discovered</strong>` : "<span>Try another reflection or keep learning. Your wallet is unchanged.</span>"}</div>` : ""}<div class="actions"><button data-action="next" ${pending.reason === null ? "disabled" : ""}>Complete quest · Claim chapter reward →</button><button class="secondary" data-action="retry">Reconsider decision</button></div>`;
        }
        body += `<a class="text-button" href="#learn/${step.lesson}">Open a field note without losing this quest ↗</a>`;
      }
    } else if (n.side) {
      const s = R.sideStatus(saved.rpg, n.side),
        selected = saved.rpg.side[n.side],
        completed = s.complete;
      if (n.side === "ledger")
        body += `<h3>The scattered ledger</h3><p>Select the three receipts to rebuild the record. The total is calculated as you collect.</p><div class="side-choices">${W.receipts.map((r) => `<button class="loot-receipt" data-side="ledger" data-item="${r.id}" aria-pressed="${selected.includes(r.id)}"><span>${selected.includes(r.id) ? "✓ Collected" : "+ Collect"}</span><strong>${r.name}</strong><b>${money(r.cents)}</b></button>`).join("")}</div><div class="quest-total" role="status">Rebuilt spending: <strong>${money(s.total)}</strong></div>`;
      else
        body += `<h3>Water for the garden</h3><p>Choose water and a step-free delivery option. Compare both time and price. This quest’s $18 belongs to the garden, separate from your wallet.</p><div class="side-choices">${W.supplies.map((r) => `<button class="choice" data-side="garden" data-item="${r.id}" aria-pressed="${selected.includes(r.id)}"><span><strong>${selected.includes(r.id) ? "✓ " : ""}${r.name} · ${money(r.cents)}</strong><small>${r.note}</small></span></button>`).join("")}</div><div class="quest-total" role="status">Supply plan: <strong>${money(s.total)} / $18.00</strong></div><p class="hint">${s.total > 1800 ? "This kit is over the garden budget. Try choosing one water option." : !selected.includes("cart") ? "Include a step-free delivery route." : "Choose one water option to finish the kit."}</p>`;
      body += completed
        ? `<div class="quest-reward"><strong>✦ Side quest completed · 40 XP</strong><p>${n.side === "ledger" ? "Three receipts make $15. Tracking each expense makes the total visible. Receipt pouch added to your inventory." : "Your kit covers water and a step-free route. A refill costs less but takes time; sealed water is a workable alternative. Garden crest added to your inventory."}</p><a href="#journal">Inspect your reward in the Journal →</a></div>`
        : '<p class="hint">Complete the activity to discover a unique item and earn 40 learning XP. Repeating it does not award extra XP.</p>';
    } else
      body +=
        '<div class="quest-notice">Your equipment holds learning reminders. Use an item to open its field note. Side quests use separate practice funds; only main story choices change your quest wallet.</div><a class="button" href="#journal">Open your journal</a>';
    return `<section class="npc-dialog" aria-labelledby="dialog-title"><div class="dialog-top"><div class="npc-portrait">${sprite(n.color)}</div><div><h2 id="dialog-title">${n.name}</h2><span>${n.title}</span></div><button class="secondary" data-action="close-talk" aria-label="Close conversation with ${n.name}">×</button></div><div class="dialog-body">${body}</div></section>`;
  }
  function world(saved, talking) {
    return `<div class="rpg-page-head"><div><span class="eyebrow">Harborbound · An everyday money RPG</span><h1>Your next chapter awaits.</h1></div><a class="secondary button" href="#journal">Quest Journal <span aria-hidden="true">▤</span></a></div>${stats(saved)}<div class="rpg-layout">${map(saved)}<aside class="rpg-sidebar">${tracker(saved)}${talking ? dialog(saved, talking) : '<section class="camp-note"><h2>Make the harbor your own</h2><p>Walk through the grove, meet the locals, and follow the quest marker. Every conversation is a chance to practice a real decision.</p><p class="small">No battles, countdowns, or lost-day penalties. You can always reconsider.</p></section>'}</aside></div>`;
  }
  function journal(saved) {
    const p = R.progress(saved),
      i = saved.game.answers.length;
    return `<div class="page-intro"><span class="eyebrow">Your adventure, all in one place</span><h1>Quest Journal</h1><p>Track your next objective, inspect your equipment, and remember what your choices changed.</p><a class="button" href="${saved.started ? "#play/world" : "#play/setup"}">${saved.started ? "Return to Tidehaven" : "Create your traveler"} →</a></div>${stats(saved)}<div class="journal-layout"><section><div class="section-head"><h2>Main quests</h2><span class="tag">${i}/5 complete</span></div><ol class="journal-quests">${C.steps
      .map((s, j) => {
        const n = W.npcs.find((n) => n.step === j),
          done = j < i,
          current = j === i;
        return `<li class="${done ? "quest-done" : current ? "quest-current" : ""}"><span class="quest-number" aria-hidden="true">${done ? "✓" : j + 1}</span><div><span class="small muted">${done ? "Completed" : current ? "Current objective" : "Ahead on your journey"} · ${n.place}</span><h3>${s.title}</h3><p>${done ? s.choices[saved.game.answers[j].choice].effect : `Meet ${n.name}. Practice ${s.skill.toLowerCase()}.`}</p><span class="quest-item-reward">Reward: ${W.items.find((item) => item.chapter === j).name} · 20 chapter XP</span>${saved.started && (done || current) ? `<button class="text-button" ${done ? `data-revisit="${j}"` : `data-track="${n.id}"`}>${done ? "Replay from this chapter" : "Track this quest"} →</button>` : ""}</div></li>`;
      })
      .join(
        "",
      )}</ol><h2 style="margin-top:35px">Side quests</h2>${W.sideQuests.map((q) => `<article class="journal-side"><span class="tag">${p.sides.includes(q.id) ? "Completed" : "Optional discovery"}</span><h3>${q.name}</h3><p>${q.description}</p><p class="small">Reward: ${q.reward} · 40 XP, once</p><button class="secondary" data-track="${q.npc}">${p.sides.includes(q.id) ? "Visit again" : "Find the quest giver"} →</button></article>`).join("")}</section><aside><section class="inventory"><div class="section-head"><h2>Satchel</h2><span>${p.inventory.length} items</span></div><p class="hint">Equipment opens a useful field note. Its power is a skill you can practice, never a change to your wallet.</p><div class="inventory-grid">${W.items
      .map((item) => {
        const unlocked = p.inventory.some((i) => i.id === item.id);
        return `<article class="inventory-item ${unlocked ? "unlocked" : "undiscovered"}">${itemIcon(item.icon)}<div><h3>${item.name}</h3><p>${unlocked ? item.detail : "Discover this item through its quest."}</p>${unlocked ? `<button class="text-button" data-equip="${item.id}">${p.equipped.id === item.id ? "Equipped ✓" : "Equip item"}</button><a href="#learn/${item.lesson}">Use field note ↗</a>` : '<span class="small">Not discovered yet</span>'}</div></article>`;
      })
      .join(
        "",
      )}</div></section><section class="discovery-log"><h2>People you’ve met</h2><ul>${W.npcs.map((n) => `<li>${saved.rpg.talked.includes(n.id) ? "✓" : "◇"} ${n.name} · ${n.place}</li>`).join("")}</ul><p class="hint">First conversations earn 5 XP once. Reasoning discoveries earn 25 XP, activity stamps 30 XP. There are no repeatable reward loops.</p></section></aside></div>${P.passport(saved)}<details class="optional"><summary>Begin another journey</summary><p>A new journey replaces the current story and character position. Your collected skills, completed side quests, and learned items remain.</p><a class="button secondary" href="#play/setup">Choose another role and goal →</a></details>`;
  }
  function title(saved) {
    return `<section class="rpg-title-screen"><div class="title-world" inert aria-hidden="true">${map(saved)}</div><div class="title-parchment"><span class="eyebrow">A small world. An everyday adventure.</span><h1>Harborbound</h1><p class="title-subtitle">Your money. Your choices. Your story.</p><p>Explore Tidehaven, meet its characters, collect useful tools, and practice everyday money choices along the way.</p><a class="button" href="#play/setup">Create your traveler <span aria-hidden="true">→</span></a><span class="title-footnote">Free to play · Fictional funds · No account needed</span></div></section>`;
  }
  root.HarborRPGView = {
    sprite,
    map,
    nearby,
    stats,
    tracker,
    dialog,
    world,
    journal,
    title,
  };
})(window);
