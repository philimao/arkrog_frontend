export interface SeedType {
  _id: string;
  code: string;
  raider: string;
  raiderImage: string;
  type: string;
  title: string;
  labels: string[];
  note: string;
  url: string;
  date_created: number;
  date_modified?: number;
}
