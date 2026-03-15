export type AutochessEnemyTypeKey =
  | "FLY"
  | "TIMES"
  | "ELEMENT"
  | "DOT"
  | "INVISIBLE"
  | "REFLECTION"
  | "SPECIAL";

export interface AutochessOperatorStatus {
  evolvePhase: string;
  charLevel: number;
  skillLevel: number;
  favorPoint: number;
  equipLevel: number;
}

export interface AutochessGarrison {
  garrisonId: string;
  garrisonDesc: string;
  eventType: string;
  eventTypeDesc: string;
}

export interface AutochessOperator {
  chessId: string;
  goldenChessId: string;
  charId: string;
  name: string;
  chessLevel: number;
  status: AutochessOperatorStatus;
  upgradeNum: number;
  bondIds: string[];
  garrisonIds: string[];
  garrisons: AutochessGarrison[];
}

export interface AutochessBond {
  bondId: string;
  name: string;
  desc: string;
  activeCount: number;
  isActiveInDeck: boolean;
  activeCondition: string;
  chessIdList: string[];
  operatorNames: string[];
}

export interface AutochessBand {
  bandId: string;
  bandName: string;
  strategy: string;
  sortId: number;
  totalHp: number;
  bandDesc: string;
  effectId: string;
}

export interface AutochessEnemy {
  enemyId: string;
  name: string;
}

export interface AutochessEnemyGroup {
  type: AutochessEnemyTypeKey;
  typeName: string;
  enemies: AutochessEnemy[];
}

export interface AutochessPayload {
  operators: AutochessOperator[];
  operatorsByLevel: Record<string, AutochessOperator[]>;
  operatorsByBond: Record<string, AutochessOperator[]>;
  bonds: AutochessBond[];
  bands: AutochessBand[];
  enemyTypeDict: Record<AutochessEnemyTypeKey, string>;
  enemyGroups: AutochessEnemyGroup[];
}
