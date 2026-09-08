// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

// https://astro.build/config
export default defineConfig({
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
                ],
            },
        },
    ],
});
