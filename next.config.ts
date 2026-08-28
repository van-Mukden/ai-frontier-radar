import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 是原生模块，交给 node 运行时而不是打包
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
