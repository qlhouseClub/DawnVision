// Node.js script to generate TS data from JSON
const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '../web/src/content/issues');
const outputFile = path.join(__dirname, 'src/utils/issues-data.ts');

const files = fs.readdirSync(sourceDir).filter(f => f.endsWith('.json')).sort();

let tsContent = `// Auto-generated from web project JSON data
// Run: node generate-data.js to regenerate

`;

const issueNames = [];

for (const file of files) {
  const issueNum = path.basename(file, '.json');
  const varName = `issue${issueNum}`;
  issueNames.push(varName);
  const jsonRaw = fs.readFileSync(path.join(sourceDir, file), 'utf-8');
  // Parse and re-stringify as compact JSON to avoid formatting issues
  const jsonObj = JSON.parse(jsonRaw);
  const jsonCompact = JSON.stringify(jsonObj);
  tsContent += `export const ${varName} = ${jsonCompact} as const;\n\n`;
}

tsContent += `export const allIssues = [\n  ${issueNames.join(',\n  ')}\n];\n`;

fs.writeFileSync(outputFile, tsContent, 'utf-8');
console.log(`Generated ${outputFile}`);
console.log(`Included ${issueNames.length} issues: ${issueNames.join(', ')}`);
