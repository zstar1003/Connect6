import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        host: '0.0.0.0', // Listen on all network interfaces
        port: 5173,
        strictPort: true,
      },
      plugins: [react()],
      define: {
        // Explicitly define VITE_ variables for network access
        'import.meta.env.VITE_USE_LAN_SERVER': JSON.stringify(env.VITE_USE_LAN_SERVER),
        'import.meta.env.VITE_PEER_HOST': JSON.stringify(env.VITE_PEER_HOST),
        'import.meta.env.VITE_PEER_PORT': JSON.stringify(env.VITE_PEER_PORT),
        'import.meta.env.VITE_PEER_PATH': JSON.stringify(env.VITE_PEER_PATH),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
