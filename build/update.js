"use strict";

let pkg = require('../package.json');

let updates = [];
for (var i in pkg.dependencies) {
  var dep = pkg.dependencies[i];
  if (dep.startsWith("git+")) updates.push(dep);
  else updates.push(i);
}

const cp = require('child_process');
console.log(`updating ${updates.join(' ')}`);
cp.spawnSync('cmd.exe', ['/C', 'npm', 'install', '--save'].concat(updates));
