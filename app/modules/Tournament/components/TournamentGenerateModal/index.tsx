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
import { useSearchParams } from "react-router";
import { toast } from "react-toastify";
import { useSmartAutoScroll } from "~/hooks/useSmartAutoScroll";
import { type TournamentData } from "~/types/tournamentsData";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";

export default function TournamentGenerateModal({
  name,
  isOpen,
  onConfirm,
  onClose,
}: {
  name: string;
  isOpen: boolean;
  onConfirm: (tournamentData: TournamentData) => void;
  onClose: () => void;
}) {
  const [searchParams] = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);
  const [thinkingContent, setThinkingContent] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [tournamentData, setTournamentData] = useState<TournamentData>();
  const [stageInfo, setStageInfo] = useState<string>("");
  const [teamInfo, setTeamInfo] = useState<string>("");
  const [gameInfo, setGameInfo] = useState<string>("");
  const [additionalInfo, setAdditionalInfo] = useState<string>("");

  const handleSubmit = async () => {
    if (tournamentData) {
      return onConfirm(tournamentData);
    }

    // 请求用户授权
    let permission = "denied";
    if ("Notification" in window) {
      permission = await Notification.requestPermission();
    }

    setIsProcessing(true);
    setThinkingContent("");

    try {
      const res = await fetch(`${apiBaseUrl}/tournament/llm-generate-stream`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          stageInfo,
          teamInfo,
          gameInfo,
        }),
      });
      if (!res.ok) {
        toast.error("生成失败，请稍后重试");
        return;
      }
      const reader = res.body?.getReader();
      if (!reader) {
        toast.error("无法读取响应流");
        return;
      }
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const payload = JSON.parse(line.slice(6)) as {
                type: string;
                data: string;
              };
              if (payload.type === "thinking") {
                setThinkingContent((prev) => prev + (payload.data ?? ""));
              } else if (payload.type === "message") {
                setMessageContent((prev) => prev + (payload.data ?? ""));
              } else if (payload.type === "tournamentData") {
                const parsed = JSON.parse(payload.data ?? "{}");
                console.log("TournamentData", parsed);
                setTournamentData(parsed);
                return;
              } else if (payload.type === "error") {
                toast.error(payload.data ?? "生成失败");
                return;
              }
            } catch {
              // skip malformed lines
            }
          }
        }
      }
      toast.error("未收到完整数据");
    } catch (err) {
      toast.error((err as Error).message ?? "生成失败，请稍后重试");
    } finally {
      setIsProcessing(false);

      // 创建并显示通知
      if (permission === "granted") {
        new Notification("影语集", {
          body: "赛事生成任务已完成，请返回查看",
          icon: "https://arkrog.com/favicon.ico",
        });
      }
    }
  };

  const { containerRef: modalBodyRef } = useSmartAutoScroll<HTMLDivElement>([
    thinkingContent,
    messageContent,
  ]);
  const { containerRef: thinkingRef } = useSmartAutoScroll<HTMLPreElement>([
    thinkingContent,
  ]);
  const { containerRef: messageRef } = useSmartAutoScroll<HTMLPreElement>([
    messageContent,
  ]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="4xl"
      isDismissable={false}
      scrollBehavior="inside"
      classNames={{
        base: "max-h-[100vh] !my-0",
        body: "px-0",
      }}
    >
      <ModalContent>
        <ModalHeader>
          <h1>智能生成</h1>
        </ModalHeader>
        <ModalBody>
          <div
            className="flex flex-1 flex-col gap-3 px-6 overflow-y-auto min-h-0 hide-scroll"
            ref={modalBodyRef}
          >
            <p>
              本工具将引导用户基于非结构化的赛事信息，使用AI工具自动生成赛事数据。
              <br />
              任务提交后，生成时间约
              <strong>5分钟</strong>
              ，期间可以访问其他页面，但
              <strong className="text-ak-red">不要关闭浏览器</strong>。
              <br />
              注意，目前仅适用于覆盖式全量录入，不能在已有赛事基础上进行更新。
              <br />
              提交的信息可以不使用书面化表达，但请确保描述准确且覆盖所有必要内容。
              <br />
              图片内容无法直接识别，请使用DS、千问、豆包等工具识别内容后传入
              <br />
              表格内容可以使用
              <a
                className="text-ak-blue mx-1"
                href="https://tableconvert.com/zh-cn/excel-to-markdown"
                target="_blank"
                rel="noopener noreferrer"
              >
                在线工具
              </a>
              转换为Markdown格式传入
              <br />
              部分表单字段难以自动生成，且AI工具并不能保证结果的完全正确，因此
              <strong className="text-ak-red">
                生成的信息需要经过人工核查
              </strong>
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
            <Textarea
              variant="faded"
              label="请填写额外需求"
              labelPlacement="outside"
              placeholder="如有需要AI额外补充的内容，请在此处填写，例：&#10;请记录每场比赛的比赛时长（如有）"
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              maxLength={3000}
              disabled={isProcessing}
            />
            {thinkingContent && (
              <div className="mt-4">
                <p className="text-sm font-medium text-[#ecedee] pb-[6px]">
                  思考过程
                </p>
                <pre
                  ref={thinkingRef}
                  className="text-xs text-[rgb(236, 237, 238)] bg-default-100 rounded p-3 max-h-[80vh] overflow-y-auto whitespace-pre-wrap"
                >
                  {thinkingContent || "..."}
                </pre>
              </div>
            )}
            {messageContent && (
              <div className="mt-4">
                <p className="text-sm font-medium text-[#ecedee] pb-[6px]">
                  生成结果
                </p>
                <pre
                  ref={messageRef}
                  className="text-xs text-default-600 bg-default-100 rounded p-3 max-h-[80vh] overflow-y-auto whitespace-pre-wrap"
                >
                  {messageContent || "..."}
                </pre>
              </div>
            )}
            {tournamentData && (
              <div className="mt-4">
                智能生成流程结束，请点击确定应用到当前赛事
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button onPress={onClose} disabled={isProcessing}>
            取消
          </Button>
          <Button
            className={tournamentData ? "bg-ak-blue text-black" : ""}
            onPress={handleSubmit}
            disabled={isProcessing}
          >
            确定
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
