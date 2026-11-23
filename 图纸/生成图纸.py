# -*- coding: utf-8 -*-
"""生成 1801 电气/给排水平面图（SVG，A3 横向）。纯标准库。
用法：py -3 生成图纸.py        （先运行 生成电气数据.py 得到 ../1801_电气数据.json）
画法约定：模型 x 向右，但图纸上 x 轴反向（站在门外向里看，夹层/楼梯在左）；正门在图下方。
1:100 时 1 m = 10 mm；SVG 单位 = mm。"""
import json, os, math
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
D = json.load(open(os.path.join(ROOT, '1801_电气数据.json'), encoding='utf-8'))
CAD = json.load(open(os.path.join(ROOT, '1801_专页核对数据.json'), encoding='utf-8'))
POLY = [((X + 25113) / 1000.0, (Y + 10830) / 1000.0) for X, Y in CAD['geometry']['poly']]
LIGHT = {l['id']: l for l in D['lights']}
SW = {s['id']: s for s in D['switches']}
FONT = '"Microsoft YaHei","PingFang SC","Noto Sans SC",sans-serif'
DATE = '2026-11-19'
STAMP = '方案图 非施工图 须由持证电工/给排水工程师深化'
COL = {'WL1': '#1f6fb5', 'WL2': '#c07a10', 'WL3': '#17868a', 'WL4': '#7a56a4', 'WL5': '#c0392b',
       'WX1': '#1f6fb5', 'WX2': '#17868a', 'WX3': '#c07a10', 'WX4': '#7a56a4', 'WX5': '#b03a6e', 'WX6': '#5d7a1f'}
BLUE = '#1565c0'; RED = '#c0392b'; GREY = '#888'

# ---- 楼梯贴后墙(z=9.40)后的几何：两跑各宽 1.20、梯井 0.10、平台 2.20×2.50、淋浴间在平台正下方
Z_F1 = (6.90, 8.10); Z_F2 = (8.20, 9.40)            # 第一跑 / 第二跑 z 范围（第二跑贴后墙，无缝）
ZC1 = sum(Z_F1) / 2; ZC2 = sum(Z_F2) / 2            # 两跑中线 7.50 / 8.80
PLAT = (10.75, Z_F1[0], 12.95, Z_F2[1])             # 中转平台
SHOWER = (10.77, Z_F1[0] + .05, 12.93, Z_F2[1] - .05)   # 淋浴间外框 2.16×2.40
SH_DOOR = (Z_F2[0] + .10, Z_F2[1] - .20)            # 淋浴门洞 z 范围（x=12.93 一侧）
U = (18.20, 9.30)                                   # 一楼 → 夹层唯一上引点（后墙东端，第 7、8 根梁之间）
ZW = 9.33                                           # 后墙明装线槽中线 z

