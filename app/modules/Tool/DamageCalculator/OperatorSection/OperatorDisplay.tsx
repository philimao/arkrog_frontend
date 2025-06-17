import { useGameDataStore } from "~/stores/gameDataStore";
import { useEffect, useMemo, useState } from "react";
import type {
  CharBasicData,
  CharData,
  CharInput,
  RelicDataExt,
  CalculatorInput,
  RelicWrapper,
  SkillLevelData,
  UniEquipPhaseData,
} from "~/types/gameData";
import { styled } from "styled-components";
import OperatorAvatar from "~/components/Character/Operator/OperatorAvatar";
import { calculator } from "~/modules/Tool/DamageCalculator/calculator";
import { useDamageCalculatorStore } from "~/stores/damageCalculatorStore";
import ToolSelect from "~/modules/Tool/components/ToolSelect";
import OperatorModifier from "~/modules/Tool/DamageCalculator/OperatorSection/OperatorModifier";
import { CalculatorHelper } from "../calculator/helper";
import OperatorAttributes from "./OperatorAttributes";
import { DamageCalculatorSettings } from "../black-list";
import { printRelicsInfo } from "../calculator/debug/print-relics-info";
import { allowedBlackboardKeyMap, parseBlackboardDescription } from "../utils";
import CustomIcon from "~/components/Character/CustomIcon";
import ToolButton from "../../components/ToolButton";
import { Button, Tooltip } from "@heroui/react";
import EnemyMiniPreview from "../EnemySection/EnemyMiniPreview";

const StyledOperatorDisplayWrapper = styled.div`
  margin-bottom: 1rem;
  display: flex;
  gap: 2rem;
`;

const StyledOperatorAvatar = styled(OperatorAvatar)`
  width: 15rem;
  height: 15rem;
  background: rgba(0, 0, 0, 0.2);
  box-shadow: inset 0 0 0 0.5rem white;
`;

const StyledSelectWrapper = styled.div`
  display: grid;
  align-content: start;
  grid-template-columns: auto auto auto;
  gap: 0.5rem;
  & > * {
    width: 10rem;
  }
`;

