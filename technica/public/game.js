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
    return state;
  }
  const api = { initial, snapshot, choose, reflect, next, restore, cost };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.HarborGame = api;
})(typeof window === "undefined" ? globalThis : window);
