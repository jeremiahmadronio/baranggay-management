const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

let modified = 0;

walkDir('d:/baranggay-management/src', function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let originalContent = content;

    // Pattern 1: onChange={(e) => setReason(e.target.value)}
    // It could be onChange={e => setReason(e.target.value)}
    const p1 = /onChange=\{\s*\(?e\)?\s*=>\s*setReason\(\s*e\.target\.value\s*\)\s*\}/g;
    content = content.replace(p1, 
      'onChange={(e) => setReason(e.target.value.replace(/[^a-zA-Z0-9ñÑ\\\\s.,\\\\-\\'()\\"\\\\n]/g, ""))}'
    );

    // Pattern 2: onChange={(e) => { if (e.target.value.length <= REASON_LIMIT) { setReason(e.target.value); } setReasonError(""); }}
    const p2 = /onChange=\{\s*\(?e\)?\s*=>\s*\{\s*if\s*\(\s*e\.target\.value\.length\s*<=\s*REASON_LIMIT\s*\)\s*\{\s*setReason\(\s*e\.target\.value\s*\);\s*\}\s*setReasonError\(\s*""\s*\);\s*\}\s*\}/g;
    content = content.replace(p2,
      'onChange={(e) => { const cleanedValue = e.target.value.replace(/[^a-zA-Z0-9ñÑ\\\\s.,\\\\-\\'()\\"\\\\n]/g, ""); if (cleanedValue.length <= REASON_LIMIT) { setReason(cleanedValue); } setReasonError(""); }}'
    );
    
    // Check specific files where the formatting might be slightly different
    // delete-user-modal.tsx, lock-user-modal.tsx, restore-user-modal.tsx, admin-view-page.tsx
    // update-staff-status-modal.tsx, reset-password-modal.tsx

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      modified++;
      console.log('Modified: ' + filePath);
    }
  }
});

console.log('Total files modified: ' + modified);
