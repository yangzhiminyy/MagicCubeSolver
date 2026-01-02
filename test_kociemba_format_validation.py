#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
根据 Kociemba 官方文档验证 cubestring 格式
参考：https://github.com/muodov/kociemba/blob/master/README.md
"""

import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

try:
    from kociemba import solve
except ImportError:
    print("请先安装 kociemba: pip install kociemba")
    sys.exit(1)

print("=" * 60)
print("Kociemba 官方格式验证")
print("=" * 60)

# 根据官方文档，面的布局是：
# U面：从上到下，从左到右
#    U1 U2 U3
#    U4 U5 U6
#    U7 U8 U9
#
# 展开图：
#        U1 U2 U3
#        U4 U5 U6
#        U7 U8 U9
# L1 L2 L3 | F1 F2 F3 | R1 R2 R3 | B1 B2 B3
# L4 L5 L6 | F4 F5 F6 | R4 R5 R6 | B4 B5 B6
# L7 L8 L9 | F7 F8 F9 | R7 R8 R9 | B7 B8 B9
#        D1 D2 D3
#        D4 D5 D6
#        D7 D8 D9

# 已解决状态（官方文档示例）
solved_official = "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB"

print("\n1. 测试官方已解决状态：")
print(f"   Cubestring: {solved_official}")
try:
    solution = solve(solved_official)
    if solution == "":
        print("   [OK] 已解决状态（返回空字符串）")
    else:
        print(f"   [WARNING] 返回了解决方案: {solution}")
        print("   注意：根据文档，已解决状态应该返回空字符串")
except Exception as e:
    print(f"   [ERROR] 错误: {e}")

# 分析每个面的读取顺序
print("\n2. 分析每个面的读取顺序：")
print("   根据官方文档，每个面按以下顺序读取：")
print("   - U面: U1-U9 (从上到下，从左到右)")
print("   - R面: R1-R9 (从上到下，从左到右)")
print("   - F面: F1-F9 (从上到下，从左到右)")
print("   - D面: D1-D9 (从上到下，从左到右)")
print("   - L面: L1-L9 (从上到下，从左到右)")
print("   - B面: B1-B9 (从上到下，从左到右)")

# 验证已解决状态的每个面
print("\n3. 验证已解决状态的每个面：")
faces = {
    'U': solved_official[0:9],
    'R': solved_official[9:18],
    'F': solved_official[18:27],
    'D': solved_official[27:36],
    'L': solved_official[36:45],
    'B': solved_official[45:54],
}

for face_name, face_content in faces.items():
    print(f"   {face_name}面: {face_content}")
    # 检查中心块（第5个字符，索引4）
    center = face_content[4]
    if center == face_name:
        print(f"     中心块: {center} [OK]")
    else:
        print(f"     中心块: {center} [ERROR: 应该是 {face_name}]")

# 测试官方文档中的示例
print("\n4. 测试官方文档中的示例：")
example1 = "DRLUUBFBRBLURRLRUBLRDDFDLFUFUFFDBRDUBRUFLLFDDBFLUBLRBD"
print(f"   示例1: {example1}")
try:
    solution = solve(example1)
    print(f"   求解结果: {solution}")
    print(f"   [OK] 求解成功")
except Exception as e:
    print(f"   [ERROR] 求解失败: {e}")

# 分析面的布局
print("\n5. 面的布局分析（根据官方文档）：")
print("   从展开图看：")
print("   - U面：从上到下（U1-U3是第一行，U4-U6是第二行，U7-U9是第三行）")
print("   - F面：从上到下（F1-F3是第一行，F4-F6是第二行，F7-F9是第三行）")
print("   - R面：从上到下（R1-R3是第一行，R4-R6是第二行，R7-R9是第三行）")
print("   - D面：从上到下（D1-D3是第一行，D4-D6是第二行，D7-D9是第三行）")
print("   - L面：从上到下（L1-L3是第一行，L4-L6是第二行，L7-L9是第三行）")
print("   - B面：从上到下（B1-B3是第一行，B4-B6是第二行，B7-B9是第三行）")
print("\n   关键点：")
print("   - 每个面都是标准的行优先顺序（row-major order）")
print("   - 第一行：位置 0-2")
print("   - 第二行：位置 3-5")
print("   - 第三行：位置 6-8")
print("   - 中心块：位置 4（第二行第二列）")

# 对比我们的实现
print("\n6. 对比我们的实现：")
print("   我们的 cubeStateToCubestring 函数中：")
print("   - U面：row=2到0（反向读取行）")
print("   - R面：row=0到2（标准顺序）")
print("   - F面：row=0到2（标准顺序）")
print("   - D面：row=2到0（反向读取行）")
print("   - L面：row=0到2（标准顺序）")
print("   - B面：row=0到2，col=2到0（反向读取列）")
print("\n   潜在问题：")
print("   - U面和D面的反向读取可能不正确")
print("   - B面的反向读取列可能不正确")
print("   - 需要确认我们的坐标系统与Kociemba的坐标系统是否一致")
