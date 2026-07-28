import type { CharBasicData } from "~/types/gameData";

export interface RecordType {
  _id: string;
  url: string;
  raider: string;
  raiderImage: string;
  raiderLink: string;
  stageId: string;
  type: string;
  team: TeamMemberData[];
  note: string;
  level: string;
  submitter: string;
  /** 提交人用户ID（后端返回全文档；老记录可能缺失） */
  submitterId?: string;
  /** 最近编辑人用户名（仅被编辑过的记录有） */
  editor?: string;
  date_created: number;
  date_modified?: number;
  date_published: number;
}

export interface TeamMemberData {
  charId: string;
  name: string;
  skillId: string;
  skillStr: string;
  skillName: string;
  uniequipId: string;
  uniequipName: string;
  charData?: CharBasicData;
}
