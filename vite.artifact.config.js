// בנייה לקובץ HTML יחיד (לתצוגה חיה כ-Artifact)
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({ plugins: [react(), viteSingleFile()], build: { outDir: 'dist-artifact' } });
