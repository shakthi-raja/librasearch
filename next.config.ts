import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  typedRoutes: true,
  serverExternalPackages: ["@node-rs/argon2", "pino", "pino-pretty"],
  experimental: {
    // forbidden() renders app/forbidden.tsx with a real 403 status
    authInterrupts: true,
  },
};

export default nextConfig;
