#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试 Kociemba 的正确格式
通过已知的简单状态来验证格式
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

def test_known_states():
    """测试已知状态"""
    print("=" * 60)
    print("测试已知状态")
    print("=" * 60)
    
    # 测试 1: 标准已解决状态
    print("\n测试 1: 标准已解决状态")
    solved1 = "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB"
    print(f"Cubestring: {solved1}")
    try:
        solution = solve(solved1)
        if solution == "":
            print("[OK] 已解决状态")
        else:
            print(f"[WARNING] 返回了解决方案: {solution}")
    except Exception as e:
        print(f"[ERROR] 错误: {e}")
    
    # 测试 2: 尝试其他可能的已解决状态格式
    # 可能需要调整读取顺序
    print("\n测试 2: 尝试不同的读取顺序")
    print("（这需要根据实际测试结果来调整）")
    
    # 测试 3: 单步 R 旋转
    # 如果只旋转了 R 面一次，U 面的第一列应该变成 F 面的第一列
    # 但我们需要知道正确的格式
    print("\n测试 3: 单步 R 旋转")
    print("需要知道正确的 cubestring 格式才能测试")

def check_cubestring_validity(cubestring):
    """检查 cubestring 的有效性"""
    print("\n" + "=" * 60)
    print("检查 Cubestring 有效性")
    print("=" * 60)
    
    if len(cubestring) != 54:
        print(f"[ERROR] 长度应该是 54，实际是 {len(cubestring)}")
        return False
    
    # 检查字符是否有效
    valid_chars = set('URFDLB')
    for char in cubestring:
        if char not in valid_chars:
            print(f"[ERROR] 包含无效字符: {char}")
            return False
    
    # 检查每个面的字符分布
    print("\n各面字符分布:")
    for i, face_name in enumerate(['U', 'R', 'F', 'D', 'L', 'B']):
        start = i * 9
        end = start + 9
        face_str = cubestring[start:end]
        char_count = {}
        for char in face_str:
            char_count[char] = char_count.get(char, 0) + 1
        print(f"{face_name}面: {face_str} (字符分布: {char_count})")
    
    # 尝试求解
    print("\n尝试求解:")
    try:
        solution = solve(cubestring)
        if solution == "":
            print("[OK] 已解决状态")
            return True
        else:
            moves = solution.split()
            print(f"[OK] 求解成功: {solution}")
            print(f"步骤数: {len(moves)}")
            return True
    except ValueError as e:
        print(f"[ERROR] 求解失败: {e}")
        print("\n可能的原因:")
        print("1. cubestring 格式不对（读取顺序错误）")
        print("2. 颜色映射不对")
        print("3. 面的顺序不对")
        return False
    except Exception as e:
        print(f"[ERROR] 未知错误: {e}")
        return False

if __name__ == "__main__":
    test_known_states()
    
    if len(sys.argv) > 1:
        cubestring = sys.argv[1]
        check_cubestring_validity(cubestring)
    else:
        print("\n使用方法:")
        print("  python test_kociemba_correct_format.py <cubestring>")
        print("\n示例:")
        print("  python test_kociemba_correct_format.py UUBUUBUUBRRRRRRRRRFFUFFUFFUDDFDDFDDFLLLLLLLLLBBDBBDBBD")