def esc(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')

def tw(s, size):
    """估算文字宽度(mm)"""
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
    def __init__(self):
        self.p = []
    def add(self, s): self.p.append(s)
    def line(self, x1, y1, x2, y2, w=.25, c='#000', dash=None, cap=None):
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
    def path(self, d, fill='none', c='#000', sw=.25, dash=None):
        ds = ' stroke-dasharray="%s"' % dash if dash else ''
        self.add('<path d="%s" fill="%s" stroke="%s" stroke-width="%.2f"%s/>' % (d, fill, c, sw, ds))
    def text(self, x, y, s, size=2.6, anchor='start', bold=False, fill='#000', rot=0):
        r = ' transform="rotate(%d %.2f %.2f)"' % (rot, x, y) if rot else ''
        self.add('<text x="%.2f" y="%.2f" font-size="%.2f" text-anchor="%s" fill="%s"%s%s>%s</text>' % (
            x, y, size, anchor, fill, ' font-weight="bold"' if bold else '', r, esc(s)))
    def para(self, x, y, s, size=2.5, width=100, gap=1.25, bold=False, fill='#000'):
        for ln in s.split('\n'):
            for w in (wrap(ln, size, width) or ['']):
                self.text(x, y, w, size, bold=bold, fill=fill); y += size * gap + .6
        return y
    def arrow(self, x1, y1, x2, y2, w=.3, c='#000', head=1.8):
        self.line(x1, y1, x2, y2, w, c)
        a = math.atan2(y2 - y1, x2 - x1)
        pts = [(x2, y2), (x2 - head * math.cos(a - .4), y2 - head * math.sin(a - .4)), (x2 - head * math.cos(a + .4), y2 - head * math.sin(a + .4))]
        self.poly(pts, fill=c, c=c, sw=.1)
    def save(self, name):
        defs = ('<defs><pattern id="hatch" width="2" height="2" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="2" stroke="#777" stroke-width=".25"/></pattern>'
                '<pattern id="dots" width="1.6" height="1.6" patternUnits="userSpaceOnUse"><circle cx=".8" cy=".8" r=".18" fill="#999"/></pattern></defs>')
        s = ('<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="420mm" height="297mm" viewBox="0 0 420 297" '
             'font-family=\'%s\'>\n<rect width="420" height="297" fill="#fff"/>\n%s\n%s\n</svg>\n' % (FONT.replace('"', ''), defs, '\n'.join(self.p)))
        with open(os.path.join(HERE, name), 'w', encoding='utf-8') as f: f.write(s)

class View:
    def __init__(self, ox, oy, s=10.0): self.ox, self.oy, self.s = ox, oy, s
    def P(self, x, z): return (self.ox - x * self.s, self.oy + z * self.s)
    def L(self, m): return m * self.s

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
    sh.text(x0 + 100, 274.3, '比例 ' + scale, 2.8); sh.text(x0 + 145, 274.3, '日期 ' + DATE, 2.8)
    sh.text(x0 + 97.5, 284.4, STAMP, 3.0, anchor='middle', bold=True, fill=RED)

# ---------------------------------------------------------------- 符号
def s_linear(sh, cx, cy, vertical=False, ghost=False, col='#d98200'):
    w, h = (1.6, 7.0) if vertical else (7.0, 1.6)
    sh.rect(cx - w / 2, cy - h / 2, w, h, fill='#fff', c=col, sw=.3, dash='0.8 0.6' if ghost else None)
    if vertical: sh.line(cx, cy - h / 2 + .8, cx, cy + h / 2 - .8, .25, col)
    else: sh.line(cx - w / 2 + .8, cy, cx + w / 2 - .8, cy, .25, col)

def s_ceiling(sh, cx, cy, col='#000'):
    sh.circle(cx, cy, 2.0, '#fff', col, .35)
    sh.line(cx - 1.4, cy - 1.4, cx + 1.4, cy + 1.4, .3, col); sh.line(cx - 1.4, cy + 1.4, cx + 1.4, cy - 1.4, .3, col)

def s_socket(sh, cx, cy, n, splash=False):
    dx, dy = -n[0], n[1]                      # 图纸上的"朝室内"方向
    px, py = -dy, dx
    r = 1.5
    p1 = (cx + px * r, cy + py * r); p2 = (cx - px * r, cy - py * r)
    sh.path('M%.2f,%.2f A%.2f,%.2f 0 0 0 %.2f,%.2f Z' % (p1[0], p1[1], r, r, p2[0], p2[1]), fill='#1565c0', c='#1565c0', sw=.3)
    sh.line(cx + px * 2.3, cy + py * 2.3, cx - px * 2.3, cy - py * 2.3, .3, '#1565c0')
    if splash:
        r2 = 2.4
        q1 = (cx + px * r2, cy + py * r2); q2 = (cx - px * r2, cy - py * r2)
        sh.path('M%.2f,%.2f A%.2f,%.2f 0 0 0 %.2f,%.2f' % (q1[0], q1[1], r2, r2, q2[0], q2[1]), sw=.3)

def s_switch(sh, cx, cy, n, gangs=1, dual=False, col='#c62828'):
    dx, dy = -n[0], n[1]; px, py = -dy, dx
    sh.circle(cx, cy, 0.95, col, col, .2)
    ex, ey = cx + dx * 5.0, cy + dy * 5.0
    sh.line(cx, cy, ex, ey, .35, col)
    for k in range(gangs):
        t = 2.0 + k * 1.0
        mx, my = cx + dx * t, cy + dy * t
        sh.line(mx + px * .9, my + py * .9, mx - px * .9, my - py * .9, .3, col)
    if dual:
        for sgn in (1, -1):
            sh.line(ex, ey, ex + dx * 1.2 + px * 1.3 * sgn, ey + dy * 1.2 + py * 1.3 * sgn, .35, col)

def s_board(sh, cx, cy, w=5.8, h=1.6, label=None):
    sh.rect(cx - w / 2, cy - h / 2, w, h, fill='#1f3b57', c='#000', sw=.3)

def s_ac(sh, cx, cy, size=6.0):
    sh.rect(cx - size / 2, cy - size / 2, size, size, fill='#fff', c='#000', sw=.3)
    sh.line(cx - size / 2, cy - size / 2, cx + size / 2, cy + size / 2, .25); sh.line(cx - size / 2, cy + size / 2, cx + size / 2, cy - size / 2, .25)
    sh.circle(cx, cy, size * .22, '#fff', '#000', .25)

def s_grille(sh, cx, cy, w=8):
    sh.rect(cx - w / 2, cy - 1.1, w, 2.2, fill='#fff', c='#000', sw=.3)
    for i in range(-3, 4): sh.line(cx + i * w / 8, cy - 1.1, cx + i * w / 8, cy + 1.1, .15)

def ticks(sh, x1, y1, x2, y2, n=3, c='#000'):
    """导线根数短斜线，画在线段中点"""
    mx, my = (x1 + x2) / 2, (y1 + y2) / 2
    a = math.atan2(y2 - y1, x2 - x1)
    for k in range(n):
        t = (k - (n - 1) / 2) * 0.9
        cx, cy = mx + math.cos(a) * t, my + math.sin(a) * t
        ang = a + math.radians(60)
        sh.line(cx - math.cos(ang) * 1.0, cy - math.sin(ang) * 1.0, cx + math.cos(ang) * 1.0, cy + math.sin(ang) * 1.0, .3, c)

def wire(sh, v, pts, c, w=.35, dash=None, tick=3, tickat=None):
    P = [v.P(*p) for p in pts]
    sh.poly(P, c=c, sw=w, dash=dash, close=False)
    if tick:
        i = tickat if tickat is not None else max(range(len(P) - 1), key=lambda k: math.hypot(P[k + 1][0] - P[k][0], P[k + 1][1] - P[k][1]))
        ticks(sh, P[i][0], P[i][1], P[i + 1][0], P[i + 1][1], tick, c)

# ---------------------------------------------------------------- 图例
def legend(sh, x, y, w, items, title='图 例', rowh=6.4):
    sh.text(x, y, title, 3.2, bold=True)
    sh.line(x, y + 1.5, x + w, y + 1.5, .4)
    y += 1.5 + rowh * .62
    for draw, label in items:
        cy = y
        draw(sh, x + 8, cy - 1.0)
        lines = wrap(label, 2.4, w - 19)
        yy = cy
        for k, ln in enumerate(lines):
            sh.text(x + 18, yy, ln, 2.4); yy += 3.0
        y += max(rowh, 3.0 * len(lines) + 2.0)
    return y

def lg_line(col, dash=None, w=.45, n=0):
    def f(sh, cx, cy):
        sh.line(cx - 6, cy, cx + 6, cy, w, col, dash)
        if n: ticks(sh, cx - 6, cy, cx + 6, cy, n, col)
    return f

# ---------------------------------------------------------------- 建筑底图
def wr(sh, v, x1, z1, x2, z2, fill='#c9c9c9', c='#555', sw=.2):
    a = v.P(x1, z1); b = v.P(x2, z2)
    sh.rect(min(a[0], b[0]), min(a[1], b[1]), abs(a[0] - b[0]), abs(a[1] - b[1]), fill=fill, c=c, sw=sw)

def dim_h(sh, v, x1, x2, py, txt, ext_from=None, size=2.5):
    a = v.P(x1, 0)[0]; b = v.P(x2, 0)[0]
    sh.line(a, py, b, py, .25)
    for xx in (a, b):
        sh.line(xx - .9, py + .9, xx + .9, py - .9, .35)
        if ext_from is not None: sh.line(xx, ext_from, xx, py - (1.2 if py < ext_from else -1.2), .15, '#555')
    sh.text((a + b) / 2, py - 1.0, txt, size, anchor='middle')

def dim_v(sh, v, z1, z2, px, txt, x_ref, size=2.5):
    a = v.P(0, z1)[1]; b = v.P(0, z2)[1]
    sh.line(px, a, px, b, .25)
    for yy in (a, b):
        sh.line(px - .9, yy + .9, px + .9, yy - .9, .35)
        sh.line(x_ref, yy, px + (1.2 if px < x_ref else -1.2), yy, .15, '#555')
    sh.text(px - 1.0, (a + b) / 2, txt, size, anchor='middle', rot=-90)

def base(sh, v, opts=None):
    """墙、玻璃、柱、尺寸、正门标记。"""
    t = 0.20
    outline = [v.P(x, z) for x, z in POLY]
    sh.poly(outline, fill='#fff', c='none', sw=0)
    for r in [(-t, 0, 0, 7.875), (-t, 7.675, 9.15, 7.875), (8.95, 7.675, 9.15, 10.70), (10.70, 9.40, 10.90, 10.70), (10.70, 9.40, 19.425 + t, 9.60)]:
        wr(sh, v, *r)
    # 玻璃：细双线
    for dz in (-.06, .06):
        a = v.P(0.125, dz); b = v.P(19.425, dz); sh.line(a[0], a[1], b[0], b[1], .25, '#3a7ca5')
    for dx in (-.06, .06):
        a = v.P(19.425 + dx, 0); b = v.P(19.425 + dx, 9.40); sh.line(a[0], a[1], b[0], b[1], .25, '#3a7ca5')
    p = v.P(9.925, -0.9); sh.text(v.P(15.0,0)[0], v.P(15.0,0)[1] - 2.0, '采光玻璃面', 2.0, anchor='middle', fill='#3a7ca5')
    q = v.P(19.425 + .35, 4.7); sh.text(q[0] + 1.0, q[1], '采光玻璃面', 2.2, anchor='middle', fill='#3a7ca5', rot=90)
    # 入口门：在 z=10.70 留洞，画门扇
    a = v.P(10.70, 10.70); b = v.P(9.15, 10.70)
    sh.line(a[0], a[1], b[0], b[1], .5, '#000')
    sh.text((a[0] + b[0]) / 2, a[1] + 3.4, '入口门 1.55 (开启方向待定)', 2.2, anchor='middle')
    # 原柱
    for x0 in (8.65, 18.425):
        pa = v.P(x0, .5); pb = v.P(x0 + .5, 1.0)
        sh.rect(min(pa[0], pb[0]), min(pa[1], pb[1]), abs(pa[0] - pb[0]), abs(pa[1] - pb[1]), fill='url(#hatch)', c='#000', sw=.35)
    pc = v.P(8.9, 1.0); sh.text(pc[0], pc[1] + 2.6, '原柱', 1.9, anchor='middle')
    pc = v.P(18.675, 1.0); sh.text(pc[0], pc[1] + 2.6, '原柱', 1.9, anchor='middle')
    # 尺寸
    y0 = v.P(0, 0)[1]
    dim_h(sh, v, 0, 9.15, y0 - 8, '9.150', y0 - 1)
    dim_h(sh, v, 9.15, 10.70, y0 - 8, '1.550', y0 - 1)
    dim_h(sh, v, 10.70, 19.425, y0 - 8, '8.725', y0 - 1)
    dim_h(sh, v, 0, 19.425, y0 - 15, '总宽 19.425', y0 - 1)
    xl = v.P(19.425, 0)[0] - 7; xr = v.P(0, 0)[0] + 7
    dim_v(sh, v, 0, 9.40, xl, '进深 9.400', v.P(19.425, 0)[0])
    dim_v(sh, v, 0, 7.675, xr, '7.675', v.P(0, 0)[0])
    dim_v(sh, v, 0, 10.70, xr + 8, '10.700', v.P(0, 0)[0])
    dim_h(sh, v, 9.15, 10.70, v.P(0, 10.70)[1] + 8, '通道 1.550', v.P(0, 10.70)[1] + 1)
    # 正门标记
    cx, cy = v.P(9.925, 10.70)
    sh.arrow(cx, cy + 22, cx, cy + 12.5, .7, '#000', 2.6)
    sh.text(cx, cy + 26.5, '正门', 3.6, anchor='middle', bold=True)

# 夹层留空（不做楼板）：平台和第一跑顶部上方 + 第二跑上方
VOID = [(10.70, Z_F1[0]), (13.97, Z_F1[0]), (13.97, Z_F2[0]), (17.15, Z_F2[0]), (17.15, 9.40), (10.70, 9.40)]
MEZZ = [(10.70, 0), (19.425, 0), (19.425, 9.40), (17.15, 9.40), (17.15, Z_F2[0]), (13.97, Z_F2[0]), (13.97, Z_F1[0]), (10.70, Z_F1[0])]

def mezz_outline(sh, v, solid=False):
    c = '#000' if solid else '#666'
    sh.poly([v.P(*q) for q in MEZZ], fill='#f1f1ee' if solid else 'none', c=c, sw=.35 if solid else .25, dash=None if solid else '2 1')
    if solid:
        for (x1, z1), (x2, z2) in (((10.70, 0), (10.70, Z_F1[0])), ((10.70, Z_F1[0]), (13.97, Z_F1[0])), ((13.97, Z_F1[0]), (13.97, Z_F2[0])), ((13.97, Z_F2[0]), (17.15, Z_F2[0]))):
            a_ = v.P(x1, z1); b_ = v.P(x2, z2); sh.line(a_[0], a_[1], b_[0], b_[1], .9, '#444')
        pt = v.P(11.85, 8.50); sh.text(pt[0], pt[1], '留空（无楼板）', 2.2, anchor='middle', bold=True, fill='#444')
    pt = v.P(14.9, 0.45)
    sh.text(pt[0], pt[1], '夹层楼面 +4.100' if solid else '夹层楼面(+4.100)轮廓', 2.2, anchor='middle', fill='#555')

def stairs(sh, v, level):
    """两跑各宽 1.20，中间留缝 0.10；第一跑 18 级，第二跑 16 级；平台 2.20 × 2.50。"""
    def flight(z1, z2, solid, x_hi, treads):
        dash = None if solid else '1.6 1'; c = '#000' if solid else '#888'
        a = v.P(x_hi, z1); b = v.P(12.95, z2)
        sh.rect(min(a[0], b[0]), min(a[1], b[1]), abs(a[0] - b[0]), abs(a[1] - b[1]), c=c, sw=.3, dash=dash)
        for k in range(1, treads):
            x = 12.95 + k * .28
            p = v.P(x, z1); q = v.P(x, z2); sh.line(p[0], p[1], q[0], q[1], .15, c, dash)
    flight(Z_F1[0], Z_F1[1], level == '1F', 17.71, 17)
    flight(Z_F2[0], Z_F2[1], level == '2F', 17.15, 15)
    a = v.P(PLAT[2], PLAT[1]); b = v.P(PLAT[0], PLAT[3])
    sh.rect(min(a[0], b[0]), min(a[1], b[1]), abs(a[0] - b[0]), abs(a[1] - b[1]), c='#000' if level == '1F' else '#888', sw=.3, dash=None if level == '1F' else '1.6 1')
    pt = v.P(11.85, ZC1 - .19); sh.text(pt[0], pt[1], '中转平台 +2.100', 2.0, anchor='middle', fill='#555')
    if level == '1F':
        p = v.P(17.5, ZC1); q = v.P(13.2, ZC1); sh.arrow(p[0], p[1], q[0], q[1], .5, '#000', 2.0)
        sh.text((p[0] + q[0]) / 2, p[1] - 2.2, '上(第一跑 18 级)', 2.2, anchor='middle')
        pt = v.P(15.0, ZC2 + .10); sh.text(pt[0], pt[1], '第二跑(上方)', 2.0, anchor='middle', fill='#888')
    else:
        p = v.P(13.2, ZC2); q = v.P(16.9, ZC2); sh.arrow(p[0], p[1], q[0], q[1], .5, '#000', 2.0)
        sh.text((p[0] + q[0]) / 2, p[1] + 3.4, '上(第二跑 16 级，到夹层 +4.100)', 2.2, anchor='middle')
        pt = v.P(15.6, ZC1 + .10); sh.text(pt[0], pt[1], '第一跑(楼板下方)', 2.0, anchor='middle', fill='#888')

def shower(sh, v, dashed=False, detail=False):
    """淋浴间在中转平台正下方，外框 2.16 × 2.40；门在第二跑下方一侧。"""
    c = '#888' if dashed else '#000'
    d = '1.6 1' if dashed else None
    a = v.P(SHOWER[0], SHOWER[1]); b = v.P(SHOWER[2], SHOWER[3])
    x, y, w, h = min(a[0], b[0]), min(a[1], b[1]), abs(a[0] - b[0]), abs(a[1] - b[1])
    sh.rect(x, y, w, h, fill='url(#dots)' if (not dashed) else 'none', c=c, sw=.4, dash=d)
    g = v.L(.08)
    sh.rect(x + g, y + g, w - 2 * g, h - 2 * g, c=c, sw=.2, dash=d)
    p1 = v.P(SHOWER[2], SH_DOOR[0]); p2 = v.P(SHOWER[2], SH_DOOR[1])
    sh.line(p1[0], p1[1] + .1, p2[0], p2[1] - .1, 1.0, '#fff')
    q = v.P(SHOWER[2] + .90, SH_DOOR[0])
    sh.line(p1[0], p1[1], q[0], q[1], .3, c, '0.8 0.6')
    r = v.L(.90)
    sh.path('M%.2f,%.2f A%.2f,%.2f 0 0 0 %.2f,%.2f' % (q[0], q[1], r, r, p2[0], p2[1]), sw=.2, c=c, dash='0.8 0.6')

# ---------------------------------------------------------------- 既有设备：风管/消火栓
def existing_services(sh, v):
    pts = [(0.20, 4.05), (4.90, 4.05)]
    for k in range(1, 9):
        a = -math.pi / 2 + k * (math.pi / 2) / 8; pts.append((4.90 + 1.35 * math.cos(a), 5.40 + 1.35 * math.sin(a)))
    pts += [(6.25, 7.57), (5.40, 7.57), (5.40, 5.40)]
    for k in range(1, 9):
        a = 0 - k * (math.pi / 2) / 8; pts.append((4.90 + .5 * math.cos(a), 5.40 + .5 * math.sin(a)))
    pts += [(0.20, 4.90)]
    sh.poly([v.P(*p) for p in pts], c='#9aa', sw=.25, dash='2 1')
    a = v.P(5.63, 6.04); b = v.P(4.32, 7.42)
    sh.rect(min(a[0], b[0]), min(a[1], b[1]), abs(a[0] - b[0]), abs(a[1] - b[1]), c='#9aa', sw=.2, dash='1 .8')
    p = v.P(2.6, 4.45); sh.text(p[0], p[1], '既有风管(底约 +5.95，吊高)', 2.0, anchor='middle', fill='#789')
    a = v.P(0.062, 6.725); b = v.P(0.262, 7.475)
    sh.rect(min(a[0], b[0]), min(a[1], b[1]), abs(a[0] - b[0]), abs(a[1] - b[1]), fill='#e8c9c6', c='#a84039', sw=.3)
    p = v.P(0.9, 7.1); sh.text(p[0], p[1] + .8, '既有消火栓箱', 2.0, anchor='end', fill='#a84039')

def new_air(sh, v):
    a = v.P(7.4225, 7.275); b = v.P(1.7275, 7.615)
    sh.rect(min(a[0], b[0]), min(a[1], b[1]), abs(a[0] - b[0]), abs(a[1] - b[1]), c='#789', sw=.25, dash='1.6 1')
    for h in D['hvac']:
        if h['id'].startswith('V'):
            x, y = v.P(h['x'], 6.55); s_grille(sh, x, y, 8); sh.text(x, y - 2.0, h['id'] + '(示意位)', 2.0, anchor='middle')

# 高位主线槽：AL1 → 沿开放区后墙 → 绕墙角 → 入口短廊右墙 → 过门头 → 左墙（过道一侧、平台护栏外）
#   → (10.62, 6.70) → (10.85, 6.70)（避开留空角柱）→ 沿 x 10.85 到窗腰梁 z 1.20 → 夹层板底两根纵梁之间 → U 上引。
# 任何一段都不经楼梯、平台头顶。
TRUNK1 = [(8.54, 7.60), (9.24, 7.60), (9.24, 10.60), (10.62, 10.60), (10.62, 6.70), (10.85, 6.70), (10.85, 1.20), (U[0], 1.20), U]
JOG = (10.85, 6.70)                                  # 一楼各回路（WL2、WX2 等）出槽点
LEB = (13.10, 9.34)                                  # LEB 端子箱：淋浴门外、第二跑下方的后墙上
TRUNK_C = '#333'

def mezz_extras(sh, v):
    """夹层图补画：短边靠楼梯出口一段的实墙、被楼面填色盖住的原柱。"""
    wr(sh, v, 19.425, 6.85, 19.625, 9.40)
    q = v.P(19.425 + .35, 8.1); sh.text(q[0] - 3.2, q[1], '实墙', 1.9, anchor='middle', fill='#333', rot=90)
    pa = v.P(18.425, .5); pb = v.P(18.925, 1.0)
    sh.rect(min(pa[0], pb[0]), min(pa[1], pb[1]), abs(pa[0] - pb[0]), abs(pa[1] - pb[1]), fill='url(#hatch)', c='#000', sw=.35)
    pc = v.P(18.675, .5); sh.text(pc[0], pc[1] - 1.0, '原柱', 1.9, anchor='middle')

# 监控点位（2026-11-23 业主确认）：PoE 网络摄像机，每点一根网线供电兼传输，汇至 AL1 旁 PoE 录像机 NVR
CAM_C = '#c0392b'
CAMS = {'一楼': [('C1', 9.20, 0.75, 90, '主过道 + 入户门'), ('C2', 8.60, 0.75, 145, '公共办公区'),
                 ('C4', 18.40, 0.75, 180, '健身 / 茶桌区'), ('C5', 10.78, 6.72, 0, '楼梯过道')],
        '二楼': [('C6', 19.33, 6.85, 135, '楼梯通道（俯拍）')]}
NVR = (7.70, 7.555)
def s_camera(sh, v, cid, x, z, aim, note):
    import math
    px, py = v.P(x, z)
    a = math.radians(aim); ex, ey = v.P(x + math.cos(a) * 1.1, z + math.sin(a) * 1.1)
    l0, l1 = v.P(x + math.cos(a - .55) * .8, z + math.sin(a - .55) * .8), v.P(x + math.cos(a + .55) * .8, z + math.sin(a + .55) * .8)
    sh.line(px, py, l0[0], l0[1], .3, CAM_C); sh.line(px, py, l1[0], l1[1], .3, CAM_C); sh.line(px, py, ex, ey, .25, CAM_C, dash='1 .6')
    sh.circle(px, py, 1.6, '#fff', CAM_C, .45)
    sh.text(px, py + .75, cid, 1.7, anchor='middle', bold=True, fill=CAM_C)
NET_C = '#1565c0'
NETS = {'一楼': [('N1', 2.15, 0.06), ('N2', 5.90, 0.06), ('N5', 12.95, 0.10)], '二楼': [('N3', 18.395, 0.62), ('N4', 18.395, 0.88)]}   # N1、N2 与 S16、S17 同盒，图上错开示意
RD = (6.90, 7.555)
def s_net(sh, v, nid, x, z):
    px, py = v.P(x, z)
    sh.rect(px - 1.4, py - 1.4, 2.8, 2.8, fill='#fff', c=NET_C, sw=.45)
    sh.text(px, py + .7, 'N', 1.6, anchor='middle', bold=True, fill=NET_C)
    sh.text(px, py + 4.6, nid, 1.7, anchor='middle', fill=NET_C)
def net_cable(sh, v, pts):
    wire(sh, v, pts, NET_C, w=.3, dash='1.6 .6 .4 .6', tick=0)
def cam_cable(sh, v, pts):
    wire(sh, v, pts, CAM_C, w=.3, dash='.8 .6', tick=0)
def mark(sh, v, x, z, txt, dx=0, dy=5.5, anchor='middle'):
    px, py = v.P(x, z)
    sh.rect(px - 1.3, py - 1.3, 2.6, 2.6, fill='#fff', c='#000', sw=.4); sh.line(px - 1.3, py - 1.3, px + 1.3, py + 1.3, .25)
    sh.text(px + dx, py + dy, txt, 1.9, anchor=anchor)

# ---------------------------------------------------------------- 公共：右栏、说明
def notes_block(sh, x, y, w, lines, title='说 明', size=2.4):
    sh.text(x, y, title, 3.2, bold=True); sh.line(x, y + 1.4, x + w, y + 1.4, .4)
    y += 5.2
    for i, s in enumerate(lines):
        yy = y
        wl = wrap(s, size, w - 6)
        sh.text(x, y, '%d.' % (i + 1), size)
        for ln in wl:
            sh.text(x + 5, y, ln, size); y += size * 1.3 + .45
        y += .5
    return y

def orient_note(sh, v):
    x, y = v.P(19.425, 0)
    sh.text(x - 5, 17, '图纸方向：正门在图下方；站在门外向里看，夹层和楼梯在左侧（x 轴反向）。指北方向待现场核实。', 2.4)
    sh.text(x - 5, 21, '空调位置待暖通确定。', 2.4, bold=True)

def light_table(sh, x, y, w, rows):
    sh.text(x, y, '灯具与开关对应表', 3.0, bold=True); sh.line(x, y + 1.4, x + w, y + 1.4, .4)
    y += 5
    cols = [0, 20, 34, 48]
    for c, t in zip(cols, ['灯号', '标高', '回路', '开关联']): sh.text(x + c, y, t, 2.3, bold=True)
    y += 1.0; sh.line(x, y, x + w, y, .2); y += 3.0
    for r in rows:
        for c, t in zip(cols, r): sh.text(x + c, y, t, 2.2)
        y += 3.4
    return y

def lamp_rows(ids):
    # 合并连续同属性的行
    rows = []
    for i in ids:
        l = LIGHT[i]; rows.append((l['id'], '%.2f' % l['elevationM'], l['circuit'], '%s%s' % (l['switchId'], l['switchGang'])))
    return rows

def lamp_label(sh, x, y, l, anchor='middle', size=2.1):
    sh.text(x, y, '%s·%s%s' % (l['id'], l['switchId'], l['switchGang']), size, anchor=anchor)

# ================================================================ E-01 / E-03 照明
def sheet_lighting(floor):
    sh = Sheet(); v = View(258, 36)
    first = floor == '一楼'
    frame(sh, '一层照明平面图' if first else '夹层照明平面图', 'E-01' if first else 'E-03', '1:100')
    base(sh, v); orient_note(sh, v)
    if first:
        mezz_outline(sh, v, False); stairs(sh, v, '1F'); shower(sh, v); existing_services(sh, v); new_air(sh, v)
        sh.text(*v.P(4.5, 3.6), '开放办公区（通高，无夹层）', 2.8, anchor='middle', fill='#555')
        sh.text(*v.P(15.0, 5.2), '夹层下方：吧台/健身区', 2.6, anchor='middle', fill='#555')
        # 窗腰梁带
        a = v.P(0, .25); b = v.P(19.175, .90)
        sh.rect(b[0], a[1], a[0] - b[0], b[1] - a[1], fill='#ececec', c='#aaa', sw=.2, dash='1 1')
        s_ac(sh, *v.P(15.88, 3.05), 8.7); p = v.P(15.88, 3.05); sh.text(p[0], p[1] + 6.4, 'AC01 吸顶机(夹层下) 电源预留', 2.0, anchor='middle')
        # 回路线：全部沿实墙、梁、柱明敷，不埋地
        wl = lambda k, pts, **kw: wire(sh, v, pts, COL[k], **kw)
        wire(sh, v, TRUNK1, TRUNK_C, w=.7, tick=0)
        wl('WL1', [(8.15, 7.495), (8.15, 7.40), (0.30, 7.40), (0.30, 1.10), (8.2, 1.10)], tickat=1)
        wl('WL2', [JOG, (10.85, 1.10), (17.95, 1.10), (17.95, 8.275)], tickat=1)
        wl('WL2', [(10.85, 1.10), (9.30, 1.10), (9.30, .75)], tick=0)
        for i in ('L01', 'L02', 'L03'):
            x = LIGHT[i]['x']; wire(sh, v, [(x, 1.10), (x, 0.97)], COL['WL1'], tick=0, w=.3)
        for i in ('L04', 'L05'):
            x = LIGHT[i]['x']; wire(sh, v, [(x, 7.40), (x, 7.50)], COL['WL1'], tick=0, w=.3)
        wire(sh, v, [(LIGHT['L06']['x'], 7.40), (LIGHT['L06']['x'], 6.95)], COL['WL1'], tick=0, w=.3)
        for i in ('L07', 'L08', 'L09'):
            wire(sh, v, [(LIGHT[i]['x'], 1.10), (LIGHT[i]['x'], .97)], COL['WL2'], tick=0, w=.3)
        for i in ('L10', 'L11', 'L12'):
            wire(sh, v, [(17.95, LIGHT[i]['z']), (18.43, LIGHT[i]['z'])], COL['WL2'], tick=0, w=.3)
        c0 = v.P(*U); sh.circle(c0[0], c0[1], 1.3, '#fff', '#000', .4); sh.line(c0[0] - 1, c0[1] - 1, c0[0] + 1, c0[1] + 1, .3)
        sh.text(c0[0], c0[1] + 6.0, 'U 上引点：WL3、WL4（见 E-03）', 1.9, anchor='middle')
        t0 = v.P(9.24, 9.1); sh.text(t0[0] - 1.6, t0[1], '高位主线槽', 1.9, anchor='middle', rot=-90, fill=TRUNK_C)
        for i in ('L01', 'L02', 'L03', 'L07', 'L08', 'L09'):
            l = LIGHT[i]; x, y = v.P(l['x'], 0.97); s_linear(sh, x, y); sh.text(x, v.P(0, .55)[1] + .8, '%s·%s%s' % (i, l['switchId'], l['switchGang']), 2.0, anchor='middle')
        sh.text(*v.P(1.4, 1.78), 'U 顶梁灯 标高 7.94（位置与 L 同 x，错开画）', 2.0, anchor='start', fill='#555') if False else None
        for i in ('L04', 'L05'):
            l = LIGHT[i]; x, y = v.P(l['x'], 7.568); s_linear(sh, x, y); sh.text(x, y - 2.3, '%s·%s%s' % (i, l['switchId'], l['switchGang']), 2.0, anchor='middle')
        l = LIGHT['L06']; x, y = v.P(l['x'], 6.88); s_linear(sh, x, y); sh.text(x + 4.2, y + .8, 'L06·K1f', 2.0, anchor='start')
        for i in ('L10', 'L11', 'L12'):
            l = LIGHT[i]; x, y = v.P(l['x'], l['z']); s_linear(sh, x, y, vertical=True); sh.text(x - 2.2, y, '%s·%s%s' % (i, l['switchId'], l['switchGang']), 2.0, anchor='middle', rot=-90)
        for i in ('L13', 'L14'):
            l = LIGHT[i]; x, y = v.P(l['x'], l['z']); s_linear(sh, x, y); sh.text(x + (3.5 if i == 'L13' else 0), y + 8.0, '%s·K2a' % i, 2.0, anchor='end' if i == 'L13' else 'middle'); sh.line(x, y + 1.0, x, y + 6.0, .12, '#777')
        # 配电箱
        x, y = v.P(8.25, 7.555); s_board(sh, x, y); sh.text(x + 1.0, y + 8.2, 'AL1 总配电箱(墙内侧)', 2.4, bold=True, anchor='start')
        sh.line(x, y + 1, x, y + 6.5, .15, '#555')
        # 开关
        for kid in ('K1', 'K2', 'K3'):
            sw_ = SW[kid]; x, y = v.P(sw_['x'], sw_['z'])
            dual = any(g['control'] == '双控' for g in sw_['gangs'])
            s_switch(sh, x, y, sw_['wallNormal'], sw_['gangCount'], dual)
            if kid == 'K1': sh.text(x - 9.0, y + 6.5, 'K1 六联：L01~L06 每盏一联', 2.1, anchor='end', bold=True)
            if kid == 'K2': sh.text(x - 9.0, y + 6.5, 'K2 单联双控：楼梯灯', 2.1, anchor='end', bold=True)
            if kid == 'K3': sh.text(v.P(9.925, 0)[0], y + 6.0, 'K3 单联(柱上)', 2.1, anchor='middle')
        sh.text(*v.P(10.0, 10.25), '', 2)
        rows = lamp_rows(['L01', 'L02', 'L03', 'L04', 'L05', 'L06', 'L07', 'L08', 'L09', 'L10', 'L11', 'L12', 'L13', 'L14'])
        # 合并展示
        rows = [('L01~L03', '3.57', 'WL1', 'K1a/b/c 各一联'), ('L04~L06', '3.57', 'WL1', 'K1d/e/f 各一联'),
                ('L07~L12', '3.57', 'WL2', 'K3a'), ('L13,L14', '5.20', 'WL3', 'K2a 双控')]
        items = [
            (lambda s, x, y: s_linear(s, x, y), '线形灯 0.70 m；符号旁 L01·K1a = 灯号·开关联'),
            (lambda s, x, y: s_switch(s, x - 3, y, [-1, 0], 1, False), '单联单控开关 ●+斜线，短横线数=联数，距地 1.3 m'),
            (lambda s, x, y: s_switch(s, x - 3, y, [-1, 0], 1, True), '双控开关：斜线端部带 Y 形叉；用于楼梯灯，一楼 K2 与二楼 K4b 配对'),
            (lambda s, x, y: s_board(s, x, y), '配电箱（AL1 总箱）'),
            (lg_line(COL['WL1'], n=3), '照明回路线(各回路用不同颜色)，沿墙、梁明敷；短斜线=导线根数，以电工设计为准'),
            (lg_line(TRUNK_C, w=.7), '高位主线槽（夹层下约 3.55，经过道一侧转向，不经楼梯、平台上方）：多回路同槽，各自独立回 AL1'),
            (lambda s, x, y: s_ac(s, x, y, 5), '吸顶式空调(电源预留，位置待暖通确定)'),
        (lambda s, x, y: (s.circle(x, y, 1.6, '#fff', CAM_C, .45), s.text(x, y + .75, 'C', 1.7, anchor='middle', bold=True, fill=CAM_C)), '监控摄像机（PoE，网线供电，点划线为网线走向，汇至 AL1 旁 NVR）'),
        (lambda s, x, y: (s.rect(x - 1.4, y - 1.4, 2.8, 2.8, '#fff', NET_C, .45), s.text(x, y + .7, 'N', 1.6, anchor='middle', bold=True, fill=NET_C)), '网络信息口（六类，RJ45），点划线为网线走向，汇至弱电箱 RD'),
            (lambda s, x, y: s_grille(s, x, y, 7), '送风口(V01，无电气负荷)'),
            (lambda s, x, y: (s.rect(x - 5, y - 1.5, 10, 3, fill='#c9c9c9', c='#555', sw=.2)), '实墙(灰色填充)'),
            (lambda s, x, y: (s.line(x - 5, y - .6, x + 5, y - .6, .25, '#3a7ca5'), s.line(x - 5, y + .6, x + 5, y + .6, .25, '#3a7ca5')), '采光玻璃面(细双线)'),
            (lambda s, x, y: s.rect(x - 4, y - 2, 8, 4, c='#666', sw=.25, dash='2 1'), '夹层轮廓(下层图中的虚线)'),
        ]
        y = legend(sh, 296, 20, 112, items)
        light_table(sh, 296, y + 3, 112, rows)
        notes = [
            '灯具安装：线形灯装在窗腰梁室内侧或后墙上，灯具中心标高 3.57（距一楼地面 3.72 m）；灯具外廓顶 3.654，在夹层钢结构底(+3.710)以下，不与钢梁、贴边槽钢相碰；楼梯上方的 L13、L14 装在后墙上，标高 5.20。开放区顶梁不设灯；淋浴间不设灯、不设插座。',
            '开关均距地 1.3 m。K1、K2 并排装在进门左手侧墙上：K1 六联（两块三联面板），开放办公区 L01~L06 每盏一联；K2 单联双控，管楼梯灯 L13、L14、L15。K3 在主过道旁原柱朝通道面，管夹层下 L07~L12，明装线盒，不得剔凿柱身。入户门开启方向确定后，开关须在门扇不遮挡的一侧。',
            '楼梯灯双控：一楼 K2 与二楼 K4b 配对，上下楼都能开关；两根联络线随高位主线槽敷设，在后墙东端上引点 U(%.2f, %.2f) 处贴墙穿夹层楼板上引（防火封堵），在 U 上引后沿后墙踢脚线槽往西 0.63 m 接 K4（b 联）。' % U,
            '线路不埋地：一楼完成面即结构板面，不得开槽。高位主线槽在夹层下用吊架贴钢结构底（标高约 3.55）；入口短廊一段上方无钢梁，用墙面支架固定，标高不变；过入户门门头后沿 x 10.62 在过道一侧、平台护栏外转到 (10.85, 6.70)（避开留空角柱），再沿 x 10.85 到窗腰梁一侧(z 1.20)，横向到 (18.20, 1.20)，转向后墙在夹层板下两根纵梁之间吊装，到 U 上引；任何线槽不得从楼梯、平台头顶穿过。WL1 沿开放区后墙、端墙和窗腰梁明敷；WL2 自 AL1 进高位主线槽，在 (10.85, 6.70) 出槽，沿夹层边梁和窗腰梁敷设；WL3 随主线槽至 U 上引。K1 的 6 根控制线随主线槽往返。',
            '楼梯上方不做楼板，L13、L14 标高 5.20（灯底约 5.12），高出中转平台 3.02 m，第二跑在灯下最高踏面约 +2.89，净空约 2.22 m，不碰头；其供电线槽自 U 沿后墙升到 +6.40，在 +6.40 明装往西，高出第二跑最高处踏面(+4.100) 2.30 m；换灯须从夹层楼面或搭架作业。',
            '应急照明和疏散指示的位置见 A-01，电源为 WE1 回路（不经开关），见 E-05。导线规格、断路器、接线盒位置由持证电工确定。',
        ]
        notes_block(sh, 12, 180, 200, notes)
    else:
        mezz_outline(sh, v, True); mezz_extras(sh, v); stairs(sh, v, '2F'); shower(sh, v, dashed=True)
        sh.text(*v.P(4.5, 3.6), '一层开放办公区上空（通高，无楼面）', 2.8, anchor='middle', fill='#555')
        sh.text(*v.P(15.0, 2.9), '二楼办公区', 2.8, anchor='middle', fill='#555')
        pass
        s_ac(sh, *v.P(15.88, 4.40), 8.7); p = v.P(15.88, 4.40); sh.text(p[0], p[1] + 6.4, 'AC02 吸顶机(夹层上) 电源预留', 2.0, anchor='middle')
        a = v.P(0, .25); b = v.P(19.175, .90)
        sh.rect(b[0], a[1], a[0] - b[0], b[1] - a[1], fill='#e4e4e0', c='#aaa', sw=.2, dash='1 1')
        # 灯
        wire(sh, v, [(U[0], ZW), (18.90, ZW), (18.90, 1.05), (11.15, 1.05)], COL['WL4'], tickat=1)
        for i in ('L16', 'L17', 'L18'):
            x0 = LIGHT[i]['x']
            x, y = v.P(x0, 0.97); s_linear(sh, x, y); sh.text(x + 4.2, y + .8, '%s·K4a' % i, 2.1, anchor='start')
        wire(sh, v, [(U[0], ZW), (19.08, ZW), (19.08, ZC2)], COL['WL3'], dash='2 1', tick=0)
        wire(sh, v, [(U[0], ZW + .05), (LIGHT['L13']['x'], ZW + .05)], COL['WL3'], dash='4 1.2 .6 1.2', tick=0)
        K4X = SW['K4']['x']
        wire(sh, v, [(U[0], ZW), (K4X, ZW)], COL['WL4'], tick=0)                       # U → K4：WL4（a 联）
        wire(sh, v, [(U[0], ZW - .07), (K4X, ZW - .07)], COL['WL3'], dash='2 1', tick=0)   # U → K4：双控联络线（b 联）
        kq = v.P((U[0] + K4X) / 2, ZW); sh.text(kq[0], kq[1] - 3.3, '至 K4 0.63 m', 1.8, anchor='middle', fill='#333')
        c0 = v.P(*U); sh.circle(c0[0], c0[1], 1.3, '#fff', '#000', .4)
        sh.text(c0[0] + 2.2, c0[1] + 6.0, 'U 上引点：WL3、WL4（防火封堵）', 1.9, anchor='start')
        t1 = v.P(14.2, 10.65); sh.text(t1[0], t1[1], 'WL3 灯线槽：U 升至 +6.40，沿后墙往西至 L13', 1.9, anchor='middle', fill=COL['WL3'])
        for i in ('L13', 'L14'):
            l = LIGHT[i]; x, y = v.P(l['x'], l['z']); s_linear(sh, x, y, ghost=True, col='#777'); sh.text(x - (2.0 if i == 'L13' else 0), y + 8.0, '%s(标高5.20)' % i, 1.9, anchor='end' if i == 'L13' else 'middle', fill='#777')
        l = LIGHT['L15']; x, y = v.P(l['x'], l['z']); s_linear(sh, x, y); sh.text(x - 14.0, y + 1.0, 'L15·K4b 标高7.94', 2.1, anchor='end', bold=True); sh.line(x, y + 1.0, x, y + 9.0, .12, '#555')
        pass
        for kid in ('K4',):
            s = SW[kid]; x, y = v.P(s['x'], s['z'])
            dual = any(g['control'] == '双控' for g in s['gangs'])
            s_switch(sh, x, y, s['wallNormal'], s['gangCount'], dual)
        x4, y4 = v.P(SW['K4']['x'], SW['K4']['z'])
        sh.text(x4, y4 - 7.0, 'K4', 2.4, anchor='middle', bold=True)
        pass
        items = [
            (lambda s, x, y: s_linear(s, x, y), '线形灯 0.70 m；灯号·开关联'),
            (lambda s, x, y: s_linear(s, x, y, ghost=True, col='#777'), '虚线灯：楼梯上方后墙灯 L13、L14，标高 5.20，回路见 E-01'),
            (lambda s, x, y: s_switch(s, x - 3, y, [-1, 0], 2, True), '二联开关：a 单控、b 双控（斜线端 Y 形叉=含双控联），距地 1.3 m'),
            (lg_line(COL['WL4'], n=3), '二楼照明回路 WL4：自一楼 AL1 在 U 上引，沿后墙、端墙到顶梁，再沿顶梁敷设'),
            (lg_line(COL['WL3'], dash='2 1'), 'WL3 楼梯灯回路及双控联络线，自一楼在 U 上引(虚线)；L13、L14 段在 +6.40 沿后墙明装(点划线)'),
            (lambda s, x, y: s_ac(s, x, y, 5), '吸顶式空调(电源预留，位置待暖通确定)'),
            (lambda s, x, y: (s.rect(x - 5, y - 1.5, 10, 3, fill='#c9c9c9', c='#555', sw=.2)), '实墙(灰色填充)'),
            (lambda s, x, y: (s.rect(x - 5, y - 2.2, 10, 4.4, c='#000', sw=.35), s.line(x - 5, y - 2.2, x + 5, y + 2.2, .2, '#666'), s.line(x - 5, y + 2.2, x + 5, y - 2.2, .2, '#666')), '留空范围（无楼板），边缘粗线=护栏'),
            (lambda s, x, y: s.rect(x - 4, y - 2, 8, 4, c='#888', sw=.25, dash='1.6 1'), '下层(一楼)轮廓：楼梯、平台、淋浴间，细虚线'),
        ]
        y = legend(sh, 296, 20, 112, items)
        rows = [('L16~L18', '7.94', 'WL4', 'K4a'), ('L13,L14', '5.20', 'WL3', 'K4b 双控'), ('L15', '7.94', 'WL3', 'K4b 双控')]
        light_table(sh, 296, y + 3, 112, rows)
        notes = [
            '二楼办公区设 L16~L18 三盏顶梁灯（标高 7.94，距夹层楼面 3.84 m），三盏共用 K4 的 a 联。二楼不另加灯。',
            '楼梯灯共 3 盏：L13、L14 装在楼梯上方的后墙上(标高 5.20)，L15 装在走出楼梯正对的端墙上，位于楼梯出口宽度正中(z=%.2f)，标高 7.94，选漫射型灯具。' % ZC2,
            'K4：楼梯出口外 0.42 m 的后墙，距地 1.3 m(标高 5.40)，二联：a=L16~L18，b=楼梯灯双控，与一楼 K2 配对。',
            '夹层楼面为现浇层，浇筑后不得开槽；线路沿墙明装线槽。夹层不设配电箱，WL4 由一楼总箱 AL1 经高位主线槽送到后墙东端上引点 U(%.2f, %.2f)，在 U 贴墙穿夹层楼板上引（防火封堵），在 U 上引后沿后墙踢脚线槽往西 0.63 m 接 K4（a 联 WL4、b 联双控联络线）；WL4 再自 U 往东沿后墙、端墙上引到顶梁；WL3 和双控联络线也在 U 上引：L15 自 U 沿后墙、端墙明装到 (19.08, %.2f)；L13、L14 自 U 沿后墙升到 +6.40，在 +6.40 沿后墙明装线槽往西到 L13，在 L14、L13 处下垂接灯，线槽高出第二跑最高处踏面(+4.100) 2.30 m，不碰头。楼梯留空上方除这一条灯线槽外，不设其他线槽。' % (U[0], U[1], ZC2),
            '短边靠楼梯出口一段(z 6.85~9.40)按实墙绘制，L15 和 S14 装在这段墙上；安装前现场核实，若实际为玻璃须另定位置。',
            '一楼窗腰梁灯 L07~L12 标高 3.57，在夹层钢结构底(+3.710)以下，归一楼 K3 控制，不画在本图。导线规格、断路器由持证电工确定。',
        ]
        notes_block(sh, 12, 180, 200, notes)
    sh.save('E-01_一层照明平面图.svg' if first else 'E-03_夹层照明平面图.svg')

# ================================================================ E-02 / E-04 插座
def sheet_sockets(floor):
    sh = Sheet(); v = View(258, 36)
    first = floor == '一楼'
    frame(sh, '一层插座平面图' if first else '夹层插座平面图', 'E-02' if first else 'E-04', '1:100')
    base(sh, v); orient_note(sh, v)
    socks = [s for s in D['sockets'] if s['floor'] == floor]
    if first:
        mezz_outline(sh, v, False); stairs(sh, v, '1F'); shower(sh, v); existing_services(sh, v)
        s_ac(sh, *v.P(15.88, 3.05), 8.7); p = v.P(15.88, 3.05); sh.text(p[0], p[1] + 6.4, 'AC01 电源预留(WK1)', 2.0, anchor='middle')
        w = lambda k, pts, **kw: wire(sh, v, pts, COL[k], dash='2.2 1', **kw)
        wire(sh, v, TRUNK1, TRUNK_C, w=.7, tick=0)
        w('WX1', [(8.25, 7.495), (8.25, 7.40), (0.30, 7.40), (0.30, 1.10), (8.60, 1.10)], tickat=2)
        for x in (1.4, 4.0, 6.6): wire(sh, v, [(x, 7.40), (x, 7.50)], COL['WX1'], tick=0, w=.3)
        for z in (3.15, 5.40): wire(sh, v, [(.30, z), (.15, z)], COL['WX1'], tick=0, w=.3)
        w('WX2', [JOG, (10.85, 1.20), (18.30, 1.20), (18.30, .80)], tickat=1)
        circ = v.P(*U); sh.circle(circ[0], circ[1], 1.3, '#fff', '#000', .4); sh.line(circ[0] - 1, circ[1] - 1, circ[0] + 1, circ[1] + 1, .3)
        sh.text(circ[0], circ[1] + 9.2, 'U 上引夹层：WL3、WL4、WX3、WX4、WK2', 1.9, anchor='middle')
        mark(sh, v, LEB[0], LEB[1], 'LEB')
        wire(sh, v, [LEB, (SHOWER[2], SH_DOOR[1])], '#2e7d32', w=.35, dash='1.2 .8', tick=0)
        lb = v.P(LEB[0], LEB[1]); sh.text(lb[0], lb[1] + 9.0, '联结线自淋浴间一侧低位敷设', 1.9, anchor='middle', fill='#2e7d32')
        t0 = v.P(9.24, 9.1); sh.text(t0[0] - 1.6, t0[1], '高位主线槽', 1.9, anchor='middle', rot=-90, fill=TRUNK_C)
        x, y = v.P(8.25, 7.555); s_board(sh, x, y); sh.text(x + 4.8, y - 1.2, 'AL1', 2.8, bold=True)
        # 监控网线：自 NVR 随高位主线槽、开放区后墙线槽到各点位
        nx, ny = v.P(*NVR); sh.rect(nx - 2.2, ny - 1.4, 4.4, 2.8, fill='#fff', c=CAM_C, sw=.4); sh.text(nx, ny + 5.4, 'NVR', 1.8, anchor='middle', fill=CAM_C, bold=True)
        cam_cable(sh, v, [NVR, (8.54, 7.62), (9.24, 7.62), (9.24, 10.62), (10.62, 10.62), (10.62, 6.70), (10.85, 6.70), (10.78, 6.72)])
        cam_cable(sh, v, [(10.85, 6.70), (10.85, 1.22), (9.20, 1.22), (9.20, 0.75)]); cam_cable(sh, v, [(9.20, 1.22), (8.60, 1.22), (8.60, 0.75)])
        cam_cable(sh, v, [(10.85, 1.22), (18.40, 1.22), (18.40, 0.75)]); cam_cable(sh, v, [(18.20, 1.22), (18.22, 9.30)])
        for c in CAMS['一楼']: s_camera(sh, v, *c)
        # 网络：弱电箱 RD（两条宽带进线、路由器、交换机、录像机）在 AL1 左侧；六类网线随线槽到各网络口
        rx, ry = v.P(*RD); sh.rect(rx - 2.8, ry - 1.6, 5.6, 3.2, fill='#e8f0fb', c=NET_C, sw=.5); sh.text(rx, ry + .7, 'RD', 1.7, anchor='middle', bold=True, fill=NET_C)
        sh.text(rx, ry - 3.2, '弱电箱 RD（两条宽带进线）', 1.7, anchor='middle', fill=NET_C)
        net_cable(sh, v, [(7.10, 7.50), (8.88, 7.50), (8.88, 1.08), (8.58, 1.08), (8.58, 0.06), (1.80, 0.06)])
        net_cable(sh, v, [(7.20, 7.50), (8.54, 7.56), (9.24, 7.56), (9.24, 10.56), (10.62, 10.56), (10.62, 6.66), (10.80, 6.66), (10.80, 1.16), (12.95, 1.16), (12.95, 0.10)])
        wire(sh, v, [(12.90, 1.20), (12.90, 0.10)], COL['WX2'], dash='2.2 1', tick=0)
        # 工位电源 WX5、WX6：自 AL1 与网线同走后墙、东侧墙踢脚线槽，绕原柱后进窗根贴地线槽（强弱电分隔），到两组桌下组合盒
        w('WX5', [(8.25, 7.495), (8.25, 7.44), (8.80, 7.44), (8.80, 1.14), (8.52, 1.14), (8.52, 0.14), (1.80, 0.14), (1.80, 0.06)], tickat=5)
        w('WX6', [(8.33, 7.495), (8.33, 7.47), (8.84, 7.47), (8.84, 1.11), (8.55, 1.11), (8.55, 0.10), (5.55, 0.10), (5.55, 0.06)], tickat=5)
        for n in NETS['一楼']: s_net(sh, v, *n)
    else:
        mezz_outline(sh, v, True); mezz_extras(sh, v); shower(sh, v, dashed=True); stairs(sh, v, '2F')
        s_ac(sh, *v.P(15.88, 4.40), 8.7); p = v.P(15.88, 4.40); sh.text(p[0], p[1] + 6.4, 'AC02 电源预留(WK2)', 2.0, anchor='middle')
        pass
        circ = v.P(*U); sh.circle(circ[0], circ[1], 1.3, '#fff', '#000', .4)
        sh.text(circ[0], circ[1] + 6.0, 'U 上引点：自一楼 AL1 上引 WX3、WX4、WK2', 1.9, anchor='middle')
        pass
        w = lambda k, pts, **kw: wire(sh, v, pts, COL[k], dash='2.2 1', **kw)
        wire(sh, v, [(U[0], ZW), (19.10, ZW), (19.10, 7.20)], TRUNK_C, w=.7, tick=0)
        wire(sh, v, [(U[0], ZW), (17.90, ZW)], TRUNK_C, w=.7, tick=0)
        w('WX3', [(U[0], ZW), (17.90, ZW)], tick=0)
        w('WX3', [(19.10, 7.20), (19.10, 1.03), (18.95, 1.03)], tickat=0)
        w('WX4', [(19.10, 7.32), (19.22, 7.32)], tick=0)
        cam_cable(sh, v, [(U[0] + .02, 9.30), (U[0] + .02, 9.25), (19.18, 9.25), (19.18, 6.85), (19.33, 6.85)])
        for c in CAMS['二楼']: s_camera(sh, v, *c)
        net_cable(sh, v, [(U[0] - .02, 9.30), (U[0] - .02, 9.20), (19.05, 9.20), (19.05, 1.10), (18.30, 1.10), (18.30, 0.75)])
        for n in NETS['二楼']: s_net(sh, v, *n)
    for s in socks:
        x, y = v.P(s['x'], s['z']); s_socket(sh, x, y, s['wallNormal'], s['type'].startswith('防溅'))
        if s['heightAboveFloorM'] == 0: sh.rect(x - 3.0, y - 3.0, 6.0, 6.0, c='#000', sw=.3)
        n = s['wallNormal']; dx, dy = -n[0], n[1]
        tx, ty = x + dx * 5.6, y + dy * 5.6 + 0.8
        sh.text(tx, ty, s['id'], 2.1, anchor='middle')
    items = [
        (lambda s, x, y: s_socket(s, x, y - .6, [0, 1]), '单相五孔插座（半圆，底线靠墙），距地 0.38 m；墙面暗装，柱面用明装线盒'),
        (lambda s, x, y: s_board(s, x, y), '配电箱 AL1（全户只设这一个，在一楼）'),
        (lg_line(COL['WX1'], '2.2 1', n=3), '插座回路(各用颜色)：沿实墙踢脚线明装线槽或梁下敷设，不埋地'),
        (lg_line(TRUNK_C, w=.7), '主线槽：多回路同槽，各回路独立回配电箱，不得在插座处并接'),
        (lambda s, x, y: (s.rect(x - 1.3, y - 1.3, 2.6, 2.6, '#fff', '#000', .4), s.line(x - 1.3, y - 1.3, x + 1.3, y + 1.3, .25)), 'LEB 局部等电位端子箱（接地联结，不是电源）'),
        (lambda s, x, y: s.circle(x, y, 1.3, '#fff', '#000', .4), '竖向上引点（一楼总箱 AL1 至夹层的回路）'),
        (lambda s, x, y: s_ac(s, x, y, 5), '空调电源预留点（一层 WK1、夹层 WK2，位置待暖通确定）'),
        (lambda s, x, y: (s.rect(x - 5, y - 1.5, 10, 3, fill='#c9c9c9', c='#555', sw=.2)), '实墙(灰色填充)'),
        (lambda s, x, y: (s.line(x - 5, y - .6, x + 5, y - .6, .25, '#3a7ca5'), s.line(x - 5, y + .6, x + 5, y + .6, .25, '#3a7ca5')), '采光玻璃面(细双线)'),
    ]
    y = legend(sh, 296, 20, 112, items)
    # 回路表
    sh.text(296, y + 3, '插座回路表', 3.0, bold=True); sh.line(296, y + 4.4, 408, y + 4.4, .4); yy = y + 8.5
    for c in D['circuits']:
        if c['type'] != '插座' or not any(l in [s['id'] for s in socks] for l in c['loads']): continue
        sh.text(296, yy, c['id'], 2.4, bold=True, fill=COL[c['id']]); sh.text(308, yy, c['name'], 2.3); yy += 3.4
        for ln in wrap('点位：' + '、'.join(c['loads']), 2.2, 100): sh.text(308, yy, ln, 2.2); yy += 3.0
        yy += 1.2
    if first:
        notes = [
            '网络：两条宽带进线入弱电箱 RD（AL1 左侧，内装光猫、双宽带口路由器、16 口交换机、PoE 录像机），入户位置待物业确认；一楼网络口 N1、N2 与工位电源 S16、S17 同盒（组合盒，强弱电分隔），在两组工位靠窗一端：网线自 RD 沿后墙、东侧墙踢脚线槽，绕窗边原柱后沿窗根贴地明装线槽到桌下，自线槽直接上桌子中缝走线槽，工位后方通道内不走线；窗根线槽高不超过 60 mm，卷帘下沿停在线槽上方；N5 与电视电源插座 S15 共用组合盒，装在会议桌靠窗一端的窗框竖梃上，线自高位主线槽沿竖梃下引，藏在电视背后。',
            '监控：共 5 个，一层 C1、C2、C4、C5，夹层 C6，均为 PoE 网络摄像机，柱面或墙面明装，离地约 3.0 m（C6 离夹层楼面 2.8 m，只拍楼梯），广角 2.8 mm；每点一根六类网线，随高位主线槽和墙面线槽敷设，汇至 AL1 旁 8 路 PoE 录像机（NVR），摄像机处不设插座，NVR 用 AL1 旁插座；淋浴间内不设摄像机。',
            '插座编号 S01~S17：一楼 S01~S10 及 S15~S17，夹层 S11~S14。一楼 13 个：WX1 八个（开放区后墙 S01~S03、主过道旁原柱三个柱面 S04~S06、端墙 S07、S08）、WX2 三个（另一根原柱相邻两个柱面 S09、S10，电视背后窗框竖梃 S15）；WX5、WX6 各一个工位电源组合盒 S16、S17（两组工位靠窗一端，窗根线槽上，与网络口 N1、N2 同盒，经桌子中缝走线槽接每位桌面电源模块）。墙面插座均为五孔插座（两孔加三孔），距地 0.38 m（电视背后 S15 为 0.60 m）。',
            '全户不设地面插座，线路不埋地（一楼完成面即结构板面，不得开槽）。WX1 沿开放区后墙、端墙的踢脚线明装线槽，再沿窗腰梁到原柱后贴柱下引；WX2 自 AL1 进高位主线槽，过入户门门头后在 (10.85, 6.70) 出槽，沿夹层边梁和窗腰梁到原柱下引。',
            '每个回路各自独立回 AL1，同槽不并接。插座不设开关，由 AL1 内各回路的断路器控制。柱面插座用明装线盒，不得剔凿柱身。',
            '淋浴间不接任何电源：不设灯、插座、热水器和排风扇，淋浴间内和地面内不得有电线管。只在夏季使用，用冷水。',
            'LEB：淋浴间做局部等电位联结，端子箱装在淋浴门外、第二跑下方的后墙上 (%.2f, %.2f)，一楼地面能够到；联结导线自淋浴间一侧低位敷设，不沿后墙高位走；联结金属给水管、地漏、淋浴间金属门框、上方钢平台和钢楼梯。' % LEB,
            '线径、断路器、漏电保护规格由持证电工确定。',
        ]
    else:
        notes = [
            '网络：二楼 N3、N4 两个网络口装在 U 型主办公桌包住的原柱西面、桌面以下；网线自弱电箱随高位主线槽到 U 上引，沿后墙、端墙线槽到原柱。',
            '监控 C6：装在短边端墙第一扇玻璃与实墙交接的竖框上，离夹层楼面 2.8 m，斜向俯拍楼梯（第二跑、出口和中转平台），夹层办公区不在画面内；网线自 U 上引后沿后墙、端墙线槽敷设至 C6。',
            '二楼设 4 个插座：WX3 三个，其中两个装在原混凝土柱相邻的两个柱面上（S11、S12），一个装在楼梯出口旁的后墙上（S13）；WX4 一个 S14，装在楼梯出口一侧的端墙上。不设地面插座。',
            '夹层楼面为现浇层，浇筑后不得开槽；线路沿墙明装线槽。夹层不设配电箱。WX3、WX4 由一楼总箱 AL1 经高位主线槽送到后墙东端上引点 U(%.2f, %.2f)，贴墙穿夹层楼板上引（防火封堵）；沿后墙和端墙的踢脚线明装线槽同槽敷设，各自独立回 AL1；S13 自 U 沿后墙往西接，位于 (17.90, 9.34)；WX3 再沿幕墙根部贴地明装线槽到原柱。楼梯留空上方不设线槽。' % U,
            '插座距夹层楼面 0.38 m；柱面插座用明装线盒，不得剔凿柱身。短边 z 6.85~9.40 一段按实墙绘制，安装前现场核实。',
            '回路穿夹层楼板处须防火封堵。AC02 电源 WK2 同样自 AL1 上引。插座不设开关，由 AL1 内各回路的断路器控制。线径、断路器、漏电保护规格由持证电工确定。',
        ]
    notes_block(sh, 12, 180, 200, notes)
    sh.save('E-02_一层插座平面图.svg' if first else 'E-04_夹层插座平面图.svg')

# ================================================================ E-05 系统图
def sheet_system():
    sh = Sheet(); frame(sh, '配电系统图', 'E-05', '无比例（单线示意）')
    sh.text(14, 19, '配电系统图（单线图）— 断路器规格、线径由持证电工确定', 3.6, bold=True)
    sh.text(14, 24, '本图只表达"箱—回路—负荷"的关系，不是施工图。', 2.4, fill='#555')
    busx = 52
    # 进线
    sh.line(busx, 30, busx, 46, .6)
    sh.text(busx + 3, 33, '电源进线：由物业/楼层电表箱引入，接入点待核', 2.4)
    sh.text(busx + 3, 37, '进线规格、总开关、电能计量：由持证电工确定', 2.4)
    bx, by = busx, 41
    sh.line(bx - 1.6, by - 1.6, bx + 1.6, by + 1.6, .5); sh.line(bx - 1.6, by + 1.6, bx + 1.6, by - 1.6, .5)
    sh.rect(14, 46, 262, 7, fill='#1f3b57', c='#000'); sh.text(18, 51, 'AL1 总配电箱（全户唯一配电箱；一楼，进门右手墙内侧，挂高 1.15~1.87）', 3.0, fill='#fff', bold=True)
    sh.text(285, 51, '', 2)
    # 表头
    hy = 59
    cols = [('回路号', 60), ('断路器', 80), ('线径', 108), ('保护', 130), ('用途', 156), ('负荷点 / 控制', 205)]
    for t, x in cols: sh.text(x, hy, t, 2.6, bold=True)
    sh.line(14, hy + 1.5, 290, hy + 1.5, .4)
    y = hy + 8

    def row(c, y, indent=0):
        col = COL.get(c['id'], '#000')
        sh.line(busx + indent, y - 1.0, busx + indent + 6, y - 1.0, .5, col) if False else None
        sh.line(busx, y - 1.0, 59, y - 1.0, .5, col)
        x = 54.5
        sh.line(x - 1.2, y - 2.2, x + 1.2, y + .2, .4, col); sh.line(x - 1.2, y + .2, x + 1.2, y - 2.2, .4, col)
        if c['rcd'].startswith('须'): sh.circle(x, y - 1.0, 2.0, 'none', col, .35)
        sh.text(60, y, c['id'], 2.7, bold=True, fill=col)
        sh.text(80, y, c['breaker'], 2.1); sh.text(108, y, c['cable'], 2.1)
        sh.text(130, y, '漏电保护' if c['rcd'].startswith('须') else '电工定', 2.1)
        sh.text(156, y, c['name'], 2.2)
        if c['type'] == '照明':
            ctl = '控制：' + '、'.join(c.get('controlledBy', []))
        else: ctl = ''
        loads = '、'.join(c['loads'])
        lines = wrap(loads + ('  ' + ctl if ctl else ''), 2.1, 85)
        yy = y
        for ln in lines[:2]: sh.text(205, yy, ln, 2.1); yy += 2.9
        return max(10.0, 2.9 * len(lines[:2]) + 4.5)
    last = y
    for c in [c for c in D['circuits'] if c['board'] == 'AL1']:
        h = row(c, y); y += h
        last = y
    sh.line(busx, 53, busx, y - 7.0, .6)
    items = [
        (lambda s, x, y: (s.line(x - 3, y - 2, x + 3, y + 2, .4), s.line(x - 3, y + 2, x + 3, y - 2, .4)), '断路器（线上画×）'),
        (lambda s, x, y: (s.line(x - 3, y - 2, x + 3, y + 2, .4), s.line(x - 3, y + 2, x + 3, y - 2, .4), s.circle(x, y, 3.2, 'none', '#000', .35)), '漏电断路器（×外加圆）'),
        (lambda s, x, y: s_board(s, x, y), '配电箱'),
        (lg_line('#1f6fb5', n=0), '回路线（各回路用颜色区分）'),
    ]
    legend(sh, 296, 20, 112, items)
    notes = [
        '断路器规格、导线截面、漏电保护动作电流、进线容量全部留空，由持证电工按实际负荷计算确定。',
        'WL1~WL4 照明；WX1~WX4 插座；WX5、WX6 一楼两组工位专用电源，各带 10 个工位；WK1、WK2 空调预留，每台一个回路。',
        'WE1 应急照明与疏散指示，不经开关。淋浴间不接任何电源（不设灯、插座、热水器和排风扇）。',
        '全户只设 AL1 一个配电箱，夹层不设分箱；夹层回路 WL4、WX3、WX4、WK2 由 AL1 经高位主线槽上引。灯由墙上开关控制，插座不设开关，由箱内各回路断路器控制。',
        '所有插座回路带漏电保护。各回路独立回箱，同槽不并接。',
        '楼梯灯回路 WL3 三盏(L13、L14、L15)：一楼 K2 与二楼 K4b 双控；开放办公区 L01~L06 由 K1 六联分别控制；二楼办公区 L16~L18 为 WL4，由 K4a 控制。',
        '淋浴间做局部等电位联结(LEB)，位置见 E-02。',
        '空调的型号和功率待定，确定后核定 AL1 进线容量；V01 是接自预留送风箱的送风口，无电气负荷。',
        'AL1 电源接入点待核。',
    ]
    notes_block(sh, 296, 62, 112, notes)
    sh.save('E-05_配电系统图.svg')

# ================================================================ 给排水
def seg_len(pts): return sum(math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]) for i in range(len(pts) - 1))
DRAIN = (11.10, 8.11); HEAD = (11.00, 7.41); PEN = (10.90, 8.11)
CLEAN = (10.50, DRAIN[1])                            # 清扫口（转向点）
DOORP = (9.925, 10.70)                               # 入户门中心
def main_x(z):                                       # 废水主管（清扫口 → 入户门）在 z 处的 x
    return CLEAN[0] + (DOORP[0] - CLEAN[0]) * (z - CLEAN[1]) / (DOORP[1] - CLEAN[1])
