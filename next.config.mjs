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
];

const nextConfig = {
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
