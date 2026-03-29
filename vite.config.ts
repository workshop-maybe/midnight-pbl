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
    // Mesh SDK transitive deps need browser polyfills for crypto/stream/buffer.
    // protocolImports: false prevents aliasing bare "stream" → "stream-browserify"
    // which breaks SSR (stream-browserify uses CJS `module.exports` in ESM context).
    nodePolyfills({
      include: ["crypto", "buffer"],
      globals: { Buffer: true },
      protocolImports: false,
    }),
  ],
  ssr: {
    // Let Node handle these natively during SSR — don't bundle or polyfill them.
    // Mesh SDK is in .client.tsx files so it won't run during SSR, but Vite still
    // resolves transitive deps during dev. Externalizing prevents polyfill conflicts.
    external: [
      "crypto",
      "stream",
      "buffer",
      "util",
      "events",
    ],
  },
});
