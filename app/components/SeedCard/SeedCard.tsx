import type { SeedType } from "~/types/seedType";
import { SeedTypeColors, SeedTypes } from "~/types/constant";
import { toast } from "react-toastify";
import { type Dispatch, type SetStateAction, useState } from "react";
import { useUserInfoStore } from "~/stores/userInfoStore";
import { openModal } from "~/utils/dom";
import {
  MaxIcon,
  MinIcon,
  BilibiliIcon,
  DeleteIcon,
  StarHollowIcon,
  CopyIcon,
  CommentIcon,
  ThumbUpIcon,
} from "../Icons";
import { seedApi } from "~/services/seed";
import { CommentSection } from "./CommentSection";

export default function SeedCard({
  seed,
  setSeeds,
}: {
  seed: SeedType;
  setSeeds?: Dispatch<SetStateAction<SeedType[]>>;
}) {
  const { userInfo, updateUserInfo } = useUserInfoStore();
  const [expand, setExpand] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [metadata, setMetadata] = useState(seed.metadata);

  async function handleDeleteSeed() {
    if (window.confirm("是否确定删除该种子？")) {
      try {
        await seedApi.delete(seed._id);
        setSeeds?.((prev) => prev.filter((s) => s._id !== seed._id));
      } catch (error) {
        toast.error((error as Error).message);
      }
    }
  }

  async function handleStarSeed() {
    if (!seed?._id) return;
    try {
      const favorite = await seedApi.toggleFavorite(
        seed._id,
        starred ? "remove" : "add",
      );
      updateUserInfo({ favorite });
    } catch (error) {
      toast.warning((error as Error).message);
    }
  }

  async function handleAction(action: "like" | "dislike") {
    if (!userInfo?.level) {
      return openModal("login");
    }

    try {
      // 如果点击当前状态,则取消
      const newAction = metadata?.userAction === action ? "none" : action;
      const updatedMetadata = await seedApi.action(seed._id, newAction);
      setMetadata(updatedMetadata);
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(seed.code);
      toast.info("已拷贝至剪贴板");

      // 后台计数(不等待)
      seedApi.copy(seed._id).catch(console.error);
    } catch (error) {
      toast.error("复制失败");
    }
  }

  const starred =
    seed?._id && userInfo?.favorite?.find((item) => item._id === seed._id);

  return (
    <div className="bg-semi-black px-6 pt-6 pb-4 flex flex-col relative">
      <div className="flex">
        <div className="text-lg font-bold me-auto">
          <span
            className={"text-" + SeedTypeColors[seed.type]}
          >{`【${SeedTypes[seed.type]}】`}</span>
          <span className="" style={{ textOverflow: "ellipsis" }}>
            {seed.title}
          </span>
        </div>
        <div className="flex gap-2">
          {!!userInfo?.level && userInfo?.level > 3 && (
            <DeleteIcon
              onClick={handleDeleteSeed}
              className="w-6 h-6 text-transparent hover:text-ak-blue"
              role="button"
            />
          )}
          {expand ? (
            <MinIcon
              className="w-6 h-6 hover:text-ak-blue"
              role="button"
              onClick={() => setExpand(false)}
            />
          ) : (
            <MaxIcon
              className="w-6 h-6 hover:text-ak-blue"
              role="button"
              onClick={() => setExpand(true)}
            />
          )}
          <CopyIcon
            className="w-6 h-6 hover:text-ak-blue"
            role="button"
            onClick={handleCopy}
          />
          <StarHollowIcon
            className="w-6 h-6 hover:text-ak-blue"
            role="button"
            onClick={() => {
              if (!userInfo?.level) {
                return openModal("login");
              }
              handleStarSeed();
            }}
          />
        </div>
      </div>
      <div
        className={
          "min-h-40 max-h-[12rem] overflow-y-auto my-2 grow" +
          (expand ? " max-h-fit" : "")
        }
      >
        <div className="whitespace-pre-wrap">{seed.note}</div>
      </div>
      <div className="grow" />
      <div className="flex flex-wrap gap-2 mt-2 mb-4">
        {seed.labels.map((label) => (
          <span
            className="px-3 py-0.5 text-xs font-light bg-mid-gray"
            key={label}
          >
            {label}
          </span>
        ))}
      </div>
      <hr className="border-ak-blue" />
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center">
          <img
            className="h-8 w-8 me-2 rounded-full"
            src={seed.raiderImage}
            alt="raider"
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
          />
          <span>{seed.raider}</span>
        </div>
        <div className="text-sm max-sm:w-16">
          {new Date(seed.date_created).toLocaleString("zh-CN")}
        </div>
        <div className="flex gap-3 items-center">
          {seed.url && (
            <a href={seed.url} target="_blank" rel="noopener noreferrer">
              <BilibiliIcon
                className="w-6 h-6 hover:text-ak-blue me-1"
                style={{ color: "#FB7299" }}
                role="button"
              />
            </a>
          )}

          {/* 评论 */}
          <div className="flex items-center gap-1">
            <CommentIcon
              className="w-6 h-6 hover:text-ak-blue cursor-pointer"
              role="button"
              onClick={() => setShowComments(!showComments)}
            />
            <span className="text-sm">{metadata?.comments || 0}</span>
          </div>

          {/* 点赞 */}
          <div className="flex items-center gap-1">
            <ThumbUpIcon
              className={`w-6 h-6 cursor-pointer ${
                metadata?.userAction === "like"
                  ? "text-ak-blue"
                  : "hover:text-ak-blue"
              }`}
              role="button"
              onClick={() => handleAction("like")}
            />
            <span className="text-sm">{metadata?.likes || 0}</span>
          </div>

          {/* 点踩 */}
          <div className="flex items-center gap-1">
            <ThumbUpIcon
              className={`w-6 h-6 rotate-180 cursor-pointer ${
                metadata?.userAction === "dislike"
                  ? "text-red-500"
                  : "hover:text-red-500"
              }`}
              role="button"
              onClick={() => handleAction("dislike")}
            />
            <span className="text-sm">{metadata?.dislikes || 0}</span>
          </div>
        </div>
      </div>

      {/* 评论区 */}
      {showComments && (
        <CommentSection
          seedId={seed._id}
          onCommentCountChange={(count) =>
            setMetadata((prev) => ({ ...prev!, comments: count }))
          }
        />
      )}
    </div>
  );
}
