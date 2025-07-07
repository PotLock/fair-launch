import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { pluginNodePolyfill } from '@rsbuild/plugin-node-polyfill';

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginNodePolyfill()
  ],
  source: {
    define: {
      'process.env.PUBLIC_SOL_NETWORK': JSON.stringify(process.env.PUBLIC_SOL_NETWORK),
      'process.env.PUBLIC_JWT_PINATA_SECRET': JSON.stringify(process.env.PUBLIC_JWT_PINATA_SECRET),
      'process.browser': true,
      'global':{}
    },
    entry: {
      index: "./src/main.tsx"
    }
  },
  html: {
    template: "./index.html",
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000"
      },
    },
  },
  dev: {
    writeToDisk: true,
  }
});