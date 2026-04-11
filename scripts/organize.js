import { promises as fs } from 'fs'
import path from 'path'

const args = process.argv.slice(2)
function getArg(name, def) {
  const i = args.findIndex(a => a === `--${name}`)
  if (i !== -1 && args[i + 1]) return args[i + 1]
  const j = args.findIndex(a => a.startsWith(`--${name}=`))
  if (j !== -1) return args[j].split('=')[1]
  return def
}

const lang = getArg('lang', 'ar')
const moveMode = args.includes('--move')
const dryRun = args.includes('--dry-run')
const srcDir = getArg('src', process.cwd())

async function readJSON(p) {
  try { return JSON.parse(await fs.readFile(p, 'utf8')) } catch { return null }
}

const pkg = await readJSON(path.join(srcDir, 'package.json'))
const projectName = getArg('project-name', pkg?.name || 'project')
const outRoot = getArg('out', path.join(srcDir, `organized-${projectName}`))

const messages = {
  ar: {
    start: `بدء تنظيم الملفات في: ${srcDir}`,
    creating: `إنشاء المجلد الرئيسي: ${outRoot}`,
    done: 'اكتمل التنظيم',
    summary: 'ملخص',
    copied: 'تم النسخ',
    moved: 'تم النقل',
    skipped: 'تم التخطي',
    logPath: 'تم إنشاء سجل التغييرات في',
    report: 'تقرير التنظيم',
    category: 'الفئة'
  },
  en: {
    start: `Starting organization at: ${srcDir}`,
    creating: `Creating root folder: ${outRoot}`,
    done: 'Organization completed',
    summary: 'Summary',
    copied: 'Copied',
    moved: 'Moved',
    skipped: 'Skipped',
    logPath: 'Change log written to',
    report: 'Organization report',
    category: 'Category'
  }
}[lang === 'en' ? 'en' : 'ar']

const ignoreDirs = new Set(['node_modules', '.git', 'dist', 'build', '.vite', '.cache'])

const categories = {
  images: ['jpg','jpeg','png','gif','webp','bmp','svg','tiff','ico'],
  docs: ['pdf','doc','docx','xls','xlsx','ppt','pptx','txt','md','rtf'],
  scripts: ['ps1','bat','cmd','sh'],
  code: ['js','jsx','ts','tsx','py','java','go','rb','php','c','cpp','cs'],
  styles: ['css','scss','sass','less'],
  audio: ['mp3','wav','aac','flac','ogg','m4a'],
  video: ['mp4','mov','avi','mkv','webm','mpeg','3gp'],
  archives: ['zip','rar','7z','tar','gz','bz2'],
  fonts: ['ttf','otf','woff','woff2'],
  data: ['json','csv','xml','yaml','yml']
}

function classify(ext) {
  const e = ext.toLowerCase()
  for (const k of Object.keys(categories)) {
    if (categories[k].includes(e)) return k
  }
  return 'others'
}

async function ensureDir(p) { try { await fs.mkdir(p, { recursive: true }) } catch {} }

const logLines = []
const counters = { copied: 0, moved: 0, skipped: 0 }

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (ignoreDirs.has(entry.name)) continue
      await walk(full)
    } else {
      const ext = path.extname(entry.name).slice(1)
      const cat = classify(ext || '')
      const destDir = path.join(outRoot, cat)
      const srcRel = path.relative(srcDir, full)
      await ensureDir(destDir)
      let destPath = path.join(destDir, entry.name)
      let suffix = 1
      try {
        while (!dryRun) {
          try { await fs.access(destPath); destPath = path.join(destDir, `${path.parse(entry.name).name}_${suffix}${path.extname(entry.name)}`); suffix++ } catch { break }
        }
      } catch {}
      const action = moveMode ? messages.moved : messages.copied
      if (!dryRun) {
        if (moveMode) await fs.rename(full, destPath)
        else await fs.copyFile(full, destPath)
      }
      logLines.push(`${action}: ${srcRel} -> ${path.relative(srcDir, destPath)} [${messages.category}: ${cat}]`)
      counters[moveMode ? 'moved' : 'copied']++
    }
  }
}

async function main() {
  console.log(messages.start)
  console.log(messages.creating)
  await ensureDir(outRoot)
  for (const k of Object.keys(categories)) await ensureDir(path.join(outRoot, k))
  await ensureDir(path.join(outRoot, 'others'))
  await walk(srcDir)
  const logPath = path.join(outRoot, 'organize-log.txt')
  const summary = `${messages.summary}: copied=${counters.copied} moved=${counters.moved} skipped=${counters.skipped}`
  logLines.unshift(`${messages.report} - ${new Date().toISOString()}`)
  logLines.push(summary)
  if (!dryRun) await fs.writeFile(logPath, logLines.join('\n'), 'utf8')
  console.log(summary)
  if (!dryRun) console.log(`${messages.logPath}: ${logPath}`)
  console.log(messages.done)
}

main().catch(e => { console.error(e); process.exit(1) })
