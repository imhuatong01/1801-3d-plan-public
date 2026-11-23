# -*- coding: utf-8 -*-
"""生成 1801_电气数据.json。
坐标：x 向右 0~19.425，z 0~9.40（入口短廊到 10.70），单位米。标高以 ±0.000（室外大平面）为准，一楼完成面 -0.150，夹层完成面 +4.100（与既有梁面齐平）。"""
import json, os, math
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

FLOOR1 = -0.150
FLOOR2 = 4.100
steelSoffit = FLOOR2 - 0.140 - 0.250   # 3.710，夹层钢结构底
beltBase = FLOOR2 - 0.670              # 3.430，既有窗腰梁底
lowerY = round((beltBase + steelSoffit) / 2, 3)   # 3.570，窗腰梁灯居中装在梁面可用高度内，避开钢梁
stairY = 5.00                      # 楼梯上方后墙灯（楼梯上方无楼板）
roofY = 8.40 - 0.25 - 0.21         # 7.94
pitch = 2.95
stations = [18.525 - (6 - i - .5) * pitch for i in range(6)]
r2 = lambda v: round(v, 3)

lights = []
def add(id, typ, group, x, z, elev, face, circuit, floorTag, status='existing', note='', mount=None, sw=None, gang=None):
    fl = FLOOR2 if floorTag == '二楼' else FLOOR1
    lights.append(dict(id=id, type=typ, typeName={'linear': '线形灯', 'ceiling': '吸顶灯(防水)'}[typ],
        modelGroup=group, floor=floorTag, x=r2(x), z=r2(z), elevationM=r2(elev),
        heightAboveFloorM=r2(elev - fl), mountFace=face, circuit=circuit, switchId=sw, switchGang=gang,
        status=status, note=note))

# 一楼开放办公区
for i in range(3):
    add('L%02d' % (i + 1), 'linear', 'WL1', stations[i], 0.9 + 0.047, lowerY, '朝+z，装在窗腰梁室内侧面', 'WL1', '一楼', sw='K1', gang='abc'[i], note='窗腰梁灯')
for i in range(3):
    add('L%02d' % (i + 4), 'linear', 'WL3', stations[i], 7.615 - 0.047, lowerY, '朝-z，装在开放区后墙(z=7.675)室内侧', 'WL1', '一楼', sw='K1', gang='def'[i], note='开放区后墙灯')
W03 = lights[-1]; W03['note'] += '；L06 平面上与 AL1 箱位重叠（AL1 高 1.15~1.87，灯高 3.57，竖向不冲突）'
# 夹层下方（一楼）：健身区
for i in range(3, 6):
    add('L%02d' % (i + 4), 'linear', 'WL1', stations[i], 0.9 + 0.047, lowerY, '朝+z，装在窗腰梁室内侧面（夹层楼板之下）', 'WL2', '一楼', sw='K3', gang='a', note='窗腰梁灯，在夹层楼板下方')
for i in range(3):
    z = 0.9 + (i + .5) * pitch
    add('L%02d' % (10 + i), 'linear', 'WL1', 18.525 - 0.047, z, lowerY, '朝-x，装在短边窗腰梁室内侧面（夹层楼板之下）', 'WL2', '一楼', sw='K3', gang='a',
        note='窗腰梁灯，在夹层楼板下方' + ('' if False else ''))
# 楼梯
add('L13', 'linear', 'WL3', stations[3], 9.40 - 0.06 - 0.047, stairY, '朝-z，装在后墙(z=9.40)室内侧', 'WL3', '一楼', sw='K2', gang='a', note='楼梯通道灯（平台上方）；与 K4b 双控')
add('L14', 'linear', 'WL3', stations[4], 9.40 - 0.06 - 0.047, stairY, '朝-z，装在后墙(z=9.40)室内侧', 'WL3', '一楼', sw='K2', gang='a', note='楼梯通道灯（第二跑旁）；与 K4b 双控')
add('L15', 'linear', 'WL3', 19.425 - 0.20 - 0.047, 8.64, 7.94, '朝-x，装在短边上层端墙(x=19.225)室内侧，正对楼梯出口中线', 'WL3', '二楼', status='proposed', sw='K2', gang='a',
    note='楼梯出口灯。装在走出楼梯正对的端墙上，位于楼梯出口宽度的正中(z=8.64，出口 z 8.04~9.24)，高度与二楼顶梁灯相同(7.94)；与 K4b 双控')
