#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
对比 JavaScript 和 Python 生成的 cubestring
用于找出差异
"""

import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

try:
    from kociemba import solve
except ImportError:
    print("请先安装 kociemba: pip install kociemba")
    sys.exit(1)

def compare_cubestrings(js_cubestring, expected_cubestring):
    """对比两个 cubestring"""
    print("=" * 60)
    print("对比 cubestring")
    print("=" * 60)
    print(f"JavaScript 输出: {js_cubestring}")
    print(f"期望输出:        {expected_cubestring}")
    
    if len(js_cubestring) != 54 or len(expected_cubestring) != 54:
        print("[ERROR] 长度不匹配")
        return
    
    # 分析每个面的差异
    faces = ['U', 'R', 'F', 'D', 'L', 'B']
    face_ranges = [
        (0, 9),    # U
        (9, 18),   # R
        (18, 27),  # F
        (27, 36),  # D
        (36, 45),  # L
        (45, 54),  # B
    ]
    
    print("\n各面对比:")
    for i, face_name in enumerate(faces):
        start, end = face_ranges[i]
        js_face = js_cubestring[start:end]
        expected_face = expected_cubestring[start:end]
        
        if js_face == expected_face:
            print(f"  {face_name}面: [OK] {js_face}")
        else:
            print(f"  {face_name}面: [DIFF]")
            print(f"    JS:      {js_face}")
            print(f"    期望:    {expected_face}")
            
            # 分析差异
            if js_face[::-1] == expected_face:
                print(f"    [提示] JS 输出是期望输出的反向")
            elif js_face == expected_face[::-1]:
                print(f"    [提示] 期望输出是 JS 输出的反向")
    
    # 尝试求解
    print("\n求解测试:")
    try:
        solution = solve(js_cubestring)
        print(f"  JavaScript cubestring: {solution}")
        if solution:
            print(f"  步骤数: {len(solution.split())}")
    except Exception as e:
        print(f"  JavaScript cubestring: [ERROR] {e}")
    
    try:
        solution = solve(expected_cubestring)
        print(f"  期望 cubestring: {solution}")
        if solution:
            print(f"  步骤数: {len(solution.split())}")
    except Exception as e:
        print(f"  期望 cubestring: [ERROR] {e}")

# 如果提供了两个参数，对比它们
if len(sys.argv) >= 3:
    js_cs = sys.argv[1]
    expected_cs = sys.argv[2]
    compare_cubestrings(js_cs, expected_cs)
else:
    print("用法: python test_compare_cubestring.py <js_cubestring> <expected_cubestring>")
    print("\n示例:")
    print("python test_compare_cubestring.py UUFUUFUUFRRRRRRRRRFFDFFDFFDDDBDDBDDBLLLLLLLLLBBUBBUBBU UUFUUFUUFRRRRRRRRRFFDFFDFFDDDBDDBDDBLLLLLLLLLUBBUBBUBB")
