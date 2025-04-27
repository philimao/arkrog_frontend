import { useGameDataStore } from "~/stores/gameDataStore";
import { useEffect, useMemo, useState } from "react";
import type {
  CharAttribute,
  CharAttributeExt,
  CharBasicData,
  CharData,
  CharInput,
} from "~/types/gameData";
import { styled } from "styled-components";
import OperatorAvatar from "~/components/Character/Operator/OperatorAvatar";
import {
  applyAttrModifiers,
  applyBlackboard,
} from "~/modules/Tool/DamageCalculator/calculator";
import { useWasmStore } from "~/stores/wasmStore";
import { useDamageCalculatorStore } from "~/stores/damageCalculatorStore";
import ToolSelect from "~/modules/Tool/components/ToolSelect";

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
  grid-template-columns: auto auto auto;
  gap: 0.5rem;
  & > * {
    width: 10rem;
  }
`;

const StyledAttributeWrapper = styled.div`
  display: grid;
  grid-template-columns: auto auto auto;
  gap: 0.5rem;
  font-size: 0.8rem;
  //& > div {
  //  background: var(--black-gray);
  //  padding: 0 0.5rem;
  //  white-space: nowrap;
  //  display: inline-block;
  //}
`;

export default function OperatorDisplay({ charData }: { charData: CharData }) {
  const { outBuff, activeCharName } = useDamageCalculatorStore();
  const { character_basic, skill_table, uniequip_table } = useGameDataStore();

  // 选择干员后
  useEffect(() => {
    const basicData = Object.values(character_basic!).find(
      (char) => char.name === activeCharName,
    );
    if (!basicData) throw new Error(`${activeCharName} Not Found`);
    setBasicData(basicData);
    // 设置精英化阶段为最大
    const maxPhaseLevel = charData.phases.length - 1;
    setPhaseLevel(maxPhaseLevel.toString());
    const maxFrameIndex =
      charData.phases[maxPhaseLevel].attributesKeyFrames.length - 1;
    setFrameIndex(maxFrameIndex.toString());
    // 设置为最后一个技能
    const lastSkillKey = Object.keys(basicData.skills).slice(-1)[0];
    setSkillKey(lastSkillKey!);
    // 设置技能等级
    if (maxPhaseLevel > 1 && parseInt(basicData.rarity.slice(-1)) > 3)
      setSkillLevel("9");
    else setSkillLevel("6");
    // 设置模组，模组默认值在useMemo中更新
  }, [activeCharName, charData.phases, character_basic]);

  // 干员数据
  const [basicData, setBasicData] = useState<CharBasicData>();

  // 精英化阶段选择
  const phases = useMemo(() => charData?.phases, [charData]);
  const [phaseLevel, setPhaseLevel] = useState<string>("0");
  const phase = useMemo(
    () => phases?.[parseInt(phaseLevel)],
    [phaseLevel, phases],
  );

  // 干员等级
  const keyFrames = useMemo(
    () => phase?.attributesKeyFrames,
    [phase?.attributesKeyFrames],
  );
  const [frameIndex, setFrameIndex] = useState<string>("0");

  // 属性数据
  const attribute = useMemo(
    () => phase?.attributesKeyFrames[parseInt(frameIndex)],
    [frameIndex, phase?.attributesKeyFrames],
  );

  // 技能选择
  const skills = useMemo(
    () => basicData && Object.values(basicData?.skills),
    [basicData],
  );
  const [skillKey, setSkillKey] = useState<string>("");
  const [skillLevel, setSkillLevel] = useState<string>("3");
  const skillObject = useMemo(
    () => skill_table![skillKey],
    [skillKey, skill_table],
  );
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
  const skill = useMemo(
    () => skillObject?.levels[parseInt(skillLevel)],
    [skillLevel, skillObject?.levels],
  );

  // 模组选择
  const [uniEquipId, setUniEquipId] = useState<string>("");
  const [uniEquipLevel, setUniEquipLevel] = useState<string>("2");
  const equips = useMemo(() => {
    if (
      phaseLevel === "2" &&
      frameIndex === "1" &&
      basicData &&
      parseInt(basicData.rarity.slice(-1)!) > 3
    ) {
      const latestEquipId = Object.keys(basicData.uniequip).slice(-1)[0];
      setUniEquipId(latestEquipId);
      return basicData && Object.values(basicData.uniequip);
    } else {
      setUniEquipId("");
    }
  }, [basicData, frameIndex, phaseLevel]);
  const uniEquip = useMemo(
    () => uniequip_table![uniEquipId]?.phases[parseInt(uniEquipLevel)],
    [uniEquipId, uniEquipLevel, uniequip_table],
  );

  // 潜能选择
  const [potential, setPotential] = useState<string>("5");

  // 面板计算
  const [result, setResult] = useState<CharAttributeExt>();
  useEffect(() => {
    if (charData && attribute) {
      console.log(charData);
      const result = { ...attribute.data, damage_scale: 1 };

      /**
       * 应用局外科技树
       */
      const _outBuff = parseInt(outBuff);
      result.maxHp *= _outBuff;
      result.atk *= _outBuff;
      result.def *= _outBuff;

      /**
       * 应用信赖效果
       */
      const favor = charData.favorKeyFrames[1].data;
      Object.keys(favor).forEach((key) => {
        const typedKey = key as keyof CharAttribute;
        if (typeof result[typedKey] === "number") {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          result[typedKey] += favor[typedKey];
        } else {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          result[typedKey] = favor[typedKey];
        }
      });

      /**
       * 应用潜能效果
       */
      for (const pot of charData.potentialRanks.slice(0, parseInt(potential))) {
        pot.buff?.attributes.attributeModifiers.forEach((mod) =>
          applyAttrModifiers(mod, result),
        );
      }

      /**
       * 应用模组效果
       */
      if (uniEquip) {
        // 基础值
        for (const bb of uniEquip.attributeBlackboard) {
          applyBlackboard(bb, result);
        }
        // 天赋与特性效果
        for (const part of uniEquip.parts) {
          for (const candidates of [
            part.overrideTraitDataBundle.candidates, // 特性
            part.addOrOverrideTalentDataBundle.candidates, // 天赋
          ]) {
            if (!candidates) continue;
            // 从多个candidate中选出符合潜能的
            const admittedTrait = candidates.findLast(
              (item) => item.requiredPotentialRank <= parseInt(potential),
            );
            // console.log(admittedTrait);
            for (const bb of admittedTrait!.blackboard) {
              applyBlackboard(bb, result);
            }
          }
        }
      }
      setResult(result);
    }
  }, [attribute, charData, uniEquip, potential, outBuff]);

  const { getInstance } = useWasmStore();

  useEffect(() => {
    getInstance("arkrog_calc").then((ins) => console.log(ins));
  }, [getInstance]);

  const charInput: CharInput = useMemo(
    () => ({
      phaseLevel: parseInt(phaseLevel),
      phase,
      level: parseInt(frameIndex),
      attribute: result,
      skillKey,
      skillLevel: parseInt(skillLevel),
      skill,
      uniEquipId,
      uniEquipLevel: parseInt(uniEquipLevel),
      uniEquip,
      potential: parseInt(potential),
    }),
    [
      frameIndex,
      phase,
      phaseLevel,
      potential,
      result,
      skill,
      skillKey,
      skillLevel,
      uniEquip,
      uniEquipId,
      uniEquipLevel,
    ],
  );

  useEffect(() => {
    console.log("charInput", charInput);
  }, [charInput]);

  return (
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
            />
            <ToolSelect
              disallowEmptySelection={true}
              label="技能等级"
              array={skillLevels}
              getKey={(levelItem) => levelItem.key.toString()}
              getValue={(levelItem) => levelItem.name}
              selectedKeys={[skillLevel]}
              onChange={(evt) => setSkillLevel(evt.target.value)}
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
            />
            <ToolSelect
              disallowEmptySelection={true}
              label="模组等级"
              array={Array(3).fill(0)}
              getKey={(_, i) => i.toString()}
              getValue={(_, i) => "Lv " + (i + 1)}
              selectedKeys={[uniEquipLevel]}
              onChange={(evt) => setUniEquipLevel(evt.target.value)}
              isDisabled={uniEquipId.startsWith("uniequip_001")}
            />
          </>
        )}
      </StyledSelectWrapper>
      <StyledAttributeWrapper>
        {result && (
          <>
            <div>
              最大生命值：<span>{result.maxHp}</span>
            </div>
            <div>
              攻击力：<span>{result.atk}</span>
            </div>
            <div>
              防御：<span>{result.def}</span>
            </div>
            <div>
              法术抗性：<span>{result.magicResistance}</span>
            </div>
            <div>
              费用：<span>{result.cost}</span>
            </div>
            <div>
              阻挡数：<span>{result.blockCnt}</span>
            </div>
            <div>
              攻击速度：<span>{result.attackSpeed}</span>
            </div>
            <div>
              攻击间隔：<span>{result.baseAttackTime}</span>
            </div>
            <div>
              再部署时间：<span>{result.respawnTime}</span>
            </div>
            <div>
              每秒生命值回复：<span>{result.hpRecoveryPerSec}</span>
            </div>
            <div>
              每秒技力回复：<span>{result.spRecoveryPerSec}</span>
            </div>
            <div>
              伤害倍率：<span>{result.damage_scale}</span>
            </div>
          </>
        )}
      </StyledAttributeWrapper>
      <div className="hidden">
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
      </div>
    </StyledOperatorDisplayWrapper>
  );
}
