> ℹ️ 本文已并入 [07-debugging.md](../app/modules/Tool/DamageCalculator/docs/07-debugging.md)（含截图文字版与症状排查表）。本文保留原始截图，过渡期后删除。

# VSCode运行调试

1. 使用vscode打开arkrog项目

![](https://cdn.nlark.com/yuque/0/2025/png/594794/1746865246518-c0098401-6453-4ee0-bcdd-bed78dcaa2f0.png)

2. 找到计算器实现的函数

```shell
/app/modules/Tool/DamageCalculator/calculator/charImpl       ---- 所有干员实现计算函数的目录
/app/modules/Tool/DamageCalculator/calculator/calculator.ts  ---- 计算器的总入口
```

找到想要调试干员计算器的函数，然后在代码行数左侧移动光标出现红点，可以选择在此行断点

![](https://cdn.nlark.com/yuque/0/2025/png/594794/1746865362065-4731a420-abe7-435f-9012-2c88c1e8c186.png)

3. 打开调试面板，选择“JavaScript Debug Terminal"

![](https://cdn.nlark.com/yuque/0/2025/png/594794/1746865272945-a501b3cb-9d5e-4f74-ae84-8375596882e4.png)

4. 点击出现新的命令行窗口在此窗口运行命令“yarn test"

![](https://cdn.nlark.com/yuque/0/2025/png/594794/1746865704017-e021b564-8a5f-4d1a-8a12-4aa3229725c1.png)

5. 等待过一会执行到相应测试时会进入断点位置

![](https://cdn.nlark.com/yuque/0/2025/png/594794/1746865743369-ae8e7971-eaa7-4d26-bb5b-6beaf424fb4e.png)

6. 不会用就问我，远程会议教

![](https://cdn.nlark.com/yuque/0/2025/png/594794/1746865912506-1aa81fcd-5a8d-4ccd-8f3d-a1d42ddcedc0.png)

# 浏览器运行调试

1. 启动前端项目

![](https://cdn.nlark.com/yuque/0/2025/png/594794/1746866018564-fb6b000c-557a-4e49-b726-019a6529ade5.png)

2. 打开前端项目，按F12进入开发者模式，选择"源代码" 、"Source Code"

![](https://cdn.nlark.com/yuque/0/2025/png/594794/1746866049917-c14d2c44-3fb1-471b-aadd-c97dc40eb80b.png)

3. 输入快捷键"ctrl+shift+p"， 搜索并选择干员的计算函数实现文件

![](https://cdn.nlark.com/yuque/0/2025/png/594794/1746866154824-aaca7298-a50d-4cfd-b17c-5cdab92710de.png)

4. 在想要的地方点击开启断点

![](https://cdn.nlark.com/yuque/0/2025/png/594794/1746866185045-cc76f8f6-bf67-4216-9e82-a29efbfe9874.png)

5. 选择干员进入干员计算函数断点处

![](https://cdn.nlark.com/yuque/0/2025/png/594794/1746866239530-3e8b0790-c151-4faf-b9f3-e7f9cc33042e.png)

6. debug面板还有很多功能，可以自己学也可以远程会议

![](https://cdn.nlark.com/yuque/0/2025/png/594794/1746866336024-887fc409-76dc-410d-81af-de1c92374e5e.png)
