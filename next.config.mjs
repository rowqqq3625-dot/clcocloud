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
  }
};

export default nextConfig;
