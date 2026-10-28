import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // נתיבים יחסיים: עובד ב-GitHub Pages תחת כל שם מאגר
  server: { host: true },
});
