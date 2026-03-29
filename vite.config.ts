import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  plugins: [
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
    // Mesh SDK transitive dependencies (@meshsdk/core-cst via @utxos/sdk)
    // import Node builtins (crypto, stream, buffer). This plugin provides
    // browser-compatible polyfills for the client bundle.
    nodePolyfills({
      include: ["crypto", "stream", "buffer"],
      globals: {
        Buffer: true,
      },
    }),
  ],
});
