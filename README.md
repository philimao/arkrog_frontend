# Arkknights Roguelike Tactics Frontend

## Getting Started

### Prerequisites

#### Packages

```
node >= 20
pnpm
```

#### Environment

- Full Stack Development

```angular2html
# .env.development
VITE_API_BASE_URL=http://localhost:5174
```

- Frontend Only
- Be really careful that this is the production environment

```angular2html
# .env.development
VITE_API_BASE_URL=https://arkrog.com/api
VITE_WASM_URL=http://localhost:8080  # optional for wasm developer
```

### Installation

Install the dependencies:

请使用 pnpm 安装和运行项目（`package.json` 的 `packageManager` 字段已固定 `pnpm@11.2.2`，yarn 1.x 会直接拒绝运行）

```bash
# 国内用户配置镜像源
npm config set registry https://registry.npmmirror.com
npm config set ELECTRON_MIRROR https://npmmirror.com/mirrors/electron/

# 启用 pnpm（corepack 随 node >= 20 内置，会按 packageManager 字段取到对应版本）
corepack enable
```

```bash
# 安装依赖
pnpm install
```

### Development

Start the development server with HMR:

```bash
pnpm start
```

Your application will be available at `http://localhost:5173`.

## Building for Production

Create a production build:

```bash
pnpm build
```

## 🧩 项目结构
├─ app
│  └─ modules
│     └─ Tool
│        └─ DamageCalculator                  # 伤害计算器
│           ├─ calculator                     # 计算器核心实现
│              ├─ charImpl\                   # 干员实现目录
|              ├─ calculator.ts               # 计算函数入口
|              ├─ helper.ts                   # 帮助函数
|              └─ impls.ts                    # 注册和获取干员计算函数
│
├─ test
│  └─ DamageCalculator
│     ├─ data                                 # 测试数据目录
│     └─ index.test.ts                        # 测试用例

