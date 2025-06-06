import React, { useEffect, useState } from "react";
import { styled } from "styled-components";
import { Popover, PopoverTrigger, PopoverContent } from "@heroui/popover";
import type { CharAttribute, CharAttributeExt, CharData, CharInput, EnemyInput, RelicWrapper } from "~/types/gameData";
import { BuffContext, CalculatorHelper } from "../calculator";
import { Chip, Tooltip } from "@heroui/react";
import { useDamageCalculatorStore } from "~/stores/damageCalculatorStore";

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
  return (
    <StyledAttributeWrapper>
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
  );
}

/** 属性计算公式Token */
interface AttrCalcToken {
  tooltip: string;
  tags: React.ReactNode[];
}

/** 最大生命值属性计算公式 */
export function useMaxHpTagGroups(props: { attribute: CharAttribute; context: BuffContext }): AttrCalcToken[] {
  const { attribute, context } = props;

  return [
    {
      tooltip: "局内",
      tags: [
        <AttrTag tooltip="基础">{attribute?.maxHp}</AttrTag>,
        ...context.relic_rune_add.max_hp.children.map((item) => (
          <AttrTag tooltip={item.tooltip}>{item.calculate()}</AttrTag>
        )),
      ],
    },
    {
      tooltip: "局外乘区",
      tags: [
        ...context.relic_rune_mul.max_hp.children.map((item) => (
          <AttrTag tooltip={item.tooltip}>{item.calculate()}</AttrTag>
        )),
      ],
    },
  ];
}

/** 攻击力属性计算公式 */
export function useAtkTagGroups(props: { attribute: CharAttribute; context: BuffContext }): AttrCalcToken[] {
  const { attribute, context } = props;

  return [
    {
      tooltip: "局内",
      tags: [
        <AttrTag tooltip="基础">{attribute?.atk}</AttrTag>,
        ...context.relic_rune_add.atk.children.map((item) => (
          <AttrTag tooltip={item.tooltip}>{item.calculate()}</AttrTag>
        )),
      ],
    },
    {
      tooltip: "局外乘区",
      tags: [
        ...context.relic_rune_mul.atk.children.map((item) => (
          <AttrTag tooltip={item.tooltip}>{item.calculate()}</AttrTag>
        )),
      ],
    },
  ];
}

/** 防御属性计算公式 */
export function useDefTagGroups(props: { attribute: CharAttribute; context: BuffContext }): AttrCalcToken[] {
  const { attribute, context } = props;

  return [
    {
      tooltip: "基础",
      tags: [
        <AttrTag tooltip="基础">{attribute?.def}</AttrTag>,
        ...context.relic_rune_add.def.children.map((item) => (
          <AttrTag tooltip={item.tooltip}>{item.calculate()}</AttrTag>
        )),
      ],
    },
    {
      tooltip: "局外乘区",
      tags: [
        <AttrTag tooltip="基数">1</AttrTag>,
        ...context.relic_rune_mul.def.children.map((item) => (
          <AttrTag tooltip={item.tooltip}>{item.calculate()}</AttrTag>
        )),
      ],
    },
  ];
}

/** 攻击速度属性计算公式 */
export function useAttackSpeedTagGroups(props: { attribute: CharAttribute; context: BuffContext }): AttrCalcToken[] {
  const { attribute, context } = props;

  const tokens = [
    {
      tooltip: "局内",
      tags: [
        <AttrTag tooltip="基础">{attribute?.attackSpeed}</AttrTag>,
        ...context.relic_rune_add.attack_speed.children.map((item) => (
          <AttrTag tooltip={item.tooltip}>{item.calculate()}</AttrTag>
        )),
        // ...context.in_game_buff_add.attack_speed_source.map((item) => (
        //   <AttrTag tooltip={item.name}>{item.value}</AttrTag>
        // )),
      ],
    },
  ];

  if (tokens[0].tags.length < 2) {
    return [];
  }
  return tokens;
}

/** 部署费用属性计算公式 */
export function useCostTagGroups(props: { attribute: CharAttribute; context: BuffContext }): AttrCalcToken[] {
  const { attribute, context } = props;

  const tokens: AttrCalcToken[] = [
    {
      tooltip: "局外",
      tags: [
        <AttrTag tooltip="基础">{attribute?.cost}</AttrTag>,
        ...context.relic_rune_add.cost.children.map((item) => (
          <AttrTag tooltip={item.tooltip}>{item.calculate()}</AttrTag>
        )),
      ],
    },
  ];

  if (tokens[0].tags.length < 2) {
    return [];
  }
  return tokens;
}

/** 每秒生命回复属性计算公式 */
export function useHpRecoveryPerSecTagGroups(props: {
  attribute: CharAttribute;
  context: BuffContext;
}): AttrCalcToken[] {
  const { attribute, context } = props;

  const tokens: AttrCalcToken[] = [
    {
      tooltip: "基础",
      tags: [],
    },
  ];
  if (attribute.hpRecoveryPerSec) tokens[0].tags.push(<AttrTag tooltip="基础">{attribute.hpRecoveryPerSec}</AttrTag>);
  for (const item of context.relic_rune_add.hp_recovery_per_sec.children) {
    tokens[0].tags.push(<AttrTag tooltip={item.tooltip}>{item.calculate()}</AttrTag>);
  }

  if (tokens[0].tags.length < 2) {
    return [];
  }
  return tokens;
}

