from pathlib import Path
import re
root=Path(__file__).parent
base=(root/'src/base_v03.html').read_text()
styles=(root/'src/game-shell.css').read_text()+'\n'+(root/'src/extra-games.css').read_text()+'\n'+(root/'src/2048-premium.css').read_text()+'\n'+(root/'src/mines-premium.css').read_text()+'\n'+(root/'src/block-premium.css').read_text()+'\n'+(root/'src/sudoku-premium.css').read_text()+'\n'+(root/'src/traffic-premium.css').read_text()+'\n'+(root/'src/bubble-premium.css').read_text()+'\n'+(root/'src/knife-premium.css').read_text()+'\n'+(root/'src/onecard-premium.css').read_text()+'\n'+(root/'src/poker-premium.css').read_text()+'\n'+(root/'src/hexa-premium.css').read_text()+'\n'+(root/'src/sky-premium.css').read_text()+'\n'+(root/'src/runner-premium.css').read_text()+'\n'+(root/'src/pause-v20-ui.css').read_text()
runtime=(root/'src/game-runtime.js').read_text().replace('/*__PAUSE_2048_PREMIUM__*/',(root/'src/2048-premium.js').read_text()).replace('/*__PAUSE_MINES_PREMIUM__*/',(root/'src/mines-premium.js').read_text())
start=base.index('function openModal(')
end=base.index("$$('[data-nav]')",start)
base=base[:start]+runtime+'\n'+base[end:]
base=base.replace("{id:'mines',title:'지뢰찾기',category:'두뇌',minutes:'2–10분',description:'숫자 힌트를 추론해서 숨은 지뢰를 찾으세요.',emoji:'💣'},","{id:'mines',title:'지뢰찾기',category:'두뇌',minutes:'2–10분',description:'숫자 힌트를 추론해서 숨은 지뢰를 찾으세요.',emoji:'💣',live:true},")
base=base.replace("(nav!=='continue'||g.id==='2048')","(nav!=='continue'||['2048','mines'].includes(g.id))")
base=base.replace("if(nav==='records')list=games.filter(g=>g.id==='2048');","if(nav==='records')list=games.filter(g=>['2048','mines'].includes(g.id));")
base=base.replace("이 기기의 실제 2048 기록을 확인할 수 있어.","이 기기의 2048·지뢰찾기 기록을 확인할 수 있어.")
base=base.replace("현재 2048은 플레이 가능하고, 다른 게임은 UI 미리보기로 제공돼요.","2048·지뢰찾기는 플레이 가능하고, 다른 10개 게임은 개발 예정이에요.")
base=base.replace("2048은 플레이 가능", "2048·지뢰찾기는 플레이 가능")
base=base.replace("DEEP SUNSET / UI PROTOTYPE · LOCAL PLAY","DEEP SUNSET / v0.4 · LOCAL PLAY")
base=base.replace("PAUSE — Deep Sunset | 미니게임 아케이드","PAUSE v0.4 — Deep Sunset | 미니게임 아케이드")
base=base.replace("</head>","<style id=\"pause-game-system\">\n"+styles+"\n</style>\n</head>",1)
# Explicitly handle mobile app lifecycle and keyboard quick shortcuts.
base=base.replace("renderFilters();render();\n</script>",'''renderFilters();render();
document.addEventListener('visibilitychange',()=>{if(document.hidden&&gameShell.controller&&!gameShell.paused)togglePause(true)});
document.addEventListener('keydown',e=>{if(!$('#modalBackdrop').classList.contains('open'))return;if(['p','P'].includes(e.key)){e.preventDefault();togglePause();}if(gameShell.id==='2048'&&['z','Z'].includes(e.key)&&!e.ctrlKey&&!e.metaKey){e.preventDefault();gameShell.controller?.undo?.()}});
</script>''')
# Change original key handler: Escape continues to exit, but normal input ignored while paused already.
# Cohesive per-game artwork palette: blue / warm amber as shared anchors; distinctive game-specific tertiary hues preserved.
cover_start=base.index('function cover(id)')
cover_end=base.index('function render()',cover_start)
part=base[cover_start:cover_end]
# Edit selected cover art codes, leaving multicolor bubble identity intact.
replacement={
 '#26233f':'#182b44','#343657':'#29415d','#b79efa':'#5f84bc','#eeaf8e':'#d5a17c','#8edcc2':'#87b4c5','#454664':'#3a526f',
 '#292249':'#182843','#715bcf':'#4673b4','#816eb8':'#486b9b','#cbb8ee':'#adc5de','#cc9ef2':'#d49c77','#ba99f9':'#5c87bc','#eadbff':'#b7cce0','#a3f3db':'#7bb2cb',
 '#30243f':'#292f40','#b85db4':'#bf835f','#51315e':'#324766','#9e79ac':'#967c70','#f6b0cd':'#eab28b','#e5a0d2':'#cf8b78',
 '#281b39':'#1d3046','#8e4ad2':'#557cba','#bf75e8':'#6f9aca','#e17ec7':'#c08770','#f6a36e':'#e0a06d','#7961d9':'#496fba','#e88faf':'#d59a79','#9a64f0':'#7da2d1','#ec91c5':'#c59386',
 '#241c36':'#1a2b43','#bb80dc':'#587bb1','#ec86c2':'#d2a080','#a38ae3':'#8ba5c8','#eeaf99':'#dfa479','#3b2048':'#1c304a',
 '#b780ff':'#7497d1','#e981c1':'#e3a68d','#866ee8':'#5b80bc','#b978c9':'#698fbd','#b780ff':'#7399c8',
 '#aa75bb':'#5477aa','#f2d9eb':'#dae6f2','#fff0f7':'#f4ecdf','#b98ab4':'#7b9bb7',
 '#efad99':'#d7a07d','#f3b57d':'#e6b88c','#e17ec7':'#d39c7f',
  '#2a1828':'#222c3b','#9c5b66':'#9e6850','#df977c':'#d39a6c','#efa994':'#e6b489','#a66c73':'#b28469','#b66e77':'#bd8871','#d27e75':'#d28c69',
 '#3b2145':'#20394b','#663555':'#395569','#c873af':'#d79f77',
 '#23162e':'#202d40','#a54eae':'#517aaf',
 }
