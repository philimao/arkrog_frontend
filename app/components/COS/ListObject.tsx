import { type CosObjectWithUrl } from "~/hooks/useCosList";
import { styled } from "styled-components";
import {
  Listbox,
  ListboxItem,
  Pagination,
  Switch,
  Tooltip,
} from "@heroui/react";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

const StyledListObjectWrapper = styled.div``;

const StyledNav = styled.div`
  display: flex;
  margin-bottom: 1rem;
  align-items: center;
`;

const StyledBreadcrumbWrapper = styled.div`
  align-items: center;
`;

const StyledBreadcrumb = styled.div`
  display: flex;
`;

const StyledBreadcrumbItem = styled.div`
  &:not(:last-child)::after {
    content: "/";
    margin: 0 0.5rem;
  }
`;

const StyledBreadcrumbTrigger = styled.button`
  color: var(--ak-blue);
`;

const StyledDisplaySwitch = styled.div`
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StyledObjectTable = styled.table`
  width: 100%;
  margin-bottom: 1rem;
`;

const StyledObject = styled.tr`
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

interface FlatPath {
  fullPath: string; // 完整路径（如 "a/b/c/d.jpg"）
  parentPath: string; // 父级路径（如 "a/b/c"）
  name: string; // 当前层级名称（如 "d.jpg"）
  content?: CosObjectWithUrl; // 是否为文件
}

