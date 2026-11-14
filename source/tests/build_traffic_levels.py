"""Deterministic original level generator. All puzzles verified via BFS; no Rush Hour cards copied."""
from pathlib import Path
import json, random, collections
R=random.Random(20261102)

def solve(cars, limit=40000):
    st=tuple(c['pos'] for c in cars); lens=[c['len'] for c in cars]; v=[c['axis']=='v' for c in cars]; f=[c['fixed'] for c in cars]
    q=collections.deque([st]); parents={st:None}
    while q:
        s=q.popleft();row=[0]*6
        for i,p in enumerate(s):
            if v[i]:
                for j in range(lens[i]):row[p+j]|=1<<f[i]
            else:row[f[i]]|=((1<<lens[i])-1)<<p
        if (row[2] & ~((1<<(s[0]+2))-1))==0:
            path=[]; cur=s
            while parents[cur] is not None:
                prev,move=parents[cur]; path.append(move);cur=prev
            return path[::-1]
        if len(parents)>=limit: return None
        for i,p in enumerate(s):
            for direction in (-1,1):
                j=1
                while True:
                    target=p+j*direction
                    if target<0 or target+lens[i]>6:break
                    lead=target if direction==-1 else target+lens[i]-1
                    hit=((row[lead]>>f[i])&1) if v[i] else ((row[f[i]]>>lead)&1)
                    if hit:break
                    nxt=s[:i]+(target,)+s[i+1:]
                    if nxt not in parents:
                        parents[nxt]=(s,(i,target));q.append(nxt)
                    j+=1
    return None

def make(count):
    ice={'axis':'h','fixed':2,'len':2,'pos':R.randrange(3),'kind':'ice'}
    occupied={(2,ice['pos']+k) for k in range(2)}
    options=[]
    for col in range(ice['pos']+2,6):
        for ln in (2,3):
            for pos in range(7-ln):
                cells={(pos+k,col) for k in range(ln)}
                if (2,col) in cells and not cells&occupied:options.append((col,ln,pos,cells))
    if not options:return None
    col,ln,pos,cells=R.choice(options);occupied.update(cells)
    out=[ice,{'axis':'v','fixed':col,'len':ln,'pos':pos}]
    for _ in range(count-2):
        options=[]
        for axis in 'vh':
            for ln in (2,2,2,3):
                for fixed in range(6):
                    for pos in range(7-ln):
                        cells={(fixed,pos+k) if axis=='h' else (pos+k,fixed) for k in range(ln)}
                        if not cells&occupied:options.append((axis,ln,fixed,pos,cells))
        if not options:return None
        axis,ln,fixed,pos,cells=R.choice(options);occupied.update(cells)
        out.append({'axis':axis,'fixed':fixed,'len':ln,'pos':pos})
    return out

pool={};seen=set()
for t in range(2600):
    count=R.choices([6,7,8,9,10,11,12],[1,2,3,4,4,3,2])[0]
    cars=make(count)
    if cars is None:continue
    key=tuple((x['axis'],x['fixed'],x['len'],x['pos']) for x in cars)
    if key in seen:continue
    seen.add(key)
    path=solve(cars)
    if path is None:continue
    depth=len(path)+1
    if not (2<=depth<=19):continue
    pool.setdefault(depth,[]).append((cars,path))
    if sum(len(a) for a in pool.values())>=380: break
# Increasing difficulty while keeping a meaningful spread.
selected=[];use=set()
for lo,hi in [(2,3)]*5+[(4,5)]*5+[(6,7)]*5+[(8,10)]*5+[(11,19)]*4:
    candidates=[(d,c,p) for d,sets in pool.items() if lo<=d<=hi for c,p in sets if id(c) not in use]
    if not candidates:
        candidates=[(d,c,p) for d,sets in pool.items() for c,p in sets if id(c) not in use]
    if not candidates:break
    d,c,p=R.choice(candidates);use.add(id(c));selected.append((d,c,p))
selected.sort(key=lambda o:o[0]); output=[]
for i,(d,c,p) in enumerate(selected):
    output.append({'level':i+1,'optimal':d,'cars':[{**v,'id':('ice' if j==0 else f'car{j}') } for j,v in enumerate(c)]})
path=Path(__file__).resolve().parent.parent/'src/traffic-levels.json';path.write_text(json.dumps(output,ensure_ascii=False,separators=(',',':')))
print('Original verified levels:',len(output),'optimal moves:',[x['optimal'] for x in output]);print('saved',path)
