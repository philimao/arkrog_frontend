import { useAppDataStore } from "~/stores/appDataStore";
import Loading from "~/components/Loading";
import Markdown from "~/components/Markdown";
import {
  ModalBody,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@heroui/react";
import ModalTemplate from "~/components/Modal";

export default function InclusionPrincipleModal({ id }: { id: string }) {
  const { inclusionPrinciple } = useAppDataStore();
  const { isOpen, onOpen, onClose } = useDisclosure();
  return (
    <>
      <button className="hidden" id={id} onClick={onOpen} />
      <ModalTemplate
        isOpen={isOpen}
        onClose={onClose}
        radius="none"
        backdrop="blur"
        size="3xl"
      >
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
      </ModalTemplate>
    </>
  );
}
