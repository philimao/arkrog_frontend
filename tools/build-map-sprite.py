#!/usr/bin/env python3
"""build-map-sprite.py — 把黑流树海的节点图标打成一张 sprite

用法（需要 Pillow：pip install Pillow）：
    python tools/build-map-sprite.py

产物（两个都要提交）：
    app/assets/map-sprite.webp                              sprite 图
    app/modules/Tool/BlackFlowMap/mapSprite.generated.ts    id -> 矩形的清单

为什么要 sprite：2026-08-16 的 CDN 明细里 /images/map/* 是 85,238 次/日、占全站
请求数 22.3%，一次黑流树海页面加载就要拉二十几个几 KB 的小图。HTTPS 请求数按次
计费，是账单里比流量更贵的一半。合成一张后每次加载只剩 1 个请求，而且从
app/assets/ 引用会让 Vite 加内容哈希输出到 assets-v2/，直接命中 nginx 现有的
一年 immutable 规则（放 public/images/ 时只有 24 小时）。

收进 260x260 的节点图标，外加 empty(45x45) 与 cursor_anchor(176x176)。后两个按
**原尺寸**贴进格子左上角，清单里记的是每张图各自的矩形而不是统一网格——早先的
版本把它们拉伸到 260 再让浏览器缩回 20/40px 渲染，实测 RMSE 48.7 / 33.7（同样
方式测正常图标只有 2.1），边缘明显发虚。

排除项及原因：
  rogue_6_map_zone_*.webp  1560x960 的区域底图，尺寸完全不同
  zone_*.png               164x68 的区域名牌，尺寸完全不同
  map-sample.webp          864x397 的截图示例，只在识图说明里出现一次

原始小图**保留不删**：mapSprite.tsx 在清单里查不到 id 时会退回单文件路径，
新增图标忘了重跑本脚本也只是多一个请求，不会渲染成白框。
"""

import io
import math
import os
import sys

try:
    from PIL import Image
except ImportError:
    sys.exit("需要 Pillow：pip install Pillow")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = os.path.join(ROOT, "public", "images", "map")
SPRITE_OUT = os.path.join(ROOT, "app", "assets", "map-sprite.webp")
MANIFEST_OUT = os.path.join(
    ROOT, "app", "modules", "Tool", "BlackFlowMap", "mapSprite.generated.ts"
)

CELL = 260  # 与节点图标原始尺寸一致：地图里最大渲染 80 CSS px，DPR3 需要 240
QUALITY = 85
EXTRA = ["empty.webp", "cursor_anchor.webp"]


def collect():
    icons = []
    for name in sorted(os.listdir(SRC_DIR)):
        if not name.endswith(".webp"):
            continue
        with Image.open(os.path.join(SRC_DIR, name)) as im:
            if im.size == (CELL, CELL):
                icons.append(name)
    for name in EXTRA:
        if name not in icons and os.path.exists(os.path.join(SRC_DIR, name)):
            icons.append(name)
    return icons


def main():
    icons = collect()
    if not icons:
        sys.exit(f"在 {SRC_DIR} 下没找到任何 {CELL}x{CELL} 的图标")

    cols = math.ceil(math.sqrt(len(icons)))
    rows = math.ceil(len(icons) / cols)
    sheet_w, sheet_h = cols * CELL, rows * CELL

    sheet = Image.new("RGBA", (sheet_w, sheet_h), (0, 0, 0, 0))
    rects = {}
    for i, name in enumerate(icons):
        ox, oy = (i % cols) * CELL, (i // cols) * CELL
        with Image.open(os.path.join(SRC_DIR, name)) as im:
            im = im.convert("RGBA")
            # 小图不放大：拉伸后再让浏览器缩回去会糊掉边缘
            w, h = min(im.width, CELL), min(im.height, CELL)
            if (im.width, im.height) != (w, h):
                im = im.resize((w, h), Image.LANCZOS)
            sheet.paste(im, (ox, oy))
        rects[os.path.splitext(name)[0]] = (ox, oy, w, h)

    os.makedirs(os.path.dirname(SPRITE_OUT), exist_ok=True)
    sheet.save(SPRITE_OUT, "WEBP", quality=QUALITY, method=6)

    before = sum(os.path.getsize(os.path.join(SRC_DIR, n)) for n in icons)
    after = os.path.getsize(SPRITE_OUT)

    entries = "\n".join(
        f"  {k}: [{x}, {y}, {w}, {h}],"
        for k, (x, y, w, h) in sorted(rects.items(), key=lambda kv: (kv[1][1], kv[1][0]))
    )
    manifest = (
        "// 由 tools/build-map-sprite.py 生成，不要手改。\n"
        "// 新增或替换 public/images/map/ 下的节点图标后重跑该脚本。\n"
        "\n"
        "/** sprite 整图尺寸（px） */\n"
        f"export const SPRITE_SHEET_WIDTH = {sheet_w};\n"
        f"export const SPRITE_SHEET_HEIGHT = {sheet_h};\n"
        "\n"
        "/** 图标 id -> 它在 sprite 里的矩形 [x, y, width, height]（px） */\n"
        "export const SPRITE_RECTS: Record<string, [number, number, number, number]> = {\n"
        f"{entries}\n"
        "};\n"
    )
    with io.open(MANIFEST_OUT, "w", encoding="utf-8", newline="\n") as f:
        f.write(manifest)

    print(f"icons={len(icons)} grid={cols}x{rows} sheet={sheet_w}x{sheet_h}")
    print(f"  {SPRITE_OUT}  {after / 1024:.1f}K")
    print(f"  singles total {before / 1024:.1f}K -> sprite {after / 1024:.1f}K")
    print(f"  {MANIFEST_OUT}")


if __name__ == "__main__":
    main()
