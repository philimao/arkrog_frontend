// useFileUpload.ts
import React, { useState } from "react";
import { toast } from "react-toastify";
import { cos } from "~/utils/storage";
import { useUserInfoStore } from "~/stores/userInfoStore";
import COS from "cos-js-sdk-v5";
import { useStorageStore } from "~/stores/storageStore";
import { hashString } from "~/utils/tools";
import { compressImageForUpload } from "~/components/COS/compressImage";

export type FileWithPreview = {
  id: string; // hash
  filename: string; // w/o ext
  ext: string; // ext only
  prefix: string;
  preview: string; // base64
  file: File; // original file
};

interface TaskMapItem {
  taskId: string;
  location: string;
  status: "uploading" | "paused" | "cancelled" | "finished" | "failed";
}

type TaskMapType = Record<string, TaskMapItem>;

export interface UseCosUploadReturn {
  files: FileWithPreview[];
  setFiles: React.Dispatch<React.SetStateAction<FileWithPreview[]>>;
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

const extWhiteList = ["jpg", "jpeg", "png", "gif", "webp"];

const defaultProgress = {
  loaded: 0,
  total: 0,
  speed: 0,
  percent: 0,
};

/**
 * 负责COS上行内容的处理
 */
export const useCosUpload = (): UseCosUploadReturn => {
  const { getBucket } = useStorageStore();
  const { userInfo } = useUserInfoStore();

  // 所有上传文件列表
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  // 正在上传/已上传的任务列表
  const [taskMap, setTaskMap] = useState<TaskMapType>({});
  // 是否正在上传
  const [isUploading, setIsUploading] = useState<boolean>(false);
  // 上传进度
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
      toast.warning(
        "请选择至少一个有效的图片文件（jpg, jpeg, png, gif, webp）",
      );
      return;
    }

