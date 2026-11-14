import {build} from 'esbuild';
import {readFile, writeFile, mkdir, copyFile, rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import path from 'node:path';
const site = fileURLToPath(new URL('../',import.meta.url));
let html = await readFile(path.join(site,'../source/index.html'),'utf8');
html = html.replace('PAUSE v2.0 —','PAUSE v2.2 —');
if (html.includes('cloud-sync.js')) throw new Error('Duplicate cloud script');
html = html.replace('</body>','<script type="module" src="/cloud-sync.js"></script>\n</body>');
await writeFile(path.join(site,'public/index.html'),html);
const dist = path.join(site,'dist');
await rm(dist,{recursive:true,force:true}); await mkdir(dist,{recursive:true});
for (const name of ['index.html','cloud-sync.js','sync-data.js','_headers']) await copyFile(path.join(site,'public',name),path.join(dist,name));
// Normal CI uses Pages CDN for static assets; Functions handle only /api/*.
await writeFile(path.join(dist,'_routes.json'),JSON.stringify({version:1,include:['/api/*'],exclude:[]},null,2)+'\n');
await build({
  absWorkingDir:site,entryPoints:['server/worker.js'],outfile:'dist/_worker.js',
  bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true,
  loader:{'.html':'text'},
  plugins:[{name:'raw-browser-scripts',setup(context) {
    context.onResolve({filter:/\?text$/},args => ({path:path.resolve(args.resolveDir,args.path.slice(0,-5)),namespace:'text'}));
    context.onLoad({filter:/.*/,namespace:'text'},async args => ({contents:await readFile(args.path,'utf8'),loader:'text'}));
  }}]
});
const worker = await readFile(path.join(dist,'_worker.js'));
const manifest = {gameBundleSha256:createHash('sha256').update(html).digest('hex'),workerSha256:createHash('sha256').update(worker).digest('hex'),workerBytes:worker.length};
await mkdir(path.join(site,'.build'),{recursive:true});
await writeFile(path.join(site,'.build/build-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log('Built 12 original games and Pages Functions',manifest);
