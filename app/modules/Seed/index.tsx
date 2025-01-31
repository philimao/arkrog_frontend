import { useUserInfoStore } from "~/stores/userInfoStore";
import { openModal } from "~/utils/dom";
import { toast } from "react-toastify";
import { Link } from "react-router";
import { SubNavbar } from "~/components/SubNavbar";
import { useState } from "react";

const navs = [
  { title: "全部" },
  { title: "胡种" },
  { title: "毒种" },
  { title: "工具种" },
  { title: "其他" },
];

export default function SeedIndex() {
  const { userInfo } = useUserInfoStore();
  const [title, setTitle] = useState<string>(navs[0].title);

  async function handleSubmitSeed() {
    if (!userInfo) {
      return openModal("login");
    } else if (userInfo.level < 2) {
      return toast.warning(
        "投稿功能需链接B站信息后使用！请点击右上角前往个人中心绑定身份",
      );
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center mb-4">
        <span className="text-ak-blue me-auto">
          本版块截止至2025年2月14日16:00
        </span>
        <button className="text-lg bg-ak-blue font-bold text-black px-6 py-2">
          投稿种子
        </button>
      </div>
      <div className="mb-4 px-6 py-4 bg-semi-black">
        投稿须知：
        <br />
        本版块投稿需要链接B站账号，可以点击
        <Link to="/home/link-bilibili" className="text-ak-blue">
          此处
        </Link>
        前往
        <br />
        Lorem ipsum dolor sit amet, consectetur adipisicing elit. Assumenda
        dolores eligendi, itaque maxime, nemo quidem recusandae repellat,
        repellendus rerum saepe soluta tenetur vitae voluptatibus. Adipisci
        earum est facere magni similique?
      </div>
      <SubNavbar navs={navs} title={title} setTitle={setTitle} />
    </div>
  );
}
