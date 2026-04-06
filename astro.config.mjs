import { defineConfig, envField } from "astro/config";
import node from "@astrojs/node";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  output: "server",

  adapter: node({
    mode: "standalone",
  }),

  integrations: [react()],

  vite: {
    plugins: [
      tailwindcss(),
      // Mesh SDK transitive deps need browser polyfills for crypto/buffer.
      // Safe in Astro: client:only islands are excluded from the server build,
      // so the process shim never shadows Node's real process.env.
      nodePolyfills({
        include: ["crypto", "buffer"],
        exclude: ["process"],
        globals: { Buffer: true, process: false },
        protocolImports: false,
      }),
    ],
  },

  server: {
    host: true,
    port: 3000,
  },

  env: {
    schema: {
      ANDAMIO_API_KEY: envField.string({
        context: "server",
        access: "secret",
      }),
      ANDAMIO_GATEWAY_URL: envField.string({
        context: "server",
        access: "public",
      }),
      CARDANO_NETWORK: envField.string({
        context: "server",
        access: "public",
        default: "preprod",
        optional: true,
      }),
      COURSE_ID: envField.string({
        context: "server",
        access: "public",
        optional: true,
      }),
      PUBLIC_ACCESS_TOKEN_POLICY_ID: envField.string({
        context: "client",
        access: "public",
        optional: true,
      }),
      PUBLIC_GATEWAY_URL: envField.string({
        context: "client",
        access: "public",
        optional: true,
      }),
      PUBLIC_CARDANO_NETWORK: envField.string({
        context: "client",
        access: "public",
        default: "preprod",
        optional: true,
      }),
    },
  },
});
