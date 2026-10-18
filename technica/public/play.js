/* Visual game pieces; all rewards and money rules live in game.js. */
(function (root) {
  const C = root.HarborContent,
    G = root.HarborGame;
  const dollars = (cents) => "$" + (cents / 100).toFixed(0);
  const paths = {
    home: '<path d="m5 15 15-11 15 11M9 13v21h22V13M16 34V23h8v11"/>',
    bus: '<rect x="8" y="6" width="24" height="27" rx="5"/><path d="M8 21h24M13 6v15m14-15v15M12 33v3m16-3v3"/><circle cx="14" cy="27" r="1"/><circle cx="26" cy="27" r="1"/>',
    ticket:
      '<path d="M5 11h30v7a4 4 0 0 0 0 8v5H5v-5a4 4 0 0 0 0-8zM25 12v4m0 4v3m0 4v3"/>',
    message:
      '<rect x="5" y="8" width="30" height="24" rx="4"/><path d="m6 11 14 12 14-12M20 4v1m0 30v1"/>',
    bag: '<rect x="7" y="12" width="26" height="23" rx="4"/><path d="M14 15V9a6 6 0 0 1 12 0v6M13 26h14"/>',
    boat: '<path d="m5 26 5 9h20l5-9zM20 25V4L6 22h14m3-13 10 13H23"/>',
  };
  const icon = (name) =>
    `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.boat}</svg>`;
  function board(state) {
    const index = Math.min(state.answers.length, 4),
      complete = state.answers.length === 5;
    const chosen = state.pending
      ? C.steps[index].choices[state.pending.choice].title
      : null;
    return `<section class="adventure-board" aria-label="Your week on the harbor map"><div class="board-sky"><div><span class="eyebrow">${complete ? "Your route is complete" : `Day ${index + 1} · ${C.places[index].name}`}</span><p>${complete ? "Five stops. Your own route. A little more practice to take with you." : chosen ? `Your route: ${chosen}.` : C.places[index].mood}</p></div><div class="scene-token" aria-hidden="true">${icon(complete ? "boat" : C.places[index].icon)}<span class="scene-spark">✦</span></div></div><ol class="harbor-map">${C.places.map((p, i) => `<li class="${i < state.answers.length ? "visited" : i === index && !complete ? "here" : "ahead"}" ${i === index && !complete ? 'aria-current="step"' : ""}><div class="map-stop">${icon(p.icon)}<span class="map-marker" aria-hidden="true">${i < state.answers.length ? "✓" : i === index ? "You" : i + 1}</span></div><span class="map-name">${p.name}</span><span class="map-state">${i < state.answers.length ? "Explored" : i === index && !complete ? "You are here" : "Coming next"}</span></li>`).join("")}</ol>${state.answers.length ? `<details class="revisit-menu"><summary>Revisit a day</summary><p class="hint">Replay from a completed stop. Later decisions will be cleared; earned passport stamps stay with you.</p><div class="actions">${state.answers.map((a, i) => `<button class="secondary" data-revisit="${i}">${C.places[i].name}</button>`).join("")}</div></details>` : ""}</section>`;
  }
  function activity(state) {
    const mission = G.missionStatus(state).find(
      (m) => m.step === state.answers.length,
    );
    if (!mission) return "";
    const data = state.missions?.[mission.id];
    let controls = "",
      feedback = "";
    if (mission.id === "plan") {
      const reserved = data || 0,
        left = 14000 - reserved,
        goal = G.snapshot(state).goal;
      controls = `<div class="envelopes"><div class="envelope"><span>Essentials envelope</span><strong>${dollars(reserved)}</strong><span>Need at least $60</span></div><div class="envelope"><span>Purchase envelope</span><strong>${dollars(left)}</strong><span>${goal.item} goal: ${dollars(goal.price)}</span></div></div><div class="note-pile" aria-hidden="true">${Array.from({ length: 14 }, (_, i) => `<span class="money-note ${i < reserved / 1000 ? "reserved" : ""}">$10</span>`).join("")}</div><div class="mission-controls"><button class="secondary" data-mission="plan" data-move="-1000" ${reserved === 0 ? "disabled" : ""}>← Move $10 back</button><button data-mission="plan" data-move="1000" ${reserved === 14000 ? "disabled" : ""}>Set aside $10 →</button></div>`;
      feedback =
        reserved < 6000
          ? `${dollars(6000 - reserved)} more would cover essentials. Try moving another $10 note.`
          : left < goal.price
            ? `Essentials are covered. The purchase envelope is ${dollars(goal.price - left)} short of the goal. Try a different split or take this as a reason a goal might wait.`
            : mission.success;
    } else if (mission.id === "receipt") {
      const items = data || [],
        total =
          (items.includes("fare") ? 1200 : 0) +
          (items.includes("fee") ? 300 : 0);
      controls = `<div class="receipt-puzzle"><div class="charge-options">${[
        ["fare", "$12 travel pass"],
        ["fee", "$3 service fee"],
      ]
        .map(
          ([id, label]) =>
            `<button class="secondary" data-mission="receipt" data-item="${id}" aria-pressed="${items.includes(id)}">${items.includes(id) ? "✓ Added" : "+ Add"} ${label}</button>`,
        )
        .join(
          "",
        )}</div><div class="paper-receipt"><strong>Online pass receipt</strong><p>${items.includes("fare") ? "Travel pass <b>$12</b>" : "Travel pass not added yet"}</p><p>${items.includes("fee") ? "Service fee <b>$3</b>" : "Service fee not added yet"}</p><div class="receipt-total">Total <strong>${dollars(total)}</strong></div></div></div>`;
      feedback = mission.complete
        ? mission.success
        : "Every charge belongs in the total. Tap a charge to add or remove it.";
    } else {
      const clues = data || [];
      controls = `<div class="message-puzzle"><span class="small muted">Fictional message · Delivery desk</span><p>“Your parcel is on hold. <button data-mission="message" data-item="urgency" aria-pressed="${clues.includes("urgency")}">Pay in the next 10 minutes</button> or lose it. Send a <button data-mission="message" data-item="gift" aria-pressed="${clues.includes("gift")}">$15 gift card code</button> to release it.”</p><div class="clue-notes">${clues.includes("urgency") ? "<p>✓ Urgency can pressure you to act before checking.</p>" : ""}${clues.includes("gift") ? "<p>✓ A gift-card code can let someone spend its balance.</p>" : ""}</div></div><button class="secondary" data-mission="message" data-item="verify" aria-pressed="${clues.includes("verify")}">${clues.includes("verify") ? "✓ Independent check chosen" : "Find the official delivery website myself"}</button>`;
      feedback = mission.complete
        ? mission.success
        : "Inspect both highlighted clues and choose a check outside the message. No timer is running.";
    }
    return `<details class="hands-on-mission" ${data !== undefined ? "open" : ""}><summary><span class="mission-icon" aria-hidden="true">${mission.complete ? "✓" : "✦"}</span><span><strong>${mission.label}</strong><span class="small">Optional hands-on activity · ${mission.complete ? "Stamp earned" : "Earn a skill stamp"}</span></span><span aria-hidden="true">+</span></summary><div class="mission-body"><p>${mission.instruction}</p>${controls}<p class="mission-feedback" role="status">${feedback}</p>${mission.complete ? `<span class="activity-stamp">✦ ${mission.reward}</span>` : ""}${mission.id === "plan" ? '<p class="hint">This is a practice board. The story keeps its starting split: $60 for essentials and $80 for decisions.</p>' : ""}</div></details>`;
  }
  function passport(saved) {
    const p = G.passport(saved.mastered, saved.missionStamps);
    const explored = new Set(saved.explored || []).size;
    const entries = [
      ...C.steps.map((s, i) => ({
        name: s.skill,
        earned: p.earned.includes(s.skill),
        hint: `Explain the trade-off on day ${i + 1}.`,
      })),
      ...C.missions.map((m) => ({
        name: m.reward,
        earned: p.earned.includes(m.reward),
        hint: `Try the hands-on activity on day ${m.step + 1}.`,
      })),
    ];
    return `<section class="skill-passport"><div class="passport-heading"><div><span class="eyebrow">Your skill passport</span><h2>${p.rank}</h2><p>${p.earned.length} of ${p.total} unique stamps collected · ${explored} different story choices explored</p></div><div class="passport-seal" aria-label="${p.earned.length} skill stamps earned"><span aria-hidden="true">✦</span><strong>${p.earned.length}/${p.total}</strong></div></div><label class="sr-only" for="passport-progress">Unique learning stamps collected</label><progress id="passport-progress" value="${p.earned.length}" max="${p.total}">${p.earned.length} of ${p.total}</progress><details><summary>Open your stamp collection</summary><ul class="stamp-collection">${entries.map((e) => `<li class="${e.earned ? "earned" : "unearned"}"><span class="stamp-symbol" aria-hidden="true">${e.earned ? "✦" : "◇"}</span><strong>${e.name}</strong><span>${e.earned ? "Collected · stays with you on replay" : e.hint}</span></li>`).join("")}</ul></details><p class="hint">Each stamp is earned once through practice. Explore at your pace; there is no deadline or wealth ranking.</p></section>`;
  }
  function hud(saved) {
    const p = G.passport(saved.mastered, saved.missionStamps);
    return `<div class="board-progress"><span><strong>${p.rank}</strong> · ${p.earned.length}/${p.total} skill stamps</span><span class="skill-stars" aria-hidden="true">${Array.from({ length: p.total }, (_, i) => `<span class="${i < p.earned.length ? "collected" : ""}">${i < p.earned.length ? "✦" : "◇"}</span>`).join("")}</span></div>`;
  }
  root.HarborPlay = { board, activity, passport, hud, icon };
})(window);
