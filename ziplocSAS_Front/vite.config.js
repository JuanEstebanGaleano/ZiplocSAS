import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/groq': {
        target: 'https://api.groq.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/groq/, ''),
        headers: {
          'Authorization': 'Bearer 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',
        },
      },
    },
  },
});