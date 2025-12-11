import fs from 'fs';
import path from 'path';

const testDir = './tests';
const files = fs.readdirSync(testDir).filter(f => f.endsWith('.spec.ts'));
console.log('Available test files:');
files.forEach(f => console.log(`  - ${f}`));

console.log('\nPlaywright config:');
console.log(fs.readFileSync('./playwright.config.ts', 'utf8'));
