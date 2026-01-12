// B 站搜索相关类型定义
export interface SearchUserItem {
  mid: number;
  uname: string;
  upic: string;
  fans: number;
  sign: string;
  room_id: number;
  level: number;
  gender: number;
  is_live: boolean;
  is_upuser: boolean;
}

export interface SearchUserData {
  result: SearchUserItem[];
  numResults?: number;
  numPages?: number;
  page?: number;
  pageSize?: number;
}

export interface SearchUserResponse {
  code: number;
  message: string;
  data?: SearchUserData;
  requestUrl?: string;
}
