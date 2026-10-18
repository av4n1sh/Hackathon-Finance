"use strict";
const crypto = require("node:crypto"),
  { key, scrub, readJson, httpFailure, failure } = require("./providers");
// Current official docs: https://nessieisreal.com/docs and /nessie-openapi-spec.yaml.
// Nessie's production host serves synthetic sandbox banking data, not real bank accounts.
const BASE = "https://prod-api.nessieisreal.com";
const cents = (n) => {
  if (typeof n !== "number" || !Number.isFinite(n) || n < 0 || n > 1e9)
    throw new Error("Invalid amount");
  return Math.round(n * 100);
};
function summarize(rows) {
  const groups = {};
  let incoming = 0,
    outgoing = 0,
    excluded = 0;
  for (const row of rows) {
    if (row.status !== "completed") {
      excluded++;
      continue;
    }
    const amount = cents(row.amount);
    if (row.kind === "deposit") incoming += amount;
    else {
      outgoing += amount;
      groups[row.category] = (groups[row.category] || 0) + amount;
    }
  }
  return {
    incoming: incoming / 100,
    outgoing: outgoing / 100,
    net: (incoming - outgoing) / 100,
    excluded,
    categories: Object.entries(groups)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([name, amount]) => ({ name, amount: amount / 100 })),
  };
}
function category(description) {
  const text = description.toLowerCase();
  if (/grocery|groceries|food|cafe|coffee|restaurant/.test(text)) return "Food";
  if (/bus|train|transit|transport|gas|fuel/.test(text)) return "Transport";
  if (/rent|utility|utilities|electric|water/.test(text)) return "Home";
  if (/movie|game|music|subscription/.test(text)) return "Leisure";
  return "Uncategorized";
}
function normalize(rows, kind) {
  if (!Array.isArray(rows) || rows.length > 1000)
    throw new Error("Unexpected transaction response");
  return rows.map((row) => {
    const amount = cents(row.amount) / 100;
    if (!["pending", "cancelled", "completed"].includes(row.status))
      throw new Error("Unknown transaction status");
    const description = scrub(
      typeof row.description === "string"
        ? row.description.slice(0, 150)
        : "No description provided",
    );
    return {
      kind,
      amount,
      status: row.status,
      date:
        typeof row.transaction_date === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(row.transaction_date)
          ? row.transaction_date
          : "Not supplied",
      description,
      category: kind === "deposit" ? "Money in" : category(description),
    };
  });
}
function example() {
  const rows = [
    {
      kind: "deposit",
      amount: 400,
      status: "completed",
      date: "2026-10-01",
      description: "Fictional part-time work",
      category: "Money in",
    },
    {
      kind: "withdrawal",
      amount: 65,
      status: "completed",
      date: "2026-10-02",
      description: "Grocery shop",
      category: "Food",
    },
    {
      kind: "withdrawal",
      amount: 25,
      status: "completed",
      date: "2026-10-03",
      description: "Bus pass",
      category: "Transport",
    },
    {
      kind: "withdrawal",
      amount: 18,
      status: "completed",
      date: "2026-10-04",
      description: "Movie night",
      category: "Leisure",
    },
    {
      kind: "withdrawal",
      amount: 12,
      status: "pending",
      date: "2026-10-05",
      description: "Cafe visit",
      category: "Food",
    },
  ];
  return {
    source: "example",
    account: {
      handle: "example",
      label: "Harbor fictional checking",
      type: "Checking",
      balance: 512,
    },
    accounts: [],
    rows,
    summary: summarize(rows),
    loadedAt: new Date().toISOString(),
  };
}
async function get(route) {
  const url = new URL(route, BASE);
  url.searchParams.set("key", key("CAPITAL_ONE_API_KEY"));
  // Nessie requires a query key. This authenticated URL never reaches the browser or logs.
  const r = await fetch(url, {
    method: "GET",
    redirect: "error",
    signal: AbortSignal.timeout(12000),
    headers: { accept: "application/json" },
  });
  if (!r.ok) throw new Error(httpFailure(r.status));
  return readJson(r);
}
async function load(user, mode, handle) {
  if (mode === "example") {
    user.money = example();
    return user.money;
  }
  if (mode !== "sandbox")
    throw new Error("Choose local examples or the Nessie sandbox.");
  const fail = (issue) => ({ source: "unavailable", issue });
  if (key("CAPITAL_ONE_PRODUCT") !== "nessie")
    return fail(
      "Capital One product is unconfirmed. Confirm the developer portal before enabling Nessie. Local examples are available.",
    );
  if (!key("CAPITAL_ONE_API_KEY"))
    return fail(
      "Nessie is not configured. Add the sandbox key on the server. Local examples are available.",
    );
  try {
    const raw = await get("/accounts");
    if (!Array.isArray(raw) || raw.length > 1000)
      throw new Error("Invalid accounts response");
    const eligible = raw.filter((a) =>
      ["Checking", "Savings"].includes(a.type),
    );
    if (
      eligible.some(
        (a) =>
          typeof a._id !== "string" || !/^[a-zA-Z0-9-]{1,100}$/.test(a._id),
      )
    )
      throw new Error("Invalid account data");
    const old = user.moneyAccounts || new Map();
    user.moneyAccounts = new Map(
      eligible.map((a, i) => [
        a._id,
        {
          handle:
            old.get(a._id)?.handle || crypto.randomBytes(12).toString("hex"),
          label: `Sandbox ${a.type.toLowerCase()} ${i + 1}`,
          type: a.type,
          balance: cents(a.balance) / 100,
        },
      ]),
    );
    const accounts = [...user.moneyAccounts.values()];
    if (!accounts.length) {
      user.money = {
        source: "sandbox",
        accounts,
        account: null,
        rows: [],
        summary: summarize([]),
        loadedAt: new Date().toISOString(),
      };
      return user.money;
    }
    const chosen = handle
      ? eligible.find((a) => user.moneyAccounts.get(a._id).handle === handle)
      : eligible[0];
    if (!chosen)
      return fail(
        "That sandbox account is no longer available. Reload the sandbox account list.",
      );
    const [deposits, withdrawals] = await Promise.all([
      get(`/accounts/${encodeURIComponent(chosen._id)}/deposits`),
      get(`/accounts/${encodeURIComponent(chosen._id)}/withdrawals`),
    ]);
    const rows = [
      ...normalize(deposits, "deposit"),
      ...normalize(withdrawals, "withdrawal"),
    ].sort((a, b) => b.date.localeCompare(a.date));
    user.money = {
      source: "sandbox",
      accounts,
      account: user.moneyAccounts.get(chosen._id),
      rows,
      summary: summarize(rows),
      loadedAt: new Date().toISOString(),
    };
    return user.money;
  } catch (error) {
    const safe = [
      "Credentials were rejected. Check the server configuration.",
      "Provider rate limit reached. Please wait before retrying.",
      "Provider unavailable. Try again later.",
    ];
    return fail(safe.includes(error.message) ? error.message : failure(error));
  }
}
function context(data) {
  // No account IDs, nicknames, names, or raw descriptions leave for Gemini.
  return {
    dataSource:
      data.source === "sandbox"
        ? "Capital One Nessie synthetic sandbox"
        : "Authored local fictional example",
    balance: data.account?.balance,
    scope:
      "Completed deposits and withdrawals returned for this account; not a full bank statement",
    ...data.summary,
    transactionCount: data.rows.length,
    categoryMethod:
      "Local description keyword rules; may be wrong. Not bank-supplied categories.",
  };
}
module.exports = { load, example, summarize, normalize, context };