MAIN = [DRAIN, CLEAN, DOORP]
BASIN_C = (11.07, 8.86)                              # 洗手盆中心
BASIN_J = (main_x(9.16), 9.16)                       # 洗手盆支管汇入主管点（落在主管上）
BASIN = [BASIN_C, (10.62, BASIN_C[1]), BASIN_J]
JOINT = (10.72, 7.16)                                # 给水接点（待核）
LJOIN = 0.60 + math.hypot(CLEAN[0] - BASIN_J[0], BASIN_J[1] - CLEAN[1])
LMAIN = seg_len(MAIN); LBASIN = seg_len(BASIN)

def calc_rows():
    rows = []
    def mk(name, od, start_bottom, L, note):
        avail = (start_bottom + 0.150) * 1000
        n12 = L * 12; n25 = L * 25
        end12 = start_bottom - n12 / 1000.0
        ok = n12 <= avail + 1e-9
        rows.append(dict(name=name, od=od, L=L, n12=n12, n25=n25, avail=avail, startb=start_bottom, end12=end12, ok=ok, note=note))
    mk('De50，起点管底 -0.080', 'De50', -0.030 - 0.050, LMAIN, '')
    mk('De50，另计地漏本体 20', 'De50', -0.050 - 0.050, LMAIN, '')
    mk('改用 De75', 'De75', -0.030 - 0.075, LMAIN, '')
    return rows

