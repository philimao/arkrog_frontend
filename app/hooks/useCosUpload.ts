// useFileUpload.ts
import { useState } from "react";
import { toast } from "react-toastify";
import { cos } from "~/utils/storage";
import { useUserInfoStore } from "~/stores/userInfoStore";
import { hashString } from "~/utils/tools";
import COS from "cos-js-sdk-v5";
import { useStorageStore } from "~/stores/storageStore";

export type FileWithPreview = {
  file: File;
  filename: string;
  preview: string;
};

interface TaskMapItem {
  taskId: string;
  location: string;
  status: "uploading" | "paused" | "cancelled" | "finished" | "failed";
}

type TaskMapType = Record<string, TaskMapItem>;

export interface UseCosUploadReturn {
  files: FileWithPreview[];
  addFiles: (newFiles: File[]) => Promise<void>;
  removeFile: (file: FileWithPreview) => void;
  clearFiles: () => void;
  uploadFiles: (Prefix?: string) => Promise<void>;
  isUploading: boolean;
  taskMap: TaskMapType;
  progress: COS.ProgressInfo;
  cancelTask: (filename: string) => void;
  pauseTask: (filename: string) => void;
  restartTask: (filename: string) => void;
}

const extWhiteList = ["jpg", "jpeg", "png", "gif"];

const defaultProgress = {
  loaded: 0,
  total: 0,
  speed: 0,
  percent: 0,
};

export const useCosUpload = (): UseCosUploadReturn => {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const { getBucket } = useStorageStore();
  const { userInfo } = useUserInfoStore();

  const [taskMap, setTaskMap] = useState<TaskMapType>({});
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [progress, setProgress] = useState<COS.ProgressInfo>(defaultProgress);

  // 检查文件扩展名是否在白名单中
  const isFileExtensionAllowed = (file: File) => {
    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    return fileExtension && extWhiteList.includes(fileExtension);
  };

  // 添加文件
  const addFiles = async (newFiles: File[]) => {
    const allowedFiles = newFiles.filter((file) => {
      return (
        file.type.startsWith("image/") &&
        isFileExtensionAllowed(file) &&
        !files.find((f) => f.file.name === file.name) // 避免重复添加
      );
    });

    if (allowedFiles.length === 0) {
      toast.warning("请选择至少一个有效的图片文件（jpg, jpeg, png, gif）");
      return;
    }

    const newFilesWithPreview = await Promise.all(
      allowedFiles.map(async (file) => ({
        file, // 保存原始文件对象
        filename:
          (await hashString(file.name, 8)).toUpperCase() +
          "." +
          file.name.split(".").slice(-1)[0],
        preview: URL.createObjectURL(file), // 生成预览 URL
      })),
    );

    setFiles((prevFiles) => [...prevFiles, ...newFilesWithPreview]);
  };

  // 删除文件
  const removeFile = (file: FileWithPreview) => {
    setFiles((prevFiles) =>
      prevFiles.filter((f) => f.file.name !== file.file.name),
    );
  };

  // 清空所有文件
  const clearFiles = () => {
    setTaskMap({});
    setFiles([]);
    setProgress(defaultProgress);
  };

  const generateCosDateKey = function () {
    const date = new Date();
    const m = date.getMonth() + 1;
    return `${date.getFullYear()}${m < 10 ? `0${m}` : m}${date.getDate()}`;
  };

  const cancelTask = (filename: string) => {
    setTaskMap((prev) => {
      const updated = { ...prev };
      const task = updated[filename];
      cos.cancelTask(task.taskId);
      updated[filename] = {
        ...updated[filename],
        status: "cancelled",
      };
      return updated;
    });
  };

  const pauseTask = (filename: string) => {
    setTaskMap((prev) => {
      const updated = { ...prev };
      const task = updated[filename];
      cos.pauseTask(task.taskId);
      updated[filename] = {
        ...updated[filename],
        status: "paused",
      };
      return updated;
    });
  };

  const restartTask = (filename: string) => {
    setTaskMap((prev) => {
      const updated = { ...prev };
      const task = updated[filename];
      cos.restartTask(task.taskId);
      updated[filename] = {
        ...updated[filename],
        status: "uploading",
      };
      return updated;
    });
  };

  /**
   * 上传文件到服务器
   * @param [Prefix] 目录前缀
   */
  const uploadFiles = async (Prefix?: string) => {
    try {
      const info = await getBucket();
      if (!info) return;
      const { Bucket, Region } = info;

      // 当任务列表发生更新时
      const updateFunc = (data: { list: COS.TaskList }) => {
        if (
          data.list.every((item) =>
            ["error", "success", "canceled"].includes(item.state),
          )
        ) {
          setIsUploading(false);
          cos.off("list-update", updateFunc);
          // console.log(data.list);
        }
      };
      cos.on("list-update", updateFunc);

      setIsUploading(true);
      await cos.uploadFiles({
        files: files.map((fileWithPreview) => {
          const file = fileWithPreview.file;
          const Key = generateCosDateKey() + "_" + fileWithPreview.filename;
          return {
            Bucket: Bucket,
            Region: Region,
            Key: Prefix || "" + Key,
            Body: file,
            ContentLength: file.size,
            ContentType: file.type,
            onTaskReady: function (taskId) {
              setTaskMap((prev) => {
                const updated = { ...prev };
                // 使用hash后的文件名作为key
                updated[fileWithPreview.filename] = {
                  taskId,
                  location: "",
                  status: "uploading",
                };
                return updated;
              });
            },
            Headers: {
              "x-cos-meta-username": userInfo?.username,
              "x-cos-meta-filename": file.name,
            },
          };
        }),
        onProgress: function (info) {
          // 整合进度
          setProgress(info);
        },
        onFileFinish: function (err, data, options) {
          // 从filename还原cos key
          const filename = options.Key.slice(9);
          setTaskMap((prev) => {
            const updated = { ...prev };
            updated[filename] = {
              ...updated[filename],
              location: data?.Location || "",
              status: err ? "failed" : "finished",
            };
            return updated;
          });
        },
      });
    } catch (err) {
      console.log(err);
      toast.error(
        `上传失败！${(err as Error).name}: ${(err as Error).message}`,
      );
    }
  };

  return {
    files,
    addFiles,
    removeFile,
    clearFiles,
    uploadFiles,
    isUploading,
    taskMap,
    progress,
    cancelTask,
    pauseTask,
    restartTask,
  };
};
