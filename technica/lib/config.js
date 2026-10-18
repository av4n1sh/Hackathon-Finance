"use strict";
const fs = require("node:fs"),
  path = require("node:path");
const names = ["GEMINI_API_KEY", "GEMINI_MODEL", "PORT"];
function parseEnvironment(text) {
  const result = {};
  for (const line of text.split(/\r?\n/)) {
    // Horizontal whitespace only: an empty value must never consume the next line.
    const match = line.match(
      /^[ \t]*(?:export[ \t]+)?([A-Z_][A-Z_0-9]*)[ \t]*=[ \t]*(.*)$/,
    );
    if (!match || !names.includes(match[1])) continue;
    let value = match[2].trim();
    if (value.startsWith('"') || value.startsWith("'")) {
      const end = value.indexOf(value[0], 1);
      value = end >= 1 ? value.slice(1, end) : "";
    } else value = value.replace(/[ \t]+#.*$/, "");
    result[match[1]] = value.trim();
  }
  return result;
}
let lastText,
  managed = new Map();
function loadEnvironment() {
  let text = "";
  try {
    text = fs.readFileSync(path.join(__dirname, "..", ".env"), "utf8");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  if (text === lastText) return;
  lastText = text;
  const next = parseEnvironment(text);
  for (const name of names) {
    if (
      process.env[name] !== undefined &&
      process.env[name] !== managed.get(name)
    )
      continue;
    if (Object.hasOwn(next, name)) {
      process.env[name] = next[name];
      managed.set(name, next[name]);
    } else if (managed.has(name)) {
      delete process.env[name];
      managed.delete(name);
    }
  }
}
module.exports = { parseEnvironment, loadEnvironment };
