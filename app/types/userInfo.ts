export interface Settings {
  theme: string;
}

export interface UserInfo {
  username: string;
  face?: string;
  level: number;
  settings: Settings;
}

export const defaultUserInfo: UserInfo = {
  username: "",
  level: 0,
  settings: {
    theme: "dark",
  },
};
