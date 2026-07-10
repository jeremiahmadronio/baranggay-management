const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('Modal.tsx') || file.includes('modal.tsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('src');
let updated = 0;

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf-8');
  const buttonRegex = /(<button[^>]*class(?:Name)?=["'][^"']*(?:bg-blue-|bg-green-|bg-red-|bg-amber-)[^"']*["'][^>]*>)/gi;
  
  let modified = false;
  let newContent = content.replace(buttonRegex, (match) => {
    if (match.includes('autoFocus')) return match;
    modified = true;
    return match.replace(/<button/i, '<button autoFocus');
  });

  if (modified) {
    fs.writeFileSync(f, newContent, 'utf-8');
    updated++;
  }
});

console.log(`Successfully added autoFocus to ${updated} files.`);
