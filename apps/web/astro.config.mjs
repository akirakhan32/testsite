import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://www.codifypros.com",
  trailingSlash: "never",
  server: { port: 4321 },
});
