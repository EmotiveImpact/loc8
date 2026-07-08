import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// Loc8 Command is a plain web app (control-room / large-screen). It reuses the
// shared @loc8/engine, but ONLY its pure, RN-free modules (core/*, ui/theme) via
// subpath imports — never the barrel, which pulls in react-native via the mesh
// service. The aliases below point at the engine source so the app and the
// engine typecheck/bundle as one unit in the workspace.
const enginePath = fileURLToPath(new URL('../../packages/engine/src', import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@loc8/engine/': `${enginePath}/`,
    },
  },
  server: { port: 5182 },
  build: { outDir: 'dist', sourcemap: true },
});
