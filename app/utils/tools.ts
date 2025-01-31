async function _get<T>(url: string): Promise<T | undefined> {
  return fetch(`${import.meta.env.VITE_API_BASE_URL}` + url, {
    credentials: "include",
  }).then(
    async (response: Response) => {
      if (response.ok) {
        return response
          .clone()
          .json()
          .catch(() => response.text());
      } else {
        const text = await response.text();
        throw new Error(text);
      }
    },
    (err: Error) => {
      console.log(err);
      throw err;
    },
  );
}

async function _post<T>(url: string, data: object): Promise<T | undefined> {
  return fetch(`${import.meta.env.VITE_API_BASE_URL}` + url, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then(
    async (response: Response) => {
      if (response.ok) {
        return response
          .clone()
          .json()
          .catch(() => response.text());
      } else {
        const text = await response.text();
        throw new Error(text);
      }
    },
    (err: Error) => {
      console.log(err);
      throw err;
    },
  );
}

/**
 * 生成32位随机字符串
 * @returns {string} 随机字符串
 */
function generateID(len: number = 32): string {
  let d = new Date().getTime();
  let d2 = (performance && performance.now && performance.now() * 1000) || 0;
  return "x".repeat(len).replace(/[xy]/g, function (c) {
    let r = Math.random() * 16; //random number between 0 and 16
    if (d > 0) {
      r = (d + r) % 16 | 0;
      d = Math.floor(d / 16);
    } else {
      r = (d2 + r) % 16 | 0;
      d2 = Math.floor(d2 / 16);
    }
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/**
 * 哈希加密
 * @param password
 * @returns {Promise<string>}
 */
async function hashPassword(password: string): Promise<string> {
  try {
    // 将密码转换为ArrayBuffer
    const passwordBuffer = new TextEncoder().encode(password);
    // 使用SHA-256哈希函数计算密码的哈希值
    const hashBuffer = await crypto.subtle.digest("SHA-256", passwordBuffer);
    // 将哈希值转换为十六进制字符串
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch (err) {
    console.error(err);
    return "";
  }
}

function findDuplicates<T>(array: T[]) {
  const seen = new Set();
  const duplicates = new Set();
  for (const item of array) {
    if (seen.has(item)) {
      duplicates.add(item);
    } else {
      seen.add(item);
    }
  }
  return Array.from(duplicates);
}

function mergeArray<T>(target: T[], source: T[]): T[] {
  const merged = [...target];
  if (source.length > merged.length) {
    merged.length = source.length;
  }
  source.forEach((item, index) => {
    merged[index] = item;
  });
  return merged;
}

export { _get, _post, generateID, hashPassword, findDuplicates, mergeArray };
