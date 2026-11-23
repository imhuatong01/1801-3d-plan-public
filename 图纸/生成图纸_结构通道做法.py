# -*- coding: utf-8 -*-
"""生成 1801 钢结构 / 通道与消防疏散 / 地面与墙面做法 三张平面图（SVG，A3 横向）。纯标准库。
用法：py -3 生成图纸_结构通道做法.py
画法约定同 E-0x / P-0x：模型 x 向右，但图纸上 x 轴反向（站在门外向里看，夹层/楼梯在左）；正门在图下方；SVG 单位 = mm。
本脚本自成一体，不 import 生成图纸.py。"""
import json, os, math
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CAD = json.load(open(os.path.join(ROOT, '1801_专页核对数据.json'), encoding='utf-8'))
POLY = [((X + 25113) / 1000.0, (Y + 10830) / 1000.0) for X, Y in CAD['geometry']['poly']]
HOLES = [[((X + 25113) / 1000.0, (Y + 10830) / 1000.0) for X, Y in h] for h in CAD['geometry']['holes']]
FONT = '"Microsoft YaHei","PingFang SC","Noto Sans SC",sans-serif'
DATE = '2026-11-19'
STAMP = '方案图 非施工图 须由专业单位深化'
RED = '#c0392b'; GREEN = '#1e8f3a'; BLUEG = '#3a7ca5'

# ---------------------------------------------------------------- 常量（来自 3d-assets）
LOWER = -0.150                          # 户内一楼完成面
FLOOR = 4.100                           # 夹层完成面（与既有混凝土梁面齐平）
STEEL_TOP = 3.960; STEEL_BOT = 3.710    # 钢结构顶 / 底（高 250），其上现浇 140
RISER = (FLOOR - LOWER) / 34.0          # 每级高 0.125
GOING = 0.28
N1, N2 = 18, 16                         # 第一跑 18 级、第二跑 16 级
START1 = 12.95 + (N1 - 1) * GOING       # 第一跑起步 x = 17.71
LAND_X = 12.95                          # 两跑接平台处
ARR2 = 12.95 + (N2 - 1) * GOING         # 第二跑到达夹层 x = 17.15
LAND_TOP = LOWER + N1 * RISER           # 平台走面 +2.100
LAND_BOT = LAND_TOP - 0.12              # 平台底 +1.980
FL1 = math.hypot(17 * GOING, 17 * RISER)   # 第一跑斜长 5.213
FL2 = math.hypot(15 * GOING, 15 * RISER)   # 第二跑斜长 4.600
Z_F1 = (6.90, 8.10)                     # 第一跑 z 范围（楼梯贴后墙，第二跑 z 到 9.40，无缝）
AISLE0 = Z_F1[0] - 1.55                 # 楼梯过道贴第一跑前沿，宽 1.55
MAT_Z1 = AISLE0 - 0.50                  # 拳击软垫离楼梯过道留 0.50
MAT = (14.25, 0.35, 18.25, MAT_Z1)      # 拳击软垫 4.00 × 4.50，离玻璃 0.35，避开窗角原柱
Z_F2 = (8.20, 9.40)                     # 第二跑 z 范围
PLAT = (10.75, Z_F1[0], 12.95, Z_F2[1]) # 中转平台 2.20 × 2.50
SHOWER = (10.77, Z_F1[0] + .05, 12.93, Z_F2[1] - .05)   # 淋浴间外框 2.16 × 2.40
SH_DOOR = (Z_F2[0] + .10, Z_F2[1] - .20 + .05)           # 淋浴门洞（x 12.93 一侧）z 范围（图上画到 9.25）
BEAM_W = 0.125
BEAM_X = [10.70, 11.79, 12.88, 13.97, 15.03, 16.09, 17.15, 18.31]    # 纵梁左缘 x
BEAM_Z1 = 0.90
BEAM_ZEND = [Z_F1[0] - .135] * 3 + [Z_F2[0] - .135] * 3 + [9.28] * 2   # 纵梁止点 z（6.765 / 8.065 / 9.28）
VOID = [(10.70, Z_F1[0]), (13.97, Z_F1[0]), (13.97, Z_F2[0]), (17.15, Z_F2[0]), (17.15, 9.40), (10.70, 9.40)]   # 夹层留空多边形
ZV1, ZV2 = Z_F1[0], Z_F2[0]            # 留空边 z（护栏用）
GZ1 = (10.70, Z_F1[0] - .15, 10.85, Z_F1[0])                 # 留空转角柱
GZ2 = [(13.93, Z_F1[1], 14.13, Z_F2[0]), (17.11, Z_F1[1], 17.31, Z_F2[0])]   # 梯井柱
GZ4 = [(12.83, Z_F1[0] + .02), (10.77, Z_F2[1] - .12), (12.83, Z_F2[1] - .12)]   # 平台立柱（左下角）
def pitch(x):                           # 第一跑梯面线标高
    return LOWER + (1 + (START1 - x) / GOING) * RISER

