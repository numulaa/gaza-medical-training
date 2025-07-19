import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { ManifestOptions, VitePWA } from "vite-plugin-pwa";
import manifestJson from "./public/manifest.json";

// Fix orientation and display types for manifest
const manifest: Partial<ManifestOptions> = {
	...manifestJson,
	orientation: "portrait",
	display: "standalone",
};

export default defineConfig({
	plugins: [
		react(),
		VitePWA({
			registerType: "autoUpdate",
			manifest,
			workbox: {
				globPatterns: ["**/*.{js,css,html,png,svg,ico,json}"],
			},
		}),
	],
	optimizeDeps: {
		exclude: ["lucide-react"],
	},
});
