const fs = require('fs');
const glob = require('glob'); // Note: glob might not be installed, using manual or simple iteration
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

  // Replace fetch('/api/...') with fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://yehia-ayman-peto-care-server.hf.space/api' : '/api')}/...`)
  // We need to capture what's after /api/
  
  // fetch('/api/something') -> fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://yehia-ayman-peto-care-server.hf.space/api' : '')}/api/something`)
  
  // Let's create a global base
  const BASE = "${import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://yehia-ayman-peto-care-server.hf.space/api' : '/api')}";
  
  // replace fetch('/api/
  content = content.replace(/fetch\(['"]\/api\//g, "fetch(`" + BASE + "/");
  // after replacing `fetch(BASE/something)`, we must close it with ` instead of '
  // Wait, if we replace `fetch('/api/petstores')`, we replaced the opening quote. What about the closing quote?
  // Let's use a smarter regex.
  
  content = content.replace(/fetch\(['"]\/api\/([^'"]+)['"]/g, "fetch(`" + BASE + "/$1`");
  
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed:', file);
    changedCount++;
  }
});

console.log('Total files fixed:', changedCount);
