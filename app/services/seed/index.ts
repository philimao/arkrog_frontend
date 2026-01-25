import { api } from "../api";
import type { SeedMetadata, SeedComment } from "~/types/seedType";
import type { FavoriteItem } from "~/types/userInfo";

/**
 * 种子操作 API
 */
export const seedApi = {
  /**
   * 提交种子
   */
  async submit(data: Record<string, unknown>) {
    await api.post("/seed/submit", data);
  },

  /**
   * 点赞/点踩
   */
  async action(seedId: string, action: "like" | "dislike" | "none") {
    const response = await api.post<SeedMetadata>("/seed/action", {
      seedId,
      action,
    });
    return response.data;
  },

  /**
   * 复制计数
   */
  async copy(seedId: string) {
    await api.post("/seed/copy", { seedId });
  },

  /**
   * 获取评论
   */
  async getComments(seedId: string, page = 0, limit = 20) {
    const response = await api.post<{ comments: SeedComment[]; total: number }>(
      "/seed/comments",
      { seedId, page, limit },
    );
    return response.data;
  },

  /**
   * 添加评论
   */
  async addComment(
    seedId: string,
    content: string,
    replyTo?: string,
    replyToUser?: string,
  ) {
    const response = await api.post<SeedComment>("/seed/comment", {
      seedId,
      content,
      replyTo,
      replyToUser,
    });
    return response.data;
  },

  /**
   * 删除评论
   */
  async deleteComment(commentId: string) {
    await api.post("/seed/comment/delete", { commentId });
  },

  /**
   * 删除种子
   */
  async delete(seedId: string) {
    await api.post("/seed/delete", { _id: seedId });
  },

  /**
   * 收藏/取消收藏种子
   */
  async toggleFavorite(
    seedId: string,
    operate: "add" | "remove",
  ): Promise<FavoriteItem[]> {
    const response = await api.post<FavoriteItem[]>("/user/favorite", {
      operate,
      item: { _id: seedId, type: "seed" },
    });
    return response.data;
  },
};
