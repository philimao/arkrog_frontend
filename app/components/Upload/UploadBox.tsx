import React, { useCallback, useRef } from "react";
import { styled } from "styled-components";
import { useFileUpload } from "~/hooks/useFileUpload";
import { Button } from "@heroui/react";

const StyledUploadBoxContainer = styled.div``;

const StyledUploadBoxWrapper = styled.div`
  display: flex;
  justify-content: center;
`;

const StyledUploadBox = styled.div`
  width: 20rem;
  height: 12rem;
  line-height: 12rem;
  margin-bottom: 0.5rem;
  cursor: pointer;
  text-align: center;
  border: var(--ak-blue) 3px dashed;
  border-radius: 0.25rem;
  background: rgba(0, 0, 0, 0.1);
`;

const StyledImagePreviewWrapper = styled.div``;

const StyledImagePreview = styled.div`
  height: 8rem;
  margin-bottom: 0.25rem;
  gap: 2rem;
  display: flex;
  & > img {
    width: 8rem;
    object-fit: contain;
  }
  & > span {
    line-height: 8rem;
  }
  & > .remove-file {
    display: flex;
    align-items: center;
  }
  & > .remove-file > button {
    background: red;
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 0.25rem;
  }
`;

export default function UploadBox() {
  const { files, addFiles, removeFile, clearFiles, uploadFiles } =
    useFileUpload();
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
          点击或拖动文件
        </StyledUploadBox>
      </StyledUploadBoxWrapper>
      <input
        type="file"
        accept="image/*"
        multiple
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileSelect}
      />
      <StyledImagePreviewWrapper>
        {files.map((file) => {
          return (
            <StyledImagePreview key={file.file.name} className="file-item">
              <img
                src={file.preview}
                alt={file.file.name}
                className="file-preview"
              />
              <span>{file.file.name}</span>
              <span>{Math.round(file.file.size / 10000) / 100 + "MB"}</span>
              <div className="remove-file">
                <button onClick={() => removeFile(file)}>X</button>
              </div>
            </StyledImagePreview>
          );
        })}
      </StyledImagePreviewWrapper>
      {files.length > 0 && (
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
