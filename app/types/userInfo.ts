export interface Settings {
  theme: string;
}

export interface UserInfo {
  username: string;
  settings: Settings;
}

export const defaultUserInfo: UserInfo = {
  username: "",
  settings: {
    theme: "dark",
  },
};
