import fs from 'fs';

const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
console.log('Available scripts:');
Object.keys(pkg.scripts || {}).forEach(key => {
  console.log(`  ${key}: ${pkg.scripts[key]}`);
});
