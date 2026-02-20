import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import visionCraft from '@visioncraft/vite-plugin';

export default defineConfig({
  plugins: [
    react(),
    visionCraft({
      root: __dirname,
      enabled: true,
      enableHMR: true,
    }),
  ],
  server: {
    port: 5175,
  },
});
