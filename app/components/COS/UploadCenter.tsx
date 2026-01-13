import React from "react";
import ListObject from "~/components/COS/ListObject";
import UploadBox from "~/components/COS/UploadBox";
import { styled } from "styled-components";
import { Modal, ModalContent, useDisclosure } from "@heroui/react";
import { StyledModalContent } from "~/modules/TopNav/styled";
import { useCosList } from "~/hooks/useCosList";
import { CloseIcon } from "../Icons";
import { useStorageStore } from "~/stores/storageStore";

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
  const useCosListHook = useCosList();
  const { uploadDirectory, clearUploadParams } = useStorageStore();

  return (
    <div className="upload-center-wrapper">
      <button id="upload-center" className="hidden" onClick={onOpen} />
      <Modal
        classNames={{
          base: "my-auto",
          backdrop: "backdrop-blur-sm",
          closeButton: "top-6 end-6 bg-black-gray",
        }}
        isOpen={isOpen}
        onClose={() => {
          onClose();
          setActiveTab("upload-box");
          clearUploadParams();
        }}
        size="5xl"
        radius="none"
        backdrop="blur"
        isDismissable={false}
        closeButton={
          <button id="close-upload-center" style={{ zIndex: 1000 }}>
            <CloseIcon width="0.7rem" height="0.7rem" />
          </button>
        }
      >
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
                  useCosListHook.listBucket(false, uploadDirectory);
                }}
              >
                查看
              </StyledTab>
            </div>
            <div className={activeTab === "upload-box" ? "block" : "hidden"}>
              <UploadBox useCosListHook={useCosListHook} />
            </div>
            <div className={activeTab === "list-object" ? "block" : "hidden"}>
              <ListObject useCosListHook={useCosListHook} />
            </div>
          </StyledModalContent>
        </ModalContent>
      </Modal>
    </div>
  );
}
