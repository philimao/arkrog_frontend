import React, { useCallback, useEffect, useRef, useState } from "react";
import { styled } from "styled-components";
import {
  type FileWithPreview,
  useCosUpload,
  type UseCosUploadReturn,
} from "~/hooks/useCosUpload";
import { Badge, Button, Progress, Select, SelectItem } from "@heroui/react";
import { toast } from "react-toastify";
import { useParams } from "react-router";
import { useTournamentDataStore } from "~/stores/tournamentsDataStore";
import { useStorageStore } from "~/stores/storageStore";
import { CloseIcon } from "../Icons";
import ImageCropper from "./ImageCropper";
import { closeModal } from "~/utils/dom";
import type { UseCosListReturn } from "~/hooks/useCosList";

const StyledUploadBoxContainer = styled.div`
  height: min(43rem, 80vh);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  position: relative;
  overflow: hidden;
`;

const StyledUploadBoxWrapper = styled.div`
  display: flex;
  justify-content: center;
`;

const StyledUploadBox = styled.div<{ $hasFile: boolean; $isDragging: boolean }>`
  width: 100%;
  height: ${(props) =>
    props.$hasFile ? "10rem" : "min(41rem, calc(80vh - 2rem))"};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${(props) =>
    props.$isDragging ? "var(--ak-blue)" : "var(--light-gray)"};
  border: ${(props) =>
      props.$isDragging ? "var(--ak-blue)" : "var(--light-gray)"}
    3px dashed;
  border-radius: 0.25rem;
  background: rgba(0, 0, 0, 0.1);
`;

const StyledUploadFileTableWrapper = styled.div`
  flex-grow: 1;
  overflow-y: auto;
  scrollbar-width: thin;
`;

const StyledUploadFileTable = styled.table`
  width: 100%;
`;

const StyledUploadFileTableRow = styled.tr`
  background: rgba(0, 0, 0, 0.2);
  &:not(:last-child) {
    border-bottom: rgba(255, 255, 255, 0.3) 2px solid;
  }
  & > *:first-child {
    padding: 0.5rem 0 0.5rem 0.5rem;
  }
  & > *:last-child {
    padding-right: 1rem;
  }
`;

const StyledThumbnailWrapper = styled.td`
  width: 9rem;
  height: 7rem;
  display: flex;
  justify-content: center;
  position: relative;

  &.active {
    cursor: pointer;
  }

  & > img {
    object-fit: contain;
    transition: filter 0.2s ease;
  }

  &.active:hover > img {
    filter: brightness(0.5);
  }

  &::after {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 2rem;
    height: 2rem;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg' fill='none'%3E%3Cpath d='M21.2799 6.40005L11.7399 15.94C10.7899 16.89 7.96987 17.33 7.33987 16.7C6.70987 16.07 7.13987 13.25 8.08987 12.3L17.6399 2.75002C17.8754 2.49308 18.1605 2.28654 18.4781 2.14284C18.7956 1.99914 19.139 1.92124 19.4875 1.9139C19.8359 1.90657 20.1823 1.96991 20.5056 2.10012C20.8289 2.23033 21.1225 2.42473 21.3686 2.67153C21.6147 2.91833 21.8083 3.21243 21.9376 3.53609C22.0669 3.85976 22.1294 4.20626 22.1211 4.55471C22.1128 4.90316 22.0339 5.24635 21.8894 5.5635C21.7448 5.88065 21.5375 6.16524 21.2799 6.40005V6.40005Z' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' stroke='%23fff'/%3E%3Cpath d='M11 4H6C4.93913 4 3.92178 4.42142 3.17163 5.17157C2.42149 5.92172 2 6.93913 2 8V18C2 19.0609 2.42149 20.0783 3.17163 20.8284C3.92178 21.5786 4.93913 22 6 22H17C19.21 22 20 20.2 20 18V13' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' stroke='%23fff'/%3E%3C/svg%3E");
    background-size: contain;
    background-repeat: no-repeat;
    opacity: 0;
    transition: opacity 0.2s ease;
    pointer-events: none;
  }

  &.active:hover::after {
    opacity: 1;
  }
`;

const StyledFilename = styled.td`
  width: 50%;
  & > div {
    display: flex;
    gap: 1rem;
    align-items: center;
    input,
    span {
      flex-grow: 1;
      padding: 0.25rem 1rem;
    }
  }
`;

const StyledSelectPrefix = styled.td`
  padding: 0 1rem;
  min-width: 8rem;
`;

