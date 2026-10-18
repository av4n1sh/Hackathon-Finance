/* Short festival games: one task, visible consequences, and a useful takeaway. */
(function (root) {
  const F = root.HarborFestival;
  const money = (c) => "$" + (c / 100).toFixed(2);
  function cover(id) {
    const art =
      id === "cash"
        ? '<path fill="#deb36a" stroke="#5a704e" stroke-width="4" d="M24 93h152v83H24z"/><path fill="#f6e4b0" d="M32 105h136v51H32z"/><path fill="#64866a" d="M14 47h172l-12 39H26z"/><path fill="#edc77d" d="M39 47h25l-3 39H33zm51 0h24l3 39H88zm50 0h24l10 39h-28z"/><rect x="59" y="114" width="83" height="36" rx="5" fill="#b9d59d" stroke="#5a704e" stroke-width="3"/><text x="100" y="140" text-anchor="middle" font-size="25" fill="#36583e">$5</text><circle cx="46" cy="179" r="15" fill="#f5d16d" stroke="#aa8749" stroke-width="3"/><circle cx="155" cy="167" r="19" fill="#f5d16d" stroke="#aa8749" stroke-width="3"/>'
        : id === "route"
          ? '<path fill="#c9dfd3" d="M19 40h163v142H19z"/><path fill="#a3c5bd" d="m87 40 27 47-17 49 22 46h38l-28-53 20-43-25-46z"/><path d="M37 144 58 70h95l16 65" fill="none" stroke="#f9efc6" stroke-width="14" stroke-linecap="round"/><path d="M83 70h53" stroke="#9a845f" stroke-width="16"/><path stroke="#f0d7a1" stroke-width="3" stroke-dasharray="3 7" d="M83 70h53"/><path fill="#d9a66a" stroke="#6e6f4e" stroke-width="3" d="M21 133h35v35H21z"/><path stroke="#6e6f4e" stroke-width="3" d="m23 135 31 31m-31 0 31-31"/><path stroke="#466c50" stroke-width="5" d="M163 117v50"/><path fill="#d19155" d="m165 117 25 10-25 12z"/>'
          : '<path d="M75 66V40a25 25 0 0 1 50 0v26" fill="none" stroke="#8b7950" stroke-width="7"/><rect x="52" y="63" width="96" height="112" rx="19" fill="#f8e6ac" stroke="#8b7950" stroke-width="7"/><path fill="#ebb956" d="M100 84c-4 24-22 29-22 48a22 22 0 0 0 44 0c0-19-17-29-22-48Z"/><path stroke="#8b7950" stroke-width="7" stroke-linecap="round" d="M43 180h114M67 78v80m66-80v80"/><path fill="#e4bb62" d="m164 39 4 11 11 4-11 4-4 11-4-11-11-4 11-4zM31 87l3 8 8 3-8 3-3 8-3-8-8-3 8-3z"/>';
    return `<svg viewBox="0 0 200 210" aria-hidden="true">${art}</svg>`;
  }
  const avatar = (kind = "gull") =>
    `<span class="game-avatar ${kind}" aria-hidden="true">${kind === "gull" ? '<svg viewBox="0 0 80 80"><path fill="#fef9df" d="M14 45C11 15 57 8 60 35l15 9-17 7C48 73 20 70 9 54L2 38Z"/><path fill="#a9beb1" d="m18 43 29-7-12 22Z"/><path fill="#e3b955" d="m60 35 15 9-17 7Z"/><circle cx="53" cy="32" r="3" fill="#284737"/></svg>' : '<svg viewBox="0 0 80 80"><path fill="#c57b46" d="M14 35 9 7l25 16 25-9 10 30-13 26H26Z"/><path fill="#ffedc7" d="m19 42 22 12 22-13-10 24H29Z"/><path stroke="#274936" stroke-width="4" stroke-linecap="round" d="M25 35h3m22 0h3m-16 16h7"/></svg>'}</span>`;
  function brief(name, line, kind) {
    return `<div class="game-brief">${avatar(kind)}<div><strong>${name}</strong><p>${line}</p></div></div>`;
  }
  function win(title, takeaway, actions) {
    return `<section class="game-win" role="status"><div class="game-sparkles" aria-hidden="true">✦ <span>✦</span> ✦</div><h3>${title}</h3><p>${takeaway}</p><div class="actions">${actions}</div></section>`;
  }
  const close =
    '<button class="text-button" data-action="close-festival">Back to games</button>';
  function workshop(f) {
    const plan = F.repairStatus(f.parts),
      categories = Object.keys(F.parts),
      category = categories[f.buildStep],
      labels = ["The lens", "The frame", "Getting it home"],
      prompts = [
        "Start with the glow.",
        "Give your lantern a frame.",
        "One last choice: pickup or delivery?",
      ],
      ready = f.workshopBuilt,
      chosen = categories.filter((c) => f.parts[c]).length;
    const art = `<div class="crafted-lantern ${f.parts.lens ? "has-lens" : ""} ${f.parts.mount ? "has-frame" : ""} ${plan.ready && plan.valid ? "assembled" : ""}" aria-hidden="true"><div class="craft-handle"></div><div class="craft-frame"><i></i></div><div class="craft-base"></div></div>`;
    if (ready)
      return `<div class="finished-build">${art}</div>${win("Look at that glow!", `Your lantern costs ${money(plan.total)}, leaving ${money(2000 - plan.total)} of the $20 fund. The useful trick: include repairs and delivery when comparing prices.`, '<button data-open-festival="route">Try special delivery →</button>' + close)}<div class="game-after"><button class="secondary" data-festival-action="reset-workshop">Make a different lantern</button><a href="#learn/fees">Explore full prices →</a></div>`;
    const tip =
      f.parts.lens === "reclaimed"
        ? "The $8 lens needs a $3 repair. Its real cost is $11 before the frame or delivery."
        : f.parts.lens === "new"
          ? "The new lens costs $14 with no repair. Compare the whole build, not just one price."
          : "A low sticker price can come with extra costs. Repair charges count too.";
    return `${brief("Mina’s lantern challenge", "“Can you make something lovely with this $20 fund? You choose the parts.”", "fox")}<div class="workshop-grid guided-build"><div><div class="build-steps" aria-label="Build steps">${categories.map((c, i) => `<button class="secondary" data-festival-action="build-step" data-value="${i}" aria-pressed="${f.buildStep === i}"><span>${f.parts[c] ? "✓" : i + 1}</span>${labels[i]}</button>`).join("")}</div><h3 id="build-stage-heading" tabindex="-1">${prompts[f.buildStep]}</h3><p class="small muted">Choice ${f.buildStep + 1} of 3 · Tap one option. You can change it anytime.</p><fieldset class="part-group"><legend class="sr-only">${labels[f.buildStep]}</legend>${F.parts[category].map((item, i) => `<button data-festival-action="part" data-value="${category}:${item.id}" aria-pressed="${f.parts[category] === item.id}"><span class="part-art ${category} option-${i}" aria-hidden="true">${category === "lens" ? "◉" : category === "mount" ? "▱" : i === 0 ? "♧" : "▰"}</span><strong>${item.name}</strong><span>${item.note}</span></button>`).join("")}</fieldset><div class="game-tip"><strong>A tiny money trick</strong><p>${tip}</p></div></div><aside class="build-preview" aria-label="Your lantern and budget">${art}<h3>${chosen}/3 choices made</h3><div class="budget-track" role="meter" aria-label="Workshop fund used" aria-valuemin="0" aria-valuemax="${Math.max(plan.total, 2000)}" aria-valuenow="${plan.total}" aria-valuetext="${money(plan.total)} of a $20 fund${plan.total > 2000 ? ", over the fund" : ""}"><span class="${plan.total > 2000 ? "over" : ""}" style="width:${Math.min(100, plan.total / 20)}%"></span></div>${plan.lines.map((l) => `<div class="build-line"><span>${l.name}</span><strong>${money(l.cents)}</strong></div>`).join("")}<div class="build-total ${plan.total > 2000 ? "over-budget" : ""}"><span>Total</span><strong>${money(plan.total)} / $20</strong></div><p class="hint" role="status">${plan.total > 2000 ? `Over by ${money(plan.total - 2000)}. Tap a step above to swap something.` : plan.valid ? `${money(2000 - plan.total)} left. Ready to see it glow?` : "Your lantern comes together with each choice."}</p><button data-festival-action="submit-workshop" ${plan.ready ? "" : "disabled"}>Light my lantern ✦</button></aside></div>`;
  }
  function cash(f) {
    const order = F.cashOrders[f.cashRound],
      status = F.cashStatus(f.coins, f.cashRound),
      served =
        JSON.stringify(f.cashReceipts[order.id]) === JSON.stringify(f.coins);
    const customer = brief(
      `${order.visitor} · Visitor ${f.cashRound + 1} of 3`,
      `“${order.request}”`,
      f.cashRound === 1 ? "fox" : "gull",
    );
    if (served)
      return `${customer}<div class="cash-equation"><span>${money(status.received)}<small>paid</small></span><b>−</b><span>${money(status.sale)}<small>spent</small></span><b>=</b><span>${money(status.due)}<small>change</small></span></div>${win(`${order.visitor}’s order is ready!`, "Change is the part of a payment the visitor hasn’t spent. Different combinations of notes can make the same amount.", (f.cashRound < 2 ? '<button data-festival-action="next-customer">Another visitor →</button>' : '<button data-open-festival="workshop">Try the lantern lab →</button>') + close)}<div class="game-after"><button class="secondary" data-festival-action="clear-cash">Try different notes</button><button class="text-button" data-festival-action="restart-cash">Start the queue again</button></div>`;
    return `${customer}<div class="ticket-counter quick-counter"><div class="festival-tickets" aria-label="${order.quantity} items at ${money(order.price)} each">${Array.from({ length: order.quantity }, () => `<span class="festival-ticket"><span aria-hidden="true">${order.icon}</span>${order.item}<strong>${money(order.price)}</strong></span>`).join("")}</div><div class="counter-math"><span>Order total <strong>${money(status.sale)}</strong></span><span>${order.visitor} paid <strong>${money(status.received)}</strong></span></div><h3>What goes back to ${order.visitor}?</h3><p class="small muted">Tap notes to fill the tray, then hand over the change.</p><div class="cash-drawer">${[500, 200, 100].map((n) => `<button data-festival-action="coin" data-value="${n}" aria-label="Add ${n / 100} dollars to the change tray"><span>$${n / 100}</span><small>+ Add note</small></button>`).join("")}</div><div class="change-tray" aria-label="Change selected">${f.coins.length ? f.coins.map((c) => `<span class="tray-note">$${c / 100}</span>`).join("") : "<p>Your tray is waiting for its first note.</p>"}</div><div class="build-total"><span>In the tray</span><strong>${money(status.total)}</strong></div><div class="actions"><button data-festival-action="submit-cash">Hand over change →</button><button class="secondary" data-festival-action="undo-cash" ${f.coins.length ? "" : "disabled"}>Undo</button><button class="text-button" data-festival-action="clear-cash">Clear</button></div><details class="optional game-help"><summary>Show me a money trick</summary><p>Start with the amount paid and take away the order total: ${money(status.received)} − ${money(status.sale)} = <strong>${money(status.due)} change</strong>. Or count up from ${money(status.sale)} to ${money(status.received)}.</p></details></div>`;
  }
  function routeScene(path, complete) {
    return `<div class="route-scene ${complete ? "delivered" : ""}" aria-hidden="true"><svg viewBox="0 0 480 205"><path fill="#e3edd3" d="M0 0h480v205H0z"/><path fill="#b9d9d4" d="M165 0h145l-20 85 30 75-15 45H150l24-72-25-55z"/><path class="scenic-route ${path === "bridge" ? "selected" : ""}" d="M55 100 100 45H380l45 55"/><path class="scenic-route ${path === "coast" ? "selected" : ""}" d="M55 100 100 165H380l45-65"/><path stroke="#b09163" stroke-width="19" d="M185 45h105"/><path stroke="#e5cf9f" stroke-width="3" stroke-dasharray="3 9" d="M185 45h105"/><text x="240" y="24" text-anchor="middle">Bridge · $2 · 6 steps</text><text x="240" y="190" text-anchor="middle">Coast · free · 8 steps</text><circle cx="55" cy="100" r="24" fill="#fff9df"/><text x="55" y="107" text-anchor="middle" class="scene-symbol">${complete ? "✓" : "▣"}</text><circle cx="425" cy="100" r="24" fill="#fff9df"/><text x="425" y="107" text-anchor="middle" class="scene-symbol">${complete ? "▣" : "⚑"}</text><text x="55" y="141" text-anchor="middle">You</text><text x="425" y="141" text-anchor="middle">Stage</text></svg>${complete ? '<span class="delivery-badge">✦ Delivered!</span>' : ""}</div>`;
  }
  function manualRoute(f, r) {
    return `<details class="manual-delivery"><summary>Want to steer the crate yourself?</summary><p>Reset the delivery, then use the arrow buttons or focus the board and use arrow keys.</p><div class="delivery-layout"><div class="delivery-board" tabindex="0" aria-label="Delivery route puzzle"><div class="delivery-grid">${F.routeRows.flatMap((row, y) => Array.from(row).map((tile, x) => `<div class="delivery-tile ${tile === "#" ? "closed" : tile === "$" ? "toll" : "open"} ${x === F.routeGoal.x && y === F.routeGoal.y ? "stage" : ""}">${x === F.routeGoal.x && y === F.routeGoal.y ? "<span>⚑<small>Stage</small></span>" : tile === "#" ? '<span aria-hidden="true">×</span>' : tile === "$" ? "<span>$2<small>Bridge</small></span>" : ""}</div>`)).join("")}</div><div class="delivery-player" style="left:${(r.x / 5) * 100}%;top:${(r.y / 4) * 100}%" aria-hidden="true">▣</div></div><aside><p id="delivery-position">Crate: column ${r.x + 1}, row ${r.y + 1}. Stage: column 5, row 2.<br>${r.steps} steps · ${money(r.cost)} spent</p><div class="dpad delivery-pad" aria-label="Crate movement">${[
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
      )}</div><button class="text-button" data-festival-action="reset-route">Reset this delivery</button></aside></div></details>`;
  }
  function route(f) {
    const r = F.routeStatus(f.moves),
      job = F.deliveryJobs[f.deliveryJob],
      path = r.complete ? (r.pass ? "bridge" : "coast") : null,
      match = !job.preferred || job.preferred === path;
    return `${brief(`Delivery ${f.deliveryJob + 1} · ${job.title}`, job.request, "gull")}${routeScene(path, r.complete)}<div class="route-options">${Object.entries(
      F.deliveryPaths,
    )
      .map(([id, option]) => {
        const stats = F.routeStatus(option.moves);
        return `<button class="route-option" data-festival-action="choose-route" data-value="${id}" aria-pressed="${path === id}"><span class="route-option-icon" aria-hidden="true">${id === "bridge" ? "⌁" : "♧"}</span><span><strong>${option.name}</strong><small>${stats.steps} steps · ${stats.cost ? "$2 pass" : "$0 cost"}</small></span><span aria-hidden="true">→</span></button>`;
      })
      .join(
        "",
      )}</div>${r.complete ? `<section class="route-result" role="status"><strong>${match ? "A delivery that fits the brief!" : "Delivered! Here’s the trade-off."}</strong><p>${r.steps} steps · ${money(r.cost)} spent · ${money(200 - r.cost)} left. ${match ? (r.pass ? "You used the fund to save two steps." : "You took the longer path and kept the fund.") : job.preferred === "coast" ? "The free coast path would keep the $2 for supplies. Try it above." : "The bridge would save two steps when speed matters. Try it above."}</p></section><section class="route-reflection"><h3>What does the $2 bridge pass buy?</h3><div class="choices">${["A shorter trip", "A lower money cost"].map((answer, i) => `<button class="choice" data-festival-action="route-reason" data-value="${i}" aria-pressed="${f.routeReason === i}">${answer}<span aria-hidden="true">→</span></button>`).join("")}</div>${f.routeReason !== null ? `<p class="game-tip" role="status">${f.routeReason === 0 ? "Exactly!" : "Try comparing again."} The bridge costs $2 and saves two steps. The coast costs $0 and takes longer. A useful choice depends on your needs.</p>` : ""}</section><div class="actions"><button data-festival-action="next-delivery">Try a new delivery →</button>${close}</div>` : '<p class="hint">Tap a route. Both reach the stage; compare what matters for this delivery.</p>'}${manualRoute(f, r)}`;
  }
  function dialog(saved, id) {
    const spot = F.spots.find((s) => s.id === id);
    if (!spot) return "";
    return `<dialog id="festival-dialog" class="festival-dialog mini-game-dialog" aria-labelledby="festival-dialog-title"><header class="challenge-head"><div><span class="eyebrow">Little games · Useful money skills</span><h2 id="festival-dialog-title">${spot.title}</h2></div><button class="secondary" data-action="close-festival" aria-label="Close festival challenge">×</button></header><div class="challenge-body">${{ workshop, cash, route }[id](saved.festival)}<p id="challenge-feedback" role="status" class="challenge-feedback"></p><p class="challenge-funds">Fictional money · No timer · Try again anytime</p></div></dialog>`;
  }
  root.HarborMiniGames = { dialog, cover };
})(window);
