import EnemyAvatar from "~/components/Character/Enemy/EnemyAvatar";
import ToolSelect from "~/modules/Tool/components/ToolSelect";
import { useDamageCalculatorStore } from "~/stores/damageCalculatorStore";
import { styled } from "styled-components";
import EnemyDisplay from "~/modules/Tool/DamageCalculator/EnemySection/EnemyDisplay";
import { GridContainer } from "~/modules/Tool/components/Shared";
import { navOfZone, zoneOfTopic } from "./enemyUtils";
import { parseBlackboardEntry } from "../utils";
import { cosHost } from "~/utils/tools";

const StyledStageSelector = styled.div`
  margin-bottom: 1rem;
`;

const StyledStageSelectorBody = styled.div`
  display: flex;
  height: 34rem;
  align-items: stretch;
  & > div:first-child {
    flex-grow: 1;
    max-height: 100%;
    max-width: 35rem;
    margin-right: 1.5rem;
    position: relative;
  }
  & > div:last-child {
    flex-shrink: 0;
    width: 33rem;
  }
`;

const StyledEnemiesLabel = styled.div`
  height: 1.25rem;
  display: flex;
  font-size: 0.75rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  & > span:first-child {
    margin-right: auto;
    color: var(--light-gray);
  }
  & > span.parasitic-hint {
    color: var(--ak-red);
  }
`;

const StyledEnemies = styled.div`
  height: calc(100% - 1.75rem);
  overflow: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, 4rem);
  gap: 0.5rem;
  align-content: start;
  align-items: start;
  justify-content: center;
  padding: 0.5rem;
  background: rgba(78, 78, 78, 0.5);
  box-shadow: 4px 4px 6px 0 rgba(0, 0, 0, 0.25);
  user-select: none;
  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: var(--light-gray);
  }
  &::-webkit-scrollbar-track {
    background-color: rgba(0, 0, 0, 0.3);
  }
  &::after {
    content: "";
    position: absolute;
    left: 0;
    bottom: 0;
    width: 100%;
    height: 4rem;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(36, 36, 36, 0.8) 100%);
    background-blend-mode: darken;
  }
`;

const StyledEnemy = styled.div<{ $selected: boolean }>`
  box-shadow: ${({ $selected }) => ($selected ? "0px 0px 10px 2px #FFF" : "none")};
  width: 4rem;
  position: relative;
`;

const StyledEnemyName = styled.div<{ $color: string }>`
  padding: 0.1rem 0.15rem;
  font-size: 0.65rem;
  background: var(--black-gray);
  text-align: center;
  color: ${({ $color }) => ($color === "red" ? "var(--ak-red)" : "inherit")};
`;

/** 恐卡兹标记 */
const StyledEnemyBadge = styled.div`
  position: absolute;
  top: -0.3rem;
  right: -0.3rem;
  width: 1rem;
  height: 1rem;
  background: url(${cosHost + "/images/rogue_4/恐卡兹标记.webp"}) no-repeat center center;
  background-size: contain;
`;

const ignoreEnemyNames = ["温迪戈大盾", "年代印痕", "昔日道标", "仅剩的创意", "受符"];
const ignoreEnemyIds = [
  "enemy_1324_wdsdw", //萨卡兹悖谬裂变学徒（虚像）
];

export default function StageSelector() {
  const {
    renderStages,
    setRogueStageId,
    levelData,
    enemyData,
    rogueInput,
    stageId,
    stageData,
    setEnemyData,
    setRogueZone,
  } = useDamageCalculatorStore();

  const zones = [...navOfZone, ...zoneOfTopic[rogueInput.topic as never]];

  return (
    <StyledStageSelector>
      <GridContainer>
        <ToolSelect
          disallowEmptySelection={true}
          label="选择区域"
          array={zones}
          getKey={(zone) => zone.id}
          getValue={(zone) => zone.name}
          selectedKeys={[rogueInput[rogueInput.topic].zone]}
          onChange={(evt) => setRogueZone(evt.target.value)}
        />
        <ToolSelect
          disallowEmptySelection={true}
          label="选择关卡"
          array={renderStages}
          getKey={(stage) => stage.id}
          getValue={(stage) => {
            if (stage.isBoss) {
              if (stage.description.includes("出现新的敌人")) return `BOSS · 带船 · ${stage.name}`;
              else return `BOSS · ${stage.name}`;
            }
            if (stage.id.includes("duel")) return `狭路 · ${stage.name}`;
            return `${stage.isElite ? "紧急 · " : "普通 · "}${stage.name}`;
          }}
          selectedKeys={[stageId]}
          onChange={(evt) => setRogueStageId(evt.target.value)}
        />
        {stageData.eliteDesc && (
          <div className="flex flex-col whitespace-nowrap" style={{ color: "rgb(236, 237, 238)", fontSize: "0.8rem" }}>
            <div style={{ height: "calc(0.875rem + 10px)" }}>紧急条件</div>
            <div className="relative">
              <div className="absolute top-0 left-0 flex flex-col justify-center bg-dark-gray h-12 px-2">
                <div>{stageData.eliteDesc}</div>
                <div>
                  {levelData.runes
                    .find((rune) => rune.key === "enemy_attribute_mul")
                    ?.blackboard.map((bb) => parseBlackboardEntry(bb, true))
                    .join(", ")}
                </div>
              </div>
            </div>
          </div>
        )}
      </GridContainer>
      {levelData && (
        <StyledStageSelectorBody>
          <div>
            <StyledEnemiesLabel>
              <span>点击选择敌人</span>
              {rogueInput.topic === "rogue_4" && <span className="parasitic-hint">红点代表死亡后会生成恐卡兹</span>}
            </StyledEnemiesLabel>
            <StyledEnemies>
              {levelData.enemies
                .filter(
                  (enemy) => !ignoreEnemyNames.includes(enemy.name.m_value!) && !ignoreEnemyIds.includes(enemy.id),
                )
                .map((_enemyData) => {
                  // 被恐卡兹寄生（小红点）
                  const parasitized = _enemyData.talentBlackboard?.find(
                    (bb) => bb.key === "parasitic" && bb.valueStr === "true",
                  );
                  
                  // 为神父变体添加特殊显示名称
                  let displayName = _enemyData.name.m_value;
                  if (_enemyData.id === "enemy_1284_sgprst") {
                    displayName = "阿格尼尔神父（其他）";
                  } else if (_enemyData.id === "enemy_1284_sgprst_variant") {
                    displayName = "阿格尼尔神父（全远程）";
                  }
                  
                  return (
                    <StyledEnemy
                      key={_enemyData.id}
                      $selected={_enemyData.id === enemyData?.id}
                      onClick={() => {
                        setEnemyData(_enemyData);
                      }}
                    >
                      <EnemyAvatar name={_enemyData.name.m_value} />
                      <StyledEnemyName $color={"inherit"}>{displayName}</StyledEnemyName>
                      {parasitized && <StyledEnemyBadge />}
                    </StyledEnemy>
                  );
                })}
            </StyledEnemies>
          </div>
          <div>{enemyData && <EnemyDisplay />}</div>
        </StyledStageSelectorBody>
      )}
    </StyledStageSelector>
  );
}