export default function OperatorDisplay({ charData }: { charData: CharData }) {
  const { relics, items, character_basic, skill_table, uniequip_table } = useGameDataStore();
  const {
    activeCharName,
    charsModifier,
    topicSpecItems,
    stageData,
    rogueInput,
    enemyDataParsed,
    enemyData,
    selectedIds,
    relicsMap,
    rogueKey,
    enemySpec,
    setRogueThoughtLoad,
    setRelicAnalysisResult,
    setCalcOutput,
  } = useDamageCalculatorStore();

  // 选择干员后
  useEffect(() => {
    const basicData = Object.values(character_basic!).find((char) => char.name === activeCharName);
    if (!basicData) throw new Error(`${activeCharName} Not Found`);
    setBasicData(basicData);
    // 设置精英化阶段为最大
    const maxPhaseLevel = charData.phases.length - 1;
    setPhaseLevel(maxPhaseLevel.toString());
    const maxFrameIndex = charData.phases[maxPhaseLevel].attributesKeyFrames.length - 1;
    setFrameIndex(maxFrameIndex.toString());
    // 设置为最后一个技能
    const lastSkillKey = Object.keys(basicData.skills).slice(-1)[0];
    setSkillKey(lastSkillKey!);
    // 设置技能等级
    if (maxPhaseLevel > 1 && parseInt(basicData.rarity.slice(-1)) > 3) setSkillLevel("9");
    else setSkillLevel("6");
    // 设置模组，模组默认值在useMemo中更新
  }, [activeCharName, charData.phases, character_basic]);

  // 干员数据
  const [basicData, setBasicData] = useState<CharBasicData>();

  // 精英化阶段选择
  const phases = useMemo(() => charData?.phases, [charData]);
  const [phaseLevel, setPhaseLevel] = useState<string>("0");
  const phase = useMemo(() => phases?.[parseInt(phaseLevel)], [phaseLevel, phases]);

  // 干员等级
  const keyFrames = useMemo(() => phase?.attributesKeyFrames, [phase?.attributesKeyFrames]);
  const [frameIndex, setFrameIndex] = useState<string>("0");

  // 属性数据
  // const attribute = useMemo(
  //   () => phase?.attributesKeyFrames[parseInt(frameIndex)],
  //   [frameIndex, phase?.attributesKeyFrames],
  // );

  // 技能选择
  const skills = useMemo(() => basicData && Object.values(basicData?.skills), [basicData]);
  const [skillKey, setSkillKey] = useState<string>("");
  const [skillLevel, setSkillLevel] = useState<string>("3");
  const skillObject = useMemo(() => skill_table![skillKey], [skillKey, skill_table]);
  const skillLevels = useMemo(() => {
    const levels =
      parseInt(phaseLevel) > 1 && skillObject?.levels.length > 7
        ? [
            { key: 3, name: "4级" },
            { key: 6, name: "7级" },
            { key: 7, name: "专精一" },
            { key: 8, name: "专精二" },
            { key: 9, name: "专精三" },
          ]
        : parseInt(phaseLevel) > 0
          ? [
              { key: 3, name: "4级" },
              { key: 6, name: "7级" },
            ]
          : [{ key: 3, name: "4级" }];
    setSkillLevel(levels.slice(-1)[0]!.key.toString());
    return levels;
  }, [phaseLevel, skillObject?.levels.length]);
  const skill: SkillLevelData | null = useMemo(() => {
    return skillObject?.levels[parseInt(skillLevel)];
  }, [skillLevel, skillObject?.levels]);

  // 模组选择
  const [uniEquipId, setUniEquipId] = useState<string>("");
  const [uniEquipLevel, setUniEquipLevel] = useState<string>("2");
  const equips = useMemo(() => {
    if (phaseLevel === "2" && frameIndex === "1" && basicData && parseInt(basicData.rarity.slice(-1)!) > 3) {
      const latestEquipId = Object.keys(basicData.uniequip).slice(-1)[0];
      setUniEquipId(latestEquipId);
      return basicData && Object.values(basicData.uniequip);
    } else {
      setUniEquipId("");
    }
  }, [basicData, frameIndex, phaseLevel]);
  const uniEquipName = useMemo(() => {
    return basicData?.uniequip[uniEquipId]?.uniEquipName;
  }, [basicData, uniEquipId]);
  const uniEquip = useMemo(
    () => uniequip_table![uniEquipId]?.phases[parseInt(uniEquipLevel)],
    [uniEquipId, uniEquipLevel, uniequip_table],
  );

  // 潜能选择
  const [potential, setPotential] = useState<string>("5");

  /** 计算器干员输入 */
  const charInput: CharInput = useMemo(
    () => ({
      phaseLevel: parseInt(phaseLevel),
      phase,
      level: parseInt(frameIndex),
      skillKey,
      skillLevel: parseInt(skillLevel),
      skill: skill!,
      uniEquipId,
      uniEquipLevel: parseInt(uniEquipLevel),
      uniEquip,
      potential: parseInt(potential),
      charsBuffInGame: {
        atk: 0,
        maxHp: 0,
        damageResistance: 0,
        damageScale: 0,
      },
      attributeModifier: charsModifier[activeCharName],
    }),
    [
      frameIndex,
      phase,
      phaseLevel,
      potential,
      skill,
      skillKey,
      skillLevel,
      uniEquip,
      uniEquipId,
      uniEquipLevel,
      charsModifier,
      activeCharName,
    ],
  );

  /** 有效藏品列表 */
  const relicList: RelicDataExt[] = useMemo(
    () =>
      Object.values(items![rogueKey])
        .filter((item) => item.type === "RELIC")
        .map((item) => ({
          ...item,
          ...relics![rogueKey][item.id],
          show: true,
        })),
    [items, relics, rogueKey],
  );

  /** 选择的藏品 */
  const selectedRelics = useMemo(() => {
    return selectedIds
      .map((id) => relicsMap[rogueKey]?.find((relic) => relic.id === id))
      .filter((r) => r?.userActive)
      .map((r) => ({
        relicData: relicList.find((relic) => relic.id === r?.id),
        ...r,
      })) as RelicWrapper[];
  }, [relicList, relicsMap, rogueKey, selectedIds]);

  useEffect(() => {
    if (!charInput.attributeModifier) {
      return;
    }
    // 选择敌人数据后，需要等待敌人特殊效果加成计算完成，减少重新渲染
    if (!enemyData || !enemySpec) return;
    // 干员养成加成
    let buffContext = CalculatorHelper.analyzeChar({
      charInput: charInput,
      charData: charData,
    });
    // 藏品加成
    buffContext = CalculatorHelper.analyzeRelics(
      {
        charInput,
        charData,
        relics: selectedRelics,
        enemyData: enemyData,
        stageData,
      },
      buffContext,
    );
    // 肉鸽难度加成
    buffContext = CalculatorHelper.analyzeRogueDifficulty({ rogueInput, enemyData }, buffContext);
    // 肉鸽主题加成（年代、灵感、密文板）
    buffContext = CalculatorHelper.analyzeTopicSpec(
      { topicSpecItems: topicSpecItems, enemyData: enemyData },
      buffContext,
    );
    // 敌人特殊配置加成
    buffContext = CalculatorHelper.analyzeEnemySpec({ enemySpec }, buffContext);

    const input: CalculatorInput = {
      charInput: {
        ...charInput,
        // 局外面板
        attribute: CalculatorHelper.calculateOutsidePanel({ charInput: charInput, context: buffContext }),
      },
      enemyInput: enemyDataParsed,
      charData: charData, // 干员解包原始数据
      enemyData: enemyData, // 敌人解包原始数据
      skillData: skillObject, // 技能原始解包数据
      uniEquipData: uniequip_table![uniEquipId], // 模组原始解包数据
      relics: selectedRelics, // 有效藏品列表
      rogueInput,
      buffContext,
      stageData,
    };
    const calcResult = calculator(input);
    // 标准打印
    CalculatorHelper.print(input, calcResult);
    printRelicsInfo({
      charInput: {
        ...charInput,
        // 局外面板
        attribute: CalculatorHelper.calculateOutsidePanel({ charInput: charInput, context: buffContext }),
      },
      enemyInput: enemyDataParsed,
      charData: charData, // 干员解包原始数据
      enemyData: enemyData, // 敌人解包原始数据
      skillData: skillObject, // 技能原始解包数据
      uniEquipData: uniequip_table![uniEquipId], // 模组原始解包数据
      relics: relicsMap[rogueKey].map((r) => ({
        ...r,
        relicData: relicList.find((relic) => relic.id === r?.id)!,
      })), // 有效藏品列表
      rogueInput,
      buffContext,
      stageData,
    });

    /** 用于展示Buff一览的加成, 区别在于不包含干员养成加成 */
    let buffPanelContext = CalculatorHelper.analyzeRelics(input);
    buffPanelContext = CalculatorHelper.analyzeRogueDifficulty(input, buffPanelContext);
    buffPanelContext = CalculatorHelper.analyzeTopicSpec(
      { topicSpecItems: topicSpecItems, enemyData: enemyData },
      buffPanelContext,
    );
    buffPanelContext = CalculatorHelper.analyzeEnemySpec({ enemySpec }, buffPanelContext);

    setRelicAnalysisResult(buffPanelContext);
    // 计算结果
    setCalcOutput(calcResult);
  }, [
    charData,
    charInput,
    enemyData,
    enemyDataParsed,
    enemySpec,
    relicList,
    relicsMap,
    rogueInput,
    rogueKey,
    selectedRelics,
    setCalcOutput,
    setRelicAnalysisResult,
    skillObject,
    stageData,
    topicSpecItems,
    uniEquipId,
    uniequip_table,
  ]);

  return (
    <div className="mb-4">
      <StyledOperatorDisplayWrapper>
        <StyledOperatorAvatar name={activeCharName} />
        <StyledSelectWrapper>
          {phases && (
            <ToolSelect
              disallowEmptySelection={true}
              label="选择精英化阶段"
              array={phases}
              getKey={(_, i) => i.toString()}
              getValue={(_, i) => "精英" + i}
              selectedKeys={[phaseLevel]}
              onChange={(evt) => setPhaseLevel(evt.target.value)}
              isDisabled
            />
          )}
          {keyFrames && (
            <ToolSelect
              disallowEmptySelection={true}
              label="选择等级"
              selectedKeys={[frameIndex]}
              array={keyFrames}
              getKey={(_, i) => i.toString()}
              getValue={(frame) => frame.level + "级"}
              onChange={(evt) => setFrameIndex(evt.target.value)}
              isDisabled
            />
          )}
          {charData && (
            <ToolSelect
              disallowEmptySelection={true}
              label="选择潜能"
              array={Array(6).fill(0)}
              getKey={(_, i) => i.toString()}
              getValue={(_, i) => "潜能" + (i + 1)}
              selectedKeys={[potential]}
              onChange={(evt) => setPotential(evt.target.value)}
            />
          )}
          {skills && (
            <>
              <ToolSelect
                disallowEmptySelection={true}
                label="选择技能"
                array={skills}
                getKey={(skillItem) => skillItem.skillId}
                getValue={(skillItem) => skillItem.name}
                selectedKeys={[skillKey]}
                onChange={(evt) => setSkillKey(evt.target.value)}
                disabledKeys={DamageCalculatorSettings.operator[activeCharName]?.disabled_skills}
              />
              <ToolSelect
                disallowEmptySelection={true}
                label="技能等级"
                array={skillLevels}
                getKey={(levelItem) => levelItem.key.toString()}
                getValue={(levelItem) => levelItem.name}
                selectedKeys={[skillLevel]}
                onChange={(evt) => setSkillLevel(evt.target.value)}
                isDisabled
              />
            </>
          )}
          {equips && (
            <>
              <ToolSelect
                disallowEmptySelection={true}
                label="选择模组"
                selectedKeys={[uniEquipId]}
                array={equips}
                getKey={(equip) => equip.uniEquipId}
                getValue={(equip) => equip.uniEquipName}
                onChange={(evt) => setUniEquipId(evt.target.value)}
                isDisabled={!uniEquipId}
              />
              <ToolSelect
                disallowEmptySelection={true}
                label="模组等级"
                array={Array(3).fill(0)}
                getKey={(_, i) => i.toString()}
                getValue={(_, i) => "Lv " + (i + 1)}
                selectedKeys={[uniEquipLevel]}
                onChange={(evt) => setUniEquipLevel(evt.target.value)}
                isDisabled={!uniEquipId || uniEquipId.startsWith("uniequip_001")}
              />
            </>
          )}
          {rogueKey === "rogue_4" && (
            <div>
              <div className="flex items-center justify-between h-6">
                <span className="text-light-gray text-[0.8rem]">思维负荷</span>
                <Tooltip
                  content={
                    <div>
                      <ul className="text-sm p-2">
                        <li>清晰：思维清晰，一切正常</li>
                        <li>混乱：所有单位部署费用+3，攻击力-20%，技力自然回复速度-20%</li>
                      </ul>
                    </div>
                  }
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <use href="#question_circle" />
                  </svg>
                </Tooltip>
              </div>
              <ToolButton
                onPress={() =>
                  setRogueThoughtLoad(rogueInput.rogue_4.thoughtLoad === "NORMAL" ? "CONFUSION" : "NORMAL")
                }
                className={
                  "shadow-outer-sm " +
                  (rogueInput.rogue_4.thoughtLoad === "NORMAL" ? "text-green-400/25" : "text-yellow-400/25")
                }
              >
                <span className="w-full text-left text-white">
                  {rogueInput.rogue_4.thoughtLoad === "NORMAL" ? "清晰" : "混乱"}
                </span>
              </ToolButton>
            </div>
          )}
        </StyledSelectWrapper>
        <div className="flex flex-col gap-4 grow">
          {skill && <SkillDisplay skill={skill} />}
          {uniEquip && uniEquipName && <UniEquipDisplay uniEquipName={uniEquipName} uniEquip={uniEquip} />}
        </div>
        {/* <div className="hidden">
          {attribute && (
            <div className="whitespace-pre-wrap">
              <div>面板</div>
              {JSON.stringify(attribute, null, 2)}
            </div>
          )}
          {skill && (
            <div className="whitespace-pre-wrap">
              <div>技能</div>
              {JSON.stringify(skill, null, 2)}
            </div>
          )}
          {uniEquip && (
            <div className="whitespace-pre-wrap">
              <div>模组</div>
              {JSON.stringify(uniEquip, null, 2)}
            </div>
          )}
        </div> */}
      </StyledOperatorDisplayWrapper>
      <div className="flex gap-4">
        {charInput.attributeModifier && (
          <OperatorAttributes charInput={charInput} charData={charData} relics={selectedRelics} />
        )}
        <OperatorModifier />
        <EnemyMiniPreview />
      </div>
    </div>
  );
}

