export interface Settings {
  theme: string;
}

export interface FavoriteItem {
  _id: string;
  type: "record" | "seed";
}

export interface UserInfo {
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