def sheet_plumbing_plan():
    sh = Sheet(); v = View(258, 36)
    frame(sh, '给排水平面图（一层，含淋浴间放大图）', 'P-01', '1:100 / 放大图 1:50')
    base(sh, v); orient_note(sh, v)
    mezz_outline(sh, v, False)
    # 入口垫高区
    a = v.P(10.70, 7.675); b = v.P(9.15, 10.70)
    sh.rect(min(a[0], b[0]), min(a[1], b[1]), abs(a[0] - b[0]), abs(a[1] - b[1]), fill='url(#dots)', c='#555', sw=.2)
    stp = v.P(10.70, 7.675), v.P(9.15, 7.675)
    sh.line(stp[0][0], stp[0][1], stp[1][0], stp[1][1], 1.1, '#000')
    for k in range(5):
        xx = stp[1][0] + (stp[0][0] - stp[1][0]) * (k + .5) / 5
        sh.line(xx, stp[0][1] + .2, xx, stp[0][1] + 1.6, .25)
    def out(z, txt, tx, tz, bold=False):
        q = v.P(8.2, z); sh.text(q[0], q[1], txt, 2.1, anchor='start', bold=bold)
        r = v.P(tx, tz); sh.line(q[0] - .5, q[1] - .8, r[0], r[1], .15, '#666')
    out(8.45, '入口垫高 150，完成面 ±0.000（点填充区）', 10.0, 8.6, True)
    out(8.95, '台阶 150：z=7.675 线，上行 -0.150 → ±0.000', 9.9, 7.675)
    out(10.25, '废水主管 F De50，埋在垫高层，i≥0.012', main_x(9.2), 9.2)
    out(10.62, '备选(虚线圆)：(%.2f,%.2f)穿板至 17 楼顶' % PEN, PEN[0], PEN[1])
    stairs(sh, v, '1F')
    shower(sh, v)
    pt = v.P(11.85, 9.0); sh.text(pt[0], pt[1], '', 2)
    # 窗腰梁略
    # 管线
    wp = lambda pts, col, w=.7, dash=None: sh.poly([v.P(*p) for p in pts], c=col, sw=w, dash=dash, close=False)
    wp(MAIN + [], '#5a3d1a', .9, '3 1 .6 1')
    wp(BASIN, '#5a3d1a', .7, '3 1 .6 1')
    # 备选：穿板
    pass
    x, y = v.P(*PEN); sh.circle(x, y, 1.8, 'none', '#888', .4, '1 .8')
    # 地漏、花洒、洗手盆
    x, y = v.P(*DRAIN); sh.circle(x, y, 1.3, '#fff', '#000', .35); sh.line(x - .9, y - .9, x + .9, y + .9, .25); sh.line(x - .9, y + .9, x + .9, y - .9, .25)
    x, y = v.P(*HEAD); sh.circle(x, y, 1.1, '#fff', BLUE, .4); sh.circle(x, y, .4, BLUE, BLUE, .1)
    for cx_, cz_ in (CLEAN, (main_x(10.45), 10.45)):
        q = v.P(cx_, cz_); sh.rect(q[0] - .9, q[1] - .9, 1.8, 1.8, fill='#fff', c='#5a3d1a', sw=.35)
    a = v.P(BASIN_C[0] + .24, BASIN_C[1] + .18); b = v.P(BASIN_C[0] - .24, BASIN_C[1] - .18); sh.rect(min(a[0], b[0]), min(a[1], b[1]), abs(a[0] - b[0]), abs(a[1] - b[1]), fill='#fff', c='#000', sw=.3)
    # 给水：接点待核
    x, y = v.P(*JOINT); sh.poly([(x, y - 1.6), (x + 1.6, y), (x, y + 1.6), (x - 1.6, y)], fill='#fff', c=BLUE, sw=.4)
    sh.text(x + 3.0, y + .7, '给水接点(待核)', 2.0, anchor='start', fill=BLUE)
    wp([JOINT, (10.90, JOINT[1]), (10.90, HEAD[1]), (11.00, HEAD[1])], BLUE, .5)
    wp([(10.90, JOINT[1]), (10.90, BASIN_C[1] - .18)], BLUE, .5)
    # 立管
    x, y = v.P(10.98, 7.78)
    x, y = v.P(8.75, 9.475); sh.circle(x, y, 1.6, '#fff', '#000', .5); sh.circle(x, y, .5, '#000', '#000', .1)
    sh.text(x + 2.6, y + 1.0, 'YL-1 雨水立管', 2.1, anchor='start', bold=True); sh.text(x + 2.6, y + 3.8, '(既有，原建筑图标注，管径待核)', 1.9, anchor='start')
    # 门口接公共管井
    x, y = v.P(9.925, 10.70)
    sh.arrow(x, y, x, y + 8.5, .8, '#5a3d1a', 2.2)
    sh.text(x + 3, y + 11.0, '接公共管井', 2.6, anchor='start', bold=True)
    sh.text(x + 3, y + 14.2, '位置待物业/现场核实', 2.3, anchor='start')
    # 标注
    pl = v.P(11.57, 7.0); sh.text(pl[0] + 2.5, pl[1] - 2.0, '', 2)
    lab = v.P(9.5, 9.2)
    sh.text(*v.P(12.4, 9.95), '', 2)
    # 放大图 1:50
    v2 = View(590, -93, 20.0)
    sh.text(296, 20, '淋浴间放大图 1:50', 3.2, bold=True)
    sh.rect(296, 22, 112, 84, c='#999', sw=.2, dash='1 1')
    # 垫高层填充
    a = v2.P(9.20, 7.675); b = v2.P(10.70, 9.5)
    a2 = v2.P(10.70, 7.675); b2 = v2.P(9.20, 9.5)
    sh.rect(min(a2[0], b2[0]), min(a2[1], b2[1]), abs(a2[0] - b2[0]), abs(a2[1] - b2[1]), fill='url(#dots)', c='none')
    sh.text(*v2.P(10.05, 8.35), '入口短廊', 1.9, anchor='start', fill='#555'); sh.text(*v2.P(10.05, 8.52), '垫高 ±0.000', 1.9, anchor='start', fill='#555')
    shower(sh, v2)
    # 平台边线（上方）
    pa = v2.P(PLAT[2], PLAT[1]); pb = v2.P(PLAT[0], PLAT[3])
    sh.rect(min(pa[0], pb[0]), min(pa[1], pb[1]), abs(pa[0] - pb[0]), abs(pa[1] - pb[1]), c='#888', sw=.25, dash='1.6 1')
    sh.text(*v2.P(11.8, 9.38), '', 2)
    sh.text(v2.P(12.9, 9.58)[0], v2.P(12.9, 9.58)[1], '平台(上方)', 1.9, anchor='end', fill='#888')
    # 管线
    wp2 = lambda pts, col, w=.7, dash=None: sh.poly([v2.P(*p) for p in pts], c=col, sw=w, dash=dash, close=False)
    wp2([MAIN[0], MAIN[1], (main_x(9.50), 9.50)], '#5a3d1a', 1.0, '3 1 .6 1'); wp2(BASIN, '#5a3d1a', .8, '3 1 .6 1')
    a_ = v2.P(main_x(9.29), 9.29); b_ = v2.P(main_x(9.50), 9.50)
    sh.arrow(a_[0], a_[1], b_[0], b_[1], .8, '#5a3d1a', 2.4)
    sh.text(b_[0], b_[1] + 3.4, '↓ 去入户门 / 公共管井', 1.9, anchor='middle', fill='#5a3d1a')
    for cx_, cz_ in (CLEAN,):
        q = v2.P(cx_, cz_); sh.rect(q[0] - 1.3, q[1] - 1.3, 2.6, 2.6, fill='#fff', c='#5a3d1a', sw=.4)
    x, y = v2.P(*PEN); sh.circle(x, y, 2.6, 'none', '#888', .4, '1 .8')
    # 给水
    wp2([JOINT, (10.90, JOINT[1]), (10.90, HEAD[1]), (11.00, HEAD[1])], BLUE, .6); wp2([(10.90, JOINT[1]), (10.90, BASIN_C[1] - .18)], BLUE, .6)
    x, y = v2.P(*JOINT); sh.poly([(x, y - 1.8), (x + 1.8, y), (x, y + 1.8), (x - 1.8, y)], fill='#fff', c=BLUE, sw=.4)
    # 设备
    x, y = v2.P(*DRAIN); sh.circle(x, y, 2.0, '#fff', '#000', .4); sh.line(x - 1.4, y - 1.4, x + 1.4, y + 1.4, .3); sh.line(x - 1.4, y + 1.4, x + 1.4, y - 1.4, .3)
    x, y = v2.P(*HEAD); sh.circle(x, y, 1.6, '#fff', BLUE, .5); sh.circle(x, y, .5, BLUE, BLUE, .1)
    a = v2.P(BASIN_C[0] + .24, BASIN_C[1] + .18); b = v2.P(BASIN_C[0] - .24, BASIN_C[1] - .18); sh.rect(min(a[0], b[0]), min(a[1], b[1]), abs(a[0] - b[0]), abs(a[1] - b[1]), fill='#fff', c='#000', sw=.4)
    sh.circle(*v2.P(*BASIN_C), 2.6, '#fff', '#000', .3)
    sh.circle(*v2.P(*BASIN_C), .5, '#000', '#000', .1)
    # 编号标注（正文见右栏编号表）
    keys = []
    def call(n, wx, wz, dx, dy, text):
        x, y = v2.P(wx, wz)
        sh.line(x, y, x + dx, y + dy, .15, '#555')
        sh.circle(x + dx, y + dy, 1.5, '#fff', '#000', .25); sh.text(x + dx, y + dy + .7, str(n), 1.9, anchor='middle', bold=True)
        keys.append((n, text))
    call(1, DRAIN[0], DRAIN[1], -5.0, 4.5, '薄型侧排地漏 De50，水封≥50，本体高度按样本')
    call(2, HEAD[0], HEAD[1], -7.0, -2.0, '花洒(淋浴器)，立柱式或顶挂')
    call(3, JOINT[0], JOINT[1], 3.5, -5.0, '给水接点(待核)，冷水 J De20，沿隔断明装，不进垫层')
    call(4, 10.90, BASIN_C[1] - .35, -8.0, -3.0, '冷水管沿隔断明装；只供冷水，不设热水')
    call(5, 10.72, DRAIN[1], 1.0, -5.5, '地漏支管 De50，埋在垫高层')
    call(6, BASIN_C[0], BASIN_C[1], -6.0, 4.0, '洗手盆 + P 形存水弯(见 P-02)，设吸气阀')
    call(7, 10.80, BASIN_C[1], 2.0, -4.5, '洗手盆支管 De50，顺水斜三通汇入')
    call(8, main_x(9.30), 9.30, 6.0, -2.0, '主管 De50 → 斜向直通入户门 → 公共管井')
    call(9, PEN[0], PEN[1], -2.0, -6.0, '备选：穿板点(%.2f,%.2f)，至 17 楼顶' % PEN)
    call(10, 12.0, ZC1 + .10, -4.0, 0, '地面坡向地漏 i=0.01')
    call(11, SHOWER[2], (SH_DOOR[0] + SH_DOOR[1]) / 2, -5.0, 6.0, '淋浴门宽 0.90（在第二跑下方一侧），门口有 150 高差')
    call(12, CLEAN[0], CLEAN[1], 5.0, 4.0, '清扫口（另一处在入户门内侧）')
    yk = 109
    for n, t in keys:
        sh.circle(298.5, yk - .7, 1.3, '#fff', '#000', .25); sh.text(298.5, yk, str(n), 1.7, anchor='middle', bold=True)
        sh.text(301.5, yk, t, 2.0); yk += 3.3
    LEG_Y = yk + 3
    sh.text(*v2.P(10.55, 7.55), '↑台阶 150', 1.9, anchor='start', fill='#555')
    sh.line(*v2.P(10.70, 7.675), *v2.P(10.40, 7.675), 1.0, '#000')
    a_ = v2.P(12.5, ZC1 + .25); b_ = v2.P(11.6, ZC1 + .40); sh.arrow(a_[0], a_[1], b_[0], b_[1], .4, '#444', 1.8)
    a_ = v2.P(10.95, DRAIN[1]); b_ = v2.P(10.66, DRAIN[1]); sh.arrow(a_[0], a_[1], b_[0], b_[1], .5, '#5a3d1a', 2.0)
    a_ = v2.P(main_x(DRAIN[1] + .30), DRAIN[1] + .30); b_ = v2.P(main_x(DRAIN[1] + .60), DRAIN[1] + .60); sh.arrow(a_[0], a_[1], b_[0], b_[1], .5, '#5a3d1a', 2.0)
    # 尺寸
    xa = v2.P(10.77, 0)[0]; xb = v2.P(12.93, 0)[0]
    zt = SHOWER[1] - .21
    sh.line(xb, v2.P(0, zt)[1], xa, v2.P(0, zt)[1], .25); sh.text((xa + xb) / 2, v2.P(0, zt)[1] - 1.0, '%.3f' % (SHOWER[2] - SHOWER[0]), 2.2, anchor='middle')
    ya = v2.P(0, SHOWER[1])[1]; yb = v2.P(0, SHOWER[3])[1]
    sh.line(v2.P(13.15, 0)[0], ya, v2.P(13.15, 0)[0], yb, .25); sh.text(v2.P(13.15, 0)[0] + 3, (ya + yb) / 2, '%.3f' % (SHOWER[3] - SHOWER[1]), 2.2, anchor='middle', rot=-90)
    sh.text(*v2.P(12.95, 8.3), '', 2)
    # 图例（放大图下）
    items = [
        (lambda s, x, y: (s.line(x - 6, y, x + 6, y, .5, BLUE)), '给水管 J（冷水），De20 待核'),
        (lambda s, x, y: (s.line(x - 6, y, x + 6, y, .9, '#5a3d1a', '3 1 .6 1')), '生活废水管 F（粗点划线）De50；埋在垫高层内'),
        (lambda s, x, y: (s.line(x - 6, y, x + 6, y, .6, '#888', '1.2 1')), '备选：穿板至 17 楼顶（虚线圆，需核梁筋与 17 楼接点）'),
        (lambda s, x, y: (s.circle(x, y, 2.0, '#fff', '#000', .4), s.line(x - 1.4, y - 1.4, x + 1.4, y + 1.4, .3), s.line(x - 1.4, y + 1.4, x + 1.4, y - 1.4, .3)), '地漏（圆内叉）'),
        (lambda s, x, y: (s.rect(x - 4, y - 2, 8, 4, '#fff', '#000', .3), s.circle(x, y, 1.5, '#fff', '#000', .3)), '洗手盆'),
        (lambda s, x, y: (s.circle(x, y, 1.6, '#fff', BLUE, .5), s.circle(x, y, .5, BLUE, BLUE, .1)), '淋浴器（花洒）'),
        (lambda s, x, y: (s.circle(x, y, 1.6, '#fff', '#000', .5), s.circle(x, y, .5, '#000', '#000', .1)), '立管（圆内带点，旁注编号）'),
        (lambda s, x, y: s.arrow(x - 5, y, x + 5, y, .5, '#5a3d1a', 2.0), '坡度箭头：指向水流下坡方向，旁注 i=0.012~0.025'),
        (lambda s, x, y: s.poly([(x, y - 1.8), (x + 1.8, y), (x, y + 1.8), (x - 1.8, y)], '#fff', BLUE, .4), '给水接入点（菱形，位置待核）'),
        (lambda s, x, y: s.rect(x - 1.3, y - 1.3, 2.6, 2.6, '#fff', '#5a3d1a', .4), '清扫口（检修口）'),
        (lambda s, x, y: s.rect(x - 5, y - 2, 10, 4, 'url(#dots)', '#555', .2), '垫高 150 区（完成面 ±0.000）：入口短廊 + 淋浴间'),
    ]
    legend(sh, 296, LEG_Y, 112, items, rowh=5.0)
    notes = [
        '标高：室外大平面/公共走廊 ±0.000；户内一楼完成面 -0.150；入口短廊(x 9.15~10.70、z 7.675~10.70)与淋浴间均垫高 150，完成面 ±0.000；在 z=7.675 处下一步 150 台阶进入户内。',
        '排水：地漏和花洒设在淋浴间靠入口短廊一侧。地漏、洗手盆废水 → 埋在垫高层内 → 斜向直通入户门 → 接公共管井。地漏到入户门约 %.2f m，核算见 P-02。接公共管井须物业书面同意，位置确定后复算门外段。' % LMAIN,
        '管件：薄型侧排地漏(深水封、防返溢)；洗手盆支管用顺水斜三通汇入主管；在转弯处和入户门内侧各设一个清扫口；洗手盆一端设吸气阀(是否允许由给排水工程师核定)。',
        '给水：淋浴间只在夏季使用，只供冷水，不设热水器和热水管。冷水管沿淋浴间隔断或墙面明装，不进垫高层，不与排水管同层交叉；给水接入点、水表和总阀位置待核。',
        '做法：垫高层回填前做 24 h 闭水试验并拍照留档，用轻质材料回填，管顶留不少于 30 的保护层。淋浴间地面防水上翻不少于 300，淋浴区墙面不少于 1800；上方钢平台底面做防潮防锈。门口 150 高差设挡水门槛和防滑踏步。',
        '淋浴间不接任何电源，不设灯、插座和排风扇；无外窗，靠门和隔断上方的空隙自然通风，淋浴后须开门散潮，上方钢平台底面做防潮防锈。淋浴间外框 2.16 × 2.40 m，与中转平台同宽；平台下净高约 1.980 m。淋浴门在第二跑下方，门口上方是梯梁，净高约 1.9~2.0 m，须现场复核。',
        '备选(虚线圆)：废水在 (%.2f, %.2f) 穿板下行至 17 楼顶部；需核梁筋、17 楼接点并取得 17 楼业主同意。雨水立管 YL-1 为原建筑图标注的既有独立系统，不接入本废水管。' % PEN,
        '管线路径为方案走向，施工前由给排水工程师深化。',
    ]
    notes_block(sh, 12, 180, 200, notes)
    sh.save('P-01_给排水平面图.svg')

