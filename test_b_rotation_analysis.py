#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
分析 B 旋转后的 cubestring
根据 kociemba-wasm 的 README，B 旋转后的期望状态是：
RRRUUUUUURRDRRDRRDFFFFFFFFFDDDDDDLLLULLULLULLBBBBBBBBB
"""

# 如果用户提供了实际输出，可以在这里对比
# 目前先验证期望的 cubestring 是否正确

expected = "RRRUUUUUURRDRRDRRDFFFFFFFFFDDDDDDLLLULLULLULLBBBBBBBBB"

print("=" * 60)
print("B 旋转后的期望 cubestring 分析")
print("=" * 60)
print(f"期望 cubestring: {expected}")

faces = ['U', 'R', 'F', 'D', 'L', 'B']
face_ranges = [
    (0, 9),    # U
    (9, 18),   # R
    (18, 27),  # F
    (27, 36),  # D
    (36, 45),  # L
    (45, 54),  # B
]

print("\n各面分析:")
for i, face_name in enumerate(faces):
    start, end = face_ranges[i]
    face_str = expected[start:end]
    rows = [face_str[j:j+3] for j in range(0, 9, 3)]
    cols = [face_str[j::3] for j in range(3)]
    print(f"\n{face_name}面: {face_str}")
    print(f"  行: {rows}")
    print(f"  列: {cols}")
