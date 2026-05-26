/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"]
  },
  async redirects() {
    return [
      {
        source: "/docs/policy",
        destination: "/docs/terms",
        permanent: false
      }
    ];
  },
  async headers() {
    // Safe security headers applied site-wide. We intentionally exclude CSP
    // here — CSP is handled in middleware.ts only on admin surfaces so the
    // public marketing pages keep working with their existing inline scripts.
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "X-Frame-Options", value: "DENY" }
        ]
      }
    ];
  }
};

export default nextConfig;
