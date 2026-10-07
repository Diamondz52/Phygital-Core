import fs from 'node:fs';
import path from 'node:path';
import postcss from 'postcss';
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(path.join(dir,entry.name)):[path.join(dir,entry.name)]);
const sourceFiles=walk('src').filter(p=>/\.(tsx?|jsx?)$/.test(p)&&!p.includes('primitives'));
const source=sourceFiles.map(p=>fs.readFileSync(p,'utf8')).join('\n');
const tokens=new Set(source.match(/[a-zA-Z][a-zA-Z0-9_-]*/g)||[]);
const used=cls=>tokens.has(cls)||[...tokens].some(t=>t.endsWith('-')&&cls.startsWith(t));
let patch='*** Begin Patch\n';const removed=[],animations=[];
const cssFiles=walk('src/app').filter(p=>p.endsWith('.css'));
const animationTokens=new Set();
for(const file of cssFiles){postcss.parse(fs.readFileSync(file,'utf8')).walkDecls(declaration=>{if(/^(?:-webkit-)?animation(?:-name)?$/.test(declaration.prop))for(const token of declaration.value.match(/[a-zA-Z][a-zA-Z0-9_-]*/g)||[])animationTokens.add(token);});}
for(const file of cssFiles){
 const old=fs.readFileSync(file,'utf8').trimEnd(),root=postcss.parse(old);
 root.walkRules(rule=>{if(rule.parent?.type==='atrule'&&rule.parent.name.includes('keyframes'))return;
 const keep=rule.selectors.filter(selector=>{const classes=[...selector.matchAll(/\.([a-zA-Z_-][a-zA-Z0-9_-]*)/g)].map(m=>m[1]);const missing=classes.some(cls=>!used(cls));if(missing)removed.push(selector);return !missing;});
 if(!keep.length)rule.remove();else rule.selectors=keep;
 });
 root.walkAtRules(rule=>{if(rule.name.endsWith('keyframes')&&!animationTokens.has(rule.params)){animations.push(rule.params);rule.remove();}else if(rule.nodes&&!rule.nodes.length)rule.remove();});
 const next=root.toString().trimEnd();if(next!==old)patch+='*** Update File: '+file.replaceAll('\\','/')+'\n@@\n-'+old.split('\n').join('\n-')+'\n+'+next.split('\n').join('\n+')+'\n';
}
patch+='*** End Patch';
if(process.argv.includes('--patch'))process.stdout.write(patch);else console.log(JSON.stringify({removedSelectors:removed.length,selectors:removed,unusedAnimations:animations},null,2));
