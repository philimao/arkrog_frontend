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

export interface AutochessOperator {
  chessId: string;
  goldenChessId: string;
  charId: string;
  name: string;
  chessLevel: number;
  status: AutochessOperatorStatus;
  bondIds: string[];
  garrisonIds: string[];
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

export interface AutochessOperatorStatus {
  evolvePhase: string;
  charLevel: number;
  skillLevel: number;
  favorPoint: number;
  equipLevel: number;
}

export interface AutochessOperator {
  chessId: string;
  goldenChessId: string;
  charId: string;
  name: string;
  chessLevel: number;
  status: AutochessOperatorStatus;
  bondIds: string[];
  garrisonIds: string[];
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
  sortId: number;
  totalHp: number;
  bandDesc: string;
  effectId: string;
  effectDesc?: string;
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

export interface AutochessData {
  operators: AutochessOperator[];
  operatorsByLevel: Record<string, AutochessOperator[]>;
  operatorsByBond: Record<string, AutochessOperator[]>;
  bonds: AutochessBond[];
  bands: AutochessBand[];
  enemyTypeDict: Record<AutochessEnemyTypeKey, string>;
  enemyGroups: AutochessEnemyGroup[];
}
