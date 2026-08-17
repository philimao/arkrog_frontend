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
  /** 拉取当前会话的用户身份。同一会话内只真正请求一次，传 force 可强制重取 */
  fetchUserInfo: (force?: boolean) => Promise<void>;
};

// 会话内去重用的在途请求句柄。/user/id 是会话态查询，不能进 localStorage
// （登录/登出/会话过期都会让本地副本失真），只能做"同一次访问内不重复问"。
let inFlight: Promise<void> | undefined;

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
      fetchUserInfo: async (force = false) => {
        if (!force) {
          // 已经问过就不再问：RootLayout 挂载时已经拉过一次，
          // 路由组件不需要各自再来一遍（CDN 明细里 /api/user/id 5683 次/日，
          // 而 app 启动只有 3374 次/日，1.68 倍就是这么来的）
          if (get().loaded) return;
          if (inFlight) return inFlight;
        }
        const run = async () => {
          try {
            const info: UserInfo | undefined = await _post("/user/id", {});
            if (info) {
              set({ userInfo: info }, undefined, "fetchUserInfo");
            } else {
              set({ userInfo: defaultUserInfo }, undefined, "fetchUserInfo");
            }
            set({ loaded: true }, undefined, "fetchUserInfo");
            // console.log(get());
          } catch (err) {
            console.error(err);
            toast.error(`加载用户信息失败！`);
          }
        };
        inFlight = run().finally(() => {
          inFlight = undefined;
        });
        return inFlight;
      },
    }),
    { name: "userInfo" },
  ),
);
