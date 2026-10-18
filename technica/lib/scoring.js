"use strict";
function validate(c, b) {
  if (!c) throw new Error("Unknown case.");
  if (
    typeof b.action !== "string" ||
    typeof b.reason !== "string" ||
    !b.tags ||
    typeof b.tags !== "object" ||
    Array.isArray(b.tags) ||
    Object.keys(b.tags).length !== c.evidence.length ||
    c.evidence.some((e) => !["w", "v", "u"].includes(b.tags[e.id])) ||
    !c.actions.some((a) => a.id === b.action) ||
    !c.reasons.some((r) => r.id === b.reason)
  )
    throw new Error(
      "Tag every artifact and select a valid decision and reason.",
    );
  if (
    b.note !== undefined &&
    (typeof b.note !== "string" || b.note.length > 1000)
  )
    throw new Error("Notes must be text up to 1,000 characters.");
}
function score(c, b) {
  validate(c, b);
  const correct = c.evidence.filter((e) => b.tags[e.id] === e.truth).length;
  // Penalize indiscriminate warnings only when at least one warning is incorrect.
  const shotgun =
    c.evidence.filter((e) => b.tags[e.id] === "w").length / c.evidence.length >=
      0.8 && c.evidence.some((e) => b.tags[e.id] === "w" && e.truth !== "w");
  const ev = Math.max(
    0,
    Math.round((40 * correct) / c.evidence.length) - (shotgun ? 10 : 0),
  );
  const a = c.actions.find((a) => a.id === b.action),
    r = c.reasons.find((r) => r.id === b.reason);
  return {
    ev,
    ver: a.pts,
    unc: r.cal,
    correct,
    shotgun,
    total: ev + a.pts + r.cal,
    consequence: a.cons,
  };
}
function fallback(c, b, s) {
  const missed = c.evidence.filter((e) => b.tags[e.id] !== e.truth);
  return {
    strengths: `You classified ${s.correct} of ${c.evidence.length} artifacts according to the authored key.`,
    misconception: missed.length
      ? missed[0].why
      : "You distinguished warning signs from evidence that still needs verification.",
    explanation: c.actions.find((a) => a.id === b.action).cons,
    habit: c.habit,
    source: "demo",
  };
}
module.exports = { score, validate, fallback };
