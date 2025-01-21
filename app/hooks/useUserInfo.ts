import { useCallback, useEffect, useState } from "react";
import { _get } from "~/utils/tools";

type Username = string;

interface Settings {
  theme: string;
}

interface UserInfo {
  username: Username;
  settings: Settings;
}

const defaultUserInfo: UserInfo = {
  username: "短脖兔1号",
  settings: {
    theme: "default",
  },
};

export function useUserInfo() {
  const [username, setUsername] = useState<Username>(defaultUserInfo.username);
  const [settings, setSettings] = useState<Settings>(defaultUserInfo.settings);

  const getUserInfo = useCallback(async () => {
    const result: UserInfo | null = await _get<UserInfo>("/user/id");
    if (result) {
      setUsername(result.username);
      setSettings(result.settings);
    }
  }, []);

  useEffect(() => {
    getUserInfo();
  }, [getUserInfo]);

  const refreshUserInfo = () => getUserInfo();

  return { username, settings, refreshUserInfo };
}
