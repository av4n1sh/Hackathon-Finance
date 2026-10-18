"use strict";
const test = require("node:test"),
  assert = require("node:assert/strict");
const G = require("../public/game"),
  C = require("../public/content");
const { parseEnvironment } = require("../lib/config");
test("budgets remain integer cents across every affordable branch for both goals", () => {
  let endings = 0,
    unavailable = 0;
  function walk(state) {
    const s = G.snapshot(state);
    assert.equal(s.available + s.spent + s.essentials, s.start);
    assert.ok(Number.isInteger(s.available) && s.available >= 0);
    if (s.complete) {
      endings++;
      return;
    }
    const i = state.answers.length;
    for (let choice = 0; choice < C.steps[i].choices.length; choice++) {
      if (G.cost(state, i, choice) > s.available) {
        assert.throws(() => G.choose(state, choice));
        unavailable++;
        continue;
      }
      walk(
        G.next(
          G.reflect(G.choose(state, choice), C.steps[i].reflection.correct),
        ),
      );
    }
  }
  for (const goal of C.goals) walk(G.initial(goal.id));
  assert.ok(endings > 100);
  assert.ok(unavailable > 0);
});
test("decisions change future affordability and retry restores the exact balance", () => {
  let state = G.initial("bag");
  for (const choice of [1, 0, 1, 1])
    state = G.next(G.reflect(G.choose(state, choice), 1));
  assert.equal(G.snapshot(state).available, 2400);
  assert.throws(() => G.choose(state, 0), /more fictional money/);
  assert.throws(() => G.choose(state, 1), /more fictional money/);
  assert.equal(G.snapshot(G.choose(state, 2)).available, 2400);
  state.answers.pop();
  state = G.next(G.reflect(G.choose(state, 0), 1));
  assert.equal(G.snapshot(state).available, 3900);
  assert.equal(G.snapshot(G.choose(state, 1)).available, 700);
});
test("badges reward demonstrated reasoning independently of spending", () => {
  const low = G.reflect(G.choose(G.initial(), 0), 0);
  const high = G.reflect(G.choose(G.initial(), 1), 0);
  assert.deepEqual(G.snapshot(low).badges, G.snapshot(high).badges);
  assert.equal(G.snapshot(G.reflect(high, 1)).badges.length, 0);
  assert.throws(() => G.next(G.choose(G.initial(), 0)), /trade-off/);
});
test("restoration recomputes totals and rejects invalid, overspent, and incomplete paths", () => {
  const state = G.reflect(G.choose(G.initial("coat"), 1), 0);
  assert.deepEqual(G.restore(JSON.parse(JSON.stringify(state))), state);
  assert.equal(
    G.snapshot(G.restore({ ...state, available: 999999 })).available,
    6800,
  );
  assert.throws(() => G.restore({ ...state, goal: "invalid" }));
  assert.throws(() =>
    G.restore({ ...state, answers: [{ choice: 99, reason: 0 }] }),
  );
  assert.throws(() =>
    G.restore({ ...state, answers: [{ choice: 0, reason: null }] }),
  );
  assert.throws(() => G.choose(state, -1));
});
test("lesson links, source metadata, and reflections form a complete catalogue", () => {
  for (const step of C.steps) {
    assert.ok(C.lessons.some((l) => l.id === step.lesson));
    assert.ok(step.reflection.options[step.reflection.correct]);
  }
  for (const lesson of C.lessons) {
    assert.match(C.sources[lesson.source].url, /^https:\/\//);
    assert.ok(lesson.choices[lesson.answer]);
    assert.ok(C.steps[lesson.step]);
  }
});
test("configuration preserves blank lines, trims values, and excludes removed providers", () => {
  assert.deepEqual(
    parseEnvironment(
      'GEMINI_API_KEY=\nGEMINI_MODEL="gemini-example"\nREVIEWER_KEY= abc # comment\nCAPITAL_ONE_API_KEY=ignored',
    ),
    { GEMINI_API_KEY: "", GEMINI_MODEL: "gemini-example", REVIEWER_KEY: "abc" },
  );
});
