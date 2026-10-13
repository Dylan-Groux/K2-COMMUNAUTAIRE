import { mergeConfig } from "vite"
import { defineConfig } from "vitest/config"
import viteConfig from "./vite.config.ts"

// o2switch (CloudLinux) impose NODE_ENV=production à tout process node :
// React chargerait sa version de prod, sans act(), et les tests de rendu échoueraient.
process.env.NODE_ENV = "test"

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: "jsdom",
      setupFiles: ["./src/test/setup.ts"],
      css: false,
    },
  }),
)
