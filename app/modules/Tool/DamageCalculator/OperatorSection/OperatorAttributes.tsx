import { useEffect, useState } from "react";
import { styled } from "styled-components";
import type { CharAttributeExt, CharData, CharInput, RelicWrapper } from "~/types/gameData";
import { CalculatorHelper } from "../calculator/helper";

const StyledAttributeWrapper = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  //grid-template-rows: repeat(6, auto);
  gap: 0.5rem 2rem;
  font-size: 0.8rem;
  justify-content: center;
  background: rgba(24, 24, 24, 0.7);
  padding: 1rem 1.5rem;
  & > div {
    display: flex;
    align-items: center;
    background: var(--black-gray);
    padding: 0 0.5rem;
    white-space: nowrap;
    & > span:first-child {
      font-weight: bold;
      margin-right: 1.5rem;
    }
    & > span:last-child {
      margin-left: auto;
      font-family: "NovecentoWide", sans-serif;
    }
  }
`;

export function OperatorAttributesOld({ result }: { result: CharAttributeExt }) {
  return <StyledAttributeWrapper>
    {result && (
      <>
        <div>
          <span>最大生命值</span>
          <span>{result.maxHp}</span>
        </div>
        <div>
          <span>攻击力</span>
          <span>{result.atk}</span>
        </div>
        <div>
          <span>防御</span>
          <span>{result.def}</span>
        </div>
        <div>
          <span>法术抗性</span>
          <span>{result.magicResistance}</span>
        </div>
        <div>
          <span>费用</span>
          <span>{result.cost}</span>
        </div>
        <div>
          <span>阻挡数</span>
          <span>{result.blockCnt}</span>
        </div>
        <div>
          <span>攻击速度</span>
          <span>{result.attackSpeed}</span>
        </div>
        <div>
          <span>攻击间隔</span>
          <span>{result.baseAttackTime}</span>
        </div>
        <div>
          <span>再部署</span>
          <span>{result.respawnTime}</span>
        </div>
        <div>
          <span>每秒生命回复</span>
          <span>{result.hpRecoveryPerSec}</span>
        </div>
        <div>
          <span>每秒技力回复</span>
          <span>{result.spRecoveryPerSec}</span>
        </div>
        <div>
          <span>伤害倍率</span>
          <span>{result.damageScale}</span>
        </div>
      </>
    )}
  </StyledAttributeWrapper>
}

export default function OperatorAttributes(props: { charData: CharData, charInput: CharInput, relics: RelicWrapper[] }) {
  const [result, setResult] = useState<CharAttributeExt | null>(null);
  useEffect(() => {
    setResult(CalculatorHelper.calculatePanel({ charInput: props.charInput, charData: props.charData, relics: props.relics }));
  }, [props.charData, props.charInput, props.relics]);
  return <StyledAttributeWrapper>
    {result && (
      <>
        <div>
          <span>最大生命值</span>
          <span>{result.maxHp}</span>
        </div>
        <div>
          <span>攻击力</span>
          <span>{result.atk}</span>
        </div>
        <div>
          <span>防御</span>
          <span>{result.def}</span>
        </div>
        <div>
          <span>法术抗性</span>
          <span>{result.magicResistance}</span>
        </div>
        <div>
          <span>费用</span>
          <span>{result.cost}</span>
        </div>
        <div>
          <span>阻挡数</span>
          <span>{result.blockCnt}</span>
        </div>
        <div>
          <span>攻击速度</span>
          <span>{result.attackSpeed}</span>
        </div>
        <div>
          <span>攻击间隔</span>
          <span>{result.baseAttackTime}</span>
        </div>
        <div>
          <span>再部署</span>
          <span>{result.respawnTime}</span>
        </div>
        <div>
          <span>每秒生命回复</span>
          <span>{result.hpRecoveryPerSec}</span>
        </div>
        <div>
          <span>每秒技力回复</span>
          <span>{result.spRecoveryPerSec}</span>
        </div>
        <div>
          <span>伤害倍率</span>
          <span>{result.damageScale}</span>
        </div>
      </>
    )}
  </StyledAttributeWrapper>
}
