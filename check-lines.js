const fs = require('fs');

// Read the file
let content = fs.readFileSync('src/App.js', 'utf8');
const lines = content.split('\n');

console.log('Line 1827:', JSON.stringify(lines[1826]));
console.log('Line 1828:', JSON.stringify(lines[1827]));
console.log('Line 1829:', JSON.stringify(lines[1828]));
console.log('Line 1830:', JSON.stringify(lines[1829]));
console.log('Line 1831:', JSON.stringify(lines[1830]));
console.log('---');
console.log('Line 2408:', JSON.stringify(lines[2407]));
console.log('Line 2409:', JSON.stringify(lines[2408]));
console.log('Line 2410:', JSON.stringify(lines[2409]));
console.log('Line 2411:', JSON.stringify(lines[2410]));
console.log('Line 2412:', JSON.stringify(lines[2411]));
