import { api } from "./api";
import type { SearchUserResponse } from "~/types/bilibili";

// 杂项服务：B 站搜索等
export const miscServices = {
  searchBilibiliUsers: (keyword: string, page = 1, pageSize = 20) =>
    api.get<SearchUserResponse>("/misc/search-users", {
      params: { keyword, page, pageSize },
    }),
};
