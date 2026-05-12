import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/*
New plugin added = define it here, react and tailwind are such
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
})