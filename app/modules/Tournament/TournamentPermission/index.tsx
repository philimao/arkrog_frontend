import { useEffect, useState } from "react";
import type { TournamentData } from "~/types/tournamentsData";
import { toast } from "react-toastify";
import { api } from "~/services/api";
import { CloseIcon } from "~/components/Icons";
import { StyledDivider } from "../components/Shared";

interface User {
  userId: string;
  username: string;
  face: string;
  level: number;
}

interface PermissionUser extends User {
  permissions: string[];
  /** 来自接口时为 user-specific；本地新增显式授权时固定为该值 */
  grantType?: "user-specific" | "level-global";
}

interface TournamentPermissionProps {
  tournamentData: TournamentData;
}

const labelClassName = "block text-sm font-light mb-1";
const inputClassName =
  "bg-mid-gray w-full p-2 focus:outline focus:outline-2 focus:outline-ak-blue";

const permissionMap = {
  read: "查看",
  write: "修改",
  delete: "删除",
  admin: "管理",
};

function formatPermissionLabels(permissions: string[]) {
  return permissions
    .map((p) => permissionMap[p as keyof typeof permissionMap])
    .join(", ");
}

function elevatedSourceHint(level: number) {
  if (level === 4) {
    return "模块管理员";
  }
  if (level >= 5) {
    return "全站管理员";
  }
  return "资源级授权";
}

