from pathlib import Path
root=Path(__file__).parent/'src'
p=root/'sky-premium.js';s=p.read_text()
s=s.replace('function skyTick(s,dt){', '''// Visual-grounded 3D XZ hitboxes. Sizes match sphere and obstacle widths in both renderers.
// The tiny forgiveness margin reduces edge-of-object false positives.
const SKY_PLAYER_RADIUS=.64;
function skyHazardHit(s,h){const centre=SKY_LANES[h.lane]+(h.type==='mover'?Math.sin(s.age*2.25+h.phase)*.55:0);
 const halfWidth=h.type==='gap'?1.01:.625;
 return Math.abs(s.x-centre)<halfWidth+SKY_PLAYER_RADIUS-.12;
}
function skyTick(s,dt){''')
old="const hx=SKY_LANES[h.lane]+(h.type==='mover'?Math.sin(s.age*2.25+h.phase)*.55:0);if(Math.abs(s.x-hx)<(h.type==='gap'?.91:1.04))"
assert old in s
s=s.replace(old,"if(skyHazardHit(s,h))")
p.write_text(s)
p=root/'runner-premium.js';s=p.read_text()
s=s.replace('function runStep(s,dt){', '''// Consistent hitboxes with rendered obstacles; avoid nearest-lane snap during transitions.
const RUN_PLAYER_RADIUS=.34;
function runHazardHit(s,h){
 const halfWidth=({pillar:.725,hurdle:.825,gate:1.025,gap:1.025})[h.type]??.72;
 const inX=Math.abs(s.x-RUN_LANES[h.lane])<halfWidth+RUN_PLAYER_RADIUS-.08;
 if(!inX)return false;
 const jump=runJumpHeight(s),slide=s.slideTime>0;
 if(h.type==='hurdle'||h.type==='gap')return jump<=.50;
 if(h.type==='gate')return !slide;
 return true;
}
function runStep(s,dt){''')
old="const collisionLane=RUN_LANES.reduce((best,v,i)=>Math.abs(v-s.x)<Math.abs(RUN_LANES[best]-s.x)?i:best,0);\n const jump=runJumpHeight(s),slide=s.slideTime>0;\n for(const h of row.hazards){if(h.lane!==collisionLane)continue;\n const avoid=(h.type==='hurdle'||h.type==='gap')?jump>.50:h.type==='gate'?slide:false;\n if(!avoid){"
assert old in s
s=s.replace(old,"for(const h of row.hazards){\n if(runHazardHit(s,h)){")
s=s.replace('if(!c.got&&c.lane===collisionLane)',"if(!c.got&&Math.abs(s.x-RUN_LANES[c.lane])<.85)")
p.write_text(s)
