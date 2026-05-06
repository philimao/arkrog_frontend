import { useEffect, useState } from "react";
import { _get } from "~/utils/tools";
import DiffView, { type AuditChange } from "./DiffView";
import DeltaView from "./DeltaView";

interface AuditLogEntry {
  id: string;
  resourceType: string;
  resourceId: string;
  action: string;
  operatorUsername: string;
  timestamp: number;
  dateString: string;
  /** 旧格式：自研字段级 diff */
  changes?: AuditChange[];
  /** 新格式：jsondiffpatch delta，按 objectHash 配对的细粒度数组 diff */
  delta?: unknown;
  metadata: Record<string, unknown>;
}

interface AuditLogViewerProps {
  resourceType: string;
  resourceId: string;
  limit?: number;
}

export default function AuditLogViewer({
  resourceType,
  resourceId,
  limit = 20,
}: AuditLogViewerProps) {
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

  if (loading) {
    return <div className="text-center p-4">加载审计日志中...</div>;
  }

  return (
    <div className="audit-log-viewer">
      <h3 className="text-lg font-bold mb-4 text-white">操作历史</h3>
      {logs.length === 0 ? (
        <p className="text-white/50">暂无操作记录</p>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => (
            <div
              key={log.id}
              className="rounded-lg p-4 bg-black/40 border border-white/10"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="font-medium text-ak-blue">
                    {log.operatorUsername}
                  </span>
                  <span className="ml-2 text-sm text-white/70">
                    {log.action}
                  </span>
                </div>
                <span className="text-xs text-white/50">{log.dateString}</span>
              </div>

              {(log.delta != null ||
                (log.changes && log.changes.length > 0)) && (
                <div className="mt-2">
                  <details className="cursor-pointer">
                    <summary className="text-sm font-medium text-white/80">
                      变更详情
                    </summary>
                    <div className="mt-2">
                      {log.delta != null ? (
                        <DeltaView delta={log.delta} />
                      ) : (
                        <DiffView changes={log.changes ?? []} />
                      )}
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
