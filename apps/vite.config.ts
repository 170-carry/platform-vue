import { defineConfig } from '@vben/vite-config';

export default defineConfig(async () => {
  return {
    application: {},
    vite: {
      server: {
        proxy: {
          '/console': {
            changeOrigin: true,
            target: 'http://127.0.0.1:2700',
            ws: true,
          },
        },
      },
    },
  };
});
