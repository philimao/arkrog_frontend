import { Button, Input } from "@heroui/react";
import React, { useState } from "react";
import { _post } from "~/utils/tools";
import { toast } from "react-toastify";
import { useUserInfoStore } from "~/stores/userInfoStore";
import type { UserInfo } from "~/types/userInfo";

export default function LinkBilibili() {
  const [value, setValue] = useState<string>("");
  const { updateUserInfo } = useUserInfoStore();

  async function handleSubmit() {
    try {
      const text = "{" + value.split("{").slice(1).join("{");
      const info = await _post<UserInfo>("/user/link", JSON.parse(text));
      if (info) {
        updateUserInfo(info);
        toast.success("账户链接成功！");
      } else {
        console.log("链接失败！");
      }
    } catch (err) {
      if (err instanceof SyntaxError) {
        toast.error("复制信息格式有误！请检查是否完整复制");
      } else {
        toast.error((err as Error).message);
      }
    }
  }

  async function handleClick() {
    const handleFocus = async () => {
      let text;
      try {
        text = await navigator.clipboard.readText();
        text = "{" + text.split("{").slice(1).join("{");
        const json = JSON.parse(text);
        setValue(JSON.stringify(json, null, 2));
        window.removeEventListener("focus", handleFocus);
      } catch (err) {
        console.log(err);
        console.log("剪贴板内容格式错误");
        console.log(text);
      }
    };
    window.addEventListener("focus", handleFocus, { once: true });
  }

  return (
    <div className="relative">
      <div className="text-3xl font-bold mb-8">账户链接</div>
      <div className="mb-4">
        点击下方右侧
        <strong className="text-ak-blue text-lg">获取基本信息</strong>
        按钮，在打开的页面中复制
        <strong className="text-ak-blue text-lg">所有内容</strong>
        ，返回该页面后将会自动粘贴账号信息。在粘贴信息后，点击
        <strong className="text-ak-blue text-lg">关联账户</strong>
        即可与Bilibili账户关联。
        <br />
        获取信息仅含有个人主页公开信息，不含有敏感信息部分
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="请在此处粘贴获取的信息"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full p-2 bg-dark-gray focus:outline focus:outline-2 focus:outline-ak-blue text-white"
        />
        <Button className="text-sm font-bold p-2 rounded-md text-white bg-dark-gray shrink-0">
          <a
            onClick={handleClick}
            target="_blank"
            rel="noopener noreferrer"
            href="https://api.bilibili.com/x/space/myinfo"
          >
            获取基本信息
          </a>
        </Button>
        <Button
          className="text-sm font-bold p-2 rounded-md text-white bg-dark-gray shrink-0"
          onPress={handleSubmit}
        >
          关联账户
        </Button>
      </div>
    </div>
  );
}
