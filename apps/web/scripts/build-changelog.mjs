import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

const root = process.cwd()
const sourcePath = join(root, 'data/changelog.json')
const publicPath = join(root, 'public/data/changelog.json')

const payload = JSON.parse(readFileSync(sourcePath, 'utf8'))
const output = `${JSON.stringify(payload, null, 2)}\n`

mkdirSync(dirname(publicPath), { recursive: true })
writeFileSync(publicPath, output, 'utf8')

console.log(`Built ${publicPath} from ${sourcePath}.`)
