import { readdir, stat } from 'node:fs/promises'
import path from 'node:path'

const root = path.resolve('dist')
const maxBytes = 2 * 1024 * 1024

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      files.push(...await collectFiles(fullPath))
    } else if (/\.(js|css)$/i.test(entry.name)) {
      files.push(fullPath)
    }
  }

  return files
}

const files = await collectFiles(root)

if (files.length === 0) {
  throw new Error('No JavaScript or CSS files found in dist/')
}

let totalBytes = 0

for (const file of files) {
  totalBytes += (await stat(file)).size
}

console.log(`Production JS/CSS: ${totalBytes.toLocaleString()} bytes`)
console.log(`Budget: ${maxBytes.toLocaleString()} bytes`)

if (totalBytes > maxBytes) {
  throw new Error('Production JS/CSS bundle exceeds the 2 MiB budget')
}

console.log('PASS: Production bundle is within budget')