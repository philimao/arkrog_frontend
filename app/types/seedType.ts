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
  /** 元数据 */
  metadata?: SeedMetadata;
}

export interface SeedMetadata {
  likes: number;
  dislikes: number;
  copies: number;
  comments: number;
  /** 当前用户的操作状态 */
  userAction?: "like" | "dislike" | "none";
}

export interface SeedComment {
  _id: string;
  seedId: string;
  userId: string;
  username: string;
  userAvatar: string;
  content: string;
  replyTo: string | null;
  replyToUser: string | null;
  date_created: number;
}
