# Arkknights Roguelike Tactics Frontend

## Getting Started

### Prerequisites

#### Packages

```
node >= 20
yarn
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

请使用yarn安装和运行项目

```bash
# 国内用户配置镜像源
npm config set registry https://registry.npmmirror.com
npm config set ELECTRON_MIRROR https://npmmirror.com/mirrors/electron/

# 安装yarn工具
npm install -g yarn
```

```bash
# 安装依赖
yarn install
```

### Development

Start the development server with HMR:

```bash
yarn start
```

Your application will be available at `http://localhost:5173`.

## Building for Production

Create a production build:

```bash
yarn build
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

