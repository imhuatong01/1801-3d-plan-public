// Navigation in three plain levels:
//   1. who is looking   (overall, electrical, plumbing, steel, glass and handrails, floor and wall, review)
//   2. what to look at  (3D views, then drawings)
//   3. the panel that belongs to the chosen 3D view (already part of each view)
// The original button row stays in the page, hidden, and is driven from here.
const SHEETS = {
  e1: ['一层照明', '图纸/E-01_一层照明平面图.svg', '一层照明平面图'], e2: ['一层插座', '图纸/E-02_一层插座平面图.svg', '一层插座平面图'],
  e3: ['夹层照明', '图纸/E-03_夹层照明平面图.svg', '夹层照明平面图'], e4: ['夹层插座', '图纸/E-04_夹层插座平面图.svg', '夹层插座平面图'],
  e5: ['配电系统', '图纸/E-05_配电系统图.svg', '配电系统图'],
  p1: ['给排水平面', '图纸/P-01_给排水平面图.svg', '给排水平面图'], p2: ['排水系统', '图纸/P-02_排水系统示意图.svg', '排水系统示意图'],
  s1: ['钢结构布置', '图纸/S-01_钢结构布置平面图.svg', '钢结构布置平面图'], a1: ['通道与消防疏散', '图纸/A-01_通道与消防疏散平面图.svg', '通道与消防疏散平面图'],
  f1: ['地面与墙面做法', '图纸/F-01_地面与墙面做法图.svg', '地面与墙面做法图']
};
const ROLES = {
  overall: {name: '综合', hint: '整体空间，17 楼和 18 楼的关系',
    views: [['整体', '#dimensionBoard'], ['17 楼 / 18 楼', '#floorStackBoard'], ['空调', '#airBoard'], ['现场原状', '#siteFrameBoard']], sheets: []},
  electric: {name: '电路', hint: '灯、开关、插座、配电箱',
    views: [['电路', '#circuitBoard']], sheets: ['e1', 'e2', 'e3', 'e4', 'e5']},
  water: {name: '水路', hint: '淋浴间给水和排水走向',
    views: [['水路', '#waterBoard'], ['淋浴间', '#wetBoard']], sheets: ['p1', 'p2']},
  steel: {name: '钢构', hint: '夹层钢架、楼梯和平台',
    views: [['钢架', '#steelBoard']], sheets: ['s1']},
  glass: {name: '玻璃', hint: '护栏、楼梯扶手、淋浴间玻璃',
    views: [['玻璃与扶手', '#glassBoard']], sheets: []},
  finish: {name: '地墙', hint: '地面和墙面的做法、范围、颜色',
    views: [['整体', '#dimensionBoard']], sheets: ['f1']},
  park: {name: '审核', hint: '全部平面图：通道与疏散、钢结构、电路、水路、地墙',
    views: [], sheets: ['a1', 's1', 'e1', 'e2', 'e3', 'e4', 'e5', 'p1', 'p2', 'f1']}
};
const ORDER = ['overall', 'electric', 'water', 'steel', 'glass', 'finish', 'park'];

