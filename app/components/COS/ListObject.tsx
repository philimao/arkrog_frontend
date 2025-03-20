import { useCosList } from "~/hooks/useCosList";
import { styled } from "styled-components";
import { Pagination } from "@heroui/react";
import React, { useEffect } from "react";

const StyledListObjectWrapper = styled.div``;

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

export default function ListObject() {
  const { objects, listBucket } = useCosList();
  const pageSize = 5;
  const [currentPage, setCurrentPage] = React.useState(1);

  useEffect(() => {
    listBucket();
  }, []);

  return (
    <StyledListObjectWrapper>
      <StyledObjectTable>
        <tbody>
          {objects.length > 0 &&
            objects
              .slice(pageSize * (currentPage - 1), pageSize * currentPage)
              .map((object) => {
                return (
                  <StyledObject key={object.ETag}>
                    <StyledThumbnailWrapper>
                      <img src={object.url + "/thumbnail"} alt="thumbnail" />
                    </StyledThumbnailWrapper>
                    <td className="text">{object.Key}</td>
                    <td className="text">
                      {Math.round(parseInt(object.Size) / 10485.76) / 100 +
                        "MB"}
                    </td>
                    <td className="text">
                      {new Date(object.LastModified).toLocaleDateString(
                        "zh-CN",
                      )}
                    </td>
                    <td className="text-center">
                      <button>
                        <svg
                          width="1.5rem"
                          height="1.5rem"
                          style={{ fill: "white", stroke: "none" }}
                        >
                          <use href="#copy" />
                        </svg>
                      </button>
                    </td>
                  </StyledObject>
                );
              })}
        </tbody>
      </StyledObjectTable>
      {objects.length > pageSize && (
        <div className="flex justify-center">
          <Pagination
            radius="none"
            page={currentPage}
            total={Math.ceil(objects.length / pageSize)}
            onChange={setCurrentPage}
            showControls={true}
            classNames={{ cursor: "bg-ak-blue text-black" }}
          />
        </div>
      )}
    </StyledListObjectWrapper>
  );
}
