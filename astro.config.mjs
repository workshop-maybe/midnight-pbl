import { defineConfig, envField } from "astro/config";
import node from "@astrojs/node";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";
// Site origin lives in BRANDING so forkers edit one file. `@astrojs/sitemap`
// and prerendered canonical URLs both derive their absolute URLs from `site`.
import { BRANDING } from "./src/config/branding.ts";

export default defineConfig({
  output: "server",

  site: BRANDING.siteUrl,

  adapter: node({
    mode: "standalone",
  }),

  integrations: [
    react(),
    sitemap({
      // Exclude auth-gated SSR pages. The homepage and every
      // /learn/[moduleCode]/[lessonIndex] page are prerendered and
      // auto-discovered by the integration.
      filter: (page) =>
        !page.includes("/dashboard") && !page.includes("/assignment"),
    }),
  ],

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
      // Server-only secret — runtime-resolved, never inlined to client.
      ANDAMIO_API_KEY: envField.string({
        context: "server",
        access: "secret",
      }),
      // Selects which entry in src/config/networks.ts is active.
      // Client-public so the same value drives both bundles; read via
      // `CURRENT_NETWORK` from src/config/network.ts.
      PUBLIC_ANDAMIO_NETWORK: envField.enum({
        context: "client",
        access: "public",
        values: ["preprod", "mainnet"],
        default: "preprod",
        optional: true,
      }),
    },
  },
});
