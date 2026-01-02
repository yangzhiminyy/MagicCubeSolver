#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
验证 cubestring 格式问题
分析为什么已解决状态和单步旋转的 cubestring 都有问题
"""

import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

try:
    from kociemba import solve
except ImportError:
    print("请先安装 kociemba: pip install kociemba")
    sys.exit(1)

def validate_cubestring(cubestring):
    """验证 cubestring 的基本格式"""
    print(f"\n验证 cubestring: {cubestring}")
    print("=" * 60)
    
    # 1. 检查长度
    if len(cubestring) != 54:
        print(f"[ERROR] 长度错误: 应该是 54，实际是 {len(cubestring)}")
        return False
    
    # 2. 检查字符是否有效
    valid_chars = set('URFDLB')
    invalid_chars = set(cubestring) - valid_chars
    if invalid_chars:
        print(f"[ERROR] 无效字符: {invalid_chars}")
        return False
    
    # 3. 检查每个颜色出现的次数（应该是9次）
    print("\n各颜色出现次数:")
    for color in 'URFDLB':
        count = cubestring.count(color)
        print(f"  {color}: {count} 次", end="")
        if count != 9:
            print(f" [ERROR: 应该是 9 次]")
        else:
            print(" [OK]")
    
    # 4. 分析每个面
    print("\n各面内容:")
    faces = {
        'U': cubestring[0:9],
        'R': cubestring[9:18],
        'F': cubestring[18:27],
        'D': cubestring[27:36],
        'L': cubestring[36:45],
        'B': cubestring[45:54],
    }
    
    for face_name, face_content in faces.items():
        print(f"  {face_name}面: {face_content}")
        # 检查中心块（第5个字符，索引4）
        center = face_content[4]
        if center != face_name:
            print(f"    [WARNING] 中心块应该是 {face_name}，实际是 {center}")
    
    # 5. 检查中心块
    print("\n中心块检查:")
    centers = {
        'U': cubestring[4],      # U面中心
        'R': cubestring[13],    # R面中心
        'F': cubestring[22],    # F面中心
        'D': cubestring[31],    # D面中心
        'L': cubestring[40],    # L面中心
        'B': cubestring[49],    # B面中心
    }
    
    all_centers_correct = True
    for face_name, center in centers.items():
        if center != face_name:
            print(f"  [ERROR] {face_name}面中心块应该是 {face_name}，实际是 {center}")
            all_centers_correct = False
        else:
            print(f"  [OK] {face_name}面中心块: {center}")
    
    if not all_centers_correct:
        print("\n[ERROR] 中心块位置不正确！这是 cubestring 格式错误的主要原因。")
        print("Kociemba 要求每个面的中心块（第5个位置）必须是该面的颜色。")
        return False
    
    # 6. 尝试求解
    print("\n尝试求解:")
    try:
        solution = solve(cubestring)
        if solution == "":
            print("  [OK] 已解决状态（返回空字符串）")
        else:
            moves = solution.split()
            print(f"  [OK] 求解成功: {solution}")
            print(f"  步骤数: {len(moves)}")
        return True
    except Exception as e:
        print(f"  [ERROR] 求解失败: {e}")
        return False

# 测试已解决状态
print("=" * 60)
print("测试 1: 已解决状态")
print("=" * 60)
solved = "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB"
validate_cubestring(solved)

# 测试单步旋转 R
print("\n" + "=" * 60)
print("测试 2: 单步旋转 R")
print("=" * 60)
test_r = "UUBUUBUUBRRRRRRRRRFFUFFUFFUDDFDDFDDFLLLLLLLLLBBDBBDBBD"
validate_cubestring(test_r)

# 如果提供了命令行参数，测试该 cubestring
if len(sys.argv) > 1:
    print("\n" + "=" * 60)
    print("测试 3: 命令行提供的 cubestring")
    print("=" * 60)
    validate_cubestring(sys.argv[1])
