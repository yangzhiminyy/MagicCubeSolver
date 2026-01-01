# 魔方还原程序

一个基于 React + Three.js 的在线魔方还原程序，支持3D可视化、手动操作和自动求解功能。

## 功能特性

- 🎲 **3D可视化**：使用 Three.js 渲染逼真的3D魔方
- 🎮 **交互操作**：支持鼠标旋转视角、缩放，以及手动旋转魔方面
- 🔄 **打乱功能**：随机打乱魔方
- 🤖 **自动求解**：使用 Kociemba 算法自动求解魔方
- 📊 **步骤回放**：查看求解步骤并逐步回放

## 技术栈

- **React 18** - UI框架
- **Three.js** - 3D图形渲染
- **@react-three/fiber** - React Three.js 渲染器
- **@react-three/drei** - Three.js 工具库
- **cubing** - 魔方求解算法库

## 安装和运行

1. 安装依赖：
```bash
npm install
```

2. 启动开发服务器：
```bash
npm run dev
```

3. 构建生产版本：
```bash
npm run build
```

## 使用方法

1. **旋转视角**：鼠标左键拖拽
2. **缩放**：鼠标滚轮
3. **打乱魔方**：点击"打乱"按钮
4. **手动操作**：点击控制面板中的旋转按钮（R, R', L, L'等）
5. **自动求解**：点击"求解"按钮，然后使用"上一步"/"下一步"按钮逐步查看求解过程

## 项目结构

```
src/
  ├── components/          # React组件
  │   ├── RubiksCube.tsx  # 魔方3D渲染组件
  │   ├── Cubie.tsx       # 单个小块组件
  │   └── ControlPanel.tsx # 控制面板组件
  ├── utils/              # 工具函数
  │   ├── cubeTypes.ts    # 类型定义
  │   ├── cubeLogic.ts    # 魔方旋转逻辑
  │   └── cubeConverter.ts # 状态转换工具
  ├── App.tsx             # 主应用组件
  └── main.tsx            # 入口文件
```

## 许可证

MIT
