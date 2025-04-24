import { useGameDataStore } from "~/stores/gameDataStore";
import {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  CharAttribute,
  CharAttributeExt,
  CharBasicData,
  CharData,
} from "~/types/gameData";
import { Select, SelectItem } from "@heroui/react";
import { styled } from "styled-components";
import OperatorAvatar from "~/components/Character/Operator/OperatorAvatar";
import { applyAttrModifiers, applyBlackboard } from "~/utils/calculator";
import { useWasmStore } from "~/stores/wasmStore";

const StyledOperatorAvatar = styled(OperatorAvatar)`
  width: 10rem;
  height: 10rem;
`;

export default function OperatorSelector({
  charData,
  setCharData,
}: {
  charData?: CharData;
  setCharData: Dispatch<SetStateAction<CharData | undefined>>;
}) {
  const { character_basic, character_table, skill_table, uniequip_table } =
    useGameDataStore();

  // 选择干员
  const charNames = ["赫德雷", "维什戴尔"];
  const [charName, setCharName] = useState<string>("");

  // 选择干员后
  useEffect(() => {
    if (!charName) return;
    const basicData = Object.values(character_basic!).find(
      (char) => char.name === charName,
    );
    const charData = character_table![basicData!.charId];
    if (!basicData || !charData) throw new Error(`${charName} Not Found`);
    setBasicData(basicData);
    setCharData(charData);
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
  }, [charName, character_basic, character_table, setCharData]);

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
  const equip = useMemo(
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
      if (equip) {
        // 基础值
        for (const bb of equip.attributeBlackboard) {
          applyBlackboard(bb, result);
        }
        // 天赋与特性效果
        for (const part of equip.parts) {
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
  }, [attribute, charData, equip, potential]);

  const { getInstance } = useWasmStore();

  useEffect(() => {
    const instance = getInstance("my_target");
    console.log(instance);
  }, [getInstance]);

  return (
    <div>
      <div
        className="grid"
        style={{ gridTemplateColumns: "repeat(auto-fill, 15rem)" }}
      >
        <Select
          // disallowEmptySelection={true}
          label="选择干员"
          selectedKeys={[charName]}
          onChange={(evt) => setCharName(evt.target.value)}
        >
          {charNames.map((name) => (
            <SelectItem key={name}>{name}</SelectItem>
          ))}
        </Select>
        {phases && (
          <Select
            disallowEmptySelection={true}
            label="选择精英化阶段"
            selectedKeys={[phaseLevel]}
            onChange={(evt) => setPhaseLevel(evt.target.value)}
          >
            {phases.map((_, phaseIndex) => (
              <SelectItem key={phaseIndex}>{"精英" + phaseIndex}</SelectItem>
            ))}
          </Select>
        )}
        {keyFrames && (
          <Select
            disallowEmptySelection={true}
            label="选择等级"
            selectedKeys={[frameIndex]}
            onChange={(evt) => setFrameIndex(evt.target.value)}
          >
            {keyFrames.map((frame, frameIndex) => (
              <SelectItem key={frameIndex}>{frame.level + "级"}</SelectItem>
            ))}
          </Select>
        )}
        {charData && (
          <Select
            disallowEmptySelection={true}
            label="选择潜能"
            selectedKeys={[potential]}
            onChange={(evt) => setPotential(evt.target.value)}
          >
            {Array(6)
              .fill(0)
              .map((_, index) => (
                <SelectItem key={index}>{"潜能" + (index + 1)}</SelectItem>
              ))}
          </Select>
        )}
        {skills && (
          <>
            <Select
              disallowEmptySelection={true}
              label="选择技能"
              items={skills}
              selectedKeys={[skillKey]}
              onChange={(evt) => setSkillKey(evt.target.value)}
            >
              {(skillItem) => (
                <SelectItem key={skillItem.skillId}>
                  {skillItem.name}
                </SelectItem>
              )}
            </Select>
            <Select
              disallowEmptySelection={true}
              label="技能等级"
              selectedKeys={[skillLevel]}
              onChange={(evt) => setSkillLevel(evt.target.value)}
            >
              {skillLevels.map((levelItem) => (
                <SelectItem key={levelItem.key}>{levelItem.name}</SelectItem>
              ))}
            </Select>
          </>
        )}
        {equips && (
          <>
            <Select
              disallowEmptySelection={true}
              label="选择模组"
              selectedKeys={[uniEquipId]}
              onChange={(evt) => setUniEquipId(evt.target.value)}
            >
              {equips.map((equip) => (
                <SelectItem key={equip.uniEquipId}>
                  {equip.uniEquipName}
                </SelectItem>
              ))}
            </Select>
            <Select
              disallowEmptySelection={true}
              label="模组等级"
              selectedKeys={[uniEquipLevel]}
              onChange={(evt) => setUniEquipLevel(evt.target.value)}
              isDisabled={uniEquipId.startsWith("uniequip_001")}
            >
              {Array(3)
                .fill(0)
                .map((_, uniequipLevel) => (
                  <SelectItem key={uniequipLevel}>
                    {"Lv " + (uniequipLevel + 1)}
                  </SelectItem>
                ))}
            </Select>
          </>
        )}
      </div>
      <div className="flex gap-8 my-4">
        {charName && <StyledOperatorAvatar name={charName} />}
        {result && (
          <div>
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
          </div>
        )}
      </div>
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
        {equip && (
          <div className="whitespace-pre-wrap">
            <div>模组</div>
            {JSON.stringify(equip, null, 2)}
          </div>
        )}
      </div>
    </div>
  );
}
