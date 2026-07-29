import { defineConfig, loadEnv } from 'vite'
import solid from 'vite-plugin-solid'

// El target del proxy de Vite para /api lee la misma variable VITE_API_URL
// que el frontend. Si VITE_API_URL = "http://192.168.1.20:8080":
//   - el frontend hace fetch a http://192.168.1.20:8080/api/...  (vía apiUrl)
//   - el proxy de Vite NO interviene (solo opera sobre rutas relativas)
// Si VITE_API_URL está vacío (default), el frontend usa rutas relativas
// (/api/...) y el proxy las redirige a localhost:8080.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.VITE_API_URL || 'http://localhost:8080';

  return {
    plugins: [solid()],
    server: {
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  };
});