    const newFilesWithPreview = await Promise.all(
      allowedFiles.map(async (file) => ({
        id: await hashString(file.name, 16),
        filename: file.name.split(".")[0],
        ext: file.name.split(".")[1],
        prefix: "",
        preview: URL.createObjectURL(file), // 生成预览 URL
        file,
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

  const cancelTask = (id: string) => {
    setTaskMap((prev) => {
      const updated = { ...prev };
      const task = updated[id];
      cos.cancelTask(task.taskId);
      updated[id] = {
        ...updated[id],
        status: "cancelled",
      };
      return updated;
    });
  };

  const pauseTask = (id: string) => {
    setTaskMap((prev) => {
      const updated = { ...prev };
      const task = updated[id];
      cos.pauseTask(task.taskId);
      updated[id] = {
        ...updated[id],
        status: "paused",
      };
      return updated;
    });
  };

  const restartTask = (id: string) => {
    setTaskMap((prev) => {
      const updated = { ...prev };
      const task = updated[id];
      cos.restartTask(task.taskId);
      updated[id] = {
        ...updated[id],
        status: "uploading",
      };
      return updated;
    });
  };

  /**
   * 上传文件到服务器
   */
  const uploadFiles = async () => {
    try {
      const info = await getBucket();
      if (!info) return;
      const { Bucket, Region } = info;

      // 过滤掉已上传完成的文件
      const filesToUpload = files.filter(
        (file) => !taskMap[file.id] || taskMap[file.id].status !== "finished",
      );

      if (filesToUpload.length === 0) {
        toast.info("没有需要上传的新文件");
        return;
      }

      // 压缩文件处理（跳过GIF文件）
      const processedFiles = await Promise.all(
        filesToUpload.map(async (fileWithPreview) => {
          const file = fileWithPreview.file;

          // GIF文件不需要压缩
          if (file.type === "image/gif") {
            return fileWithPreview;
          }

          // 检查是否为图片文件且需要压缩
          if (
            file.type.startsWith("image/") &&
            ["image/jpeg", "image/jpg", "image/png"].includes(file.type)
          ) {
            try {
              // 根据prefix确定上传类型
              const isAvatarType = fileWithPreview.prefix.includes("/avatar/");
              const isTeamType = fileWithPreview.prefix.includes("/team/");
              const uploadType = isAvatarType
                ? "赛事头像"
                : isTeamType
                  ? "队伍头像"
                  : "其他内容";

              const compressedResult = await compressImageForUpload(
                file,
                uploadType,
                fileWithPreview.filename,
              );

              // 返回更新后的文件信息
              return {
                ...fileWithPreview,
                file: compressedResult.file,
                filename: compressedResult.filename,
                ext: compressedResult.ext,
              };
            } catch (error) {
              console.error("压缩文件失败:", error);

              // 检查是否为比例不符合要求的错误
              if (
                error instanceof Error &&
                error.message.startsWith("ASPECT_RATIO_INVALID:")
              ) {
                const uploadType = error.message.split(":")[1];
                toast.warning(
                  `${uploadType}要求为正方形，点击图片缩略图进行裁剪`,
                );
                // 中断上传任务，抛出错误让上传流程停止
                throw error;
              }

              // 压缩失败时使用原文件
              return fileWithPreview;
            }
          }

          // 非图片文件或不需要压缩的文件直接返回
          return fileWithPreview;
        }),
      );

      // 替换特殊字符
      processedFiles.forEach(
        (pf) => (pf.filename = pf.filename.replace(/[!@#$%^&*()+\s]+/g, "_")),
      );

      // 更新UI显示的文件信息（文件名、扩展名、文件大小等）
      setFiles((prevFiles) =>
        prevFiles.map((f) => {
          const processedFile = processedFiles.find((pf) => pf.id === f.id);
          return processedFile || f;
        }),
      );

      // 当任务列表发生更新时
      const updateFunc = (data: { list: COS.TaskList }) => {
        if (
          data.list.every((item) =>
            ["error", "success", "canceled"].includes(item.state),
          )
        ) {
          setIsUploading(false);
          setProgress(defaultProgress);
          cos.off("list-update", updateFunc);
          // console.log(data.list);
        }
      };
      cos.on("list-update", updateFunc);

      setIsUploading(true);
      await cos.uploadFiles({
        files: processedFiles.map((fileWithPreview) => {
          const file = fileWithPreview.file;
          const Key =
            fileWithPreview.prefix +
            generateCosDateKey() +
            "_" +
            fileWithPreview.filename +
            "." +
            fileWithPreview.ext;
          return {
            Bucket: Bucket,
            Region: Region,
            Key: Key,
            Body: file,
            ContentLength: file.size,
            ContentType: file.type,
            onTaskReady: function (taskId) {
              setTaskMap((prev) => {
                const updated = { ...prev };
                // 使用hash后的文件名作为key
                updated[fileWithPreview.id] = {
                  taskId,
                  location: "",
                  status: "uploading",
                };
                return updated;
              });
            },
            Headers: {
              "x-cos-meta-username": encodeURIComponent(
                userInfo?.username || "",
              ),
              "x-cos-meta-filename": encodeURIComponent(file.name),
            },
          };
        }),
        onProgress: function (info) {
          // 整合进度
          setProgress(info);
        },
        onFileFinish: function (err, data, options) {
          // 从cos key还原filename
          const filenameWithDate = options.Key.split("/").slice(-1)[0];
          const filename = filenameWithDate.split("_").slice(1).join("_");
          const id =
            processedFiles.find((f) => f.filename + "." + f.ext === filename)
              ?.id || "";
          if (!id) throw new Error("Invalid file id");
          setTaskMap((prev) => {
            const updated = { ...prev };
            updated[id] = {
              ...updated[id],
              location: data?.Location || "",
              status: err ? "failed" : "finished",
            };
            return updated;
          });
        },
      });
    } catch (err) {
      console.log(err);

      // 如果是比例不符合要求的错误，已经在前面显示了警告，不需要再显示错误
      if (
        err instanceof Error &&
        err.message.startsWith("ASPECT_RATIO_INVALID:")
      ) {
        // 中断上传
        setIsUploading(false);
        setProgress(defaultProgress);
        return;
      }

      toast.error(
        `上传失败！\n${(err as Error).name}: ${(err as Error).message}`,
      );
    }
  };

  return {
    files,
    setFiles,
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
