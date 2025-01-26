import { create } from "zustand";
import type { User } from "~/types/user";

interface UserActions {
  updateUsername: (name: string) => void;
  updateSettings: (settings: object) => void;
}

export const useUserStore = create<User & UserActions>((set) => ({
  username: "",
  settings: {},
  updateUsername: (username: string) => set(() => ({ username: username })),
  updateSettings: (settings: object) => set(() => ({ settings: settings })),
}));
