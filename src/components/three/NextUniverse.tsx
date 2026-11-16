"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { mulberry32 } from "@/lib/math";

export type UniverseState = {
  universe: number;
  speed: number;
  /** 0–1 colour shift: graphite, deep blue, red. */
  hue: number;
  /** 0–1 soft glow at the vanishing point. */
  bloom: number;
  /** Vanishing point in NDC (the stage shifts the projection centre). */
  center: readonly [number, number];
};

const DEPTH = 64; // the near field fills z = -2 … -66, enough for the whole flight

/** Shared colour ramp: graphite, deep blue, red. */
const HUE_GLSL = /* glsl */ `
  vec3 hueTone(float h) {
    vec3 graphite = vec3(0.52, 0.57, 0.7);
    vec3 blue = vec3(0.14, 0.32, 0.92);
    vec3 red = vec3(0.92, 0.2, 0.32);
    return mix(mix(graphite, blue, smoothstep(0.0, 0.45, h)), red, smoothstep(0.55, 1.0, h));
  }
`;

const particleMaterial = (maxPx = 26, sizeK = 34, soft = false) =>
  new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: 1 },
      uOpacity: { value: 0 },
      uHue: { value: 0 },
    },
    vertexShader: /* glsl */ `
      attribute float aSeed;
      attribute float aSize;
      uniform float uTime;
      uniform float uPixelRatio;
      uniform float uOpacity;
      varying float vA;
      varying float vTint;
      void main() {
        vec3 p = position;
        p.x += sin(uTime * 0.17 + aSeed * 40.0) * 0.45;
        p.y += cos(uTime * 0.13 + aSeed * 31.0) * 0.45;
        p.z += sin(uTime * 0.09 + aSeed * 19.0) * 0.6;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        float dist = -mv.z;
        float near = smoothstep(0.5, 3.5, dist);
        float far = 1.0 - smoothstep(16.0, 44.0, dist);
        vA = near * far * uOpacity * (0.3 + 0.7 * fract(aSeed * 7.3));
        vTint = fract(aSeed * 3.7);
        gl_PointSize = min(aSize * uPixelRatio * (${sizeK.toFixed(1)} / max(dist, 0.6)), ${maxPx.toFixed(1)} * uPixelRatio);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uHue;
      varying float vA;
      varying float vTint;
      ${HUE_GLSL}
      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        float glow = smoothstep(0.5, 0.0, d);
        float core = smoothstep(0.14, 0.0, d);
        vec3 col = mix(hueTone(uHue), vec3(0.92, 0.95, 1.0), vTint * vTint);
        float a = ${soft ? "glow * glow * 0.32" : "(glow * glow * 0.8 + core)"} * vA;
        gl_FragColor = vec4(col * a, a);
      }
    `,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  });

/**
 * Star layers in depth. Each layer's group follows the camera by a fraction of its
 * z travel, so far layers slip past slowly and near layers quickly (parallax).
 */
const starMaterial = (size: number) =>
  new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: 1 },
      uOpacity: { value: 0 },
      uHue: { value: 0 },
      uSize: { value: size },
    },
    vertexShader: /* glsl */ `
      attribute float aSeed;
      uniform float uTime;
      uniform float uPixelRatio;
      uniform float uOpacity;
      uniform float uSize;
      varying float vA;
      varying float vSeed;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        float dist = -mv.z;
        float twinkle = 0.7 + 0.3 * sin(uTime * (0.4 + aSeed * 1.1) + aSeed * 60.0);
        vA = uOpacity * twinkle * (0.3 + 0.7 * fract(aSeed * 9.1)) * smoothstep(0.6, 5.0, dist);
        vSeed = aSeed;
        gl_PointSize = clamp(uSize * uPixelRatio * (0.6 + aSeed) * (26.0 / max(dist, 1.0)), 1.0 * uPixelRatio, 8.0 * uPixelRatio);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uHue;
      varying float vA;
      varying float vSeed;
      ${HUE_GLSL}
      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        float g = smoothstep(0.5, 0.0, d);
        vec3 col = mix(hueTone(uHue), vec3(0.93, 0.96, 1.0), fract(vSeed * 5.0) * 0.7);
        float a = g * g * vA;
        gl_FragColor = vec4(col * a, a);
      }
    `,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  });

