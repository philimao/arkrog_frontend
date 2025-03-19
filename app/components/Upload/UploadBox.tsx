import React, { useCallback, useRef } from "react";
import { styled } from "styled-components";
import { useFileUpload } from "~/hooks/useFileUpload";
import { Button, Progress } from "@heroui/react";
import { Badge } from "@heroui/badge";

const StyledUploadBoxContainer = styled.div``;

const StyledUploadBoxWrapper = styled.div`
  display: flex;
  justify-content: center;
`;

const StyledUploadBox = styled.div`
  width: 20rem;
  height: 12rem;
  margin-bottom: 0.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border: var(--ak-blue) 3px dashed;
  border-radius: 0.25rem;
  background: rgba(0, 0, 0, 0.1);
`;

const StyledUploadFileWrapper = styled.div``;

const StyledUploadFile = styled.div`
  height: 6rem;
  margin-bottom: 1rem;
  gap: 2rem;
  display: flex;
  & .text {
    line-height: 6rem;
  }
  & > .file-control {
    display: flex;
    align-items: center;
  }
`;

const StyledImagePreviewWrapper = styled.div`
  width: 9rem;
  display: flex;
  justify-content: center;
  & > img {
    object-fit: contain;
  }
`;

const StyledFileControlButton = styled.button`
  //width: 1.5rem;
  height: 1.5rem;
  border-radius: 0.25rem;
  white-space: nowrap;
`;

export default function UploadBox() {
  const {
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
  } = useFileUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      addFiles(Array.from(selectedFiles));
    }
  };

  // 拖动文件相关处理
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
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

  return (
    <StyledUploadBoxContainer>
      <StyledUploadBoxWrapper>
        <StyledUploadBox
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <span className="text-center">
            点击或拖动图片文件
            <br />
            （jpg, jpeg, png, gif，最大10MB）
          </span>
        </StyledUploadBox>
      </StyledUploadBoxWrapper>
      <input
        type="file"
        accept="image/jpg,image/jpeg,image/png,image/gif"
        multiple
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileSelect}
      />
      <StyledUploadFileWrapper>
        {files.map((file) => {
          const filename = file.filename;
          const task = taskMap[filename];
          const control = !task ? (
            <StyledFileControlButton onClick={() => removeFile(file)}>
              删除
            </StyledFileControlButton>
          ) : task.status === "uploading" ? (
            <StyledFileControlButton onClick={() => pauseTask(filename)}>
              暂停
            </StyledFileControlButton>
          ) : task.status === "cancelled" ? (
            <StyledFileControlButton>已取消</StyledFileControlButton>
          ) : task.status === "failed" ? (
            <StyledFileControlButton>上传失败</StyledFileControlButton>
          ) : task.status === "finished" ? (
            <StyledFileControlButton
              onClick={() => navigator.clipboard.writeText(task.location)}
            >
              复制链接
            </StyledFileControlButton>
          ) : (
            <>
              <StyledFileControlButton onClick={() => restartTask(filename)}>
                恢复
              </StyledFileControlButton>
              <StyledFileControlButton onClick={() => cancelTask(filename)}>
                取消
              </StyledFileControlButton>
            </>
          );
          return (
            <StyledUploadFile key={file.file.name} className="file-item">
              <StyledImagePreviewWrapper>
                <img
                  src={file.preview}
                  alt={file.file.name}
                  className="file-preview"
                />
              </StyledImagePreviewWrapper>
              <span className="text">{file.file.name}</span>
              <div className="h-100 flex items-center">
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
              </div>
              <div className="file-control">{control}</div>
            </StyledUploadFile>
          );
        })}
      </StyledUploadFileWrapper>
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
        <>
          <Button
            onPress={uploadFiles}
            className="bg-ak-blue text-black rounded-none font-bold me-2"
          >
            上传文件
          </Button>
          <Button
            onPress={clearFiles}
            className="bg-ak-red rounded-none font-bold"
          >
            清空文件
          </Button>
        </>
      )}
    </StyledUploadBoxContainer>
  );
}
