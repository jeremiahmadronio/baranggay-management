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
let matches = 0;
let filesToUpdate = [];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf-8');
  // We look for a button that doesn't have autoFocus yet, and has a typical primary color
  const buttonRegex = /<button[^>]*class(?:Name)?=["'][^"']*(?:bg-blue-|bg-green-|bg-red-|bg-amber-)[^"']*["'][^>]*>(?:\s|.)*?<\/button>/gi;
  
  if (content.match(buttonRegex)) {
    // Check if it already has autoFocus
    const buttons = content.match(buttonRegex);
    const needsAutofocus = buttons.some(b => !b.includes('autoFocus'));
    if (needsAutofocus) {
      matches++;
      filesToUpdate.push(f);
    }
  }
});

console.log(`Found ${matches} modal files that have primary buttons without autoFocus.`);
console.log(filesToUpdate.slice(0, 5));
