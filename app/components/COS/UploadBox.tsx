import React, { useCallback, useEffect, useRef, useState } from "react";
import { styled } from "styled-components";
import {
  type FileWithPreview,
  useCosUpload,
  type UseCosUploadReturn,
} from "~/hooks/useCosUpload";
import { Button, Progress, Select, SelectItem } from "@heroui/react";
import { Badge } from "@heroui/badge";
import { toast } from "react-toastify";
import { useParams } from "react-router";

const StyledUploadBoxContainer = styled.div``;

const StyledUploadBoxWrapper = styled.div`
  display: flex;
  justify-content: center;
`;

const StyledUploadBox = styled.div<{ $isDragging: boolean }>`
  width: 24rem;
  height: 16rem;
  margin-bottom: 1rem;
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

const StyledUploadFileTable = styled.table`
  width: 100%;
  margin-bottom: 1rem;
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
  & > img {
    object-fit: contain;
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
`;

const StyledFileControlButton = styled.button``;

export default function UploadBox() {
  const cosUpload = useCosUpload();
  const {
    files,
    addFiles,
    clearFiles,
    uploadFiles,
    isUploading,
    progress,
    taskMap,
  } = cosUpload;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 新增状态：是否正在拖拽进入视口
  const [isDraggingOverViewport, setIsDraggingOverViewport] = useState(false);

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

  return (
    <StyledUploadBoxContainer>
      <StyledUploadBoxWrapper>
        <StyledUploadBox
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleClick}
          $isDragging={isDraggingOverViewport}
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
                （jpg, jpeg, png, gif，最大10MB）
              </>
            ) : (
              <>
                点击或拖动图片文件
                <br />
                （jpg, jpeg, png, gif，最大10MB）
              </>
            )}
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
      <StyledUploadFileTable>
        <tbody>
          {files.map((file) => (
            <FileEntry file={file} cosUpload={cosUpload} key={file.filename} />
          ))}
        </tbody>
      </StyledUploadFileTable>
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
          {Object.values(taskMap).length === 0 && (
            <Button
              onPress={() => uploadFiles()}
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
    </StyledUploadBoxContainer>
  );
}

function FileEntry({
  file,
  cosUpload,
}: {
  file: FileWithPreview;
  cosUpload: UseCosUploadReturn;
}) {
  // 修改文件名
  const [editing, setEditing] = useState(false);
  const [filename, setFilename] = useState(file.filename);
  // 选择传输目录
  const { tournamentId } = useParams();
  const options = [
    { prefix: tournamentId + "/avatar/", label: "赛事头像" },
    { prefix: tournamentId + "/rule/", label: "赛事规则" },
    { prefix: tournamentId + "/team/", label: "队伍头像" },
    { prefix: tournamentId + "/other/", label: "其他内容" },
  ];
  const [prefix, setPrefix] = useState<string>(options[0].prefix);
  useEffect(() => {
    setFiles((files) => {
      const updated = [...files];
      const i = updated.findIndex((f) => f.id === file.id);
      updated[i].prefix = prefix;
      return updated;
    });
  }, [prefix]);

  const { setFiles, removeFile, taskMap, cancelTask, pauseTask, restartTask } =
    cosUpload;

  const task = taskMap[file.id];
  const Icon = ({ id }: { id: string }) => (
    <svg
      width="1.5rem"
      height="1.5rem"
      style={{ fill: "white", stroke: "none" }}
    >
      <use href={"#" + id} />
    </svg>
  );
  const control = !task ? (
    <StyledFileControlButton onClick={() => removeFile(file)}>
      <Icon id="close" />
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
      onClick={() =>
        navigator.clipboard
          .writeText(task.location)
          .then(() => toast.info("复制成功！"))
      }
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
      <StyledFileControlButton onClick={() => cancelTask(file.id)}>
        <Icon id="close" />
      </StyledFileControlButton>
    </>
  );
  return (
    <StyledUploadFileTableRow key={file.id}>
      <StyledThumbnailWrapper>
        <img src={file.preview} alt={file.filename} />
      </StyledThumbnailWrapper>
      <StyledFilename>
        {editing ? (
          <div className="text">
            <input
              type="text"
              value={filename}
              onChange={(evt) => setFilename(evt.target.value)}
            />
            <svg
              width="1rem"
              height="1rem"
              style={{ stroke: "white" }}
              onClick={() => {
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
              style={{ fill: "white", stroke: "none" }}
              onClick={() => setEditing(true)}
            >
              <use href="#pencil" />
            </svg>
          </div>
        )}
      </StyledFilename>
      <StyledSelectPrefix>
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
        >
          {options.map((option) => (
            <SelectItem key={option.prefix} value={option.prefix}>
              {option.label}
            </SelectItem>
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
      <td className="text-center">{control}</td>
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
    <svg id="close" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
      <g
        id="SVGRepo_tracerCarrier"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></g>
      <g id="SVGRepo_iconCarrier">
        <path d="M5.1716 8.00003L1.08582 3.91424L3.91424 1.08582L8.00003 5.1716L12.0858 1.08582L14.9142 3.91424L10.8285 8.00003L14.9142 12.0858L12.0858 14.9142L8.00003 10.8285L3.91424 14.9142L1.08582 12.0858L5.1716 8.00003Z"></path>
      </g>
    </svg>
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