for a,b in replacement.items():part=part.replace(a,b)
base=base[:cover_start]+part+base[cover_end:]
# v0.7: expand all 12 games while keeping the proven v0.4 shell intact.
extra=(root/'src/extra-games.js').read_text().replace('/*__PAUSE_BLOCK_PREMIUM__*/',(root/'src/block-premium.js').read_text()).replace('/*__PAUSE_SUDOKU_PREMIUM__*/',(root/'src/sudoku-premium.js').read_text()).replace('/*__PAUSE_TRAFFIC_PREMIUM__*/',(root/'src/traffic-premium.js').read_text()).replace('/*__PAUSE_BUBBLE_PREMIUM__*/',(root/'src/bubble-premium.js').read_text()).replace('/*__PAUSE_KNIFE_PREMIUM__*/',(root/'src/knife-premium.js').read_text()).replace('/*__PAUSE_ONECARD_PREMIUM__*/',(root/'src/onecard-premium.js').read_text()).replace('/*__PAUSE_POKER_PREMIUM__*/',(root/'src/poker-premium.js').read_text()).replace('/*__PAUSE_HEXA_PREMIUM__*/',(root/'src/hexa-premium.js').read_text()).replace('/*__PAUSE_SKY_PREMIUM__*/',(root/'src/sky-premium.js').read_text()+'\n'+(root/'src/sky-fallback.js').read_text()+'\n'+(root/'src/runner-premium.js').read_text()+'\n'+(root/'src/runner-webgl.js').read_text()+'\n'+(root/'src/runner-canvas.js').read_text())
needle="// Public extension contract: register another game in `gameModules[id]` with markup() and mount()."
assert needle in base
base=base.replace(needle, extra+'\n'+needle,1)
base=base.replace("if(!gameShell.controller||!['2048','mines'].includes(gameShell.id))return", "if(!gameShell.controller)return")
base=base.replace("description:'육각형 조각을 이용한 퍼즐. 세부 규칙은 확정 전이에요.'","description:'육각 스택을 쌓아 같은 색을 모으고 연쇄 제거하세요.'")
for gid in ['block','sudoku','rolling','runner','poker','onecard','hexa','bubble','arrow','knife']:
 pattern=r"(\{id:'"+gid+r"',[^\n]*?emoji:'[^']*')(\}(?:,|\]))"
 base,count=re.subn(pattern,r'\1,live:true\2',base,count=1)
 assert count==1, gid
