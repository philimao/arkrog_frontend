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
  date_created: number;
  date_modified?: number;
  date_published: number;
}

export interface TeamMemberData {
  charId: string;
  name: string;
  skillId: string;
  skillStr?: string;
  uniequipId?: string;
  charData?: CharBasicData;
}