export default function ListObject({
  objects,
}: {
  objects: CosObjectWithUrl[];
}) {
  // 文件夹展示 / 时间倒序展示
  const [byFolder, setByFolder] = useState(false);

  const pageSize = 5;
  const [currentPage, setCurrentPage] = React.useState(1);

  const flatPaths = useMemo(() => {
    const pathSet = new Set<string>(); // 去重容器
    const flatPaths: FlatPath[] = [];

    objects.forEach((content) => {
      const fullPath = content.Key;
      const parts = fullPath.split("/");
      let currentPath = "";

      parts.forEach((part, index) => {
        currentPath += (currentPath ? "/" : "") + part;
        if (pathSet.has(currentPath)) return;

        const isFile = index === parts.length - 1 && part.includes(".");
        flatPaths.push({
          fullPath: currentPath,
          parentPath: currentPath.split("/").slice(0, -1).join("/"),
          name: part,
          content: isFile ? content : undefined,
        });
        pathSet.add(currentPath);
      });
    });
    return flatPaths;
  }, [objects]);

  // 路径，由多个不含斜杠的name组成
  const [location, setLocation] = useState<string[]>([]);

  const breadcrumbs = useMemo<Array<Array<string>>>(() => {
    const bc = [];
    for (let depth = 0; depth < location.length; depth++) {
      const parentPath = location.slice(0, depth).join("/");
      const items = flatPaths
        .filter(
          (flatPath) => !flatPath.content && flatPath.parentPath === parentPath,
        )
        .map((flatPath) => flatPath.name);
      bc.push(items);
    }
    return bc;
  }, [location, flatPaths]);

  const filteredPaths = useMemo(() => {
    if (byFolder) {
      const joinedLocation = location.join("/");
      return flatPaths.filter(
        (flatPath) => flatPath.parentPath === joinedLocation,
      );
    } else {
      return flatPaths.filter((flatPath) => flatPath.content);
    }
  }, [byFolder, flatPaths, location]);

  useEffect(() => {
    setCurrentPage(1);
  }, [byFolder]);

  return (
    <StyledListObjectWrapper>
      <StyledNav>
        <StyledBreadcrumbWrapper className={byFolder ? "flex" : "hidden"}>
          <svg
            style={{
              width: "1rem",
              height: "1rem",
              fill: "var(--ak-blue)",
              margin: "0 1rem 0 0.5rem",
              cursor: "pointer",
            }}
            onClick={() =>
              setLocation((prev) => prev.slice(0, prev.length - 1))
            }
          >
            <use href="#back" />
          </svg>
          <span>当前路径：</span>
          <StyledBreadcrumb>
            <StyledBreadcrumbItem>
              <StyledBreadcrumbTrigger onClick={() => setLocation([])}>
                根目录
              </StyledBreadcrumbTrigger>
            </StyledBreadcrumbItem>
            {breadcrumbs.map((breadcrumb, index) => {
              return (
                <StyledBreadcrumbItem key={index}>
                  <Tooltip
                    isDisabled={breadcrumb.length < 2}
                    placement="bottom"
                    closeDelay={0}
                    content={
                      <Listbox
                        variant="bordered"
                        onAction={(key) => {
                          setLocation((prev) => {
                            const updated = [...prev];
                            return [...updated.slice(0, index), key as string];
                          });
                        }}
                      >
                        {breadcrumb.map((b) => {
                          return (
                            <ListboxItem
                              key={b}
                              classNames={{
                                base: "data-[hover=true]:border-ak-blue",
                              }}
                            >
                              {b}
                            </ListboxItem>
                          );
                        })}
                      </Listbox>
                    }
                  >
                    <StyledBreadcrumbTrigger
                      onClick={() =>
                        setLocation((prev) => prev.slice(0, index + 1))
                      }
                    >
                      {location[index]}
                    </StyledBreadcrumbTrigger>
                  </Tooltip>
                </StyledBreadcrumbItem>
              );
            })}
          </StyledBreadcrumb>
        </StyledBreadcrumbWrapper>
        <StyledDisplaySwitch>
          <span>上传日期</span>
          <Switch
            isSelected={byFolder}
            onValueChange={setByFolder}
            classNames={{
              wrapper: "group-data-[selected=true]:bg-ak-blue",
            }}
          />
          <span>文件夹</span>
        </StyledDisplaySwitch>
      </StyledNav>
      <div className="min-h-[38.75rem] flex flex-col">
        <StyledObjectTable>
          <tbody>
            {filteredPaths
              .slice(pageSize * (currentPage - 1), pageSize * currentPage)
              .map((flatPath) => {
                const content = flatPath.content;
                return (
                  <StyledObject
                    key={flatPath.name}
                    className={!content ? "cursor-pointer" : ""}
                    onDoubleClick={() =>
                      !content &&
                      setLocation((prev) => {
                        const updated = [...prev];
                        updated.push(flatPath.name);
                        return updated;
                      })
                    }
                  >
                    <StyledThumbnailWrapper>
                      {content ? (
                        <img src={content.url + "/thumbnail"} alt="thumbnail" />
                      ) : (
                        <svg>
                          <use href="#folder" />
                        </svg>
                      )}
                    </StyledThumbnailWrapper>
                    <td className="text" style={{ width: "50%" }}>
                      {flatPath.name}
                    </td>
                    <td className="text">
                      {content
                        ? Math.round(parseInt(content.Size) / 10485.76) / 100 +
                          "MB"
                        : ""}
                    </td>
                    <td className="text">
                      {content
                        ? new Date(content.LastModified).toLocaleDateString(
                            "zh-CN",
                          )
                        : ""}
                    </td>
                    <td className="text-center">
                      {content && (
                        <button
                          onClick={() =>
                            navigator.clipboard
                              .writeText(content?.url)
                              .then(() => toast.info("复制成功！"))
                          }
                        >
                          <svg
                            width="1.5rem"
                            height="1.5rem"
                            style={{ fill: "white", stroke: "none" }}
                          >
                            <use href="#copy" />
                          </svg>
                        </button>
                      )}
                    </td>
                  </StyledObject>
                );
              })}
          </tbody>
        </StyledObjectTable>
        {filteredPaths.length > pageSize && (
          <div className="flex justify-center items-end flex-grow">
            <Pagination
              radius="none"
              page={currentPage}
              total={Math.ceil(filteredPaths.length / pageSize)}
              onChange={setCurrentPage}
              showControls={true}
              classNames={{ cursor: "bg-ak-blue text-black" }}
            />
          </div>
        )}
      </div>
    </StyledListObjectWrapper>
  );
}
