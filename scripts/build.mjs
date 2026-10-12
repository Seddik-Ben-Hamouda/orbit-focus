// Zero-dependency build:  node scripts/build.mjs
// Produces files that work everywhere, including a plain <script> tag opened from file://
//   dist/orbit-focus.js         ES module
//   dist/orbit-focus.global.js  classic script → window.OrbitFocus
//   dist/orbit-focus.css        stylesheet
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = fs.readFileSync(path.join(root, 'src/orbit-focus.js'), 'utf8');
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });

fs.writeFileSync(path.join(root, 'dist/orbit-focus.js'), src);

const body = src
  .replace(/^export default .*$/m, '')
  .replace(/^export /gm, '');
fs.writeFileSync(
  path.join(root, 'dist/orbit-focus.global.js'),
  `(function (global) {\n'use strict';\n${body}\nglobal.OrbitFocus = OrbitFocus;\n})(window);\n`
);

fs.copyFileSync(path.join(root, 'src/orbit-focus.css'), path.join(root, 'dist/orbit-focus.css'));
console.log('built dist/');
