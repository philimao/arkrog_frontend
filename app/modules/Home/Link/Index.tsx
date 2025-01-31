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
      <div className="flex">
        <Input value={value} onValueChange={setValue} radius="none" />
        <Button radius="none" className="border border-white">
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
          radius="none"
          className="border border-white"
          onPress={handleSubmit}
        >
          关联账户
        </Button>
      </div>
    </div>
  );
}
