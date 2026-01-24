export interface SeedType {
  _id: string;
  /** 肉鸽主题，rogue_1~rogue_5 */
  rogue: string;
  /** 种子代码   */
  code: string;
  /** 提交者 */
  raider: string;
  /** 提交者头像 */
  raiderImage: string;
  /** 种子类型 */
  type: string;
  /** 种子标题 */
  title: string;
  /** 种子标签 */
  labels: string[];
  /** 种子备注 */
  note: string;
  /** 关联视频URL */
  url: string;
  /** 创建时间 */
  date_created: number;
  /** 修改时间 */
  date_modified?: number;
}
