import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

const BACKUPS_DIR = '.data-backups'
const MAX_BACKUPS = 200

/**
 * Dev-only endpoint that persists the app state to `data.json` in the project
 * root. The "Guardar cambios" button POSTs the full state here — this is the
 * ONLY thing that ever writes to data.json; the client never auto-persists.
 * When this endpoint is not available (e.g. a static production build) the
 * client falls back to downloading the JSON file instead.
 */
function saveDataPlugin(): Plugin {
  return {
    name: 'gestor-save-data',
    configureServer(server) {
      // data.json is the database — never let a stale cached response stand
      // in for the real current file.
      server.middlewares.use((req, res, next) => {
        if (req.url === '/data.json') res.setHeader('Cache-Control', 'no-store')
        next()
      })

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
            // Validate it parses and has the expected shape before writing.
            const parsed = JSON.parse(body)
            if (!parsed || !Array.isArray(parsed.projects) || !Array.isArray(parsed.tasks)) {
              throw new Error('invalid payload shape (missing projects/tasks)')
            }
            const file = path.resolve(server.config.root, 'data.json')

            // Snapshot the previous file before overwriting it. This is the
            // safety net for exactly this kind of incident: any bad write
            // is always recoverable from here, no manual backups needed.
            if (fs.existsSync(file)) {
              const backupsDir = path.resolve(server.config.root, BACKUPS_DIR)
              fs.mkdirSync(backupsDir, { recursive: true })
              const stamp = new Date().toISOString().replace(/[:.]/g, '-')
              fs.copyFileSync(file, path.join(backupsDir, `data-${stamp}.json`))
              const backups = fs.readdirSync(backupsDir).filter((f) => f.startsWith('data-')).sort()
              for (const f of backups.slice(0, Math.max(0, backups.length - MAX_BACKUPS))) {
                fs.unlinkSync(path.join(backupsDir, f))
              }
            }

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
