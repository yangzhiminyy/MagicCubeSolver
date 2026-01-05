#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试工具：验证 JavaScript 生成的 cubestring 是否正确
使用方法：python test_cubestring.py <cubestring>
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

def analyze_cubestring(cubestring):
    """分析 cubestring 的格式"""
    if len(cubestring) != 54:
        print(f"[ERROR] cubestring 长度应该是 54，实际是 {len(cubestring)}")
        return False
    
    print("=" * 60)
    print("Cubestring 分析")
    print("=" * 60)
    print(f"完整 cubestring: {cubestring}")
    print(f"长度: {len(cubestring)}")
    print("\n各面内容:")
    print(f"U面 (0-8):   {cubestring[0:9]}")
    print(f"R面 (9-17):  {cubestring[9:18]}")
    print(f"F面 (18-26): {cubestring[18:27]}")
    print(f"D面 (27-35): {cubestring[27:36]}")
    print(f"L面 (36-44): {cubestring[36:45]}")
    print(f"B面 (45-53): {cubestring[45:54]}")
    
    # 检查已解决状态
    solved = "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB"
    if cubestring == solved:
        print("\n[INFO] 这是标准已解决状态格式")
    else:
        print("\n[INFO] 这不是已解决状态")
    
    print("\n" + "=" * 60)
    print("Kociemba 求解")
    print("=" * 60)
    try:
        solution = solve(cubestring)
        if solution == "":
            print("[OK] 已解决状态（无解）")
        else:
            moves = solution.split()
            print(f"求解结果: {solution}")
            print(f"步骤数: {len(moves)}")
            print(f"步骤列表: {moves}")
        return True
    except Exception as e:
        print(f"[ERROR] 求解失败: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) > 1:
        cubestring = sys.argv[1]
        analyze_cubestring(cubestring)
    else:
        print("使用方法: python test_cubestring.py <cubestring>")
        print("\n示例:")
        print("  python test_cubestring.py UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB")
        print("\n或者从 JavaScript 控制台复制 cubestring 来测试:")
        print("  python test_cubestring.py UUBUUBUUBRRRRRRRRRFFUFFUFFUDDFDDFDDFLLLLLLLLLBBDBBDBBD")