/**
 * Soft light streaks: screen-space quads between two world points that lie
 * along the flight path, so they stretch away from the vanishing point as the
 * camera speeds up.
 */
const streakMaterial = () =>
  new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uRes: { value: new THREE.Vector2(1, 1) },
      uWidth: { value: 2 },
      uSpeed: { value: 0 },
      uOpacity: { value: 0 },
      uHue: { value: 0 },
    },
    vertexShader: /* glsl */ `
      attribute vec3 aStart;
      attribute float aLen;
      attribute float aSeed;
      uniform float uTime;
      uniform vec2 uRes;
      uniform float uWidth;
      uniform float uSpeed;
      uniform float uOpacity;
      varying vec2 vUv;
      varying float vA;
      void main() {
        float len = aLen * (0.7 + 2.4 * uSpeed);
        vec3 a = aStart + vec3(0.0, 0.0, sin(uTime * 0.11 + aSeed * 17.0) * 0.8);
        vec3 b = a + vec3(0.0, 0.0, len);
        vec3 va = (modelViewMatrix * vec4(a, 1.0)).xyz;
        vec3 vb = (modelViewMatrix * vec4(b, 1.0)).xyz;
        float zn = -0.4;
        float alive = 1.0;
        if (va.z > zn && vb.z > zn) alive = 0.0;
        if (va.z > zn) va = mix(va, vb, (zn - va.z) / (vb.z - va.z));
        if (vb.z > zn) vb = mix(va, vb, (zn - va.z) / (vb.z - va.z));
        vec4 ca = projectionMatrix * vec4(va, 1.0);
        vec4 cb = projectionMatrix * vec4(vb, 1.0);
        vec2 sa = ca.xy / ca.w;
        vec2 sb = cb.xy / cb.w;
        vec2 dir = (sb - sa) * uRes;
        float l = max(length(dir), 1e-4);
        dir /= l;
        vec2 nrm = vec2(-dir.y, dir.x);
        float side = position.y;
        vec2 pos = mix(sa, sb, position.x) + nrm * side * uWidth / uRes * (0.6 + aSeed);
        float dist = -mix(va.z, vb.z, 0.5);
        float far = 1.0 - smoothstep(14.0, 40.0, dist);
        float near = smoothstep(0.8, 4.0, dist);
        vA = alive * far * near * uOpacity * (0.25 + 0.75 * fract(aSeed * 5.1)) * (0.25 + 0.75 * uSpeed);
        vUv = vec2(position.x, side);
        gl_Position = vec4(pos, 0.0, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uHue;
      varying vec2 vUv;
      varying float vA;
      ${HUE_GLSL}
      void main() {
        float along = sin(3.14159265 * vUv.x);
        along = pow(along, 1.4);
        float across = exp(-vUv.y * vUv.y * 3.2);
        float a = along * across * vA;
        vec3 col = mix(hueTone(uHue), vec3(0.85, 0.9, 1.0), pow(across, 6.0));
        gl_FragColor = vec4(col * a, a);
      }
    `,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  });

