import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // React Three Fiber scenes update memoised Three.js geometry, materials and
    // uniforms inside useFrame. That mutation is the intended R3F pattern (it
    // avoids React re-renders every frame), so the compiler immutability rule
    // is disabled for the WebGL layer only.
    files: ["src/components/three/**/*.tsx"],
    rules: {
      "react-hooks/immutability": "off",
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", ".cache/**", "qa-output/**", "scripts/**", "public/draco/**"]),
]);

export default eslintConfig;
