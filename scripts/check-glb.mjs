// Validates the committed GLBs and the local Draco decoder (2.3, 3.26, 3.29).
// Exits non-zero on any failure.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rel = (p) => path.join(root, p);
const DRACO = "KHR_draco_mesh_compression";
const KB = 1024;

const MODELS = [
  { file: "public/models/hero-core.glb", budget: 1024 * KB, hero: true, allowMissingNodes: false },
  // Lite drops some beads (Node_*) by design; every other hero node must exist.
  { file: "public/models/hero-core-lite.glb", budget: 1024 * KB, hero: true, allowMissingNodes: true },
  { file: "public/models/journey-ring.glb", budget: 300 * KB, hero: false, nodes: ["Journey_Ring"] },
];

const nodeSpec = JSON.parse(fs.readFileSync(rel("src/components/three/heroCoreNodes.json"), "utf8"));
const HERO_NODES = [nodeSpec.core, ...nodeSpec.rings, nodeSpec.ribbon, ...nodeSpec.nodes, ...nodeSpec.traces, ...nodeSpec.paths];

/** Parses the JSON chunk of a binary glTF. */
export function readGlbJson(buf) {
  if (buf.readUInt32LE(0) !== 0x46546c67) throw new Error("not a GLB (bad magic)");
  if (buf.readUInt32LE(4) !== 2) throw new Error("unsupported GLB version");
  const len = buf.readUInt32LE(12);
  if (buf.readUInt32LE(16) !== 0x4e4f534a) throw new Error("first chunk is not JSON");
  return JSON.parse(buf.subarray(20, 20 + len).toString("utf8"));
}

const errors = [];
const fail = (msg) => errors.push(msg);

for (const m of MODELS) {
  const p = rel(m.file);
  if (!fs.existsSync(p)) {
    fail(`${m.file}: missing`);
    continue;
  }
  const buf = fs.readFileSync(p);
  if (buf.length > m.budget) fail(`${m.file}: ${(buf.length / KB).toFixed(1)} KB exceeds ${m.budget / KB} KB`);
  let j;
  try {
    j = readGlbJson(buf);
  } catch (e) {
    fail(`${m.file}: ${e.message}`);
    continue;
  }
  const used = j.extensionsUsed ?? [];
  const req = j.extensionsRequired ?? [];
  if (!used.includes(DRACO) || !req.includes(DRACO)) fail(`${m.file}: ${DRACO} must be in extensionsUsed and extensionsRequired`);
  if (m.hero) {
    for (const ext of ["KHR_materials_clearcoat", "KHR_materials_emissive_strength"])
      if (!used.includes(ext)) fail(`${m.file}: missing ${ext}`);
  }
  const names = new Set((j.nodes ?? []).map((n) => n.name));
  const want = m.hero ? HERO_NODES : m.nodes;
  for (const n of want) {
    if (names.has(n)) continue;
    if (m.allowMissingNodes && /^Node_\d+$/.test(n)) continue;
    fail(`${m.file}: node ${n} missing`);
  }
  for (const [i, b] of (j.buffers ?? []).entries()) if (b.uri) fail(`${m.file}: buffer ${i} has external uri ${b.uri}`);
  for (const [i, im] of (j.images ?? []).entries()) if (im.uri) fail(`${m.file}: image ${i} has uri`);
  if (!errors.some((e) => e.startsWith(m.file))) console.log(`ok  ${m.file} (${(buf.length / KB).toFixed(1)} KB, ${names.size} nodes)`);
}

// Decoder copies must match the installed three files byte for byte.
const SRC = rel("node_modules/three/examples/jsm/libs/draco/gltf");
const DEST = rel("public/draco/gltf");
const REQUIRED = ["draco_decoder.js", "draco_decoder.wasm", "draco_wasm_wrapper.js"];
for (const f of REQUIRED) {
  const a = path.join(SRC, f);
  const b = path.join(DEST, f);
  if (!fs.existsSync(a)) fail(`three decoder ${f} not installed`);
  else if (!fs.existsSync(b)) fail(`public/draco/gltf/${f} missing (run node scripts/copy-draco.mjs)`);
  else if (!fs.readFileSync(a).equals(fs.readFileSync(b))) fail(`public/draco/gltf/${f} differs from three's copy (run node scripts/copy-draco.mjs)`);
}
if (!errors.some((e) => /decoder|draco\//.test(e))) console.log("ok  public/draco/gltf/ matches three");

if (errors.length) {
  for (const e of errors) console.error(`FAIL ${e}`);
  process.exit(1);
}
console.log("check-glb: all checks passed");