const StyledFileControlButton = styled.button``;

export default function UploadBox({
  useCosListHook,
}: {
  useCosListHook: UseCosListReturn;
}) {
  const useCosUploadHook = useCosUpload();
  const {
    files,
    addFiles,
    clearFiles,
    uploadFiles,
    isUploading,
    progress,
    taskMap,
  } = useCosUploadHook;

  const { listBucket } = useCosListHook;

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 是否正在拖拽进入视口
  const [isDraggingOverViewport, setIsDraggingOverViewport] = useState(false);

  // 裁剪相关状态
  const [cropFile, setCropFile] = useState<FileWithPreview | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  // 全局拖拽事件监听
  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      setIsDraggingOverViewport(true);
    };

    const handleDragLeave = (e: DragEvent) => {
      // 只有从视口边缘离开时才关闭状态
      if (
        e.clientX <= 0 ||
        e.clientY <= 0 ||
        e.clientX >= window.innerWidth ||
        e.clientY >= window.innerHeight
      ) {
        setIsDraggingOverViewport(false);
      }
    };

    // 监听整个文档的拖拽事件
    document.addEventListener("dragenter", handleDragEnter);
    document.addEventListener("dragleave", handleDragLeave);

    return () => {
      document.removeEventListener("dragenter", handleDragEnter);
      document.removeEventListener("dragleave", handleDragLeave);
    };
  }, []);

  // 处理文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      addFiles(Array.from(selectedFiles));
    }
  };

  const resetFileSelection = (
    e: React.MouseEvent<HTMLInputElement, MouseEvent>,
  ) => {
    const element = e.target as HTMLInputElement;
    element.value = "";
  };

  // 拖动文件相关处理，如果缺少drop时会打开新窗口
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDraggingOverViewport(false);
      const droppedFiles = e.dataTransfer.files;
      if (droppedFiles.length > 0) {
        addFiles(Array.from(droppedFiles));
      }
    },
    [addFiles],
  );

  // 点击 div 打开文件选择框
  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // 裁剪相关处理函数
  const handleOpenCropper = (file: FileWithPreview) => {
    setCropFile(file);
    setIsCropping(true);
  };

  const handleCloseCropper = () => {
    setIsCropping(false);
    setCropFile(null);
  };

  const handleCropSave = useCallback(
    (croppedBlob: Blob) => {
      if (!cropFile) return;

      // 创建新文件
      const newFile = new File(
        [croppedBlob],
        cropFile.filename + "." + cropFile.ext,
        {
          type: croppedBlob.type || "image/jpeg",
        },
      );

      // 更新文件列表
      useCosUploadHook.setFiles((files) => {
        return files.map((f) => {
          if (f.id === cropFile.id) {
            // 释放旧的preview URL
            URL.revokeObjectURL(f.preview);
            // 创建新的preview URL
            const newPreview = URL.createObjectURL(newFile);
            return {
              ...f,
              file: newFile,
              preview: newPreview,
            };
          }
          return f;
        });
      });

      handleCloseCropper();
    },
    [cropFile, useCosUploadHook],
  );

  // 获取赛事名称
  const { tournamentId } = useParams();
  const { tournamentsData } = useTournamentDataStore();
  const { uploadDirectory, uploadLabel } = useStorageStore();
  const tournamentData =
    tournamentsData &&
    tournamentsData.find((tournament) => tournament.id === tournamentId);

  const folder =
    uploadDirectory ||
    (tournamentData
      ? "tournament/" + tournamentData.name.replace(/[!@#$%^&*()+\s]+/g, "_") // 特殊字符处理
      : "");

  if (!folder)
    return (
      <StyledUploadBoxContainer>
        未检测到待上传的赛事名称
      </StyledUploadBoxContainer>
    );

  return (
    <StyledUploadBoxContainer>
      <StyledUploadBoxWrapper>
        <StyledUploadBox
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleClick}
          $isDragging={isDraggingOverViewport}
          $hasFile={files.length > 0}
        >
          <span className="text-center">
            <div className="flex justify-center">
              <svg className="mb-4" width="3rem" height="3rem">
                <use href="#picture" />
              </svg>
            </div>
            {isDraggingOverViewport ? (
              <>
                在这里松开
                <br />
                （jpg, jpeg, png, gif, webp，最大10MB）
              </>
            ) : (
              <>
                点击或拖动图片文件
                <br />
                （jpg, jpeg, png, gif, webp，最大10MB）
              </>
            )}
          </span>
        </StyledUploadBox>
      </StyledUploadBoxWrapper>
      <input
        type="file"
        accept="image/jpg,image/jpeg,image/png,image/gif,image/webp"
        multiple
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileSelect}
        onClick={resetFileSelection}
      />
      <StyledUploadFileTableWrapper>
        <StyledUploadFileTable>
          <tbody>
            {files.map((file) => (
              <FileEntry
                file={file}
                folder={folder}
                uploadLabel={uploadLabel}
                useCosUploadHook={useCosUploadHook}
                onOpenCropper={handleOpenCropper}
                key={file.filename}
              />
            ))}
          </tbody>
        </StyledUploadFileTable>
      </StyledUploadFileTableWrapper>
      {isUploading && (
        <Progress
          classNames={{
            base: "",
            track: "drop-shadow-md border border-default",
            indicator: "bg-gradient-to-r from-pink-500 to-yellow-500",
            label: "tracking-wider font-medium text-default-600",
            value: "text-foreground/60",
          }}
          label={`当前速度：${parseInt(String((progress.speed / 1024 / 1024) * 100)) / 100}MB/s，已上传：${parseInt(String((progress.loaded / 1024 / 1024) * 100)) / 100}MB/${parseInt(String((progress.total / 1024 / 1024) * 100)) / 100}MB`}
          radius="sm"
          showValueLabel={true}
          size="md"
          value={progress.percent * 100}
        />
      )}
      {files.length > 0 && !isUploading && (
        <div className="text-end">
          {Object.values(taskMap).length !== files.length && (
            <Button
              onPress={() => uploadFiles().then(() => listBucket(true, folder))}
              className="bg-ak-blue text-black rounded-none font-bold me-2"
            >
              上传文件
            </Button>
          )}
          <Button
            onPress={clearFiles}
            className="bg-ak-red rounded-none font-bold"
          >
            清空文件
          </Button>
        </div>
      )}
      <SVG />
      {isCropping && cropFile && (
        <ImageCropper
          file={cropFile}
          onClose={handleCloseCropper}
          onSave={handleCropSave}
        />
      )}
    </StyledUploadBoxContainer>
  );
}

