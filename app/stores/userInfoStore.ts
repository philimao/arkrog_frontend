import { _get, _post, hashString } from "~/utils/tools";
import { defaultUserInfo, type UserInfo } from "~/types/userInfo";
import { create } from "zustand";
import { toast } from "react-toastify";
import { devtools } from "zustand/middleware";

type UserInfoStore = {
  userInfo?: UserInfo;
  loaded: boolean;
  login: (username: string, password: string) => Promise<boolean | undefined>;
  logout: () => Promise<void>;
  register: (email: string, password: string) => Promise<boolean | undefined>;
  updateUserInfo: (info: Partial<UserInfo>) => void;
  fetchUserInfo: () => Promise<void>;
};

export const useUserInfoStore = create<UserInfoStore>()(
  devtools(
    (set, get) => ({
      userInfo: undefined,
      loaded: false,
      login: async (username, password) => {
        try {
          const info: UserInfo | undefined = await _post("/user/login", {
            username,
            hash: await hashString(password),
          });
          if (info) {
            set({ userInfo: info }, undefined, "login");
            toast.info("登录成功！");
            return true;
          } else {
            toast.error("登录失败！");
          }
        } catch (err) {
          toast.error((err as Error).message);
        }
      },
      logout: async () => {
        try {
          await _get("/user/logout");
          set({ userInfo: defaultUserInfo }, undefined, "logout");
          toast.info("登出成功！");
        } catch (err) {
          toast.error((err as Error).message);
        }
      },
      register: async (email: string, password: string) => {
        try {
          const info: UserInfo | undefined = await _post("/user/register", {
            email,
            hash: await hashString(password),
          });
          if (info) {
            set({ userInfo: info }, undefined, "register");
            toast.info("注册成功！");
            return true;
          } else {
            toast.error("注册失败！");
          }
        } catch (err) {
          toast.error((err as Error).message);
        }
      },
      updateUserInfo: (info: Partial<UserInfo>) => {
        set(
          (state) => ({
            userInfo: { ...state.userInfo!, ...info },
          }),
          undefined,
          "updateUserInfo",
        );
      },
      fetchUserInfo: async () => {
        const info: UserInfo | undefined = await _get("/user/id");
        if (info) {
          set({ userInfo: info }, undefined, "fetchUserInfo");
        } else {
          set({ userInfo: defaultUserInfo }, undefined, "fetchUserInfo");
        }
        set({ loaded: true }, undefined, "fetchUserInfo");
        // console.log(get());
      },
    }),
    { name: "userInfo" },
  ),
);
