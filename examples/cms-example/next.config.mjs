import { withPayload } from "@payloadcms/next/withPayload";
import path from "path";
import { fileURLToPath } from "url";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(dirname, "../.."),
  async redirects() {
    return [{ source: "/", destination: "/admin", permanent: false }];
  },
  serverExternalPackages: ["jsdom"],
  webpack: (webpackConfig, { isServer }) => {
    if (isServer) {
      webpackConfig.externals.push({ jsdom: "commonjs jsdom" });
    }

    webpackConfig.resolve.extensionAlias = {
      ".cjs": [".cts", ".cjs"],
      ".js": [".ts", ".tsx", ".js", ".jsx"],
      ".mjs": [".mts", ".mjs"],
    };

    return webpackConfig;
  },
};

export default withPayload(nextConfig, { devBundleServerPackages: false });
