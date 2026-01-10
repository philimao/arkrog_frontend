import TournamentForm from "../components/TournamentForm";
import {
  StyledBackButton,
  StyledBackButtonContainer,
  StyledDivider,
} from "../components/Shared";
import { useNavigate } from "react-router";
import { useState } from "react";
import ModalTemplate from "~/components/Modal";
import { ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";

export default function TournamentCreate() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [tournamentName, setTournamentName] = useState("");

  const handleConfirm = () => {
    if (tournamentName.trim()) {
      // 使用encodeURIComponent对赛事名称进行URL编码
      const encodedName = encodeURIComponent(tournamentName.trim());
      navigate(`/tournament/create?tournamentName=${encodedName}`);
      setIsModalOpen(false);
    }
  };

  const handleCancel = () => {
    navigate("/tournament");
  };

  // 如果有查询参数的赛事名称，说明已经确认过了，直接显示表单
  const urlParams = new URLSearchParams(window.location.search);
  const hasTournamentName = urlParams.has("tournamentName");

  if (hasTournamentName) {
    return (
      <div className="relative">
        <StyledBackButtonContainer>
          <div className="relative">
            <StyledBackButton onClick={() => navigate(-1)}>
              返回
            </StyledBackButton>
          </div>
        </StyledBackButtonContainer>
        <h1 className="text-[1.5rem] font-bold">新建赛事</h1>
        <StyledDivider />
        <TournamentForm />
      </div>
    );
  }

  return (
    <div className="relative">
      <ModalTemplate
        isOpen={isModalOpen}
        onClose={handleCancel}
        modalControl={{
          isOpen: isModalOpen,
          onClose: handleCancel,
        }}
      >
        <ModalHeader className="text-white">新建赛事</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <label className="block text-sm font-light mb-1 text-white">
              赛事名称
            </label>
            <input
              type="text"
              value={tournamentName}
              onChange={(e) => setTournamentName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleConfirm();
                }
              }}
              className="w-full p-2 bg-mid-gray focus:outline focus:outline-2 focus:outline-ak-blue text-white"
              placeholder="例：仙术杯#5"
              autoFocus
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="light" onPress={handleCancel}>
            取消
          </Button>
          <Button
            color="primary"
            onPress={handleConfirm}
            disabled={!tournamentName.trim()}
          >
            确认
          </Button>
        </ModalFooter>
      </ModalTemplate>
    </div>
  );
}
