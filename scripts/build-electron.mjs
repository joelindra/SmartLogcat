import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

console.log('Building Electron backend...');

// For this project, we are using .cjs files directly.
// In a more complex setup, we might use tsc or esbuild here.
// For now, we just ensure the output directory exists if needed.

if (!fs.existsSync(path.join(root, 'dist'))) {
  fs.mkdirSync(path.join(root, 'dist'));
}

console.log('Done.');
