import type { ITopicSpecItem } from "~/modules/Tool/DamageCalculator/TopicSpecSection/TopicSpecSelector";
import type { RogueKey, RogueInput, RelicWrapper } from "~/types/gameData";

export interface SlicedCalcGameDataState {
  /** 肉鸽主题 */
  rogueKey: RogueKey;
  /** 肉鸽难度 */
  rogueInput: RogueInput;
  /** 肉鸽难度 */
  difficulty: number;
  /** 肉鸽主题特殊效果列表 */
  topicSpecItems: ITopicSpecItem[];
  /** 预处理后的藏品列表 */
  relicsMap: Record<RogueKey, RelicWrapper[]>;
  /** 选择的藏品ID */
  selectedIds: string[];
  /** 简略关卡数据 */
  stageData?: StageData;
  /** 关卡详细解包数据 */
  levelData?: LevelData;
}
