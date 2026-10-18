(function (root) {
  const C =
    typeof module !== "undefined" && module.exports
      ? require("./content")
      : root.HarborContent;
  const initial = (goal = "bag") => ({
    version: 1,
    goal: C.goals.some((g) => g.id === goal) ? goal : "bag",
    answers: [],
    pending: null,
    missions: {},
  });
  const goalFor = (state) =>
    C.goals.find((g) => g.id === state.goal) || C.goals[0];
  const cost = (state, index, choice) =>
    C.steps[index].choices[choice].cost === "goal"
      ? goalFor(state).price
      : C.steps[index].choices[choice].cost;
  function snapshot(state) {
    let spent = state.answers.reduce(
      (sum, a, i) => sum + cost(state, i, a.choice),
      0,
    );
    if (state.pending)
      spent += cost(state, state.answers.length, state.pending.choice);
    const all = state.pending
      ? [...state.answers, state.pending]
      : state.answers;
    return {
      start: 14000,
      essentials: 6000,
      spent,
      available: 8000 - spent,
      goal: goalFor(state),
      complete: state.answers.length === C.steps.length,
      badges: all.flatMap((a, i) =>
        a.reason === C.steps[i].reflection.correct ? [C.steps[i].skill] : [],
      ),
    };
  }
  function choose(state, choice) {
    const index = state.answers.length;
    if (
      index >= C.steps.length ||
      !Number.isInteger(choice) ||
      !C.steps[index].choices[choice]
    )
      throw new Error("Choose an available option.");
    if (
      cost(state, index, choice) >
      snapshot({ ...state, pending: null }).available
    )
      throw new Error(
        "This needs more fictional money than is available. Choose another option or revisit an earlier decision.",
      );
    return { ...state, pending: { choice, reason: null } };
  }
  function reflect(state, reason) {
    if (!state.pending || ![0, 1].includes(reason))
      throw new Error("Choose a reflection.");
    return { ...state, pending: { ...state.pending, reason } };
  }
  function next(state) {
    if (!state.pending || state.pending.reason === null)
      throw new Error("Consider the trade-off before continuing.");
    return {
      ...state,
      answers: [...state.answers, state.pending],
      pending: null,
    };
  }
  function restore(raw) {
    if (
      !raw ||
      raw.version !== 1 ||
      !C.goals.some((g) => g.id === raw.goal) ||
      !Array.isArray(raw.answers) ||
      raw.answers.length > C.steps.length
    )
      throw new Error("Saved story is invalid.");
    let state = initial(raw.goal);
    for (const a of raw.answers)
      state = next(reflect(choose(state, a.choice), a.reason));
    if (raw.pending) {
      state = choose(state, raw.pending.choice);
      if (raw.pending.reason !== null)
        state = reflect(state, raw.pending.reason);
    }
    if (raw.missions !== undefined) {
      if (
        !raw.missions ||
        typeof raw.missions !== "object" ||
        Array.isArray(raw.missions)
      )
        throw new Error("Saved activities are invalid.");
      for (const [id, value] of Object.entries(raw.missions)) {
        const mission = C.missions.find((m) => m.id === id);
        if (!mission || mission.step > state.answers.length)
          throw new Error("Saved activity is unavailable.");
        state.missions[id] = validateMission(id, value);
      }
    }
    return state;
  }
  function validateMission(id, value) {
    if (id === "plan") {
      if (
        !Number.isInteger(value) ||
        value < 0 ||
        value > 14000 ||
        value % 1000 !== 0
      )
        throw new Error("Move money in $10 steps within the practice budget.");
      return value;
    }
    const allowed =
      id === "receipt" ? ["fare", "fee"] : ["urgency", "gift", "verify"];
    if (
      !Array.isArray(value) ||
      value.length > allowed.length ||
      value.some((v) => !allowed.includes(v))
    )
      throw new Error("Choose an available activity item.");
    return [...new Set(value)];
  }
  function interact(state, id, action) {
    const mission = C.missions.find((m) => m.id === id);
    if (!mission || mission.step !== state.answers.length)
      throw new Error("Visit this activity’s day to play.");
    const current = state.missions?.[id] ?? (id === "plan" ? 0 : []);
    const value =
      id === "plan"
        ? current + action
        : current.includes(action)
          ? current.filter((item) => item !== action)
          : [...current, action];
    if (id === "plan" && ![-1000, 1000].includes(action))
      throw new Error("Move one $10 note at a time.");
    return {
      ...state,
      missions: { ...state.missions, [id]: validateMission(id, value) },
    };
  }
  function missionStatus(state) {
    return C.missions.map((m) => {
      const value = state.missions?.[m.id];
      const complete =
        m.id === "plan"
          ? Number.isInteger(value) &&
            value >= 6000 &&
            14000 - value >= goalFor(state).price
          : Array.isArray(value) &&
            (m.id === "receipt"
              ? ["fare", "fee"]
              : ["urgency", "gift", "verify"]
            ).every((id) => value.includes(id));
      return { ...m, complete };
    });
  }
  function rewind(state, index) {
    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index >= C.steps.length ||
      index >= state.answers.length
    )
      throw new Error("Choose a completed day to revisit.");
    return {
      ...state,
      answers: state.answers.slice(0, index),
      pending: null,
      missions: Object.fromEntries(
        Object.entries(state.missions || {}).filter(
          ([id]) => C.missions.find((m) => m.id === id).step <= index,
        ),
      ),
    };
  }
  function passport(skills = [], stamps = []) {
    const earned = [
      ...C.steps.filter((s) => skills.includes(s.skill)).map((s) => s.skill),
      ...C.missions.filter((m) => stamps.includes(m.id)).map((m) => m.reward),
    ];
    return {
      earned,
      total: C.steps.length + C.missions.length,
      rank:
        earned.length >= 8
          ? "Everyday explorer"
          : earned.length >= 4
            ? "Money navigator"
            : earned.length >= 1
              ? "Curious explorer"
              : "Ready to explore",
    };
  }
  const api = {
    initial,
    snapshot,
    choose,
    reflect,
    next,
    restore,
    cost,
    interact,
    missionStatus,
    rewind,
    passport,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.HarborGame = api;
})(typeof window === "undefined" ? globalThis : window);
