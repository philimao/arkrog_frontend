export const AUTOCHESS_TEMPLATE_FILES = [
  "特训敌人_元素.png",
  "特训敌人_特异.png",
  "特训敌人_折射.png",
  "特训敌人_飞行.png",
  "特训敌人_隐匿.png",
  "特训敌人_持续.png",
  "特训敌人_频次.png",
] as const;

function joinUrl(base: string, suffix: string) {
  const normalizedBase = base.replace(/\/+$/, "");
  const normalizedSuffix = suffix.replace(/^\/+/, "");
  return `${normalizedBase}/${normalizedSuffix}`;
}

export function buildTemplateUrls(basePath?: string) {
  const apiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
  const resolvedBasePath =
    basePath || (apiBase ? joinUrl(apiBase, "images/autochess") : "/images/autochess");
  return AUTOCHESS_TEMPLATE_FILES.map((fileName) => {
    return `${resolvedBasePath}/${encodeURIComponent(fileName)}`;
  });
}
