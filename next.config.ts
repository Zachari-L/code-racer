import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "pg", "bcryptjs", "sharp"],
  experimental: {
    serverActions: {
      // Avatars may be up to 2 MB (AUTH-04), plus multipart overhead.
      bodySizeLimit: "3mb",
    },
  },
};

export default nextConfig;
