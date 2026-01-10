import Loading from "~/components/Loading";
import { ModalBody, ModalFooter, ModalHeader, useDisclosure } from "@heroui/react";
import ModalTemplate from "~/components/Modal";
import { useTournamentDataStore } from "~/stores/tournamentsDataStore";
import { useParams } from "react-router";
import Markdown from "~/components/Markdown";

export default function TournamentRulesModal({ id }: { id: string }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { tournamentId } = useParams();
  const { tournamentsData } = useTournamentDataStore();
  const currentTournament = tournamentsData?.find(
    (tournament) => tournament.id === tournamentId,
  );

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
        {currentTournament ? (
          <>
            <ModalHeader>详细规则</ModalHeader>
            <ModalBody>
              <div className="whitespace-pre-wrap">
                <Markdown>
                  {currentTournament?.detailRule ?? currentTournament?.rule}
                </Markdown>
              </div>
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
