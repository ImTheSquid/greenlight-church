// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import vercel from "@astrojs/vercel";

// https://astro.build/config
export default defineConfig({
  output: "server",
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "load",
  },
  // Ship page CSS inside the HTML <head> instead of as a separate <link>.
  // Safari 18 can complete a view transition without applying the incoming
  // page's stylesheet (withastro/astro#15727), which renders the page
  // unstyled. Inlining removes the stylesheet fetch, so there is no
  // stylesheet left to drop. ~6.5kB per page.
  build: {
    inlineStylesheets: "always",
  },
  adapter: vercel({
    isr: {
      bypassToken: process.env.ISR_BYPASS_TOKEN,
      expiration: 1800,
      exclude: ["/api/revalidate"],
    },
  }),
  fonts: [
    {
      provider: fontProviders.local(),
      name: "Acid Grotesk",
      cssVariable: "--font-display",
      options: {
        variants: [
          {
            weight: 500,
            style: "normal",
            display: "swap",
            src: ["./src/assets/fonts/AcidGrotesk-Medium.woff2"],
          },
          {
            weight: 400,
            style: "normal",
            display: "swap",
            src: ["./src/assets/fonts/AcidGrotesk-Regular.woff2"],
          },
        ],
      },
    },
  ],
});
