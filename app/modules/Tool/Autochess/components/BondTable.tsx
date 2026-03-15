import type { AutochessBond } from "~/types/autochess";
import { getBondActiveMethodLabel, parseBondDesc } from "../utils/autochess";
import { getPath, imageHost } from "~/utils/tools";

export default function BondTable({ bonds }: { bonds: AutochessBond[] }) {
  return (
    <section className="mb-8">
      <h2 className="text-2xl font-bold mb-3">盟约一览</h2>
      <div className="overflow-x-auto border border-mid-gray">
        <table className="w-full table-auto bg-black-gray-70">
          <thead>
            <tr className="text-left border-b border-mid-gray">
              <th className="p-3 whitespace-nowrap">图片</th>
              <th className="p-3 whitespace-nowrap">盟约名称</th>
              <th className="p-3 whitespace-nowrap">激活人数</th>
              <th className="p-3 whitespace-nowrap">激活方式</th>
              <th className="p-3 whitespace-nowrap">盟约描述</th>
            </tr>
          </thead>
          <tbody>
            {bonds.map((bond) => (
              <tr key={bond.bondId} className="border-b border-mid-gray">
                <td className="p-3">
                  <img
                    src={
                      imageHost +
                      getPath(`卫戍协议：盟约_icon_${bond.bondId}.png`)
                    }
                    alt="bond-logo"
                    className="w-10 h-10 object-cover"
                    onError={(evt) => {
                      (evt.target as HTMLImageElement).onerror = null;
                      (evt.target as HTMLImageElement).src =
                        "/images/logo/logo.png";
                    }}
                  />
                </td>
                <td className="p-3">{bond.name}</td>
                <td className="p-3">{bond.activeCount}</td>
                <td className="p-3">{getBondActiveMethodLabel(bond)}</td>
                <td className="p-3 text-sm whitespace-pre-line">
                  {parseBondDesc(bond.desc)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
