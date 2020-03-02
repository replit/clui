// eslint-disable-next-line
const path = require('path');
// eslint-disable-next-line
const fs = require('fs');

const root = path.resolve(__dirname, '..');

// eslint-disable-next-line
const package = require(path.resolve(root, 'package.json'));

['private', 'scripts', 'husky', 'lint-staged', 'devDependencies'].forEach(
  (key) => delete package[key],
);

package.main = 'index.js';
package.types = 'index.d.ts';

fs.copyFile(
  path.resolve(root, 'README.md'),
  path.resolve(root, 'dist', 'README.md'),
  (err) => {
    if (err) throw err;
  },
);

fs.writeFile(
  path.resolve(root, 'dist', 'package.json'),
  JSON.stringify(package, null, 2),
  (err) => {
    if (err) throw err;
  },
);
