const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');

const root = path.resolve(__dirname, '..');
const packageJson = require('../package.json');
const errors = [];
const sounds = new Set();

function visit(node, callback) {
  if (!node || typeof node !== 'object') return;
  callback(node);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach(child => visit(child, callback));
    else if (value && typeof value === 'object') visit(value, callback);
  }
}

function scan(directory) {
  for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) { scan(file); continue; }
    if (!/\.[jt]sx?$/.test(file)) continue;
    const source = fs.readFileSync(file, 'utf8');
    let ast;
    try {
      ast = parser.parse(source, {sourceType: 'module', plugins: ['jsx', 'typescript']});
    } catch (error) {
      errors.push(`${path.relative(root, file)}: ${error.message}`);
      continue;
    }
    visit(ast, node => {
      let target;
      if (node.type === 'ImportDeclaration') target = node.source.value;
      if (node.type === 'CallExpression' && node.callee.name === 'require' && node.arguments[0]?.type === 'StringLiteral') target = node.arguments[0].value;
      if (target?.startsWith('.')) {
        const resolved = path.resolve(path.dirname(file), target);
        if (!['', '.js', '.jsx', '.ts', '.tsx', '/index.js', '/index.ts'].some(suffix => fs.existsSync(resolved + suffix))) {
          errors.push(`${path.relative(root, file)}: missing ${target}`);
        }
      } else if (target) {
        const name = target.startsWith('@') ? target.split('/').slice(0, 2).join('/') : target.split('/')[0];
        if (!packageJson.dependencies[name] && !packageJson.devDependencies[name]) errors.push(`Missing dependency: ${name}`);
      }
      if (node.type === 'ObjectProperty' && node.key.name === 'sound' && node.value.type === 'StringLiteral') sounds.add(`${node.value.value}.mp3`);
      if (node.type === 'CallExpression' && node.callee.type === 'MemberExpression' && node.callee.object.name === 'SoundPlayer' && node.callee.property.name === 'playSoundFile' && node.arguments[0]?.type === 'StringLiteral') {
        sounds.add(`${node.arguments[0].value}.${node.arguments[1]?.value || 'mp3'}`);
      }
    });
  }
}

scan(path.join(root, 'src'));
for (const sound of [...sounds].sort()) {
  if (!fs.existsSync(path.join(root, 'android/app/src/main/res/raw', sound))) errors.push(`Missing Android sound: ${sound}`);
}
for (const font of fs.readdirSync(path.join(root, 'assets/fonts')).filter(name => /\.(ttf|otf)$/.test(name))) {
  if (!fs.existsSync(path.join(root, 'android/app/src/main/assets/fonts', font))) errors.push(`Missing Android font: ${font}`);
}
if (errors.length) {
  console.error(errors.join('\n'));
  console.error('\nCopy the original res/raw folder into android/app/src/main/res/raw, then rerun npm run check:migration.');
  process.exitCode = 1;
} else {
  console.log(`Migration assets and imports OK (${sounds.size} Android sounds checked).`);
}