function FileEntry({
  file,
  folder,
  uploadLabel,
  useCosUploadHook,
  onOpenCropper,
}: {
  file: FileWithPreview;
  folder: string;
  uploadLabel: string;
  useCosUploadHook: UseCosUploadReturn;
  onOpenCropper: (file: FileWithPreview) => void;
}) {
  // 修改文件名
  const [editing, setEditing] = useState(false);
  const [filename, setFilename] = useState(file.filename);
  // 选择传输目录
  const options = [
    { prefix: folder + "/avatar/", label: "赛事头像" },
    { prefix: folder + "/rule/", label: "赛事规则" },
    { prefix: folder + "/team/", label: "队伍头像" },
    { prefix: folder + "/other/", label: "其他内容" },
  ];
  const [prefix, setPrefix] = useState<string>(options[0].prefix);

  useEffect(() => {
    if (uploadLabel) {
      setPrefix(
        options.find((option) => option.label === uploadLabel)?.prefix ||
          options[0].prefix,
      );
    } else {
      setPrefix(options[0].prefix);
    }
  }, [folder, uploadLabel]);

  const { setFiles, removeFile, taskMap, cancelTask, pauseTask, restartTask } =
    useCosUploadHook;

  const { onUploadedItemClick } = useStorageStore();

  useEffect(() => {
    setFiles((files) => {
      const updated = [...files];
      const i = updated.findIndex((f) => f.id === file.id);
      updated[i].prefix = prefix;
      return updated;
    });
  }, [file.id, prefix, setFiles]);

  const task = taskMap[file.id];
  const Icon = ({ id }: { id: string }) => (
    <svg width="1rem" height="1rem" style={{ fill: "white", stroke: "none" }}>
      <use href={"#" + id} />
    </svg>
  );
  const control = !task ? (
    <StyledFileControlButton
      className="rounded-md p-1 hover:bg-ak-red"
      onClick={() => removeFile(file)}
    >
      <CloseIcon width="1rem" height="1rem" />
    </StyledFileControlButton>
  ) : task.status === "uploading" ? (
    <StyledFileControlButton onClick={() => pauseTask(file.id)}>
      <Icon id="pause" />
    </StyledFileControlButton>
  ) : task.status === "cancelled" ? (
    <StyledFileControlButton>已取消</StyledFileControlButton>
  ) : task.status === "failed" ? (
    <StyledFileControlButton>上传失败</StyledFileControlButton>
  ) : task.status === "finished" ? (
    <StyledFileControlButton
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard
          .writeText("https://" + task.location)
          .then(() => toast.info("复制成功！"));
      }}
    >
      <Icon id="copy" />
    </StyledFileControlButton>
  ) : (
    <>
      <StyledFileControlButton
        onClick={() => restartTask(file.id)}
        className="me-2"
      >
        <Icon id="resume" />
      </StyledFileControlButton>
      <StyledFileControlButton
        className="rounded-md p-1 hover:bg-ak-red"
        onClick={() => cancelTask(file.id)}
      >
        <CloseIcon width="1rem" height="1rem" />
      </StyledFileControlButton>
    </>
  );

  const handleRowClick = () => {
    if (task?.status === "finished" && onUploadedItemClick) {
      // 从task.location提取Key (location格式为: bucket.region.myqcloud.com/key)
      const locationParts = task.location.split("/");
      const key = locationParts.slice(1).join("/");

      onUploadedItemClick({
        Key: key,
        LastModified: new Date().toISOString(),
        ETag: "",
        Size: String(file.file.size),
        Owner: { ID: "" },
        StorageClass: "STANDARD",
        url: "https://" + task.location,
      });
      closeModal("upload-center");
    }
  };

  return (
    <StyledUploadFileTableRow
      key={file.id}
      onClick={handleRowClick}
      className={
        task?.status === "finished" ? "hover:bg-dark-gray cursor-pointer" : ""
      }
    >
      {/* 缩略图 */}
      <StyledThumbnailWrapper
        onClick={(e) => {
          e.stopPropagation();
          if (!task) onOpenCropper(file);
        }}
        title={!task ? "点击裁剪图片" : undefined}
        className={!task ? "active" : ""}
      >
        <img src={file.preview} alt={file.filename} />
      </StyledThumbnailWrapper>
      {/* 文件名 */}
      <StyledFilename>
        {editing ? (
          <div className="text" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              value={filename}
              onChange={(evt) => setFilename(evt.target.value)}
              className="p-2 focus:outline-ak-blue"
              maxLength={64}
            />
            <svg
              width="1rem"
              height="1rem"
              className={task?.status === "finished" ? "hidden" : "block"}
              style={{ stroke: "white", cursor: "pointer" }}
              onClick={(e) => {
                e.stopPropagation();
                setFiles((files) => {
                  const i = files.findIndex((f) => f.id === file.id);
                  files[i].filename = filename;
                  return files;
                });
                setEditing(false);
              }}
            >
              <use href="#save" />
            </svg>
          </div>
        ) : (
          <div className="text">
            <span>{file.filename + "." + file.ext}</span>
            <svg
              width="1rem"
              height="1rem"
              className={
                (task?.status === "finished" ? "hidden" : "block") +
                " flex-shrink-0"
              }
              style={{ fill: "white", stroke: "none", cursor: "pointer" }}
              onClick={(e) => {
                e.stopPropagation();
                setEditing(true);
              }}
            >
              <use href="#pencil" />
            </svg>
          </div>
        )}
      </StyledFilename>
      {/* 选择传输目录 */}
      <StyledSelectPrefix onClick={(e) => e.stopPropagation()}>
        <Select
          radius="none"
          aria-label="select prefix"
          labelPlacement="outside-left"
          selectedKeys={[prefix]}
          onChange={(evt) => setPrefix(evt.target.value)}
          disallowEmptySelection={true}
          classNames={{
            trigger: "bg-[#00000033] rounded-none",
            value: "",
            popoverContent: "bg-mid-gray rounded-none",
            listbox: "rounded-none",
          }}
          disabled={!!task}
        >
          {options.map((option) => (
            <SelectItem key={option.prefix}>{option.label}</SelectItem>
          ))}
        </Select>
      </StyledSelectPrefix>
      <td className="h-100 text-center">
        <Badge
          color="danger"
          content="过大"
          variant="shadow"
          showOutline={false}
          size="sm"
          isInvisible={file.file.size < 10 * 1048576}
        >
          <span>
            {Math.round(file.file.size / 10485.76) / 100 + "MB"}
            &nbsp;&nbsp;&nbsp;&nbsp;
          </span>
        </Badge>
      </td>
      <td className="text-center" onClick={(e) => e.stopPropagation()}>
        {control}
      </td>
    </StyledUploadFileTableRow>
  );
}

