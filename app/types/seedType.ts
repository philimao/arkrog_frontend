export interface SeedType {
  _id: string;
  code: string;
  raider: string;
  raiderImage: string;
  raiderLink: string;
  type: string;
  labels: string[];
  note: string;
  date_created: number;
  date_modified?: number;
}
