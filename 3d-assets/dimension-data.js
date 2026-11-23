// Every permanent dimension of the 1801 model, with its source.
//   cad  : park CAD drawing (原始图纸副本.dwg → 1801_专页核对数据.json) and its level schedule. Authoritative.
//   plan : this design (scheme A stair, void, bathroom, mezzanine layout).
//   est  : read from site photos or assumed; must be measured on site / confirmed by the engineer.
// Coordinates are model metres (x right, z towards the entrance), elevations relative to 18F = ±0.000.
export function addProjectDimensions(D, {ground, upper, stairs, structure, fieldFrame, floor17, M}) {
  const f3 = v => v.toFixed(3), f2 = v => v.toFixed(2);
  const F1 = M.lowerFinish, F2 = M.floorFinish, mid = M.midLanding, wet = M.wetFloorFinish, T = 0.12;
  const W = 19.425, DEPTH = 9.40, OFFICE_W = 9.15, OFFICE_D = 7.675, ENTRY_Z = 10.70;
  const soffit = M.roomTop - 0.25, beltTop = M.steelTop, beltBase = M.beltBase;
  const th = M.thresholdX, go = M.going, oL = M.upperStartX, oF = M.openingFrontZ, b2 = M.mainBeam2X, joistSoffit = M.steelTop - M.joistDepth;
  const cad = (lvl = 2) => ({src: 'cad', lvl}), plan = (lvl = 2) => ({src: 'plan', lvl}), est = (lvl = 2) => ({src: 'est', lvl});

  // ---------- 18F plan: CAD outline ----------
  D.dim(ground, [0, F1, 0], [W, F1, 0], [0, 0, -1.05], '总宽 ' + f3(W), cad(1));
  D.dim(ground, [W, F1, 0], [W, F1, DEPTH], [1.05, 0, 0], '进深 ' + f3(DEPTH), cad(1));
  D.dim(ground, [0, F1, 0], [0, F1, OFFICE_D], [-.95, 0, 0], f3(OFFICE_D), cad(2));
  D.dim(ground, [0, F1, OFFICE_D], [OFFICE_W, F1, OFFICE_D], [0, 0, .8], f3(OFFICE_W), cad(2));
  D.dim(ground, [10.7, F1, DEPTH], [W, F1, DEPTH], [0, 0, .8], f3(W - 10.7), cad(2));
  D.dim(ground, [OFFICE_W, F1, ENTRY_Z], [10.7, F1, ENTRY_Z], [0, 0, .6], '入口门 ' + f3(1.55), cad(2));
  D.dim(ground, [9.925, F1, 0], [9.925, F1, ENTRY_Z], [0, 0, 0], '通道全长 ' + f3(ENTRY_Z), cad(2));
  D.dim(ground, [10.7, F1, DEPTH], [10.7, F1, ENTRY_Z], [.5, 0, 0], f3(1.3), cad(3));
  D.dim(ground, [OFFICE_W, F1, OFFICE_D], [OFFICE_W, F1, ENTRY_Z], [-.5, 0, 0], f3(ENTRY_Z - OFFICE_D), cad(3));
  D.dim(ground, [2.65, F1, 0], [9.65, F1, 0], [0, 0, -.5], '开启扇中距 7.000', cad(3));
  D.dim(ground, [9.65, F1, 0], [16.65, F1, 0], [0, 0, -.5], '7.000', cad(3));
  D.dim(ground, [0, F1, 0], [2.65, F1, 0], [0, 0, -.5], '2.650', cad(3));
  D.note(ground, [4.6, F1, 3.9], '开放办公 9.150 × 7.675 · 70.2 ㎡', cad(1));
  D.note(ground, [9.925, F1, 5.4], '通道宽 1.550', cad(2));
  D.note(ground, [9.7, F1, 11.9], '1801 净面积 168.83 ㎡（CAD 原文）', cad(1));
  D.note(ground, [8.9, 1.25, .75], '原柱 500 × 500', cad(3));
  D.note(ground, [18.675, 1.25, .75], '原柱 500 × 500', cad(3));
  D.note(ground, [18.675, 1.25, 9.55], '原柱 500 × 600（墙内）', cad(3));
  D.level(ground, [5.2, F1, 1.6], '一楼完成面 ' + f3(F1).replace('-', '−'), est(1));
  // Interior drop below the public corridor: stated by the owner, not on the CAD.
  D.dim(ground, [11.15, F1, ENTRY_Z + .35], [11.15, 0, ENTRY_Z + .35], [0, 0, 0], '户内下沉 ' + f3(-F1) + '（待现场量）', est(1));
  D.level(ground, [9.925, 0, ENTRY_Z + 1.25], '室外大平面 ±0.000', cad(1));
  // Interior height as the owner states it: 4.2 + 4.2 + the drop, up to the roof structural level.
  D.dim(fieldFrame, [-.9, F1, 0], [-.9, M.roomTop, 0], [0, 0, 0], '室内总高 ' + f3(M.roomTop - F1) + '（4.2 + 4.2 + ' + f2(-F1) + '）', cad(1));
  D.dim(fieldFrame, [-.9, F1, 2.2], [-.9, soffit, 2.2], [0, 0, 0], '到屋顶板底约 ' + f3(soffit - F1) + '（板厚按 250 估）', est(3));
  D.note(ground, [15.0, F1, 3.0], '吧台 / 健身 8.725 × ' + f3(M.platformZ0 - 1.55) + ' · ' + (8.725 * (M.platformZ0 - 1.55)).toFixed(1) + ' ㎡', plan(2));

  // ---------- storey levels: CAD level schedule ----------
  const hx = W, hz = DEPTH;
  D.dim(fieldFrame, [hx, 0, hz], [hx, 4.2, hz], [2.0, 0, 0], '层高 4.200（18F→19F）', cad(1));
  D.dim(fieldFrame, [hx, 4.2, hz], [hx, M.roomTop, hz], [2.0, 0, 0], '层高 4.200（19F→屋顶结构）', cad(1));
  D.level(fieldFrame, [hx + 2.0, 0, hz + 1.5], '18F ±0.000 = 72.190', cad(1));
  D.level(fieldFrame, [hx + 2.0, 4.2, hz + 1.5], '19F +4.200 = 76.390', cad(1));
  D.level(fieldFrame, [hx + 2.0, M.roomTop, hz + 1.5], '屋顶结构 +8.400 = 80.590', cad(1));
  D.dim(fieldFrame, [hx, F2, hz], [hx, soffit, hz], [1.0, 0, 0], '夹层面到屋顶板底 ' + f3(soffit - F2), est(2));
  D.level(fieldFrame, [hx + 1.0, soffit, hz - 1.2], '屋顶板底 +' + f3(soffit), est(3));

  // ---------- daylight facade (采光面): photo estimate, to be measured ----------
  D.dim(fieldFrame, [W, F1, 0], [W, beltBase, 0], [.8, 0, -.8], '下层窗 ' + f3(beltBase - F1), est(2));
  D.dim(fieldFrame, [W, beltBase, 0], [W, beltTop, 0], [.8, 0, -.8], '腰梁 ' + f3(beltTop - beltBase), est(2));
  D.dim(fieldFrame, [W, beltTop, 0], [W, soffit, 0], [.8, 0, -.8], '上层窗 ' + f3(soffit - beltTop), est(2));
  D.dim(fieldFrame, [W - W / 12, F1, 0], [W, F1, 0], [0, 0, -.5], '长面窗格 ' + f3(W / 12) + ' × 12', est(3));
  D.dim(fieldFrame, [W, F1, 0], [W, F1, DEPTH / 7], [.5, 0, 0], '短面窗格 ' + f3(DEPTH / 7) + ' × 7', est(3));
  D.dim(fieldFrame, [W, soffit, 6.85], [W, soffit, DEPTH], [.5, 0, 0], '上层端部实墙 ' + f3(DEPTH - 6.85), est(3));
  D.level(fieldFrame, [W + .8, beltTop, 2.2], '腰梁顶 = 钢梁顶 +' + f3(beltTop), est(2));
  D.note(fieldFrame, [9.7, 6.3, -.1], '采光面 · 窗格与腰梁尺寸按照片估计，须现场核尺', est(2));
  D.dim(fieldFrame, [0, soffit - .42, .75], [0, soffit - .42, 3.45], [-.65, 0, 0], '屋顶梁中距 2.700', est(3));
  D.dim(fieldFrame, [0, soffit - .42, 3.45], [0, soffit - .42, 6.60], [-.65, 0, 0], '3.150', est(3));
  D.note(fieldFrame, [3.2, soffit - .21, 3.45], '屋顶梁 350 × 420', est(3));

  // ---------- stair + bathroom: scheme A ----------
  D.dim(stairs, [M.lowerLandingX, F1, M.lowerFlightZ], [M.lowerStartX, F1, M.lowerFlightZ], [0, 0, -.6], '第一跑 ' + M.lowerRisers + ' 级 · ' + f3((M.lowerRisers - 1) * go), plan(2));
  D.dim(stairs, [M.upperStartX, F2, M.platformZ1], [th, F2, M.platformZ1], [0, 1.5, 0], '第二跑 ' + M.upperRisers + ' 级 · ' + f3((M.upperRisers - 1) * go), plan(2));
  D.dim(stairs, [10.75, mid, M.platformZ1], [M.lowerLandingX, mid, M.platformZ1], [0, .5, 0], '平台 ' + f3(M.lowerLandingX - 10.75), plan(2));
  D.dim(stairs, [10.75, mid, M.platformZ0], [10.75, mid, M.platformZ1], [-.7, 0, 0], '平台宽 ' + f3(M.platformZ1 - M.platformZ0) + '（= 两跑 + 缝）', plan(2));
  D.dim(stairs, [M.lowerStartX, F1, M.lowerFlightZ], [M.lowerStartX, F1, M.lowerFlightZ + M.stairWidth], [.5, 0, 0], '梯宽 ' + f3(M.stairWidth), plan(2));
  D.note(stairs, [15.3, 1.3, M.flightGapZ + M.flightGap / 2], '两跑之间留缝 ' + Math.round(M.flightGap * 1000), plan(2));
  D.dim(stairs, [M.lowerStartX, F1, M.lowerFlightZ + 1.16], [19.275, F1, M.lowerFlightZ + 1.16], [0, 0, 0], '起步前 ' + f3(19.275 - M.lowerStartX), plan(3));
  D.dim(stairs, [18.6, F1, M.backWallZ - .10], [18.6, F2, M.backWallZ - .10], [0, 0, 0], '楼梯总高 ' + f3(F2 - F1), plan(2));
  D.note(stairs, [15.3, 1.15, 5.95], '每级 高 ' + (M.riser * 1000).toFixed(1) + ' × 深 ' + Math.round(go * 1000), plan(3));
  D.level(stairs, [11.85, mid, M.platformZ0 + .86], '平台 +' + f3(mid), plan(2));
  D.dim(stairs, [11.3, wet, M.platformZ0 + .05], [11.3, mid - T, M.platformZ0 + .05], [0, 0, -.03], '浴室净高 ' + f3(mid - T - wet), plan(2));
  D.note(stairs, [11.85, 1.0, M.platformZ0 + 1.26], '淋浴间 2.160 × ' + f3(M.platformZ1 - M.platformZ0 - .10), plan(2));
  D.level(stairs, [11.85, wet, M.platformZ0 + 1.76], '淋浴完成面 ' + (Math.abs(wet) < .0005 ? '±' : wet < 0 ? '−' : '+') + f3(Math.abs(wet)), plan(3));
  D.note(stairs, [11.85, mid - .06, M.platformZ1 - .10], '平台总厚不得超过 120 · 须结构确认', est(3));
  const pitch = x => F1 + (1 + (M.lowerStartX - x) / go) * M.riser;
  // Headroom: under the joists over the landing and the top of the first flight, and under the main beam crossing it.
  D.note(stairs, [11.85, mid + 1.2, M.platformZ0 + .86], '平台上方留空 · 不做楼板', plan(1));
  D.dim(stairs, [b2 + .06, pitch(b2), M.lowerFlightZ], [b2 + .06, M.steelTop - M.primaryDepth, M.lowerFlightZ], [0, 0, -.03],
    '洞边梁下梯段净空 ' + f3(M.steelTop - M.primaryDepth - pitch(b2)), plan(1));
  D.note(stairs, [15.2, 3.2, 6.6], '楼梯上方净高均不小于 2.00', est(2));

  // ---------- mezzanine ----------
  D.note(upper, [15.2, F2, 3.0], '夹层办公 ' + M.upperArea.toFixed(1) + ' ㎡', plan(1));
  D.dim(upper, [10.7, F2, 0], [W, F2, 0], [0, 0, -.55], '夹层 ' + f3(W - 10.7), cad(2));
  D.dim(upper, [10.7, F2, 0], [10.7, F2, M.voidFrontZ], [-.55, 0, 0], '临空边 ' + f3(M.voidFrontZ), plan(3));
  D.dim(upper, [10.7, F2, M.voidFrontZ], [b2, F2, M.voidFrontZ], [0, 0, -.5], '留空 ' + f3(b2 - 10.7), plan(2));
  D.dim(upper, [10.7, F2, M.voidFrontZ], [10.7, F2, M.backWallZ], [-.55, 0, 0], f3(M.backWallZ - M.voidFrontZ), plan(2));
  D.dim(upper, [b2, F2, M.backWallZ - .10], [th, F2, M.backWallZ - .10], [0, .85, 0], '第二跑上方 ' + f3(th - b2), plan(2));
  D.dim(upper, [th, F2, oF], [th, F2, M.backWallZ], [.5, 0, 0], f3(M.backWallZ - oF), plan(3));
  D.dim(upper, [th, F2, M.upperFlightZ + .41], [19.325, F2, M.upperFlightZ + .41], [0, 0, 0], '到达区 ' + f3(19.325 - th), plan(3));
  D.dim(upper, [b2 + .5, F2, oF - .03], [b2 + .5, F2 + 1.08, oF - .03], [0, 0, 0], '护栏 1.080', plan(3));
  D.note(upper, [15.2, F2, M.upperFlightZ + .46], '楼梯留空 ' + M.openingArea.toFixed(2) + ' ㎡（平台、第一跑顶部和第二跑的上方）', plan(2));
  D.level(upper, [17.6, F2, 4.9], '夹层完成面 +' + f3(F2), cad(2));

  // ---------- steel: preliminary member sizes by common practice (engineer to verify) ----------
  // Basis: office live load 2.5 kN/m2, light board deck about 1.2 kN/m2, Q235B.
  // Longest main beam 6.6 m carrying a 2.7 m strip: M = 79 kN*m, needs W = 350 cm3; HN300x150 has 481 cm3,
  // total deflection about L/390 (limit L/400), so HN350x175 is the fallback if the engineer wants margin.
  const top = M.steelTop, soff = M.steelTop - M.primaryDepth, soffMain = M.steelTop - M.mainBeamDepth;
  D.note(structure, [M.beamXs[4] + .06, soff - .05, 3.4], '纵向钢梁 8 根 HN250×125 · 间距约 1.09 m', est(1));
  D.note(structure, [15.6, soff - .05, M.voidFrontZ - .06], '横向钢梁 1 根 HN250×125', est(1));
  D.note(structure, [15.6, soff - .05, M.openingFrontZ - .06], '第二跑旁边梁 HN250×125 · 端头锚在短边既有梁上', est(2));
  D.note(structure, [16.6, top + .1, 2.2], '钢梁上铺压型钢板，浇筑 140', est(2));
  D.note(structure, [18.48, top - .1, 4.6], '贴边槽钢只托板边', est(3));
  D.note(structure, [b2 + .1, top - .5, 1.0], '窗侧梁端锚固在既有混凝土梁上 · 不设柱', est(2));
  D.note(structure, [b2 + .1, 1.3, M.flightGapZ + .075], '梯井柱 矩形管 200×100×6（两根）', est(2));
  D.note(structure, [10.78, 2.0, 5.96], '钢柱 150×150×6', est(2));
  D.dim(structure, [b2 + .1, top, 2.4], [16.35, top, 2.4], [0, 0, 0], '主梁中距 ' + f3(16.35 - b2 - .1), est(3));
  D.dim(structure, [10.775, top, 2.4], [b2 + .1, top, 2.4], [0, 0, 0], '主梁中距 ' + f3(b2 + .1 - 10.775), est(3));
  D.dim(structure, [12.0, top, 1.5], [12.0, top, 2.1], [0, 0, 0], '次梁间距 0.600', est(3));
  D.dim(structure, [b2 + .21, soffMain, 5.0], [b2 + .21, top, 5.0], [0, 0, 0], '梁高 ' + f3(M.mainBeamDepth), est(3));
  D.note(structure, [15.2, top, 1.0], '钢结构为按常规做法初选，须结构工程师验算并核原楼板承载', est(1));
  D.note(stairs, [15.6, 1.0, 7.0], '梯梁 矩形管 250×100×8', est(3));
  D.note(stairs, [11.85, mid - .06, 6.0], '平台 花纹钢板 + 方管 100×50 @525 · 总厚 120 · 立柱藏在卫浴墙内', est(3));

  // ---------- 17F reference bay ----------
  const y17 = -4.2;   // 17F floor stays on its own datum; only its ceiling is lowered by the 18F recess
  D.level(floor17, [2.6, y17, 8.6], '17F −4.200 = 67.990', cad(1));
  D.dim(floor17, [0, y17, OFFICE_D], [0, 0, OFFICE_D], [-1.7, 0, 0], '层高 4.200（17F→18F）', cad(1));
  D.dim(floor17, [0, y17, OFFICE_D], [0, F1 - .16, OFFICE_D], [-.85, 0, 0], '17 楼这一跨到顶约 ' + f3(4.2 + F1 - .16) + '（板厚按 160 估）', est(2));
  D.dim(floor17, [0, y17, 0], [OFFICE_W, y17, 0], [0, 0, -.75], '对应跨 ' + f3(OFFICE_W), cad(2));
  D.dim(floor17, [0, y17, 0], [0, y17, OFFICE_D], [-.85, 0, 0], f3(OFFICE_D), cad(2));
  D.note(floor17, [4.6, y17, 3.9], '17 楼只画与 18 楼开放区对应的一跨', cad(2));
  D.note(floor17, [4.6, y17 + 3.6, 3.9], '17 楼梁、窗按 18 楼同跨推定 · 待核', est(3));
  D.build();
}
