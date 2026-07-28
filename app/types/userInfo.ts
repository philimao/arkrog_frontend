export interface Settings {
  theme: string;
}

export interface FavoriteItem {
  _id: string;
  type: "record" | "seed";
}

export interface UserInfo {
  /** 用户ID（/user/id 实际返回，用于"自己提交的记录"判定） */
  userId?: string;
  username: string;
  face?: string;
  level: number;
  settings: Settings;
  favorite: FavoriteItem[];
}

export const defaultUserInfo: UserInfo = {
  username: "",
  level: 0,
  settings: {
    theme: "dark",
  },
  favorite: [],
};
