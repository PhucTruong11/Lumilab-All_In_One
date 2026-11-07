import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5175,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8002',
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
