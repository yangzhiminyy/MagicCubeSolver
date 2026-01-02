#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
分析 F 旋转后的 cubestring
"""

# 实际输出
actual = "LLLUUUUUUURRURRURRFFFFFFFFFDDDDDDRRRLLDLLDLLDBBBBBBBBB"
# 期望输出
expected = "UUUUUULLLURRURRURRFFFFFFFFFRRRDDDDDDLLDLLDLLDBBBBBBBBB"

print("=" * 60)
print("F 旋转后的 cubestring 对比")
print("=" * 60)

faces = ['U', 'R', 'F', 'D', 'L', 'B']
face_ranges = [
    (0, 9),    # U
    (9, 18),   # R
    (18, 27),  # F
    (27, 36),  # D
    (36, 45),  # L
    (45, 54),  # B
]

for i, face_name in enumerate(faces):
    start, end = face_ranges[i]
    actual_face = actual[start:end]
    expected_face = expected[start:end]
    
    print(f"\n{face_name}面:")
    print(f"  实际: {actual_face}")
    print(f"  期望: {expected_face}")
    
    if actual_face != expected_face:
        print(f"  [差异]")
        # 分析差异
        if actual_face[::-1] == expected_face:
            print(f"    实际是期望的反向")
        elif actual_face == expected_face[::-1]:
            print(f"    期望是实际的反向")
        
        # 检查是否是行的顺序问题
        actual_rows = [actual_face[i:i+3] for i in range(0, 9, 3)]
        expected_rows = [expected_face[i:i+3] for i in range(0, 9, 3)]
        print(f"    实际行: {actual_rows}")
        print(f"    期望行: {expected_rows}")
        
        if actual_rows[::-1] == expected_rows:
            print(f"    实际行的顺序是期望的反向（行顺序问题）")
        elif actual_rows == expected_rows[::-1]:
            print(f"    期望行的顺序是实际的反向（行顺序问题）")
        
        # 检查是否是列的顺序问题
        actual_cols = [actual_face[i::3] for i in range(3)]
        expected_cols = [expected_face[i::3] for i in range(3)]
        print(f"    实际列: {actual_cols}")
        print(f"    期望列: {expected_cols}")
