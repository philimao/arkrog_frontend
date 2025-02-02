import type { SeedType } from "~/types/seedType";
import { SeedTypeColors, SeedTypes } from "~/types/constant";
import { SVGIcon } from "~/components/SVGIcon/SVGIcon";
import { toast } from "react-toastify";
import { _post } from "~/utils/tools";
import { type Dispatch, type SetStateAction, useState } from "react";
import { useUserInfoStore } from "~/stores/userInfoStore";
import type { FavoriteItem } from "~/types/userInfo";
import { openModal } from "~/utils/dom";

export default function SeedCard({
  seed,
  setSeeds,
}: {
  seed: SeedType;
  setSeeds?: Dispatch<SetStateAction<SeedType[]>>;
}) {
  const { userInfo, updateUserInfo } = useUserInfoStore();
  const [expand, setExpand] = useState(false);

  async function handleDeleteSeed() {
    if (window.confirm("是否确定删除该种子？")) {
      _post("/seed/delete", { _id: seed._id });
      setSeeds?.((prev) => {
        const updated = [...prev];
        const index = updated.findIndex((s) => s._id === seed._id);
        updated.splice(index, 1);
        return updated;
      });
    }
  }

  async function handleStarSeed() {
    if (!seed?._id) return;
    try {
      const favorite = await _post<FavoriteItem[]>("/user/favorite", {
        operate: starred ? "remove" : "add",
        item: { _id: seed._id, type: "seed" },
      });
      updateUserInfo({ favorite });
    } catch (error) {
      toast.warning((error as Error).message);
    }
  }

  const starred =
    seed?._id && userInfo?.favorite?.find((item) => item._id === seed._id);

  return (
    <div className="bg-semi-black px-6 pt-6 pb-4 flex flex-col">
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
          {!!userInfo?.level && userInfo?.level > 2 && (
            <SVGIcon
              name="delete"
              onClick={handleDeleteSeed}
              className="w-6 h-6 text-transparent hover:text-ak-blue"
              role="button"
            />
          )}
          {expand ? (
            <SVGIcon
              name="min"
              className="w-6 h-6 hover:text-ak-blue"
              role="button"
              onClick={() => setExpand(false)}
            />
          ) : (
            <SVGIcon
              name="max"
              className="w-6 h-6 hover:text-ak-blue"
              role="button"
              onClick={() => setExpand(true)}
            />
          )}
          <SVGIcon
            name="copy"
            className="w-6 h-6 hover:text-ak-blue"
            role="button"
            onClick={() =>
              navigator.clipboard
                .writeText(seed.code)
                .then(() => toast.info("已拷贝至剪贴板"))
            }
          />
          <SVGIcon
            name="star-hollow"
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
          "min-h-40 max-h-[12rem] overflow-y-auto my-2 flex-grow" +
          (expand ? " max-h-fit" : "")
        }
      >
        <div className="whitespace-pre-wrap">{seed.note}</div>
      </div>
      <div className="flex-grow" />
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
            className="h-8 w-8 me-2"
            style={{ borderRadius: "50%" }}
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
        <div className="flex gap-2">
          {seed.url && (
            <a href={seed.url} target="_blank" rel="noopener noreferrer">
              <SVGIcon
                name="bilibili"
                className="w-6 h-6 hover:text-ak-blue me-1"
                style={{ color: "#FB7299" }}
                role="button"
              />
            </a>
          )}
          <SVGIcon
            name="comment"
            className="w-6 h-6 hover:text-ak-blue"
            role="button"
          />
          <SVGIcon
            name="thumb-up"
            className="w-6 h-6 hover:text-ak-blue"
            role="button"
          />
          <SVGIcon
            name="thumb-up"
            className="w-6 h-6 rotate-180"
            role="button"
          />
        </div>
      </div>
    </div>
  );
}
