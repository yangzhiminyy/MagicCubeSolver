#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试 Kociemba 的正确格式
验证已解决状态和单步旋转的正确 cubestring
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

def test_solved_state():
    """测试已解决状态"""
    print("=" * 60)
    print("测试已解决状态")
    print("=" * 60)
    
    # 标准已解决状态
    solved = "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB"
    print(f"标准已解决状态: {solved}")
    
    try:
        solution = solve(solved)
        if solution == "":
            print("[OK] 这是已解决状态")
            return True
        else:
            print(f"[WARNING] 返回了解决方案: {solution}")
            print("这可能意味着格式不对")
            return False
    except Exception as e:
        print(f"[ERROR] 错误: {e}")
        return False

def test_single_move_R():
    """测试单步 R 旋转"""
    print("\n" + "=" * 60)
    print("测试单步 R 旋转")
    print("=" * 60)
    
    # 如果只旋转了 R 面一次，根据 Kociemba 标准：
    # R 旋转后，U 面的第一列（col=0）应该变成 F 面的第一列
    # 但我们需要知道正确的 cubestring 格式
    
    # 让我们尝试手动构造一个 R 旋转后的状态
    # 根据 Kociemba 标准，R 旋转后：
    # - U 面的第一列（col=0）→ F 面的第一列
    # - F 面的第一列 → D 面的第一列
    # - D 面的第一列 → B 面的第一列（反向）
    # - B 面的第一列 → U 面的第一列（反向）
    
    # 但我们需要知道正确的读取顺序
    print("需要知道正确的 cubestring 格式才能测试")
    print("建议：从已知正确的 kociemba 实现中获取示例")

def analyze_cubestring(cubestring):
    """分析 cubestring"""
    print("\n" + "=" * 60)
    print("分析 Cubestring")
    print("=" * 60)
    
    if len(cubestring) != 54:
        print(f"[ERROR] 长度应该是 54，实际是 {len(cubestring)}")
        return
    
    print(f"完整 cubestring: {cubestring}")
    print("\n各面内容:")
    print(f"U面 (0-8):   {cubestring[0:9]}")
    print(f"R面 (9-17):  {cubestring[9:18]}")
    print(f"F面 (18-26): {cubestring[18:27]}")
    print(f"D面 (27-35): {cubestring[27:36]}")
    print(f"L面 (36-44): {cubestring[36:45]}")
    print(f"B面 (45-53): {cubestring[45:54]}")
    
    # 检查每个面的字符是否有效
    valid_chars = set('URFDLB')
    for i, face_name in enumerate(['U', 'R', 'F', 'D', 'L', 'B']):
        start = i * 9
        end = start + 9
        face_chars = set(cubestring[start:end])
        invalid_chars = face_chars - valid_chars
        if invalid_chars:
            print(f"[ERROR] {face_name}面包含无效字符: {invalid_chars}")
        else:
            print(f"[OK] {face_name}面字符有效")
    
    # 尝试求解
    print("\n尝试求解:")
    try:
        solution = solve(cubestring)
        if solution == "":
            print("[OK] 已解决状态")
        else:
            moves = solution.split()
            print(f"[OK] 求解成功: {solution}")
            print(f"步骤数: {len(moves)}")
    except ValueError as e:
        print(f"[ERROR] 求解失败: {e}")
        print("这可能意味着 cubestring 格式不对")
    except Exception as e:
        print(f"[ERROR] 未知错误: {e}")

if __name__ == "__main__":
    # 测试已解决状态
    test_solved_state()
    
    # 如果提供了命令行参数，分析该 cubestring
    if len(sys.argv) > 1:
        cubestring = sys.argv[1]
        analyze_cubestring(cubestring)
    else:
        print("\n使用方法:")
        print("  python test_kociemba_format.py <cubestring>")
        print("\n示例:")
        print("  python test_kociemba_format.py UUBUUBUUBRRRRRRRRRFFUFFUFFUDDFDDFDDFLLLLLLLLLBBDBBDBBD")
