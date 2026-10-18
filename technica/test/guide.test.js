const test = require("node:test"),
  assert = require("node:assert/strict");
const { explain } = require("../lib/guide");
test("optional guide needs no key and failure never changes the game", async () => {
  const originalKey = process.env.GEMINI_API_KEY,
    originalModel = process.env.GEMINI_MODEL,
    originalFetch = global.fetch;
  try {
    process.env.GEMINI_API_KEY = "";
    process.env.GEMINI_MODEL = "";
    let result = await explain({ lesson: "fees" });
    assert.equal(result.source, "authored");
    assert.match(result.explanation, /\$15/);
    process.env.GEMINI_API_KEY = "test-key";
    process.env.GEMINI_MODEL = "gemini-test";
    global.fetch = async () => {
      throw new Error("offline");
    };
    result = await explain({ lesson: "fees" });
    assert.equal(result.source, "authored");
    global.fetch = async () =>
      new Response(
        JSON.stringify({
          candidates: [
            {
              finishReason: "STOP",
              content: { parts: [{ text: "Compare the whole price." }] },
            },
          ],
        }),
        { status: 200 },
      );
    result = await explain({ lesson: "fees" });
    assert.equal(result.source, "ai");
    global.fetch = async () =>
      new Response(
        JSON.stringify({
          candidates: [
            {
              finishReason: "MAX_TOKENS",
              content: { parts: [{ text: "cut off" }] },
            },
          ],
        }),
        { status: 200 },
      );
    assert.equal((await explain({ lesson: "fees" })).source, "authored");
    await assert.rejects(explain({ lesson: "fees", game: { version: 99 } }));
  } finally {
    global.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalKey;
    if (originalModel === undefined) delete process.env.GEMINI_MODEL;
    else process.env.GEMINI_MODEL = originalModel;
  }
});
