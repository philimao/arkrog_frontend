---
last-verified: 2026-08-05
sources:
  - app/modules/Tool/BlackFlowMap/index.tsx
  - app/modules/Tool/BlackFlowMap/mapData.tsx
  - app/modules/Tool/BlackFlowMap/mapCanvas.tsx
  - app/modules/Tool/BlackFlowMap/ScreenshotRecognizer.tsx
  - app/modules/Tool/BlackFlowMap/recognition/recognize.ts
---

# 黑流树海地图工具 文档索引

路由 `/tool/blackflowmap`。功能是让用户对照游戏内地图选定「基底」（该层的迷宫拓扑，每层 3~10 张候选），再逐个标记节点类型，用于推断未探明节点。

## 正文

| 文档 | 主题 | 状态 |
|---|---|---|
| [01-screenshot-recognition.md](01-screenshot-recognition.md) | 截图识别：一次云 OCR 同时判层数与基底，全部推理在前端 | 已验证 |

## ADR

| 编号 | 决策 | 状态 |
|---|---|---|
| [0001](adr/0001-cloud-ocr-frontend-inference.md) | 截图识别改用云 OCR + 前端推理，后端只做签名转发 | 已接受 |

## 尚无正文文档的部分

地图渲染（`mapCanvas.tsx`）、节点网格状态（`useNodeGrid.ts`）、基底与节点选项数据（`mapData.tsx` 的 `initialMaps` / `nodeOptions` / `zoneNotes`）目前没有正文文档，改动前直接读源码。其中 `initialMaps` 是**地图拓扑的唯一数据源**，识别与渲染都从它来，勿再建副本。
