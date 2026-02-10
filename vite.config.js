import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), svgr(), tailwindcss()],
  resolve: {
    alias: {
      src: fileURLToPath(new URL('./src', import.meta.url)),
      components: fileURLToPath(new URL('./src/components', import.meta.url)),
      assets: fileURLToPath(new URL('./src/assets', import.meta.url)),
      service: fileURLToPath(new URL('./src/service', import.meta.url)),
      hooks: fileURLToPath(new URL('./src/hooks', import.meta.url)),
      lib: fileURLToPath(new URL('./src/lib', import.meta.url)),
    },
  },
});