const StyledSkillDisplay = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.9rem;
  white-space: nowrap;
  .skill-icon {
    width: 3rem;
    height: 3rem;
  }
  .skill-name {
    font-size: 1.25rem;
    font-weight: 600;
  }
  .skill-type {
    display: flex;
    gap: 0.25rem;
    & > div {
      font-size: 0.8rem;
      background-color: var(--dark-gray);
      padding: 0.1rem 0.5rem;
      border-radius: 0.25rem;
      line-height: 1.5;
    }
  }
  .skill-sp {
    display: flex;
    gap: 0.5rem;
  }
  .skill-description {
    white-space: pre-wrap;
    font-size: 0.8rem;
  }
  .skill-description > strong {
    margin: 0 0.15rem;
  }
`;

const StyledChevron = styled.svg<{ $rotate: boolean }>`
  flex-shrink: 0;
  margin-left: auto;
  margin-right: 0.5rem;
  width: 1.25rem;
  height: 1.25rem;
  transform: rotate(${({ $rotate }) => ($rotate ? "180deg" : "0deg")});
  transition: transform 0.3s ease-in-out;
`;

const ButtonWrapper = ({ children, onPress }: { children: React.ReactNode; onPress: () => void }) => {
  return (
    <Button
      className="bg-inherit p-0 h-auto justify-start data-[focus-visible=true]:!outline-none"
      radius="none"
      onPress={onPress}
    >
      {children}
    </Button>
  );
};

function SkillDisplay({ skill }: { skill: SkillLevelData }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <StyledSkillDisplay>
      <ButtonWrapper onPress={() => setIsOpen(!isOpen)}>
        <div className="flex gap-4 items-center">
          <CustomIcon name={"技能_死境硝烟"} className="skill-icon" />
          <div>
            <div className="flex gap-2 items-center">
              <div className="skill-name">{skill.name}</div>
              <div className="skill-type">
                <div>{skill.spData.spType === "INCREASE_WITH_TIME" ? "自动回复" : "攻击回复"}</div>
                <div>{skill.skillType === "MANUAL" ? "手动触发" : "自动触发"}</div>
              </div>
            </div>
            <div className="skill-sp">
              <div className="flex gap-1">
                <span>初始</span>
                <strong>{skill.spData.initSp}</strong>
              </div>
              <div className="flex gap-1">
                <span>消耗</span>
                <strong>{skill.spData.spCost}</strong>
              </div>
              <div className="flex gap-1">
                <span>持续</span>
                <strong>{skill.duration}</strong>
              </div>
            </div>
          </div>
        </div>
        <StyledChevron $rotate={isOpen}>
          <use href="#chevron-up" />
        </StyledChevron>
      </ButtonWrapper>
      {isOpen && (
        <div className="skill-description">{parseBlackboardDescription(skill.description!, skill.blackboard)}</div>
      )}
    </StyledSkillDisplay>
  );
}

const StyledUniEquipDisplay = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.9rem;
  white-space: nowrap;

  .uni-equip-icon {
    width: 3rem;
    height: 3rem;
    filter: invert(1);
  }
  .uni-equip-name {
    font-size: 1.25rem;
    font-weight: 600;
  }
  .uni-equip-attributes {
    display: flex;
    gap: 0.5rem;
    & > div {
      display: flex;
      gap: 0.25rem;
    }
  }
  .uni-equip-description {
    font-size: 0.8rem;
    white-space: pre-wrap;
    & strong {
      margin: 0 0.15rem;
    }
  }
`;

