import { SVGIcon } from "~/components/SVGIcon/SVGIcon";
import {
  Modal,
  ModalContent,
  type ModalProps,
  useDisclosure,
} from "@heroui/react";
import React from "react";
import { StyledModalContent } from "~/modules/TopNav/styled";

interface ModalControl {
  isOpen?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  onOpenChange?: (isOpen: boolean) => void;
}

interface ModalTemplateProps {
  trigger?: React.ReactNode;
  triggerId?: string;
  children: React.ReactNode;
  modalControl?: ModalControl;
}

export default function ModalTemplate({
  trigger,
  triggerId,
  children,
  modalControl,
  ...props
}: ModalTemplateProps & ModalProps): React.ReactElement {
  const {
    isOpen: myIsOpen,
    onOpen: myOnOpen,
    onClose: myOnClose,
    onOpenChange: myOnOpenChange,
  } = useDisclosure();
  const isOpen = modalControl?.isOpen || myIsOpen;
  const onOpen = modalControl?.onOpen || myOnOpen;
  const onClose = modalControl?.onClose || myOnClose;
  const onOpenChange = modalControl?.onOpenChange || myOnOpenChange;

  return (
    <>
      {trigger ?? <button className="hidden" id={triggerId} onClick={onOpen} />}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        onOpenChange={onOpenChange}
        placement="top-center"
        radius="none"
        classNames={{
          base: "my-20 overflow-y-auto hide-scroll",
          backdrop: "backdrop-blur-sm",
          closeButton: "top-6 end-6 bg-black-gray",
        }}
        backdrop="blur"
        closeButton={
          <button style={{ zIndex: 1000 }}>
            <SVGIcon name="modal-close" width="0.7rem" height="0.7rem" />
          </button>
        }
        {...props}
        scrollBehavior="inside"
      >
        <ModalContent>
          <StyledModalContent>{children}</StyledModalContent>
        </ModalContent>
      </Modal>
    </>
  );
}
