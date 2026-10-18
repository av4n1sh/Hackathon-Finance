(function (root) {
  const W =
    typeof module !== "undefined" && module.exports
      ? require("./world")
      : root.HarborWorld;
  const initial = (name = "Traveler", role = "wayfinder") => ({
    version: 1,
    x: W.start.x,
    y: W.start.y,
    name: String(name).trim().slice(0, 20) || "Traveler",
    role: W.roles.some((r) => r.id === role) ? role : "wayfinder",
    talked: [],
    side: { ledger: [], garden: [] },
    equipped: "notebook",
  });
  function walkable(x, y) {
    return (
      Number.isInteger(x) &&
      Number.isInteger(y) &&
      x >= 0 &&
      y >= 0 &&
      x < W.width &&
      y < W.height &&
      !"~TB#".includes(W.rows[y][x]) &&
      !W.npcs.some((n) => n.x === x && n.y === y)
    );
  }
  function move(state, dx, dy) {
    if (
      ![
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ].some(([x, y]) => dx === x && dy === y)
    )
      throw new Error("Move one tile in a direction.");
    const x = state.x + dx,
      y = state.y + dy;
    return walkable(x, y) ? { ...state, x, y } : state;
  }
  function path(state, x, y) {
    if (!walkable(x, y)) return null;
    const queue = [{ x: state.x, y: state.y, route: [] }],
      seen = new Set([`${state.x},${state.y}`]);
    for (let i = 0; i < queue.length; i++) {
      const node = queue[i];
      if (node.x === x && node.y === y) return node.route;
      for (const [dx, dy] of [
        [0, 1],
        [1, 0],
        [0, -1],
        [-1, 0],
      ]) {
        const nx = node.x + dx,
          ny = node.y + dy,
          key = `${nx},${ny}`;
        if (walkable(nx, ny) && !seen.has(key)) {
          seen.add(key);
          queue.push({
            x: nx,
            y: ny,
            route: [...node.route, { x: nx, y: ny }],
          });
        }
      }
    }
    return null;
  }
  function travel(state, id) {
    const npc = W.npcs.find((n) => n.id === id);
    if (!npc) throw new Error("Choose a harbor destination.");
    const routes = [
      [0, 1],
      [1, 0],
      [-1, 0],
      [0, -1],
    ]
      .map(([dx, dy]) => path(state, npc.x + dx, npc.y + dy))
      .filter(Boolean)
      .sort((a, b) => a.length - b.length);
    if (!routes.length)
      throw new Error("There is no clear route to this destination.");
    const route = routes[0],
      end = route.at(-1) || state;
    return { ...state, x: end.x, y: end.y };
  }
  const nearby = (state) =>
    W.npcs.filter(
      (n) => Math.abs(n.x - state.x) + Math.abs(n.y - state.y) === 1,
    );
  function talk(state, id) {
    if (!nearby(state).some((n) => n.id === id))
      throw new Error("Move next to the character first.");
    return { ...state, talked: [...new Set([...state.talked, id])] };
  }
  function sideStatus(state, id) {
    const values = state.side[id] || [];
    if (id === "ledger")
      return {
        complete: W.receipts.every((r) => values.includes(r.id)),
        total: W.receipts
          .filter((r) => values.includes(r.id))
          .reduce((n, r) => n + r.cents, 0),
      };
    if (id === "garden") {
      const total = W.supplies
        .filter((r) => values.includes(r.id))
        .reduce((n, r) => n + r.cents, 0);
      return {
        total,
        complete:
          total <= 1800 &&
          values.includes("cart") &&
          (values.includes("refill") || values.includes("sealed")),
      };
    }
    throw new Error("Side quest not found.");
  }
  function playSide(state, id, item) {
    const quest = W.sideQuests.find((q) => q.id === id);
    if (!quest || !nearby(state).some((n) => n.id === quest.npc))
      throw new Error("Visit the quest giver to play.");
    const allowed = id === "ledger" ? W.receipts : W.supplies;
    if (!allowed.some((r) => r.id === item))
      throw new Error("Choose an available quest item.");
    const selected = state.side[id];
    return {
      ...state,
      side: {
        ...state.side,
        [id]: selected.includes(item)
          ? selected.filter((i) => i !== item)
          : [...selected, item],
      },
    };
  }
  function restore(raw) {
    if (!raw) return initial();
    if (
      raw.version !== 1 ||
      !walkable(raw.x, raw.y) ||
      typeof raw.name !== "string" ||
      raw.name.length > 20 ||
      !W.roles.some((r) => r.id === raw.role) ||
      !Array.isArray(raw.talked) ||
      raw.talked.some((id) => !W.npcs.some((n) => n.id === id))
    )
      throw new Error("Character save is invalid.");
    const state = {
      ...initial(raw.name, raw.role),
      x: raw.x,
      y: raw.y,
      talked: [...new Set(raw.talked)],
    };
    for (const id of ["ledger", "garden"]) {
      const allowed = id === "ledger" ? W.receipts : W.supplies,
        values = raw.side?.[id] || [];
      if (
        !Array.isArray(values) ||
        values.length > allowed.length ||
        values.some((v) => !allowed.some((i) => i.id === v))
      )
        throw new Error("Side quest save is invalid.");
      state.side[id] = [...new Set(values)];
    }
    if (W.items.some((i) => i.id === raw.equipped))
      state.equipped = raw.equipped;
    return state;
  }
  function progress(saved) {
    const state = saved.rpg,
      chapters = new Set(
        (saved.explored || []).map((key) => Number(key.split(":")[0])),
      );
    const sides = [
      ...new Set([
        ...(saved.sideCompleted || []),
        ...W.sideQuests
          .filter((q) => sideStatus(state, q.id).complete)
          .map((q) => q.id),
      ]),
    ].filter((id) => W.sideQuests.some((q) => q.id === id));
    const xp =
      chapters.size * 20 +
      new Set(saved.mastered || []).size * 25 +
      new Set(saved.missionStamps || []).size * 30 +
      sides.length * 40 +
      new Set(state.talked).size * 5;
    const level = Math.min(5, 1 + Math.floor(xp / 100));
    const inventory = W.items.filter(
      (i) =>
        (i.chapter === undefined && !i.side) ||
        chapters.has(i.chapter) ||
        sides.includes(i.side),
    );
    return {
      xp,
      level,
      levelXP: level === 5 ? 100 : xp % 100,
      next: level === 5 ? 0 : 100 - (xp % 100),
      chapters: [...chapters],
      sides,
      inventory,
      equipped: inventory.find((i) => i.id === state.equipped) || W.items[0],
    };
  }
  function equip(saved, id) {
    if (!progress(saved).inventory.some((i) => i.id === id))
      throw new Error("This item has not been discovered yet.");
    return { ...saved.rpg, equipped: id };
  }
  const api = {
    initial,
    walkable,
    move,
    path,
    travel,
    nearby,
    talk,
    sideStatus,
    playSide,
    restore,
    progress,
    equip,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.HarborRPG = api;
})(typeof window === "undefined" ? globalThis : window);