# 二楼办公区
for i in range(3, 6):
    add('L%02d' % (i + 13), 'linear', 'WL2', stations[i], 0.925 + 0.047, roofY, '朝+z，装在顶梁室内侧面', 'WL4', '二楼', sw='K4', gang='a', note='顶梁灯，在夹层楼面之上；三盏共用一联')

omitted = []

def sw(id, name, floor, x, z, wallN, gangs, why, status='proposed', **kw):
    d = dict(id=id, name=name, floor=floor, x=x, z=z, wallNormal=wallN, heightAboveFloorM=1.3, gangCount=len(gangs), gangs=gangs, reason=why, status=status)
    d.update(kw); return d

switches = [
 sw('K1', '一楼入口开关组（六联，两块三联面板并排）', '一楼', 10.70, 10.45, [-1, 0],
    [dict(gang=g, controls=['L%02d' % (i + 1)], circuit='WL1', control='单控', note='开放办公区第 %d 盏，独立一联' % (i + 1)) for i, g in enumerate('abcdef')],
    '进门左手侧墙(x=10.70)通道面，距门洞边 0.25 m，距地 1.3 m。开放办公区 6 盏灯每盏一联，集中在这一处。', distanceToDoorFrameM=0.25),
 sw('K2', '一楼入口楼梯灯开关（单联双控）', '一楼', 10.70, 10.15, [-1, 0],
    [dict(gang='a', controls=['L13', 'L14', 'L15'], circuit='WL3', control='双控', dualWith='K4 第 b 联', note='楼梯通道 3 盏；与二楼楼梯出口开关双控')],
    '与 K1 同一位置并排安装，靠里一块。'),
 sw('K3', '一楼柱上开关（单联）', '一楼', 9.15, 0.75, [1, 0],
    [dict(gang='a', controls=['L07', 'L08', 'L09', 'L10', 'L11', 'L12'], circuit='WL2', control='单控', note='夹层下方健身区灯 6 盏')],
    '主过道旁 500×500 既有柱朝通道的柱面，距地 1.3 m。明装线盒，不得剔凿柱身，须结构/物业同意。', status='ownerSpecified'),
 sw('K4', '二楼楼梯出口综合开关（二联）', '二楼', 17.57, 9.34, [0, -1],
    [dict(gang='a', controls=['L16', 'L17', 'L18'], circuit='WL4', control='单控', note='二楼办公区顶梁灯三盏共用'),
     dict(gang='b', controls=['L13', 'L14', 'L15'], circuit='WL3', control='双控', dualWith='K2', note='楼梯灯双控：与一楼 K2 配对')],
    '二楼楼梯出口外 0.42 m 的后墙(z=9.40)上，距地 1.3 m(标高 5.40)，上楼就能摸到。'),
]

# ---- 插座编号 ----
seq = [0]; calls = []
def o(floor, x, z, side, c, h=0.38):
    seq[0] += 1
    calls.append(('S%02d' % seq[0], floor, x, z, side, c, h))
