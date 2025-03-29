import React from "react";
import ListObject from "~/components/COS/ListObject";
import UploadBox from "~/components/COS/UploadBox";
import { styled } from "styled-components";
import { Modal, ModalContent, useDisclosure } from "@heroui/react";
import { StyledModalContent } from "~/modules/TopNav/styled";
import { useCosList } from "~/hooks/useCosList";

const StyledTab = styled.button`
  padding: 0.5rem 3rem;
  font-weight: bold;
  color: white;
  background: var(--black-gray);
  &.active {
    color: black;
    background: var(--ak-blue);
  }
`;

export default function UploadCenter() {
  const [activeTab, setActiveTab] = React.useState<string>("upload-box");
  const { onOpen, isOpen, onClose } = useDisclosure();
  const { objects, listBucket } = useCosList();
  return (
    <div className="upload-center-wrapper">
      <button id="upload-center" className="hidden" onClick={onOpen} />
      <Modal isOpen={isOpen} onClose={onClose} size="5xl" radius="none">
        <ModalContent>
          <StyledModalContent>
            <div className="mb-4">
              <StyledTab
                className={activeTab === "upload-box" ? "active" : ""}
                onClick={() => setActiveTab("upload-box")}
              >
                上传
              </StyledTab>
              <StyledTab
                className={activeTab === "list-object" ? "active" : ""}
                onClick={() => {
                  setActiveTab("list-object");
                  listBucket();
                }}
              >
                查看
              </StyledTab>
            </div>
            <div className={activeTab === "upload-box" ? "block" : "hidden"}>
              <UploadBox listBucket={listBucket} />
            </div>
            <div className={activeTab === "list-object" ? "block" : "hidden"}>
              <ListObject objects={objects} />
            </div>
          </StyledModalContent>
        </ModalContent>
      </Modal>
    </div>
  );
}
