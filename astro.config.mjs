import { defineConfig, envField } from "astro/config";
import node from "@astrojs/node";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  output: "server",

  adapter: node({
    mode: "standalone",
  }),

  integrations: [react()],

  vite: {
    plugins: [tailwindcss()],
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
