/* Lanternwake rules: every cost, route, solution, and reward is deterministic. */
(function (root) {
  const R =
    typeof module !== "undefined" && module.exports
      ? require("./rpg")
      : root.HarborRPG;
  const spots = [
    {
      id: "workshop",
      name: "Lantern workshop",
      x: 5,
      y: 1,
      icon: "✥",
      title: "Lantern lab",
      description:
        "Three little choices. One glowing creation. Keep it within $20.",
      light: "The cottage lantern is glowing again.",
    },
    {
      id: "cash",
      name: "Festival ticket stall",
      x: 8,
      y: 6,
      icon: "▤",
      title: "Pocket-money pop-up",
      description:
        "Meet three visitors and put the right change in their tray.",
      light: "Warm lights spill across the market stalls.",
    },
    {
      id: "route",
      name: "Lantern delivery dock",
      x: 8,
      y: 9,
      icon: "⚑",
      title: "Special delivery",
      description: "Pick a path and compare a little time with a little money.",
      light: "The pier lanterns reflect across the harbor.",
    },
  ];
  const postcards = [
    {
      id: "welcome",
      x: 5,
      y: 8,
      title: "A pocket-sized adventure",
      note: "A good plan has room to change. There is no perfect route through a real week.",
    },
    {
      id: "grove",
      x: 7,
      y: 3,
      title: "The long way around",
      note: "A cheaper route can take more time. Time and access belong in the comparison too.",
    },
    {
      id: "market",
      x: 10,
      y: 6,
      title: "The tiny-print treasure",
      note: "An extra fee is still part of the total, even when it is printed very small.",
    },
    {
      id: "shore",
      x: 12,
      y: 9,
      title: "A pause at the water",
      note: "Urgency in a message is a reason to pause and verify, not a reason to rush.",
    },
    {
      id: "garden",
      x: 1,
      y: 4,
      title: "Room for different lives",
      note: "A workable choice depends on needs and resources. Someone else’s plan may look different.",
    },
  ];
  const parts = {
    lens: [
      {
        id: "reclaimed",
        name: "Reclaimed lens",
        cents: 800,
        repair: 300,
        note: "$8 lens + $3 repair · Includes a repair stop.",
      },
      {
        id: "new",
        name: "New lens",
        cents: 1400,
        repair: 0,
        note: "$14 total · Ready to fit.",
      },
    ],
    mount: [
      {
        id: "salvaged",
        name: "Salvaged frame",
        cents: 400,
        note: "$4 · Inspect and fit it yourself.",
      },
      {
        id: "fitted",
        name: "Fitted frame",
        cents: 600,
        note: "$6 · Less fitting work.",
      },
    ],
    delivery: [
      {
        id: "pickup",
        name: "Collect it yourself",
        cents: 0,
        note: "$0 · Spend time making an extra trip.",
      },
      {
        id: "delivered",
        name: "Have it delivered",
        cents: 400,
        note: "$4 · Avoid the extra trip.",
      },
    ],
  };
  const routeRows = ["..$..", ".##..", "..#..", "....."],
    routeStart = { x: 0, y: 1 },
    routeGoal = { x: 4, y: 1 };
  const cashOrders = [
    {
      id: "tickets",
      visitor: "Pip",
      item: "Festival ticket",
      icon: "▤",
      quantity: 3,
      price: 400,
      received: 2000,
      request: "Three tickets, please! My friends are waiting by the stage.",
    },
    {
      id: "lemonade",
      visitor: "Mina",
      item: "Lemonade",
      icon: "◒",
      quantity: 2,
      price: 300,
      received: 1000,
      request:
        "Two lemonades for the lantern makers. Building is thirsty work!",
    },
    {
      id: "postcards",
      visitor: "Tavi",
      item: "Postcard",
      icon: "✉",
      quantity: 3,
      price: 200,
      received: 2000,
      request:
        "Three postcards, please. Even a harbor gull likes getting mail.",
    },
  ];
  const deliveryPaths = {
    bridge: {
      name: "Across the bridge",
      moves: ["up", "right", "right", "right", "right", "down"],
    },
    coast: {
      name: "Along the coast",
      moves: ["down", "down", "right", "right", "right", "right", "up", "up"],
    },
  };
  const deliveryJobs = [
    {
      title: "A relaxed afternoon",
      request:
        "No rush today. Can you keep the $2 delivery fund for tomorrow’s supplies?",
      preferred: "coast",
    },
    {
      title: "The opening bell",
      request:
        "The stage needs its lanterns as soon as possible. You can use the $2 fund to take the shorter path.",
      preferred: "bridge",
    },
    {
      title: "Your kind of delivery",
      request:
        "No urgent deadline. Would you rather keep $2 or walk two fewer steps? Both choices work.",
      preferred: null,
    },
  ];
  const initial = () => ({
    version: 1,
    parts: { lens: null, mount: null, delivery: null },
    coins: [],
    moves: [],
    solutions: {},
    postcards: [],
    companion: "gull",
    buildStep: 0,
    workshopBuilt: false,
    cashRound: 0,
    cashReceipts: {},
    deliveryJob: 0,
    routeReason: null,
  });
  const money = (n) => "$" + (n / 100).toFixed(2);
  function repairStatus(plan) {
    let total = 0;
    const lines = [];
    for (const category of Object.keys(parts)) {
      const item = parts[category].find((p) => p.id === plan[category]);
      if (item) {
        total += item.cents + (item.repair || 0);
        lines.push({ name: item.name, cents: item.cents });
        if (item.repair)
          lines.push({ name: "Lens repair", cents: item.repair });
      }
    }
    return {
      total,
      lines,
      ready: Object.keys(parts).every((c) =>
        parts[c].some((p) => p.id === plan[c]),
      ),
      valid:
        Object.keys(parts).every((c) =>
          parts[c].some((p) => p.id === plan[c]),
        ) && total <= 2000,
    };
  }
  function cashStatus(coins, round = 0) {
    const total = coins.reduce((sum, c) => sum + c, 0);
    const order = cashOrders[round];
    if (!order) throw Error("Choose an available visitor.");
    const sale = order.quantity * order.price,
      due = order.received - sale;
    return {
      total,
      sale,
      received: order.received,
      due,
      valid: total === due,
    };
  }
  function routeStatus(moves) {
    let x = routeStart.x,
      y = routeStart.y,
      cost = 0,
      pass = false;
    for (const direction of moves) {
      const delta = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[
        direction
      ];
      if (!delta) throw Error("Choose a route direction.");
      const nx = x + delta[0],
        ny = y + delta[1];
      if (
        nx < 0 ||
        ny < 0 ||
        ny >= routeRows.length ||
        nx >= 5 ||
        routeRows[ny][nx] === "#"
      )
        throw Error("That route is blocked.");
      x = nx;
      y = ny;
      if (routeRows[y][x] === "$" && !pass) {
        cost += 200;
        pass = true;
      }
    }
    return {
      x,
      y,
      cost,
      steps: moves.length,
      pass,
      complete: x === routeGoal.x && y === routeGoal.y,
    };
  }
  function completed(state) {
    return spots.filter((s) => state.solutions[s.id]).map((s) => s.id);
  }
  function act(state, action, value) {
    if (action === "part") {
      const [category, id] = String(value).split(":");
      if (!parts[category]?.some((p) => p.id === id))
        throw Error("Choose an available lantern part.");
      return {
        ...state,
        parts: { ...state.parts, [category]: id },
        buildStep: Math.min(Object.keys(parts).indexOf(category) + 1, 2),
        workshopBuilt: false,
      };
    }
    if (action === "build-step") {
      const step = Number(value);
      if (!Number.isInteger(step) || step < 0 || step > 2)
        throw Error("Choose a build step.");
      return { ...state, buildStep: step };
    }
    if (action === "reset-workshop")
      return {
        ...state,
        parts: initial().parts,
        buildStep: 0,
        workshopBuilt: false,
      };
    if (action === "coin") {
      if (![100, 200, 500].includes(value) || state.coins.length >= 20)
        throw Error("Choose a drawer note, or clear a few first.");
      return { ...state, coins: [...state.coins, value] };
    }
    if (action === "undo-cash")
      return { ...state, coins: state.coins.slice(0, -1) };
    if (action === "clear-cash") return { ...state, coins: [] };
    if (action === "reset-route")
      return { ...state, moves: [], routeReason: null };
    if (action === "choose-route") {
      const path = deliveryPaths[value];
      if (!path) throw Error("Choose the bridge or the coast path.");
      return {
        ...state,
        moves: [...path.moves],
        routeReason: null,
        solutions: {
          ...state.solutions,
          route: state.solutions.route || [...path.moves],
        },
      };
    }
    if (action === "next-delivery") {
      if (!routeStatus(state.moves).complete)
        throw Error("Deliver this crate before taking another job.");
      return {
        ...state,
        deliveryJob: (state.deliveryJob + 1) % deliveryJobs.length,
        moves: [],
        routeReason: null,
      };
    }
    if (action === "route-reason") {
      const answer = Number(value);
      if (!routeStatus(state.moves).complete || ![0, 1].includes(answer))
        throw Error("Deliver the crate first, then try the question.");
      return { ...state, routeReason: answer };
    }
    if (action === "route") {
      if (state.moves.length >= 80)
        throw Error("Try resetting this delivery route.");
      if (routeStatus(state.moves).complete)
        throw Error("Delivery complete. Reset the route to try another way.");
      const moves = [...state.moves, value],
        status = routeStatus(moves);
      return {
        ...state,
        moves,
        routeReason: null,
        solutions:
          status.complete && !state.solutions.route
            ? { ...state.solutions, route: moves }
            : state.solutions,
      };
    }
    if (action === "submit-workshop") {
      const plan = repairStatus(state.parts);
      if (!plan.ready)
        throw Error("Choose a lens, a frame, and a delivery option.");
      if (!plan.valid)
        throw Error(
          `This plan costs ${money(plan.total)}, above the $20 workshop fund. Compare the parts or delivery again.`,
        );
      return {
        ...state,
        workshopBuilt: true,
        solutions: {
          ...state.solutions,
          workshop: state.solutions.workshop || { ...state.parts },
        },
      };
    }
    if (action === "submit-cash") {
      const cash = cashStatus(state.coins, state.cashRound);
      if (!cash.valid)
        throw Error(
          cash.total < cash.due
            ? `Almost! Add ${money(cash.due - cash.total)} more to the tray. ${money(cash.received)} paid − ${money(cash.sale)} spent = ${money(cash.due)} change.`
            : `A little too much! Take back ${money(cash.total - cash.due)}. ${money(cash.received)} paid − ${money(cash.sale)} spent = ${money(cash.due)} change.`,
        );
      return {
        ...state,
        cashReceipts: {
          ...state.cashReceipts,
          [cashOrders[state.cashRound].id]: [...state.coins],
        },
        solutions: {
          ...state.solutions,
          ...(state.cashRound === 0
            ? { cash: state.solutions.cash || [...state.coins] }
            : {}),
        },
      };
    }
    if (action === "next-customer") {
      if (
        !state.cashReceipts[cashOrders[state.cashRound].id] ||
        state.cashRound >= cashOrders.length - 1
      )
        throw Error("Serve this visitor before moving on.");
      return { ...state, cashRound: state.cashRound + 1, coins: [] };
    }
    if (action === "restart-cash")
      return { ...state, cashRound: 0, coins: [], cashReceipts: {} };
    if (action === "companion") {
      if (
        !["gull", "fox", "none"].includes(value) ||
        (value === "fox" && state.postcards.length < 3)
      )
        throw Error("Find three postcards to invite the fox.");
      return { ...state, companion: value };
    }
    throw Error("This festival action is unavailable.");
  }
  function collect(state, character, id) {
    const card = postcards.find((p) => p.id === id);
    if (
      !card ||
      Math.abs(card.x - character.x) + Math.abs(card.y - character.y) > 1
    )
      throw Error("Move beside the postcard to collect it.");
    return { ...state, postcards: [...new Set([...state.postcards, id])] };
  }
  function collectAt(state, character) {
    const card = postcards.find(
      (p) =>
        p.x === character.x &&
        p.y === character.y &&
        !state.postcards.includes(p.id),
    );
    return card ? collect(state, character, card.id) : state;
  }
  function travel(character, spot) {
    const routes = [
      [0, 0],
      [0, 1],
      [1, 0],
      [-1, 0],
      [0, -1],
    ]
      .map(([dx, dy]) => R.path(character, spot.x + dx, spot.y + dy))
      .filter(Boolean)
      .sort((a, b) => a.length - b.length);
    if (!routes.length) throw Error("No clear route to that discovery.");
    return { ...character, ...(routes[0].at(-1) || character) };
  }
  function restore(raw) {
    if (!raw) return initial();
    if (
      raw.version !== 1 ||
      !raw.parts ||
      typeof raw.parts !== "object" ||
      !Array.isArray(raw.coins) ||
      raw.coins.length > 20 ||
      raw.coins.some((c) => ![100, 200, 500].includes(c)) ||
      !Array.isArray(raw.moves) ||
      raw.moves.length > 80 ||
      !Array.isArray(raw.postcards) ||
      raw.postcards.length > postcards.length ||
      raw.postcards.some((id) => !postcards.some((p) => p.id === id))
    )
      throw Error("Festival save is invalid.");
    const state = initial();
    for (const category of Object.keys(parts)) {
      const id = raw.parts[category];
      if (id !== null && !parts[category].some((p) => p.id === id))
        throw Error("Lantern plan is invalid.");
      state.parts[category] = id;
    }
    routeStatus(raw.moves);
    state.coins = [...raw.coins];
    state.moves = [...raw.moves];
    state.postcards = [...new Set(raw.postcards)];
    if (
      raw.solutions === null ||
      typeof raw.solutions !== "object" ||
      Array.isArray(raw.solutions)
    )
      throw Error("Festival solutions are invalid.");
    for (const [id, proof] of Object.entries(raw.solutions)) {
      if (id === "workshop") {
        if (!proof || !repairStatus(proof).valid)
          throw Error("Lantern proof is invalid.");
        state.solutions.workshop = Object.fromEntries(
          Object.keys(parts).map((key) => [key, proof[key]]),
        );
      } else if (id === "cash") {
        if (
          !Array.isArray(proof) ||
          proof.length > 20 ||
          proof.some((c) => ![100, 200, 500].includes(c)) ||
          !cashStatus(proof).valid
        )
          throw Error("Cash proof is invalid.");
        state.solutions.cash = [...proof];
      } else if (id === "route") {
        if (
          !Array.isArray(proof) ||
          proof.length > 80 ||
          !routeStatus(proof).complete
        )
          throw Error("Route proof is invalid.");
        state.solutions.route = [...proof];
      } else throw Error("Unknown festival solution.");
    }
    state.buildStep =
      raw.buildStep === undefined
        ? Math.min(
            Object.keys(parts).filter((c) => state.parts[c] !== null).length,
            2,
          )
        : raw.buildStep;
    if (
      !Number.isInteger(state.buildStep) ||
      state.buildStep < 0 ||
      state.buildStep > 2
    )
      throw Error("Build step is invalid.");
    state.workshopBuilt =
      raw.workshopBuilt === undefined
        ? Boolean(
            state.solutions.workshop &&
              Object.keys(parts).every(
                (c) => state.parts[c] === state.solutions.workshop[c],
              ),
          )
        : raw.workshopBuilt;
    if (
      typeof state.workshopBuilt !== "boolean" ||
      (state.workshopBuilt &&
        (!state.solutions.workshop || !repairStatus(state.parts).valid))
    )
      throw Error("Workshop result is invalid.");
    state.cashRound = raw.cashRound === undefined ? 0 : raw.cashRound;
    if (!Number.isInteger(state.cashRound) || !cashOrders[state.cashRound])
      throw Error("Visitor is invalid.");
    const receipts =
      raw.cashReceipts === undefined
        ? state.solutions.cash
          ? { tickets: state.solutions.cash }
          : {}
        : raw.cashReceipts;
    if (!receipts || typeof receipts !== "object" || Array.isArray(receipts))
      throw Error("Visitor receipts are invalid.");
    for (const [id, notes] of Object.entries(receipts)) {
      const round = cashOrders.findIndex((o) => o.id === id);
      if (
        round < 0 ||
        !Array.isArray(notes) ||
        notes.length > 20 ||
        notes.some((n) => ![100, 200, 500].includes(n)) ||
        !cashStatus(notes, round).valid
      )
        throw Error("Visitor change is invalid.");
      state.cashReceipts[id] = [...notes];
    }
    if (
      cashOrders
        .slice(0, state.cashRound)
        .some((o) => !state.cashReceipts[o.id])
    )
      throw Error("Serve earlier visitors first.");
    state.deliveryJob = raw.deliveryJob === undefined ? 0 : raw.deliveryJob;
    if (
      !Number.isInteger(state.deliveryJob) ||
      !deliveryJobs[state.deliveryJob]
    )
      throw Error("Delivery job is invalid.");
    state.routeReason = raw.routeReason === undefined ? null : raw.routeReason;
    if (
      (state.routeReason !== null && ![0, 1].includes(state.routeReason)) ||
      (state.routeReason !== null && !routeStatus(state.moves).complete)
    )
      throw Error("Delivery answer is invalid.");
    if (
      !["gull", "fox", "none"].includes(raw.companion) ||
      (raw.companion === "fox" && state.postcards.length < 3)
    )
      throw Error("Companion is unavailable.");
    state.companion = raw.companion;
    return state;
  }
  const api = {
    initial,
    spots,
    postcards,
    parts,
    cashOrders,
    deliveryPaths,
    deliveryJobs,
    routeRows,
    routeStart,
    routeGoal,
    repairStatus,
    cashStatus,
    routeStatus,
    completed,
    act,
    collect,
    collectAt,
    travel,
    restore,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.HarborFestival = api;
})(typeof window === "undefined" ? globalThis : window);
