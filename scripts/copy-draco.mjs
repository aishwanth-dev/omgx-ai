// Copies three's Draco glTF decoder into public/draco/gltf/ so no decoder is
// fetched from a CDN at runtime (3.26). Run by `predev` and `prebuild`; the
// copies are committed so `npx next build` works without the npm hook.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const DRACO_SRC = path.join(root, "node_modules/three/examples/jsm/libs/draco/gltf");
export const DRACO_DEST = path.join(root, "public/draco/gltf");

export function copyDraco() {
  if (!fs.existsSync(DRACO_SRC)) throw new Error(`Draco decoder not found at ${DRACO_SRC}; run npm install`);
  fs.mkdirSync(DRACO_DEST, { recursive: true });
  const files = fs.readdirSync(DRACO_SRC).filter((f) => fs.statSync(path.join(DRACO_SRC, f)).isFile());
  for (const f of files) fs.copyFileSync(path.join(DRACO_SRC, f), path.join(DRACO_DEST, f));
  return files;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const files = copyDraco();
  console.log(`copy-draco: ${files.length} files -> public/draco/gltf/ (${files.join(", ")})`);
}
