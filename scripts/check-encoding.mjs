// Flags source files that are not valid UTF-8 or contain suspicious "?" substitutions / mojibake.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const walk = (d) =>
  readdirSync(d).flatMap((f) => {
    const p = join(d, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

const dec = new TextDecoder("utf-8", { fatal: true });
let bad = 0;
for (const f of walk("src").filter((f) => /\.(tsx?|css|svg)$/.test(f))) {
  const buf = readFileSync(f);
  try {
    const s = dec.decode(buf);
    const lines = s.split("\n");
    lines.forEach((l, i) => {
      if (/â€|Ã|ï»¿/.test(l) || /\?<\/span>|"\?"|>\?</.test(l)) {
        bad++;
        console.log(`${f}:${i + 1}: ${l.trim().slice(0, 120)}`);
      }
    });
    if (buf[0] === 0xef && buf[1] === 0xbb) console.log(`${f}: has BOM`);
  } catch {
    bad++;
    console.log(`${f}: INVALID UTF-8`);
  }
}
console.log(bad ? `${bad} issue(s)` : "encoding ok");