const SVG = () => (
  <svg className="hidden">
    <symbol
      id="picture"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      version="1.1"
    >
      <g stroke="none" strokeWidth="1" fillRule="evenodd">
        <g transform="translate(-360.000000, -99.000000)" fill="currentColor">
          <path
            d="M368,109 C366.896,109 366,108.104 366,107 C366,105.896 366.896,105 368,105 C369.104,105 370,105.896 370,107 C370,108.104 369.104,109 368,109 L368,109 Z M368,103 C365.791,103 364,104.791 364,107 C364,109.209 365.791,111 368,111 C370.209,111 372,109.209 372,107 C372,104.791 370.209,103 368,103 L368,103 Z M390,116.128 L384,110 L374.059,120.111 L370,116 L362,123.337 L362,103 C362,101.896 362.896,101 364,101 L388,101 C389.104,101 390,101.896 390,103 L390,116.128 L390,116.128 Z M390,127 C390,128.104 389.104,129 388,129 L382.832,129 L375.464,121.535 L384,112.999 L390,118.999 L390,127 L390,127 Z M364,129 C362.896,129 362,128.104 362,127 L362,126.061 L369.945,118.945 L380.001,129 L364,129 L364,129 Z M388,99 L364,99 C361.791,99 360,100.791 360,103 L360,127 C360,129.209 361.791,131 364,131 L388,131 C390.209,131 392,129.209 392,127 L392,103 C392,100.791 390.209,99 388,99 L388,99 Z"
            id="image-picture"
          ></path>
        </g>
      </g>
    </symbol>
    <symbol id="pause" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
      <g
        id="SVGRepo_tracerCarrier"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></g>
      <g id="SVGRepo_iconCarrier">
        <path d="M7 1H2V15H7V1Z"></path>
        <path d="M14 1H9V15H14V1Z"></path>
      </g>
    </symbol>
    <symbol id="resume" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
      <g
        id="SVGRepo_tracerCarrier"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></g>
      <g id="SVGRepo_iconCarrier">
        <path d="M1 14H3L9 8L3 2H1V14Z"></path>
        <path d="M15 2H13V14H15V2Z"></path>
        <path d="M9 2H11V14H9V2Z"></path>
      </g>
    </symbol>
    <symbol id="copy" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
      <g
        id="SVGRepo_tracerCarrier"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></g>
      <g id="SVGRepo_iconCarrier">
        <path d="M0 0H10V4H4V10H0V0Z"></path>
        <path d="M16 6H6V16H16V6Z"></path>
      </g>
    </symbol>
    <symbol
      id="pencil"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
    >
      <g strokeLinecap="round" strokeLinejoin="round"></g>
      <g id="SVGRepo_iconCarrier">
        <path
          d="M21.2799 6.40005L11.7399 15.94C10.7899 16.89 7.96987 17.33 7.33987 16.7C6.70987 16.07 7.13987 13.25 8.08987 12.3L17.6399 2.75002C17.8754 2.49308 18.1605 2.28654 18.4781 2.14284C18.7956 1.99914 19.139 1.92124 19.4875 1.9139C19.8359 1.90657 20.1823 1.96991 20.5056 2.10012C20.8289 2.23033 21.1225 2.42473 21.3686 2.67153C21.6147 2.91833 21.8083 3.21243 21.9376 3.53609C22.0669 3.85976 22.1294 4.20626 22.1211 4.55471C22.1128 4.90316 22.0339 5.24635 21.8894 5.5635C21.7448 5.88065 21.5375 6.16524 21.2799 6.40005V6.40005Z"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          stroke="#fff"
        ></path>
        <path
          d="M11 4H6C4.93913 4 3.92178 4.42142 3.17163 5.17157C2.42149 5.92172 2 6.93913 2 8V18C2 19.0609 2.42149 20.0783 3.17163 20.8284C3.92178 21.5786 4.93913 22 6 22H17C19.21 22 20 20.2 20 18V13"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          stroke="#fff"
        ></path>
      </g>
    </symbol>
    <symbol
      id="save"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
      <g
        id="SVGRepo_tracerCarrier"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></g>
      <g id="SVGRepo_iconCarrier">
        <path
          d="M15 20V15H9V20M18 20H6C4.89543 20 4 19.1046 4 18V6C4 4.89543 4.89543 4 6 4H14.1716C14.702 4 15.2107 4.21071 15.5858 4.58579L19.4142 8.41421C19.7893 8.78929 20 9.29799 20 9.82843V18C20 19.1046 19.1046 20 18 20Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        ></path>
      </g>
    </symbol>
  </svg>
);
