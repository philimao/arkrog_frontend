import type { AutochessBand } from "~/types/autochess";
import { parseBondDesc } from "../utils/autochess";
import { getPath, imageHost } from "~/utils/tools";

export default function BandTable({ bands }: { bands: AutochessBand[] }) {
  return (
    <section className="mb-8">
      <h2 className="text-2xl font-bold mb-3">策略一览</h2>
      <div className="overflow-x-auto border border-mid-gray">
        <table className="w-full table-auto bg-black-gray-70">
          <thead>
            <tr className="text-left border-b border-mid-gray">
              <th className="p-3 whitespace-nowrap">图片</th>
              <th className="p-3 whitespace-nowrap">发起人</th>
              <th className="p-3 whitespace-nowrap">策略名称</th>
              <th className="p-3 whitespace-nowrap">策略血量</th>
              <th className="p-3 whitespace-nowrap">策略描述</th>
            </tr>
          </thead>
          <tbody>
            {bands.map((band) => (
              <tr key={band.bandId} className="border-b border-mid-gray">
                <td className="p-3">
                  <img
                    src={
                      imageHost +
                      getPath(`卫戍协议：盟约_策略发起人_${band.bandName}.png`)
                    }
                    alt="band-logo"
                    className="w-10 h-10 object-cover"
                    onError={(evt) => {
                      (evt.target as HTMLImageElement).onerror = null;
                      (evt.target as HTMLImageElement).src =
                        "/images/logo/logo.png";
                    }}
                  />
                </td>
                <td className="p-3">{band.bandName}</td>
                <td className="p-3">{band.strategy}</td>
                <td className="p-3">{band.totalHp}</td>
                <td className="p-3 text-sm whitespace-pre-line">
                  {parseBondDesc(band.bandDesc)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
