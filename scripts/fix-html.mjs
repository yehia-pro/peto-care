import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, '..', 'dist');
const htmlPath = path.join(distDir, 'index.html');

let html = fs.readFileSync(htmlPath, 'utf8');

const before = html;

html = html
  // Fix ./assets/ paths (Vite generates these even with base:'/')
  .replace(/src="\.\/assets\//g, 'src="/assets/')
  .replace(/href="\.\/assets\//g, 'href="/assets/')
  // Fix assets/ without leading slash
  .replace(/src="assets\//g, 'src="/assets/')
  .replace(/href="assets\//g, 'href="/assets/')
  // Fix manifest.json
  .replace(/href="manifest\.json"/g, 'href="/manifest.json"')
  .replace(/href="\.\/manifest\.json"/g, 'href="/manifest.json"')
  // Fix PWA icons
  .replace(/href="\.\/icon-/g, 'href="/icon-')
  .replace(/href="(?!\/)icon-/g, 'href="/icon-')
  .replace(/src="\.\/icon-/g, 'src="/icon-')
  .replace(/src="(?!\/)icon-/g, 'src="/icon-')
  // Fix favicon / vite.svg
  .replace(/href="vite\.svg"/g, 'href="/vite.svg"')
  .replace(/href="\.\/vite\.svg"/g, 'href="/vite.svg"');

// Write fixed index.html
fs.writeFileSync(htmlPath, html, 'utf8');

// Copy index.html → 404.html (Cloudflare Pages SPA fallback)
const fallbackPath = path.join(distDir, '404.html');
fs.copyFileSync(htmlPath, fallbackPath);

// Report what changed
const changed = html !== before;
console.log('✅ dist/index.html patched:', changed ? 'paths fixed' : 'already clean');
console.log('✅ dist/404.html created for Cloudflare SPA routing');

// Show the script/link lines to verify
const lines = html.split('\n').filter(l => l.includes('assets/'));
lines.forEach(l => console.log('  ', l.trim()));
