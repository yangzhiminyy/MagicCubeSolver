# 简化旋转逻辑方案

## 核心思路

1. **每个cubie都有6个面的颜色**（不可见面用黑色）
2. **旋转操作分两步**：
   - 第一步：替换cubie位置（循环移动）
   - 第二步：旋转cubie颜色（绕轴旋转90度）

## 数据结构

### 角块（CornerCubie）
```typescript
interface CornerCubie {
  id: CornerCubieId
  position: CornerCubieId
  colors: CubieColors  // 6个面的颜色（U, D, F, B, L, R）
}
```

### 边块（EdgeCubie）
```typescript
interface EdgeCubie {
  id: EdgeCubieId
  position: EdgeCubieId
  colors: CubieColors  // 6个面的颜色（U, D, F, B, L, R）
}
```

**注意**：移除了`orientation`字段！

## 旋转操作

### R面旋转（绕x轴顺时针90度）

#### 第一步：替换位置
- 角块循环：`UFR -> DFR -> DBR -> UBR -> UFR`
- 边块循环：`UR -> FR -> DR -> BR -> UR`

#### 第二步：旋转颜色（绕x轴顺时针90度）

对于参与旋转的每个cubie，颜色旋转规则：
```
绕x轴顺时针90度：
U -> F
F -> D
D -> B
B -> U
L -> L（不变）
R -> R（不变）
```

**颜色旋转函数**：
```typescript
function rotateColorsAroundXAxis(colors: CubieColors, clockwise: boolean): CubieColors {
  if (clockwise) {
    return {
      U: colors.B,
      D: colors.F,
      F: colors.U,
      B: colors.D,
      L: colors.L,
      R: colors.R,
    }
  } else {
    // 逆时针就是顺时针的逆
    return {
      U: colors.F,
      D: colors.B,
      F: colors.D,
      B: colors.U,
      L: colors.L,
      R: colors.R,
    }
  }
}
```

### 其他面的旋转

#### L面旋转（绕x轴逆时针90度）
- 角块循环：`UFL -> UBL -> DBL -> DFL -> UFL`
- 边块循环：`UL -> BL -> DL -> FL -> UL`
- 颜色旋转：与R面相反（逆时针）

#### U面旋转（绕y轴逆时针90度）
- 角块循环：`UFR -> UBR -> UBL -> UFL -> UFR`
- 边块循环：`UF -> UR -> UB -> UL -> UF`
- 颜色旋转：
```
绕y轴逆时针90度：
U -> U（不变）
D -> D（不变）
F -> R
R -> B
B -> L
L -> F
```

#### D面旋转（绕y轴顺时针90度）
- 角块循环：`DFR -> DFL -> DBL -> DBR -> DFR`
- 边块循环：`DF -> DL -> DB -> DR -> DF`
- 颜色旋转：与U面相反（顺时针）

#### F面旋转（绕z轴顺时针90度）
- 角块循环：`UFR -> UFL -> DFL -> DFR -> UFR`
- 边块循环：`UF -> FL -> DF -> FR -> UF`
- 颜色旋转：
```
绕z轴顺时针90度：
U -> L
D -> R
F -> F（不变）
B -> B（不变）
L -> D
R -> U
```

#### B面旋转（绕z轴逆时针90度）
- 角块循环：`UBR -> UBL -> DBL -> DBR -> UBR`
- 边块循环：`UB -> BR -> DB -> BL -> UB`
- 颜色旋转：与F面相反（逆时针）

## 实现步骤

1. ✅ 修改数据类型，添加黑色，移除orientation
2. ⏳ 添加颜色旋转函数（绕x/y/z轴旋转）
3. ⏳ 重构旋转逻辑（先替换位置，再旋转颜色）
4. ⏳ 简化颜色映射逻辑（直接从colors读取，不需要orientation计算）

## 优势

1. **逻辑简单**：不需要orientation概念
2. **易于理解**：旋转就是两步操作
3. **易于调试**：可以单独测试位置替换和颜色旋转
4. **易于扩展**：添加新的旋转操作很简单
