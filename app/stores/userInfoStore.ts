import { _get, _post, hashPassword } from "~/utils/tools";
import { defaultUserInfo, type UserInfo } from "~/types/userInfo";
import { create } from "zustand";
import { toast } from "react-toastify";

type UserInfoStore = {
  userInfo: UserInfo | null;
  login: (username: string, password: string) => Promise<boolean | undefined>;
  logout: () => Promise<void>;
  register: (email: string, password: string) => Promise<boolean | undefined>;
  updateUserInfo: (info: UserInfo) => void;
  fetchUserInfo: () => Promise<void>;
};

export const useUserInfoStore = create<UserInfoStore>((set) => ({
  userInfo: null,
  login: async (username, password) => {
    try {
      const info: UserInfo | undefined = await _post("/user/login", {
        username,
        hash: await hashPassword(password),
      });
      if (info) {
        set({ userInfo: info });
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
      set({ userInfo: defaultUserInfo });
      toast.info("登出成功！");
    } catch (err) {
      toast.error((err as Error).message);
    }
  },
  register: async (email: string, password: string) => {
    try {
      const info: UserInfo | undefined = await _post("/user/register", {
        email,
        hash: await hashPassword(password),
      });
      if (info) {
        set({ userInfo: info });
        toast.info("注册成功！");
        return true;
      } else {
        toast.error("注册失败！");
      }
    } catch (err) {
      toast.error((err as Error).message);
    }
  },
  updateUserInfo: (info: UserInfo) => {
    set((state) => ({
      userInfo: { ...state.userInfo, ...info },
    }));
  },
  fetchUserInfo: async () => {
    const info: UserInfo | undefined = await _get("/user/id");
    if (info) {
      set({ userInfo: info });
    } else {
      set({ userInfo: defaultUserInfo });
    }
  },
}));
