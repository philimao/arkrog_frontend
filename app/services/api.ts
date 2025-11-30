import axios, { AxiosError } from "axios";
import { toast } from "react-toastify";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

// 创建 axios 实例
export const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// 响应拦截器 - 集中错误处理
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    // 提取错误信息
    let errorMessage = "请求失败";

    if (error.response) {
      // 服务器返回了错误响应
      const status = error.response.status;
      const data = error.response.data;

      if (data?.message) {
        errorMessage = data.message;
      } else if (status === 401) {
        errorMessage = "未登录或登录已过期";
      } else if (status === 403) {
        errorMessage = "没有权限执行此操作";
      } else if (status === 404) {
        errorMessage = "请求的资源不存在";
      } else if (status >= 500) {
        errorMessage = "服务器错误，请稍后重试";
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应
      errorMessage = "网络错误，请检查网络连接";
    } else {
      // 请求配置出错
      errorMessage = error.message;
    }

    toast.error(errorMessage);
    return Promise.reject(error);
  },
);
