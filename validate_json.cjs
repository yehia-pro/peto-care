const fs = require('fs');
const path = 'g:/Yehia - Copy/yehia project/web 3/public/locales/ar/translation.json';

try {
    const content = fs.readFileSync(path, 'utf8');
    try {
        JSON.parse(content);
        console.log('JSON is valid.');
    } catch (e) {
        console.error('JSON is INVALID:', e.message);
        // Try to find the line number
        const matches = e.message.match(/at position (\d+)/);
        if (matches) {
            const pos = parseInt(matches[1]);
            const lines = content.substring(0, pos).split('\n');
            console.error(`Error around line ${lines.length}`);
            console.error('Context:', lines[lines.length - 1]);
        }
    }
} catch (err) {
    console.error('Could not read file:', err.message);
}
