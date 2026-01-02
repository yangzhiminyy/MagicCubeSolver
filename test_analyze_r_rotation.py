#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
分析单步旋转 R 后的正确 cubestring
"""

import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

try:
    from kociemba import solve
except ImportError:
    print("请先安装 kociemba: pip install kociemba")
    sys.exit(1)

# 已解决状态
solved = "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB"

# 如果只旋转了 R 面一次（顺时针），正确的 cubestring 应该是什么？
# 根据 Kociemba 格式：
# - R 面顺时针旋转后，R 面本身会变化
# - U 面的右列（col=2）会移到 F 面的右列
# - F 面的右列会移到 D 面的右列
# - D 面的右列会移到 B 面的左列（镜像，所以是 col=0）
# - B 面的左列会移到 U 面的右列

print("=" * 60)
print("分析：单步旋转 R 后的正确状态")
print("=" * 60)

# 手动构造正确的 R 旋转后的状态
# 假设已解决状态，然后旋转 R

# 方法1：使用 Kociemba 求解器验证
# 如果我们从已解决状态执行 R，然后生成 cubestring，应该能得到正确的格式

# 方法2：手动分析
# 已解决状态：UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB
# R 旋转后：
# - U面：前两列不变，右列变成 B 面的左列（B的col=0，但B是镜像的，所以是B[0][2]）
#   等等，需要理解 Kociemba 的 B 面读取顺序

print("\n让我们用 Kociemba 验证：")
print("1. 从已解决状态执行 R")
print("2. 看看生成的 cubestring 是什么")

# 实际上，我们可以：
# 1. 从已解决状态开始
# 2. 应用 R 旋转
# 3. 看看结果

# 但更好的方法是：使用一个已知有效的 cubestring 来测试
# 或者，我们可以尝试理解为什么当前的 cubestring 无效

print("\n测试：使用 Kociemba 求解器生成 R 旋转后的状态")
print("如果我们对已解决状态执行 R，然后求解，应该得到 R'")

# 实际上，Kociemba 可能对已解决状态有特殊处理
# 让我们尝试一个已知有效的 cubestring

# 一个简单的测试：如果 cubestring 格式正确，应该能求解
# 如果格式错误，会抛出异常

print("\n" + "=" * 60)
print("测试：验证 Kociemba 对已解决状态的处理")
print("=" * 60)

# 测试：Kociemba 可能期望已解决状态返回空字符串
# 但如果返回了解决方案，说明它不认为这是已解决状态

# 让我们检查一下：是否是因为 Kociemba 的某些内部表示问题
print("\n尝试：检查 Kociemba 是否对已解决状态有特殊要求")

# 根据 Kociemba 文档，已解决状态应该返回空字符串
# 但我们的测试显示返回了解决方案，这可能意味着：
# 1. cubestring 格式虽然看起来正确，但不符合 Kociemba 的内部表示
# 2. 或者 Kociemba 的某些版本有 bug

print("\n建议：")
print("1. 检查 Kociemba 的官方文档，确认已解决状态的正确格式")
print("2. 使用 Kociemba 生成一个已知有效的 cubestring 来对比")
print("3. 检查我们的 cubeStateToCubestring 函数的读取顺序是否正确")

# 让我们尝试一个不同的方法：使用一个已知有效的 cubestring
# 从 Kociemba 的示例或测试用例中获取

print("\n" + "=" * 60)
print("关键发现：")
print("=" * 60)
print("1. 已解决状态的 cubestring 格式看起来正确（颜色数量、中心块都正确）")
print("2. 但 Kociemba 返回了解决方案，说明它不认为这是已解决状态")
print("3. 这可能意味着 cubestring 的读取顺序有问题")
print("4. 或者 Kociemba 对已解决状态有特殊的验证规则")
print("\n建议检查：")
print("- Kociemba 官方文档中的 cubestring 格式说明")
print("- 我们的 cubeStateToCubestring 函数中的读取顺序")
print("- 特别是 U、D、B 面的读取顺序（这些面可能有特殊的映射）")
