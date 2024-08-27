#!/usr/bin/env node
/* eslint-disable no-undef */

import { createServer } from 'http'
import url from 'url'
import fs from 'fs'
import path from 'path'

const MIME_TYPES = {
  '.ico': 'image/x-icon',
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2'
}

const PORT = parseInt(process.argv[2]) || 3000

createServer((req, res) => {
  const { pathname } = url.parse(req.url)
  const sanitizePath = path.normalize(pathname).replace(/^(\.\.[/\\])+/, '')
  let filepath = path.join(import.meta.dirname, '/dist/', sanitizePath)

  fs.stat(filepath, function (err, stats) {
    if (err) {
      res.statusCode = 404
      res.end(`File ${filepath} not found!`)
      return
    }

    if (stats.isDirectory()) {
      filepath += '/index.html'
    }

    fs.readFile(filepath, (err, data) => {
      if (err) {
        res.statusCode = 500
        res.end(`Error getting the file: ${err}.`)
        return
      }
      const { ext } = path.parse(filepath)
      res.setHeader('Content-type', MIME_TYPES[ext] || 'text/plain')
      res.end(data)
    })
  })
}).listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`)
})