def sheet_plumbing_section():
    sh = Sheet(); frame(sh, '排水系统示意图', 'P-02', '示意，不按比例')
    sh.text(14, 19, '排水系统示意图（沿管线展开的剖面，纵向放大）', 3.6, bold=True)
    sh.text(14, 24, '横向：沿管线长度(m)；纵向：高度放大(垫高层 150 mm 画成约 38 mm)；仅示意关系，不能量尺寸。', 2.3, fill='#555')
    rows = calc_rows()
    # ---- 剖面
    X0 = 24; SX = 60.0        # 1 m = 60 mm
    Zs = 58.0                 # ±0.000 完成面 y
    k = 0.25                  # 1 mm 高度 = 0.25 mm 图
    yF = Zs; yS = Zs + 150 * k
    def Y(h_mm): return Zs - h_mm * k       # h 以 mm，±0.000 为 0
    L = LMAIN
    xr = X0 + L * SX
    sh.rect(X0 - 8, yS, (xr - X0) + 20, 12, fill='url(#hatch)', c='#000', sw=.3)
    sh.text(X0 - 6, yS + 8, '楼板结构面 -0.150（以下为结构楼板，厚度待核）', 2.2)
    sh.rect(X0 - 8, yF, (xr - X0) + 20, yS - yF, fill='#f6f6f0', c='#000', sw=.3)
    sh.line(X0 - 8, yF, xr + 12, yF, .8)
    sh.text(xr + 12, yF - 1.0, '完成面 ±0.000', 2.2, anchor='end')
    sh.text(X0 + 12, yF + 4.2, '垫高层 150（入口短廊+淋浴间，排水管埋在这里）', 2.2)
    # 管：De50 起点管底 -80，坡 1.2%
    slope = 0.012
    sb = -80.0
    def pipe_poly(x1, x2, bottom1, od):
        y_a = Y(bottom1 + od); y_b = Y(bottom1); xx1 = X0 + x1 * SX; xx2 = X0 + x2 * SX
        b2 = bottom1 - (x2 - x1) * 1000 * slope
        return [(xx1, Y(bottom1 + od)), (xx2, Y(b2 + od)), (xx2, Y(b2)), (xx1, Y(bottom1))]
    p = pipe_poly(0, L, sb, 50)
    sh.poly(p, fill='#e8dccb', c='#5a3d1a', sw=.5)
    sh.text(X0 + 60, yS - 3.0, 'De50 废水横管（外径 50），按最小坡度 1.2%% 画；起点管底 -0.080 → 终点管底 %.3f' % rows[0]['end12'], 2.2, fill='#5a3d1a')
    # 面层线
    sh.line(X0, Y(-30), xr, Y(-30), .2, '#999', '1 1'); sh.text(xr + 1, Y(-30) + .8, '管顶最高 -0.030（留面层/防水/找平 30）', 1.9, anchor='start', fill='#777')
    # 地漏
    sh.rect(X0 - 4, yF - 1, 8, Y(sb) - yF + 1 + 3, fill='#fff', c='#000', sw=.4)
    sh.line(X0 - 4, yF - 1, X0 + 4, yF - 1, .9)
    sh.text(X0, yF - 3.0, '地漏', 2.4, anchor='middle', bold=True)
    sh.text(X0 + 6, yF - 3.0, '(%.2f, %.2f) 起点 0.0 m；薄型侧排，水封≥50 mm，本体高度以厂家样本为准' % DRAIN, 1.9)
    # 洗手盆接入点 x=2.11
    xm = X0 + LJOIN * SX; xd = X0 + 0.60 * SX
    sh.line(xm, yF - 22, xm, Y(-60), .6, '#5a3d1a')
    bx = xm - 6
    sh.rect(bx - 6, yF - 26, 12, 3.2, fill='#fff', c='#000', sw=.35); sh.text(bx, yF - 28, '洗手盆', 2.2, anchor='middle')
    sh.line(bx, yF - 22.8, bx, yF - 20, .4)
    sh.path('M%.2f,%.2f v4 a3,3 0 0 0 6,0 v-4' % (bx - 0, yF - 20), sw=.45)
    sh.line(bx + 6, yF - 20, xm, yF - 20, .4); 
    sh.text(bx - 8, yF - 17, 'P 形存水弯(水封≥50)', 2.0, anchor='end')
    sh.line(bx, yF - 20, bx - 0, yF - 20, .1)
    sh.text(xm + 1.5, yF - 14, '洗手盆支管 De50 (约 %.1f m)' % LBASIN, 2.0)
    sh.text(xm + 1.5, yF - 11, '顺水斜三通汇合点 = %.2f m 处' % LJOIN, 2.0)
    # 走廊拐点
    sh.line(xd, yF - 8, xd, yF, .3, '#555', '1 1'); sh.text(xd, yF - 9, '清扫口 · 转向入户门 0.60 m', 2.0, anchor='middle')
    # 台阶位置：z=7.675 对应距离
    dstep = LMAIN - (10.70 - 7.675) + 0  # 管线在 z>=7.78 时都在入口垫高区
    # 终点
    sh.arrow(xr, Y(rows[0]['end12']) - 3, xr + 15, Y(rows[0]['end12']) - 3, .8, '#5a3d1a', 2.4)
    sh.text(xr + 2, Y(rows[0]['end12']) - 5.0, '入户门口 %.2f m →' % LMAIN, 2.2, bold=True)
    sh.text(xr - 38, Y(rows[0]['end12']) + 15, '接公共管井(位置待物业/现场核实)', 2.2, bold=True)
    # 备选穿板
    xa = X0 + 0.20 * SX
    sh.line(xa, Y(-120), xa, yS + 12, .8, '#888', '2 1.2')
    sh.arrow(xa, yS + 6, xa, yS + 12, .6, '#888', 2)
    sh.text(xa + 2.0, yS + 4.5, '备选：穿板至 17 楼顶（需核梁筋与 17 楼接点）De75 待核', 2.0, fill='#666')
    # ---- 核算表
    ty = 132
    sh.text(14, ty, '标高 / 坡度核算表（单位 mm；长度按图中走向量：地漏 → 转弯 → 斜向入户门）', 3.0, bold=True)
    sh.line(14, ty + 1.4, 290, ty + 1.4, .4)
    heads = [('方案', 14), ('管径', 74), ('管线长', 86), ('1.2%需落差', 100), ('2.5%需落差', 120), ('可用落差', 140), ('起点管底', 158), ('终点管底(1.2%)', 176), ('结论', 206)]
    for t, x in heads: sh.text(x, ty + 6, t, 2.2, bold=True)
    sh.line(14, ty + 7.4, 290, ty + 7.4, .3)
    yy = ty + 12
    for r in rows:
        sh.text(14, yy, r['name'], 2.2, bold=(r is rows[0]), fill='#888' if '对比' in r['name'] else '#000')
        sh.text(74, yy, r['od'], 2.2); sh.text(86, yy, '%.2f m' % r['L'], 2.2)
        sh.text(100, yy, '%.0f' % r['n12'], 2.2); sh.text(120, yy, '%.0f' % r['n25'], 2.2)
        sh.text(140, yy, '%.0f' % r['avail'], 2.2)
        sh.text(158, yy, '%.3f' % r['startb'], 2.2); sh.text(176, yy, '%.3f' % r['end12'], 2.2)
        if '对比' in r['name']: verdict = '不可行：只有 %.0f 可降' % r['avail']
        elif r['ok']: verdict = '1.2%% 余 %.0f；' % (r['avail'] - r['n12']) + ('2.5%% 余 %.0f' % (r['avail'] - r['n25']) if r['n25'] <= r['avail'] else '2.5%% 缺 %.0f' % (r['n25'] - r['avail']))
        else: verdict = '放不下：缺 %.0f' % (r['n12'] - r['avail'])
        sh.text(206, yy, verdict, 2.2, bold=True, fill='#1b7a2b' if (r['ok'] and '对比' not in r['name']) else RED)
        yy += 5.2
    sh.para(14, yy + 1.5, '取值：管顶以上留面层/防水/找平 30；De50 外径 50，De75 外径 75；终点管底不得低于结构面 -0.150；可用落差 = 起点管底 - (-150)。本表算到入户门；门外至公共管井每延长 1 m 按 1.2% 另需 12 mm，管井接点确定后复算。地漏本体高度以所选样本为准，第二行按多占 20 估算。', 2.1, width=270)
    # 图例
    items = [
        (lambda s, x, y: s.poly([(x - 6, y - 1.5), (x + 6, y - 2.2), (x + 6, y + 1.0), (x - 6, y + 1.5)], '#e8dccb', '#5a3d1a', .4), '排水横管（剖面），按坡度画'),
        (lambda s, x, y: s.arrow(x - 5, y, x + 5, y, .5, '#5a3d1a', 2.0), '水流方向 / 坡度 i=0.012~0.025'),
        (lambda s, x, y: s.path('M%.1f,%.1f v2 a2,2 0 0 0 4,0 v-2' % (x - 2, y - 2), sw=.45), 'P 形存水弯（立面画法，U 形水封）'),
        (lambda s, x, y: (s.rect(x - 3, y - 2, 6, 4, '#fff', '#000', .4), s.line(x - 3, y - 2, x + 3, y - 2, .9)), '地漏（剖面）'),
        (lambda s, x, y: s.line(x - 6, y, x + 6, y, .8, '#888', '2 1.2'), '备选穿板立管（虚线）'),
        (lambda s, x, y: s.rect(x - 6, y - 2, 12, 4, 'url(#hatch)', '#000', .3), '结构楼板'),
    ]
    legend(sh, 296, 20, 112, items, rowh=5.6)
    notes = [
        '排水管埋深：De50 圆管外径 50，管顶以上留 30 的面层、防水和找平，不算坡度最少要 80 mm 埋深。地漏和花洒设在靠入口短廊一侧后，地漏到入户门约 %.2f m，按 1.2%% 只需再降 %.0f mm，150 的垫高层可以满足，余量不大。' % (rows[0]['L'], rows[0]['n12']),
        '坡度：最小 1.2%%，宜取 2.5%%。De50 按起点管底 -0.080 可做到约 %.1f%%；计入地漏本体多占 20 后约 %.1f%%。施工按能做到的最大坡度做，不小于 1.2%%。' % ((rows[0]['avail'] / 1000.0) / rows[0]['L'] * 100, (rows[1]['avail'] / 1000.0) / rows[1]['L'] * 100),
        '薄型配件：同层排水有专用的薄型侧排地漏和浅水封存水弯，可比普通件少占 10~20 mm 高度；规格、本体高度、水封深度以厂家样本为准，选型后按样本数据复算本表。地漏选深水封、防返溢型。',
        'De75：可用落差 %.0f mm，按 1.2%% 需 %.0f mm，可行但余量小；淋浴加洗手盆用 De50 即可，是否加大由给排水工程师定。' % (rows[2]['avail'], rows[2]['n12']),
        '门外段：本表只算到入户门。公共管井位置由物业确定后，按门外实际管长复算；门外公共走廊无垫层时，须在入户门处直接接入管井或另定接法。复算通过前不得回填。',
        '存水弯与通气：洗手盆下 P 形存水弯，水封不小于 50 mm；地漏自带水封。洗手盆一端设吸气阀，通气方案由给排水工程师核定。转弯处和入户门内侧各设清扫口。',
        '试验：回填前做 24 h 闭水试验。淋浴净高约 1.980 m，不宜再加高垫层。',
        '待核：公共管井位置(物业书面同意)、穿板备选点与 17 楼接点、楼板厚度及梁筋、地漏选型。垫高层内只走排水管，电线管和给水管不进垫高层。',
    ]
    notes_block(sh, 296, 62, 112, notes, size=2.25)
    sh.save('P-02_排水系统示意图.svg')

if __name__ == '__main__':
    sheet_lighting('一楼'); sheet_lighting('二楼')
    sheet_sockets('一楼'); sheet_sockets('二楼')
    sheet_system(); sheet_plumbing_plan(); sheet_plumbing_section()
    r = calc_rows()
    print('LMAIN=%.3f LBASIN=%.3f' % (LMAIN, LBASIN))
    for x in r: print({k: (round(v, 3) if isinstance(v, float) else v) for k, v in x.items()})
