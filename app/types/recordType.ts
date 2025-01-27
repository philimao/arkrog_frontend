export interface RecordType {
  _id: string;
  url: string;
  raider: string;
  type: string;
  team: string[];
  note: string;
  level: string;
  date_created: number;
  date_modified?: number;
}
