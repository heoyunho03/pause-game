/* Software fallback renders runner 3D coordinates with a perspective camera. */
function runMakeCanvas(canvas){const c=canvas.getContext('2d');if(!c)return null;
function render(s){const r=canvas.getBoundingClientRect(),scale=Math.min(devicePixelRatio||1,1.6),w=Math.max(1,Math.floor(r.width*scale)),h=Math.max(1,Math.floor(r.height*scale));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}
const eye=[s.x*.09,7.7,16],at=[s.x*.12,.8,-29],sub=(a,b)=>a.map((v,i)=>v-b[i]),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],dot=(a,b)=>a.reduce((v,x,i)=>v+x*b[i],0),norm=v=>v.map(x=>x/Math.hypot(...v));const forward=norm(sub(at,eye)),right=norm(cross(forward,[0,1,0])),up=cross(right,forward),focal=h*.86;
const project=p=>{const v=sub(p,eye),depth=dot(v,forward);return{x:w/2+dot(v,right)*focal/depth,y:h/2-dot(v,up)*focal/depth,depth,scale:focal/depth}};
const sky=c.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#31283c');sky.addColorStop(.50,'#a26657');sky.addColorStop(1,'#2d3042');c.fillStyle=sky;c.fillRect(0,0,w,h);const sun=c.createRadialGradient(w*.72,h*.27,0,w*.72,h*.27,w*.43);sun.addColorStop(0,'#ffd1a380');sun.addColorStop(1,'#ffb17b00');c.fillStyle=sun;c.fillRect(0,0,w,h);
const draws=[];const poly=(pts,color,stroke)=>{const a=pts.map(project);if(a.some(p=>p.depth<.1))return;const depth=a.reduce((v,p)=>v+p.depth,0)/a.length;draws.push({depth,paint(){c.beginPath();a.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.fillStyle=color;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke()}}})};
const box=(x,y,z,sx,sy,sz,color)=>{const X=sx/2,Y=sy/2,Z=sz/2,P=(a,b,d)=>[x+a,y+b,z+d];poly([P(-X,Y,-Z),P(X,Y,-Z),P(X,Y,Z),P(-X,Y,Z)],color,'#ffffff13');poly([P(-X,-Y,Z),P(X,-Y,Z),P(X,Y,Z),P(-X,Y,Z)],color,'#07132180');poly([P(X,-Y,-Z),P(X,-Y,Z),P(X,Y,Z),P(X,Y,-Z)],'#13253c')};
const orb=(x,y,z,r,color)=>{const p=project([x,y,z]);if(p.depth<=.2)return;draws.push({depth:p.depth,paint(){let rad=Math.min(48,Math.max(2,p.scale*r));let g=c.createRadialGradient(p.x-rad*.33,p.y-rad*.35,1,p.x,p.y,rad);g.addColorStop(0,'#fff9ef');g.addColorStop(.35,color);g.addColorStop(1,'#8e5f4d');c.fillStyle=g;c.beginPath();c.arc(p.x,p.y,rad,0,Math.PI*2);c.fill()}})};
const offset=s.distance%RUN_STEP;for(let i=-1;i<10;i++){let z=5+offset-i*RUN_STEP;if(z>28||z<-143)continue;const idx=Math.floor(s.distance/RUN_STEP)+i;for(let j=0;j<3;j++){box(RUN_LANES[j],-.45,z,2.08,.3,RUN_STEP-.1,(idx+j)%2?'#414454':'#4b4b5b');box(RUN_LANES[j],-.28,z,1.91,.012,RUN_STEP-.15,'#66616b')}
box(-3.45,-.17,z,.16,.44,RUN_STEP-.1,'#e2a47e');box(3.45,-.17,z,.16,.44,RUN_STEP-.1,'#a78e85');if(idx%4===0)box(0,-.20,z+RUN_STEP*.47,6.8,.015,.10,'#a48271')}
for(let i=0;i<12;i++){const z=11-(i*15-s.distance%15);box(-9-i%3*2,2.3+i%3,z,3.2,6+i%3*2.2,5,'#574454');box(9+i%3*2,2.1+i%4,z,3.4,6+i%4*1.8,5,'#624858');if(i%2===0){box(-7.5-i%3*2,3+i%3,z+2,.08,.45,.8,'#f2ae77');box(7.6+i%3*2,2.7+i%4,z+2,.08,.45,.8,'#e7b28d')}}
for(const row of s.rows){const z=5-(row.index*RUN_STEP-s.distance);if(z>13||z<-140)continue;
for(const hz of row.hazards){const x=RUN_LANES[hz.lane];if(hz.type==='pillar'){box(x,.90,z,1.4,2.1,1.2,'#c28363');box(x,2.0,z,1.53,.18,1.3,'#dfa77d')}else if(hz.type==='hurdle'){box(x,.32,z,1.65,.74,1,'#e9aa75');box(x,.74,z,1.67,.14,1.04,'#f0c39c')}else if(hz.type==='gate'){box(x-.85,1.25,z,.23,2.65,.7,'#a993a3');box(x+.85,1.25,z,.23,2.65,.7,'#a993a3');box(x,2.28,z,2.05,.42,.8,'#e2ae84')}else{box(x,-.46,z,2.04,.02,3,'#08172a');box(x,-.33,z+1.55,1.9,.07,.1,'#e4b58e')}}
for(const gem of row.gems)if(!gem.got)orb(RUN_LANES[gem.lane],1.05+Math.sin(s.age*4+row.index)*.16,z,.25,'#eab380');}
draws.sort((a,b)=>b.depth-a.depth).forEach(a=>a.paint());
// Avatar drawn near-camera last, including a visible sliding and jumping silhouette.
const py=runJumpHeight(s),slide=s.slideTime>0;const sway=Math.sin(s.age*14)*.13;
const pl=project([s.x,0,5]);let sz=pl.scale;
c.fillStyle='#09132291';c.beginPath();c.ellipse(pl.x,pl.y,sz*.65,sz*.2,0,0,Math.PI*2);c.fill();
const stick=(x,y,z,X,Y,Z,color,width)=>{const a=project([x,y,z]),b=project([X,Y,Z]);if(a.depth<=0||b.depth<=0)return;c.strokeStyle=color;c.lineWidth=width*sz;c.lineCap='round';c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke()};
const bodyY=(slide?.58:1.18)+py;
stick(s.x-.23,bodyY-.5,5,s.x-.38,py+.12,5,'#e8eff5',.18);stick(s.x+.23,bodyY-.5,5,s.x+.38,py+.12,5,'#e8eff5',.18);
stick(s.x,bodyY+.18,5,s.x,bodyY-.43,5,'#d28b66',.46);stick(s.x-.15,bodyY+.10,5,s.x-.48,bodyY-.18+sway,5,'#aac5e3',.15);stick(s.x+.15,bodyY+.1,5,s.x+.44,bodyY-.16-sway,5,'#aac5e3',.15);
orb(s.x,bodyY+.62,5,.32,'#e7b18b');return draws.length}
return{render,destroy(){},mode:'Canvas perspective fallback'}}
