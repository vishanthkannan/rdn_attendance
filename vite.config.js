import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  envPrefix: ['VITE_', 'SUPABASE_'],
  server: {
    host: true, // Listens on all IP addresses (0.0.0.0) including your local network IP
    port: 5173
  }
})
