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
 * 根据文件大小计算webp压缩率
 * @param fileSize - 文件大小（字节）
 * @returns 压缩率（0.75-0.95）
 */
const getWebpQuality = (fileSize: number): number => {
  // 文件大小范围（假设1MB以下为小文件，5MB以上为大文件）
  const minSize = 1024 * 1024; // 1MB
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (fileSize <= minSize) return 0.95; // 小文件高质量
  if (fileSize >= maxSize) return 0.75; // 大文件低质量

  // 线性插值：文件越大，质量越低
  const ratio = (fileSize - minSize) / (maxSize - minSize);
  const quality = 0.95 - ratio * 0.2; // 从0.95降到0.75

  // 按0.05步进取整
  return Math.round(quality / 0.05) * 0.05;
};

/**
 * 等比缩放图片
 * @param image - 原始图片
 * @param maxWidth - 最大宽度
 * @returns 缩放后的canvas
 */
const resizeImage = (
  image: HTMLImageElement,
  maxWidth: number,
): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("无法创建 canvas context");
  }

  // 计算缩放比例
  const scale = maxWidth / image.width;
  const newWidth = Math.min(image.width * scale, image.width);
  const newHeight = image.height * (newWidth / image.width);

  canvas.width = newWidth;
  canvas.height = newHeight;

  // 绘制缩放后的图片
  ctx.drawImage(image, 0, 0, newWidth, newHeight);

  return canvas;
};

/**
 * 压缩并转换图片为webp格式
 * @param file - 原始文件
 * @param uploadType - 上传类型（"赛事头像" | "队伍头像" | 其他）
 * @param customFilename - 自定义文件名（可选，不包含扩展名）
 * @returns 压缩后的webp文件和新的文件名信息
 */
export const compressImageForUpload = async (
  file: File,
  uploadType: string,
  customFilename?: string,
): Promise<{ file: File; filename: string; ext: string }> => {
  // 创建图片预览URL
  const imageUrl = URL.createObjectURL(file);
  let image: HTMLImageElement;

  try {
    image = await loadImage(imageUrl);
  } finally {
    // 清理URL
    URL.revokeObjectURL(imageUrl);
  }

  // 根据上传类型确定最大宽度
  let maxWidth: number;
  if (uploadType === "赛事头像" || uploadType === "队伍头像") {
    maxWidth = 512;
  } else {
    maxWidth = 1080;
  }

  // 计算新的文件名（去掉扩展名）和扩展名
  const originalName = file.name;
  const filename = customFilename || originalName.replace(/\.[^/.]+$/, ""); // 去掉扩展名
  const ext = "webp";

  // 如果图片宽度已经小于等于最大宽度，无需缩放
  if (image.width <= maxWidth) {
    // 直接转换为webp格式
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("无法创建 canvas context");
    }

    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);

    const quality = getWebpQuality(file.size);

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const webpFile = new File([blob], `${filename}.webp`, {
              type: "image/webp",
            });
            resolve({ file: webpFile, filename, ext });
          } else {
            reject(new Error("转换webp失败"));
          }
        },
        "image/webp",
        quality,
      );
    });
  }

  // 缩放图片
  const resizedCanvas = resizeImage(image, maxWidth);
  const quality = getWebpQuality(file.size);

  // 转换为webp
  return new Promise((resolve, reject) => {
    resizedCanvas.toBlob(
      (blob) => {
        if (blob) {
          const webpFile = new File([blob], `${filename}.webp`, {
            type: "image/webp",
          });
          resolve({ file: webpFile, filename, ext });
        } else {
          reject(new Error("转换webp失败"));
        }
      },
      "image/webp",
      quality,
    );
  });
};