export default function TournamentPermission({
  tournamentData,
}: TournamentPermissionProps) {
  const [explicitPermittedUsers, setExplicitPermittedUsers] = useState<
    PermissionUser[]
  >([]);
  const [elevatedPermittedUsers, setElevatedPermittedUsers] = useState<
    PermissionUser[]
  >([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<PermissionUser | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  // 加载已有权限的用户
  useEffect(() => {
    if (!tournamentData.id) return;

    const loadPermittedUsers = async () => {
      try {
        const response = await api.get(
          `/permission/resource/tournament:${tournamentData.id}/users`,
        );
        const users: PermissionUser[] = response.data.users || [];
        setExplicitPermittedUsers(
          users.filter((u) => u.grantType === "user-specific"),
        );
        setElevatedPermittedUsers(
          users.filter((u) => u.grantType === "level-global"),
        );
      } catch (error: any) {
        if (error.response?.status === 404) {
          setExplicitPermittedUsers([]);
          setElevatedPermittedUsers([]);
        } else {
          console.error("加载权限用户失败:", error);
        }
      }
    };

    loadPermittedUsers();
  }, [tournamentData.id]);

  // 搜索用户（手动触发）
  const handleSearch = async () => {
    if (!searchKeyword.trim()) {
      toast.error("请输入搜索关键词");
      return;
    }

    setIsSearching(true);
    setShowResults(false);
    try {
      const response = await api.get("/admin/search-users", {
        params: { keyword: searchKeyword },
      });
      setSearchResults(response.data.users || []);
      setShowResults(true);
    } catch (error) {
      console.error("搜索用户失败:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // 处理Enter键搜索
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  // 选择用户
  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setSearchKeyword("");
    setSearchResults([]);
    setShowResults(false);
    setSelectedPermissions([]);
  };

  // 切换权限选择
  const togglePermission = (permission: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission],
    );
  };

  // 添加或更新用户权限
  const handleAddOrUpdatePermission = async () => {
    if (!selectedUser && !editingUser) return;

    const user = editingUser || selectedUser;
    if (!user) return;

    if (selectedPermissions.length === 0) {
      toast.error("请至少选择一个权限");
      return;
    }

    setIsSaving(true);
    try {
      await api.post("/permission/grant", {
        resourceIdentifier: `tournament:${tournamentData.id}`,
        resourceName: tournamentData.name,
        userId: user.userId,
        username: user.username,
        level: user.level,
        permissions: selectedPermissions,
        face: user.face, // 传递用户头像
      });

      // 更新本地状态（仅显式授权列表）
      const updatedUser: PermissionUser = {
        ...user,
        permissions: selectedPermissions,
        grantType: "user-specific",
      };

      setExplicitPermittedUsers((prev) => {
        const existingIndex = prev.findIndex((u) => u.userId === user.userId);
        if (existingIndex >= 0) {
          const newUsers = [...prev];
          newUsers[existingIndex] = updatedUser;
          return newUsers;
        } else {
          return [...prev, updatedUser];
        }
      });

      setSelectedUser(null);
      setEditingUser(null);
      setSelectedPermissions([]);

      // 如果用户等级被升级，显示额外提示
      const levelUpgraded = user.level < 3;
      if (levelUpgraded) {
        toast.success("权限保存成功，用户等级已升级为Level 3，重新登陆后生效");
      } else {
        toast.success("权限保存成功");
      }
    } catch (error) {
      console.error("保存权限失败:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // 删除用户权限
  const handleRemoveUser = async (userId: string) => {
    if (!confirm("确定要删除该用户的权限吗？")) return;

    try {
      await api.post("/permission/revoke", {
        resourceIdentifier: `tournament:${tournamentData.id}`,
        userId,
      });

      setExplicitPermittedUsers((prev) =>
        prev.filter((u) => u.userId !== userId),
      );
      toast.success("权限已删除");
    } catch (error) {
      console.error("删除权限失败:", error);
    }
  };

  // 编辑用户
  const handleEditUser = (user: PermissionUser) => {
    setEditingUser(user);
    setSelectedUser(null);
    setSelectedPermissions(user.permissions);
    setSearchKeyword("");
    setSearchResults([]);
    setShowResults(false);
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingUser(null);
    setSelectedUser(null);
    setSelectedPermissions([]);
  };

  if (!tournamentData.id) {
    return null;
  }

  return (
    <div className="mt-8">
      <h2 className="text-[1.5rem] font-bold">赛事授权</h2>
      <StyledDivider />

      <div className="space-y-6 pb-4">
        {/* 本资源显式授权（可在此页增删改） */}
        <div>
          <label className={labelClassName}>本资源显式授权</label>
          {explicitPermittedUsers.length === 0 ? (
            <div className="text-light-mid-gray text-sm py-4 text-center bg-black-gray">
              暂无显式授权用户
            </div>
          ) : (
            <div className="space-y-2">
              {explicitPermittedUsers.map((user) => (
                <div
                  key={user.userId}
                  className="flex items-center gap-3 p-3 bg-black-gray hover:bg-mid-gray transition-colors"
                >
                  <img
                    src={user.face}
                    alt={user.username}
                    className="w-10 h-10 rounded-full flex-shrink-0"
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{user.username}</div>
                    <div className="text-sm text-light-mid-gray">
                      权限: {formatPermissionLabels(user.permissions)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleEditUser(user)}
                    className="px-3 py-1 text-sm bg-mid-gray hover:bg-light-gray transition-colors flex-shrink-0"
                  >
                    编辑
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveUser(user.userId)}
                    className="px-3 py-1 text-sm bg-ak-red hover:bg-ak-dark-red transition-colors flex-shrink-0"
                  >
                    删除
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 模块 / 全站高级权限（只读） */}
        <div>
          <label className={labelClassName}>模块与全站高级权限</label>
          {elevatedPermittedUsers.length === 0 ? (
            <div className="text-light-mid-gray text-sm py-4 text-center bg-black-gray">
              暂无此类用户
            </div>
          ) : (
            <div className="space-y-2">
              {elevatedPermittedUsers.map((user) => (
                <div
                  key={user.userId}
                  className="flex items-center gap-3 p-3 bg-black-gray"
                >
                  <img
                    src={user.face}
                    alt={user.username}
                    className="w-10 h-10 rounded-full flex-shrink-0"
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{user.username}</div>
                    <div className="text-sm text-light-mid-gray">
                      Level {user.level} · {elevatedSourceHint(user.level)}
                    </div>
                    <div className="text-sm text-light-mid-gray mt-0.5">
                      权限: {formatPermissionLabels(user.permissions)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 搜索用户 */}
        <div>
          <label className={labelClassName}>添加授权用户</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyDown={handleKeyDown}
                className={inputClassName}
                placeholder="输入用户名搜索..."
                disabled={!!selectedUser || !!editingUser}
              />
              {showResults &&
                searchResults.length > 0 &&
                !selectedUser &&
                !editingUser && (
                  <div className="absolute z-10 w-full mt-1 bg-dark-gray border border-mid-gray max-h-60 overflow-y-auto shadow-lg">
                    {searchResults.map((user) => (
                      <button
                        key={user.userId}
                        type="button"
                        onClick={() => handleSelectUser(user)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-mid-gray text-left transition-colors"
                      >
                        <img
                          src={user.face}
                          alt={user.username}
                          className="w-8 h-8 rounded-full flex-shrink-0"
                          referrerPolicy="no-referrer"
                          crossOrigin="anonymous"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="truncate">{user.username}</div>
                          <div className="text-xs text-light-mid-gray">
                            Level {user.level}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
            </div>
            <button
              type="button"
              onClick={handleSearch}
              disabled={isSearching || !!selectedUser || !!editingUser}
              className="px-6 py-2 bg-ak-blue text-black font-medium hover:bg-opacity-80 disabled:bg-mid-gray disabled:text-light-mid-gray disabled:cursor-not-allowed transition-colors flex-shrink-0"
            >
              {isSearching ? "搜索中..." : "搜索"}
            </button>
          </div>
          {showResults && searchResults.length === 0 && !isSearching && (
            <div className="text-light-mid-gray text-sm mt-2 py-2 text-center bg-black-gray">
              未找到匹配的用户
            </div>
          )}
        </div>

        {/* 选中的用户 - 权限配置 */}
        {(selectedUser || editingUser) && (
          <div className="p-4 bg-black-gray space-y-4 border border-mid-gray">
            <div className="flex items-center gap-3">
              <img
                src={(editingUser || selectedUser)!.face}
                alt={(editingUser || selectedUser)!.username}
                className="w-10 h-10 rounded-full flex-shrink-0"
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">
                  {(editingUser || selectedUser)!.username}
                </div>
                <div className="text-sm text-light-mid-gray">
                  Level {(editingUser || selectedUser)!.level}
                </div>
              </div>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-light-mid-gray hover:text-white transition-colors flex-shrink-0"
                title="取消"
              >
                <CloseIcon width="1rem" height="1rem" />
              </button>
            </div>

            <div>
              <label className={labelClassName}>授予权限</label>
              <div className="space-y-3 bg-mid-gray p-3">
                <label className="flex items-center gap-3 cursor-pointer hover:bg-dark-gray p-2 transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedPermissions.includes("write")}
                    onChange={() => togglePermission("write")}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="font-medium">修改权限</div>
                    <div className="text-sm text-light-mid-gray">
                      允许用户编辑赛事信息、阶段、选手等数据
                    </div>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer hover:bg-dark-gray p-2 transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedPermissions.includes("delete")}
                    onChange={() => togglePermission("delete")}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="font-medium">删除权限</div>
                    <div className="text-sm text-light-mid-gray">
                      允许用户删除赛事（危险操作）
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddOrUpdatePermission}
              disabled={isSaving || selectedPermissions.length === 0}
              className="w-full px-4 py-2 bg-ak-blue text-black font-medium hover:bg-opacity-80 disabled:bg-mid-gray disabled:text-light-mid-gray disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? "保存中..." : editingUser ? "更新权限" : "添加权限"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
