(function (root) {
  "use strict";
  const funds = [
    {
      id: "broad",
      name: "Harbor Total Market",
      type: "Broad-market stocks",
      strategy: "Passive",
      fee: 0.04,
      color: "#174c3c",
      exposure: "Fictional basket of 1,500 US companies; includes technology.",
    },
    {
      id: "bond",
      name: "Anchor Bond",
      type: "Bonds",
      strategy: "Passive",
      fee: 0.12,
      color: "#527b91",
      exposure:
        "Fictional government and corporate bonds. Interest-rate and default risk remain.",
    },
    {
      id: "world",
      name: "Open Water International",
      type: "International stocks",
      strategy: "Passive",
      fee: 0.18,
      color: "#b68d4d",
      exposure:
        "Fictional companies outside the US; adds currency and regional risks.",
    },
    {
      id: "tech",
      name: "Horizon Technology",
      type: "Sector stocks",
      strategy: "Active",
      fee: 0.85,
      color: "#a7b9a1",
      exposure:
        "Fictional concentrated technology basket. Overlaps with Total Market. Active management does not ensure outperformance.",
    },
  ];
  const scenarios = {
    steady: {
      label: "Illustrative growth year",
      returns: [0.06, 0.025, 0.05, 0.08],
    },
    downturn: {
      label: "Illustrative stock downturn",
      returns: [-0.25, 0.02, -0.22, -0.35],
    },
    rates: {
      label: "Illustrative rate shock",
      returns: [-0.08, -0.12, -0.1, -0.18],
    },
  };
  function allocation(values, scenario = "steady") {
    if (
      !Array.isArray(values) ||
      values.length !== 4 ||
      values.some((v) => !Number.isFinite(v) || v < 0 || v > 100) ||
      Math.abs(values.reduce((a, b) => a + b, 0) - 100) > 0.001
    )
      throw new Error("Allocations must total 100%.");
    if (typeof scenario !== "string" || !Object.hasOwn(scenarios, scenario))
      throw new Error("Choose a scenario.");
    const fee = values.reduce((s, v, i) => s + (v / 100) * funds[i].fee, 0);
    const grossReturn = values.reduce(
      (s, v, i) => s + (v / 100) * scenarios[scenario].returns[i],
      0,
    );
    const gross = 10000 * (1 + grossReturn);
    return {
      fee,
      annualExpense: (10000 * fee) / 100,
      grossReturn,
      scenarioFee: (gross * fee) / 100,
      balance: gross * (1 - fee / 100),
      stock: values[0] + values[2] + values[3],
      concentration: Math.max(...values),
    };
  }
  function project({
    principal = 10000,
    years = 20,
    rate = 5,
    fee = 0.04,
    contribution = 0,
  } = {}) {
    if (
      ![principal, years, rate, fee, contribution].every(Number.isFinite) ||
      principal < 0 ||
      principal > 1e7 ||
      !Number.isInteger(years) ||
      years < 1 ||
      years > 50 ||
      rate < -90 ||
      rate > 30 ||
      fee < 0 ||
      fee > 5 ||
      contribution < 0 ||
      contribution > 1e6
    )
      throw new Error("Invalid projection assumptions.");
    let net = principal,
      noFee = principal,
      paid = 0;
    const rows = [{ year: 0, balance: net, noFee, paid: 0, expense: 0 }];
    for (let year = 1; year <= years; year++) {
      const grown = net * (1 + rate / 100),
        expense = (grown * fee) / 100;
      net = grown - expense + contribution;
      noFee = noFee * (1 + rate / 100) + contribution;
      paid += expense;
      rows.push({ year, balance: net, noFee, paid, expense });
    }
    return {
      rows,
      balance: net,
      paid,
      opportunityCost: noFee - net - paid,
      noFee,
    };
  }
  function transfer(ledger, from, to, amount) {
    if (
      !Object.hasOwn(ledger, from) ||
      !Object.hasOwn(ledger, to) ||
      from === to
    )
      throw new Error("Choose two different fictional accounts.");
    if (!Number.isSafeInteger(amount) || amount <= 0)
      throw new Error("Transfer a positive whole number of units.");
    if (ledger[from] < amount)
      throw new Error(
        "Insufficient units: validation failed. No ownership records changed.",
      );
    return {
      ...ledger,
      [from]: ledger[from] - amount,
      [to]: ledger[to] + amount,
    };
  }
  const api = { funds, scenarios, allocation, project, transfer };
  if (typeof module !== "undefined") module.exports = api;
  else root.Finance = api;
})(typeof window !== "undefined" ? window : globalThis);