for x in [1.40, 4.00, 6.60, 8.40]: o('一楼', x, 7.53, 'z', 'C1')
for z in [1.25, 3.40, 5.55]: o('一楼', 8.98, z, 'x', 'C1')
for x, z, sd in [[8.65, .75, 'x'], [8.90, 1.00, 'z'], [9.15, .75, 'x']]: o('一楼', x, z, sd, 'C1')
for x, z, s in [[11.1, 1.0, 'z'], [12.7, 1.0, 'z'], [13.35, 4.2, 'x']]: o('一楼', x, z, s, 'C2')
for x, z, s in [[17.0, 1.2, 'z'], [18.85, 2.9, 'x'], [18.85, 5.2, 'x'], [18.85, 7.5, 'x'], [17.0, 9.12, 'z'], [14.6, 9.12, 'z']]: o('一楼', x, z, s, 'C3')
for z in [6.45, 8.45]: o('一楼', 12.85, z, 'x', 'C4')
for x in [11.2, 12.8, 14.4, 16.0, 17.6]: o('二楼', x, 9.24, 'z', 'C5')
o('二楼', 19.25, 8.0, 'x', 'C5')
for z in [1.2, 3.0, 5.0]: o('二楼', 10.8, z, 'x', 'C6')
for x, z, sd in [[18.425, .75, 'x'], [18.675, 1.00, 'z'], [18.10, 9.34, 'z']]: o('二楼', x, z, sd, 'C7')
for x, z, s in [[11.25, 1.3, 'z'], [13.7, 1.3, 'z'], [16.0, 1.3, 'z']]: o('二楼', x, z, s, 'C7')
for x, z, s in [[19.2, 7.2, 'x'], [18.9, 5.4, 'x'], [18.9, 7.0, 'x'], [16.2, 7.25, 'z'], [13.8, 7.25, 'z']]: o('二楼', x, z, s, 'C8')
for z in [3.15, 5.40]: o('一楼', .12, z, 'x', 'C1')
for x, z, sd in [[18.425, .75, 'x'], [18.675, 1.00, 'z']]: o('一楼', x, z, sd, 'C3')
o('一楼', 13.25, 9.34, 'z', 'C4', 1.10)
deleted = ['S46', 'S04', 'S05', 'S06', 'S07', 'S11', 'S12', 'S13', 'S14', 'S15', 'S16', 'S17', 'S18', 'S19', 'S20', 'S21', 'S22', 'S23', 'S24', 'S25', 'S26', 'S27', 'S28', 'S29', 'S30', 'S34', 'S35', 'S36', 'S38', 'S39', 'S40', 'S41']
cmap = {('一楼', 'C1'): 'WX1', ('一楼', 'C3'): 'WX2', ('一楼', 'C4'): '-', ('二楼', 'C7'): 'WX3', ('二楼', 'C8'): 'WX4'}
wallN = {'S01': [0, -1], 'S02': [0, -1], 'S03': [0, -1], 'S08': [-1, 0], 'S09': [0, 1], 'S10': [1, 0], 'S42': [1, 0], 'S43': [1, 0],
         'S44': [-1, 0], 'S45': [0, 1], 'S46': [0, -1], 'S31': [-1, 0], 'S32': [0, 1], 'S33': [0, -1], 'S37': [-1, 0]}
NEWNO = {'S08': 'S04', 'S09': 'S05', 'S10': 'S06', 'S42': 'S07', 'S43': 'S08', 'S44': 'S09', 'S45': 'S10', 'S31': 'S11', 'S32': 'S12', 'S33': 'S13', 'S37': 'S14'}
no = lambda i: NEWNO.get(i, i)
sockets = []
for id, fl, x, z, side, c, h in calls:
    if id in deleted: continue
    wx = cmap[(fl, c)]
    splash = (id == 'S46')   # 改号前的内部序号
    sockets.append(dict(id=no(id), floor=fl, x=x, z=z, heightAboveFloorM=h, type='防溅五孔插座' if splash else ('地面插座' if h == 0 else '单相五孔插座'),
        circuit=wx, model3dCircuit=c, wallNormal=wallN[id], status='existing',
        note='淋浴间门外后墙（梯下），不在淋浴间内；防溅面板 + 独立漏电保护' if splash else ('地面插座，带翻盖；靠玻璃一侧无墙可装，故设在地面' if h == 0 else '')))
assert len(sockets) == 14, len(sockets)

