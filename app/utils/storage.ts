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
    _get<STSAuth>("/storage/sts")
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
