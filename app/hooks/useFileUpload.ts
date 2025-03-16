// useFileUpload.ts
import { useState } from "react";

export type FileWithPreview = {
  file: File;
  preview: string;
};

export const useFileUpload = () => {
  const [files, setFiles] = useState<FileWithPreview[]>([]);

  // 添加文件
  const addFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter((file) =>
      file.type.startsWith("image/"),
    );
    const newFilesWithPreview = validFiles.map((file) => ({
      file, // 保存原始文件对象
      preview: URL.createObjectURL(file), // 生成预览 URL
    }));

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
    setFiles([]);
  };

  // 上传文件到服务器
  const uploadFiles = async () => {
    const formData = new FormData();
    files.forEach((fileWithPreview, index) => {
      formData.append(`image-${index}`, fileWithPreview.file);
    });

    try {
      const response = await fetch("/upload-image", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Files uploaded successfully! ${result.message}`);
        clearFiles(); // 清空文件列表
      } else {
        alert("Failed to upload files.");
      }
    } catch (error) {
      console.error("Error uploading files:", error);
      alert("Error uploading files.");
    }
  };

  return {
    files,
    addFiles,
    removeFile,
    clearFiles,
    uploadFiles,
  };
};
