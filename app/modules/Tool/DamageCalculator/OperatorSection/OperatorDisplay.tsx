import React, { useState } from "react";
import type { SkillLevelData, UniEquipPhaseData } from "~/types/gameData";
import { styled } from "styled-components";
import OperatorAvatar from "~/components/Character/Operator/OperatorAvatar";
import { useDamageCalculatorStore } from "~/stores/damageCalculatorStore";
import ToolSelect from "~/modules/Tool/components/ToolSelect";
import OperatorModifier from "~/modules/Tool/DamageCalculator/OperatorSection/OperatorModifier";
import { DamageCalculatorSettings } from "../black-list";
import { allowedBlackboardKeyMap, parseBlackboardDescription } from "../utils";
import CustomIcon from "~/components/Character/CustomIcon";
import ToolButton from "../../components/ToolButton";
import { Button } from "@heroui/react";
import { Tooltip } from "~/modules/Tool/components/SafeHeroPortal";
import EnemyMiniPreview from "../EnemySection/EnemyMiniPreview";
import { cosHost, mergeClassNameSafe } from "~/utils/tools";
import OperatorAttributes from "./OperatorAttributes";

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

const StyledThoughtLoadInner = styled.div<{ $thoughtLoad: "NORMAL" | "CONFUSION" | "STAGNATION" }>`
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
  padding: 0 1rem;
  font-weight: 600;
  background: ${({ $thoughtLoad }) => `url("${cosHost}/images%2Frogue_4%2Fthought_load_${$thoughtLoad}.png")`};
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
`;

export default function OperatorDisplay() {
  const {
    activeCharName,
    charInput,
    charData,
    rogueInput,
    setRogueThoughtLoad,
    setPhaseLevel,
    setFrameIndex,
    setPotential,
    setSkillKey,
    setSkillLevel,
    setUniEquipId,
    setUniEquipLevel,
  } = useDamageCalculatorStore();

  const {
    phaseLevel,
    phases,
    frameIndex,
    keyFrames,
    potential,
    skillKey,
    skills,
    skillLevels,
    skillLevel,
    skill,
    uniEquipId,
    equips,
    uniEquipLevel,
    uniEquip,
    uniEquipName,
  } = charInput;

  // 面板显示模式
  const [mode, setMode] = useState<"out_game" | "in_game" | "skill">("in_game");

  const rogueKey = rogueInput.topic;

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
              selectedKeys={[phaseLevel.toString()]}
              onChange={(evt) => setPhaseLevel(evt.target.value)}
              isDisabled
            />
          )}
          {keyFrames && (
            <ToolSelect
              disallowEmptySelection={true}
              label="选择等级"
              selectedKeys={[frameIndex.toString()]}
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
              selectedKeys={[potential.toString()]}
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
                getValue={(skillItem, i) => `${i + 1}-${skillItem.levels[0].name}`}
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
                selectedKeys={[skillLevel.toString()]}
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
                getValue={(equip) => (equip.typeName2 ? equip.typeName2 + "-" : "") + equip.uniEquipName}
                onChange={(evt) => setUniEquipId(evt.target.value)}
                isDisabled={!uniEquipId}
              />
              <ToolSelect
                disallowEmptySelection={true}
                label="模组等级"
                array={Array(3).fill(0)}
                getKey={(_, i) => i.toString()}
                getValue={(_, i) => "Lv " + (i + 1)}
                selectedKeys={[uniEquipLevel.toString()]}
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
                  closeDelay={100}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" color="#9A9A9A">
                    <use href="#question_circle" />
                  </svg>
                </Tooltip>
              </div>
              <ToolButton
                onPress={() =>
                  setRogueThoughtLoad(rogueInput.rogue_4.thoughtLoad === "NORMAL" ? "CONFUSION" : "NORMAL")
                }
                className="px-0"
              >
                <StyledThoughtLoadInner $thoughtLoad={rogueInput.rogue_4.thoughtLoad}>
                  <span
                    className={rogueInput.rogue_4.thoughtLoad === "NORMAL" ? "text-md" : "text-[0.6rem] opacity-50"}
                  >
                    清晰
                  </span>
                  <span
                    className={rogueInput.rogue_4.thoughtLoad === "NORMAL" ? "text-[0.6rem] opacity-50" : "text-md"}
                  >
                    混乱
                  </span>
                </StyledThoughtLoadInner>
              </ToolButton>
            </div>
          )}
        </StyledSelectWrapper>
        <div className="flex flex-col gap-4 grow">
          {skill && <SkillDisplay skill={skill} />}
          {uniEquip && <UniEquipDisplay potential={potential} uniEquipName={uniEquipName} uniEquip={uniEquip} />}
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
      <div>
        <a
          className={mergeClassNameSafe(
            "text-[0.8rem] px-1 py-2 cursor-pointer inline-block",
            mode === "out_game" ? "text-ak-blue" : "text-light-gray",
          )}
          onClick={() => setMode("out_game")}
        >
          局外面板
        </a>
        <a
          className={mergeClassNameSafe(
            "text-[0.8rem] px-1 py-2 cursor-pointer inline-block",
            mode === "in_game" ? "text-ak-blue" : "text-light-gray",
          )}
          onClick={() => setMode("in_game")}
        >
          局内面板
        </a>
        <a
          className={mergeClassNameSafe(
            "text-[0.8rem] px-1 py-2 cursor-pointer inline-block",
            mode === "skill" ? "text-ak-blue" : "text-light-gray",
          )}
          onClick={() => setMode("skill")}
        >
          技能面板
        </a>
      </div>
      <div className="flex gap-4">
        <OperatorAttributes mode={mode} />
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
          <CustomIcon name={"技能_" + skill.name} className="skill-icon" />
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

function UniEquipDisplay({
  potential,
  uniEquipName,
  uniEquip,
}: {
  potential: number;
  uniEquipName: string;
  uniEquip: UniEquipPhaseData;
}) {
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
              const talent = part.addOrOverrideTalentDataBundle.candidates.findLast(
                (talent) =>
                  talent.requiredPotentialRank <= potential &&
                  (talent.description || talent.overrideDescription || talent.upgradeDescription),
              );
              if (!talent) return null;
              else {
                return (
                  <div key={talent.name}>
                    {parseBlackboardDescription(
                      talent.description || talent.overrideDescription || talent.upgradeDescription!,
                      talent.blackboard,
                    )}
                  </div>
                );
              }
            } else {
              return null;
            }
          })}
        </div>
      )}
    </StyledUniEquipDisplay>
  );
}
