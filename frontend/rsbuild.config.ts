import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { pluginNodePolyfill } from '@rsbuild/plugin-node-polyfill';
import path from "path"

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginNodePolyfill()
  ],
  source: {
    define: {
      'process.browser': true,
      'global': 'globalThis'
    },
    entry: {
      index: "./src/main.tsx"
    }
  },
  resolve: {
    alias: {
      stream: "stream-browserify",
      buffer: "buffer",
      process: "process/browser",
      crypto: "crypto-browserify",
      fs: false,
      path: false,
      os: false,
      algosdk: false,
      react: path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
    },
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