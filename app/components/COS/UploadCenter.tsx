import React from "react";
import ListObject from "~/components/COS/ListObject";
import UploadBox from "~/components/COS/UploadBox";
import { styled } from "styled-components";
import ModalTemplate from "~/components/Modal";
import { Modal, ModalContent, useDisclosure } from "@heroui/react";
import { StyledModalContent } from "~/modules/TopNav/styled";

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

const StyledTrigger = styled.button`
  position: fixed;
  right: 3rem;
  bottom: 3rem;
  width: 3rem;
  height: 3rem;
  background: var(--black-gray);
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
`;

export default function UploadCenter() {
  const [activeTab, setActiveTab] = React.useState<string>("upload-box");
  const { onOpen, isOpen, onClose } = useDisclosure();

  return (
    <div>
      <StyledTrigger onClick={onOpen}>
        <svg
          width="1.5rem"
          height="1.5rem"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
          <g
            id="SVGRepo_tracerCarrier"
            stroke-linecap="round"
            stroke-linejoin="round"
          ></g>
          <g id="SVGRepo_iconCarrier">
            <path
              d="M10 2C9.44772 2 9 2.44772 9 3V12H7V3C7 1.34315 8.34315 0 10 0C11.6569 0 13 1.34315 13 3V11C13 13.7614 10.7614 16 8 16C5.23858 16 3 13.7614 3 11V3.5H5V11C5 12.6569 6.34315 14 8 14C9.65685 14 11 12.6569 11 11V3C11 2.44772 10.5523 2 10 2Z"
              fill="#ffffff"
            ></path>
          </g>
        </svg>
      </StyledTrigger>
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
                onClick={() => setActiveTab("list-object")}
              >
                查看
              </StyledTab>
            </div>
            <div className={activeTab === "upload-box" ? "block" : "hidden"}>
              <UploadBox />
            </div>
            <div className={activeTab === "list-object" ? "block" : "hidden"}>
              <ListObject />
            </div>
          </StyledModalContent>
        </ModalContent>
      </Modal>
    </div>
  );
}
