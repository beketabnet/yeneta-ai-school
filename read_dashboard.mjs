import fs from 'fs';

const file1 = fs.readFileSync('./components/dashboards/ParentDashboard.tsx', 'utf8');
console.log('=== ParentDashboard.tsx ===');
console.log(file1);
