/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    headers() {
      return [
        {
          source: "/.well-known/apple-app-site-association",
          headers: [{ key: "content-type", value: "application/json" }],
        },
      ];
    },
  },
};

export default nextConfig;
