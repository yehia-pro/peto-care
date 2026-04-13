const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx') || file.endsWith('.ts')) results.push(file);
    }
  });
  return results;
}

const files = walk(srcDir);
let changedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Replace fetch('/api/ (but ONLY if it is literally fetch('/api/ or fetch(`/api/)
  // We use regex that captures the string contents up to the close quote.
  // Wait, if we just replace the exact literal `fetch('/api/` with `fetch(API_BASE_URL + '/`
  if (content.includes("fetch('/api/") || content.includes('fetch(`/api/')) {
    
    // Safety check: Don't add import if already there
    if (!content.includes('API_BASE_URL')) {
      // Find the last import
      const lines = content.split('\n');
      let lastImportIdx = -1;
      for (let i = 0; i < Math.min(lines.length, 150); i++) {
        if (lines[i].trim().startsWith('import ')) {
          lastImportIdx = i;
        }
      }
      if (lastImportIdx !== -1) {
        lines.splice(lastImportIdx + 1, 0, "import { API_BASE_URL } from '@/services/api';");
        content = lines.join('\n');
      }
    }
    
    // Now just literally replace exactly fetch('/api/ with fetch(API_BASE_URL + '/
    content = content.replace(/fetch\(['"]\/api\//g, "fetch(API_BASE_URL + '/");
    // And for backtick: fetch(`/api/ with fetch(`${API_BASE_URL}/
    content = content.replace(/fetch\(\`\/api\//g, "fetch(`${API_BASE_URL}/");

    if (content !== original) {
      fs.writeFileSync(file, content, 'utf8');
      console.log('Fixed:', file);
      changedCount++;
    }
  }
});

console.log('Total files fixed:', changedCount);
