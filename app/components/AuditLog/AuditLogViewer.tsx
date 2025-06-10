import { useEffect, useState } from "react";
import { _get } from "~/utils/tools";

interface AuditLogEntry {
  id: string;
  resourceType: string;
  resourceId: string;
  action: string;
  operatorUsername: string;
  timestamp: number;
  dateString: string;
  changes: Array<{
    type: "added" | "removed" | "modified" | "created" | "deleted";
    path: string;
    oldValue?: any;
    newValue?: any;
    value?: any;
  }>;
  metadata: Record<string, any>;
}

interface AuditLogViewerProps {
  resourceType: string;
  resourceId: string;
  limit?: number;
}

export default function AuditLogViewer({ resourceType, resourceId, limit = 20 }: AuditLogViewerProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await _get<{
          success: boolean;
          data: AuditLogEntry[];
        }>(`/audit-log/${resourceType}/${resourceId}?limit=${limit}`);

        if (response.success) {
          setLogs(response.data);
        }
      } catch (error) {
        console.error("获取审计日志失败:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [resourceType, resourceId, limit]);

  const formatChange = (change: AuditLogEntry["changes"][0]) => {
    switch (change.type) {
      case "added":
        return `➕ 新增 ${change.path}: ${JSON.stringify(change.value)}`;
      case "removed":
        return `➖ 删除 ${change.path}: ${JSON.stringify(change.oldValue)}`;
      case "modified":
        return `📝 修改 ${change.path}: ${JSON.stringify(change.oldValue)} → ${JSON.stringify(change.newValue)}`;
      case "created":
        return `🆕 创建资源`;
      case "deleted":
        return `🗑️ 删除资源`;
      default:
        return JSON.stringify(change);
    }
  };

  if (loading) {
    return <div className="text-center p-4">加载审计日志中...</div>;
  }

  return (
    <div className="audit-log-viewer">
      <h3 className="text-lg font-bold mb-4">操作历史</h3>
      {logs.length === 0 ? (
        <p className="text-gray-500">暂无操作记录</p>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => (
            <div key={log.id} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="font-medium text-blue-600">{log.operatorUsername}</span>
                  <span className="ml-2 text-sm text-gray-600">{log.action}</span>
                </div>
                <span className="text-xs text-gray-500">{log.dateString}</span>
              </div>

              {log.changes.length > 0 && (
                <div className="mt-2">
                  <details className="cursor-pointer">
                    <summary className="text-sm font-medium text-gray-700">变更详情 ({log.changes.length} 项)</summary>
                    <div className="mt-2 space-y-1">
                      {log.changes.map((change, index) => (
                        <div key={index} className="text-xs font-mono bg-white p-2 rounded border">
                          {formatChange(change)}
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
