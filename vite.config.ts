import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Listen on every interface (IPv6 included). Without this Vite bound
    // IPv4 only, so browsers resolving `localhost` to ::1 first would hang
    // ("localhost timed out"); it also exposes the dev server on the LAN for
    // testing from a phone (http://<machine-ip>:5173).
    host: true,
  },
})
