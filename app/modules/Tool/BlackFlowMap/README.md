# BlackFlowMap（黑流树海地图工具）

地图基底选择与节点标记页面（路由 `/tool/blackflowmap`）。

- 模块正文文档与阅读顺序：[docs/README.md](docs/README.md)
- 截图识别（云 OCR + 前端推理，含关键不变量）：[docs/01-screenshot-recognition.md](docs/01-screenshot-recognition.md)
- 相关代码不止本目录：后端 OCR 代理在 `arkrog_backend/routers/mapRecognition.ts`、`utils/tencentApi.ts`、`middleware/rateLimit.ts`——正文文档统一在上面的 docs/ 内。
