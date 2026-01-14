# 测试指南：验证 Cubestring 格式

## 问题

Python 的 `kociemba` 库认为我们的 cubestring 格式不正确。我们需要找到正确的格式。

## 当前状态

1. **标准已解决状态** `UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB` 被 Python kociemba 认为不是已解决状态
2. **我们的 cubestring** 被 Python kociemba 认为是无效的

## 测试工具

### 1. test/test_kociemba_format.py
基础测试工具，用于测试 cubestring 格式。

```bash
python test/test_kociemba_format.py <cubestring>
```

### 2. test/test_cubestring.py
完整的测试工具，用于分析 cubestring。

```bash
python test/test_cubestring.py <cubestring>
```

### 3. test/test_kociemba_correct_format.py
用于检查 cubestring 的有效性和字符分布。

```bash
python test/test_kociemba_correct_format.py <cubestring>
```

## 使用方法

1. **在浏览器中点击求解**，从控制台复制 cubestring
2. **运行 Python 测试**：
   ```bash
   python test/test_cubestring.py <从控制台复制的cubestring>
   ```
3. **查看结果**，如果 Python 返回错误，说明格式不对

## 可能的问题

1. **读取顺序不对**：每个面的读取顺序（行/列方向）可能不对
2. **颜色映射不对**：颜色到字符的映射可能不对
3. **面的顺序不对**：面的顺序（U R F D L B）可能不对

## 下一步

需要找到正确的 kociemba cubestring 格式，可能需要：
1. 查看 kociemba 库的文档或源码
2. 使用已知正确的 cubestring 来测试
3. 逐步调整读取顺序，直到 Python kociemba 能正确识别