/** A full-screen additive glow at the vanishing point: bloom without post-processing. */
const bloomMaterial = () =>
  new THREE.ShaderMaterial({
    uniforms: {
      uAspect: { value: 1 },
      uCenter: { value: new THREE.Vector2(0, 0) },
      uIntensity: { value: 0 },
      uHue: { value: 0 },
      uTime: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vP;
      void main() {
        vP = position.xy;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uAspect;
      uniform vec2 uCenter;
      uniform float uIntensity;
      uniform float uHue;
      uniform float uTime;
      varying vec2 vP;
      ${HUE_GLSL}
      void main() {
        vec2 q = (vP - uCenter) * vec2(uAspect, 1.0);
        float r = length(q);
        float halo = exp(-r * 1.7) * 0.5;
        float core = exp(-r * r * 9.0) * 0.85;
        float ring = exp(-pow((r - (0.35 + 0.1 * sin(uTime * 0.6))) * 5.0, 2.0)) * 0.1;
        float a = (halo + core + ring) * uIntensity;
        vec3 col = mix(hueTone(max(uHue, 0.35)) * 0.85, vec3(0.9, 0.94, 1.0), core * 0.9);
        gl_FragColor = vec4(col, min(a, 1.0));
      }
    `,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  });

const STAR_LAYERS = [
  // follow: share of the camera's z travel the layer moves with (higher = further away).
  { follow: 0.9, count: 760, z: [-120, -30], radius: [2, 90], size: 1.1 },
  { follow: 0.55, count: 380, z: [-90, -8], radius: [3, 42], size: 1.7 },
] as const;

/**
 * The "next universe" the camera flies into after passing through the object:
 * a calm deep space of drifting dust, parallax star layers and soft light streaks
 * that stretch with the camera's speed, lit by a bloom-like glow at the vanishing
 * point. Everything is a function of the scroll progress, so scrolling back
 * undoes it. State comes from `read`, once per frame.
 */
export function NextUniverse({
  read,
  particles = 1600,
  streaks = 80,
  stars = 1,
  reduced = false,
}: {
  read: () => UniverseState;
  particles?: number;
  streaks?: number;
  /** Multiplier on the star layer counts (phones use less). */
  stars?: number;
  reduced?: boolean;
}) {
  const rig = useMemo(() => {
    const rand = mulberry32(7);
    const pos = new Float32Array(particles * 3);
    const seed = new Float32Array(particles);
    const size = new Float32Array(particles);
    for (let i = 0; i < particles; i++) {
      const a = rand() * Math.PI * 2;
      const r = 0.9 + Math.pow(rand(), 0.75) * 17;
      pos.set([Math.cos(a) * r, Math.sin(a) * r, -2 - rand() * DEPTH], i * 3);
      seed[i] = rand();
      size[i] = 0.7 + rand() * rand() * 3.2;
    }
    const pg = new THREE.BufferGeometry();
    pg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    pg.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    pg.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    pg.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, -DEPTH / 2), DEPTH);
    const pm = particleMaterial();
    const points = new THREE.Points(pg, pm);
    points.frustumCulled = false;
    points.renderOrder = -2;

    // Additive soft glow sprites: a few large, faint lights drifting in depth (bloom without post-processing).
    const GLOWS = Math.round(26 * stars + 6);
    const gpos = new Float32Array(GLOWS * 3);
    const gseed = new Float32Array(GLOWS);
    const gsize = new Float32Array(GLOWS);
    for (let i = 0; i < GLOWS; i++) {
      const a = rand() * Math.PI * 2;
      const r = 2 + Math.pow(rand(), 0.8) * 14;
      gpos.set([Math.cos(a) * r, Math.sin(a) * r, -6 - rand() * (DEPTH - 6)], i * 3);
      gseed[i] = rand();
      gsize[i] = 5 + rand() * 9;
    }
    const gg = new THREE.BufferGeometry();
    gg.setAttribute("position", new THREE.BufferAttribute(gpos, 3));
    gg.setAttribute("aSeed", new THREE.BufferAttribute(gseed, 1));
    gg.setAttribute("aSize", new THREE.BufferAttribute(gsize, 1));
    gg.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, -DEPTH / 2), DEPTH);
    const gm = particleMaterial(180, 34, true);
    const sprites = new THREE.Points(gg, gm);
    sprites.frustumCulled = false;
    sprites.renderOrder = -3;

    const sg = new THREE.InstancedBufferGeometry();
    sg.setAttribute("position", new THREE.BufferAttribute(new Float32Array([0, -1, 0, 1, -1, 0, 1, 1, 0, 0, 1, 0]), 3));
    sg.setIndex([0, 1, 2, 0, 2, 3]);
    const start = new Float32Array(streaks * 3);
    const len = new Float32Array(streaks);
    const sseed = new Float32Array(streaks);
    for (let i = 0; i < streaks; i++) {
      const a = rand() * Math.PI * 2;
      const r = 1.4 + Math.pow(rand(), 0.8) * 13;
      start.set([Math.cos(a) * r, Math.sin(a) * r, -3 - rand() * DEPTH], i * 3);
      len[i] = 3 + rand() * 7;
      sseed[i] = rand();
    }
    sg.setAttribute("aStart", new THREE.InstancedBufferAttribute(start, 3));
    sg.setAttribute("aLen", new THREE.InstancedBufferAttribute(len, 1));
    sg.setAttribute("aSeed", new THREE.InstancedBufferAttribute(sseed, 1));
    sg.instanceCount = streaks;
    sg.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, -DEPTH / 2), DEPTH);
    const sm = streakMaterial();
    const lines = new THREE.Mesh(sg, sm);
    lines.frustumCulled = false;
    lines.renderOrder = -1;

    const layers = STAR_LAYERS.map((spec, li) => {
      const n = Math.round(spec.count * stars);
      const p = new Float32Array(n * 3);
      const s = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const a = rand() * Math.PI * 2;
        const r = spec.radius[0] + Math.sqrt(rand()) * (spec.radius[1] - spec.radius[0]);
        p.set([Math.cos(a) * r, Math.sin(a) * r, spec.z[0] + rand() * (spec.z[1] - spec.z[0])], i * 3);
        s[i] = rand();
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(p, 3));
      g.setAttribute("aSeed", new THREE.BufferAttribute(s, 1));
      g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, (spec.z[0] + spec.z[1]) / 2), 200);
      const m = starMaterial(spec.size);
      const pts = new THREE.Points(g, m);
      pts.frustumCulled = false;
      pts.renderOrder = -4 + li * 0.1;
      const holder = new THREE.Group();
      holder.add(pts);
      return { holder, g, m, follow: spec.follow };
    });

    const bg = new THREE.BufferGeometry();
    bg.setAttribute("position", new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
    const bm = bloomMaterial();
    const glow = new THREE.Mesh(bg, bm);
    glow.frustumCulled = false;
    glow.renderOrder = -3;

    const group = new THREE.Group();
    group.add(...layers.map((l) => l.holder), points, sprites, lines, glow);
    group.visible = false;
    return { group, pg, pm, gg, gm, sg, sm, layers, bg, bm };
  }, [particles, streaks, stars]);

  useEffect(
    () => () => {
      rig.pg.dispose();
      rig.pm.dispose();
      rig.gg.dispose();
      rig.gm.dispose();
      rig.sg.dispose();
      rig.sm.dispose();
      rig.bg.dispose();
      rig.bm.dispose();
      rig.layers.forEach((l) => {
        l.g.dispose();
        l.m.dispose();
      });
    },
    [rig],
  );

  const time = useRef(0);
  useFrame((state, delta) => {
    const s = read();
    rig.group.visible = s.universe > 0.003 || s.bloom > 0.003;
    if (!rig.group.visible) return;
    if (!reduced) time.current += Math.min(delta, 1 / 20);
    const t = time.current;
    const dpr = state.viewport.dpr;
    const camZ = state.camera.position.z;
    rig.pm.uniforms.uTime.value = t;
    rig.pm.uniforms.uPixelRatio.value = dpr;
    rig.pm.uniforms.uOpacity.value = s.universe;
    rig.pm.uniforms.uHue.value = s.hue;
    rig.gm.uniforms.uTime.value = t * 0.6;
    rig.gm.uniforms.uPixelRatio.value = dpr;
    rig.gm.uniforms.uOpacity.value = s.universe * 0.9;
    rig.gm.uniforms.uHue.value = s.hue;
    rig.sm.uniforms.uTime.value = t;
    rig.sm.uniforms.uRes.value.set(state.size.width * dpr, state.size.height * dpr);
    rig.sm.uniforms.uWidth.value = 2.2 * dpr;
    rig.sm.uniforms.uSpeed.value = s.speed;
    rig.sm.uniforms.uOpacity.value = s.universe;
    rig.sm.uniforms.uHue.value = s.hue;
    for (const l of rig.layers) {
      l.holder.position.z = camZ * l.follow;
      l.m.uniforms.uTime.value = t;
      l.m.uniforms.uPixelRatio.value = dpr;
      l.m.uniforms.uOpacity.value = s.universe;
      l.m.uniforms.uHue.value = s.hue;
    }
    rig.bm.uniforms.uAspect.value = state.size.width / Math.max(1, state.size.height);
    rig.bm.uniforms.uCenter.value.set(s.center[0], s.center[1]);
    rig.bm.uniforms.uIntensity.value = s.bloom * 0.7;
    rig.bm.uniforms.uHue.value = s.hue;
    rig.bm.uniforms.uTime.value = t;
  });

  return <primitive object={rig.group} />;
}
