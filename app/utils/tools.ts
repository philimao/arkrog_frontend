import MD5 from "crypto-js/md5.js";

async function _get<T>(url: string): Promise<T> {
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

async function _post<T>(url: string, data: object): Promise<T> {
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

export async function _delete<T>(url: string): Promise<T> {
  return fetch(`${import.meta.env.VITE_API_BASE_URL}` + url, {
    method: "DELETE",
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
      r = ((d + r) % 16) | 0;
      d = Math.floor(d / 16);
    } else {
      r = ((d2 + r) % 16) | 0;
      d2 = Math.floor(d2 / 16);
    }
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/**
 * 哈希加密
 * @param password
 * @param [len]
 * @returns {Promise<string>}
 */
async function hashString(password: string, len: number = 64): Promise<string> {
  // 将密码转换为ArrayBuffer
  const passwordBuffer = new TextEncoder().encode(password);
  // 使用SHA-256哈希函数计算密码的哈希值
  const hashBuffer = await crypto.subtle.digest("SHA-256", passwordBuffer);
  // 将哈希值转换为十六进制字符串
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, len);
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

export const imageHost = "https://media.prts.wiki/";
export const assetsHost = "https://torappu.prts.wiki/assets/";

export const cosHost = "https://arkrog-1326514380.cos.ap-beijing.myqcloud.com";

export function getPath(filename: string): string {
  const md5 = MD5(filename).toString();
  return md5.slice(0, 1) + "/" + md5.slice(0, 2) + "/" + filename;
}

/**
 * 合并className，解决tailwindcss的类名定义顺序与className顺序不同，导致层叠效果没有生效的问题
 * @param className 原始className
 * @param override 覆盖className
 * @returns 合并后的className
 */
export function mergeClassNameSafe(
  className: string,
  override: string,
): string {
  let merged = className;
  for (const part of override.split(" ")) {
    if (!part.includes("-")) {
      merged += " " + part;
      continue;
    }
    const type = part.split("-").reverse().slice(1).reverse().join("-");
    const re = new RegExp(`${type}-[^\\d-]+`);
    if (merged.match(re)) {
      merged = merged.replace(re, part);
    } else {
      merged += " " + part;
    }
  }
  return merged;
}

/**
 * 将数字转换为罗马数字
 * @param num {number} 数字
 * @returns {string} 罗马数字
 */
export function intToRoman(num: number): string {
  if (!Number.isInteger(num)) {
    throw new Error("必须为整数");
  }
  const romanMap = [
    { value: 1000, symbol: "M" },
    { value: 900, symbol: "CM" },
    { value: 500, symbol: "D" },
    { value: 400, symbol: "CD" },
    { value: 100, symbol: "C" },
    { value: 90, symbol: "XC" },
    { value: 50, symbol: "L" },
    { value: 40, symbol: "XL" },
    { value: 10, symbol: "X" },
    { value: 9, symbol: "IX" },
    { value: 5, symbol: "V" },
    { value: 4, symbol: "IV" },
    { value: 1, symbol: "I" },
  ];

  let result = "";
  for (const { value, symbol } of romanMap) {
    while (num >= value) {
      result += symbol;
      num -= value;
    }
  }
  return result;
}

export { _get, _post, generateID, hashString, findDuplicates, mergeArray };