function UniEquipDisplay({ uniEquipName, uniEquip }: { uniEquipName: string; uniEquip: UniEquipPhaseData }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <StyledUniEquipDisplay>
      <ButtonWrapper onPress={() => setIsOpen(!isOpen)}>
        <div className="flex gap-4 items-center">
          <CustomIcon name={"模组等级_" + uniEquip.equipLevel} size={65} className="uni-equip-icon" />
          <div className="text-left">
            <div className="uni-equip-name">{uniEquipName}</div>
            <div className="uni-equip-attributes">
              {uniEquip.attributeBlackboard.map((bb) => (
                <div key={bb.key}>
                  <span>{allowedBlackboardKeyMap[bb.key]}</span>
                  <strong>{"+" + bb.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
        <StyledChevron $rotate={isOpen}>
          <use href="#chevron-up" />
        </StyledChevron>
      </ButtonWrapper>
      {isOpen && (
        <div className="uni-equip-description">
          {uniEquip.parts.map((part) => {
            if (part.overrideTraitDataBundle.candidates) {
              return part.overrideTraitDataBundle.candidates
                .filter((trait) => trait.additionalDescription)
                .map((trait) => {
                  return (
                    <div key={trait.additionalDescription}>
                      {parseBlackboardDescription(trait.additionalDescription!, trait.blackboard)}
                    </div>
                  );
                });
            } else if (part.addOrOverrideTalentDataBundle.candidates) {
              return part.addOrOverrideTalentDataBundle.candidates
                .filter((talent) => talent.description || talent.overrideDescription || talent.upgradeDescription)
                .map((talent) => {
                  return (
                    <div key={talent.description}>
                      {parseBlackboardDescription(
                        talent.description || talent.overrideDescription || talent.upgradeDescription!,
                        talent.blackboard,
                      )}
                    </div>
                  );
                });
            } else {
              return null;
            }
          })}
        </div>
      )}
    </StyledUniEquipDisplay>
  );
}
