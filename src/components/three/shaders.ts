import * as THREE from "three";

/**
 * Travelling energy trace for the hero object's Trace_* inlay strips. The GLB
 * strips are UV-unwrapped with uv.x running 0 → 1 along their length; a
 * smoothstep window moves along uv.x over a dim matcha base.
 */
export const createTraceMaterial = (seed = 0) =>
  new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uSpeed: { value: 0.11 },
      uSeed: { value: seed },
      uIntensity: { value: 1 },
      uOpacity: { value: 1 },
      uColor: { value: new THREE.Color("#4f7cff") },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uSpeed;
      uniform float uSeed;
      uniform float uIntensity;
      uniform float uOpacity;
      uniform vec3 uColor;
      varying vec2 vUv;
      void main() {
        float head = fract(uTime * uSpeed + uSeed);
        // Two windows per strip, half a loop apart; x is the wrapped distance to the nearest head.
        float x = abs(fract(vUv.x * 2.0 - head + 0.5) - 0.5);
        float window = 1.0 - smoothstep(0.015, 0.14, x);
        vec3 col = uColor * (0.16 + 1.7 * window * uIntensity) + vec3(0.6, 1.0, 0.85) * pow(window, 4.0) * 0.5 * uIntensity;
        gl_FragColor = vec4(col, uOpacity);
        #include <colorspace_fragment>
      }
    `,
    toneMapped: false,
  });
