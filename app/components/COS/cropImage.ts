import type { Area } from "react-easy-crop";

/**
 * 加载图片
 */
const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
};

/**
 * 创建裁剪后的图片
 * @param imageSrc - 图片源URL
 * @param croppedAreaPixels - 裁剪区域像素坐标
 * @returns 裁剪后的图片Blob
 */
export const createCroppedImage = async (
  imageSrc: string,
  croppedAreaPixels: Area,
): Promise<Blob> => {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("无法创建 canvas context");
  }

  // 设置canvas尺寸为裁剪区域大小
  canvas.width = croppedAreaPixels.width;
  canvas.height = croppedAreaPixels.height;

  // 绘制裁剪后的图片
  ctx.drawImage(
    image,
    croppedAreaPixels.x,
    croppedAreaPixels.y,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
    0,
    0,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
  );

  // 转换为Blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Canvas转换Blob失败"));
        }
      },
      "image/jpeg",
      0.95,
    );
  });
};
