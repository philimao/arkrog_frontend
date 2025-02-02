import { useAppDataStore } from "~/stores/appDataStore";
import ModalTemplate from "~/components/Modal/index";
import Loading from "~/components/Loading";
import Markdown from "react-markdown";
import { ModalBody, ModalHeader } from "@heroui/react";
import { ModalFooter } from "@heroui/modal";

export default function InclusionPrincipleModal({ id }: { id: string }) {
  const { inclusionPrinciple } = useAppDataStore();

  return (
    <ModalTemplate triggerId={id} size="3xl">
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
  );
}
