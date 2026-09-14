import { defineConfig } from "astro/config";

export default defineConfig({
  site: process.env.SITE_URL || "https://www.codifypros.com",
  base: process.env.BASE_PATH || "/",
  trailingSlash: "never",
  server: { port: 4321 },
});
