"use strict";
function renderMoney() {
  const money = (n) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  state.topic = "etf";
  page(
    "Make sense of everyday money.",
    "Money Practice",
    "Explore fictional account activity, compare money in and out, and practice a budget decision.",
    `<section class="panel"><h2>Choose your practice data</h2><p>Nessie provides synthetic banking data. Local examples are authored by Harbor Academy. Neither connects a real bank account or moves money.</p><div class="button-row"><button class="button" id="money-sandbox">Load Nessie sandbox</button><button class="button secondary" id="money-example">Use local example</button></div><p id="money-status" role="status" class="note field">No Capital One request has been made from this screen.</p></section><div id="money-content" class="field"></div>`,
  );
  const root = $("#money-content"),
    message = $("#money-status");
  async function load(mode, account) {
    const epoch = viewVersion;
    $("#money-sandbox").disabled = true;
    $("#money-example").disabled = true;
    message.textContent =
      mode === "sandbox"
        ? "Requesting synthetic account activity from Nessie..."
        : "Loading an authored local example...";
    root.inert = true;
    try {
      const data = await api("/api/money", { mode, account });
      if (epoch !== viewVersion) return;
      if (data.source === "unavailable") {
        state.moneyData = null;
        root.replaceChildren();
        message.textContent =
          data.issue +
          " No account data is displayed. You can choose the local example.";
        return;
      }
      state.moneyData = data;
      show(data);
    } catch (error) {
      if (epoch === viewVersion) {
        state.moneyData = null;
        root.replaceChildren();
        message.textContent = error.message;
      }
    } finally {
      if (epoch === viewVersion) {
        $("#money-sandbox").disabled = false;
        $("#money-example").disabled = false;
        root.inert = false;
      }
    }
  }
  function show(data) {
    message.textContent =
      data.source === "sandbox"
        ? "Capital One Nessie request succeeded. Synthetic sandbox data, fetched " +
          new Date(data.loadedAt).toLocaleTimeString() +
          "."
        : "Authored local example. Capital One was not called.";
    const s = data.summary;
    if (!data.account) {
      root.innerHTML =
        '<section class="panel"><h2>No eligible sandbox accounts</h2><p>Nessie returned no checking or savings accounts for this key. Create synthetic practice data in your Nessie developer sandbox, then reload here. Harbor does not create accounts or transactions. You can use the local example meanwhile.</p></section>';
      return;
    }
    root.innerHTML = `<section class="panel"><span class="status ${data.source === "sandbox" ? "live" : "demo"}">${data.source === "sandbox" ? "Nessie sandbox data" : "Local example"}</span><h2 class="field">${esc(data.account.label)}</h2>${data.accounts.length ? `<label for="money-account">Explore a sandbox account</label><select id="money-account">${data.accounts.map((a) => `<option value="${esc(a.handle)}" ${a.handle === data.account.handle ? "selected" : ""}>${esc(a.label)}</option>`).join("")}</select>` : ""}<div class="metrics field"><div class="metric"><strong>${money(data.account.balance)}</strong><span>Reported account balance</span></div><div class="metric"><strong>${money(s.incoming)}</strong><span>Completed deposits shown</span></div><div class="metric"><strong>${money(s.outgoing)}</strong><span>Completed withdrawals shown</span></div><div class="metric"><strong>${money(s.net)}</strong><span>Net of completed activity shown</span></div></div><p class="note">This is a partial activity view, not a full statement: deposits and withdrawals only, across all returned dates. Purchases, transfers, and bills are not included. The reported balance is independent of these totals. ${s.excluded} pending or cancelled record(s) excluded from calculations.</p><h3>Activity history</h3><div class="table-wrap"><table><caption>${data.source === "sandbox" ? "Synthetic Nessie" : "Authored example"} deposits and withdrawals</caption><thead><tr><th>Date</th><th>Description</th><th>Type</th><th>Local category</th><th>Status</th><th>Amount</th></tr></thead><tbody>${data.rows.length ? data.rows.map((r) => `<tr><td>${esc(r.date)}</td><td>${esc(r.description)}</td><td>${r.kind === "deposit" ? "Money in" : "Money out"}</td><td>${esc(r.category)}</td><td>${esc(r.status)}</td><td>${money(r.amount)}</td></tr>`).join("") : '<tr><td colspan="6">No deposits or withdrawals returned.</td></tr>'}</tbody></table></div></section>
    <div class="grid-equal field"><section class="panel"><h2>Where did the money go?</h2><p class="note">Harbor groups descriptions using simple keyword rules. Categories may be wrong; Nessie does not supply these classifications here. Only completed withdrawals count.</p><div class="table-wrap"><table><caption>Completed withdrawals by local category</caption><thead><tr><th>Category</th><th>Total shown</th></tr></thead><tbody>${s.categories.length ? s.categories.map((c) => `<tr><td>${esc(c.name)}</td><td>${money(c.amount)}</td></tr>`).join("") : '<tr><td colspan="2">No completed withdrawals to compare.</td></tr>'}</tbody></table></div>${s.categories.length ? `<form id="money-check" class="field"><label for="money-largest">Which category has the largest completed outflow?</label><select id="money-largest" required><option value="">Choose a category</option>${s.categories.map((c) => `<option>${esc(c.name)}</option>`).join("")}</select><button type="submit" class="button secondary field">Check my reasoning</button></form><p id="money-check-result" role="status"></p><label for="money-budget">Try a total outflow limit for this activity ($)</label><input id="money-budget" type="number" min="0" max="1000000" step="1" value="150"><p id="money-budget-result" class="callout" role="status"></p><p class="note">This compares your limit with the returned activity, not a monthly forecast. No transactions will change.</p>` : ""}</section>
    <section class="panel"><h2>Understand the decision</h2><p>Ask about budgeting, pending activity, or what these totals can and cannot tell you. Gemini receives the question, aggregate totals, category totals, and reported balance. Account identifiers and raw descriptions are excluded.</p><form id="money-ask"><label for="money-question">Your learning question</label><textarea id="money-question" maxlength="1200" required rows="3" placeholder="Why isn't the balance equal to money in minus money out?"></textarea><button class="button field" type="submit">Explain with Gemini</button></form><div id="money-answer" class="feedback" aria-live="polite"></div></section></div>`;
    if ($("#money-account"))
      $("#money-account").onchange = (e) => load("sandbox", e.target.value);
    if ($("#money-check")) {
      $("#money-largest").value = draft.get("money-largest", "");
      $("#money-largest").onchange = (e) =>
        draft.set("money-largest", e.target.value);
      $("#money-check").onsubmit = (e) => {
        e.preventDefault();
        const chosen = s.categories.find(
          (c) => c.name === $("#money-largest").value,
        );
        $("#money-check-result").textContent =
          chosen?.amount === s.categories[0].amount
            ? "Correct. " +
              chosen.name +
              " has a largest completed outflow of " +
              money(chosen.amount) +
              ". A large category is a prompt to investigate your needs, not proof of a bad choice."
            : "Compare the totals in the table, then try again.";
      };
      $("#money-budget").value = draft.get("money-budget", "150");
      const draw = () => {
        const field = $("#money-budget"),
          value = Number(field.value);
        draft.set("money-budget", field.value);
        $("#money-budget-result").textContent =
          field.value === "" ||
          !Number.isFinite(value) ||
          value < 0 ||
          value > 1000000
            ? "Enter a limit between $0 and $1,000,000."
            : s.outgoing <= value
              ? money(Math.round((value - s.outgoing) * 100) / 100) +
                " remains within your fictional limit."
              : money(Math.round((s.outgoing - value) * 100) / 100) +
                " over your fictional limit. Try a different limit or consider which expenses were necessary.";
      };
      $("#money-budget").oninput = draw;
      draw();
    }
    $("#money-question").value = draft.get("money-question", "");
    $("#money-question").oninput = (e) =>
      draft.set("money-question", e.target.value);
    $("#money-ask").onsubmit = async (e) => {
      e.preventDefault();
      const epoch = viewVersion,
        btn = $("button", e.currentTarget),
        target = $("#money-answer");
      btn.disabled = true;
      target.textContent = "Preparing an explanation...";
      try {
        const answer = await api("/api/money/explain", {
          text: $("#money-question").value,
          loadedAt: data.loadedAt,
        });
        if (epoch !== viewVersion) return;
        target.innerHTML = `${status(answer.source, answer.source === "live" ? "Live Gemini explanation" : "Authored fallback")}<p>${esc(answer.answer)}</p><div class="callout">${esc(answer.nextStep)}</div>${answer.issue ? `<p class="note">${esc(answer.issue)}</p>` : ""}`;
      } catch (error) {
        if (epoch === viewVersion) feedback(target, error.message, "error");
      } finally {
        btn.disabled = false;
      }
    };
  }
  $("#money-sandbox").onclick = () => load("sandbox");
  $("#money-example").onclick = () => load("example");
  if (state.moneyData) show(state.moneyData);
}