# ---------------------------------------------------------------- 基础工具
def esc(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')

def tw(s, size):
    return sum(size * (1.0 if ord(c) > 255 else 0.55) for c in s)

def wrap(s, size, width):
    out = []; cur = ''
    for ch in s:
        if tw(cur + ch, size) > width:
            out.append(cur); cur = ch
        else:
            cur += ch
    if cur: out.append(cur)
    return out

class Sheet:
    def __init__(self): self.p = []
    def add(self, s): self.p.append(s)
    def line(self, x1, y1, x2, y2, w=.25, c='#000', dash=None):
        d = ' stroke-dasharray="%s"' % dash if dash else ''
        self.add('<line x1="%.2f" y1="%.2f" x2="%.2f" y2="%.2f" stroke="%s" stroke-width="%.2f"%s fill="none"/>' % (x1, y1, x2, y2, c, w, d))
    def rect(self, x, y, w, h, fill='none', c='#000', sw=.25, dash=None):
        d = ' stroke-dasharray="%s"' % dash if dash else ''
        self.add('<rect x="%.2f" y="%.2f" width="%.2f" height="%.2f" fill="%s" stroke="%s" stroke-width="%.2f"%s/>' % (x, y, w, h, fill, c, sw, d))
    def poly(self, pts, fill='none', c='#000', sw=.25, dash=None, close=True):
        d = ' stroke-dasharray="%s"' % dash if dash else ''
        tag = 'polygon' if close else 'polyline'
        self.add('<%s points="%s" fill="%s" stroke="%s" stroke-width="%.2f"%s stroke-linejoin="round"/>' % (tag, ' '.join('%.2f,%.2f' % p for p in pts), fill, c, sw, d))
    def circle(self, cx, cy, r, fill='none', c='#000', sw=.25, dash=None):
        d = ' stroke-dasharray="%s"' % dash if dash else ''
        self.add('<circle cx="%.2f" cy="%.2f" r="%.2f" fill="%s" stroke="%s" stroke-width="%.2f"%s/>' % (cx, cy, r, fill, c, sw, d))
    def text(self, x, y, s, size=2.6, anchor='start', bold=False, fill='#000', rot=0, halo=False):
        r = ' transform="rotate(%d %.2f %.2f)"' % (rot, x, y) if rot else ''
        h = ' stroke="#fff" stroke-width="%.2f" paint-order="stroke" stroke-linejoin="round"' % (size * .3) if halo else ''
        self.add('<text x="%.2f" y="%.2f" font-size="%.2f" text-anchor="%s" fill="%s"%s%s%s>%s</text>' % (
            x, y, size, anchor, fill, ' font-weight="bold"' if bold else '', h, r, esc(s)))
    def arrow(self, x1, y1, x2, y2, w=.3, c='#000', head=1.8):
        self.line(x1, y1, x2, y2, w, c)
        a = math.atan2(y2 - y1, x2 - x1)
        pts = [(x2, y2), (x2 - head * math.cos(a - .4), y2 - head * math.sin(a - .4)), (x2 - head * math.cos(a + .4), y2 - head * math.sin(a + .4))]
        self.poly(pts, fill=c, c=c, sw=.1)
    def save(self, name):
        defs = ('<defs>'
                '<pattern id="hatch" width="2" height="2" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="2" stroke="#777" stroke-width=".25"/></pattern>'
                '<pattern id="hatchL" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="3" stroke="#999" stroke-width=".2"/></pattern>'
                '<pattern id="dots" width="1.6" height="1.6" patternUnits="userSpaceOnUse"><circle cx=".8" cy=".8" r=".18" fill="#888"/></pattern>'
                '<pattern id="tile" width="2.4" height="2.4" patternUnits="userSpaceOnUse"><rect width="2.4" height="2.4" fill="#cfe4ec"/><path d="M0,0 H2.4 M0,0 V2.4" stroke="#7aa6b8" stroke-width=".18" fill="none"/></pattern>'
                '<pattern id="mat" width="2.2" height="2.2" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="2.2" height="2.2" fill="#8c8f91"/><line x1="0" y1="0" x2="0" y2="2.2" stroke="#6b6e70" stroke-width=".5"/></pattern>'
                '<pattern id="fine" width="1.4" height="1.4" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><line x1="0" y1="0" x2="0" y2="1.4" stroke="#b9a455" stroke-width=".22"/></pattern>'
                '</defs>')
        s = ('<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="420mm" height="297mm" viewBox="0 0 420 297" '
             'font-family=\'%s\'>\n<rect width="420" height="297" fill="#fff"/>\n%s\n%s\n</svg>\n' % (FONT.replace('"', ''), defs, '\n'.join(self.p)))
        with open(os.path.join(HERE, name), 'w', encoding='utf-8') as f: f.write(s)

class View:
    def __init__(self, ox, oy, s=10.0): self.ox, self.oy, self.s = ox, oy, s
    def P(self, x, z): return (self.ox - x * self.s, self.oy + z * self.s)

def frame(sh, name, no, scale):
    sh.rect(5, 5, 410, 287, c='#000', sw=.15)
    sh.rect(10, 10, 400, 277, c='#000', sw=.6)
    x0, y0 = 215, 247
    sh.rect(x0, y0, 195, 40, sw=.5)
    for y in (257, 267, 277): sh.line(x0, y, 410, y, .3)
    sh.line(x0 + 28, 247, x0 + 28, 277, .3)
    sh.line(x0 + 28 + 70, 267, x0 + 28 + 70, 277, .3); sh.line(x0 + 28 + 70 + 45, 267, x0 + 28 + 70 + 45, 277, .3)
    sh.text(x0 + 2, 254.3, '设计单位', 2.6); sh.text(x0 + 30, 254.9, '台北市有间设计公司', 4.4, bold=True); sh.text(x0 + 130, 254.3, '工程名称  1801-OPC空间', 2.8)
    sh.text(x0 + 2, 264.3, '图    名', 2.6); sh.text(x0 + 30, 264.6, name, 3.6, bold=True)
    sh.text(x0 + 2, 274.3, '图    号', 2.6); sh.text(x0 + 30, 274.6, no, 3.8, bold=True)
    sh.text(x0 + 100, 274.3, '比例 ' + scale, 2.6); sh.text(x0 + 145, 274.3, '日期 ' + DATE, 2.8)
    sh.text(x0 + 97.5, 284.4, STAMP, 3.0, anchor='middle', bold=True, fill=RED)

def R(sh, v, x1, z1, x2, z2, **kw):
    a = v.P(x1, z1); b = v.P(x2, z2)
    sh.rect(min(a[0], b[0]), min(a[1], b[1]), abs(a[0] - b[0]), abs(a[1] - b[1]), **kw)

def LN(sh, v, x1, z1, x2, z2, **kw):
    a = v.P(x1, z1); b = v.P(x2, z2); sh.line(a[0], a[1], b[0], b[1], **kw)

def PL(sh, v, pts, **kw):
    sh.poly([v.P(*p) for p in pts], **kw)

def dim_h(sh, v, x1, x2, py, txt, ext_from=None, size=2.4):
    a = v.P(x1, 0)[0]; b = v.P(x2, 0)[0]
    sh.line(a, py, b, py, .25)
    for xx in (a, b):
        sh.line(xx - .9, py + .9, xx + .9, py - .9, .35)
        if ext_from is not None: sh.line(xx, ext_from, xx, py - (1.2 if py < ext_from else -1.2), .15, '#555')
    sh.text((a + b) / 2, py - 1.0, txt, size, anchor='middle')

def dim_v(sh, v, z1, z2, px, txt, x_ref, size=2.4):
    a = v.P(0, z1)[1]; b = v.P(0, z2)[1]
    sh.line(px, a, px, b, .25)
    for yy in (a, b):
        sh.line(px - .9, yy + .9, px + .9, yy - .9, .35)
        sh.line(x_ref, yy, px + (1.2 if px < x_ref else -1.2), yy, .15, '#555')
    sh.text(px - 1.0, (a + b) / 2, txt, size, anchor='middle', rot=-90)

def tag(sh, tx, ty, txt, tgt=None, size=2.1, fill='#fff', c='#000', bold=False, rot=False):
    """白底小标签，tgt 给出则从标签中心拉引线到目标点并打点"""
    w = tw(txt, size) + 1.6; h = size + 1.4
    if tgt:
        sh.line(tx, ty, tgt[0], tgt[1], .15, '#222'); sh.circle(tgt[0], tgt[1], .35, '#222', '#222', .1)
    sh.rect(tx - w / 2, ty - h / 2, w, h, fill, c, .15)
    sh.text(tx, ty + size * .36, txt, size, anchor='middle', bold=bold)

def rtext(sh, x, y, txt, size=2.2, **kw):
    sh.text(x, y, txt, size, **kw)

def legend_grid(sh, x, y, w, items, cols=2, rowh=5.2, title='图 例', size=2.2):
    sh.text(x, y, title, 3.2, bold=True); sh.line(x, y + 1.5, x + w, y + 1.5, .4)
    cw = w / cols; y0 = y + 1.5 + rowh * .6
    maxy = y0
    for i, (draw, label) in enumerate(items):
        r, c = divmod(i, cols) if False else (i // cols, i % cols)
        cx = x + c * cw; cy = y0 + r * rowh
        draw(sh, cx + 6, cy - 1.0)
        lines = wrap(label, size, cw - 15)
        for k, ln in enumerate(lines): sh.text(cx + 13, cy + k * 2.9, ln, size)
        maxy = max(maxy, cy + 2.9 * len(lines))
    return max(maxy, y0 + ((len(items) + cols - 1) // cols - 1) * rowh) + 3

def table(sh, x, y, cols, rows, size=2.1, title=None, pad=1.0, head_size=2.2):
    """cols: [(标题, 宽, 'l'|'r'|'m')]；每格自动折行；返回结束 y"""
    w = sum(c[1] for c in cols)
    if title:
        sh.text(x, y, title, 3.0, bold=True); y += 1.6
    sh.line(x, y, x + w, y, .4); y += 3.3
    xx = x
    for t, cw, al in cols:
        sh.text(xx + pad, y, t, head_size, bold=True); xx += cw
    y += 1.2; sh.line(x, y, x + w, y, .25); y += 3.1
    for row in rows:
        bold = False
        if isinstance(row, dict): bold = row.get('bold', False); row = row['r']
        cells = []
        for (t, cw, al), cell in zip(cols, row):
            cells.append(wrap(str(cell), size, cw - 2 * pad))
        n = max(len(c) for c in cells)
        xx = x
        for (t, cw, al), lines in zip(cols, cells):
            for k, ln in enumerate(lines):
                if al == 'r': sh.text(xx + cw - pad, y + k * (size + 0.9), ln, size, anchor='end', bold=bold)
                elif al == 'm': sh.text(xx + cw / 2, y + k * (size + 0.9), ln, size, anchor='middle', bold=bold)
                else: sh.text(xx + pad, y + k * (size + 0.9), ln, size, bold=bold)
            xx += cw
        y += n * (size + 0.9) + 0.9
        sh.line(x, y - 2.5 - (n - 1) * (size + .9) + n * (size + .9) - .3 + 0, x + w, y - 2.5 - (n - 1) * (size + .9) + n * (size + .9) - .3, .08, '#bbb')
    sh.line(x, y - 2.0, x + w, y - 2.0, .3)
    return y

def notes_block(sh, x, y, w, lines, title='说 明', size=2.3, gap=0.4, start=1):
    sh.text(x, y, title, 3.2, bold=True); sh.line(x, y + 1.4, x + w, y + 1.4, .4)
    y += 5.2
    for i, s in enumerate(lines):
        sh.text(x, y, '%d.' % (i + start), size)
        for ln in wrap(s, size, w - 6):
            sh.text(x + 5, y, ln, size); y += size * 1.3 + .4
        y += gap
    return y

# ---------------------------------------------------------------- 几何/面积
def pip(x, z, poly):
    c = False; n = len(poly)
    for i in range(n):
        x1, z1 = poly[i]; x2, z2 = poly[(i + 1) % n]
        if (z1 > z) != (z2 > z) and x < (x2 - x1) * (z - z1) / (z2 - z1) + x1: c = not c
    return c

def zone_areas(zones, poly, holes_rect=(), extra_rects=()):
    """zones: [(key, [rect...])] 按优先级；返回 {key: m²}（扣 holes，仅限 poly 内）"""
    xs = set(); zs = set()
    for p in poly: xs.add(round(p[0], 5)); zs.add(round(p[1], 5))
    allr = [r for _, rs in zones for r in rs] + list(holes_rect) + list(extra_rects)
    for r in allr:
        xs.add(round(r[0], 5)); xs.add(round(r[2], 5)); zs.add(round(r[1], 5)); zs.add(round(r[3], 5))
    xs = sorted(xs); zs = sorted(zs)
    out = {k: 0.0 for k, _ in zones}; out['_rest'] = 0.0
    for i in range(len(xs) - 1):
        for j in range(len(zs) - 1):
            cx = (xs[i] + xs[i + 1]) / 2; cz = (zs[j] + zs[j + 1]) / 2
            if not pip(cx, cz, poly): continue
            if any(h[0] < cx < h[2] and h[1] < cz < h[3] for h in holes_rect): continue
            a = (xs[i + 1] - xs[i]) * (zs[j + 1] - zs[j])
            for k, rs in zones:
                if any(r[0] <= cx <= r[2] and r[1] <= cz <= r[3] for r in rs):
                    out[k] += a; break
            else:
                out['_rest'] += a
    return out

def poly_area(p):
    return abs(sum(p[i][0] * p[(i + 1) % len(p)][1] - p[(i + 1) % len(p)][0] * p[i][1] for i in range(len(p)))) / 2

COLS = [(h[0][0], h[0][1], h[2][0], h[2][1]) for h in HOLES]
COLS = [(min(a, c), min(b, d), max(a, c), max(b, d)) for a, b, c, d in COLS]
POLY_AREA = poly_area(POLY)
HOLE_AREA = sum((c[2] - c[0]) * (c[3] - c[1]) for c in COLS)

# 一层做法分区（优先级从高到低）
ZONES_1F = [
    ('shower', [SHOWER]),
    ('aisle_stair', [(10.70, AISLE0, 19.275, Z_F1[0]), (START1, Z_F1[0], 19.275, Z_F1[1])]),
    ('entry', [(9.15, 7.675, 10.70, 10.70)]),
    ('aisle_main', [(9.15, 0.0, 10.70, 7.675)]),
    ('mat', [MAT]),
    ('stairzone', [(12.95, Z_F1[0], START1, Z_F2[0]), (12.95, Z_F2[0], ARR2, Z_F2[1]), (10.70, Z_F1[0], 12.95, 9.40)]),
    ('tea', [(10.70, 0.0, MAT[0], AISLE0)]),
    ('open', [(0.0, 0.0, 9.15, 7.675)]),
]
AREA1 = zone_areas(ZONES_1F, POLY, COLS)
AREA_REST = AREA1.pop('_rest')
OPEN_AREA = poly_area(VOID)                  # 夹层留空 11.99
MEZZ_AREA = 81.965 - OPEN_AREA               # 夹层楼面 69.97
STAIR_RECT = {'flight1': (START1 - 12.95) * 1.2, 'landing': 2.2 * 2.5, 'flight2': (ARR2 - 12.95) * 1.2}

# ---------------------------------------------------------------- 疏散路线（模型坐标，m）
DOOR = (9.925, 10.70)
def plen(pts): return sum(math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]) for i in range(len(pts) - 1))
AISLE_Z = AISLE0 + 1.55 / 2                                                # 楼梯过道中线（贴第一跑前沿）
ZC1 = (Z_F1[0] + Z_F1[1]) / 2; ZC2 = (Z_F2[0] + Z_F2[1]) / 2               # 两跑中线 z = 7.50 / 8.80
R1 = [(0.35, 0.35), (9.40, 7.85), DOOR]                                   # 一层开放办公区最远点
R2 = [(19.10, 0.45), (18.00, AISLE_Z), (10.30, AISLE_Z), DOOR]            # 一层夹层下东端最远点（沿楼梯过道）
R3a = [(10.95, 0.45), (17.45, Z_F2[0] - .09), (ARR2, ZC2)]                         # 夹层最远点 -> 第二跑上口（绕过留空角）
R3_land = [(LAND_X, ZC2), (11.85, ZC2), (11.85, ZC1), (LAND_X, ZC1)]      # 平台折行
R3c = [(START1, ZC1), (17.90, AISLE_Z), (10.30, AISLE_Z), DOOR]           # 一跑下口 -> 入户门
L_R1 = plen(R1); L_R2 = plen(R2)
L_R3a = plen(R3a); L_R3land = plen(R3_land); L_R3c = plen(R3c)
L_R3 = L_R3a + FL2 + L_R3land + FL1 + L_R3c

# ================================================================ 底图（A-01 / F-01 共用）
def base_plan(sh, v, floor, paint_wall=False):
    t = 0.20
    if floor == '1F':
        sh.poly([v.P(x, z) for x, z in POLY], fill='#fff', c='none', sw=0)
        walls = [(-t, 0, 0, 7.875), (-t, 7.675, 9.15, 7.875), (8.95, 7.675, 9.15, 10.70), (10.70, 9.40, 10.90, 10.70), (10.70, 9.40, 19.425 + t, 9.60)]
    else:
        walls = [(10.70, 9.40, 19.425 + t, 9.60)]
        PL(sh, v, POLY, fill='#fafafa', c='#aaa', sw=.3, dash='2 1.2')
        for r in [(-t, 0, 0, 7.875), (-t, 7.675, 9.15, 7.875), (8.95, 7.675, 9.15, 10.70), (10.70, 9.40, 10.90, 10.70)]:
            R(sh, v, *r, fill='#e4e4e4', c='#aaa', sw=.15)
    for r in walls: R(sh, v, *r, fill='#c9c9c9', c='#555', sw=.2)
    # 玻璃
    z_end = 0.125 if floor == '1F' else 10.70
    for dz in (-.06, .06): LN(sh, v, z_end, dz, 19.425, dz, w=.25, c=BLUEG)
    for dx in (-.06, .06): LN(sh, v, 19.425 + dx, 0, 19.425 + dx, 9.40, w=.25, c=BLUEG)
    a = v.P(15.0, 0); sh.text(a[0], a[1] - 1.8, '采光玻璃面', 2.0, anchor='middle', fill=BLUEG)
    q = v.P(19.425 + .4, 4.7); sh.text(q[0] + 1.0, q[1], '采光玻璃面', 2.0, anchor='middle', fill=BLUEG, rot=90)
    # 既有柱
    for c in COLS:
        if floor == '2F' and c[0] < 10: R(sh, v, *c, fill='url(#hatchL)', c='#999', sw=.25); continue
        R(sh, v, *c, fill='url(#hatch)', c='#000', sw=.35)
    if floor == '1F':
        a = v.P(8.9, 1.0); sh.text(a[0], a[1] + 2.6, '原柱', 1.9, anchor='middle')
    a = v.P(18.675, 1.0); sh.text(a[0], a[1] + 2.6, '原柱', 1.9, anchor='middle')
    # 总尺寸
    y0 = v.P(0, 0)[1]
    dim_h(sh, v, 0, 9.15, y0 - 8, '9.150', y0 - 1)
    dim_h(sh, v, 9.15, 10.70, y0 - 8, '1.550', y0 - 1)
    dim_h(sh, v, 10.70, 19.425, y0 - 8, '8.725', y0 - 1)
    dim_h(sh, v, 0, 19.425, y0 - 15, '总宽 19.425', y0 - 1)
    xl = v.P(19.425, 0)[0] - 7
    dim_v(sh, v, 0, 9.40, xl, '进深 9.400', v.P(19.425, 0)[0])
    xr = v.P(0, 0)[0] + 7
    dim_v(sh, v, 0, 7.675, xr, '7.675', v.P(0, 0)[0])
    dim_v(sh, v, 0, 10.70, xr + 8, '10.700', v.P(0, 0)[0])

def guard_lines(sh, v, w):
    gl = '#27a3c9'
    LN(sh, v, 10.66, 0, 10.66, ZV1, w=w, c=gl)
    LN(sh, v, 10.70, ZV1 - .04, 13.97, ZV1 - .04, w=w, c=gl); LN(sh, v, 14.01, ZV1, 14.01, ZV2, w=w, c=gl); LN(sh, v, 13.97, ZV2 - .04, 17.15, ZV2 - .04, w=w, c=gl)

def door_marker(sh, v, label='入户门 净宽 1.55（开启方向待核）'):
    a = v.P(10.70, 10.70); b = v.P(9.15, 10.70)
    sh.line(a[0], a[1], b[0], b[1], .6, '#000')
    cx = (a[0] + b[0]) / 2
    sh.text(cx, a[1] + 3.6, label, 2.2, anchor='middle', bold=True)
    sh.arrow(cx, a[1] + 14, cx, a[1] + 7.5, .7, '#000', 2.4)
    sh.text(cx, a[1] + 18.5, '正门', 3.4, anchor='middle', bold=True)

def flight1_treads(sh, v, x_lo, c, w=.12, dash=None):
    for k in range(1, 17):
        x = START1 - k * GOING
        if x_lo < x < START1: LN(sh, v, x, Z_F1[0], x, Z_F1[1], w=w, c=c, dash=dash)

def stairs_outline(sh, v, level, solid_c='#000'):
    """一层：两跑+平台均在夹层楼板下（实线）；夹层：平台、第二跑和第一跑靠平台一段在留空区内可见（实线），其余虚线"""
    if level == '1F':
        R(sh, v, 12.95, Z_F1[0], START1, Z_F1[1], c=solid_c, sw=.3); flight1_treads(sh, v, 12.95, solid_c)
        R(sh, v, 12.95, Z_F2[0], ARR2, Z_F2[1], c='#999', sw=.3, dash='1.6 1')
        for k in range(1, 15):
            x = ARR2 - k * GOING; LN(sh, v, x, Z_F2[0], x, Z_F2[1], w=.12, c='#999', dash='1.6 1')
        R(sh, v, *PLAT, c=solid_c, sw=.3)
    else:
        g = '#999'
        R(sh, v, 12.95, Z_F1[0], START1, Z_F1[1], c=g, sw=.3, dash='1.6 1'); flight1_treads(sh, v, 12.95, g, dash='1.6 1')
        R(sh, v, 12.95, Z_F1[0], 13.97, Z_F1[1], fill='#fff', c=solid_c, sw=.3)
        for k in range(1, 17):
            x = START1 - k * GOING
            if 12.95 < x < 13.97: LN(sh, v, x, Z_F1[0], x, Z_F1[1], w=.12, c=solid_c)
        R(sh, v, 12.95, Z_F2[0], ARR2, Z_F2[1], fill='#fff', c=solid_c, sw=.3)
        for k in range(1, 15):
            x = ARR2 - k * GOING; LN(sh, v, x, Z_F2[0], x, Z_F2[1], w=.12, c=solid_c)
        R(sh, v, *PLAT, fill='#fff', c=solid_c, sw=.3)

def furniture(sh, v, floor):
    if floor == '1F':
        # 茶桌兼小会议桌 2.60 × 1.00：两侧各四座、靠楼梯过道一端主位一座，共九座；另一端靠幕墙放移动电视（视频会议），桌、主位与电视同一中线 x 12.40；茶水柜在电视与拳击垫之间，两区共用
        TX = 12.40
        for z in (1.72, 2.37, 3.02, 3.67):
            for x in (TX - .80, TX + .80): R(sh, v, x - .35, z - .28, x + .35, z + .28, fill='#fafafa', c='#aaa', sw=.15)
        R(sh, v, TX - .28, 3.97, TX + .28, 4.67, fill='#fafafa', c='#aaa', sw=.15)
        R(sh, v, TX - .50, 1.40, TX + .50, 4.00, fill='#f2f2f2', c='#888', sw=.2)
        a = v.P(TX, 2.70); sh.text(a[0], a[1] + .7, '茶桌 9 座', 1.9, anchor='middle', fill='#666', rot=-90)
        R(sh, v, TX - .96, 0.35, TX + .96, 0.95, fill='#e8e8e8', c='#888', sw=.2)
        a = v.P(TX, 0.65); sh.text(a[0], a[1] + .7, '移动电视', 1.7, anchor='middle', fill='#666')
        R(sh, v, 13.42, 0.355, 14.22, 0.805, fill='#f2f2f2', c='#888', sw=.2)
        a = v.P(13.82, 0.58); sh.text(a[0], a[1] + .7, '茶水柜', 1.5, anchor='middle', fill='#666')
        R(sh, v, 18.625, 1.90, 19.075, 3.90, fill='#f2f2f2', c='#888', sw=.2)
        a = v.P(18.85, 2.90); sh.text(a[0], a[1], '储物凳', 1.7, anchor='middle', fill='#666', rot=-90)
    else:
        R(sh, v, 16.8, 1.15, 18.4, 1.95, fill='#f2f2f2', c='#888', sw=.2)
        a = v.P(17.6, 1.55); sh.text(a[0], a[1] + .7, '办公桌', 1.9, anchor='middle', fill='#666')
        R(sh, v, 12.0, 2.45, 14.0, 3.35, fill='#f2f2f2', c='#888', sw=.2)
        a = v.P(13.0, 2.9); sh.text(a[0], a[1] + .7, '茶桌', 1.9, anchor='middle', fill='#666')

# ================================================================ S-01 钢结构布置平面图
H_COL = STEEL_BOT - LOWER                      # 柱高：柱脚 −0.150 到钢结构底 +3.710 = 3.860
H_PCOL = LAND_BOT - LOWER                      # 平台立柱高 2.130

def steel_numbers():
    rows = {}
    zl = [BEAM_ZEND[i] - BEAM_Z1 for i in range(8)]
    rows['ZL-1~3'] = (3, sum(zl[0:3]), zl[0])
    rows['ZL-4~6'] = (3, sum(zl[3:6]), zl[3])
    rows['ZL-7~8'] = (2, sum(zl[6:8]), zl[6])
    rows['HL-1'] = (1, 18.435 - 10.70, 18.435 - 10.70)
    rows['BL-1'] = (1, 18.435 - 13.97, 18.435 - 13.97)
    rows['GZ-1'] = (1, H_COL, H_COL)
    rows['GZ-2'] = (2, 2 * H_COL, H_COL)
    rows['GZ-4'] = (3, 3 * H_PCOL, H_PCOL)
    rows['SB'] = (4, 2 * FL1 + 2 * FL2, None)
    rows['LB-1'] = (1, 18.425 - 10.85, 18.425 - 10.85)
    rows['LB-2'] = (1, 9.30 - 1.00, 9.30 - 1.00)
    return rows

def steel_paint_area(rows):
    """涂装面积估算：每米外表面积（m²/m）× 总长；HN250×125 取 0.97，方管按周长，槽钢 0.60"""
    per = {'ZL-1~3': 0.97, 'ZL-4~6': 0.97, 'ZL-7~8': 0.97, 'HL-1': 0.97, 'BL-1': 0.97, 'GZ-1': 0.60, 'GZ-2': 0.60,
           'GZ-4': 0.40, 'SB': 0.70, 'LB-1': 0.60, 'LB-2': 0.60}
    return sum(per[k] * rows[k][1] for k in per)

def sheet_S01():
    sh = Sheet(); v = View(419, 26, 20)
    frame(sh, '钢结构布置平面图（夹层钢梁平面）', 'S-01', '平面 1:50 / 剖面示意')
    rows = steel_numbers()
    dark = '#1d262d'; mid = '#3a4954'
    PX = lambda x: v.P(x, 0)[0]
    PZ = lambda z: v.P(0, z)[1]
    # --- 既有混凝土
    R(sh, v, 10.70, 0.25, 19.175, 0.90, fill='url(#hatchL)', c='#888', sw=.2, dash='1.2 .8')
    R(sh, v, 18.525, 0.90, 19.175, 9.30, fill='url(#hatchL)', c='#888', sw=.2, dash='1.2 .8')
    for dz in (-.06, .06): LN(sh, v, 10.70, dz, 19.425, dz, w=.25, c=BLUEG)
    for dx in (-.06, .06): LN(sh, v, 19.425 + dx, 0, 19.425 + dx, 9.40, w=.25, c=BLUEG)
    R(sh, v, 10.70, 9.40, 19.625, 9.60, fill='#c9c9c9', c='#555', sw=.2)
    R(sh, v, 18.425, 0.5, 18.925, 1.0, fill='url(#hatch)', c='#000', sw=.35)
    R(sh, v, 18.425, 9.3, 18.925, 9.9, fill='url(#hatch)', c='#000', sw=.35)
    # --- 楼梯/平台/淋浴间（灰细线示意）
    g = '#8d8d8d'; dd = '2 1.2'
    R(sh, v, 12.95, Z_F1[0], START1, Z_F1[1], c=g, sw=.2, dash=dd)
    for k in range(1, 17): LN(sh, v, START1 - k * GOING, Z_F1[0], START1 - k * GOING, Z_F1[1], w=.08, c='#bbb')
    R(sh, v, 12.95, Z_F2[0], ARR2, Z_F2[1], c=g, sw=.2)
    for k in range(1, 15): LN(sh, v, ARR2 - k * GOING, Z_F2[0], ARR2 - k * GOING, Z_F2[1], w=.08, c='#bbb')
    for z0, z1, x1 in ((Z_F1[0], Z_F1[0] + .10, START1), (Z_F1[1] - .10, Z_F1[1], START1), (Z_F2[0], Z_F2[0] + .10, ARR2), (Z_F2[1] - .10, Z_F2[1], ARR2)):
        R(sh, v, 12.95, z0, x1, z1, fill='#c7c7c7', c=g, sw=.08)                       # 梯梁 SB
    R(sh, v, *PLAT, c=g, sw=.25)
    for x in (10.80, 11.33, 11.87, 12.40): R(sh, v, x, PLAT[1] + .10, x + .05, PLAT[3] - .10, fill='#bbb', c=g, sw=.08)
    R(sh, v, *SHOWER, c='#aaa', sw=.15, dash='.8 .8')
    LN(sh, v, 12.93, SH_DOOR[0], 12.93, SH_DOOR[1], w=.7, c='#999')                                  # 淋浴间门（第二跑下方）
    # --- 贴边槽钢
    R(sh, v, 10.85, 0.90, 18.425, 0.99, fill='#9aa3a9', c='#222', sw=.15)
    R(sh, v, 18.435, 1.00, 18.525, 9.30, fill='#9aa3a9', c='#222', sw=.15)
    # --- 留空范围、护栏
    PL(sh, v, VOID, c='#555', sw=.3, dash='3 1.2')
    guard_lines(sh, v, .6)
    # --- 纵梁 ZL-1~8
    for i, x in enumerate(BEAM_X): R(sh, v, x, BEAM_Z1, x + BEAM_W, BEAM_ZEND[i], fill=dark, c='#000', sw=.15)
    R(sh, v, 10.70, Z_F1[0] - .125, 18.435, Z_F1[0], fill=mid, c='#000', sw=.15)        # HL-1
    R(sh, v, 13.97, Z_F2[0] - .125, 18.435, Z_F2[0], fill=mid, c='#000', sw=.15)        # BL-1
    # --- 梁端埋板 MJ / MJ-2 / 后墙托件 TJ
    red = '#c0392b'
    for x in BEAM_X: R(sh, v, x - .06, 0.84, x + BEAM_W + .06, 0.90, fill=red, c='#000', sw=.15)
    for z0, z1 in ((3.2, 3.42), (5.6, 5.82), (Z_F2[0] - .16, Z_F2[0] + .035)): R(sh, v, 18.40, z0, 18.47, z1, fill=red, c='#000', sw=.15)
    for x in (BEAM_X[6], BEAM_X[7]): R(sh, v, x - .04, 9.28, x + BEAM_W + .04, 9.30, fill='#b0471a', c='#000', sw=.15)
    # --- 立柱（实心方块）
    for c in [GZ1] + GZ2: R(sh, v, *c, fill='#000', c='#fff', sw=.2)
    for x, z in GZ4: R(sh, v, x, z, x + .10, z + .10, fill='#555', c='#fff', sw=.15)
    # =========================================== 标注
    for i, x in enumerate(BEAM_X):
        tag(sh, (PX(x) + PX(x + BEAM_W)) / 2, PZ(1.45), 'ZL-%d' % (i + 1), None, size=2.0, bold=True)
    tag(sh, 171.0, PZ(Z_F1[0] - .5), 'HL-1', (171.0, PZ(Z_F1[0] - .0625)), bold=True)
    tag(sh, 106.6, PZ(Z_F2[0] - .5), 'BL-1', (106.6, PZ(Z_F2[0] - .125)), bold=True)
    tag(sh, 192.9, 36.5, 'MJ 梁端埋板', (PX(10.7625), 43.4), bold=True)
    tag(sh, 63.2, 36.5, 'MJ', (PX(18.3725), 43.4), bold=True)
    for z in (3.31, 5.71, 7.98): tag(sh, 38, PZ(z), 'MJ-2', (PX(18.435), PZ(z)), bold=True)
    tag(sh, 211.5, PZ(Z_F1[0] - .5 + .15), 'GZ-1', (PX(10.775), PZ(Z_F1[0] - .075)), bold=True)
    tag(sh, 128.0, PZ(Z_F2[0] + .2), 'GZ-2', (PX(14.03), PZ(Z_F2[0] - .05)), bold=True)
    tag(sh, 63.2, PZ(Z_F2[0] + .2), 'GZ-2', (PX(17.21), PZ(Z_F2[0] - .05)), bold=True)
    tag(sh, 150.5, PZ(Z_F1[0] + .25), 'GZ-4', (PX(12.88), PZ(GZ4[0][1] + .05)), bold=True)
    by = 227.5
    tag(sh, PX(10.82), by, 'GZ-4', (PX(10.82), PZ(GZ4[1][1] + .05)), bold=True)
    tag(sh, PX(12.88), by, 'GZ-4', (PX(12.88), PZ(GZ4[2][1] + .05)), bold=True)
    tag(sh, PX(BEAM_X[6] + .0625), by, 'TJ', (PX(BEAM_X[6] + .0625), PZ(9.29)), bold=True)
    tag(sh, PX(BEAM_X[7] + .0625), by, 'TJ 后墙限位托件', (PX(BEAM_X[7] + .0625), PZ(9.29)), bold=True)
    tag(sh, 211.5, PZ(8.30 + .16 - .10), 'PT', (PX(10.75) + .6, PZ(8.46)), bold=True)
    tag(sh, 85.4, PZ(Z_F1[0] + .30), 'SB', (85.4, PZ(Z_F1[0] + .05)), bold=True)
    tag(sh, 130, 41.0, 'LB-1 贴边槽钢 [200×90（只托板边）', (110, PZ(0.945)), bold=False)
    tag(sh, 38, 120.0, 'LB-2 贴边槽钢', (49.4, 120.0), bold=False)
    tag(sh, 38, 34.0, '既有混凝土挑板带', None, size=1.9)
    tag(sh, 34, 49.0, '原柱 500×500', (PX(18.675), 44.0), size=1.9)
    # 平台/梯段/留空说明
    cx = PX(11.85)
    sh.text(cx, PZ(7.14), '中转平台 2.20×2.50', 2.0, anchor='middle', bold=True, halo=True)
    sh.text(cx, PZ(7.82), '走面 +2.100 · 底 +1.980', 1.9, anchor='middle', halo=True)
    sh.text(cx, PZ(8.21), '淋浴间（平台正下方）', 1.9, anchor='middle', halo=True)
    sh.text(cx, PZ(8.51), '2.16×2.40 · 5.18 m²', 1.9, anchor='middle', halo=True)
    sh.text(cx, PZ(8.81), '净高 1.980 · 不接电源', 1.9, anchor='middle', halo=True)
    sh.text(PX(15.3), PZ(7.18), '第一跑 18 级（局部在楼板下）', 1.9, anchor='middle', fill='#555', halo=True)
    sh.text(PX(15.05), PZ(8.66), '留空，不做楼板  %.2f m²' % OPEN_AREA, 2.2, anchor='middle', bold=True, halo=True)
    sh.text(PX(15.05), PZ(8.96), '（平台、第二跑上方无楼板）', 1.9, anchor='middle', halo=True)
    sh.text(PX(15.05), PZ(9.24), '第二跑 16 级（下行）', 1.9, anchor='middle', fill='#555', halo=True)
    # 说明框
    nx, ny = PX(14.6), PZ(3.9)
    sh.rect(nx - 42, ny - 6.4, 84, 15.6, fill='#fff', c='#444', sw=.2)
    sh.text(nx, ny - 2.2, '全部钢梁顶面齐平：钢结构顶 +3.960，底 +3.710（高 250）', 2.3, anchor='middle', bold=True)
    sh.text(nx, ny + 1.6, '其上压型钢板 + 现浇 140 → 夹层完成面 +4.100', 2.2, anchor='middle')
    sh.text(nx, ny + 5.4, '纵梁 8 根 HN250×125，中距约 1.09，采光面端锚于既有梁', 2.2, anchor='middle')
    # ---------- 尺寸
    top = PZ(0)
    dim_h(sh, v, 10.70, 19.425, 15.0, '夹层外框 8.725', top - 1)
    ys = 21.2
    xs = BEAM_X + [19.425]
    for i in range(8):
        a = PX(xs[i]); b = PX(xs[i + 1])
        sh.line(a, ys, b, ys, .25)
        for xx in (a, b):
            sh.line(xx - .8, ys + .8, xx + .8, ys - .8, .3); sh.line(xx, top - 1, xx, ys - 1.0, .12, '#777')
        sh.text((a + b) / 2, ys - 1.0, '%.3f' % (xs[i + 1] - xs[i]), 2.2, anchor='middle')
    sh.text(207.5, ys + .8, '梁中距', 1.9)
    xr = PX(19.425)
    dim_v(sh, v, 0.90, Z_F1[0], 19.0, '%.3f' % (Z_F1[0] - 0.90), xr)
    dim_v(sh, v, Z_F1[0], Z_F2[0], 19.0, '%.3f' % (Z_F2[0] - Z_F1[0]), xr)
    dim_v(sh, v, Z_F2[0], 9.40, 19.0, '%.3f' % (9.40 - Z_F2[0]), xr)
    # 剖切符号 A-A（沿第一跑中线）
    yA = PZ(ZC1)
    sh.line(207.0, yA, 25.0, yA, .3, '#d00000', '5 1 1 1')
    for xx in (207.4, 24.5):
        sh.circle(xx, yA - 4.2, 1.9, '#fff', '#d00000', .3); sh.text(xx, yA - 3.4, 'A', 2.4, anchor='middle', bold=True, fill='#d00000')
        sh.arrow(xx, yA - 2.3, xx, yA, .3, '#d00000', 1.5)
    sh.text(38, yA - 1.0, '剖切线 A-A', 2.1, anchor='middle', fill='#d00000')
    # ---------- 右栏
    X = 218
    def lg_main(sh, cx, cy): sh.rect(cx - 5, cy - .8, 10, 1.6, fill=dark, c='#000', sw=.15)
    def lg_cross(sh, cx, cy): sh.rect(cx - 5, cy - .6, 10, 1.2, fill=mid, c='#000', sw=.15)
    def lg_col(sh, cx, cy): sh.rect(cx - 1.5, cy - 1.5, 3, 3, fill='#000', c='#000', sw=.1)
    def lg_conc(sh, cx, cy): sh.rect(cx - 5, cy - 1.4, 10, 2.8, fill='url(#hatchL)', c='#888', sw=.2, dash='1.2 .8')
    def lg_col2(sh, cx, cy): sh.rect(cx - 1.8, cy - 1.8, 3.6, 3.6, fill='url(#hatch)', c='#000', sw=.3)
    def lg_stair(sh, cx, cy): sh.rect(cx - 5, cy - 1.4, 10, 2.8, c='#8d8d8d', sw=.2, dash='2 1.2')
    def lg_chan(sh, cx, cy): sh.rect(cx - 5, cy - .6, 10, 1.2, fill='#9aa3a9', c='#222', sw=.15)
    def lg_guard(sh, cx, cy): sh.line(cx - 5, cy, cx + 5, cy, .8, '#27a3c9')
    def lg_void(sh, cx, cy): sh.rect(cx - 5, cy - 1.4, 10, 2.8, c='#555', sw=.3, dash='3 1.2')
    def lg_mj(sh, cx, cy): sh.rect(cx - 2.5, cy - 1.0, 5, 2.0, fill=red, c='#000', sw=.15)
    items = [
        (lg_main, 'ZL 纵梁 HN250×125（深色填充）'), (lg_cross, 'HL 横梁 / BL 边梁 HN250×125（稍浅）'),
        (lg_col, 'GZ-1、GZ-2 钢柱（实心方块）'), (lg_mj, 'MJ / MJ-2 梁端埋板；TJ 后墙限位托件'),
        (lg_chan, 'LB 贴边槽钢（只托板边，不承主梁）'), (lg_void, '夹层留空范围（不做楼板）'),
        (lg_conc, '既有混凝土梁/挑板带（虚线+斜纹）'), (lg_col2, '既有混凝土柱 500×500（斜线）'),
        (lg_stair, '楼梯/平台/淋浴间（楼板下或留空区内，灰细线示意）'), (lg_guard, '玻璃护栏（x=10.70 边及留空边）'),
    ]
    y = legend_grid(sh, X, 14, 190, items, cols=2, rowh=5.2, size=2.1)
    cols = [('编号', 13, 'l'), ('名称/位置', 44, 'l'), ('规格（拟定）', 30, 'l'), ('数量', 9, 'r'), ('总长约(m)', 16, 'r'), ('备注', 76, 'l')]
    def T(k): return '%.2f' % rows[k][1]
    tbl = [
        ('ZL-1~3', '纵梁 1~3（x 10.70/11.79/12.88）', 'HN250×125', 3, T('ZL-1~3'), '每根 z 0.90→%.3f，长 %.2f；采光面端接 MJ，另一端止于 HL-1' % (BEAM_ZEND[0], rows['ZL-1~3'][2])),
        ('ZL-4~6', '纵梁 4~6（x 13.97/15.03/16.09）', 'HN250×125', 3, T('ZL-4~6'), '每根 z 0.90→%.3f，长 %.2f；另一端止于 BL-1；ZL-4 同时是留空边梁' % (BEAM_ZEND[3], rows['ZL-4~6'][2])),
        ('ZL-7~8', '纵梁 7~8（x 17.15/18.31）', 'HN250×125', 2, T('ZL-7~8'), '每根 z 0.90→9.28，长 %.2f；后墙处只做限位托件 TJ，不靠它承重；ZL-8 紧贴短边既有梁' % rows['ZL-7~8'][2]),
        ('HL-1', '横梁（留空前沿边梁）', 'HN250×125', 1, T('HL-1'), 'x 10.70→18.435，z %.3f~%.2f；拉结各纵梁' % (Z_F1[0] - .125, Z_F1[0])),
        ('BL-1', '第二跑旁边梁', 'HN250×125', 1, T('BL-1'), 'x 13.97→18.435，z %.3f~%.2f；端头锚于短边既有梁' % (Z_F2[0] - .125, Z_F2[0])),
        ('MJ', '梁端埋板（采光面一侧）', '钢板+化学锚栓（规格待定）', 8, '—', 'ZL-1~8 采光面端铰接于既有混凝土梁侧面（z=0.90），不设柱'),
        ('MJ-2', '短边锚固埋板', '钢板+化学锚栓（规格待定）', 3, '—', 'BL-1 端头 1 处；ZL-8 沿梁 z≈3.2、5.6 各 1 处；不设柱'),
        ('TJ', '后墙限位托件', '钢板托件（规格待定）', 2, '—', 'ZL-7、ZL-8 后墙端（z 9.28~9.40），只限位不承重'),
        ('GZ-1', '留空转角柱', '□150×150×6', 1, T('GZ-1'), '(10.70~10.85, %.2f~%.2f)；柱顶 +3.710，柱脚 −0.150，含底板+化学锚栓；平台第四角挂在其上' % (GZ1[1], GZ1[3])),
        ('GZ-2', '梯井柱', '□200×100×6', 2, T('GZ-2'), '在两跑之间 0.10 缝内，z %.2f~%.2f；x 13.93~14.13、17.11~17.31，分别在 ZL-4、ZL-7 下；每根高 %.2f' % (GZ2[0][1], GZ2[0][3], H_COL)),
        ('GZ-4', '平台立柱', '□100×100', 3, T('GZ-4'), '(%.2f,%.2f)、(%.2f,%.2f)、(%.2f,%.2f)，到平台底 +1.980；高 %.2f' % (GZ4[0] + GZ4[1] + GZ4[2] + (H_PCOL,))),
        ('PT', '中转平台（2.20×2.50）', '□100×50 @525 + 花纹钢板', 1, '4 根×2.30', '总厚不超过 120（控制淋浴净高 1.980），须结构确认'),
        ('SB', '梯梁', '□250×100×8', 4, T('SB'), '每跑 2 根；第一跑斜长 %.2f ×2，第二跑 %.2f ×2' % (FL1, FL2)),
        ('LB-1', '贴边槽钢（长边）', '[200×90（待定）', 1, T('LB-1'), 'x 10.85→18.425，z 0.90~0.99，只托楼面板边'),
        ('LB-2', '贴边槽钢（短边）', '[200×90（待定）', 1, T('LB-2'), 'x 18.435~18.525，z 1.00→9.30'),
    ]
    ye = table(sh, X, y + 1, cols, tbl, size=2.0, title='构件表（均为拟定，须结构工程师验算）')
    # ---------- A-A 剖面
    section(sh, X, ye + 2)
    # ---------- 左下说明
    notes = [
        '本图为夹层钢结构布置方案示意。全部规格按常规做法拟定，须结构工程师验算，并核对既有混凝土梁承载力后方可施工；未经验算不得下料。',
        '材质 Q235B；表面处理：除锈 → 防锈底漆 → 防火涂料 → 面漆哑光黑 RAL 9005（面漆最后涂）。钢结构须做防火涂料：一级耐火时柱 3.0 h、梁 2.0 h、楼板 1.5 h，耐火等级与厚度以消防审查为准。',
        '荷载取值（拟定）：夹层办公活荷载 2.5 kN/m²，楼梯 3.5 kN/m²。楼面为压型钢板上现浇 140，钢结构总高 250（顶 +3.960、底 +3.710），夹层完成面 +4.100，与既有混凝土梁面齐平。',
        '纵梁最大跨度约 7.0 m，250 高型钢的挠度偏紧，规格与间距须结构工程师验算；压型钢板与现浇层的组合作用及水平力传递亦由结构工程师确定。',
        '采光面一侧不设钢柱：ZL-1~ZL-8 采光面端用后置埋板 MJ（钢板 + 化学锚栓）铰接于既有混凝土梁侧面；既有梁截面、配筋和承载力须结构工程师现场核定后确定埋板与锚栓规格。ZL-8 紧贴短边既有梁，沿梁在 z≈3.2、5.6 另加两处锚固，BL-1 东端同样锚于短边既有梁（MJ-2）；贴边槽钢只托板边。',
        '立柱仅 3 根：留空转角柱 GZ-1，以及两跑之间 0.10 缝内的梯井柱 GZ-2 两根（分别在 ZL-4、ZL-7 下）；柱顶至钢结构底 +3.710，柱脚在 −0.150，按铰接，须核对既有楼板承载。',
        '夹层留空范围（不做楼板）%.2f m²：%s；夹层楼面 %.2f m²。护栏沿 x=10.70 边（z 0~%.2f）和留空一圈设置，x=17.15 为楼梯到达口，不设护栏。' % (OPEN_AREA, '→'.join('(%.2f,%.2f)' % p for p in VOID), MEZZ_AREA, ZV1),
        '中转平台 2.20×2.50，走面 +2.100，底 +1.980；平台上方和第二跑上方无楼板。第一跑自 ZL-4（x=13.97）梁下穿过，该处梁底 +3.710，梯面线到梁底净高 2.07 m（最小值，≥2.00）。淋浴间在平台正下方，净高 1.980，不接任何电源。',
        '图纸方向同电气图：正门在图下方，站在门外向里看夹层在左；本图只画夹层范围。构件定位以本图尺寸为准，现场放线前须复测，以结构深化图为准。',
    ]
    size = 2.3
    def nlines(s): return len(wrap(s, size, 98 - 6))
    tot = sum(nlines(s) + .15 for s in notes); acc = 0; cut = 0
    for i, s in enumerate(notes):
        acc += nlines(s) + .15
        if acc >= tot / 2: cut = i + 1; break
    y1 = notes_block(sh, 12, 233, 98, notes[:cut], size=size, gap=.15)
    y2 = notes_block(sh, 114, 233, 98, notes[cut:], size=size, gap=.15, title='说 明（续）', start=cut + 1)
    assert max(y1, y2) < 289, (y1, y2)
    sh.save('S-01_钢结构布置平面图.svg')
    return rows

def section(sh, X, y0):
    k = 12.5
    sh.text(X, y0 + 2.5, 'A-A 剖面示意（沿第一跑中线，约 1:80，标高为准）', 3.0, bold=True)
    sh.line(X, y0 + 4.0, X + 190, y0 + 4.0, .4)
    XR = 362.0
    top_h = 5.40
    yb = y0 + 7.0
    def Xs(x): return XR - (x - 10.55) * k
    def Ys(h): return yb + (top_h - h) * k
    def Rh(x1, x2, h1, h2, **kw):           # 以模型 x、标高给矩形
        sh.rect(Xs(max(x1, x2)), Ys(max(h1, h2)), abs(Xs(x1) - Xs(x2)), abs(Ys(h1) - Ys(h2)), **kw)
    # 地面与垫高
    sh.rect(Xs(19.45), Ys(LOWER), Xs(10.55) - Xs(19.45), 3.0, fill='url(#hatch)', c='#555', sw=.2)
    sh.line(Xs(19.45), Ys(LOWER), Xs(10.55), Ys(LOWER), .6)
    Rh(10.77, 12.93, LOWER, 0.0, fill='url(#dots)', c='#000', sw=.35)
    for x in (10.77, 12.93): sh.line(Xs(x), Ys(0.0), Xs(x), Ys(LAND_BOT), .35, '#555')
    # 第二跑（切面后方，留空区内）
    up = [(LAND_X, LAND_TOP)]
    for i in range(1, 16): up += [(LAND_X + (i - 1) * GOING, LAND_TOP + i * RISER), (LAND_X + i * GOING, LAND_TOP + i * RISER)]
    up += [(ARR2, FLOOR)]
    drop_ = 0.274
    sh.poly([(Xs(a), Ys(b)) for a, b in up] + [(Xs(ARR2), Ys(FLOOR - drop_)), (Xs(LAND_X), Ys(LAND_TOP - drop_))], fill='#f1eee6', c='#888', sw=.2)
    # 后方立柱（梯井柱）与边梁 BL-1
    for x1, x2 in ((13.93, 14.13), (17.11, 17.31)): Rh(x1, x2, LOWER, STEEL_BOT, fill='#e4e4e4', c='#555', sw=.2)
    Rh(13.97, 18.435, STEEL_BOT, STEEL_TOP, fill='#6b7a85', c='#333', sw=.2)
    # 平台
    Rh(10.75, 12.95, LAND_BOT, LAND_TOP, fill='#444', c='#000', sw=.3)
    # 第一跑（切面）
    pts = [(START1, LOWER)]
    for i in range(1, 18): pts += [(START1 - (i - 1) * GOING, LOWER + i * RISER), (START1 - i * GOING, LOWER + i * RISER)]
    pts += [(LAND_X, LAND_TOP), (LAND_X, LAND_TOP - drop_)]
    xe = LAND_X + (LAND_TOP - drop_ - LOWER) / (RISER / GOING)
    pts += [(xe, LOWER)]
    sh.poly([(Xs(a), Ys(b)) for a, b in pts], fill='#e3ddd0', c='#000', sw=.3)
    # 既有混凝土梁（挑板带）、玻璃
    Rh(18.525, 19.175, FLOOR - .67, FLOOR, fill='url(#hatchL)', c='#555', sw=.25)
    sh.line(Xs(19.425), Ys(LOWER), Xs(19.425), Ys(top_h), .5, BLUEG)
    sh.line(Xs(19.425) + .6, Ys(LOWER), Xs(19.425) + .6, Ys(top_h), .5, BLUEG)
    # 夹层：现浇层、钢结构（纵梁切面）、槽钢
    Rh(13.97, 18.525, STEEL_TOP, FLOOR, fill='url(#hatchL)', c='#444', sw=.2)
    Rh(18.435, 18.525, STEEL_TOP - .20, STEEL_TOP, fill='#9aa3a9', c='#222', sw=.2)
    for x1 in BEAM_X[3:]:                                                        # 切面处的 5 根纵梁 HN250×125
        xa, xb = Xs(x1 + BEAM_W), Xs(x1)
        yt, yb2 = Ys(STEEL_TOP), Ys(STEEL_BOT)
        sh.rect(xa, yt, xb - xa, .30, fill='#1d262d', c='#000', sw=.1)
        sh.rect(xa, yb2 - .30, xb - xa, .30, fill='#1d262d', c='#000', sw=.1)
        cx = (xa + xb) / 2; sh.rect(cx - .2, yt, .4, yb2 - yt, fill='#1d262d', c='#000', sw=.1)
    # 留空边护栏 1.10
    sh.line(Xs(13.97), Ys(FLOOR), Xs(13.97), Ys(FLOOR + 1.10), .6, '#27a3c9')
    sh.text(Xs(13.97) + 1.0, Ys(FLOOR + 1.10) + 1.0, '护栏 1.10', 1.8, anchor='start', fill='#27a3c9')
    # 标高线（右侧）
    lev = [(FLOOR, '+4.100 夹层完成面'), (STEEL_TOP, '+3.960 钢结构顶'), (STEEL_BOT, '+3.710 钢结构底'), (LAND_TOP, '+2.100 平台走面'),
           (LAND_BOT, '+1.980 平台底'), (0.0, '±0.000 淋浴间/入口短廊/公共走廊'), (LOWER, '−0.150 户内一楼完成面')]
    last = -99
    for h, t in lev:
        yl = max(Ys(h) + .8, last + 3.0); last = yl
        sh.line(Xs(10.55) + 1, Ys(h), Xs(10.55) + 5, Ys(h), .15, '#555', '1 .8')
        if abs(yl - .8 - Ys(h)) > .05: sh.line(Xs(10.55) + 5, Ys(h), Xs(10.55) + 5.8, yl - .7, .15, '#555')
        sh.text(Xs(10.55) + 6, yl, t, 2.0)
    sh.text(Xs(10.55) + 6, Ys(top_h) + 3.0, '屋顶结构 +8.400（图外）', 2.0, fill='#555')
    # 尺寸线
    def vdim(x, h1, h2, txt, side=-1):
        xx = Xs(x); sh.line(xx, Ys(h1), xx, Ys(h2), .3, '#b00000')
        for h in (h1, h2): sh.line(xx - 1, Ys(h), xx + 1, Ys(h), .3, '#b00000')
        sh.text(xx + side * 1.2, (Ys(h1) + Ys(h2)) / 2, txt, 2.1, anchor='middle', rot=-90, fill='#b00000', bold=True)
    vdim(11.25, 0.0, LAND_BOT, '淋浴净高 1.980', -1)
    p4 = pitch(13.97)
    vdim(13.97, p4, STEEL_BOT, '净高 %.2f' % (STEEL_BOT - p4), 1)
    # 标签
    tag(sh, Xs(11.85), Ys(LOWER) + 4.6, '淋浴间垫高 150', None, size=1.9)
    tag(sh, Xs(16.1), Ys(1.55), '第一跑 18 级（125 高 × 280 深）', None, size=1.9)
    tag(sh, Xs(15.9), Ys(2.55), '第二跑 16 级（后方）', None, size=1.9)
    tag(sh, Xs(16.2), Ys(4.75), '钢结构 250 + 现浇 140', None, size=1.9)
    tag(sh, Xs(12.1), Ys(3.15), '第 4 根梁下净高 2.07（最小，≥2.00）', None, size=1.8)
    sh.text(Xs(12.1), Ys(2.78), '平台上方留空，无楼板', 1.9, anchor='middle', fill='#555')
    tag(sh, Xs(18.85), Ys(3.1), '内挑板带(既有)', None, size=1.8)

# ================================================================ A-01 通道与消防疏散平面图
def route(sh, v, pts, c=GREEN, dash=None, w=1.0, arrows=True):
    P = [v.P(*p) for p in pts]
    sh.poly(P, c=c, sw=w, dash=dash, close=False)
    if arrows:
        for i in range(len(P) - 1):
            ln = math.hypot(P[i + 1][0] - P[i][0], P[i + 1][1] - P[i][1])
            if ln < 12: continue
            mx = (P[i][0] + P[i + 1][0]) / 2; my = (P[i][1] + P[i + 1][1]) / 2
            a = math.atan2(P[i + 1][1] - P[i][1], P[i + 1][0] - P[i][0])
            sh.arrow(mx - math.cos(a) * 1.2, my - math.sin(a) * 1.2, mx + math.cos(a) * 1.2, my + math.sin(a) * 1.2, .5, c, 2.4)
    sh.arrow(P[-2][0] + (P[-1][0] - P[-2][0]) * .9, P[-2][1] + (P[-1][1] - P[-2][1]) * .9, P[-1][0], P[-1][1], .5, c, 2.6)

def start_mark(sh, v, p, n, label, dx=0, dy=0, anchor='middle'):
    x, y = v.P(*p)
    sh.circle(x, y, 2.3, '#fff', GREEN, .6); sh.text(x, y + .9, str(n), 2.6, anchor='middle', bold=True, fill=GREEN)
    sh.text(x + dx, y + dy, label, 2.1, anchor=anchor, bold=True, fill=GREEN)

def sym_emerg(sh, cx, cy, size=1.9):        # 应急照明灯：红圈 E
    sh.circle(cx, cy, size, '#fff', RED, .4); sh.text(cx, cy + .75, 'E', 2.0, anchor='middle', bold=True, fill=RED)

def sym_exit(sh, cx, cy, dirn=None, w=5.6):  # 疏散指示：绿底白字/箭头
    sh.rect(cx - w / 2, cy - 1.5, w, 3.0, fill=GREEN, c='#0b5a22', sw=.2)
    if dirn is None:
        sh.text(cx, cy + .8, '出口', 1.9, anchor='middle', fill='#fff', bold=True)
    else:
        dx, dy = dirn; sh.arrow(cx - dx * 1.7, cy - dy * 1.7, cx + dx * 1.9, cy + dy * 1.9, .45, '#fff', 1.7)

def front_marker(sh, v, y_text=None):
    """2F 图下方的正门方向小标记"""
    cx = v.P(9.925, 0)[0]
    sh.arrow(cx, 284.0, cx, 277.0, .7, '#000', 2.4)
    sh.text(cx + 3.5, 282.0, '正门方向（一层）', 2.4, bold=True)

def sheet_A01():
    sh = Sheet()
    frame(sh, '通道与消防疏散平面图', 'A-01', '1:110（示意）')
    v1 = View(196, 36, 9.0); v2 = View(196, 176, 9.0)
    yel = '#fff0b8'
    sh.text(14, 13.5, '一层平面（户内完成面 −0.150，入口短廊垫高后 ±0.000）', 3.2, bold=True)
    base_plan(sh, v1, '1F')
    R(sh, v1, 9.15, 0.12, 10.70, 10.70, fill=yel, c='none', sw=0)
    R(sh, v1, 10.70, AISLE0, 19.275, Z_F1[0], fill=yel, c='none', sw=0)
    R(sh, v1, START1, Z_F1[0], 19.275, Z_F1[1], fill=yel, c='none', sw=0)
    R(sh, v1, 10.70, 0, 19.425, 9.40, c='#666', sw=.3, dash='2 1')
    for c in COLS: R(sh, v1, *c, fill='url(#hatch)', c='#000', sw=.35)
    furniture(sh, v1, '1F')
    R(sh, v1, *MAT, fill='none', c='#888', sw=.25, dash='1 1')
    a = v1.P(16.25, 2.9); sh.text(a[0], a[1], '拳击垫区（软垫厚 40）', 2.1, anchor='middle', fill='#666')
    a = v1.P(4.0, 6.0); sh.text(a[0], a[1], '开放办公区（通高，无夹层）', 2.8, anchor='middle', fill='#555')
    stairs_outline(sh, v1, '1F')
    R(sh, v1, *SHOWER, c='#888', sw=.25, dash='.8 .8')
    a = v1.P(12.40, 8.31); sh.text(a[0], a[1], '淋浴间', 1.9, anchor='middle', fill='#666')
    a = v1.P(11.85, 7.21); sh.text(a[0], a[1], '平台 +2.100', 1.7, anchor='middle', fill='#666')
    a = v1.P(15.3, 7.18); sh.text(a[0], a[1], '第一跑 18 级', 1.9, anchor='middle', fill='#666', halo=True)
    # 过道标注
    a = v1.P(9.925, 2.9); sh.text(a[0] + 0.8, a[1], '主过道 宽 1.55', 2.2, anchor='middle', bold=True, rot=-90)
    a = v1.P(16.2, 5.50); sh.text(a[0], a[1], '楼梯过道 宽 1.55', 2.2, anchor='middle', bold=True)
    dim_v(sh, v1, AISLE0, Z_F1[0], v1.P(19.425, 0)[0] - 3.4, '1.55', v1.P(19.275, 0)[0])
    a = v1.P(18.55, 7.18); sh.text(a[0], a[1], '起步前区', 1.8, anchor='middle', fill='#555')
    sh.text(a[0], a[1] + 2.6, '%.2f×%.2f' % (19.275 - START1, Z_F1[1] - Z_F1[0]), 1.8, anchor='middle', fill='#555')
    # 台阶
    for k in range(3): LN(sh, v1, 9.15, 7.675 + k * .07, 10.70, 7.675 + k * .07, w=.45 if k == 0 else .2, c='#000')
    st = v1.P(8.55, 9.7)
    sh.text(st[0], st[1], '↑ 台阶 1 级，高 150（z=7.675 处）', 2.1, anchor='start', bold=True)
    q = v1.P(9.4, 7.78); sh.line(st[0] - 1.0, st[1] - .8, q[0], q[1], .15, '#333')
    sh.text(st[0], st[1] + 3.2, '入口垫高段 ±0.000（垫高 150）', 2.1, anchor='start')
    q = v1.P(9.6, 8.9); sh.line(st[0] - 1.0, st[1] + 2.4, q[0], q[1], .15, '#333')
    p = v1.P(16.6, ZC1 + .30); q = v1.P(13.8, ZC1 + .30); sh.arrow(p[0], p[1], q[0], q[1], .5, '#000', 2.0)
    sh.text(p[0] + 1.8, p[1] + .8, '上', 2.0, anchor='start', bold=True)
    # 既有消防
    R(sh, v1, 0.062, 6.725, 0.262, 7.475, fill='#e8c9c6', c='#a84039', sw=.4)
    a = v1.P(0.16, 7.1)
    sh.text(a[0] - 1.0, v1.P(0, 8.25)[1], '既有消火栓箱（据原始图纸）', 2.0, anchor='end', fill='#a84039', bold=True)
    sh.line(a[0] - 1.0, v1.P(0, 8.25)[1] - 2.2, a[0], a[1] + 3.5, .15, '#a84039')
    rx, ry = v1.P(0.13, 7.56); sh.circle(rx, ry, 1.0, '#a84039', '#a84039', .2)
    sh.text(rx - 1.0, v1.P(0, 8.85)[1], '既有消防立管 (0.13, 7.56)', 2.0, anchor='end', fill='#a84039')
    sh.line(rx - .8, v1.P(0, 8.85)[1] - 2.0, rx, ry + .8, .15, '#a84039')
    rx2, ry2 = v1.P(0.14, 4.10); sh.circle(rx2, ry2, .9, '#fff', '#a84039', .4)
    sh.text(rx2 - 2.4, ry2 + .8, '另一根红管（照片，待核）', 1.9, anchor='end', fill='#a84039')
    pp = '#6a8fa3'
    LN(sh, v1, 0.26, 2.30, 18.70, 2.30, w=.35, c=pp, dash='3 1.2')
    for x in (3.30, 8.10, 12.90, 17.10): LN(sh, v1, x, 0.80, x, 5.80, w=.3, c=pp, dash='3 1.2')
    a = v1.P(5.7, 2.30); sh.text(a[0], a[1] - 1.0, '屋顶下既有细管（照片，疑似喷淋，待核）', 1.9, anchor='middle', fill=pp, halo=True)
    # 疏散路线
    route(sh, v1, R1); route(sh, v1, R2)
    route(sh, v1, [(11.85, ZC2), (11.85, ZC1), (LAND_X, ZC1)] + R3c, dash='3 1.4', w=.9)
    start_mark(sh, v1, R1[0], 1, '一层最远点①  %.1f m' % L_R1, -3.4, 0.8, 'end')
    start_mark(sh, v1, R2[0], 2, '一层最远点②  %.1f m' % L_R2, 7.0, 15.0, 'start')
    a = v1.P(15.2, ZC2); sh.text(a[0], a[1] - 0.6, '夹层路线③ 在平台接入', 1.9, anchor='middle', fill=GREEN, bold=True, halo=True)
    sh.text(a[0], a[1] + 2.2, '（共 %.1f m，见下图）' % L_R3, 1.9, anchor='middle', fill=GREEN, halo=True)
    # 应急照明/疏散指示（拟定）
    sym_exit(sh, *v1.P(9.925, 10.35)); sym_emerg(sh, *v1.P(9.925, 9.2))
    sym_emerg(sh, *v1.P(10.17, 4.75)); sym_exit(sh, *v1.P(9.925, 6.5), dirn=(0, 1))
    sym_exit(sh, *v1.P(14.4, AISLE_Z), dirn=(1, 0)); sym_emerg(sh, *v1.P(18.7, 4.75))
    sym_emerg(sh, *v1.P(18.9, 8.4)); sym_emerg(sh, *v1.P(11.85, 6.45))
    door_marker(sh, v1)
    # ---------------------------------------------------------------- 夹层
    sh.text(14, 153.5, '夹层平面（完成面 +4.100；敞开式夹层，经一部楼梯疏散）', 3.2, bold=True)
    base_plan(sh, v2, '2F')
    R(sh, v2, 10.70, 0, 19.425, 9.40, fill='#f7f6f1', c='#000', sw=.5)
    R(sh, v2, 18.425, 0.5, 18.925, 1.0, fill='url(#hatch)', c='#000', sw=.35)
    PL(sh, v2, VOID, fill='#fff', c='#000', sw=.35)
    stairs_outline(sh, v2, '2F', solid_c='#555')
    guard_lines(sh, v2, .7)
    a = v2.P(15.2, 7.16); sh.text(a[0], a[1], '第一跑（在楼板下）', 1.8, anchor='middle', fill='#999', halo=True)
    a = v2.P(11.85, 7.16); sh.text(a[0], a[1], '平台 +2.100', 1.7, anchor='middle', fill='#555')
    sh.text(a[0], a[1] + 2.6, '（无楼板）', 1.7, anchor='middle', fill='#555')
    furniture(sh, v2, '2F')
    a = v2.P(16.2, 3.4); sh.text(a[0], a[1], '夹层办公/茶歇区', 2.4, anchor='middle', fill='#555')
    a = v2.P(4.6, 3.5); sh.text(a[0], a[1], '一层开放办公区上空（通高，无楼面）', 2.4, anchor='middle', fill='#888')
    a = v2.P(15.05, 8.36); sh.text(a[0], a[1], '留空 %.2f m²（无楼板）' % OPEN_AREA, 1.9, anchor='middle', fill='#333', bold=True, halo=True)
    a = v2.P(14.6, 9.26); sh.text(a[0], a[1], '第二跑 16 级（下行）', 1.9, anchor='middle', fill='#333', halo=True)
    a = v2.P(16.8, 9.26); sh.text(a[0], a[1], '下', 2.0, anchor='middle', bold=True, halo=True)
    route(sh, v2, R3a)
    route(sh, v2, [(ARR2, ZC2), (LAND_X, ZC2)])
    route(sh, v2, [(LAND_X, ZC2), (11.85, ZC2), (11.85, ZC1)], dash='3 1.4', w=.9, arrows=False)
    start_mark(sh, v2, R3a[0], 3, '夹层最远点③  %.1f m（含楼梯）' % L_R3, -3.8, 0.3, 'end')
    a = v2.P(11.85, 6.30); sh.text(a[0], a[1], '接一层路线③', 1.8, anchor='middle', fill=GREEN, bold=True)
    a = v2.P(17.8, 8.46); sh.text(a[0], a[1], '楼梯到达口', 1.8, anchor='start', fill='#333', halo=True)
    sym_emerg(sh, *v2.P(18.0, ZC2 + .16)); sym_exit(sh, *v2.P(17.95, 6.6), dirn=(0, 1), w=5.0)
    sym_exit(sh, *v2.P(14.8, 5.6), dirn=(-1, 0)); sym_emerg(sh, *v2.P(11.4, 5.6))
    front_marker(sh, v2)
    # ---------------------------------------------------------------- 右栏
    X = 218
    def lg_aisle(sh, cx, cy): sh.rect(cx - 5, cy - 1.8, 10, 3.6, fill=yel, c='#999', sw=.2)
    def lg_route(sh, cx, cy):
        sh.line(cx - 5, cy, cx + 3, cy, 1.0, GREEN); sh.arrow(cx + 1, cy, cx + 5, cy, .5, GREEN, 2.4)
    def lg_routed(sh, cx, cy): sh.line(cx - 5, cy, cx + 5, cy, .9, GREEN, '3 1.4')
    def lg_start(sh, cx, cy): sh.circle(cx, cy, 2.0, '#fff', GREEN, .6); sh.text(cx, cy + .8, 'n', 2.2, anchor='middle', bold=True, fill=GREEN)
    def lg_step(sh, cx, cy):
        for k in range(3): sh.line(cx - 4, cy - 1.2 + k * 1.2, cx + 4, cy - 1.2 + k * 1.2, .4 if k == 0 else .2)
    def lg_cab(sh, cx, cy): sh.rect(cx - 2, cy - 2.4, 4, 4.8, fill='#e8c9c6', c='#a84039', sw=.4)
    def lg_pipe(sh, cx, cy): sh.circle(cx, cy, 1.0, '#a84039', '#a84039', .2)
    def lg_spr(sh, cx, cy): sh.line(cx - 5, cy, cx + 5, cy, .35, '#6a8fa3', '3 1.2')
    def lg_em(sh, cx, cy): sym_emerg(sh, cx, cy)
    def lg_ex(sh, cx, cy): sym_exit(sh, cx, cy, dirn=(1, 0), w=7)
    def lg_door(sh, cx, cy): sh.line(cx - 5, cy, cx + 5, cy, .8, '#000')
    def lg_guard(sh, cx, cy): sh.line(cx - 5, cy, cx + 5, cy, .9, '#27a3c9')
    items = [
        (lg_aisle, '过道（浅黄）：主过道、楼梯过道宽均 1.55'), (lg_step, '台阶：z=7.675 处 1 级，高 150'),
        (lg_route, '疏散路线（绿实线+箭头），沿通道中线量取'), (lg_routed, '被楼板遮住 / 续接另一层图的路线（绿虚线）'),
        (lg_start, '最远点编号（①②③）'), (lg_door, '唯一出入口：入户门，净宽 1.55，开启方向待核'),
        (lg_cab, '既有消火栓箱（x=0 端墙）'), (lg_pipe, '既有消防立管（红管，位置据现场照片）'),
        (lg_spr, '屋顶下既有细管（照片，疑似喷淋，待核）'), (lg_em, '应急照明灯（拟定位置，待消防设计确认）'),
        (lg_ex, '疏散指示标志灯（拟定位置，箭头=指示方向）'), (lg_guard, '玻璃护栏 / 留空边护栏（夹层）'),
    ]
    y = legend_grid(sh, X, 14, 190, items, cols=2, rowh=6.0, size=2.4)
    cols = [('编号', 11, 'l'), ('最远点（起点）', 44, 'l'), ('沿线构成（m）', 107, 'l'), ('距离 m', 28, 'r')]
    rows = [
        ('①', '一层开放办公区远角 (0.35, 0.35)', '直线折向入口廊墙角 (9.40, 7.85) %.2f + 入口廊直行至门 %.2f' % (math.hypot(9.40 - .35, 7.85 - .35), math.hypot(.525, 10.7 - 7.85)), '%.1f' % L_R1),
        ('②', '一层夹层下最远角 (19.10, 0.45)', '斜行至楼梯过道 %.2f + 沿过道向入口方向 %.2f + 经主过道折向门 %.2f' % (plen(R2[:2]), plen(R2[1:3]), plen(R2[2:])), '%.1f' % L_R2),
        ('③', '夹层最远角 (10.95, 0.45)', '夹层步行（绕过留空角）%.2f + 第二跑斜长 %.2f + 平台折行 %.2f + 第一跑斜长 %.2f + 一层步行至门 %.2f' % (L_R3a, FL2, L_R3land, FL1, L_R3c), '%.1f' % L_R3),
    ]
    y = table(sh, X, y + 2, cols, rows, size=2.5, head_size=2.5, title='疏散距离（起点至入户门中心，沿路线折线长度）')
    sh.text(X, y + 1.5, '一层最远 %.1f m；夹层最远 %.1f m（含楼梯）。第一跑 18 级：踏面水平投影 4.760，斜长 %.3f；第二跑 16 级：踏面水平投影 4.200，斜长 %.3f。' % (max(L_R1, L_R2), L_R3, FL1, FL2), 2.5, bold=True)
    y += 6.0
    notes = [
        '本图为方案示意。夹层为敞开式夹层，经一部楼梯疏散；全户唯一出入口为入户门（净宽 1.55，开启方向照片看不清，待现场核）。',
        '疏散宽度、疏散距离是否满足、是否需要增设喷淋、烟感、应急照明、疏散指示，以及楼梯是否需要防火分隔，须由消防设计单位或园区审核确认；本图不作符合性结论。',
        '图中应急照明灯和疏散指示标志灯的位置仅为"拟定"：入户门上方、楼梯上口与下口、两条过道转角、中转平台前，具体数量与型号由消防设计确定。',
        '疏散距离量法：起点取各层最远处，路线沿过道中线和楼梯踏步中线；楼梯段按踏面线斜长计（第一跑 5.21、第二跑 4.60）；夹层步行段绕开留空边沿；拐角处按墙角外 0.2~0.3 m 绕行，未计家具；终点取入户门中心。',
        '标高：公共走廊/室外 ±0.000；户内一楼完成面 −0.150；入口短廊 x 9.15~10.70、z 7.675~10.70 垫高 150 至 ±0.000，z=7.675 处下一步台阶，拟定台阶边缘做警示色并加照明。',
        '两条过道（主过道、楼梯过道）须保持 1.55 净宽，不得摆放家具、设备或杂物；一层拳击垫、茶桌、茶水柜均在过道之外。',
        '既有消火栓箱、消防立管位置据原始图纸与现场照片；屋顶下既有细管据照片判断为疑似喷淋管，均须现场核实。',
    ]
    ye = notes_block(sh, X, y + 2, 190, notes, size=2.7, gap=.5)
    assert ye < 246, ye
    sh.save('A-01_通道与消防疏散平面图.svg')

# ================================================================ F-01 地面与墙面做法图
def paint_wall_tag(sh, v, wall, tagpos, label, tgt=None):
    (x1, z1, x2, z2) = wall
    LN(sh, v, x1, z1, x2, z2, w=1.3, c='#e0840a')
    a = v.P(*tagpos)
    if tgt:
        b = v.P(*tgt); sh.line(a[0], a[1], b[0], b[1], .15, '#e0840a')
    sh.circle(a[0], a[1], 2.5 if len(label) < 3 else 3.1, '#fff', '#e0840a', .5)
    sh.text(a[0], a[1] + .8, label, 1.8, anchor='middle', bold=True)

def sheet_F01():
    sh = Sheet()
    frame(sh, '地面与墙面做法图', 'F-01', '1:110（示意）')
    v1 = View(196, 36, 9.0); v2 = View(196, 176, 9.0)
    C7040 = '#cbd0cc'; C7038 = '#b4b8b0'; C7035 = '#cbd0cc'
    A = AREA1
    sh.text(14, 13.5, '一层地面做法与完成面标高（含墙面编号）', 3.2, bold=True)
    base_plan(sh, v1, '1F')
    R(sh, v1, 0.1, 0.1, 9.15, 7.675, fill=C7040, c='none', sw=0)
    R(sh, v1, 10.70, 0.1, 19.30, 9.40, fill=C7040, c='none', sw=0)
    R(sh, v1, 9.15, 0.1, 10.70, 7.675, fill=C7038, c='none', sw=0)
    R(sh, v1, 9.15, 7.675, 10.70, 10.70, fill=C7038, c='none', sw=0)
    R(sh, v1, 9.15, 7.675, 10.70, 10.70, fill='url(#dots)', c='none', sw=0)
    R(sh, v1, 10.70, AISLE0, 19.275, Z_F1[0], fill=C7038, c='none', sw=0)
    R(sh, v1, START1, Z_F1[0], 19.275, Z_F1[1], fill=C7038, c='none', sw=0)
    R(sh, v1, *MAT, fill='url(#mat)', c='#444', sw=.4)
    R(sh, v1, *SHOWER, fill='url(#tile)', c='#2c6275', sw=.5)
    for r in [(-.2, 0, 0, 7.875), (-.2, 7.675, 9.15, 7.875), (8.95, 7.675, 9.15, 10.70), (10.70, 9.40, 10.90, 10.70), (10.70, 9.40, 19.625, 9.60)]:
        R(sh, v1, *r, fill='#c9c9c9', c='#555', sw=.2)
    for c in COLS: R(sh, v1, *c, fill='url(#hatch)', c='#000', sw=.35)
    R(sh, v1, 10.70, 0, 19.425, 9.40, c='#666', sw=.3, dash='2 1')
    for (a_, b_, c_, d_) in ((12.95, Z_F1[0], START1, Z_F1[1]), (12.95, Z_F2[0], ARR2, Z_F2[1]), PLAT):
        R(sh, v1, a_, b_, c_, d_, c='#777', sw=.3, dash='1.6 1')
    for x in BEAM_X: LN(sh, v1, x + BEAM_W / 2, 0.90, x + BEAM_W / 2, 5.15, w=.35, c='#444', dash='4 1.5')
    def zl(p, l1, l2=None, l3=None, size=2.3, anchor='middle', dx=0, dy=0, fill='#000'):
        a = v1.P(*p)
        sh.text(a[0] + dx, a[1] + dy, l1, size, anchor=anchor, bold=True, halo=True, fill=fill)
        if l2: sh.text(a[0] + dx, a[1] + dy + size * 1.4, l2, size - .2, anchor=anchor, halo=True, fill=fill)
        if l3: sh.text(a[0] + dx, a[1] + dy + size * 2.8, l3, size - .2, anchor=anchor, halo=True, fill=fill)
    zl((4.5, 3.3), 'A  开放办公区  %.2f m²' % A['open'], '环氧自流平 RAL 7035 · 完成面 −0.150', size=2.5)
    zl((12.7, 1.4), 'D  茶桌区', '%.2f m²' % A['tea'], '环氧 RAL 7035 · −0.150')
    zl((16.25, 1.0), 'E  拳击垫区', '%.2f m²' % A['mat'], '高密度软垫(深灰)·厚 40')
    a = v1.P(16.25, 3.9); sh.text(a[0], a[1], '面标高 −0.110', 2.1, anchor='middle', halo=True)
    a = v1.P(9.925, 3.8); sh.text(a[0] + 0.8, a[1], 'B 主过道 %.2f m² · RAL 7038 · −0.150' % A['aisle_main'], 2.2, anchor='middle', bold=True, rot=-90, halo=True)
    zl((15.0, AISLE_Z), 'C 楼梯过道+起步前区  %.2f m²' % A['aisle_stair'], 'RAL 7038 · 完成面 −0.150', dy=-.2, size=2.2)
    zl((11.85, 7.51), 'G 淋浴间', '%.2f m²' % A['shower'], '垫高 150 · ±0.000', size=2.0)
    a = v1.P(11.85, 8.71); sh.text(a[0], a[1], '防滑砖/环氧(待定)', 1.6, anchor='middle', halo=True)
    zl((15.2, 8.31), 'H  楼梯投影下 %.2f m²' % A['stairzone'], '环氧 RAL 7035 · −0.150', '（梯下储物，仍按地坪做）', size=2.1)
    zl((18.35, 8.4), 'J 其余', '(同大面)', size=1.8)
    # F：入口垫高段 —— 标注放到窗外空白处
    st = v1.P(8.55, 9.6)
    sh.text(st[0], st[1], 'F 入口垫高段 %.2f m²' % A['entry'], 2.2, anchor='start', bold=True)
    sh.text(st[0], st[1] + 3.2, 'RAL 7038 · 垫高 150 · 完成面 ±0.000', 2.1, anchor='start')
    q = v1.P(9.55, 9.0); sh.line(st[0] - 1.0, st[1] - .8, q[0], q[1], .15, '#333')
    # 墙面刷漆线与编号
    paint_wall_tag(sh, v1, (0.07, 0.10, 0.07, 7.675), (1.1, 5.3), 'W1', (0.07, 5.3))
    paint_wall_tag(sh, v1, (0.0, 7.60, 9.15, 7.60), (3.0, 6.7), 'W2', (3.0, 7.60))
    paint_wall_tag(sh, v1, (9.22, 7.675, 9.22, 10.70), (8.3, 10.3), 'W3', (9.15, 10.3))
    paint_wall_tag(sh, v1, (10.63, 9.4, 10.63, 10.70), (11.5, 10.3), 'W4', (10.70, 10.3))
    paint_wall_tag(sh, v1, (10.70, 9.33, 19.425, 9.33), (15.0, 10.35), 'W5下', (15.0, 9.40))
    for (nm, pos, tg) in (('C1', (7.9, 1.6), (8.9, 1.0)), ('C2下', (18.75, 1.75), (18.7, 1.0))):
        a = v1.P(*pos); b = v1.P(*tg); sh.line(a[0], a[1], b[0], b[1], .15, '#e0840a')
        sh.circle(a[0], a[1], 2.5 if len(nm) < 3 else 3.1, '#fff', '#e0840a', .5); sh.text(a[0], a[1] + .8, nm, 1.8, anchor='middle', bold=True)
    a = v1.P(18.9, 10.35); b = v1.P(18.7, 9.9); sh.line(a[0], a[1], b[0], b[1], .15, '#e0840a')
    sh.circle(a[0], a[1], 3.1, '#fff', '#e0840a', .5); sh.text(a[0], a[1] + .8, 'C3下', 1.8, anchor='middle', bold=True)
    sh.text(v1.P(3.5, 0)[0], v1.P(0, 1.5)[1], '一层开放办公区墙面 W1、W2 全高 8.55，一次刷到顶', 2.0, anchor='middle', fill='#555', halo=True)
    door_marker(sh, v1)
    # ---------------------------------------------------------------- 夹层
    sh.text(14, 153.5, '夹层地面做法与完成面标高（墙面上段）', 3.2, bold=True)
    base_plan(sh, v2, '2F')
    R(sh, v2, 10.70, 0, 19.425, 9.40, fill=C7035, c='#000', sw=.5)
    PL(sh, v2, VOID, fill='#fff', c='#000', sw=.35)
    guard_lines(sh, v2, .7)
    R(sh, v2, 18.425, 0.5, 18.925, 1.0, fill='url(#hatch)', c='#000', sw=.35)
    R(sh, v2, 10.70, 9.40, 19.625, 9.60, fill='#c9c9c9', c='#555', sw=.2)
    a = v2.P(15.0, 4.0)
    sh.text(a[0], a[1], 'I  夹层楼面  %.2f m²' % MEZZ_AREA, 3.0, anchor='middle', bold=True)
    sh.text(a[0], a[1] + 4.4, '环氧自流平 RAL 7035（浅灰）', 2.4, anchor='middle')
    sh.text(a[0], a[1] + 7.8, '完成面 +4.100', 2.4, anchor='middle')
    sh.text(a[0], a[1] + 11.2, '（已扣留空 %.2f m²；未扣既有柱 0.25 m²）' % OPEN_AREA, 1.9, anchor='middle', fill='#555')
    a = v2.P(14.0, 8.91); sh.text(a[0], a[1] - 2.2, '留空 %.2f m²' % OPEN_AREA, 2.0, anchor='middle', bold=True)
    sh.text(a[0], a[1] + .8, '（平台、第二跑上方，无地面）', 1.9, anchor='middle')
    paint_wall_tag(sh, v2, (10.70, 9.33, 19.425, 9.33), (10.9, 8.8), 'W5上', (10.9, 9.33))
    a = v2.P(17.3, 1.8); b = v2.P(18.4, 1.0); sh.line(a[0], a[1], b[0], b[1], .15, '#e0840a')
    sh.circle(a[0], a[1], 3.1, '#fff', '#e0840a', .5); sh.text(a[0], a[1] + .8, 'C2上', 1.8, anchor='middle', bold=True)
    a = v2.P(18.9, 10.35); b = v2.P(18.7, 9.9); sh.line(a[0], a[1], b[0], b[1], .15, '#e0840a')
    sh.circle(a[0], a[1], 3.1, '#fff', '#e0840a', .5); sh.text(a[0], a[1] + .8, 'C3上', 1.8, anchor='middle', bold=True)
    a = v2.P(4.6, 3.5); sh.text(a[0], a[1], '一层开放办公区上空（通高，无楼面）', 2.4, anchor='middle', fill='#888')
    sh.text(a[0], a[1] + 4.0, '墙 W1、W2 的上半段属于一层通高墙，见墙面表', 2.0, anchor='middle', fill='#888')
    a = v2.P(15.0, 6.3); sh.text(a[0], a[1], '钢梁 / 钢柱 / 楼梯 / 栏杆扶手：RAL 9005 哑光黑', 2.0, anchor='middle', fill='#1d262d')
    front_marker(sh, v2)
    # ---------------------------------------------------------------- 右栏
    X = 218
    def sw(fill, pat=None, c='#555'):
        def f(sh, cx, cy):
            sh.rect(cx - 5, cy - 2.0, 10, 4.0, fill=fill, c=c, sw=.3)
            if pat: sh.rect(cx - 5, cy - 2.0, 10, 4.0, fill=pat, c='none', sw=0)
        return f
    items = [
        (sw(C7040), 'RAL 7035 浅灰 环氧自流平（一层、夹层大面）'), (sw(C7038), 'RAL 7038 玛瑙灰 过道环氧自流平（比大面深）'),
        (sw(C7038, 'url(#dots)'), '入口垫高段：同过道色，加点 = 垫高 150'), (sw('url(#tile)', None, '#2c6275'), '淋浴间：防水+防滑砖/环氧防滑，垫高 150（待定）'),
        (sw('url(#mat)', None, '#444'), '拳击垫区：高密度软垫（深灰），厚 40，可赤脚训练'), (sw(C7035), '夹层楼面：同一层大面 RAL 7035'),
        (lambda sh, cx, cy: sh.line(cx - 5, cy, cx + 5, cy, 1.3, '#e0840a'), '刷墙面（W1…W5、C1…C3），乳胶漆 RAL 9016'),
        (lambda sh, cx, cy: sh.line(cx - 5, cy, cx + 5, cy, .8, BLUEG), '玻璃幕墙面：不刷'),
        (lambda sh, cx, cy: sh.line(cx - 5, cy, cx + 5, cy, .6, '#444', '4 1.5'), '钢结构 RAL 9005；一层图虚线=夹层钢梁（从下方可见）'),
    ]
    y = legend_grid(sh, X, 14, 190, items, cols=2, rowh=6.0, size=2.4)
    cola = [('代', 6, 'l'), ('区域', 29, 'l'), ('面积 m²', 14, 'r'), ('完成面', 13, 'r'), ('做法', 33, 'l')]
    rest = AREA_REST
    rowa = [
        ('A', '开放办公区', '%.2f' % A['open'], '−0.150', '环氧 RAL 7035'),
        ('B', '主过道(z 0~7.675)', '%.2f' % A['aisle_main'], '−0.150', '环氧 RAL 7038'),
        ('C', '楼梯过道+前区', '%.2f' % A['aisle_stair'], '−0.150', '环氧 RAL 7038'),
        ('D', '茶桌区', '%.2f' % A['tea'], '−0.150', '环氧 RAL 7035'),
        ('E', '拳击垫区', '%.2f' % A['mat'], '−0.110', '高密度软垫 深灰 厚40'),
        ('F', '入口垫高段', '%.2f' % A['entry'], '±0.000', '垫高150 同过道色'),
        ('G', '淋浴间', '%.2f' % A['shower'], '±0.000', '防滑砖/环氧(待定)'),
        ('H', '楼梯投影下', '%.2f' % A['stairzone'], '−0.150', '环氧 RAL 7035'),
        ('J', '夹层下其余地面', '%.2f' % rest, '−0.150', '环氧 RAL 7035'),
        {'r': ('', '一层小计', '%.2f' % (sum(A.values()) + rest), '', '= 多边形 %.2f − 柱 %.2f' % (POLY_AREA, HOLE_AREA)), 'bold': True},
        {'r': ('I', '夹层楼面', '%.2f' % MEZZ_AREA, '+4.100', '环氧自流平 RAL 7035'), 'bold': True},
    ]
    y0 = y + 2
    ya = table(sh, X, y0, cola, rowa, size=2.2, head_size=2.2, title='地面面积表（按几何实算）')
    sh.text(X, ya + .5, '楼梯正投影：第一跑 %.2f、平台 %.2f、第二跑 %.2f；H 含其中非淋浴部分。' % (STAIR_RECT['flight1'], STAIR_RECT['landing'], STAIR_RECT['flight2']), 1.9, fill='#555')
    Hn = 8.55                       # 一层完成面 −0.150 至屋顶结构 +8.400
    Hlo = FLOOR - LOWER              # 夹层面以下 4.25
    Hup = 8.40 - FLOOR               # 夹层面以上 4.30
    W = [
        ('W1', 'x=0 端墙 (z 0.10~7.675)', 7.575, Hn), ('W2', 'z=7.675 开放区后墙', 9.15, Hn),
        ('W3', 'x=9.15 入口廊右墙', 3.025, Hn), ('W4', 'x=10.70 入口廊左墙', 1.30, Hn),
        ('W5下', 'z=9.40 夹层端墙 下段', 8.725, Hlo), ('W5上', 'z=9.40 夹层端墙 上段', 8.725, Hup),
        ('C1', '既有柱(开放区)四面', 2.0, Hn), ('C2下', '既有柱(长边) 下段', 2.0, Hlo), ('C2上', '既有柱(长边) 上段', 2.0, Hup),
        ('C3下', '墙内柱外露面 下段', 0.7, Hlo), ('C3上', '墙内柱外露面 上段', 0.7, Hup),
    ]
    tot = sum(l * h for _, _, l, h in W)
    wall_tot = sum(l * h for n, _, l, h in W if n.startswith('W'))
    colw = [('编号', 10, 'l'), ('位置', 34, 'l'), ('长 m', 11, 'r'), ('高 m', 9, 'r'), ('面积 m²', 13, 'r'), ('做法', 18, 'l')]
    roww = [(n, t, '%.3f' % l, '%.2f' % h, '%.2f' % (l * h), '乳胶漆 9016') for n, t, l, h in W]
    roww.append({'r': ('合计', '墙 W %.2f + 柱 C %.2f' % (wall_tot, tot - wall_tot), '', '', '%.2f' % tot, '刷漆总面积'), 'bold': True})
    roww.append(('G1', '玻璃幕墙 z=0 长边', '19.300', '—', '不计', '不刷'))
    roww.append(('G2', '玻璃幕墙 x=19.425', '9.400', '—', '不计', '不刷'))
    roww.append(('钢', '钢结构面漆', '', '', '≈%.0f' % STEEL_PAINT, '哑光黑 9005'))
    yw = table(sh, X + 97, y0, colw, roww, size=2.2, head_size=2.2, title='墙面面积表（实墙高 8.55）')
    sh.text(X + 97, yw + .5, '实墙高自一层完成面 −0.150 至屋顶结构 +8.400；夹层范围以夹层面 +4.100 分上下段（下 4.25、上 4.30）。', 1.9, fill='#555')
    sh.text(X + 97, yw + 3.2, '9016 = 白色哑光乳胶漆；钢结构面积为型钢外表面估算，踏板、平台板、护栏另计。', 1.9, fill='#555')
    ytop = max(ya, yw) + 5
    notes = [
        '颜色均为拟定：RAL 7035 / 7038 / 9016 / 9005 以业主最终确认的色卡为准，施工前各做一块样板（地面 1 m²、墙面 1 m²）。',
        '一层户内完成面 −0.150；入口短廊与淋浴间垫高 150 后完成面 ±0.000，拳击垫区铺 40 厚高密度软垫（面标高 −0.110）。垫高层内有排水管，位置、坡度见 P-01。',
        '自流平和刷墙施工前，垫高层内的排水管、电管线必须先完成隐蔽验收（试水、试压、拍照留档）；验收前不得浇自流平。',
        '过道 B、C、F 用 RAL 7038 与大面 RAL 7035 区分，起指路作用；入口垫高段边缘的台阶线（z=7.675）拟定用深色或警示色。',
        '墙面面积为刷漆毛面积，未扣箱体（消火栓箱凸出 0.20、配电箱等），也未计踢脚线；备料时另按 5%~8% 损耗加量。',
        '玻璃幕墙及其窗腰梁（既有混凝土腰梁）不在本图刷涂范围；既有柱面是否刷、刷什么色，待业主确认。钢结构面漆须在防火涂料之后涂装，做法见 S-01。',
    ]
    ye = notes_block(sh, X, ytop, 190, notes, size=2.7, gap=.5)
    assert ye < 246, ye
    sh.save('F-01_地面与墙面做法图.svg')
    return W, tot, wall_tot

STEEL_PAINT = 0.0

if __name__ == '__main__':
    rows = steel_numbers()
    STEEL_PAINT = steel_paint_area(rows)
    sheet_S01()
    sheet_A01()
    W, tot, wall_tot = sheet_F01()
    print('POLY_AREA %.3f HOLES %.3f NET %.3f (CAD 168.264)' % (POLY_AREA, HOLE_AREA, POLY_AREA - HOLE_AREA))
    for k, v in AREA1.items(): print('  1F', k, '%.3f' % v)
    print('  1F rest %.3f' % AREA_REST, 'sum %.3f' % (sum(AREA1.values()) + AREA_REST))
    print('MEZZ %.3f OPEN %.3f' % (MEZZ_AREA, OPEN_AREA))
    print('flight len %.4f %.4f' % (FL1, FL2), 'riser %.5f' % RISER)
    print('R1 %.2f  R2 %.2f  R3a %.2f land %.2f R3c %.2f  R3 total %.2f' % (L_R1, L_R2, L_R3a, L_R3land, L_R3c, L_R3))
    print('walls', [(n, round(l * h, 2)) for n, _, l, h in W], 'tot %.2f wall %.2f' % (tot, wall_tot))
    for k, t in rows.items(): print('  steel', k, t[0], '%.2f' % t[1])
    print('steel paint est %.1f' % STEEL_PAINT)
