import type { AutochessBond } from "~/types/autochess";
import { getPath, imageHost } from "~/utils/tools";
import { StyledTitle } from "~/modules/Tool/components/Shared";

/**
 * 转职速查：道具 → 盟约 的映射关系（变形同构体装备转职规则）
 */
const ITEM_BOND_MAPPING: { itemName: string; bondName: string }[] = [
  { itemName: "炎国短刀", bondName: "炎" },
  { itemName: "维式重锤", bondName: "维多利亚" },
  { itemName: "阿戈尔重刃", bondName: "阿戈尔" },
  { itemName: "坚守盾牌", bondName: "坚守" },
  { itemName: "萨尔贡浓茶", bondName: "萨尔贡" },
  { itemName: "不屈弹射器", bondName: "不屈" },
  { itemName: "拉特兰桥夹", bondName: "拉特兰" },
  { itemName: "谢拉格不融冰", bondName: "谢拉格" },
  { itemName: "精准狙击镜", bondName: "精准" },
  { itemName: "突袭手雷", bondName: "突袭" },
  { itemName: "迅捷作战粮", bondName: "迅捷" },
  { itemName: "卡西米尔竞技旗", bondName: "卡西米尔" },
  { itemName: "叙拉古正装", bondName: "叙拉古" },
  { itemName: "奥术法阵", bondName: "奥术" },
];

function findBondByName(bonds: AutochessBond[], bondName: string) {
  return bonds.find((b) => b.name === bondName || b.name.includes(bondName));
}

interface ClassChangeQuickRefProps {
  bonds: AutochessBond[];
}

export default function ClassChangeQuickRef({
  bonds,
}: ClassChangeQuickRefProps) {
  return (
    <section className="mb-8">
      <StyledTitle>转职速查</StyledTitle>
      <p className="text-sm text-light-gray mb-4">
        变形同构体：携带者获得额外盟约（由另一件携带装备而定）
      </p>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-4 bg-black-gray-70 p-4">
        {ITEM_BOND_MAPPING.map(({ itemName, bondName }) => {
          const bond = findBondByName(bonds, bondName);
          const bondIconSrc = bond
            ? imageHost + getPath(`卫戍协议：盟约_icon_${bond.bondId}.png`)
            : "/images/logo/logo.png";
          const itemImgSrc =
            imageHost + getPath(`卫戍协议_道具_${itemName}.png`);

          return (
            <div
              key={itemName}
              className="flex flex-col items-center justify-center gap-2 p-3"
            >
              <div className="flex items-center gap-2 w-full justify-center">
                <div className="flex flex-col items-center gap-1">
                  <img
                    src={itemImgSrc}
                    alt={itemName}
                    loading="lazy"
                    className="w-12 h-12 object-cover rounded"
                    onError={(evt) => {
                      (evt.target as HTMLImageElement).onerror = null;
                      (evt.target as HTMLImageElement).src =
                        "/images/logo/logo.png";
                    }}
                  />
                  <span className="text-xs text-center">{itemName}</span>
                </div>
                <span className="text-light-gray text-lg">→</span>
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <img
                    src={bondIconSrc}
                    alt={bondName}
                    loading="lazy"
                    className="w-12 h-12 min-w-12 min-h-12 object-contain rounded"
                    onError={(evt) => {
                      (evt.target as HTMLImageElement).onerror = null;
                      (evt.target as HTMLImageElement).src =
                        "/images/logo/logo.png";
                    }}
                  />
                  <span className="text-xs text-center">
                    {bond?.name ?? bondName}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
