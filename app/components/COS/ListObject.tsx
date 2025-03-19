import { useCosList } from "~/hooks/useCosList";
import { styled } from "styled-components";
import { Button } from "@heroui/react";

const StyledListObjectWrapper = styled.div``;

const StyledObject = styled.div`
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

const StyledThumbnailWrapper = styled.div`
  width: 9rem;
  display: flex;
  justify-content: center;
  & > img {
    object-fit: contain;
  }
`;

export default function ListObject() {
  const { objects, listBucket } = useCosList();

  return (
    <div>
      <Button onPress={listBucket}>列出所有文件</Button>
      {objects.length > 0 &&
        objects.map((object) => {
          return (
            <StyledListObjectWrapper key={object.ETag}>
              <StyledObject>
                <StyledThumbnailWrapper>
                  <img src={object.url + "/thumbnail"} alt="thumbnail" />
                </StyledThumbnailWrapper>
                <span className="text">
                  {Math.round(parseInt(object.Size) / 10485.76) / 100 + "MB"}
                </span>
                <span className="text">
                  {new Date(object.LastModified).toLocaleDateString("zh-CN")}
                </span>
                <div className="file-control">
                  <Button
                    onPress={() => navigator.clipboard.writeText(object.url)}
                  >
                    复制链接
                  </Button>
                </div>
              </StyledObject>
            </StyledListObjectWrapper>
          );
        })}
    </div>
  );
}