/** 每秒技力回复属性计算公式 */
export function useSpRecoveryPerSecTagGroups(props: {
  attribute: CharAttribute;
  context: BuffContext;
  charInput: CharInput;
}): AttrCalcToken[] {
  const { attribute, context, charInput } = props;

  const tokens: AttrCalcToken[] = [
    {
      tooltip: "基础",
      tags: [],
    },
  ];
  /** 攻回技能不会自动回复技力 */
  if (charInput.skill.spData.spType === "INCREASE_WITH_TIME" && attribute.spRecoveryPerSec)
    tokens[0].tags.push(<AttrTag tooltip="基础">{attribute.spRecoveryPerSec}</AttrTag>);
  for (const item of context.in_game_buff_add.sp_recovery_per_sec.children) {
    tokens[0].tags.push(<AttrTag tooltip={item.tooltip}>{item.calculate()}</AttrTag>);
  }

  if (tokens[0].tags.length < 1) {
    return [];
  }
  return tokens;
}

export default function OperatorAttributes(props: {
  charData: CharData;
  charInput: CharInput;
  enemyInput: EnemyInput;
  relics: RelicWrapper[];
}) {
  const { stageData, rogueInput, topicSpecItems } = useDamageCalculatorStore();
  const [result, setResult] = useState<CharAttributeExt | null>(null);
  const [context, setContext] = useState<BuffContext>(CalculatorHelper.createAdditionContext());
  const attribute = props.charInput.phase?.attributesKeyFrames[props.charInput.level].data;
  const maxHpTagGroups = useMaxHpTagGroups({ attribute: attribute!, context });
  const atkTagGroups = useAtkTagGroups({ attribute: attribute!, context });
  const defTagGroups = useDefTagGroups({ attribute: attribute!, context });
  const attackSpeedTagGroups = useAttackSpeedTagGroups({ attribute: attribute!, context });
  const costTagGroups = useCostTagGroups({ attribute: attribute!, context });
  const hpRecoveryPerSecTagGroups = useHpRecoveryPerSecTagGroups({ attribute: attribute!, context });
  const spRecoveryPerSecTagGroups = useSpRecoveryPerSecTagGroups({
    attribute: attribute!,
    context,
    charInput: props.charInput,
  });

  useEffect(() => {
    let context = CalculatorHelper.analyzeChar({
      charInput: props.charInput,
      charData: props.charData,
    });
    // 藏品加成
    context = CalculatorHelper.analyzeRelics(
      {
        charInput: props.charInput,
        charData: props.charData,
        relics: props.relics,
        enemyInput: props.enemyInput,
        stageData,
      },
      context,
    );
    // 肉鸽难度加成
    context = CalculatorHelper.analyzeRogueDifficulty({ rogueInput, enemyInput: props.enemyInput }, context);
    // 肉鸽主题加成（年代、灵感、密文板）
    context = CalculatorHelper.analyzeTopicSpec({ topicSpecItems: topicSpecItems }, context);

    setResult(CalculatorHelper.calculateOutsidePanel({ charInput: props.charInput, context }));
    setContext(context);
  }, [props.charData, props.charInput, props.relics, rogueInput, stageData, topicSpecItems, props.enemyInput]);

  return (
    <StyledAttributeWrapper>
      {result && (
        <>
          <div>
            <span>最大生命值</span>
            <AttrDisplay calcTokens={maxHpTagGroups}>{result.maxHp}</AttrDisplay>
          </div>

          <div>
            <span>攻击力</span>
            <AttrDisplay calcTokens={atkTagGroups}>{result.atk}</AttrDisplay>
          </div>
          <div>
            <span>防御</span>
            <AttrDisplay calcTokens={defTagGroups}>{result.def}</AttrDisplay>
          </div>
          <div>
            <span>法术抗性</span>
            <span>{result.magicResistance}</span>
          </div>
          <div>
            <span>费用</span>
            <AttrDisplay calcTokens={costTagGroups}>{result.cost}</AttrDisplay>
          </div>
          <div>
            <span>阻挡数</span>
            <span>{result.blockCnt}</span>
          </div>
          <div>
            <span>攻击速度</span>
            <AttrDisplay calcTokens={attackSpeedTagGroups}>{result.attackSpeed}</AttrDisplay>
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
            <AttrDisplay calcTokens={hpRecoveryPerSecTagGroups}>{result.hpRecoveryPerSec}</AttrDisplay>
          </div>
          <div>
            <span>每秒技力回复</span>
            <AttrDisplay calcTokens={spRecoveryPerSecTagGroups}>{result.spRecoveryPerSec}</AttrDisplay>
          </div>
          <div>
            <span>伤害倍率</span>
            <span>{result.damageScale}</span>
          </div>
        </>
      )}
    </StyledAttributeWrapper>
  );
}

/** 属性展示 */
function AttrDisplay(props: { calcTokens: AttrCalcToken[]; children: React.ReactNode }) {
  const { calcTokens, children } = props;

  if (calcTokens.length === 0) {
    return <span>{children}</span>;
  }
  return (
    <Popover placement="top">
      <PopoverTrigger>
        <span className="cursor-pointer">{children}</span>
      </PopoverTrigger>
      <PopoverContent>
        <div className="px-1 py-2">
          {calcTokens.map((group, index) => (
            <span key={group.tooltip}>
              {"( "}
              {group.tags.map((tag, i) => {
                if (i < group.tags.length - 1) return <span key={i}>{tag} + </span>;
                return <span key={i}>{tag}</span>;
              })}
              {index < calcTokens.length - 1 ? " ) * " : " )"}
            </span>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function AttrTag(props: { children: React.ReactNode; tooltip: string }) {
  return (
    <Tooltip content={props.tooltip}>
      <Chip color="warning" variant="faded">
        {props.children}
      </Chip>
    </Tooltip>
  );
}