export function setupRoles({host, showPlan, closePlan}) {
  const css = document.createElement('style');
  css.textContent = `
#modes,#socketTools{position:absolute!important;left:-9999px!important;top:-9999px!important;visibility:hidden}
#panPad{display:none!important}
#roleBar{position:absolute;left:10px;top:10px;right:10px;z-index:6;display:flex;flex-direction:column;gap:6px;align-items:flex-start;pointer-events:none;
 font-family:"Microsoft YaHei","PingFang SC","Noto Sans SC",sans-serif}
#roleBar>*{pointer-events:auto;max-width:100%}
#roleBar .row{display:flex;flex-wrap:wrap;gap:6px;align-items:center;border-radius:12px;padding:5px;box-shadow:0 2px 10px #0001}
#roleBar .l1{background:#1d2a33}
#roleBar .l1 b{color:#fff;font-size:15px;padding:0 8px 0 9px}
#roleBar .l1 button{font:600 15px inherit;font-family:inherit;border:0;border-radius:9px;background:transparent;color:#ffffffcc;padding:7px 14px;cursor:pointer}
#roleBar .l1 button.on{background:#fff;color:#1d2a33}
#roleBar .l1 .sep{width:1px;align-self:stretch;background:#ffffff33;margin:3px 4px}
#roleBar .l1 button.dims{border:1px solid #f5a623;background:#f5a623;color:#1d2a33;font-weight:700;font-size:13.5px;padding:6px 12px}
#roleBar .l1 button.dims.on{background:#fff;border-color:#fff}
#roleBar .l1 em{font-style:normal;font-weight:600;font-size:14px;color:#fff;padding:0 10px 0 8px;letter-spacing:.5px}
#roleBar .l2{background:#ffffffee;border:1px solid #1d2a3322}
#roleBar .l2 span{font-size:12.5px;color:#5a666e;padding:0 4px 0 8px}
#roleBar .l2 button{font:600 14.5px inherit;font-family:inherit;border:1px solid #1d2a3326;border-radius:9px;background:#fff;color:#1d2a33;padding:6px 13px;cursor:pointer}
#roleBar .l2 button.on{background:#1d2a33;border-color:#1d2a33;color:#fff}
#roleBar .l2 button.sheet.on{background:#0b5f6b;border-color:#0b5f6b}
#roleBar .l2 button:disabled{opacity:.45;cursor:default}
#rolePick{position:fixed;inset:0;z-index:50;background:#f3f1ebf2;display:flex;align-items:center;justify-content:center;padding:16px;
 font-family:"Microsoft YaHei","PingFang SC","Noto Sans SC",sans-serif}
#rolePick .card{background:#fff;border-radius:18px;padding:24px;max-width:560px;width:100%;box-shadow:0 12px 40px #0003}
#rolePick h2{margin:0 0 4px;font-size:22px;color:#1d2a33}#rolePick p{margin:0 0 16px;color:#5a666e;font-size:14px}
#rolePick p.unit{color:#1d2a33;font-weight:700;font-size:15px}
#rolePick .grid{display:grid;grid-template-columns:repeat(6,1fr);gap:10px}
#rolePick button{font:inherit;text-align:left;border:1px solid #1d2a3326;border-radius:12px;background:#fff;padding:12px 14px;cursor:pointer;grid-column:span 2}
#rolePick button b{display:block;font-size:17px;color:#1d2a33}#rolePick button small{color:#5a666e;font-size:12.5px}
#rolePick button.def{grid-column:1 / -1;text-align:center;padding:18px 14px;background:#1d2a33;border-color:#1d2a33}
#rolePick button.def b{color:#fff}#rolePick button.def small{color:#fffc}
#rolePick button.half{grid-column:span 3}
@media (max-width:640px){#roleBar .l1 button{font-size:14px;padding:6px 10px}#roleBar .l2 button{font-size:13.5px;padding:6px 10px}}`;
  document.head.append(css);

  const bar = document.createElement('div'); bar.id = 'roleBar';
  bar.innerHTML = '<div class="row l1"><b>1801</b></div><div class="row l2"></div>';
  host.append(bar);
  const l1 = bar.querySelector('.l1'), l2 = bar.querySelector('.l2');
  const key = '1801-role';
  let current = 'overall';
  const roleButtons = {};
  for (const id of ORDER) { const b = document.createElement('button'); b.type = 'button'; b.textContent = ROLES[id].name; b.title = ROLES[id].hint; b.onclick = () => choose(id); l1.append(b); roleButtons[id] = b; }
  const sep = document.createElement('i'); sep.className = 'sep'; l1.append(sep);
  // Dimensions start switched off; the switch is highlighted so people find it. It drives the existing toggle.
  const dimBtn = document.createElement('button'); dimBtn.type = 'button'; dimBtn.className = 'dims'; dimBtn.textContent = '尺寸：关'; dimBtn.title = '点一下显示或隐藏尺寸标注'; l1.append(dimBtn);
  const unit = document.createElement('em'); unit.textContent = '设计单位：台北市有间设计公司'; l1.append(unit);
  const dimInner = () => document.querySelector('#dimToggle'), dimOn = () => dimInner()?.getAttribute('aria-pressed') !== 'false';
  const dimShow = () => { const on = dimOn(); dimBtn.textContent = on ? '尺寸：开' : '尺寸：关'; dimBtn.classList.toggle('on', on); };
  dimBtn.onclick = () => { dimInner()?.click(); dimShow(); };
  if (dimOn()) dimInner()?.click();
  dimShow();

  function openView(sel) { closePlan(); document.querySelector(sel)?.click(); }
  // Keep the drawing viewer and the side panels below the bar, whatever height it wraps to.
  function fit() { const top = (bar.offsetHeight + 16) + 'px'; for (const s of ['#spacePlan', '#furnitureEditor']) { const el = document.querySelector(s); if (el) { el.style.top = top; el.style.marginTop = '0'; } } }
  new ResizeObserver(fit).observe(bar);

  function render() {
    const r = ROLES[current];
    for (const id of ORDER) roleButtons[id].classList.toggle('on', id === current);
    l2.replaceChildren();
    const mark = b => l2.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
    const group = text => { const s = document.createElement('span'); s.textContent = text; l2.append(s); };
    if (r.views.length) group('三维');
    r.views.forEach(([label, sel]) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = label; b.onclick = () => { openView(sel); mark(b); }; l2.append(b); });
    if (r.sheets.length) group('图纸');
    const checks = r.sheets.map(id => { const [label, file, title] = SHEETS[id]; const b = document.createElement('button'); b.type = 'button'; b.className = 'sheet'; b.textContent = label;
      b.onclick = () => { showPlan(file, title); fit(); mark(b); }; l2.append(b);
      // A sheet that is not available is shown as pending instead of opening an empty viewer.
      return fetch(file, {method: 'HEAD', cache: 'no-store'}).then(res => res.ok).catch(() => false).then(ok => { if (!ok) { b.disabled = true; b.textContent = label + '（待出）'; } }); });
    host.dataset.role = current;
    Promise.all(checks).then(() => { if (ROLES[current] === r) [...l2.querySelectorAll('button')].find(x => !x.disabled)?.click(); fit(); });
  }
  function choose(id, remember = true) { current = ROLES[id] ? id : 'overall'; if (remember) try { localStorage.setItem(key, current); } catch {} render(); }
  // First visit: one page to say who you are. The overall view sits in the middle.
  function pick() {
    const p = document.createElement('div'); p.id = 'rolePick';
    p.innerHTML = '<div class="card"><h2>请选择你要看的内容</h2><p>选了之后只显示相关的图。上方一排可以随时切换。</p><p class="unit">设计单位：台北市有间设计公司</p><div class="grid"></div></div>';
    const grid = p.querySelector('.grid');
    for (const id of ['electric', 'water', 'steel', 'overall', 'glass', 'finish', 'park']) { const r = ROLES[id], b = document.createElement('button'); b.type = 'button';
      b.className = id === 'overall' ? 'def' : '';
      b.innerHTML = '<b>' + r.name + '</b><small>' + r.hint + '</small>'; b.onclick = () => { p.remove(); choose(id); }; grid.append(b); }
    document.body.append(p);
  }
  const fromUrl = new URLSearchParams(location.search).get('role');
  let saved = null; try { saved = localStorage.getItem(key); } catch {}
  if (fromUrl && ROLES[fromUrl]) choose(fromUrl, false);
  else if (saved && ROLES[saved]) choose(saved, false);
  else { choose('overall', false); pick(); }
  return {choose, current: () => current};
}
