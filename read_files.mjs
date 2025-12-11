import fs from 'fs';

console.log('=== Routes.tsx ===');
console.log(fs.readFileSync('./components/Routes.tsx', 'utf8'));
console.log('\n\n=== LinkChild.tsx ===');
console.log(fs.readFileSync('./components/parent/LinkChild.tsx', 'utf8'));
