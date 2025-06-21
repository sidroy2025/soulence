import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => {
          // Route API calls to appropriate services
          if (path.startsWith('/api/v1/auth') || path.startsWith('/api/v1/users')) {
            return path; // Auth service (3001)
          }
          if (path.startsWith('/api/v1/mood') || path.startsWith('/api/v1/crisis')) {
            // Wellness service (3002)
            return path.replace('/api', 'http://localhost:3002/api');
          }
          return path;
        }
      }
    }
  }
})