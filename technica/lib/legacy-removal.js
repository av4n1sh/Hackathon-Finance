"use strict";
const fs = require("node:fs/promises"),
  path = require("node:path"),
  crypto = require("node:crypto");
const fail = (status, message) => Object.assign(new Error(message), { status });
function createRemoval(directory) {
  const file = path.join(directory, "contributions.json");
  let queue = Promise.resolve();
  return (body) => {
    if (
      typeof body.id !== "string" ||
      body.id.length > 80 ||
      typeof body.removalCode !== "string" ||
      body.removalCode.length > 100
    )
      throw fail(400, "Enter both fields from your saved receipt.");
    const work = queue.then(async () => {
      let data;
      try {
        data = JSON.parse(await fs.readFile(file, "utf8"));
      } catch (e) {
        if (e.code === "ENOENT")
          throw fail(404, "No matching contribution was found.");
        throw e;
      }
      if (data.version !== 1 || !Array.isArray(data.rows))
        throw new Error("Storage unavailable");
      const hashed = crypto
          .createHash("sha256")
          .update(body.removalCode)
          .digest("hex"),
        index = data.rows.findIndex(
          (r) => r.id === body.id && r.removalHash === hashed,
        );
      if (index < 0)
        throw fail(404, "The receipt did not match a contribution.");
      data.rows.splice(index, 1);
      const temp = `${file}.${crypto.randomUUID()}.tmp`;
      try {
        await fs.writeFile(temp, JSON.stringify(data, null, 2), {
          mode: 0o600,
        });
        await fs.rename(temp, file);
      } finally {
        await fs.rm(temp, { force: true });
      }
      return { removed: true };
    });
    queue = work.catch(() => {});
    return work;
  };
}
module.exports = { createRemoval, fail };
