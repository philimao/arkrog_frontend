import Loading from "~/components/Loading";
import {
  ModalBody,
  ModalHeader,
  useDisclosure,
} from "@heroui/react";
import { ModalFooter } from "@heroui/modal";
import ModalTemplate from "~/components/Modal";
import { useTournamentDataStore } from "~/stores/tournamentsDataStore";
import { useParams } from "react-router";

export default function TournamentRulesModal({ id }: { id: string }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { tournamentId } = useParams();
  const { tournamentsData } = useTournamentDataStore();
  const currentTournament = tournamentsData?.find((tournament) => tournament.id === tournamentId);

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
            <ModalHeader>比赛规则</ModalHeader>
            <ModalBody>
              <div className="whitespace-pre-wrap">
                {/* TODO: support image or markdown rendering */}
                {currentTournament?.detailRule ?? currentTournament?.rule}
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
