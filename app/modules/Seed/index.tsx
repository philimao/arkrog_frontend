import { useUserInfoStore } from "~/stores/userInfoStore";
import { openModal } from "~/utils/dom";
import { toast } from "react-toastify";
import { Link } from "react-router";
import { SubNavbar } from "~/components/SubNavbar";
import { useState } from "react";
import SubmitSeedForm from "~/modules/Seed/SubmitSeedForm";

const navs = [
  { title: "全部" },
  { title: "胡种" },
  { title: "毒种" },
  { title: "工具种" },
  { title: "其他" },
];

export default function SeedIndex() {
  const [title, setTitle] = useState<string>(navs[0].title);

  async function handleSubmitSeed() {}

  return (
    <div>
      <div className="flex flex-wrap items-center mb-4">
        <span className="text-ak-blue me-auto">
          本版块截止至2025年2月14日16:00
        </span>
        <SubmitSeedForm />
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