boards = [
 dict(id='AL1', name='总配电箱', floor='一楼', x=8.25, z=7.555, widthM=0.58, heightM=0.72, depthM=0.12, bottomHeightM=1.15,
      mount='进门右手实体墙(z=7.675)内侧，明装', feed='电源进线：由物业/楼层电表箱引入，接入点待核', status='existing',
      circuits=['WL1', 'WL2', 'WL3', 'WL4', 'WX1', 'WX2', 'WX3', 'WX4', 'WK1', 'WK2', 'WE1']),
]
TBD = '由持证电工确定'
circuits = [
 dict(id='WL1', name='一楼开放办公区照明', type='照明', board='AL1', loads=['L01', 'L02', 'L03', 'L04', 'L05', 'L06'], controlledBy=['K1a~K1f（每盏一联）']),
 dict(id='WL2', name='一楼夹层下(健身区)照明', type='照明', board='AL1', loads=['L07', 'L08', 'L09', 'L10', 'L11', 'L12'], controlledBy=['K3a']),
 dict(id='WL3', name='楼梯通道照明(3 盏，双控)', type='照明', board='AL1', loads=['L13', 'L14', 'L15'], controlledBy=['K2a', 'K4b']),
 dict(id='WL4', name='二楼办公区照明', type='照明', board='AL1', loads=['L16', 'L17', 'L18'], controlledBy=['K4a']),
 dict(id='WX1', name='一楼开放办公区普通插座', type='插座', board='AL1', model3dCircuit='C1', loads=['S01', 'S02', 'S03', 'S04', 'S05', 'S06', 'S07', 'S08']),
 dict(id='WX2', name='一楼夹层下沿窗插座', type='插座', board='AL1', model3dCircuit='C3', loads=['S09', 'S10']),
 dict(id='WX3', name='夹层柱面及后墙插座', type='插座', board='AL1', model3dCircuit='C7', loads=['S11', 'S12', 'S13']),
 dict(id='WX4', name='夹层端墙插座', type='插座', board='AL1', model3dCircuit='C8', loads=['S14']),
 dict(id='WK1', name='空调电源 AC01(预留，设备待定)', type='空调', board='AL1', loads=['AC01'], note='每台空调独立回路'),
 dict(id='WE1', name='应急照明与疏散指示(不经开关)', type='预留', board='AL1', loads=['位置见 A-01']),
 dict(id='WK2', name='空调电源 AC02(预留，设备待定)', type='空调', board='AL1', loads=['AC02']),
]
for c in circuits:
    c['breaker'] = TBD; c['cable'] = TBD
    c['rcd'] = '须带漏电保护' if c['id'] in ('WX1', 'WX2', 'WX3', 'WX4') else TBD

data = dict(
 meta=dict(project='1801-OPC空间', date='2026-11-19', stage='方案图，非施工图，须由持证电工/给排水工程师深化',
  coordinate='坐标：x 向右 0~19.425，z 0~9.40(入口短廊到 10.70)，单位米；图纸画法 x 轴反向、正门在图下方',
  levels=dict(outdoorAndCorridor=0.000, floor1Finish=FLOOR1, floor1WetFinish=0.000, entryCorridorFinish=0.000, floor1Finish_note='一楼户内 -0.150；入口短廊和淋浴间垫高 150，完成面 ±0.000', mezzanineFinish=FLOOR2, roofStructure=8.400),
  heightConvention='elevationM=标高(±0.000 起算)；heightAboveFloorM=距所在楼层完成面',
  fieldNote='lights.modelGroup 为灯具分组，lights.circuit 为回路号',
  acNote='空调位置待暖通确定'),
 distributionBoards=boards, lights=lights, omittedLights=omitted, switches=switches,
 sockets=sorted(sockets, key=lambda d: d['id']), circuits=sorted(circuits, key=lambda c: ['WL1', 'WL2', 'WL3', 'WL4', 'WX1', 'WX2', 'WX3', 'WX4', 'WK1', 'WK2', 'WE1'].index(c['id'])),
 hvac=[dict(id='AC01', name='夹层下吸顶机', x=15.88, z=3.05, floor='一楼', elevationM=3.45, power='WK1 预留'),
       dict(id='AC02', name='夹层上吸顶机', x=15.88, z=4.40, floor='二楼', elevationM=7.81, power='WK2 预留'),
       dict(id='V01', name='开放区后半区送风口', x=2.45, z=6.05, floor='一楼', elevationM=5.95, power='无')],
 pendingItems=['电源进线接入点、总负荷、断路器/线径全部由持证电工确定', 'K3 开在既有柱上，须结构/物业同意', '淋浴间不接任何电源：不设灯、插座、热水器、排风扇（只在夏季使用，冷水）', '淋浴间须做局部等电位联结(LEB)',
   '全户只设一个配电箱 AL1，夹层回路由 AL1 沿主线槽上引'],
)
with open(os.path.join(ROOT, '1801_电气数据.json'), 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=1)
order = ['WL1', 'WL2', 'WL3', 'WL4', 'WX1', 'WX2', 'WX3', 'WX4', 'WK1', 'WK2', 'WE1']
assert sorted(c['id'] for c in circuits) == sorted(order)
print('ok', len(lights), 'lights', len(sockets), 'sockets')
