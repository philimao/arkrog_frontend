import { allowedBlackboardKeyMap } from "~/modules/Tool/DamageCalculator/utils";

export default function BuffText({
  charBuff,
  inGameBuff,
  enemyBuff,
}: {
  charBuff?: Record<string, number>;
  inGameBuff?: Record<string, number>;
  enemyBuff?: Record<string, number>;
}) {
  // console.log(charBuff, inGameBuff, enemyBuff);
  const parse = (key: string, value: number) =>
    `${allowedBlackboardKeyMap[key] || key}：${value > 1 ? value : Math.round(value * 100) + "%"}`;
  return (
    <>
      {charBuff &&
        Object.entries(charBuff).map(([key, value]) => (
          <div key={key}>{parse(key, value)}</div>
        ))}
      {inGameBuff &&
        Object.entries(inGameBuff).map(([key, value]) => (
          <div key={key}>{"局内" + parse(key, value)}</div>
        ))}
      {enemyBuff &&
        Object.entries(enemyBuff).map(([key, value]) => (
          <div key={key}>{parse(key, value)}</div>
        ))}
    </>
  );
}
