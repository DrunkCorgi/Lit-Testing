import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        checkbox: fileURLToPath(new URL('./src/checkbox-testing/index.html', import.meta.url)),
      },
    },
  },
});
