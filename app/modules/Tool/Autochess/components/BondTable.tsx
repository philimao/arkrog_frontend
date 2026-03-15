import { useMemo, useState } from "react";
import type { AutochessBond } from "~/types/autochess";
import { getBondActiveMethodLabel, parseBondDesc } from "../utils/autochess";
import { getPath, imageHost } from "~/utils/tools";
import { StyledTitle } from "~/modules/Tool/components/Shared";

type BondTableRow = AutochessBond & { active?: boolean };

export default function BondTable({ bonds }: { bonds: BondTableRow[] }) {
  const [mode, setMode] = useState("激活盟约");
  const tableRows = useMemo(() => {
    if (mode === "显示全部") return bonds;
    return bonds.filter((bond) => Boolean(bond.active));
  }, [bonds, mode]);

  return (
    <section className="mb-8">
      <StyledTitle
        modes={["激活盟约", "显示全部"]}
        activeMode={mode}
        setActiveMode={setMode}
      >
        盟约一览
      </StyledTitle>
      <div className="border border-mid-gray bg-black-gray-70">
        <div className="max-h-[80vh] overflow-auto">
          <table className="w-full table-auto">
            <thead className="sticky top-0 z-10 bg-black-gray">
              <tr className="text-left border-b border-mid-gray">
                <th className="p-3 whitespace-nowrap">图片</th>
                <th className="p-3 whitespace-nowrap">盟约名称</th>
                <th className="p-3 whitespace-nowrap">激活人数</th>
                <th className="p-3 whitespace-nowrap">激活方式</th>
                <th className="p-3 whitespace-nowrap">盟约描述</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.length === 0 ? (
                <tr>
                  <td className="p-3 text-light-gray" colSpan={5}>
                    暂无已激活盟约
                  </td>
                </tr>
              ) : (
                tableRows.map((bond) => (
                  <tr key={bond.bondId} className="border-b border-mid-gray">
                    <td className="p-3">
                      <img
                        src={
                          imageHost +
                          getPath(`卫戍协议：盟约_icon_${bond.bondId}.png`)
                        }
                        alt="bond-logo"
                        loading="lazy"
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
