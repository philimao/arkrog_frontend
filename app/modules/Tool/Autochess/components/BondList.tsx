import { getPath, imageHost } from "~/utils/tools";

interface BondListItem {
  bondId: string;
  name: string;
  activeCount: number;
  count: number;
  active: boolean;
}

export default function BondList({ bonds }: { bonds: BondListItem[] }) {
  return (
    <section className="mb-8">
      <h3 className="text-lg font-bold mb-3">盟约列表</h3>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-3">
        {bonds.map((bond) => (
          <div
            key={bond.bondId}
            className="flex gap-3 border border-mid-gray bg-black-gray p-2"
            style={{ opacity: bond.active ? 1 : 0.7 }}
          >
            <img
              src={
                imageHost + getPath(`卫戍协议：盟约_icon_${bond.bondId}.png`)
              }
              alt="bond-logo"
              className="w-10 h-10 object-cover"
              onError={(evt) => {
                (evt.target as HTMLImageElement).onerror = null;
                (evt.target as HTMLImageElement).src = "/images/logo/logo.png";
              }}
            />
            <div className="overflow-hidden">
              <div className="font-semibold truncate">{bond.name}</div>
              <div className="text-xs text-light-gray">
                {bond.count}/{bond.activeCount}
              </div>
            </div>
          </div>
        ))}
        {bonds.length === 0 && (
          <div className="text-sm text-light-gray">
            将干员加入 Pick 池后显示盟约统计
          </div>
        )}
      </div>
    </section>
  );
}
