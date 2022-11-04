import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Pomo-san",
        short_name: "Pomo-san",
        description: "Simple pomodoro app to burst your productivity",
        theme_color: "#FFF2F2",
        icons: [
          {
            src: "/images/pomo-san(192x192).png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/images/pomo-san(512x512).png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
});
