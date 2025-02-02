import { useAppDataStore } from "~/stores/appDataStore";
import Loading from "~/components/Loading";
import Markdown from "react-markdown";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  useDisclosure,
} from "@heroui/react";
import { ModalFooter } from "@heroui/modal";
import { SVGIcon } from "~/components/SVGIcon/SVGIcon";
import React from "react";

export default function InclusionPrincipleModal({ id }: { id: string }) {
  const { inclusionPrinciple } = useAppDataStore();
  const { isOpen, onOpen, onClose } = useDisclosure();
  return (
    <>
      <button className="hidden" id={id} onClick={onOpen} />
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        placement="top-center"
        radius="none"
        size="full"
        scrollBehavior="inside"
        classNames={{
          base: "my-20",
          backdrop: "backdrop-blur-sm",
          closeButton: "top-6 end-6 bg-black-gray",
        }}
        backdrop="blur"
        closeButton={
          <button style={{ zIndex: 1000 }}>
            <SVGIcon name="modal-close" width="0.7rem" height="0.7rem" />
          </button>
        }
      >
        <ModalContent>
          {inclusionPrinciple ? (
            <>
              <ModalHeader>收录原则</ModalHeader>
              <ModalBody>
                <Markdown>{inclusionPrinciple}</Markdown>
              </ModalBody>
              <ModalFooter />
            </>
          ) : (
            <Loading />
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
