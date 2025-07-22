"use client";

interface VersionData<Data> {
  version: number;
  data: Data;
}

/**
 * 带有版本控制的本地存储
 * 版本随项目版本更新，如果版本不匹配，则清空本地存储
 */
export class VersionLocalStorage<Data> {
  static get<Data>(name: string): VersionData<Data> | null {
    const storage = window.localStorage.getItem(name);
    if (storage) {
      const data = JSON.parse(storage);
      return data;
    }
    return null;
  }

  static set<Data>(name: string, data: VersionData<Data>) {
    localStorage.setItem(name, JSON.stringify(data));
  }

  static remove(name: string) {
    localStorage.removeItem(name);
  }

  constructor(
    public readonly name: string,
    public readonly version: number,
  ) {
    // const storage = globalThis.localStorage.getItem(name);
    // if (storage) {
    //   const data = JSON.parse(storage);
    //   if (data.version !== version) {
    //     localStorage.removeItem(name);
    //   }
    // }
  }

  /**
   * 读取本地存储
   */
  read(): Data | null {
    const data = VersionLocalStorage.get<Data>(this.name);
    if (data) {
      return data.data;
    }
    return null;
  }

  /**
   * 写入本地存储
   */
  write(data: Data): void {
    VersionLocalStorage.set(this.name, { version: this.version, data: data });
  }

  /**
   * 删除本地存储
   */
  clear(): void {
    VersionLocalStorage.remove(this.name);
  }
}
