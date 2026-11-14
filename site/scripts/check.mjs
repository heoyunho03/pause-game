import {readdir, readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import vm from 'node:vm';
import path from 'node:path';
const root = fileURLToPath(new URL('../../',import.meta.url));
async function files(folder) {
  const result = [];
  for (const entry of await readdir(folder,{withFileTypes:true})) {
    if (['node_modules','.git','dist','.build','.wrangler','__pycache__','test-results'].includes(entry.name)) continue;
    const full = path.join(folder,entry.name);
    if (entry.isDirectory()) result.push(...await files(full)); else result.push(full);
  }
  return result;
}
const all = await files(root);
let checked = 0;
const findings = [];
const patterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bpostgres(?:ql)?:\/\/[^:\s"'<>]+:(?!YOUR_PASSWORD\b|PASSWORD\b)[^@\s"'<>]+@/,
  /\bAIza[0-9A-Za-z_-]{30,}/,
  /\b(?:ghp_|github_pat_|sk-proj-)[A-Za-z0-9_]{20,}/,
  /\bGOCSPX-[A-Za-z0-9_-]{15,}/
];
for (const file of all) {
  if (!/\.(?:js|mjs|html|json|py|md|sql|yml|example)$/.test(file) && !file.endsWith('.gitignore')) continue;
  const content = await readFile(file,'utf8');
  if (patterns.some(pattern => pattern.test(content))) findings.push(path.relative(root,file));
  if (/\.(?:js|mjs)$/.test(file)) {
    const result = spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
    if (result.status !== 0) throw new Error(result.stderr);
    checked++;
  }
  if (file.endsWith('.html')) {
    for (const [,attributes,code] of content.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
      if (/\bsrc=|type=["'](?:importmap|application\/)/.test(attributes) || !code.trim()) continue;
      new vm.Script(code,{filename:file}); checked++;
    }
  }
}
if (findings.length) throw new Error('Potential credentials found in: '+findings.join(', '));
const html = await readFile(path.join(root,'site/public/index.html'),'utf8');
for (const id of ['2048','mines','block','sudoku','arrow','bubble','knife','onecard','poker','hexa','rolling','runner']) {
  if (!html.includes("id:'"+id+"'")) throw new Error('Missing game '+id);
}
console.log('PASS JavaScript syntax ('+checked+' units), 12-game manifest, credential pattern scan ('+all.length+' files). Pattern scans cannot identify every secret format.');
