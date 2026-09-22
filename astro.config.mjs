// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import vercel from "@astrojs/vercel";

// https://astro.build/config
export default defineConfig({
  output: "server",
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
