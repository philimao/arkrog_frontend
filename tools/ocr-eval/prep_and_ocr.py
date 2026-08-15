"""
本地 OCR 评测第一阶段：复刻前端压缩 → 本地 OCR → 产出与云端同构的 items。

产物：
  jpg/<name>.jpg      长边 1600 + JPEG q85，与生产上传给 OCR 的完全同参
  rgba/<name>.bin     上面这张 JPEG 解码后的 RGBA 原始像素（供 Node 侧的
                      detectBlankNodes 复用，等价于浏览器 canvas 的 getImageData）
  ocr-local.json      { name: { w, h, ms, items: [{t,x,y,w,h}] } }

items 的形状刻意跟后端 normalizeOcrResponse 一致：文本去空白 + 外接矩形。
"""

import json
import os
import sys
import time
from pathlib import Path

from PIL import Image

MAX_EDGE = 1600
JPEG_QUALITY = 85

# 产物默认落到仓库的 tmp/ocr-eval-data（与两个 .test.ts 的 DATA_DIR 默认值一致）
ROOT = Path(
    os.environ.get("OCR_EVAL_DIR")
    or Path(__file__).resolve().parents[2] / "tmp/ocr-eval-data"
)
# 82 张带 ground truth 的真实样张（文件名即答案：zone4_c_2.png → zone_4 / 基底 4c）
SAMPLES = Path(os.environ.get("OCR_EVAL_SAMPLES") or r"D:\repo\arkrog\tmp\samples")
JPG_DIR = ROOT / "jpg"
RGBA_DIR = ROOT / "rgba"


def peak_rss_mb() -> float:
    """Windows 下用 ctypes 拿进程峰值工作集"""
    try:
        import ctypes
        from ctypes import wintypes

        class PROCESS_MEMORY_COUNTERS(ctypes.Structure):
            _fields_ = [
                ("cb", wintypes.DWORD),
                ("PageFaultCount", wintypes.DWORD),
                ("PeakWorkingSetSize", ctypes.c_size_t),
                ("WorkingSetSize", ctypes.c_size_t),
                ("QuotaPeakPagedPoolUsage", ctypes.c_size_t),
                ("QuotaPagedPoolUsage", ctypes.c_size_t),
                ("QuotaPeakNonPagedPoolUsage", ctypes.c_size_t),
                ("QuotaNonPagedPoolUsage", ctypes.c_size_t),
                ("PagefileUsage", ctypes.c_size_t),
                ("PeakPagefileUsage", ctypes.c_size_t),
            ]

        counters = PROCESS_MEMORY_COUNTERS()
        counters.cb = ctypes.sizeof(counters)
        ok = ctypes.WinDLL("kernel32").K32GetProcessMemoryInfo(
            ctypes.WinDLL("kernel32").GetCurrentProcess(),
            ctypes.byref(counters),
            counters.cb,
        )
        return counters.PeakWorkingSetSize / 1024 / 1024 if ok else 0.0
    except Exception as exc:  # noqa: BLE001
        print(f"(峰值内存读取失败: {exc})")
        return 0.0


def compress(src: Path, dst: Path) -> tuple[int, int]:
    """复刻 compress.ts：长边缩到 1600，JPEG q85"""
    with Image.open(src) as im:
        im = im.convert("RGB")
        scale = min(1.0, MAX_EDGE / max(im.width, im.height))
        w = max(1, round(im.width * scale))
        h = max(1, round(im.height * scale))
        if (w, h) != (im.width, im.height):
            im = im.resize((w, h), Image.LANCZOS)
        im.save(dst, "JPEG", quality=JPEG_QUALITY)
    return w, h


def main() -> None:
    ROOT.mkdir(parents=True, exist_ok=True)
    JPG_DIR.mkdir(exist_ok=True)
    RGBA_DIR.mkdir(exist_ok=True)

    samples = sorted(
        [p for p in SAMPLES.iterdir() if p.suffix.lower() in (".png", ".jpg", ".jpeg")]
    )
    if not samples:
        sys.exit(f"没有样张：{SAMPLES}")

    from rapidocr import RapidOCR

    # 目标机是 2 vCPU，本机 32 核会把耗时测得毫无参考价值 —— 锁成 2 线程模拟目标机
    threads = int(os.environ.get("OCR_THREADS", "2"))
    print(f"初始化 RapidOCR (intra_op_num_threads={threads}) ...", flush=True)
    t0 = time.perf_counter()
    engine = RapidOCR(
        params={
            "EngineConfig.onnxruntime.intra_op_num_threads": threads,
            "EngineConfig.onnxruntime.inter_op_num_threads": threads,
        }
    )
    print(f"  初始化耗时 {time.perf_counter() - t0:.1f}s", flush=True)

    out: dict[str, dict] = {}
    for i, src in enumerate(samples, 1):
        name = src.stem
        jpg = JPG_DIR / f"{name}.jpg"
        w, h = compress(src, jpg)

        # 解码这张 JPEG 的像素，等价于浏览器把它画进 canvas 后 getImageData
        with Image.open(jpg) as im:
            (RGBA_DIR / f"{name}.bin").write_bytes(im.convert("RGBA").tobytes())

        t = time.perf_counter()
        res = engine(str(jpg))
        ms = (time.perf_counter() - t) * 1000

        items = []
        boxes = getattr(res, "boxes", None)
        txts = getattr(res, "txts", None) or []
        if boxes is not None:
            for box, txt in zip(boxes, txts):
                text = "".join(str(txt).split())
                if not text:
                    continue
                xs = [float(p[0]) for p in box]
                ys = [float(p[1]) for p in box]
                x, y = min(xs), min(ys)
                items.append(
                    {
                        "t": text,
                        "x": x,
                        "y": y,
                        "w": max(xs) - x,
                        "h": max(ys) - y,
                    }
                )

        out[name] = {"w": w, "h": h, "ms": round(ms, 1), "items": items}
        print(
            f"[{i:>2}/{len(samples)}] {name:<16} {w}x{h}  {len(items):>3} 段  {ms:>7.0f}ms",
            flush=True,
        )

    (ROOT / "ocr-local.json").write_text(
        json.dumps(out, ensure_ascii=False), encoding="utf-8"
    )

    times = [v["ms"] for v in out.values()]
    times_sorted = sorted(times)
    print()
    print(f"图数        : {len(out)}")
    print(f"平均检出    : {sum(len(v['items']) for v in out.values()) / len(out):.1f} 段/图")
    print(f"耗时 中位数 : {times_sorted[len(times_sorted) // 2]:.0f}ms")
    print(f"耗时 平均   : {sum(times) / len(times):.0f}ms")
    print(f"耗时 最大   : {max(times):.0f}ms")
    print(f"进程峰值内存: {peak_rss_mb():.0f} MB")
    print(f"JPEG 平均   : {sum(f.stat().st_size for f in JPG_DIR.glob('*.jpg')) / len(out) / 1024:.0f} KB")


if __name__ == "__main__":
    main()
