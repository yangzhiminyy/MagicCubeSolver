#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试 Kociemba cubestring 读取顺序
用于验证我们的 cubeStateToCubestring 函数是否正确
"""

import sys
import io

# 设置输出编码为 UTF-8
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

try:
    from kociemba import solve
except ImportError:
    print("请先安装 kociemba: pip install kociemba")
    sys.exit(1)

# 已解决状态的 cubestring（标准格式）
solved_cubestring = "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB"

print("=" * 60)
print("测试 1: 已解决状态")
print("=" * 60)
print(f"输入 cubestring: {solved_cubestring}")
try:
    solution = solve(solved_cubestring)
    print(f"求解结果: {solution}")
    if solution == "":
        print("[OK] 已解决状态正确（无解表示已解决）")
    else:
        print(f"[ERROR] 已解决状态错误，返回了解决方案: {solution}")
except Exception as e:
    print(f"[ERROR] 错误: {e}")

print("\n" + "=" * 60)
print("测试 2: 单步旋转（R）")
print("=" * 60)
# 如果只旋转了 R 面一次，U 面的第一列应该变成 F 面的第一列
# 但我们需要知道正确的 cubestring 格式
test_cubestring = "UUBUUBUUBRRRRRRRRRFFUFFUFFUDDFDDFDDFLLLLLLLLLBBDBBDBBD"
print(f"输入 cubestring: {test_cubestring}")
print(f"U面: {test_cubestring[0:9]}")
print(f"R面: {test_cubestring[9:18]}")
print(f"F面: {test_cubestring[18:27]}")
print(f"D面: {test_cubestring[27:36]}")
print(f"L面: {test_cubestring[36:45]}")
print(f"B面: {test_cubestring[45:54]}")
try:
    solution = solve(test_cubestring)
    print(f"求解结果: {solution}")
    print(f"步骤数: {len(solution.split()) if solution else 0}")
except Exception as e:
    print(f"[ERROR] 错误: {e}")

print("\n" + "=" * 60)
print("测试 3: 验证 cubestring 格式")
print("=" * 60)
print("Kociemba 标准格式说明：")
print("- 面顺序: U R F D L B")
print("- 每个面按行优先顺序（从左到右，从上到下）")
print("- 总共 54 个字符（6 个面 × 9 个块）")
print("\n已解决状态各面应该是：")
print(f"U面 (0-8):   {solved_cubestring[0:9]}  (应该是 UUUUUUUUU)")
print(f"R面 (9-17):  {solved_cubestring[9:18]}  (应该是 RRRRRRRRR)")
print(f"F面 (18-26): {solved_cubestring[18:27]}  (应该是 FFFFFFFFF)")
print(f"D面 (27-35): {solved_cubestring[27:36]}  (应该是 DDDDDDDDD)")
print(f"L面 (36-44): {solved_cubestring[36:45]}  (应该是 LLLLLLLLL)")
print(f"B面 (45-53): {solved_cubestring[45:54]}  (应该是 BBBBBBBBB)")

def analyze_cubestring(cubestring):
    """分析 cubestring"""
    if len(cubestring) != 54:
        print(f"[ERROR] cubestring 长度应该是 54，实际是 {len(cubestring)}")
        return
    
    print(f"U面: {cubestring[0:9]}")
    print(f"R面: {cubestring[9:18]}")
    print(f"F面: {cubestring[18:27]}")
    print(f"D面: {cubestring[27:36]}")
    print(f"L面: {cubestring[36:45]}")
    print(f"B面: {cubestring[45:54]}")
    
    try:
        solution = solve(cubestring)
        if solution == "":
            print("[OK] 已解决状态")
        else:
            moves = solution.split()
            print(f"求解结果: {solution}")
            print(f"步骤数: {len(moves)}")
    except Exception as e:
        print(f"[ERROR] 求解失败: {e}")

# 如果提供了命令行参数，测试该 cubestring
if len(sys.argv) > 1:
    print("\n" + "=" * 60)
    print("测试 4: 命令行提供的 cubestring")
    print("=" * 60)
    test_cs = sys.argv[1]
    print(f"输入 cubestring: {test_cs}")
    analyze_cubestring(test_cs)
