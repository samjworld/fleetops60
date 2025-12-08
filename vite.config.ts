import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite config tuned for GitHub Pages
export default defineConfig({
  plugins: [react()],
  // Change this if your repo name is different
  base: '/fleetops-60/',
});
