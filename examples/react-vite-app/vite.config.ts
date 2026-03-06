import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import aiEye from '@ai-eye/vite-plugin';

export default defineConfig({
  plugins: [
    react(),
    aiEye({
      root: __dirname,
      enabled: true,
      enableHMR: true,
    }),
  ],
  server: {
    port: 5175,
  },
});
