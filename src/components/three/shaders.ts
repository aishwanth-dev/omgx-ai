import * as THREE from "three";

/**
 * Surface shader for the neural-core ribbons and tubes: dark graphite body,
 * mint fresnel rim, ribbon edge light and energy pulses that travel along the
 * length of each strand (uv.x runs along the curve).
 */
export const createCoreMaterial = (opts: { seed: number; edge: number; base?: string }) =>
  new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uEnergy: { value: 0.4 },
      uRim: { value: 0.9 },
      uEdge: { value: opts.edge },
      uOpacity: { value: 1 },
      uSeed: { value: opts.seed },
      uFlowSpeed: { value: 0.12 },
      uBase: { value: new THREE.Color(opts.base ?? "#1b2427") },
      uAccent: { value: new THREE.Color("#00e89a") },
      uLightDir: { value: new THREE.Vector3(0.45, 0.65, 0.6).normalize() },
    },
    vertexShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vViewPos;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vViewPos = mv.xyz;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uEnergy;
      uniform float uRim;
      uniform float uEdge;
      uniform float uOpacity;
      uniform float uSeed;
      uniform float uFlowSpeed;
      uniform vec3 uBase;
      uniform vec3 uAccent;
      uniform vec3 uLightDir;
      varying vec3 vNormal;
      varying vec3 vViewPos;
      varying vec2 vUv;
      void main() {
        vec3 n = normalize(vNormal);
        if (!gl_FrontFacing) n = -n;
        vec3 v = normalize(-vViewPos);
        vec3 l = normalize(uLightDir);
        float diff = max(dot(n, l), 0.0);
        float fres = pow(1.0 - max(dot(n, v), 0.0), 2.4);
        float spec = pow(max(dot(reflect(-l, n), v), 0.0), 36.0);
        vec3 col = uBase * (0.3 + 0.7 * diff) + vec3(0.85, 1.0, 0.95) * spec * 0.7;
        col += mix(uAccent, vec3(0.75, 1.0, 0.9), 0.25) * pow(fres, 1.6) * uRim * 0.32;
        float flow = fract(vUv.x * 3.0 - uTime * uFlowSpeed + uSeed);
        float pulse = smoothstep(0.0, 0.015, flow) * (1.0 - smoothstep(0.015, 0.11, flow));
        col += mix(uAccent, vec3(1.0), 0.35) * pulse * uEnergy * 1.2;
        float edge = smoothstep(0.43, 0.5, abs(vUv.y - 0.5)) * uEdge;
        col += uAccent * edge * 0.55;
        gl_FragColor = vec4(col, uOpacity);
      }
    `,
    side: THREE.DoubleSide,
    transparent: true,
  });

/** Glowing point sprites for neural nodes. */
export const createNodeMaterial = () =>
  new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: 1 },
      uIntensity: { value: 1 },
      uOpacity: { value: 1 },
      uColor: { value: new THREE.Color("#7dffc9") },
    },
    vertexShader: /* glsl */ `
      attribute float aPhase;
      attribute float aSize;
      uniform float uTime;
      uniform float uPixelRatio;
      uniform float uIntensity;
      varying float vPulse;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        float pulse = 0.5 + 0.5 * sin(uTime * 1.6 + aPhase * 6.2831);
        vPulse = pulse;
        gl_PointSize = aSize * uPixelRatio * (0.75 + 0.6 * pulse * uIntensity) * (60.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity;
      uniform float uIntensity;
      varying float vPulse;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        float glow = smoothstep(0.5, 0.0, d);
        float core = smoothstep(0.16, 0.0, d);
        vec3 col = mix(uColor, vec3(1.0), core);
        float a = (glow * glow * (0.35 + 0.65 * vPulse) * uIntensity + core) * uOpacity;
        gl_FragColor = vec4(col * a, a);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

/** Connection lines with travelling light; `aT` runs 0→1 along each segment. */
export const createConnectionMaterial = () =>
  new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uBase: { value: 0.12 },
      uSelected: { value: 0 },
      uOpacity: { value: 1 },
      uColor: { value: new THREE.Color("#00e89a") },
    },
    vertexShader: /* glsl */ `
      attribute float aT;
      attribute float aSel;
      attribute float aSeed;
      varying float vT;
      varying float vSel;
      varying float vSeed;
      void main() {
        vT = aT; vSel = aSel; vSeed = aSeed;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uBase;
      uniform float uSelected;
      uniform float uOpacity;
      uniform vec3 uColor;
      varying float vT;
      varying float vSel;
      varying float vSeed;
      void main() {
        float f = fract(vT - uTime * (0.35 + vSeed * 0.4) + vSeed);
        float pulse = smoothstep(0.0, 0.04, f) * (1.0 - smoothstep(0.04, 0.3, f));
        float a = uBase + vSel * uSelected * (0.35 + pulse * 1.4) + pulse * 0.25;
        a *= uOpacity;
        gl_FragColor = vec4(uColor * a, a);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

/** Ambient particles that morph between an orbital shell and a flowing tunnel. */
export const createParticleMaterial = () =>
  new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uTunnel: { value: 0 },
      uTravel: { value: 0 },
      uOpacity: { value: 0.6 },
      uPixelRatio: { value: 1 },
      uColor: { value: new THREE.Color("#a5f3d2") },
    },
    vertexShader: /* glsl */ `
      attribute vec3 aTunnel;
      attribute float aSeed;
      uniform float uTime;
      uniform float uTunnel;
      uniform float uTravel;
      uniform float uPixelRatio;
      varying float vAlpha;
      void main() {
        vec3 shell = position;
        float a = uTime * 0.05 * (0.5 + aSeed);
        shell.xz = mat2(cos(a), -sin(a), sin(a), cos(a)) * shell.xz;
        vec3 tunnel = aTunnel;
        tunnel.z = mod(tunnel.z + uTravel * (0.8 + aSeed * 0.4), 36.0) - 32.0;
        vec3 p = mix(shell, tunnel, uTunnel);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = (1.4 + aSeed * 2.2) * uPixelRatio * (24.0 / max(1.0, -mv.z));
        vAlpha = 0.35 + 0.65 * fract(aSeed * 13.0 + uTime * 0.07);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        float a = smoothstep(0.5, 0.05, d) * vAlpha * uOpacity;
        gl_FragColor = vec4(uColor * a, a);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
