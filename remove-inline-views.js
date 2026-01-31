const fs = require('fs');

// Read the file
let content = fs.readFileSync('src/App.js', 'utf8');
const lines = content.split('\n');

// Find the line indices
// Line 1829 (0-indexed 1828) is first line of MANAGER VIEWS section
// Line 2410 (0-indexed 2409) is blank line before CALENDAR VIEW
// We want to keep line 2411 onwards (// === CALENDAR VIEW)

const startLineIdx = 1828; // Line 1829 (0-indexed) - first === of MANAGER VIEWS
const endLineIdx = 2410;   // Line 2411 (0-indexed) - blank before CALENDAR VIEW === comment

console.log('Removing lines', startLineIdx + 1, 'to', endLineIdx + 1);
console.log('First line to remove:', lines[startLineIdx].trim());
console.log('Last line to keep before section:', lines[startLineIdx - 1].trim());
console.log('First line to keep after section:', lines[endLineIdx + 1]?.trim());

// Remove lines startLineIdx to endLineIdx (inclusive)
const beforeLines = lines.slice(0, startLineIdx);
const afterLines = lines.slice(endLineIdx + 1);

const newContent = [...beforeLines, ...afterLines].join('\n');

fs.writeFileSync('src/App.js', newContent, 'utf8');
console.log('Done. New line count:', newContent.split('\n').length);
