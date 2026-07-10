const fs = require('fs');
const file = 'd:/baranggay-management/src/pages/bcpc-module/new-case-entry.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace readOnly with disabled
content = content.replace(/readOnly=\{!!cPersonId\}/g, 'disabled={!!cPersonId}');
content = content.replace(/readOnly=\{!!rPersonId\}/g, 'disabled={!!rPersonId}');

// Fix the Respondent validation to show error
content = content.replace(
  '              onSelect={(p) => {\n                setRPersonId(p.id);',
  '              onSelect={(p) => {\n                if (cPersonId && p.id === cPersonId) {\n                  setSubmitError("Cannot select the same resident as the complainant.");\n                  setShowErrorModal(true);\n                  return;\n                }\n                setRPersonId(p.id);'
);

// Add inline warning component
const warningJSX = '{cFirstName && rFirstName && cFirstName.toLowerCase().trim() === rFirstName.toLowerCase().trim() && cLastName.toLowerCase().trim() === rLastName.toLowerCase().trim() && (<div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900 font-medium flex items-center gap-2"><ShieldOff className="w-4 h-4" /> Warning: Respondent cannot have the exact same name as the Complainant.</div>)}';
content = content.replace(
  '<SectionCard letter="C" title="Respondent / Guardian Information">\n          <PersonSearchInput',
  '<SectionCard letter="C" title="Respondent / Guardian Information">\n          ' + warningJSX + '\n          <PersonSearchInput'
);

fs.writeFileSync(file, content, 'utf8');
