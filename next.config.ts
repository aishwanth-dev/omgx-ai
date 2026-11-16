import type { NextConfig } from "next";

/**
 * OMGX AI - standalone website configuration.
 *
 * `cacheComponents` (and therefore `partialPrefetching`) is intentionally
 * disabled. With it enabled, Next.js keeps previously visited routes mounted
 * inside a hidden React <Activity>. This site uses WebGL canvases and GSAP
 * ScrollTrigger pins that must be fully torn down when a route is left, so
 * normal unmount semantics are the safer default. Every route is static
 * content, so nothing is lost by disabling it.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Next 16 blocks dev-only resources (the HMR WebSocket, /_next/* dev chunks) requested from any origin other than
  // localhost. Opening the dev server as 127.0.0.1 or by LAN IP then fails the WebSocket handshake and the dev
  // overlay reports it as an issue. Dev only; this has no effect on `next build` or production.
  allowedDevOrigins: ["127.0.0.1", "192.168.*.*", "10.*.*.*"],
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
