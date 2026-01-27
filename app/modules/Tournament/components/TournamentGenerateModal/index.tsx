import {
  Modal,
  ModalHeader,
  ModalContent,
  ModalBody,
  ModalFooter,
  Button,
  Textarea,
} from "@heroui/react";
import { useState } from "react";
import { api } from "~/services/api";

export default function TournamentGenerateModal({
  isOpen,
  onConfirm,
  onClose,
}: {
  isOpen: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const [isProcessing, setIsProcessing] = useState(false);

  const [stageInfo, setStageInfo] = useState<string>("");

  const [teamInfo, setTeamInfo] = useState<string>("");

  const [gameInfo, setGameInfo] = useState<string>("");

  const handleConfirm = () => {
    api
      .post(
        "/tournament/llm-generate-stream",
        {
          stageInfo,
          teamInfo,
          gameInfo,
        },
        {
          responseType: "stream",
          timeout: 0,
          headers: {
            Accept: "text/event-stream",
          },
        },
      )
      .then((res) => {
        console.log(res);
      })
      .catch((err) => {
        console.error(err);
      });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" isDismissable={false}>
      <ModalContent>
        <ModalHeader>
          <h1>智能生成</h1>
        </ModalHeader>
        <ModalBody>
          <p>
            本工具将引导用户基于非结构化的赛事信息，使用AI工具自动生成赛事数据。
            <br />
            提交的信息可以不使用书面化表达，但请确保描述准确且覆盖所有必要内容。
            <br />
            部分表单字段难以自动生成，且AI工具并不能保证结果的完全正确，因此
            <strong className="text-ak-red">生成的信息需要经过人工核查</strong>
          </p>
          <Textarea
            variant="faded"
            label="请填写赛程信息与赛事类型"
            labelPlacement="outside"
            placeholder="包含赛事基本信息，各赛程信息，例：&#10;仙术杯#6于2024年12月举办，主办方为龙哥哥今天又鸽了，类型为团体赛，14~22日为初赛，27~29日为决赛。初赛与决赛均为积分制。"
            value={stageInfo}
            onChange={(e) => setStageInfo(e.target.value)}
            maxLength={400}
            disabled={isProcessing}
            required
          />
          <Textarea
            variant="faded"
            label="请填写队伍信息"
            labelPlacement="outside"
            placeholder="如果为个人赛无需填写，例：&#10;战队组成上，三人作为“讲述者（普通位）”，一人作为“创想家（抗压位）”&#10;队伍名：紧集授课，队伍ID：ET，队长棋棋Steins，队员我长颈鹿懂了、风前舆论汤、CSZDCR，其中CSZDCR为创想家"
            value={teamInfo}
            onChange={(e) => setTeamInfo(e.target.value)}
            maxLength={800}
            disabled={isProcessing}
          />
          <Textarea
            variant="faded"
            label="请填写比赛信息"
            labelPlacement="outside"
            placeholder="如果已有整理好的表格，将表格内容复制为文字粘贴到此处即可，例：&#10;队员                 | 分队          | 基础结算分  | 总分  | 结局&#10;棋棋Steins       | 远程战术   | 2313            | 3808  | 朝谒+授法&#10;我长颈鹿懂了   | 破坏战术   | 352              | 432   | 无（死于紧急假想对冲）&#10;风前舆论汤      | 突击战术   | 2127            | 3622  | 朝谒+授法&#10;CSZDCR          | 点刺成锭   | 2212            | 3102  | 紧急授课（死于授法）"
            value={gameInfo}
            onChange={(e) => setGameInfo(e.target.value)}
            maxLength={3000}
            disabled={isProcessing}
            required
          />
        </ModalBody>
        <ModalFooter>
          <Button onPress={onClose} disabled={isProcessing}>
            取消
          </Button>
          <Button onPress={onConfirm} disabled={isProcessing}>
            确定
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
