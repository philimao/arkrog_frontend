import COS from "cos-js-sdk-v5";
import { _get } from "./tools.js";
import { toast } from "react-toastify";

interface STSAuth {
  TmpSecretId: string;
  TmpSecretKey: string;
  SessionToken: string;
  StartTime: number;
  ExpiredTime: number;
}

const cos = new COS({
  getAuthorization: async function (options, callback) {
    // 时间戳防 CDN 缓存：临时密钥被缓存会导致签名过期（Request has expired）
    _get<STSAuth>(`/storage/sts?t=${Date.now()}`)
      .then((data) => {
        if (!data) return;
        callback({
          TmpSecretId: data.TmpSecretId,
          TmpSecretKey: data.TmpSecretKey,
          SecurityToken: data.SessionToken,
          StartTime: data.StartTime,
          ExpiredTime: data.ExpiredTime,
          // ScopeLimit: true,
        });
      })
      .catch((err) => {
        toast.error("获取临时密钥失败\n" + err.message);
      });
  },
});

export { cos };
