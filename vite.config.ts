import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  resolve: {
      alias: {
        '@': pathResolve('./src')
      },
       extensions: ['.js', '.json', '.ts', '.tsx']
    },
  plugins: [react()],
  
})

function pathResolve(dir: string): string {
  return resolve(process.cwd(), '.', dir)
}