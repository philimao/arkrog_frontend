import { useState, useEffect } from "react";
import { seedApi } from "~/services/seed";
import { useUserInfoStore } from "~/stores/userInfoStore";
import type { SeedComment } from "~/types/seedType";
import { toast } from "react-toastify";
import { openModal } from "~/utils/dom";

export function CommentSection({
  seedId,
  onCommentCountChange,
}: {
  seedId: string;
  onCommentCountChange: (count: number) => void;
}) {
  const { userInfo } = useUserInfoStore();
  const [comments, setComments] = useState<SeedComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [replyTo, setReplyTo] = useState<{
    id: string;
    username: string;
  } | null>(null);

  useEffect(() => {
    loadComments();
  }, [seedId]);

  async function loadComments() {
    setLoading(true);
    try {
      const { comments, total } = await seedApi.getComments(seedId);
      setComments(comments);
      onCommentCountChange(total);
    } catch (error) {
      toast.error("加载评论失败");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!userInfo?.level) {
      return openModal("login");
    }

    if (!inputValue.trim()) {
      return toast.warning("评论内容不能为空");
    }

    try {
      const newComment = await seedApi.addComment(
        seedId,
        inputValue,
        replyTo?.id,
        replyTo?.username,
      );

      setComments((prev) => [newComment, ...prev]);
      setInputValue("");
      setReplyTo(null);
      onCommentCountChange(comments.length + 1);
      toast.success("评论成功");
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  async function handleDelete(commentId: string) {
    if (!window.confirm("确定删除此评论?")) return;

    try {
      await seedApi.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      onCommentCountChange(comments.length - 1);
      toast.success("删除成功");
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  return (
    <div className="absolute top-full left-0 right-0 z-10 bg-black-gray border-t border-ak-blue p-4">
      {/* 输入区 */}
      <div className="mb-4">
        {replyTo && (
          <div className="text-sm text-gray-400 mb-2">
            回复 @{replyTo.username}
            <button
              className="ml-2 text-ak-blue"
              onClick={() => setReplyTo(null)}
            >
              取消
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 bg-mid-gray px-3 py-2 outline-none"
            placeholder={replyTo ? `回复 @${replyTo.username}` : "发表评论..."}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
          <button
            className="px-4 py-2 bg-ak-blue hover:bg-opacity-80"
            onClick={handleSubmit}
          >
            提交
          </button>
        </div>
      </div>

      {/* 评论列表 */}
      {loading ? (
        <div className="text-center py-4">加载中...</div>
      ) : comments.length === 0 ? (
        <div className="text-center py-4 text-gray-400">暂无评论</div>
      ) : (
        <div className="max-h-[400px] overflow-y-auto space-y-3">
          {comments.map((comment) => (
            <div key={comment._id} className="flex gap-3">
              <img
                className="w-10 h-10 rounded-full flex-shrink-0"
                src={comment.userAvatar}
                alt={comment.username}
                referrerPolicy="no-referrer"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold">{comment.username}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(comment.date_created).toLocaleString("zh-CN")}
                  </span>
                </div>
                <div className="text-sm mb-2">
                  {comment.replyToUser && (
                    <span className="text-ak-blue">
                      @{comment.replyToUser}{" "}
                    </span>
                  )}
                  {comment.content}
                </div>
                <div className="flex gap-3 text-xs">
                  <button
                    className="text-gray-400 hover:text-ak-blue"
                    onClick={() =>
                      setReplyTo({
                        id: comment._id,
                        username: comment.username,
                      })
                    }
                  >
                    回复
                  </button>
                  {(userInfo?.username === comment.username ||
                    userInfo?.level! > 3) && (
                    <button
                      className="text-gray-400 hover:text-red-500"
                      onClick={() => handleDelete(comment._id)}
                    >
                      删除
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
