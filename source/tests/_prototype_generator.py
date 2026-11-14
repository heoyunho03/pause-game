import random,collections,time
R=random.Random(444)
# A: horizontal at row=2 length 2. others unique id, axis, fixed row/col, length, pos x/y.
def solve(cars, cap=100000):
    init=tuple(c['pos'] for c in cars)
    lens=[c['len'] for c in cars];vert=[c['axis']=='v' for c in cars];fixed=[c['fixed'] for c in cars];n=len(cars)
    def occupancy(state):
      rows=[0]*6
      for i,p in enumerate(state):
        if vert[i]:
          for j in range(lens[i]):rows[p+j]|=1<<fixed[i]
        else:rows[fixed[i]]|=((1<<lens[i])-1)<<p
      return rows
    q=collections.deque([init]);prev={init:None}
    while q:
      s=q.popleft();occ=occupancy(s)
      if s[0]+2==6 or not (occ[2]>> (s[0]+2)):
        # wrong goal: need no blockers to right of ice cream
        if (occ[2] & ~((1<<(s[0]+2))-1))==0:
          out=[];cur=s
          while prev[cur]:
             o,mv=prev[cur];out.append(mv);cur=o
          return list(reversed(out)),len(prev)
      if len(prev)>cap: return None,len(prev)
      for i,p in enumerate(s):
        d=1
        while p-d>=0:
          leading=p-d
          if vert[i]: blocked=(occ[leading]>>fixed[i])&1
          else: blocked=(occ[fixed[i]]>>leading)&1
          if blocked: break
          nxt=s[:i]+(p-d,)+s[i+1:]
          if nxt not in prev:prev[nxt]=(s,(i,p-d));q.append(nxt)
          d+=1
        d=1
        while p+lens[i]-1+d<6:
          leading=p+lens[i]-1+d
          if vert[i]: blocked=(occ[leading]>>fixed[i])&1
          else: blocked=(occ[fixed[i]]>>leading)&1
          if blocked: break
          nxt=s[:i]+(p+d,)+s[i+1:]
          if nxt not in prev:prev[nxt]=(s,(i,p+d));q.append(nxt)
          d+=1
    return None,len(prev)

def make(c=10):
  base={'id':'ice','axis':'h','fixed':2,'len':2,'pos':R.choice([0,1,2])}
  out=[base];occupied={(2,base['pos']+j) for j in range(2)}
  # ensure at least one vertical blocker on row2 to right of ice
  col=R.choice(list(range(base['pos']+2,6)))
  y=R.choice([0,1,2]); ln=R.choice([2,3]); y=min(y,6-ln)
  out.append({'id':'a','axis':'v','fixed':col,'len':ln,'pos':y})
  occupied.update((y+j,col) for j in range(ln))
  if not any((2,col)==(y+j,col) for j in range(ln)):return None
  for i in range(c-1):
    valid=[]
    for direction in ['h','v']:
      for ln in [2,2,2,3]:
        for p in range(7-ln):
          for fixed in range(6):
            cells=tuple((fixed,p+k) if direction=='h' else (p+k,fixed) for k in range(ln))
            if all(cell not in occupied for cell in cells):valid.append((direction,ln,p,fixed,cells))
    if not valid:break
    direction,ln,p,fixed,cells=R.choice(valid)
    occupied.update(cells);out.append({'id':chr(98+i),'axis':direction,'fixed':fixed,'len':ln,'pos':p})
  if len(out)<c: return None
  return out

start=time.time();by={};checked=0
for n in range(600):
 c=make(R.choice([6,7,8,9,10,11,12]));
 if not c:continue
 path,states=solve(c,20000);checked+=1
 if path is None:continue
 d=len(path)
 if d>=2 and d<=30:
  if d not in by:by[d]=c;print('found',d,'cars',len(c),'states',states,'after',n,flush=True)
 if len(by)>=18: break
print('result',sorted(by),'checked',checked,'time',time.time()-start)
