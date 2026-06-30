import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Dev-only endpoint that persists the app state to `data.json` in the project
 * root. The "Guardar cambios" button POSTs the full state here. When this
 * endpoint is not available (e.g. a static production build) the client falls
 * back to downloading the JSON file instead.
 */
function saveDataPlugin(): Plugin {
  return {
    name: 'gestor-save-data',
    configureServer(server) {
      server.middlewares.use('/api/save', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('Method Not Allowed')
          return
        }
        let body = ''
        req.on('data', (chunk) => (body += chunk))
        req.on('end', () => {
          try {
            // Validate it parses before writing.
            const parsed = JSON.parse(body)
            const file = path.resolve(server.config.root, 'data.json')
            fs.writeFileSync(file, JSON.stringify(parsed, null, 2) + '\n', 'utf-8')
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: true, savedAt: new Date().toISOString() }))
          } catch (err) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: false, error: String(err) }))
          }
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), saveDataPlugin()],
})
