const fs = require('fs');
const path = require('path');

const files = [
  'd:/baranggay-management/src/pages/admin-module/blotter-docket/modal/EditCaseModal.tsx',
  'd:/baranggay-management/src/pages/blotter-module/modal/EditCaseModal.tsx',
  'd:/baranggay-management/src/pages/kapitana/blotter-module/modal/EditCaseModal.tsx'
];

for (const file of files) {
  if (!fs.existsSync(file)) {
    console.log(`Skipping ${file} - does not exist.`);
    continue;
  }
  let content = fs.readFileSync(file, 'utf8');

  // 1. Assigned officer disabled
  content = content.replace(
    /className="input"\s+value=\{form\.assignToId\}/,
    'className="input" value={form.assignToId} disabled'
  );

  // 2. Remove Complainant Search Input and Edit Manually block
  content = content.replace(
    /<PersonSearchInput\s+label="Search and Re-link Complainant"[\s\S]*?onSelect=\{linkComplainant\}\s+\/>/,
    ''
  );
  content = content.replace(
    /\{form\.complainantId && \([\s\S]*?unlinkComplainant\}[\s\S]*?Edit manually[\s\S]*?<\/button>\s+<\/div>\s+\)\}/,
    ''
  );

  // Complainant fields to readOnly
  content = content.replace(/readOnly=\{lockComplainantFields\}/g, 'readOnly={true}');
  // For age and email which didn't have readOnly
  content = content.replace(
    /(className="input"\s+placeholder="Age"\s+value=\{form\.complainantAge\}\s+maxLength=\{MAX_AGE_LENGTH\})/g,
    '$1 readOnly={true}'
  );
  content = content.replace(
    /(className="input"\s+placeholder="name@email\.com"\s+value=\{form\.complainantEmail\}\s+maxLength=\{MAX_EMAIL_LENGTH\})/g,
    '$1 readOnly={true}'
  );

  // 2b. Remove Respondent Search Input and Edit Manually block
  content = content.replace(
    /<PersonSearchInput\s+label="Search and Re-link Respondent"[\s\S]*?onSelect=\{linkRespondent\}\s+\/>/,
    ''
  );
  content = content.replace(
    /\{form\.respondentId && \([\s\S]*?unlinkRespondent\}[\s\S]*?Edit manually[\s\S]*?<\/button>\s+<\/div>\s+\)\}/,
    ''
  );

  // Respondent fields to readOnly
  content = content.replace(/readOnly=\{lockRespondentFields\}/g, 'readOnly={true}');
  content = content.replace(
    /(className="input"\s+placeholder="Alias"\s+value=\{form\.respondentAlias\}\s+maxLength=\{MAX_ALIAS_LENGTH\})/g,
    '$1 readOnly={true}'
  );
  content = content.replace(
    /(className="input"\s+placeholder="Relationship"\s+value=\{form\.relationshipTypeName\}\s+maxLength=\{MAX_RELATIONSHIP_LENGTH\})/g,
    '$1 readOnly={true}'
  );

  // 3. Narrative Statement to readOnly
  content = content.replace(
    /(className="input w-full min-h-\[96px\]"\s+placeholder="Provide complete incident narrative\.\.\."\s+value=\{form\.narrativeStatement\}\s+maxLength=\{MAX_NARRATIVE_LENGTH\})/g,
    '$1 readOnly={true}'
  );

  // 4. Evidence Types to disabled
  content = content.replace(
    /(<input\s+type="checkbox"\s+checked=\{checked\})/g,
    '$1 disabled'
  );

  // 5. Witness: remove relink and make narrative readOnly
  content = content.replace(
    /<PersonSearchInput\s+label="Search and re-link witness"[\s\S]*?onSelect=\{\(person\) => \{[\s\S]*?\}\}\s+\/>/g,
    ''
  );
  content = content.replace(
    /(className=\{`input w-full min-h-\[84px\].*?`\}\s+placeholder="Testimony \(optional\)"\s+value=\{w\.testimony \?\? ""\}\s+maxLength=\{MAX_WITNESS_TESTIMONY_LENGTH\})/g,
    '$1 readOnly={true}'
  );

  fs.writeFileSync(file, content, 'utf8');
  console.log(`Updated ${file}`);
}
