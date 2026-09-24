/** @type {import('next').NextConfig} */
const SITE_ORIGIN = process.env.SITE_ORIGIN ?? "*";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  // The CMS is a private admin tool — keep it out of every search index. This
  // HTTP header covers non-HTML routes too and, unlike a robots.txt Disallow,
  // still lets crawlers fetch the page and SEE the noindex (a Disallow would
  // hide it, leaving a stale URL-only listing). Pairs with the `robots` meta in
  // app/layout.tsx.
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
];

const nextConfig = {
  // Sharp is loaded as a native addon. Turbopack externalizes it, but the
  // Vercel function then misses libvips (libvips-cpp.so.8.18.3) and /api/media
  // dies on startup. These globs copy the linux-x64 binaries into that function.
  serverExternalPackages: ["sharp"],
  outputFileTracingIncludes: {
    "/api/media": [
      "./node_modules/sharp/**/*",
      "./node_modules/@img/sharp-linux-x64/**/*",
      "./node_modules/@img/sharp-libvips-linux-x64/**/*",
    ],
  },
  async headers() {
    return [
      // Baseline security headers on every route.
      { source: "/:path*", headers: securityHeaders },
      // CORS for the published read API so browsers on the site's origin may
      // call it directly if needed (server-side fetches don't require this).
      {
        source: "/api/content/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: SITE_ORIGIN },
          { key: "Access-Control-Allow-Methods", value: "GET, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "x-api-key" },
        ],
      },
    ];
  },
};

export default nextConfig;
