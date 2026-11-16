// Skips Next's internal _global-error fallback (only shown if the root layout crashes).
// Verifies every prerendered page has <title>OMGX AI</title>. Run after `next build`.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const root = ".next/server/app";
const bad = [];
let count = 0;
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    // _global-error.html is Next's internal fallback, shown only if the root layout crashes.
    else if (name.endsWith(".html") && name !== "_global-error.html") {
      count++;
      const m = readFileSync(p, "utf8").match(/<title>([^<]*)<\/title>/);
      const t = m ? m[1] : null;
      console.log(`${t === "OMGX AI" ? "ok " : "BAD"} ${p} -> ${t}`);
      if (t !== "OMGX AI") bad.push(p);
    }
  }
})(root);
if (count === 0 || bad.length) {
  console.error(`title check failed (${count} pages, ${bad.length} bad)`);
  process.exit(1);
}
console.log(`title check ok (${count} pages)`);
