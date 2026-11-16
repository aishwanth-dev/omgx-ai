import { hasWebGL } from "@/lib/device";
import { markReady, registerReadiness, reportReadiness } from "@/lib/readiness";

/**
 * Starts every real load the homepage needs and reports into the readiness
 * registry (lib/readiness.ts). Weights are rough KB so the bar moves with
 * actual work: the model item includes the Draco decoder, which dominates.
 * A failed item still counts as done, so the loader can never hang.
 * Idempotent. The hero scene resolves its own "scene" item on its first frame.
 */
let started = false;

const HERO = "/models/hero-core.glb";
const HERO_LITE = "/models/hero-core-lite.glb";
const DRACO = "/draco/gltf/";
const ROUTES = ["/work", "/contact", "/about", "/capabilities"];

const task = async (name: string, fn: () => Promise<void>) => {
  try {
    await fn();
  } catch (e) {
    if (process.env.NODE_ENV !== "production") console.warn(`[preload] ${name} failed, continuing:`, e);
  } finally {
    markReady(name);
  }
};

const loadImage = (src: string) =>
  new Promise<void>((resolve) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      img.decode().then(() => resolve(), () => resolve());
    };
    img.onerror = () => resolve();
    img.src = src;
  });

export function startPreload(prefetch: (href: string) => void) {
  if (started || typeof window === "undefined") return;
  started = true;
  const lite = window.matchMedia("(max-width: 760px)").matches;
  // Desktop also needs the lite model: the closing call to action always uses it.
  const modelUrls = lite ? [HERO_LITE] : [HERO, HERO_LITE];
  // 3D lives on the homepage only: any other first page loads no three.js, model or scene work.
  const home = window.location.pathname === "/";
  const webgl = home && hasWebGL();

  registerReadiness("fonts", 40);
  registerReadiness("images", 60);
  registerReadiness("chunks", 120);
  registerReadiness("routes", 15);
  if (webgl) {
    registerReadiness("model", 400);
    registerReadiness("warmup", 150);
    registerReadiness("scene", 120);
  }

  // Fonts: the faces used above the fold, then everything pending.
  void task("fonts", async () => {
    const family = getComputedStyle(document.body).fontFamily;
    await Promise.all([400, 500, 600, 700, 800].map((w) => document.fonts.load(`${w} 16px ${family}`).catch(() => [])));
    await document.fonts.ready;
  });

  // Logo (the variant this screen density uses) and the hero poster.
  void task("images", async () => {
    const urls = [window.devicePixelRatio > 1.5 ? "/brand/logo@2x.webp" : "/brand/logo.webp", "/images/hero-core-poster.webp"];
    let done = 0;
    await Promise.all(
      urls.map((u) =>
        loadImage(u).then(() => {
          done += 1;
          reportReadiness("images", done / urls.length);
        }),
      ),
    );
  });

  // Dynamic chunks the homepage mounts later: fetched and evaluated now.
  void task("chunks", async () => {
    const loads = home
      ? [
          () => import("@/components/three/StoryCanvas"),
          () => import("@/components/three/CapabilityModels"),
          () => import("@/components/three/JourneyRingCanvas"),
          () => import("@/components/three/CoreMini"),
        ]
      : [];
    let done = 0;
    await Promise.all(
      loads.map((l) =>
        l()
          .catch(() => undefined)
          .then(() => {
            done += 1;
            reportReadiness("chunks", done / loads.length);
          }),
      ),
    );
  });

  void task("routes", async () => {
    ROUTES.forEach((r) => {
      try {
        prefetch(r);
      } catch {
        /* prefetch is best effort */
      }
    });
  });

  if (!webgl) return;

  // Hero GLB: download (with the Draco decoder) and a real parse. three's cache keeps the
  // bytes in memory, so the scenes' own useGLTF calls find them without another request.
  const model = (async () => {
    const THREE = await import("three");
    const [{ GLTFLoader }, { DRACOLoader }] = await Promise.all([
      import("three/examples/jsm/loaders/GLTFLoader.js"),
      import("three/examples/jsm/loaders/DRACOLoader.js"),
    ]);
    THREE.Cache.enabled = true;
    const draco = new DRACOLoader().setDecoderPath(DRACO);
    const loader = new GLTFLoader().setDRACOLoader(draco);
    const loaded = modelUrls.map(() => 0);
    const gltfs = await Promise.all(
      modelUrls.map((url, i) =>
        loader.loadAsync(url, (e) => {
          if (e.total > 0) loaded[i] = Math.min(0.9, (e.loaded / e.total) * 0.9);
          reportReadiness("model", loaded.reduce((a, b) => a + b, 0) / modelUrls.length);
        }),
      ),
    );
    draco.dispose();
    const gltf = gltfs[0];
    return gltf.scene;
  })();
  void task("model", async () => {
    await model;
  });

  // WebGL warm-up: first context, PMREM and standard/trace shaders compiled, one hidden frame.
  void task("warmup", async () => {
    const scene3 = await model;
    const THREE = await import("three");
    const [{ RoomEnvironment }, { createTraceMaterial }, { MODEL_BUILDERS }] = await Promise.all([
      import("three/examples/jsm/environments/RoomEnvironment.js"),
      import("@/components/three/shaders"),
      import("@/components/three/capabilityBuilders"),
    ]);
    const canvas = document.createElement("canvas");
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: "high-performance" });
    renderer.setPixelRatio(1);
    renderer.setSize(64, 64, false);
    const world = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
    camera.position.z = 8.5;
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const env = pmrem.fromScene(room, 0.04);
    world.environment = env.texture;
    world.add(new THREE.DirectionalLight("#ffffff", 1));
    const hero = scene3.clone(true);
    world.add(hero);
    const trace = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.1), createTraceMaterial(0));
    world.add(trace);
    const rigs = MODEL_BUILDERS.map((build) => build());
    rigs.forEach((r) => world.add(r.root));
    try {
      await renderer.compileAsync(world, camera);
      renderer.render(world, camera);
    } finally {
      rigs.forEach((r) => r.dispose());
      trace.geometry.dispose();
      (trace.material as import("three").Material).dispose();
      env.dispose();
      pmrem.dispose();
      room.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    }
  });
}
