function renderTokens() {
  state.topic = "tokenization";
  page(
    "Understand tokenized ownership",
    "Guided example · simulation only",
    "Tokenization means using digital tokens to represent an asset or rights connected to it. What those tokens actually give you depends on the underlying agreement.",
    `
  <div class="callout warning"><strong>Keep these limits in view</strong><ul><li>A token alone does not guarantee legal ownership.</li><li>Finding a buyer is not guaranteed.</li><li>Digital systems can have security and access risks.</li></ul><p>This example creates no real property rights. It is not an investment or a deployed blockchain. No money or wallet is needed.</p></div>
  <div class="token-steps"><section class="panel"><h2>1. Create the digital units</h2><p>Imagine a fictional Coast House agreement divided into <strong>100 digital units</strong>. One unit represents 1 of the agreement’s 100 recorded shares. This made-up agreement has no legal effect.</p><p>Maya starts with all 100 units. Jordan starts with none.</p><button class="button" id="issue-tokens" ${state.issued ? "disabled" : ""}>${state.issued ? "100 units created" : "Create 100 digital units"}</button><div id="issue-feedback" class="feedback" aria-live="polite"></div></section>
  <section class="panel"><h2>2. Transfer a few units</h2><p>The transfer rules require different people, a positive whole number of units, and enough units in the sender’s balance.</p><form id="transfer-form"><fieldset id="transfer-fields" class="transfer-controls" ${state.issued ? "" : "disabled"}><legend class="sr-only">Choose a digital-unit transfer</legend><div class="transfer-fields"><div><label for="transfer-from">From</label><select id="transfer-from"><option>Maya</option><option>Jordan</option></select></div><div><label for="transfer-to">To</label><select id="transfer-to"><option>Jordan</option><option>Maya</option></select></div></div><div class="field"><label for="transfer-amount">Digital units to move</label><input id="transfer-amount" type="number" value="${state.tokenAmount || 10}" min="1" max="100" step="1" required></div><button class="button" type="submit">Transfer units</button><button class="text-button field" id="fail-transfer" type="button">Try transferring more than the sender has</button></fieldset></form><div id="transfer-feedback" class="feedback" aria-live="polite"></div></section></div>
  <section class="panel field"><h2>3. Check the ownership record</h2><p>This ownership record is also called a <strong>ledger</strong>. Compare both balances before and after the latest attempt. The total stays at 100 units.</p><div id="token-ledger" aria-live="polite"></div><ol id="token-log" class="ledger-log" aria-label="Recent transfer results"></ol><button class="button secondary small" id="token-reset">Reset the example</button></section>
  <details class="panel token-more"><summary>Learn more: what a real system would need</summary><h3>Custody and access</h3><p>Custody concerns who holds assets or controls access. Lost keys and failed recovery can prevent access; an operator’s controls also matter.</p><h3>Settlement and software rules</h3><p>Settlement means completing a transfer. Here it is an immediate change to a local record. Smart contracts are software that may automate rules; they can have bugs, restrictions, or administrator powers.</p><h3>Legal and regulatory questions</h3><p>The agreement must explain rights and responsibilities and connect the record to the underlying asset. Obligations vary by structure and applicable law. A digital format does not settle those questions.</p>${sourceLinks(["tokens"])}</details><div class="button-row field"><a href="#lesson/tokenization" class="button secondary">Continue the ownership lesson</a><a href="#investigations" class="text-button">Review a tokenized offer</a></div>`,
  );
  drawOwnership();
  on("#issue-tokens", "click", () => {
    state.issued = true;
    state.ledger = { Maya: 100, Jordan: 0 };
    state.tokenBefore = { ...state.ledger };
    state.log = [
      {
        title: "Created 100 digital units",
        detail:
          "Maya holds 100; Jordan holds 0. No real ownership was created.",
      },
    ];
    $("#transfer-fields").disabled = false;
    $("#issue-tokens").disabled = true;
    $("#issue-tokens").textContent = "100 units created";
    feedback(
      $("#issue-feedback"),
      "The units are recorded. Transfer 10 to Jordan, then compare the balances.",
    );
    drawOwnership();
  });
  function move(from, to, amount) {
    if (!state.issued) return;
    state.tokenBefore = { ...state.ledger };
    try {
      state.ledger = Finance.transfer(state.ledger, from, to, amount);
      const detail = `${from} now has ${state.ledger[from]} units; ${to} has ${state.ledger[to]}. The total remains 100.`;
      state.log.unshift({
        title: `Transferred ${amount} units from ${from} to ${to}`,
        detail,
      });
      feedback($("#transfer-feedback"), detail);
    } catch (error) {
      state.log.unshift({
        title: "Transfer not completed",
        detail: error.message,
      });
      feedback($("#transfer-feedback"), error.message, "error");
    }
    state.log = state.log.slice(0, 5);
    drawOwnership();
  }
  on("#transfer-form", "submit", (e) => {
    e.preventDefault();
    move(
      $("#transfer-from").value,
      $("#transfer-to").value,
      Number($("#transfer-amount").value),
    );
  });
  on("#transfer-amount", "input", (e) => (state.tokenAmount = e.target.value));
  on("#fail-transfer", "click", () => {
    const from = $("#transfer-from").value,
      to = from === "Maya" ? "Jordan" : "Maya";
    move(from, to, state.ledger[from] + 1);
  });
  on("#token-reset", "click", () => {
    state.issued = false;
    state.ledger = { Maya: 100, Jordan: 0 };
    state.tokenBefore = null;
    state.tokenAmount = 10;
    state.log = [];
    renderTokens();
  });
}
function drawOwnership() {
  const before = state.tokenBefore || state.ledger;
  $("#token-ledger").innerHTML = state.issued
    ? `<div class="table-wrap"><table class="ledger"><caption>Fictional Coast House · latest attempt</caption><thead><tr><th>Person</th><th>Before</th><th>After</th></tr></thead><tbody>${["Maya", "Jordan"].map((n) => `<tr><td>${n}</td><td>${before[n]} units</td><td>${state.ledger[n]} units</td></tr>`).join("")}</tbody><tfoot><tr><th>Total</th><td>${before.Maya + before.Jordan} units</td><td>${state.ledger.Maya + state.ledger.Jordan} units</td></tr></tfoot></table></div>`
    : '<p class="empty-state">Create the 100 units in step 1 to see Maya and Jordan’s record.</p>';
  $("#token-log").innerHTML = state.log
    .map(
      (e) =>
        `<li><strong>${esc(e.title)}</strong><span>${esc(e.detail)}</span></li>`,
    )
    .join("");
}
