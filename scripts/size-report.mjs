import { gzipSync } from 'node:zlib'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const DIST = 'dist'

const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

const listFiles = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    return entry.isDirectory() ? listFiles(path) : [{ path, size: statSync(path).size }]
  })

const files = listFiles(DIST).sort((a, b) => b.size - a.size)

console.log('\n─── Bundle Contents ───\n')
let totalRaw = 0
let totalGzip = 0

for (const file of files) {
  const buffer = readFileSync(file.path)
  const gzip = gzipSync(buffer).length
  totalRaw += file.size
  totalGzip += gzip
  const rel = file.path.replace(DIST + '/', '')
  console.log(
    `  ${rel.padEnd(40)} ${formatBytes(file.size).padStart(10)}  (${formatBytes(gzip)} gzipped)`
  )
}

console.log(
  `\n  ${'TOTAL'.padEnd(40)} ${formatBytes(totalRaw).padStart(10)}  (${formatBytes(totalGzip)} gzipped)`
)

// Per-format JS sizes. ESM and CJS are alternative builds of the same code —
// consumers load one, not both. We report them separately so the number
// reflects what an actual consumer downloads.
const esmPath = join(DIST, 'index.js')
const cjsPath = join(DIST, 'index.cjs')

const report = (label, path) => {
  try {
    const buffer = readFileSync(path)
    const gzip = gzipSync(buffer).length
    console.log(
      `  ${label.padEnd(40)} ${formatBytes(buffer.length).padStart(10)}  (${formatBytes(gzip)} gzipped)`
    )
    return gzip
  } catch {
    return null
  }
}

console.log('\n─── Consumer Cost (per module format) ───\n')
const esmGzip = report('ESM (modern bundlers)', esmPath)
report('CJS (legacy consumers)', cjsPath)

// Heuristic: if the ESM bundle (the one modern bundlers pick) is
// much larger than expected, react/react-dom probably slipped in.
// Our dependency tree (Floating UI + Downshift + Fuse.js + component code)
// lands around 60–70 KB gzipped unminified. React-DOM alone would add
// another ~40 KB gzipped on top.
const HEURISTIC_CEILING = 90 * 1024 // 90 KB gzipped

if (esmGzip !== null && esmGzip > HEURISTIC_CEILING) {
  console.log(
    `\n  ⚠️  ESM bundle is ${formatBytes(esmGzip)} gzipped, above the ${formatBytes(HEURISTIC_CEILING)} heuristic.`
  )
  console.log('     Verify react/react-dom are in `rollupOptions.external`.')
  process.exit(1)
} else {
  console.log('\n  ✓  ESM bundle size is consistent with React being externalized.')
}