base=base.replace("['2048','mines'].includes(g.id)", "Boolean(gameModules[g.id])")
base=base.replace("이 기기의 2048·지뢰찾기 기록을 확인할 수 있어.", "각 게임의 점수와 진행 상황을 이 기기에 저장해요.")
base=base.replace("2048·지뢰찾기는 플레이 가능하고, 다른 10개 게임은 개발 예정이에요.", "12종 미니게임을 즐겨보세요. 스카이 롤과 무한 달리기는 모두 무한 3D 게임이에요.")
base=base.replace("2048·지뢰찾기는 플레이 가능", "12개 게임 모두 플레이 가능")
base=base.replace("2048과 지뢰찾기 플레이 가능 · 다른 게임은 준비 중이에요.", "12종 게임 플레이 가능 · 스카이 롤 3D · 무한 달리기 3D")
base=base.replace("'2048','mines'", "'2048','mines','block','sudoku','rolling','runner','poker','onecard','hexa','bubble','arrow','knife'")
base=base.replace("Boolean(playStore.read('2048',null)||playStore.read('mines',null)||getJSON('pause:2048state',null))", "Boolean(['2048','mines','block','sudoku','rolling','runner','poker','onecard','hexa','bubble','arrow','knife'].some(id=>playStore.read(id,null))||playStore.read('sky-roll-3d-v1',null))")
base=base.replace("3D 트랙 위를 구르며 장애물을 피해요.","끝없는 실제 3D 트랙에서 장애물을 피해 최고 거리에 도전하세요.")
base=base.replace("점프하고 피하고, 최고 기록에 도전!", "3D 무한 달리기에서 차선 이동·점프·슬라이드로 최고 기록에 도전!")
base=base.replace("DEEP SUNSET / v0.4 · LOCAL PLAY","DEEP SUNSET / v2.0 · QUALITY PLAY")
base=base.replace("PAUSE v0.4 — Deep Sunset | 미니게임 아케이드", "PAUSE v2.0 — Deep Sunset | 미니게임 아케이드")
base=base.replace("if(!gameShell.controller||!['2048','mines'].includes(gameShell.id))return", "if(!gameShell.controller)return")
base=base.replace("description:'육각형 조각을 이용한 퍼즐. 세부 규칙은 확정 전이에요.'","description:'육각 스택을 쌓아 같은 색을 모으고 연쇄 제거하세요.'")
base=base.replace("const choose=$('#oneSuits');choose.hidden=!oneS.wild;", "const choose=$('#oneSuits');choose.hidden=oneS.wild===undefined;")
base=base.replace('무한 달리기 2.5D 베타','무한 달리기 3D').replace('무한 달리기 2.5D','무한 달리기 3D')
base=base.replace("description:'점프하고 피하고, 최고 기록에 도전!'","description:'스테이지 없는 3D 무한맵에서 차선·점프·슬라이딩으로 달려보세요.'")
base=base.replace("playStore.read('sky-roll-3d-v1',null)","playStore.read('sky-roll-3d-v1',null)||playStore.read('runner-3d-v1',null)")
base=base.replace('12종 게임 플레이 가능 · 스카이 롤 WebGL 3D · 무한 달리기 2.5D 베타','12종 게임 플레이 가능 · 스카이 롤/무한 달리기 3D')
base=base.replace("'runner',null","'runner',null")
path=root/'index.html';path.write_text(base)
print('created',path,'bytes',path.stat().st_size)
