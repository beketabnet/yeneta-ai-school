import fs from 'fs';

console.log('=== parent-dashboard-fixes.spec.ts ===');
console.log(fs.readFileSync('./tests/parent-dashboard-fixes.spec.ts', 'utf8'));
console.log('\n\n=== link-another-child.spec.ts ===');
console.log(fs.readFileSync('./tests/link-another-child.spec.ts', 'utf8'));
